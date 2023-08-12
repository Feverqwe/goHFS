package internal

import (
	"bytes"
	"encoding/json"
	"log"
	"os"
	"sync"
	"time"

	"github.com/natefinch/atomic"
)

const TTL = 31556952

type StorageValue struct {
	Value interface{}
	MTime int64
}

type Storage struct {
	path     string
	keyValue map[string]StorageValue
	mrw      sync.RWMutex
	ch       chan int
}

func (s *Storage) GetKeys(keys []string) map[string]interface{} {
	var result = make(map[string]interface{})
	if keys == nil {
		s.mrw.RLock()
		for key, value := range s.keyValue {
			result[key] = value.Value
		}
		s.mrw.RUnlock()
	} else {
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
	if ok {
		return val.Value, ok
	}
	return nil, ok
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
	s.keyValue[key] = StorageValue{
		Value: value,
		MTime: time.Now().Unix(),
	}
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
	if data, err := os.ReadFile(s.path); err != nil {
		if !os.IsNotExist(err) {
			return err
		}
	} else if err := json.Unmarshal(data, &s.keyValue); err != nil {
		return err
	}
	return nil
}

func (s *Storage) Clean() {
	since := time.Now().Unix() - TTL
	delKeys := make([]string, 0)
	for key, value := range s.keyValue {
		if value.MTime < since {
			delKeys = append(delKeys, key)
		}
	}
	s.DelKeys(delKeys)
}

func MigrateStorage(v1Path string, v2Path string) {
	_, err := os.Stat(v2Path)
	if err == nil {
		return
	} else if !os.IsNotExist(err) {
		log.Println("Open new storage error:", err)
		return
	}

	if _, err := os.Stat(v1Path); err != nil {
		if !os.IsNotExist(err) {
			log.Println("Open legacy storage error:", err)
		}
		return
	}

	keyValue := make(map[string]interface{})
	if data, err := os.ReadFile(v1Path); err != nil {
		log.Println("Read legacy storage error:", err)
		return
	} else if err := json.Unmarshal(data, &keyValue); err != nil {
		log.Println("Load legacy storage error:", err)
		return
	}

	newKeyValue := make(map[string]StorageValue)
	for key, value := range keyValue {
		newKeyValue[key] = StorageValue{Value: value, MTime: time.Now().Unix()}
	}

	if data, err := json.Marshal(newKeyValue); err != nil {
		log.Println("Marshal new storage error:", err)
		return
	} else {
		reader := bytes.NewReader(data)
		atomic.WriteFile(v2Path, reader)
	}
}

func GetStorage(path string) *Storage {
	storage := &Storage{
		path:     path,
		ch:       make(chan int),
		keyValue: make(map[string]StorageValue),
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
	go func() {
		storage.Clean()
	}()
	return storage
}
