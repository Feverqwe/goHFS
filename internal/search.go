package internal

import (
	"encoding/json"
	"errors"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"goHfs/assets"
	boltstorage "goHfs/internal/boltStorage"
)

type SearchResult struct {
	File
	Dir          string `json:"dir"`
	RelativePath string `json:"relativePath"`
}

type searchRoot struct {
	virtualPath string
	osPath      string
	includeRoot bool
}

func handleSearch(router *Router, config *Config, storage *boltstorage.BoltStorage, debugUi bool) {
	templateData, err := assets.WWW.ReadFile("www/folder.html")
	if err != nil {
		panic(err)
	}
	template := string(templateData)

	router.Custom([]string{http.MethodGet, http.MethodHead}, []string{"/~/search"}, func(w http.ResponseWriter, r *http.Request) {
		place := NormalizePath(r.URL.Query().Get("place"))
		pattern := strings.TrimSpace(r.URL.Query().Get("pattern"))
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

		pageTemplate := template
		if debugUi {
			if content, err := os.ReadFile("./ui/dist/folder.html"); err == nil {
				pageTemplate = string(content)
			} else {
				log.Println("Path not found", "./ui/dist/folder.html")
			}
		}

		store := GetIndexStore(config, storage, place, osFullPath)
		title := "Search – " + config.Name
		if pattern != "" {
			title = pattern + " – " + title
		}
		storeJSON, err := json.Marshal(store)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		body := strings.Replace(pageTemplate, "{{TITLE}}", EscapeHtmlInJson(title), 1)
		body = strings.Replace(body, "<script id=\"root_store\"></script>", "<script id=\"root_store\">window.ROOT_STORE="+EscapeHtmlInJson(string(storeJSON))+"</script>", 1)
		http.ServeContent(w, r, "search.html", time.Now(), strings.NewReader(body))
	})

	router.Get("/~/search/files", func(w http.ResponseWriter, r *http.Request) {
		place := NormalizePath(r.URL.Query().Get("place"))
		pattern := strings.TrimSpace(r.URL.Query().Get("pattern"))

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

		apiCall(w, func() ([]SearchResult, error) {
			return SearchFiles(config, storage, place, osFullPath, pattern)
		})
	})
}

func SearchFiles(config *Config, storage *boltstorage.BoltStorage, place, fullPath, pattern string) ([]SearchResult, error) {
	if pattern == "" {
		return nil, errors.New("search pattern is empty")
	}
	if _, err := path.Match(pattern, ""); err != nil {
		return nil, errors.New("invalid search pattern")
	}

	showHidden := false
	if value, err := storage.GetKey("showHidden"); err == nil {
		showHidden, _ = value.(bool)
	}

	previewExtensions := make(map[string]bool)
	for _, ext := range append(config.PreviewVideoExts, config.PreviewImageExts...) {
		previewExtensions[strings.ToLower(ext)] = true
	}

	results := make([]SearchResult, 0)
	searchPattern := strings.ToLower(pattern)
	searchRoots := []searchRoot{{virtualPath: place, osPath: fullPath}}
	hasHiddenPart := func(virtualPath string) bool {
		relPath := strings.Trim(strings.TrimPrefix(virtualPath, place), "/")
		for _, part := range strings.Split(relPath, "/") {
			if isHiddenName(part) {
				return true
			}
		}
		return false
	}
	for _, link := range config.Links {
		linkPlace := NormalizePath(link.Place)
		isDescendant := (place == "/" && linkPlace != "/") || strings.HasPrefix(linkPlace, place+"/")
		if !isDescendant || (!showHidden && hasHiddenPart(linkPlace)) {
			continue
		}
		linkPath, err := config.GetPlaceOsPath(linkPlace)
		if err == nil {
			searchRoots = append(searchRoots, searchRoot{
				virtualPath: linkPlace,
				osPath:      linkPath,
				includeRoot: true,
			})
		}
	}

	isMountedRoot := func(virtualPath string, currentRoot searchRoot) bool {
		for _, root := range searchRoots {
			if root.virtualPath != currentRoot.virtualPath && root.virtualPath == virtualPath {
				return true
			}
		}
		return false
	}

	addEntry := func(root searchRoot, osPath string, entry fs.DirEntry) {
		relFromRoot, err := filepath.Rel(root.osPath, osPath)
		if err != nil {
			return
		}
		virtualPath := root.virtualPath
		if relFromRoot != "." {
			virtualPath = NormalizePath(path.Join(root.virtualPath, filepath.ToSlash(relFromRoot)))
		}
		relPath := strings.TrimPrefix(virtualPath, place)
		relPath = strings.TrimPrefix(relPath, "/")
		name := path.Base(virtualPath)
		nameMatches, _ := path.Match(searchPattern, strings.ToLower(name))
		pathMatches, _ := path.Match(searchPattern, strings.ToLower(relPath))
		if !nameMatches && !pathMatches {
			return
		}

		info, err := entry.Info()
		if err != nil {
			return
		}
		if info.Mode()&os.ModeSymlink != 0 {
			if targetInfo, err := os.Stat(osPath); err == nil {
				if targetInfo.IsDir() {
					return
				}
				info = targetInfo
			}
		}

		file := File{
			Name:       name,
			Size:       info.Size(),
			Ctime:      UnixMilli(info.ModTime()),
			HasPreview: previewExtensions[strings.ToLower(filepath.Ext(name))],
		}
		results = append(results, SearchResult{
			File:         file,
			Dir:          path.Dir(virtualPath),
			RelativePath: relPath,
		})
	}

	for _, root := range searchRoots {
		err := filepath.WalkDir(root.osPath, func(osPath string, entry fs.DirEntry, walkErr error) error {
			if walkErr != nil {
				if entry != nil && entry.IsDir() {
					return fs.SkipDir
				}
				return nil
			}
			relFromRoot, err := filepath.Rel(root.osPath, osPath)
			if err != nil {
				return nil
			}
			if !showHidden && relFromRoot != "." && isHiddenName(entry.Name()) {
				if entry.IsDir() {
					return fs.SkipDir
				}
				return nil
			}
			virtualPath := root.virtualPath
			if relFromRoot != "." {
				virtualPath = NormalizePath(path.Join(root.virtualPath, filepath.ToSlash(relFromRoot)))
			}
			if isMountedRoot(virtualPath, root) {
				if entry.IsDir() {
					return fs.SkipDir
				}
				return nil
			}
			if entry.IsDir() {
				return nil
			}
			if relFromRoot == "." && !root.includeRoot {
				return nil
			}
			addEntry(root, osPath, entry)
			return nil
		})
		if err != nil && root.virtualPath == place {
			return nil, err
		}
	}

	storage.Read(func(reader boltstorage.BoltRead) error {
		for i := range results {
			key := getProgressKey(path.Join(results[i].Dir, results[i].Name))
			if value, err := reader.Get(key); err == nil {
				results[i].Progress, _ = value.(float64)
			}
		}
		return nil
	})

	return results, nil
}
