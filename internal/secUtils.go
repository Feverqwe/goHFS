package internal

import (
	"errors"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"regexp"
)

var UP_PATH_REGEXP = regexp.MustCompile(`(?:^|[\\/])\.\.(?:[\\/]|$)`)

func hasUpPath(str string) bool {
	return len(UP_PATH_REGEXP.FindStringIndex(str)) > 0
}

func isSubPath(root string, subpath string) (bool, error) {
	path, err := filepath.Rel(root, filepath.Join(root, subpath))
	if err != nil {
		return false, err
	}
	if hasUpPath(path) {
		return false, nil
	}
	return true, nil
}

func normalizePath(place string) string {
	return filepath.FromSlash(path.Clean("/" + place))
}

func GetFullPath(root string, path string) (string, error) {
	path, err := GetRelativePath(root, path)
	if err != nil {
		return "", err
	}
	path = filepath.Join(root, path)
	return path, nil
}

func GetRelativePath(root string, place string) (string, error) {
	place = normalizePath(place)
	isSub, err := isSubPath(root, place)
	if err != nil {
		return "", err
	}
	if !isSub {
		return "", errors.New("is parent path")
	}
	return place, nil
}

func OpenPath(root string, place string) (*os.File, string, error) {
	httpDir := http.Dir(root)

	f, err := httpDir.Open(place)
	if err != nil {
		return nil, "", err
	}

	path, err := GetFullPath(root, place)
	if err != nil {
		return nil, "", err
	}

	return f.(*os.File), path, nil
}

/* func init() {
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
		norm := normalizePath(path)
		log.Println("normalizePath", norm)
		rel, _ := GetRelativePath(root, path)
		log.Println("GetRelativePath", rel)
		path, _ := GetFullPath(root, path)
		log.Println("GetFullPath", path)
	}
} */
