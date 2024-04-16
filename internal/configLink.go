package internal

import "time"

type LinkCache struct {
	expiresAt int64
	isDir     bool
	size      int64
	ctime     int64
}

type Link struct {
	Place  string `json:"place"`
	Target string `json:"target"`
	Cache  bool   `json:"cache"`
	cache  LinkCache
}

func (s *Link) HasCache() bool {
	return s.Cache && s.cache.expiresAt > time.Now().Unix()
}

func (s *Link) SetCache(isDir bool, size int64, ctime int64) {
	if !s.Cache {
		return
	}
	s.cache = LinkCache{
		expiresAt: time.Now().Add(12 * time.Hour).Unix(),
		size:      size,
		ctime:     ctime,
		isDir:     isDir,
	}
}
