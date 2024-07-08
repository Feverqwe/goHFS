package internal

import (
	"io/fs"
	"os"
	"path"
	"path/filepath"
)

func GetIndexStore(config *Config, storage *Storage, place string, fullPath string) *RootStore {
	files := make([]File, 0)
	showHidden := config.ShowHiddenFiles

	linksSet := make(map[string]bool)

	setProgress := func(f *File) {
		if rawProgress, ok := storage.GetKey(getProgressKey(path.Join(place, f.Name))); ok {
			if progress, ok := rawProgress.(int64); ok {
				f.Progress = progress
			}
		}
	}

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

			setProgress(&f)

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

		setProgress(&file)

		files = append(files, file)
	}

	isRoot := place == "/"
	isWritable := config.IsWritable(path.Join(place, "tmp"))

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

	return &result
}
