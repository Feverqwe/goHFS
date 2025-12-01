package boltstorage

import (
	"fmt"

	"github.com/boltdb/bolt"
)

type BoltRead struct {
	b *bolt.Bucket
}

func (s *BoltRead) Get(k string) (r interface{}, err error) {
	r = nil
	if v := s.b.Get([]byte(k)); v != nil {
		if r, err = JSONToInterface(v); err != nil {
			err = fmt.Errorf("parse key %s value error: %w", k, err)
		}
	}
	return
}

func (s *BoltRead) ForEach(cb func(k string, v interface{}, err error) error) error {
	return s.b.ForEach(func(k, v []byte) error {
		value, err := JSONToInterface(v)
		if err != nil {
			err = fmt.Errorf("parse key %s value error: %w", k, err)
		}
		return cb(string(k), value, err)
	})
}
