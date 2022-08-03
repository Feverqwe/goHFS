package internal

import (
	"errors"
	"path"
	"path/filepath"
	"strings"
)

func NormalizePath(place string) string {
	return filepath.FromSlash(path.Clean("/" + place))
}

func GetFullPath(public string, path string) (string, error) {
	if filepath.Separator != '/' && strings.ContainsRune(path, filepath.Separator) {
		return "", errors.New("http: invalid character in file path")
	}
	dir := public
	if dir == "" {
		dir = "."
	}
	return filepath.Join(dir, NormalizePath(path)), nil
}

/*
func init() {
	Test()
}

func Test() {
	root := "/Users/Home"
	paths := [...]string{
		"/1/2",
		"/1/2/",
		"../1/2/",
		"../../1/2",
		"//1",
		"/1/../2",
		"",
		".",
		"/%",
		"/users/../../todo.txt",
		"/",
		"//todo@txt",
		"qwe\\qqe\\ewqe",
		"a\\b",
	}

	for _, path := range paths {
		log.Println("==============", path)
		norm := NormalizePath(path)
		log.Println("normalizePath", norm)
		path, _ := GetFullPath(root, path)
		log.Println("fullPath", path)
		log.Println("")
	}
}
*/
