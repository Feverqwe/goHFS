package main

import (
	"context"
	"flag"
	"fmt"
	"goHfs/internal"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/NYTimes/gziphandler"
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
				handleDir(router, &config)
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

func handleDir(router *internal.Router, config *internal.Config) {
	public := config.Public
	fileIndex := internal.GetFileIndex(config)

	type contextType string
	const contentKey contextType = "content"

	gzipHandler := gziphandler.GzipHandler(http.HandlerFunc(func(writer http.ResponseWriter, r *http.Request) {
		content := r.Context().Value(contentKey).(string)
		reader := strings.NewReader(content)

		http.ServeContent(writer, r, "index.html", time.Now(), reader)
	}))

	router.Custom([]string{http.MethodGet, http.MethodHead}, []string{}, func(w http.ResponseWriter, r *http.Request, next internal.RouteNextFn) {
		urlPath := r.URL.Path

		fullPath, err := internal.GetFullPath(public, urlPath)
		if err != nil {
			w.WriteHeader(403)
			return
		}

		file, stat, err := internal.OpenFile(fullPath)
		if err != nil {
			internal.HandleOpenFileError(err, w)
			return
		}

		if stat.IsDir() {
			content := fileIndex(urlPath, fullPath, file)
			ctx := context.WithValue(r.Context(), contentKey, content)
			r := r.WithContext(ctx)

			gzipHandler.ServeHTTP(w, r)
			return
		}

		next()
	})
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

		http.ServeContent(writer, request, "index.html", stat.ModTime(), file)
	})
}

func fsServer(router *internal.Router, config *internal.Config) {
	router.Use(func(w http.ResponseWriter, r *http.Request, n internal.RouteNextFn) {
		http.FileServer(http.Dir(config.Public)).ServeHTTP(w, r)
	})
}
