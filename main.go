package main

import (
	"fmt"
	"goHfs/internal"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/go-pkgz/rest"
)

func main() {
	if _, err := internal.CreateMutex("GoHFS"); err != nil {
		panic(err)
	}

	var config internal.Config

	var powerControl = internal.GetPowerControl()

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
					handleUpload(&config),
					handleDir(config.Public, config.ShowHiddenFiles),
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

func handleUpload(config *internal.Config) func(http.Handler) http.Handler {
	uploadPath := config.Public

	return func(next http.Handler) http.Handler {
		fn := func(writer http.ResponseWriter, request *http.Request) {
			if request.Method == "POST" && request.URL.Path == "/~/upload" {
				reader, err := request.MultipartReader()
				if err != nil {
					log.Println("MultipartReader error", err)
					writer.WriteHeader(500)
					return
				}

				var tmpFile *os.File
				for {
					part, err := reader.NextPart()
					if err == io.EOF {
						break
					}

					filename := part.FileName()

					tmpFile, err = os.CreateTemp(uploadPath, "tmp")
					if err != nil {
						log.Println("Create error", err)
						writer.WriteHeader(500)
						return
					}
					defer tmpFile.Close()

					_, err = io.Copy(tmpFile, part)
					if err != nil {
						log.Println("Copy error", err)
						writer.WriteHeader(500)
						return
					}

					source := tmpFile.Name()
					target := filepath.Join(uploadPath, filepath.Clean(filename))

					_, err = os.Lstat(target)
					if err == nil {
						log.Println("Lstat exists")
						writer.WriteHeader(500)
						return
					}

					err = os.Rename(source, target)
					if err != nil {
						log.Println("Rename error", err)
						writer.WriteHeader(500)
						return
					}
				}
				writer.WriteHeader(200)
				return
			}

			next.ServeHTTP(writer, request)
		}
		return http.HandlerFunc(fn)
	}
}

func handleDir(public string, showHiddenFiles bool) func(http.Handler) http.Handler {
	fileIndex := internal.GetFileIndex(public, showHiddenFiles)

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
