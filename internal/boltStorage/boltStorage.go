package boltstorage

import (
	"fmt"
	"log"

	"github.com/boltdb/bolt"
)

type BoltStorage struct {
	path   string
	ch     chan int
	db     *bolt.DB
	bucket []byte
}

func (s *BoltStorage) GetKeys(keys []string) map[string]interface{} {
	var err error
	var result = make(map[string]interface{})
	if keys == nil {
		err = s.db.View(func(tx *bolt.Tx) error {
			b := tx.Bucket(s.bucket)
			b.ForEach(func(k, v []byte) error {
				key := string(k)
				r, err := JSONToInterface(v)
				if err != nil {
					log.Println("Parse key value error", key, err)
				} else {
					result[key] = r
				}
				return nil
			})
			return nil
		})
	} else {
		err = s.db.View(func(tx *bolt.Tx) error {
			b := tx.Bucket(s.bucket)
			for _, key := range keys {
				v := b.Get([]byte(key))
				if v != nil {
					r, err := JSONToInterface(v)
					if err != nil {
						log.Println("Parse key value error", err)
					} else {
						result[key] = r
					}
				}
			}
			return nil
		})
	}
	if err != nil {
		log.Println("GetKeys error", err)
	}
	return result
}

func (s *BoltStorage) GetKey(key string) (interface{}, bool) {
	var r interface{}
	err := s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(s.bucket)
		v := b.Get([]byte(key))
		if v != nil {
			var err error
			r, err = JSONToInterface(v)
			if err != nil {
				return fmt.Errorf("parse key value error %s %w", key, err)
			}
		}
		return nil
	})
	if err != nil {
		log.Println("GetKey single key error", key, err)
	}
	return r, err == nil
}

func (s *BoltStorage) SetKey(key string, value interface{}) {
	err := s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(s.bucket)
		v, err := InterfaceToJSON(value)
		if err != nil {
			return fmt.Errorf("serialize key error %s %w", key, err)
		}
		err = b.Put([]byte(key), v)
		if err != nil {
			return fmt.Errorf("put key error %s %w", key, err)
		}
		return nil
	})
	if err != nil {
		log.Println("SetKey key error", key, err)
	}
	s.SaveQueue()
}

func (s *BoltStorage) SetObject(keyValue map[string]interface{}) error {
	err := s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(s.bucket)
		for key, value := range keyValue {
			v, err := InterfaceToJSON(value)
			if err != nil {
				log.Println("serialize key error", key, err)
				continue
			}
			err = b.Put([]byte(key), v)
			if err != nil {
				log.Println("put key error", key, err)
			}
		}
		return nil
	})
	if err != nil {
		log.Println("SetObject error", err)
	}
	s.SaveQueue()
	return nil
}

func (s *BoltStorage) DelKey(key string) {
	err := s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(s.bucket)
		return b.Delete([]byte(key))
	})
	if err != nil {
		log.Println("Del key error", err)
	}
	s.SaveQueue()
}

func (s *BoltStorage) DelKeys(keys []string) error {
	err := s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(s.bucket)
		for _, key := range keys {
			err := b.Delete([]byte(key))
			if err != nil {
				log.Println("del key error", err)
			}
		}
		return nil
	})
	if err != nil {
		log.Println("DelKeys error", err)
	}
	s.SaveQueue()
	return nil
}

func (s *BoltStorage) SaveQueue() {
	s.ch <- 1
}

func (s *BoltStorage) Load() error {
	db, err := bolt.Open(s.path, 0600, nil)
	if err != nil {
		return err
	}
	err = db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists(s.bucket)
		return err
	})
	if err != nil {
		return err
	}
	s.db = db
	return nil
}

func (s *BoltStorage) Save() error {
	err := s.db.Sync()
	return err
}

func GetStorage(path string) *BoltStorage {
	storage := &BoltStorage{
		path:   path,
		ch:     make(chan int),
		bucket: []byte("store"),
	}
	err := storage.Load()
	if err != nil {
		log.Fatalln("Load db error:", err)
	}
	go func() {
		for {
			<-storage.ch
			err := storage.Save()
			if err != nil {
				log.Println("Save db error:", err)
			}
		}
	}()
	return storage
}
