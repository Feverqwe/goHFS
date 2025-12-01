package boltstorage

import (
	"fmt"
	"log"

	"github.com/boltdb/bolt"
)

type BoltStorage struct {
	path   string
	db     *bolt.DB
	bucket []byte
}

func (s *BoltStorage) GetKeys(keys []string) map[string]interface{} {
	var err error
	var result = make(map[string]interface{})

	if keys == nil {
		err = s.db.View(func(tx *bolt.Tx) error {
			b := tx.Bucket(s.bucket)
			return b.ForEach(func(k, v []byte) error {
				key := string(k)
				if r, err := JSONToInterface(v); err == nil {
					result[key] = r
				} else {
					log.Println("parse key value error", key, err)
				}
				return nil
			})
		})
	} else {
		err = s.db.View(func(tx *bolt.Tx) error {
			b := tx.Bucket(s.bucket)
			for _, key := range keys {
				if v := b.Get([]byte(key)); v != nil {
					if r, err := JSONToInterface(v); err == nil {
						result[key] = r
					} else {
						log.Println("parse key value error", key, err)
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

func (s *BoltStorage) GetKey(key string) (r interface{}, err error) {
	r = nil
	err = s.db.View(func(tx *bolt.Tx) (err error) {
		b := tx.Bucket(s.bucket)
		if v := b.Get([]byte(key)); v != nil {
			if r, err = JSONToInterface(v); err != nil {
				err = fmt.Errorf("parse key %s value error: %w", key, err)
			}
		}
		return
	})
	return
}

func (s *BoltStorage) SetKey(key string, value interface{}) error {
	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(s.bucket)
		v, err := InterfaceToJSON(value)
		if err != nil {
			return fmt.Errorf("serialize key %s value error: %w", key, err)
		}
		if err = b.Put([]byte(key), v); err != nil {
			return fmt.Errorf("put key error %s %w", key, err)
		}
		return nil
	})
}

func (s *BoltStorage) SetObject(keyValue map[string]interface{}) error {
	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(s.bucket)
		for key, value := range keyValue {
			v, err := InterfaceToJSON(value)
			if err != nil {
				log.Println(fmt.Errorf("serialize key %s value error: %w", key, err))
				continue
			}
			if err = b.Put([]byte(key), v); err != nil {
				log.Println("put key error:", key, err)
			}
		}
		return nil
	})
}

func (s *BoltStorage) DelKey(key string) error {
	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(s.bucket)
		return b.Delete([]byte(key))
	})
}

func (s *BoltStorage) DelKeys(keys []string) error {
	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(s.bucket)
		for _, key := range keys {
			if err := b.Delete([]byte(key)); err != nil {
				log.Println("del key error", err)
			}
		}
		return nil
	})
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

func (s *BoltStorage) Sync() error {
	return s.db.Sync()
}

func (s *BoltStorage) Close() error {
	return s.db.Close()
}

func GetStorage(path string) *BoltStorage {
	storage := &BoltStorage{
		path:   path,
		bucket: []byte("store"),
	}
	err := storage.Load()
	if err != nil {
		log.Fatalln("Load db error:", err)
	}
	return storage
}
