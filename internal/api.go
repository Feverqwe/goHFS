package internal

import (
	"bytes"
	"encoding/json"
	"errors"
	"goHfs/assets"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/NYTimes/gziphandler"
	dirsize "github.com/bahelit/ctrl_plus_revise/pkg/dir_size"
	"github.com/shirou/gopsutil/v4/disk"
)

type JsonFailResponse struct {
	Error string `json:"error"`
}

type JsonSuccessResponse struct {
	Result interface{} `json:"result"`
}

func HandleApi(router *Router, config *Config, storage *Storage, debugUi bool, doReload func()) {
	apiRouter := NewRouter()
	gzipHandler := gziphandler.GzipHandler(apiRouter)

	handleUpload(apiRouter, config)
	handleWww(apiRouter, debugUi)
	handleStorage(apiRouter, storage)
	handleStore(apiRouter, config, storage)
	handleAction(apiRouter, config, doReload)
	handleInterfaces(apiRouter, config)
	handleDiskUsage(apiRouter, config)
	handleFobidden(apiRouter)

	router.All("^/~/", gzipHandler.ServeHTTP)
}

func handleFobidden(router *Router) {
	router.Use(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(403)
	})
}

func handleStore(router *Router, config *Config, storage *Storage) {
	router.Get("/~/getStore", func(w http.ResponseWriter, r *http.Request) {
		place := NormalizePath(r.URL.Query().Get("place"))

		osFullPath, err := config.GetPlaceOsPath(place)
		if err != nil {
			w.WriteHeader(403)
			return
		}

		stat, err := os.Stat(osFullPath)
		if err != nil {
			HandleOpenFileError(err, w)
			return
		}

		if !stat.IsDir() {
			w.WriteHeader(403)
			return
		}

		apiCall(w, func() (*RootStore, error) {
			store := GetIndexStore(config, storage, place, osFullPath)

			return store, nil
		})
	})
}

func handleUpload(router *Router, config *Config) {
	salt := config.Salt
	if len(salt) == 0 {
		salt = strconv.FormatInt(time.Now().Unix(), 10)
	}

	var chunkSize int64 = 16 * 1024 * 1024

	type UploadInitPayload struct {
		FileName string `json:"fileName"`
		Size     int64  `json:"size"`
		Place    string `json:"place"`
	}

	type UploadInit struct {
		Key       string `json:"key"`
		ChunkSize int64  `json:"chunkSize"`
	}

	type Key struct {
		FileName    string `json:"fileName"`
		Size        int64  `json:"size"`
		Place       string `json:"place"`
		TmpFileName string `json:"tmpFileName"`
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

		return SigData(keyJson, salt), nil
	}

	readKey := func(sigKey string) (*Key, error) {
		keyJson, err := UnSigData(sigKey, salt)
		if err != nil {
			return nil, err
		}

		return ParseJson[Key](strings.NewReader(keyJson))
	}

	readAsString := func(part *multipart.Part) (string, error) {
		buf := new(strings.Builder)
		_, err := io.Copy(buf, part)
		if err != nil {
			return "", err
		}
		return buf.String(), nil
	}

	readAsInt64 := func(part *multipart.Part) (int64, error) {
		var num int64
		str, err := readAsString(part)
		if err == nil {
			num, err = strconv.ParseInt(str, 10, 64)
		}
		return num, err
	}

	saveChunk := func(key *Key, pos int64, size int64, part *multipart.Part) (bool, error) {
		rawPlace := key.Place
		rawTmpFileName := key.TmpFileName

		osTmpFilePath, err := config.GetPlaceOsPath(NormalizePath(path.Join(rawPlace, rawTmpFileName)))
		if err != nil {
			return false, err
		}

		tmpFile, err := os.OpenFile(osTmpFilePath, os.O_WRONLY, 0600)
		if err != nil {
			return false, err
		}
		defer tmpFile.Close()

		offset, err := tmpFile.Seek(pos, 0)
		if err != nil {
			return false, err
		}

		written, err := io.Copy(tmpFile, part)
		if err != nil {
			return false, err
		}

		if written != size {
			return false, errors.New("written_size_missmatch")
		}

		if offset+written > key.Size {
			return false, errors.New("file_size_missmatch")
		}

		isFinish := offset+written == key.Size

		if isFinish {
			tmpFile.Close()

			rawFileName := key.FileName

			osFilePath, err := config.GetPlaceOsPath(NormalizePath(path.Join(rawPlace, rawFileName)))
			if err != nil {
				return false, err
			}

			err = os.Rename(osTmpFilePath, osFilePath)
			if err != nil {
				return false, errors.New("Rename temp file error: " + err.Error())
			}
		}

		return isFinish, nil
	}

	router.Post("/~/upload/init", func(w http.ResponseWriter, r *http.Request) {
		apiCall(w, func() (*UploadInit, error) {
			payload, err := ParseJson[UploadInitPayload](r.Body)
			if err != nil {
				return nil, err
			}

			rawPlace := payload.Place
			rawFileName := payload.FileName
			size := payload.Size

			osUploadPath, err := config.GetPlaceOsPath(NormalizePath(rawPlace))
			if err != nil {
				return nil, errors.New("incorrect place")
			}

			filePath := NormalizePath(path.Join(rawPlace, rawFileName))

			isWritable := config.IsWritable(filePath)
			if !isWritable {
				return nil, errors.New("unable wite in this place")
			}

			osFilePath, err := config.GetPlaceOsPath(filePath)
			if err != nil {
				return nil, err
			}

			_, err = os.Stat(osFilePath)
			if err == nil {
				return nil, errors.New("File exists")
			}

			tmpFile, err := os.CreateTemp(osUploadPath, "tmp")
			if err != nil {
				return nil, errors.New("Create temp file error: " + err.Error())
			}
			defer tmpFile.Close()

			keyJson, err := buildKey(rawFileName, size, rawPlace, tmpFile)

			result := UploadInit{
				Key:       keyJson,
				ChunkSize: chunkSize,
			}
			return &result, err
		})
	})

	router.Post("/~/upload/chunk", func(w http.ResponseWriter, r *http.Request) {
		apiCall(w, func() (bool, error) {
			reader, err := r.MultipartReader()

			var key *Key
			var pos int64
			var size int64
			var result bool

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
					var sigKey string
					sigKey, err = readAsString(part)
					if err == nil {
						key, err = readKey(sigKey)
					}
				case "pos":
					pos, err = readAsInt64(part)
				case "size":
					size, err = readAsInt64(part)
				case "chunk":
					result, err = saveChunk(key, pos, size, part)
				}
			}

			return result, err
		})
	})
}

func handleInterfaces(router *Router, config *Config) {
	router.Get("/~/addresses", func(w http.ResponseWriter, r *http.Request) {
		apiCall(w, func() ([]string, error) {
			addresses := GetAddresses(config.Port)
			return addresses, nil
		})
	})
}

func handleDiskUsage(router *Router, config *Config) {
	type DiskUsage struct {
		disk.UsageStat
		Path string `json:"path"`
	}

	type DirSize struct {
		DirCount  int64 `json:"dirCount"`
		FileCount int64 `json:"fileCount"`
		TotalSize int64 `json:"totalSize"`
	}

	router.Get("/~/diskUsage", func(w http.ResponseWriter, r *http.Request) {
		apiCall(w, func() (*DiskUsage, error) {
			place := NormalizePath(r.URL.Query().Get("place"))

			osFullPath, err := config.GetPlaceOsPath(place)
			if err != nil {
				return nil, err
			}

			usage, err := disk.Usage(osFullPath)
			if err != nil {
				return nil, err
			}

			resule := &DiskUsage{
				UsageStat: *usage,
				Path:      place,
			}

			return resule, nil
		})
	})

	router.Get("/~/dirSize", func(w http.ResponseWriter, r *http.Request) {
		apiCall(w, func() (*DirSize, error) {
			place := NormalizePath(r.URL.Query().Get("place"))

			osFullPath, err := config.GetPlaceOsPath(place)
			if err != nil {
				return nil, err
			}

			fs := os.DirFS(osFullPath)

			dirInfo, _ := dirsize.GetDirInfo(fs)

			resule := &DirSize{
				DirCount:  dirInfo.DirCount,
				FileCount: dirInfo.FileCount,
				TotalSize: dirInfo.TotalSize,
			}

			return resule, nil
		})
	})
}

func handleStorage(router *Router, storage *Storage) {
	router.Post("/~/storage/get", func(w http.ResponseWriter, r *http.Request) {
		apiCall(w, func() (map[string]interface{}, error) {
			keys, err := ParseJson[[]string](r.Body)
			if err != nil {
				return nil, err
			}
			result := storage.GetKeys(*keys)
			return result, nil
		})
	})

	router.Post("/~/storage/set", func(w http.ResponseWriter, r *http.Request) {
		apiCall(w, func() (string, error) {
			keyValue, err := ParseJson[map[string]interface{}](r.Body)
			if err == nil {
				err = storage.SetObject(*keyValue)
			}
			return "ok", err
		})
	})

	router.Post("/~/storage/del", func(w http.ResponseWriter, r *http.Request) {
		apiCall(w, func() (string, error) {
			keys, err := ParseJson[[]string](r.Body)
			if err == nil {
				err = storage.DelKeys(*keys)
			}
			return "ok", err
		})
	})
}

func handleAction(router *Router, config *Config, doReload func()) {
	type RemovePayload struct {
		Place string `json:"place"`
		Name  string `json:"name"`
		IsDir bool   `json:"isDir"`
	}

	type RemoveAllPayload struct {
		Place string   `json:"place"`
		Names []string `json:"names"`
	}

	type RenamePayload struct {
		Place   string `json:"place"`
		Name    string `json:"name"`
		NewName string `json:"newName"`
	}

	type MkdirPayload struct {
		Place   string `json:"place"`
		Name    string `json:"name"`
		NewName string `json:"newName"`
	}

	type ShowHiddenPayload struct {
		Show bool `json:"show"`
	}

	router.Post("/~/mkdir", func(w http.ResponseWriter, r *http.Request) {
		apiCall(w, func() (string, error) {
			payload, err := ParseJson[MkdirPayload](r.Body)
			if err != nil {
				return "", err
			}

			rawPlace := payload.Place
			rawName := payload.Name
			rPath := NormalizePath(path.Join(rawPlace, rawName))

			osPath, err := config.GetPlaceOsPath(rPath)
			if err != nil {
				return "", err
			}

			isWritable := config.IsWritable(rPath)
			if !isWritable {
				return "", errors.New("place is not writable")
			}

			err = os.Mkdir(osPath, 0600)

			return "ok", err
		})
	})

	router.Post("/~/rename", func(w http.ResponseWriter, r *http.Request) {
		apiCall(w, func() (string, error) {
			payload, err := ParseJson[RenamePayload](r.Body)
			if err != nil {
				return "", err
			}

			rawPlace := payload.Place
			rawName := payload.Name
			rawNewName := payload.NewName
			rTargetPath := NormalizePath(path.Join(rawPlace, rawName))
			rNewPath := NormalizePath(path.Join(rawPlace, rawNewName))

			osTargetPath, err := config.GetPlaceOsPath(rTargetPath)
			if err != nil {
				return "", err
			}

			osNewPath, err := config.GetPlaceOsPath(rNewPath)
			if err != nil {
				return "", err
			}

			isWritableSource := config.IsWritable(rTargetPath)
			isWritableTarget := config.IsWritable(rNewPath)
			if !isWritableSource || !isWritableTarget {
				return "", errors.New("place is not writable")
			}

			err = os.Rename(osTargetPath, osNewPath)

			return "ok", err
		})
	})

	router.Post("/~/remove", func(w http.ResponseWriter, r *http.Request) {
		apiCall(w, func() (string, error) {
			payload, err := ParseJson[RemovePayload](r.Body)
			if err != nil {
				return "", err
			}

			rawPlace := payload.Place
			rawName := payload.Name
			rTargetPath := NormalizePath(path.Join(rawPlace, rawName))
			osTargetPath, err := config.GetPlaceOsPath(rTargetPath)
			if err != nil {
				return "", err
			}

			isWritable := config.IsWritable(rTargetPath)
			if !isWritable {
				return "", errors.New("place is not writable")
			}

			isDir := payload.IsDir
			if isDir {
				err = os.RemoveAll(osTargetPath)
			} else {
				err = os.Remove(osTargetPath)
			}

			return "ok", err
		})
	})

	router.Post("/~/removeAll", func(w http.ResponseWriter, r *http.Request) {
		apiCall(w, func() (string, error) {
			payload, err := ParseJson[RemoveAllPayload](r.Body)
			if err != nil {
				return "", err
			}

			rawPlace := payload.Place
			rawNames := payload.Names
			for _, rawName := range rawNames {
				rTargetPath := NormalizePath(path.Join(rawPlace, rawName))
				osTargetPath, err := config.GetPlaceOsPath(rTargetPath)
				if err != nil {
					return "", err
				}

				isWritable := config.IsWritable(rTargetPath)
				if !isWritable {
					return "", errors.New("place is not writable")
				}

				err = os.RemoveAll(osTargetPath)
				if err != nil {
					return "", err
				}
			}

			return "ok", err
		})
	})

	router.Post("/~/reloadConfig", func(w http.ResponseWriter, r *http.Request) {
		apiCall(w, func() (string, error) {
			doReload()

			return "ok", nil
		})
	})

	router.Post("/~/showHidden", func(w http.ResponseWriter, r *http.Request) {
		apiCall(w, func() (bool, error) {
			payload, err := ParseJson[ShowHiddenPayload](r.Body)
			if err != nil {
				return false, err
			}
			config.ShowHiddenFiles = payload.Show
			SaveConfig(*config)

			return payload.Show, nil
		})
	})

	variables := []string{"url", "path", "dir", "name", "hostname"}
	prepareHandlerUrl := func(query url.Values, handlerUrl string) (finalUrl string, err error) {
		rawPlace := query.Get("place")
		rawName := query.Get("name")
		hostname := query.Get("hostname")

		rPath := NormalizePath(path.Join(rawPlace, rawName))

		var osPath string
		osPath, err = config.GetPlaceOsPath(rPath)
		if err != nil {
			return
		}

		finalUrl = handlerUrl
		for _, variable := range variables {
			switch variable {
			case "url":
				var fileUrl string
				rPathParts := strings.Split(rPath, "/")
				for i, part := range rPathParts {
					if i > 0 {
						fileUrl += "/"
					}
					fileUrl += url.PathEscape(part)
				}

				finalUrl = strings.ReplaceAll(finalUrl, "{url}", url.QueryEscape(fileUrl))
			case "path":
				finalUrl = strings.ReplaceAll(finalUrl, "{path}", url.QueryEscape(osPath))
			case "dir":
				finalUrl = strings.ReplaceAll(finalUrl, "{dir}", url.QueryEscape(path.Dir(osPath)))
			case "name":
				finalUrl = strings.ReplaceAll(finalUrl, "{name}", url.QueryEscape(path.Base(osPath)))
			case "hostname":
				finalUrl = strings.ReplaceAll(finalUrl, "{hostname}", url.QueryEscape(hostname))
			}
		}
		return
	}

	emitData := func(w http.ResponseWriter, payload string) {
		if _, err := w.Write([]byte(payload)); err != nil {
			panic(err)
		}
	}
	emitError := func(w http.ResponseWriter, statusCode int, err error) {
		w.WriteHeader(statusCode)
		emitData(w, err.Error())
	}
	emitRedirect := func(w http.ResponseWriter, redirectUrl string) {
		w.Header().Set("Location", redirectUrl)
		w.WriteHeader(302)
		emitData(w, "")
	}

	router.Get("/~/extHandle", func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()
		rawName := query.Get("name")

		handlerUrl, found := config.ExtHandle[path.Ext(rawName)]
		if !found {
			err := errors.New("handler not found")
			emitError(w, 404, err)
			return
		}

		finalUrl, err := prepareHandlerUrl(query, handlerUrl)
		if err != nil {
			emitError(w, 500, err)
			return
		}

		emitRedirect(w, finalUrl)
	})

	router.Get("/~/extAction", func(w http.ResponseWriter, r *http.Request) {
		query := r.URL.Query()

		rawName := query.Get("name")
		actionName := query.Get("action")

		actions, found := config.ExtActions[path.Ext(rawName)]
		if !found {
			err := errors.New("action handler not found")
			emitError(w, 404, err)
			return
		}
		var currectAction *ExtAction
		for _, action := range actions {
			if action.Name == actionName {
				currectAction = &action
				break
			}
		}
		if currectAction == nil {
			err := errors.New("action not found")
			emitError(w, 404, err)
			return
		}

		finalUrl, err := prepareHandlerUrl(query, currectAction.Url)
		if err != nil {
			emitError(w, 500, err)
			return
		}

		emitRedirect(w, finalUrl)
	})
}

func handleWww(router *Router, debugUi bool) {
	binTime := time.Now()
	if binPath, err := os.Executable(); err == nil {
		if binStat, err := os.Stat(binPath); err == nil {
			binTime = binStat.ModTime()
		}
	}

	router.Custom([]string{http.MethodGet, http.MethodHead}, []string{"^/~/www/"}, func(w http.ResponseWriter, r *http.Request) {
		mTime := binTime
		assetPath := r.URL.Path[3:]

		var content []byte
		var err error
		if debugUi {
			path := "./ui/dist" + assetPath[3:]
			content, err = os.ReadFile(path)
			if info, err := os.Stat(path); err == nil {
				mTime = info.ModTime()
			}
		} else {
			content, err = assets.Asset(assetPath)
		}
		if err != nil {
			w.WriteHeader(404)
			return
		}

		reader := bytes.NewReader(content)
		name := path.Base(assetPath)
		http.ServeContent(w, r, name, mTime, reader)
	})
}

type ActionAny[T any] func() (T, error)

func apiCall[T any](w http.ResponseWriter, action ActionAny[T]) {
	result, err := action()
	err = writeApiResult(w, result, err)
	if err != nil {
		panic(err)
	}
}

func ParseJson[T any](data io.Reader) (*T, error) {
	decoder := json.NewDecoder(data)
	var payload T
	err := decoder.Decode(&payload)
	if err != nil {
		return nil, err
	}
	return &payload, nil
}

func writeApiResult(w http.ResponseWriter, result interface{}, err error) error {
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
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)
		_, err = w.Write(json)
	}
	return err
}
