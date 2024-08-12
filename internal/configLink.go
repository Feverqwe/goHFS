package internal

import "time"

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

func (s *Link) SetCache(isDir bool, size int64, ctime int64) {
	if s.CacheTTL == 0 {
		return
	}
	s.cache = LinkCache{
		expiresAt: time.Now().Add(time.Duration(s.CacheTTL) * time.Second).Unix(),
		size:      size,
		ctime:     ctime,
		isDir:     isDir,
	}
}
