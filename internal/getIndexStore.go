package internal

import (
	boltstorage "goHfs/internal/boltStorage"
	"io/fs"
	"os"
	"path"
	"path/filepath"
)

func GetIndexStore(config *Config, storage *boltstorage.BoltStorage, place string, fullPath string) *RootStore {
	files := make([]*File, 0)
	showHidden := config.ShowHiddenFiles

	linksSet := make(map[string]bool)

	enrichProgress := func(files []*File) {
		storage.Read(func(r boltstorage.BoltRead) error {
			for _, f := range files {
				key := getProgressKey(path.Join(place, f.Name))
				if v, err := r.Get(key); err == nil {
					if v != nil {
						if progress, ok := v.(float64); ok {
							f.Progress = progress
						}
					}
				}
			}
			return nil
		})
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
			cache := l.GetCache(l.Target)
			f.IsDir = cache.isDir
			f.Size = cache.size
			f.Ctime = cache.ctime
			if !showHidden && isHiddenName(f.Name) {
				continue
			}

			files = append(files, &f)
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

		files = append(files, &file)
	}

	enrichProgress(files)

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
