package boltstorage

import (
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
		err = s.Read(func(r BoltRead) error {
			return r.ForEach(func(k string, v interface{}, err error) error {
				if err != nil {
					log.Println("parse key value error", err)
					return nil
				}
				result[k] = v
				return nil
			})
		})
	} else {
		err = s.Read(func(r BoltRead) error {
			for _, key := range keys {
				if v, err := r.Get(key); err == nil && v != nil {
					result[key] = v
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

func (s *BoltStorage) GetKey(key string) (v interface{}, err error) {
	v = nil
	err = s.Read(func(r BoltRead) (err error) {
		v, err = r.Get(key)
		return
	})
	return
}

func (s *BoltStorage) SetKey(key string, value interface{}) error {
	return s.Write(func(w BoltWrite) error {
		return w.Set(key, value)
	})
}

func (s *BoltStorage) SetObject(keyValue map[string]interface{}) error {
	return s.Write(func(w BoltWrite) error {
		for key, value := range keyValue {
			if err := w.Set(key, value); err != nil {
				log.Println("set key error:", key, err)
			}
		}
		return nil
	})
}

func (s *BoltStorage) DelKey(key string) error {
	return s.Write(func(w BoltWrite) error {
		return w.Delete(key)
	})
}

func (s *BoltStorage) DelKeys(keys []string) error {
	return s.Write(func(w BoltWrite) error {
		for _, key := range keys {
			if err := w.Delete(key); err != nil {
				log.Println("del key error", err)
			}
		}
		return nil
	})
}

func (s *BoltStorage) Read(cb func(r BoltRead) error) error {
	return s.db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket(s.bucket)
		r := BoltRead{b: b}
		return cb(r)
	})
}

func (s *BoltStorage) Write(cb func(w BoltWrite) error) error {
	return s.db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket(s.bucket)
		w := BoltWrite{b: b}
		return cb(w)
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
