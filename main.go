package main

import (
	"flag"
	"fmt"
	"goHfs/internal"
	"log"
	"net/http"
)

func main() {
	if _, err := internal.CreateMutex("GoHFS"); err != nil {
		panic(err)
	}

	var config internal.Config

	var powerControl = internal.GetPowerControl()

	storage := internal.GetStorage()

	callChan := make(chan string)

	go func() {
		var httpServer *http.Server

		go func() {
			callChan <- "reload"
		}()

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
				internal.HandleApi(router, &config, storage)
				internal.HandleDir(router, &config)
				handleIndex(router, &config)
				fsServer(router, &config)

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

func handleIndex(router *internal.Router, config *internal.Config) {
	public := config.Public

	router.All("/index.html$", func(writer http.ResponseWriter, request *http.Request, n internal.RouteNextFn) {
		fullPath, err := internal.GetFullPath(public, request.URL.Path)
		if err != nil {
			writer.WriteHeader(403)
			return
		}

		file, stat, err := internal.OpenFile(fullPath)
		if err != nil {
			internal.HandleOpenFileError(err, writer)
			return
		}
		defer file.Close()

		http.ServeContent(writer, request, "index.html", stat.ModTime(), file)
	})
}

func fsServer(router *internal.Router, config *internal.Config) {
	router.Use(func(w http.ResponseWriter, r *http.Request, n internal.RouteNextFn) {
		http.FileServer(http.Dir(config.Public)).ServeHTTP(w, r)
	})
}
