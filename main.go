package main

import (
	"bytes"
	"flag"
	"fmt"
	"goHfs/internal"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/NYTimes/gziphandler"
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
					powerLock(powerControl),
					internal.HandleApi(&config, storage),
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
	root := config.Public
	fileIndex := internal.GetFileIndex(config)

	return func(next http.Handler) http.Handler {
		fn := func(writer http.ResponseWriter, request *http.Request) {
			if request.Method == "GET" || request.Method == "HEAD" {
				urlPath := request.URL.Path

				file, path, err := internal.OpenPath(root, urlPath)
				if err != nil {
					writer.WriteHeader(403)
					return
				}

				stat, err := file.Stat()
				if err != nil {
					if os.IsNotExist(err) {
						writer.WriteHeader(404)
					} else {
						writer.WriteHeader(403)
					}
					return
				}

				if stat.IsDir() {
					gziphandler.GzipHandler(http.HandlerFunc(func(writer http.ResponseWriter, r *http.Request) {
						if urlPath[len(urlPath)-1:] != "/" {
							writer.Header().Set("Location", urlPath+"/")
							writer.WriteHeader(301)
							return
						}

						content := []byte(fileIndex(urlPath, path, file))
						reader := bytes.NewReader(content)

						http.ServeContent(writer, request, "index.html", time.Now(), reader)
					})).ServeHTTP(writer, request)
					return
				}
			}

			next.ServeHTTP(writer, request)
		}
		return http.HandlerFunc(fn)
	}
}

func powerLock(powerControl *internal.PowerControl) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		fn := func(writer http.ResponseWriter, request *http.Request) {
			if powerControl != nil {
				powerControl.Inc()
				defer powerControl.Dec()
			}
			next.ServeHTTP(writer, request)
		}
		return http.HandlerFunc(fn)
	}
}

func fsServer(config *internal.Config) http.Handler {
	return http.FileServer(http.Dir(config.Public))
}
