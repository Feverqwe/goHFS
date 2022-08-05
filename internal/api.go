package internal

import (
	"bytes"
	"encoding/json"
	"errors"
	"goHfs/assets"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path"
	"time"

	"github.com/NYTimes/gziphandler"
	"github.com/go-pkgz/rest"
)

type UploadResultItem struct {
	Ok       bool   `json:"ok"`
	Filename string `json:"filename"`
	Error    string `json:"error"`
}

type JsonFailResponse struct {
	Error string `json:"error"`
}

type JsonSuccessResponse struct {
	Result interface{} `json:"result"`
}

func HandleApi(config *Config, storage *Storage) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		fn := func(writer http.ResponseWriter, request *http.Request) {
			if len(request.URL.Path) > 3 && request.URL.Path[0:3] == "/~/" {
				gziphandler.GzipHandler(rest.Wrap(
					handleFobidden(),
					handleWww(),
					handleUpload(config),
					handleStorage(storage),
					handleInterfaces(config),
					handleAction(config),
				)).ServeHTTP(writer, request)
				return
			}

			next.ServeHTTP(writer, request)
		}
		return http.HandlerFunc(fn)
	}
}

func handleFobidden() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(403)
	})
}

func handleUpload(config *Config) func(http.Handler) http.Handler {
	public := config.Public

	saveFile := func(rawPlace string, rawFilename string, part *multipart.Part) error {
		uploadPath, err := GetFullPath(public, rawPlace)
		if err != nil {
			return errors.New("incorrect place")
		}

		rTarget := NormalizePath(path.Join(rawPlace, rawFilename))

		isWritable := config.IsWritable(rTarget, false)
		if !isWritable {
			return errors.New("unable wite in this place")
		}

		var target string
		target, err = GetFullPath(public, rTarget)
		if err != nil {
			return err
		}

		_, err = os.Stat(target)
		if err == nil {
			return errors.New("File exists")
		}

		var tmpFile *os.File
		tmpFile, err = os.CreateTemp(uploadPath, "tmp")
		source := tmpFile.Name()
		if err != nil {
			return errors.New("Create temp file error: " + err.Error())
		}
		defer tmpFile.Close()

		_, err = io.Copy(tmpFile, part)
		if err != nil {
			os.Remove(source)
			return errors.New("Write temp file error: " + err.Error())
		}

		err = os.Rename(source, target)
		if err != nil {
			return errors.New("Rename temp file error: " + err.Error())
		}

		return err
	}

	getFileResult := func(filename string, err error) UploadResultItem {
		ok := err == nil
		var errStr string
		if err != nil {
			errStr = err.Error()
		}
		return UploadResultItem{
			Ok:       ok,
			Filename: filename,
			Error:    errStr,
		}
	}

	return func(next http.Handler) http.Handler {
		fn := func(writer http.ResponseWriter, request *http.Request) {
			if request.Method == "POST" && request.URL.Path == "/~/upload" {
				reader, err := request.MultipartReader()

				rawPlace := request.URL.Query().Get("place")

				var results []UploadResultItem = make([]UploadResultItem, 0)

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
					if err != nil {
						break
					}

					filename := part.FileName()

					saveErr := saveFile(rawPlace, filename, part)
					results = append(results, getFileResult(filename, saveErr))
				}

				err = writeApiResult(writer, results, err)
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

func handleInterfaces(config *Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		fn := func(writer http.ResponseWriter, request *http.Request) {
			if request.Method == "GET" && request.URL.Path == "/~/addresses" {
				addresses := GetAddresses(config.Port)
				err := writeApiResult(writer, addresses, nil)
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

func handleStorage(storage *Storage) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		fn := func(writer http.ResponseWriter, request *http.Request) {
			if request.Method == "POST" {
				if request.URL.Path == "/~/storage/get" {
					decoder := json.NewDecoder(request.Body)
					var keys []string
					err := decoder.Decode(&keys)
					var result interface{}
					if err == nil {
						result = storage.GetKeys(keys)
					}
					err = writeApiResult(writer, result, err)
					if err != nil {
						panic(err)
					}
					return
				}
				if request.URL.Path == "/~/storage/set" {
					decoder := json.NewDecoder(request.Body)
					var keyValue map[string]interface{}
					err := decoder.Decode(&keyValue)
					if err == nil {
						err = storage.SetObject(keyValue)
					}
					err = writeApiResult(writer, "ok", err)
					if err != nil {
						panic(err)
					}
					return
				}
				if request.URL.Path == "/~/storage/del" {
					decoder := json.NewDecoder(request.Body)
					var keys []string
					err := decoder.Decode(&keys)
					if err == nil {
						err = storage.DelKeys(keys)
					}
					err = writeApiResult(writer, "ok", err)
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

func handleAction(config *Config) func(http.Handler) http.Handler {
	public := config.Public

	type RemovePayload struct {
		Place string `json:"place"`
		Name  string `json:"name"`
		IsDir bool   `json:"isDir"`
	}

	type RenamePayload struct {
		Place   string `json:"place"`
		Name    string `json:"name"`
		NewName string `json:"newName"`
	}

	return func(next http.Handler) http.Handler {
		fn := func(writer http.ResponseWriter, request *http.Request) {
			if request.Method == "POST" {
				if request.URL.Path == "/~/rename" {
					decoder := json.NewDecoder(request.Body)

					var payload RenamePayload
					err := decoder.Decode(&payload)

					var rTargetPath string
					var rNewPath string
					var rawPlace = payload.Place
					var targetPath string
					var newPath string
					if err == nil {
						rawName := payload.Name
						rawNewName := payload.NewName
						rTargetPath = NormalizePath(path.Join(rawPlace, rawName))
						rNewPath = NormalizePath(path.Join(rawPlace, rawNewName))

						targetPath, err = GetFullPath(public, rTargetPath)
						if err == nil {
							newPath, err = GetFullPath(public, rNewPath)
						}
					}

					if err == nil {
						isWritableSource := config.IsWritable(rTargetPath, false)
						isWritableTarget := config.IsWritable(rNewPath, false)
						if isWritableSource && isWritableTarget {
							err = os.Rename(targetPath, newPath)
						} else {
							err = errors.New("place is not writable")
						}
					}
					err = writeApiResult(writer, "ok", err)
					if err != nil {
						panic(err)
					}
					return
				}
				if request.URL.Path == "/~/remove" {
					decoder := json.NewDecoder(request.Body)

					var payload RemovePayload
					err := decoder.Decode(&payload)

					var rTargetPath string
					var targetPath string
					if err == nil {
						rawPlace := payload.Place
						rawName := payload.Name
						rTargetPath = NormalizePath(path.Join(rawPlace, rawName))
						targetPath, err = GetFullPath(public, rTargetPath)
					}

					if err == nil {
						isDir := payload.IsDir
						isWritable := config.IsWritable(rTargetPath, false)
						if isWritable {
							if isDir {
								err = os.RemoveAll(targetPath)
							} else {
								err = os.Remove(targetPath)
							}
						} else {
							err = errors.New("place is not writable")
						}
					}
					err = writeApiResult(writer, "ok", err)
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

func handleWww() func(http.Handler) http.Handler {
	binTime := time.Now()
	if binPath, err := os.Executable(); err == nil {
		if binStat, err := os.Stat(binPath); err == nil {
			binTime = binStat.ModTime()
		}
	}

	return func(next http.Handler) http.Handler {
		fn := func(writer http.ResponseWriter, request *http.Request) {
			if (request.Method == "GET" || request.Method == "HEAD") && len(request.URL.Path) > 7 && request.URL.Path[0:7] == "/~/www/" {
				assetPath := request.URL.Path[3:]

				content, err := assets.Asset(assetPath)
				if err != nil {
					writer.WriteHeader(404)
					return
				}

				reader := bytes.NewReader(content)
				name := path.Base(assetPath)
				http.ServeContent(writer, request, name, binTime, reader)
				return
			}

			next.ServeHTTP(writer, request)
		}
		return http.HandlerFunc(fn)
	}
}

func writeApiResult(writer http.ResponseWriter, result interface{}, err error) error {
	var statusCode int
	var body interface{}
	if err != nil {
		statusCode = 500
		body = JsonFailResponse{
			Error: err.Error(),
		}
	} else {
		statusCode = 200
		body = JsonSuccessResponse{
			Result: result,
		}
	}
	json, err := json.Marshal(body)
	if err == nil {
		writer.Header().Set("Content-Type", "application/json")
		writer.WriteHeader(statusCode)
		_, err = writer.Write(json)
	}
	return err
}
