package internal

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"goHfs/assets"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
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
	salt := config.Salt

	chunkSize := 16 * 1024 * 1024

	type UploadInitPayload struct {
		FileName string `json:"fileName"`
		Size     int64  `json:"size"`
		Place    string `json:"place"`
	}

	type UploadInit struct {
		Key       string `json:"key"`
		ChunkSize int    `json:"chunkSize"`
	}

	type UploadFinishPayload struct {
		Key string `json:"key"`
	}

	type Key struct {
		FileName    string `json:"fileName"`
		Size        int64  `json:"size"`
		Place       string `json:"place"`
		TmpFileName string `json:"tmpFileName"`
	}

	getHash := func(json string, salt string, time string) string {
		hashBytes := sha256.Sum256([]byte(time + json + salt))
		return hex.EncodeToString(hashBytes[:])[0:7]
	}

	buildKey := func(rawFilename string, size int64, rawPlace string, tmpFile *os.File) (string, error) {
		key := Key{
			FileName:    rawFilename,
			Size:        size,
			Place:       rawPlace,
			TmpFileName: filepath.Base(tmpFile.Name()),
		}

		keyJsonByte, err := json.Marshal(key)
		if err != nil {
			return "", err
		}
		keyJson := string(keyJsonByte)
		time := strconv.FormatInt(time.Now().Unix(), 10)

		hash := getHash(keyJson, salt, time)

		sigKey := time + ":" + hash + ":" + string(keyJson)

		return sigKey, nil
	}

	readKey := func(sigKey string) (*Key, error) {
		sepPos := strings.Index(sigKey, ":")
		if sepPos == -1 {
			return nil, errors.New("Incorrect_key")
		}

		time := sigKey[0:sepPos]
		sigKey = sigKey[sepPos+1:]

		sepPos = strings.Index(sigKey, ":")
		if sepPos == -1 {
			return nil, errors.New("Incorrect_key")
		}

		sig := sigKey[0:sepPos]
		keyJson := sigKey[sepPos+1:]
		hash := getHash(keyJson, salt, time)

		if hash != sig {
			return nil, errors.New("Incorrect_signature")
		}

		decoder := json.NewDecoder(strings.NewReader(keyJson))

		var payload Key
		err := decoder.Decode(&payload)
		if err != nil {
			return nil, err
		}

		return &payload, nil
	}

	readAsString := func(part *multipart.Part) (string, error) {
		buf := new(strings.Builder)
		_, err := io.Copy(buf, part)
		if err != nil {
			return "", err
		}
		return buf.String(), nil
	}

	saveChunk := func(sigKey string, rawPos string, rawSize string, part *multipart.Part) error {
		key, err := readKey(sigKey)
		if err != nil {
			return err
		}

		pos, err := strconv.ParseInt(rawPos, 10, 64)
		if err != nil {
			return err
		}

		size, err := strconv.ParseInt(rawSize, 10, 64)
		if err != nil {
			return err
		}

		rawPlace := key.Place
		rawTmpFileName := key.TmpFileName

		osTmpFilePath, err := GetFullPath(public, path.Join(rawPlace, rawTmpFileName))
		if err != nil {
			return err
		}

		tmpFile, err := os.OpenFile(osTmpFilePath, os.O_WRONLY, 0600)
		if err != nil {
			return err
		}
		defer tmpFile.Close()

		_, err = tmpFile.Seek(pos, 0)
		if err != nil {
			return err
		}

		written, err := io.Copy(tmpFile, part)
		if err != nil {
			return err
		}

		if written != size {
			return errors.New("written_size_missmatch")
		}

		return nil
	}

	return func(next http.Handler) http.Handler {
		fn := func(writer http.ResponseWriter, request *http.Request) {
			if request.Method == "POST" {
				var result interface{}
				var err error
				isMatch := false
				if request.URL.Path == "/~/uploadInit" {
					isMatch = true
					err = func() error {
						decoder := json.NewDecoder(request.Body)
						var payload UploadInitPayload
						err = decoder.Decode(&payload)
						if err != nil {
							return err
						}

						rawPlace := payload.Place
						rawFilename := payload.FileName
						size := payload.Size

						osUploadPath, err := GetFullPath(public, rawPlace)
						if err != nil {
							return errors.New("incorrect place")
						}

						filePath := NormalizePath(path.Join(rawPlace, rawFilename))

						isWritable := config.IsWritable(filePath, false)
						if !isWritable {
							return errors.New("unable wite in this place")
						}

						var osFilePath string
						osFilePath, err = GetFullPath(public, filePath)
						if err != nil {
							return err
						}

						_, err = os.Stat(osFilePath)
						if err == nil {
							return errors.New("File exists")
						}

						var tmpFile *os.File
						tmpFile, err = os.CreateTemp(osUploadPath, "tmp")
						if err != nil {
							return errors.New("Create temp file error: " + err.Error())
						}
						defer tmpFile.Close()

						// tmpFile.Truncate(size)

						keyJson, err := buildKey(rawFilename, size, rawPlace, tmpFile)
						if err != nil {
							return err
						}

						result = UploadInit{
							Key:       keyJson,
							ChunkSize: chunkSize,
						}
						return nil
					}()
				} else if request.URL.Path == "/~/uploadChunk" {
					isMatch = true
					reader, err := request.MultipartReader()

					var sigKey string
					var rawPos string
					var rawSize string

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

						formName := part.FormName()
						switch formName {
						case "key":
							sigKey, err = readAsString(part)
						case "pos":
							rawPos, err = readAsString(part)
						case "size":
							rawSize, err = readAsString(part)
						case "chunk":
							err = saveChunk(sigKey, rawPos, rawSize, part)
						}
					}
				} else if request.URL.Path == "/~/uploadFinish" {
					isMatch = true
					err = func() error {
						decoder := json.NewDecoder(request.Body)
						var payload UploadFinishPayload
						err = decoder.Decode(&payload)
						if err != nil {
							return err
						}

						key, err := readKey(payload.Key)
						if err != nil {
							return err
						}

						rawPlace := key.Place
						rawTmpFileName := key.TmpFileName
						rawFilename := key.FileName

						osTmpFilePath, err := GetFullPath(public, path.Join(rawPlace, rawTmpFileName))
						if err != nil {
							return err
						}

						osFilePath, err := GetFullPath(public, path.Join(rawPlace, rawFilename))
						if err != nil {
							return err
						}

						err = os.Rename(osTmpFilePath, osFilePath)
						if err != nil {
							return errors.New("Rename temp file error: " + err.Error())
						}

						return nil
					}()
				}

				if isMatch {
					err = writeApiResult(writer, result, err)
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
