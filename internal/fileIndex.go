package internal

import (
	"context"
	"encoding/json"
	"goHfs/assets"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/NYTimes/gziphandler"
)

type RootStore struct {
	Dir        string                 `json:"dir"`
	IsRoot     bool                   `json:"isRoot"`
	IsWritable bool                   `json:"isWritable"`
	Files      []File                 `json:"files"`
	ExtHandle  map[string]string      `json:"extHandle"`
	ExtActions map[string][]ExtAction `json:"extActions"`
	DirSort    interface{}            `json:"dirSort"`
}

type File struct {
	Name  string `json:"name"`
	IsDir bool   `json:"isDir"`
	Ctime int64  `json:"ctime"` // ms
	Size  int64  `json:"size"`  // bytes
}

func HandleDir(router *Router, config *Config, storage *Storage, debugUi bool) {
	public := config.Public

	type contextType string
	const contentKey contextType = "content"

	data, err := assets.Asset("www/folder.html")
	if err != nil {
		panic(err)
	}
	template := string(data)

	getIndex := func(place string, fullPath string, pathFile *os.File) string {
		files := make([]File, 0)

		showHidden := config.ShowHiddenFiles
		if showHiddenRaw, ok := storage.GetKey("showHidden-" + place); ok {
			if showHiddenBool, ok := showHiddenRaw.(bool); ok {
				showHidden = showHiddenBool
			}
		}

		if dir, err := pathFile.ReadDir(-1); err == nil {
			for i := 0; i < len(dir); i++ {
				entity := dir[i]
				file := File{}
				file.IsDir = entity.IsDir()
				file.Name = entity.Name()
				if !showHidden {
					if file.Name == "System Volume Information" {
						continue
					}
					if runtime.GOOS == "windows" {
						if file.Name == "desktop.ini" || file.Name == "Thumbs.db" {
							continue
						}
					} else if file.Name[0] == '.' {
						continue
					}
				}
				if info, err := entity.Info(); err == nil {
					file.Size = info.Size()
					file.Ctime = UnixMilli(info.ModTime())
					if info.Mode()&os.ModeSymlink != 0 {
						if stat, err := os.Stat(filepath.Join(fullPath, file.Name)); err == nil {
							file.IsDir = stat.IsDir()
							file.Size = stat.Size()
							file.Ctime = UnixMilli(stat.ModTime())
						}
					}
				}

				files = append(files, file)
			}
		}

		isRoot := public == fullPath
		isWritable := config.IsWritable(path.Join(place, "tmp"))

		placeName := config.Name
		if !isRoot {
			placeName = place + " – " + placeName
		}

		dirSort, _ := storage.GetKey("dirSort-" + place)

		result := RootStore{
			Dir:        place,
			IsRoot:     isRoot,
			IsWritable: isWritable,
			Files:      files,
			ExtHandle:  config.ExtHandle,
			ExtActions: config.ExtActions,
			DirSort:    dirSort,
		}

		if debugUi {
			assetPath := "/folder.html"
			path := "./ui/dist" + assetPath
			content, err := os.ReadFile(path)
			if err != nil {
				log.Println("Path not found", assetPath)
			} else {
				template = string(content)
			}
		}

		var body string
		if resultJson, err := json.Marshal(result); err == nil {
			body = template
			body = strings.Replace(body, "{{TITLE}}", EscapeHtmlInJson(placeName), 1)
			body = strings.Replace(body, "<script id=\"root_store\"></script>", "<script id=\"root_store\">window.ROOT_STORE="+EscapeHtmlInJson(string(resultJson))+"</script>", 1)
		} else {
			body = "json.Marshal error: " + EscapeHtmlInJson(err.Error())
		}

		return body
	}

	gzipHandler := gziphandler.GzipHandler(http.HandlerFunc(func(writer http.ResponseWriter, r *http.Request) {
		content := r.Context().Value(contentKey).(string)
		reader := strings.NewReader(content)

		http.ServeContent(writer, r, "index.html", time.Now(), reader)
	}))

	router.Custom([]string{http.MethodGet, http.MethodHead}, []string{}, func(w http.ResponseWriter, r *http.Request, next RouteNextFn) {
		place := NormalizePath(r.URL.Path)

		osFullPath, err := GetFullPath(public, place)
		if err != nil {
			w.WriteHeader(403)
			return
		}

		file, stat, err := OpenFile(osFullPath)
		if err != nil {
			HandleOpenFileError(err, w)
			return
		}
		defer file.Close()

		if stat.IsDir() {
			content := getIndex(place, osFullPath, file)
			ctx := context.WithValue(r.Context(), contentKey, content)
			r := r.WithContext(ctx)

			gzipHandler.ServeHTTP(w, r)
			return
		}

		defer next()
	})
}
