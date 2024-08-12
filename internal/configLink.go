package internal

import (
	"os"
	"time"
)

type LinkCache struct {
	expiresAt int64
	isDir     bool
	size      int64
	ctime     int64
}

type Link struct {
	Place    string `json:"place"`
	Target   string `json:"target"`
	CacheTTL int64  `json:"cacheTTL"`
	cache    LinkCache
}

func (s *Link) HasCache() bool {
	return s.CacheTTL > 0 && s.cache.expiresAt > time.Now().Unix()
}

func (s *Link) GetCache(f string) LinkCache {
	cache := s.cache
	if s.HasCache() {
		return cache
	}

	if info, err := os.Stat(f); err == nil {
		cache.isDir = info.IsDir()
		cache.size = info.Size()
		cache.ctime = UnixMilli(info.ModTime())

		if s.CacheTTL > 0 {
			cache.expiresAt = time.Now().Add(time.Duration(s.CacheTTL) * time.Second).Unix()
			s.cache = cache
		}
	}
	return cache
}
