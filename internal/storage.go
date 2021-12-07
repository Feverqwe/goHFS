package internal

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"runtime"
)

type Storage struct {
	path     string
	keyValue map[string]interface{}
	ch       chan int
}

func (s *Storage) GetKeys(keys []string) map[string]interface{} {
	result := make(map[string]interface{})
	for _, key := range keys {
		if val, ok := s.keyValue[key]; ok {
			result[key] = val
		}
	}
	return result
}

func (s *Storage) SetObject(keyValue map[string]interface{}) error {
	for key, value := range keyValue {
		s.keyValue[key] = value
	}
	s.SaveQueue()
	return nil
}
func (s *Storage) DelKeys(keys []string) error {
	for _, key := range keys {
		delete(s.keyValue, key)
	}
	s.SaveQueue()
	return nil
}

func (s *Storage) SaveQueue() {
	s.ch <- 1
}

func (s *Storage) Save() error {
	path := s.path
	if data, err := json.MarshalIndent(s.keyValue, "", "  "); err == nil {
		err = ioutil.WriteFile(path, data, 0644)
		return err
	}
	return nil
}

func (s *Storage) Load() error {
	path := s.path

	data, err := os.ReadFile(path)
	if err != nil {
		if !os.IsNotExist(err) {
			return err
		}
	} else {
		if err := json.Unmarshal(data, &s.keyValue); err != nil {
			return err
		}
	}
	return nil
}

func GetStorage() *Storage {
	storage := &Storage{
		path:     getStoragePath(),
		ch:       make(chan int),
		keyValue: make(map[string]interface{}),
	}
	err := storage.Load()
	if err != nil {
		log.Println("Load storage error:", err)
	}
	go func() {
		for {
			<-storage.ch
			err := storage.Save()
			if err != nil {
				log.Println("Save storage error:", err)
			}
		}
	}()
	return storage
}

func getStoragePath() string {
	place := ""
	if runtime.GOOS == "windows" {
		pwd, err := os.Getwd()
		if err != nil {
			panic(err)
		}
		place = pwd
	} else {
		ex, err := os.Executable()
		if err != nil {
			panic(err)
		}
		place = filepath.Dir(ex)
	}
	return filepath.Join(place, "storage.json")
}
