package internal

import (
	"bytes"
	"encoding/json"
	"log"
	"os"
	"sync"

	"github.com/natefinch/atomic"
)

type Storage struct {
	path     string
	keyValue map[string]interface{}
	mrw      sync.RWMutex
	ch       chan int
}

func (s *Storage) GetKeys(keys []string) map[string]interface{} {
	var result map[string]interface{}
	if keys == nil {
		s.mrw.RLock()
		result = s.keyValue
		s.mrw.RUnlock()
	} else {
		result = make(map[string]interface{})
		for _, key := range keys {
			if val, ok := s.GetKey(key); ok {
				result[key] = val
			}
		}
	}
	return result
}

func (s *Storage) GetKey(key string) (interface{}, bool) {
	s.mrw.RLock()
	defer s.mrw.RUnlock()
	val, ok := s.keyValue[key]
	return val, ok
}

func (s *Storage) SetObject(keyValue map[string]interface{}) error {
	for key, value := range keyValue {
		s.SetKey(key, value)
	}
	s.SaveQueue()
	return nil
}

func (s *Storage) SetKey(key string, value interface{}) {
	s.mrw.Lock()
	defer s.mrw.Unlock()
	s.keyValue[key] = value
}

func (s *Storage) DelKeys(keys []string) error {
	for _, key := range keys {
		s.DelKey(key)
	}
	s.SaveQueue()
	return nil
}

func (s *Storage) DelKey(key string) {
	s.mrw.Lock()
	defer s.mrw.Unlock()
	delete(s.keyValue, key)
}

func (s *Storage) SaveQueue() {
	s.ch <- 1
}

func (s *Storage) Save() error {
	path := s.path
	reader := bytes.NewReader(nil)
	s.mrw.RLock()
	data, err := json.Marshal(s.keyValue)
	s.mrw.RUnlock()
	if err == nil {
		reader.Reset(data)
		err = atomic.WriteFile(path, reader)
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

func GetStorage(path string) *Storage {
	storage := &Storage{
		path:     path,
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
