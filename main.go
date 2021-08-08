package main

import (
	"fmt"
	"github.com/go-pkgz/rest"
	"goHfs/internal"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"runtime"
)

func main() {
	if _, err := internal.CreateMutex("GoHFS"); err != nil {
		panic(err)
	}

	callChan := make(chan string)

	var config = internal.LoadConfig()

	var powerControl *internal.PowerControl
	if runtime.GOOS == "windows" {
		powerControl = internal.GetPowerControl()
	}

	internal.TrayIcon(&config, callChan)

	go func() {
		callChan <- "restartServer"
	}()

	var httpServer *http.Server

	for {
		v := <-callChan
		fmt.Println("callChan", v)

		switch v {
		case "restartServer":
			if httpServer != nil {
				httpServer.Close()
			}

			handler := rest.Wrap(
				fsServer(config.Public),
				powerLock(powerControl),
				handleDir(config.Public),
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
		case "reloadConfig":
			config = internal.LoadConfig()
		}
	}
}

func handleDir(public string) func(http.Handler) http.Handler {
	fileIndex := internal.GetFileIndex(public)

	return func(next http.Handler) http.Handler {
		fn := func(writer http.ResponseWriter, request *http.Request) {
			if request.Method == "GET" {
				uri, err := url.QueryUnescape(request.RequestURI)
				if err != nil {
					writer.WriteHeader(403)
					return
				}

				path := filepath.Join(public, filepath.Clean(uri))
				stat, err := os.Stat(path)
				if err != nil {
					if os.IsNotExist(err) {
						writer.WriteHeader(404)
					} else {
						writer.WriteHeader(403)
					}
					return
				}

				if stat.IsDir() {
					if uri[len(uri)-1:] != "/" {
						writer.Header().Set("Location", uri+"/")
						writer.WriteHeader(301)
						return
					}

					_, err := io.WriteString(writer, fileIndex(uri, path))
					if err != nil {
						panic(err)
					}
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

func fsServer(public string) http.Handler {
	return http.FileServer(http.Dir(public))
}
