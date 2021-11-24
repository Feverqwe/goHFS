package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"goHfs/internal"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/go-pkgz/rest"
)

type UploadFailResult struct {
	Error string   `json:"error"`
	Files []string `json:"files"`
}

type UploadSuccessResult struct {
	Result string   `json:"result"`
	Files  []string `json:"files"`
}

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
					fsServer(&config),
					powerLock(powerControl),
					handleUpload(&config),
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

	internal.TrayIcon(&config, callChan)
}

func handleUpload(config *internal.Config) func(http.Handler) http.Handler {
	uploadPath := config.Upload

	return func(next http.Handler) http.Handler {
		fn := func(writer http.ResponseWriter, request *http.Request) {
			if request.Method == "POST" && request.URL.Path == "/~/upload" {
				reader, err := request.MultipartReader()

				var files []string = make([]string, 0)
				for {
					if err != nil {
						break
					}

					var part *multipart.Part
					part, err = reader.NextPart()
					if err == io.EOF {
						err = nil
						break
					}

					filename := part.FileName()

					target := filepath.Join(uploadPath, filepath.Clean(filename))

					_, err = os.Stat(target)
					if err == nil {
						err = errors.New("File exists: " + filename)
						break
					}

					err = os.MkdirAll(uploadPath, os.ModePerm)
					if err != nil {
						err = errors.New("Create upload path error: " + err.Error())
						break
					}

					var tmpFile *os.File
					tmpFile, err = os.CreateTemp(uploadPath, "tmp")
					source := tmpFile.Name()
					if err != nil {
						err = errors.New("Create temp file error: " + err.Error())
						break
					}
					defer tmpFile.Close()

					_, err = io.Copy(tmpFile, part)
					if err != nil {
						os.Remove(source)
						err = errors.New("Write temp file error: " + err.Error())
						break
					}

					err = os.Rename(source, target)
					if err != nil {
						err = errors.New("Rename temp file error: " + err.Error())
						break
					}

					files = append(files, filename)
				}

				var result interface{}
				var statusCode int
				if err != nil {
					result = UploadFailResult{
						Error: err.Error(),
						Files: files,
					}
					statusCode = 500
				} else {
					result = UploadSuccessResult{
						Result: "ok",
						Files:  files,
					}
					statusCode = 200
				}

				json, err := json.Marshal(result)
				if err != nil {
					panic(err)
				}
				writer.Header().Set("Content-Type", "application/json")
				writer.WriteHeader(statusCode)
				_, err = writer.Write([]byte(string(json)))
				if err != nil {
					panic(err)
				}
				return
			}

			next.ServeHTTP(writer, request)
		}
		return http.HandlerFunc(fn)
	}
}

func handleDir(config *internal.Config) func(http.Handler) http.Handler {
	public := config.Public
	showHiddenFiles := config.ShowHiddenFiles
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

func fsServer(config *internal.Config) http.Handler {
	return http.FileServer(http.Dir(config.Public))
}
