package main

import (
	"flag"
	"fmt"
	"goHfs/internal"
	"log"
	"net/http"
	"os"
)

var DEBUG_UI = os.Getenv("DEBUG_UI") == "1"

func main() {
	if _, err := internal.CreateMutex("GoHFS"); err != nil {
		panic(err)
	}

	var config internal.Config

	var powerControl = internal.GetPowerControl()

	internal.MigrateStorage(internal.GetLegacyStoragePath(), internal.GetStoragePath())

	storage := internal.GetStorage(internal.GetStoragePath())

	callChan := make(chan string)

	doReload := func() {
		callChan <- "reload"
	}

	go func() {
		var httpServer *http.Server

		go doReload()

		for {
			v := <-callChan
			fmt.Println("callChan", v)

			switch v {
			case "reload":
				config = internal.LoadConfig()

				if httpServer != nil {
					httpServer.Close()
				}

				router := internal.NewRouter()

				powerLock(router, powerControl)
				internal.HandleApi(router, &config, storage, DEBUG_UI, doReload)
				internal.HandleDir(router, &config, storage, DEBUG_UI)

				for _, l := range config.Links {
					link := l
					fsServer(router, &config, &link)
				}
				fsServer(router, &config, nil)

				address := config.GetAddress()

				log.Printf("Listening on %s...", address)
				httpServer = &http.Server{
					Addr:    address,
					Handler: router,
				}

				go func() {
					err := httpServer.ListenAndServe()
					if err != nil {
						log.Println("Server error", err)
					}
				}()
			}
		}
	}()

	disableTrayIconPtr := flag.Bool("disableTrayIcon", false, "Disable tray icon")
	flag.Parse()

	if !*disableTrayIconPtr {
		internal.TrayIcon(&config, callChan)
	} else {
		loopChan := make(chan string)
		<-loopChan
	}
}

func powerLock(router *internal.Router, powerControl *internal.PowerControl) {
	router.Use(func(w http.ResponseWriter, r *http.Request, next internal.RouteNextFn) {
		if powerControl != nil {
			powerControl.Inc()
			defer powerControl.Dec()
		}
		next()
	})
}

func fsServer(router *internal.Router, config *internal.Config, link *internal.Link) {
	public := config.Public
	rootPlace := ""
	routePath := ""
	if link != nil {
		public = link.Target
		rootPlace = link.Place
		routePath = "^" + rootPlace + "/"
	}

	info, err := os.Stat(public)
	if err != nil {
		log.Printf("Skip path (%s), cause: %s", public, err)
		return
	}
	isDir := info.IsDir()

	if isDir {
		fileServer := http.FileServer(http.Dir(public))

		subRouter := internal.NewRouter()
		subRouter.All("/index.html$", func(w http.ResponseWriter, r *http.Request, next internal.RouteNextFn) {
			place := internal.NormalizePath(r.URL.Path)
			osFullPath, err := internal.GetFullPath(public, place)
			if err != nil {
				w.WriteHeader(403)
				return
			}

			http.ServeFile(w, r, osFullPath)
		})
		subRouter.Use(func(w http.ResponseWriter, r *http.Request, next internal.RouteNextFn) {
			fileServer.ServeHTTP(w, r)
		})

		router.All(routePath, func(w http.ResponseWriter, r *http.Request, next internal.RouteNextFn) {
			r.URL.Path = r.URL.Path[len(rootPlace):]
			subRouter.ServeHTTP(w, r)
		})
	} else {
		router.All(rootPlace, func(w http.ResponseWriter, r *http.Request, next internal.RouteNextFn) {
			http.ServeFile(w, r, public)
		})
	}
}
