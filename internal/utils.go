package internal

import (
	"net/http"
	"os"
)

func OpenFile(path string) (*os.File, os.FileInfo, error) {
	var err error
	var file *os.File
	var stat os.FileInfo
	if err == nil {
		file, err = os.Open(path)
	}
	if err == nil {
		stat, err = file.Stat()
	}
	return file, stat, err
}

func HandleOpenFileError(err error, writer http.ResponseWriter) {
	if os.IsNotExist(err) {
		writer.WriteHeader(404)
	} else {
		writer.WriteHeader(403)
	}
}
