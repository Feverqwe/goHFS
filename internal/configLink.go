package internal

type LinkCache struct {
	isDir bool
	size  int64
	ctime int64
}

type Link struct {
	Place  string `json:"place"`
	Target string `json:"target"`
	Cache  bool   `json:"cache"`
	cache  *LinkCache
}

func (s *Link) SetCache(isDir bool, size int64, ctime int64) {
	if !s.Cache {
		return
	}
	s.cache = &LinkCache{
		size:  size,
		ctime: ctime,
		isDir: isDir,
	}
}
