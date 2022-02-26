package internal

import (
	"encoding/json"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path"
	"path/filepath"
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

func HandleUpload(config *Config) func(http.Handler) http.Handler {
	public := config.Public

	saveFile := func(rawPlace string, rawFilename string, part *multipart.Part) error {
		uploadPath, err := GetFullPath(public, rawPlace)
		if err != nil {
			return errors.New("incorrect place")
		}

		rTarget, err := GetRelativePath(public, path.Join(rawPlace, rawFilename))
		if err != nil {
			return errors.New("incorrect filename")
		}

		isWritable := config.IsWritable(rTarget, false)
		if !isWritable {
			return errors.New("unable wite in this place")
		}

		target := filepath.Join(public, rTarget)

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

					var rTargetPath string
					if err == nil {
						rawPlace := payload.Place
						rawName := payload.Name
						rTargetPath, err = GetRelativePath(public, path.Join(rawPlace, rawName))
					}

					if err == nil {
						isDir := payload.IsDir
						isWritable := config.IsWritable(rTargetPath, false)
						if isWritable {
							targetPath := filepath.Join(public, rTargetPath)
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
