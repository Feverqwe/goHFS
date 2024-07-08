package internal

import (
	"net/http"
	"os"
	"runtime"
)

func HandleOpenFileError(err error, writer http.ResponseWriter) {
	if os.IsNotExist(err) {
		writer.WriteHeader(404)
	} else {
		writer.WriteHeader(403)
	}
}

func isHiddenName(name string) bool {
	if name == "System Volume Information" {
		return true
	}
	if runtime.GOOS == "windows" {
		if name == "desktop.ini" || name == "Thumbs.db" {
			return true
		}
	} else if name[0] == '.' {
		return true
	}
	return false
}

func getProgressKey(path string) string {
	return "progress-" + path
}
