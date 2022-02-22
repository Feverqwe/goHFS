package internal

import (
	"errors"
	"path/filepath"
	"regexp"
)

var UP_PATH_REGEXP = regexp.MustCompile(`(?:^|[\\/])\.\.(?:[\\/]|$)`)

func HasUpPath(str string) bool {
	return len(UP_PATH_REGEXP.FindStringIndex(str)) > 0
}

func IsSubPath(root string, subpath string) (bool, error) {
	path, err := filepath.Rel(root, filepath.Join(root, subpath))
	if err != nil {
		return false, err
	}
	if HasUpPath(path) {
		return false, nil
	}
	return true, nil
}

func NormalizePath(path string) string {
	if len(path) > 0 {
		path = filepath.Clean("./" + path)
	}

	return path
}

func GetInternalPath(root string, path string) (string, error) {
	path, err := GetRelativePath(root, path)
	if err != nil {
		return "", err
	}
	path = filepath.Join(root, path)
	return path, nil
}

func GetRelativePath(root string, path string) (string, error) {
	path = NormalizePath(path)
	isSub, err := IsSubPath(root, path)
	if err != nil {
		return "", err
	}
	if !isSub {
		return "", errors.New("is parent path")
	}
	path = "/" + path
	return path, nil
}
