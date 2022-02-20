package internal

import (
	"encoding/json"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
)

type UploadFailResult struct {
	Error string   `json:"error"`
	Files []string `json:"files"`
}

type UploadSuccessResult struct {
	Result string   `json:"result"`
	Files  []string `json:"files"`
}

type FailJsonResult struct {
	Error string `json:"error"`
}

type SuccessJsonResult struct {
	Result interface{} `json:"result"`
}

func HandleUpload(config *Config) func(http.Handler) http.Handler {
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

func HandleInterfaces(config *Config) func(http.Handler) http.Handler {
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

func HandleStorage(storage *Storage) func(http.Handler) http.Handler {
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

func HandleAction(config *Config) func(http.Handler) http.Handler {
	public := config.Public

	type RemovePayload struct {
		Place string `json:"place"`
		Name  string `json:"name"`
		IsDir bool   `json:"isDir"`
	}

	return func(next http.Handler) http.Handler {
		fn := func(writer http.ResponseWriter, request *http.Request) {
			if request.Method == "POST" {
				if request.URL.Path == "/~/remove" {
					decoder := json.NewDecoder(request.Body)

					var payload RemovePayload
					err := decoder.Decode(&payload)
					if err == nil {
						relativePath := payload.Place
						path := filepath.Join(public, filepath.Clean(relativePath))
						name := filepath.Clean(payload.Name)
						isDir := payload.IsDir
						isRemovable := config.IsRemovable(relativePath)
						if isRemovable {
							targetPath := filepath.Join(path, name)
							if isDir {
								err = os.RemoveAll(targetPath)
							} else {
								err = os.Remove(targetPath)
							}
						} else {
							err = errors.New("file is not removable")
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

func writeApiResult(writer http.ResponseWriter, result interface{}, err error) error {
	var statusCode int
	var body interface{}
	if err != nil {
		statusCode = 500
		body = FailJsonResult{
			Error: err.Error(),
		}
	} else {
		statusCode = 200
		body = SuccessJsonResult{
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
