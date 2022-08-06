package main

import (
	"bytes"
	"flag"
	"fmt"
	"goHfs/internal"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-pkgz/rest"
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

				handler := rest.Wrap(
					fsServer(&config),
					handleIndex(&config),
					internal.HandleApi(&config, storage),
					powerLock(powerControl),
					handleDir(&config),
				)

				address := config.GetAddress()

				log.Printf("Listening on %s...", address)
				httpServer = &http.Server{
					Addr:    address,
					Handler: handler,
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

func handleDir(config *internal.Config) func(http.Handler) http.Handler {
	public := config.Public
	fileIndex := internal.GetFileIndex(config)

	return internal.GetHandler(func(writer http.ResponseWriter, request *http.Request, next http.Handler) {
		if request.Method == "GET" || request.Method == "HEAD" {
			urlPath := request.URL.Path

			fullPath, err := internal.GetFullPath(public, urlPath)
			if err != nil {
				writer.WriteHeader(403)
				return
			}

			file, stat, err := internal.OpenFile(fullPath)
			if err != nil {
				internal.HandleOpenFileError(err, writer)
				return
			}

			if stat.IsDir() {
				rest.Gzip("")(http.HandlerFunc(func(writer http.ResponseWriter, r *http.Request) {
					content := []byte(fileIndex(urlPath, fullPath, file))
					reader := bytes.NewReader(content)

					http.ServeContent(writer, request, "index.html", time.Now(), reader)
				})).ServeHTTP(writer, request)
				return
			}
		}

		next.ServeHTTP(writer, request)
	})
}

func powerLock(powerControl *internal.PowerControl) func(http.Handler) http.Handler {
	return internal.GetHandler(func(writer http.ResponseWriter, request *http.Request, next http.Handler) {
		if powerControl != nil {
			powerControl.Inc()
			defer powerControl.Dec()
		}
		next.ServeHTTP(writer, request)
	})
}

func handleIndex(config *internal.Config) func(http.Handler) http.Handler {
	public := config.Public

	return internal.GetHandler(func(writer http.ResponseWriter, request *http.Request, next http.Handler) {
		switch true {
		case strings.HasSuffix(request.URL.Path, "/index.html"):
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
		default:
			next.ServeHTTP(writer, request)
		}
	})
}

func fsServer(config *internal.Config) http.Handler {
	return http.FileServer(http.Dir(config.Public))
}
