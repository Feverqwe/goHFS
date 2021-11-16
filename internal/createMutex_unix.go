package internal

import (
	"github.com/juju/fslock"
)

func CreateMutex(name string) (uintptr, error) {
	lock := fslock.New(name)
	err := lock.TryLock()
	if err != nil {
		return 0, err
	}
	return 1, nil
}
