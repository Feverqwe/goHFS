package internal

import (
	"context"
	"encoding/json"
	"goHfs/assets"
	boltstorage "goHfs/internal/boltStorage"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/NYTimes/gziphandler"
)

type RootStore struct {
	Dir        string                 `json:"dir"`
	IsRoot     bool                   `json:"isRoot"`
	IsWritable bool                   `json:"isWritable"`
	Files      []*File                `json:"files"`
	ExtHandle  map[string]string      `json:"extHandle"`
	ExtActions map[string][]ExtAction `json:"extActions"`
	DirSort    interface{}            `json:"dirSort"`
	ShowHidden bool                   `json:"showHidden"`
}

type File struct {
	Name     string  `json:"name"`
	IsDir    bool    `json:"isDir"`
	IsLink   bool    `json:"isLink"`
	Ctime    int64   `json:"ctime"` // ms
	Size     int64   `json:"size"`  // bytes
	Progress float64 `json:"progress"`
}

func HandleDir(router *Router, config *Config, storage *boltstorage.BoltStorage, debugUi bool) {
	type contextType string
	const contentKey contextType = "content"

	data, err := assets.Asset("www/folder.html")
	if err != nil {
		panic(err)
	}
	template := string(data)

	getIndex := func(place string, fullPath string) string {
		result := GetIndexStore(config, storage, place, fullPath)

		placeName := config.Name
		if !result.IsRoot {
			placeName = place + " – " + placeName
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
