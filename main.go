package main

import (
	"fmt"
	"github.com/go-pkgz/rest"
	"goHfs/internal"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
)

func main() {
	if runtime.GOOS == "windows" {
		if _, err := internal.CreateMutex("GoHFS"); err != nil {
			panic(err)
		}
	}

	var config internal.Config

	var powerControl *internal.PowerControl
	if runtime.GOOS == "windows" {
		powerControl = internal.GetPowerControl()
	}

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
			}
		}
	}()

	internal.TrayIcon(&config, callChan)
}

func handleDir(public string) func(http.Handler) http.Handler {
	fileIndex := internal.GetFileIndex(public)

	return func(next http.Handler) http.Handler {
		fn := func(writer http.ResponseWriter, request *http.Request) {
			if request.Method == "GET" {
				urlPath := request.URL.Path
				path := filepath.Join(public, filepath.Clean(urlPath))
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
					if urlPath[len(urlPath)-1:] != "/" {
						writer.Header().Set("Location", urlPath+"/")
						writer.WriteHeader(301)
						return
					}

					content := []byte(fileIndex(urlPath, path))
					writer.Header().Set("Content-Length", strconv.Itoa(len(content)))
					writer.Header().Set("Content-Type", "text/html; charset=UTF-8")
					_, err := writer.Write(content)
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
