package internal

import (
	"encoding/json"
	"goHfs/asserts"
	"os"
	"path/filepath"
	"strings"
)

var template = ""

type RootStore struct {
	Dir    string `json:"dir"`
	IsRoot bool   `json:"isRoot"`
	Files  []File `json:"files"`
}

type File struct {
	Name  string `json:"name"`
	IsDir bool   `json:"isDir"`
	Ctime int64  `json:"ctime"` // ms
	Size  int64  `json:"size"`  // bytes
}

func GetFileIndex(root string) func(uri string, path string) string {
	if template == "" {
		data, err := asserts.Asset("folder.html")
		if err != nil {
			panic(err)
		}
		template = string(data)
	}

	return func(relativePath string, path string) string {
		files := make([]File, 0)

		if dir, err := os.ReadDir(path); err == nil {
			for i := 0; i < len(dir); i++ {
				entity := dir[i]
				file := File{}
				file.IsDir = entity.IsDir()
				file.Name = entity.Name()
				if info, err := entity.Info(); err == nil {
					file.Size = info.Size()
					file.Ctime = UnixMilli(info.ModTime())
					if info.Mode() & os.ModeSymlink != 0 {
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

		result := RootStore{
			Dir:    relativePath,
			IsRoot: isRoot,
			Files:  files,
		}

		var body string
		if resultJson, err := json.Marshal(result); err == nil {
			body = template
			body = strings.Replace(body, "{{TITLE}}", "Index of "+EscapeHtmlInJson(relativePath), 1)
			body = strings.Replace(body, "<script id=\"root_store\"></script>", "<script id=\"root_store\">window.ROOT_STORE="+EscapeHtmlInJson(string(resultJson))+"</script>", 1)
		} else {
			body = "json.Marshal error: " + EscapeHtmlInJson(err.Error())
		}

		return body
	}
}
