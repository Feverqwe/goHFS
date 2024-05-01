package internal

import (
	"context"
	"encoding/json"
	"goHfs/assets"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
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
	ShowHidden bool                   `json:"showHidden"`
}

type File struct {
	Name   string `json:"name"`
	IsDir  bool   `json:"isDir"`
	IsLink bool   `json:"isLink"`
	Ctime  int64  `json:"ctime"` // ms
	Size   int64  `json:"size"`  // bytes
}

func HandleDir(router *Router, config *Config, storage *Storage, debugUi bool) {
	type contextType string
	const contentKey contextType = "content"

	data, err := assets.Asset("www/folder.html")
	if err != nil {
		panic(err)
	}
	template := string(data)

	getIndex := func(place string, fullPath string) string {
		files := make([]File, 0)
		showHidden := config.ShowHiddenFiles

		linksSet := make(map[string]bool)

		for _, l := range config.Links {
			dir := path.Dir(l.Place)
			if place == dir {
				name := path.Base(l.Place)
				linksSet[name] = true
				f := File{
					Name:   name,
					IsLink: true,
				}
				if l.HasCache() {
					f.IsDir = l.cache.isDir
					f.Size = l.cache.size
					f.Ctime = l.cache.ctime
				} else if info, err := os.Stat(l.Target); err == nil {
					f.IsDir = info.IsDir()
					f.Size = info.Size()
					f.Ctime = UnixMilli(info.ModTime())
					l.SetCache(f.IsDir, f.Size, f.Ctime)
				}
				if !showHidden && isHiddenName(f.Name) {
					continue
				}
				files = append(files, f)
			}
		}

		var dir []fs.DirEntry
		if dirFile, err := os.Open(fullPath); err == nil {
			defer dirFile.Close()
			if dirEntry, err := dirFile.ReadDir(-1); err == nil {
				dir = dirEntry
			}
		}

		for _, entity := range dir {
			file := File{}
			file.IsDir = entity.IsDir()
			file.Name = entity.Name()
			if _, found := linksSet[file.Name]; found {
				continue
			}
			if !showHidden && isHiddenName(file.Name) {
				continue
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

		isRoot := place == "/"
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
			ShowHidden: showHidden,
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

	router.Custom([]string{http.MethodGet, http.MethodHead}, []string{}, func(w http.ResponseWriter, r *http.Request) {
		place := NormalizePath(r.URL.Path)

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

		if stat.IsDir() {
			content := getIndex(place, osFullPath)
			ctx := context.WithValue(r.Context(), contentKey, content)
			r := r.WithContext(ctx)

			gzipHandler.ServeHTTP(w, r)
			return
		}

		SetParam(r, "place", place)
		SetParam(r, "path", osFullPath)

		if next, ok := GetNext(r); ok {
			defer next()
		}
	})
}
