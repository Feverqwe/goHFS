package internal

import (
	"encoding/json"
	"goHfs/assets"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

var template = ""

type RootStore struct {
	Dir        string `json:"dir"`
	IsRoot     bool   `json:"isRoot"`
	IsWritable bool   `json:"isWritable"`
	Files      []File `json:"files"`
}

type File struct {
	Name      string `json:"name"`
	IsDir     bool   `json:"isDir"`
	Ctime     int64  `json:"ctime"` // ms
	Size      int64  `json:"size"`  // bytes
	HandleUrl string `json:"handleUrl"`
}

func GetFileIndex(config *Config) func(uri string, path string, root *os.File) string {
	root := config.Public
	showHiddenFiles := config.ShowHiddenFiles

	if template == "" {
		data, err := assets.Asset("www/folder.html")
		if err != nil {
			panic(err)
		}
		template = string(data)
	}

	return func(urlPath string, path string, pathFile *os.File) string {
		files := make([]File, 0)

		if dir, err := pathFile.ReadDir(-1); err == nil {
			for i := 0; i < len(dir); i++ {
				entity := dir[i]
				file := File{}
				file.IsDir = entity.IsDir()
				file.Name = entity.Name()
				ext := strings.ToLower(filepath.Ext(file.Name))
				if handleUrl, ok := config.GetFileHandler(ext); ok {
					file.HandleUrl = handleUrl
				}
				if !showHiddenFiles {
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
						if stat, err := os.Stat(filepath.Join(path, file.Name)); err == nil {
							file.IsDir = stat.IsDir()
							file.Size = stat.Size()
							file.Ctime = UnixMilli(stat.ModTime())
						}
					}
				}

				files = append(files, file)
			}
		}

		isRoot := root == path

		isWritable := false
		if place, err := GetRelativePath(root, urlPath); err == nil {
			isWritable = config.IsWritable(place, true)
		}

		result := RootStore{
			Dir:        urlPath,
			IsRoot:     isRoot,
			IsWritable: isWritable,
			Files:      files,
		}

		var body string
		if resultJson, err := json.Marshal(result); err == nil {
			body = template
			body = strings.Replace(body, "{{TITLE}}", "Index of "+EscapeHtmlInJson(urlPath), 1)
			body = strings.Replace(body, "<script id=\"root_store\"></script>", "<script id=\"root_store\">window.ROOT_STORE="+EscapeHtmlInJson(string(resultJson))+"</script>", 1)
		} else {
			body = "json.Marshal error: " + EscapeHtmlInJson(err.Error())
		}

		return body
	}
}
