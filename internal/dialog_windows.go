//go:build windows

package internal

import (
	"errors"

	"github.com/gen2brain/dlgs"
)

func ShowFolderSelection(title string, root string) (string, error) {
	path, success, err := dlgs.File(title, "", true)
	if err != nil {
		return "", err
	} else if success {
		return path, nil
	}
	return "", errors.New("Canceled")
}

func ShowEntry(title string, text string, defaultValue string) (string, error) {
	address, success, err := dlgs.Entry(title, text, defaultValue)
	if err != nil {
		return "", err
	} else if success {
		return address, nil
	}
	return "", errors.New("Canceled")
}
