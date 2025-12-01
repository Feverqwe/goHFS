package boltstorage

import (
	"fmt"

	"github.com/boltdb/bolt"
)

type BoltWrite struct {
	b *bolt.Bucket
}

func (s *BoltWrite) Set(key string, value interface{}) error {
	v, err := InterfaceToJSON(value)
	if err != nil {
		return fmt.Errorf("serialize key %s value error: %w", key, err)
	}
	if err = s.b.Put([]byte(key), v); err != nil {
		return fmt.Errorf("put key error %s %w", key, err)
	}
	return nil
}

func (s *BoltWrite) Delete(key string) error {
	if err := s.b.Delete([]byte(key)); err != nil {
		return fmt.Errorf("delete key error %s %w", key, err)
	}
	return nil
}
