package internal

import (
	"bytes"
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"

	"github.com/goccy/go-yaml"
	"github.com/natefinch/atomic"
)

const (
	IsSimplePtrn = 0
	IsExtraPtrn  = 1
)

type PrepPattern struct {
	patternType int
	pattern     string
	partCount   int
	isExclude   bool
}

type ExtAction struct {
	Name    string `json:"name" yaml:"name"`
	Url     string `json:"url" yaml:"url"`
	NewPage bool   `json:"newPage" yaml:"newPage"`
}

type Config struct {
	Port                 int                    `yaml:"port"`
	Address              string                 `yaml:"address"`
	Public               string                 `yaml:"public"`
	Name                 string                 `yaml:"name"`
	ShowHiddenFiles      bool                   `yaml:"showHiddenFiles"`
	ExtHandle            map[string]string      `yaml:"extHandle"`
	ExtActions           map[string][]ExtAction `yaml:"extActions"`
	WritablePatterns     []string               `yaml:"writablePatterns"`
	Salt                 string                 `yaml:"salt"`
	Links                []*Link                `yaml:"links"`
	FfmpegPath           string                 `yaml:"ffmpegPath"`
	PreviewWorkers       int                    `yaml:"previewWorkers"`
	PreviewVideoExts     []string               `yaml:"previewVideoExts"`
	PreviewImageExts     []string               `yaml:"previewImageExts"`
	PreviewTtl           int64                  `yaml:"previewTtl"`
	prepWritablePatterns []PrepPattern
}

var APP_ID = "com.rndnm.gohfs"

func (s *Config) GetAddress() string {
	return s.Address + ":" + strconv.Itoa(s.Port)
}

func (s *Config) GetBrowserAddress() string {
	addr := s.Address
	if addr == "" || addr == "0.0.0.0" {
		addr = "127.0.0.1"
	}
	return "http://" + addr + ":" + strconv.Itoa(s.Port)
}

func (s *Config) GetPublibPath(place string) (pub string, relPlace string) {
	pub = s.Public
	relPlace = place
	for _, l := range s.Links {
		p := l.Place
		if place == p || strings.HasPrefix(place, p+"/") {
			pub = l.Target
			relPlace = place[len(p):]
			break
		}
	}
	return
}

func (s *Config) GetPlaceOsPath(place string) (string, error) {
	pub, relPlace := s.GetPublibPath(place)
	return GetFullPath(pub, relPlace)
}

func (s *Config) IsWritable(targetPath string) bool {
	lowPath := strings.ToLower(targetPath)

	for _, p := range s.prepWritablePatterns {
		if p.patternType == IsExtraPtrn {
			partCount := p.partCount
			pathParts := strings.SplitN(lowPath, "/", partCount+1)
			if len(pathParts) < partCount {
				continue
			}
			lowPath = strings.Join(pathParts[0:partCount], "/")
		}
		m, _ := filepath.Match(p.pattern, lowPath)
		if p.isExclude && m {
			return false
		}
		if m {
			return true
		}
	}
	return false
}

func PrepPatterns(patterns []string) []PrepPattern {
	result := []PrepPattern{}

	for _, rawPattern := range patterns {
		pattern := strings.ToLower(rawPattern)
		partCount := strings.Count(pattern, "/") + 1
		patternType := IsSimplePtrn
		isExclude := false
		if strings.HasSuffix(pattern, "**") {
			pattern = pattern[0 : len(pattern)-1]
			patternType = IsExtraPtrn
		}
		if strings.HasPrefix(pattern, "!") {
			pattern = pattern[1:]
			isExclude = true
		}
		np := PrepPattern{
			patternType: patternType,
			pattern:     pattern,
			partCount:   partCount,
			isExclude:   isExclude,
		}
		result = append(result, np)
	}

	return result
}

func getNewConfig() Config {
	var config = Config{
		ExtHandle:        make(map[string]string),
		ExtActions:       make(map[string][]ExtAction),
		WritablePatterns: make([]string, 0),
		Links:            make([]*Link, 0),
		FfmpegPath:       "ffmpeg",
		PreviewWorkers:   2,
		PreviewTtl:       7 * 24 * 3600,
		PreviewVideoExts: []string{".mp4", ".mov", ".mkv", ".avi", ".webm"},
		PreviewImageExts: []string{".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"},
	}
	pwd := getProfilePath()
	config.Port = 80
	config.Public = pwd
	config.Name = "HFS"
	config.ShowHiddenFiles = false
	config.ExtHandle[".mov"] = "/~/www/player.html?url={url}"
	config.ExtHandle[".mp4"] = "/~/www/player.html?url={url}"
	config.ExtHandle[".aac"] = "/~/www/player.html?url={url}"
	config.ExtHandle[".mp3"] = "/~/www/player.html?url={url}"
	return config
}

func LoadConfig() Config {
	config := getNewConfig()
	yamlPath := getConfigYamlPath()
	jsonPath := getConfigJsonPath()

	if data, err := os.ReadFile(yamlPath); err == nil {
		if err := yaml.Unmarshal(data, &config); err != nil {
			log.Println("Load YAML config error:", err)
		}
	} else if os.IsNotExist(err) {
		if jsonData, jsonErr := os.ReadFile(jsonPath); jsonErr == nil {
			if err := json.Unmarshal(jsonData, &config); err != nil {
				log.Println("Load legacy JSON config error:", err)
			} else {
				log.Println("Migrating legacy config.json to config.yaml...")
				_ = SaveConfig(config)
			}
		} else if os.IsNotExist(jsonErr) {
			if err := os.MkdirAll(getProfilePath(), 0750); err != nil {
				log.Println("Create profile path error", err)
			}

			if err := SaveConfig(config); err != nil {
				log.Println("Write new YAML config error", err)
			}
		}
	}

	if config.ExtHandle == nil {
		config.ExtHandle = make(map[string]string)
	}
	if config.ExtActions == nil {
		config.ExtActions = make(map[string][]ExtAction)
	}

	config.prepWritablePatterns = PrepPatterns(config.WritablePatterns)
	return config
}

func SaveConfig(config Config) error {
	path := getConfigYamlPath()
	reader := bytes.NewReader(nil)
	if data, err := yaml.Marshal(config); err == nil {
		reader.Reset(data)
		err = atomic.WriteFile(path, reader)
		return err
	}
	return nil
}

func getConfigYamlPath() string {
	place := getProfilePath()
	return filepath.Join(place, "config.yaml")
}

func getConfigJsonPath() string {
	place := getProfilePath()
	return filepath.Join(place, "config.json")
}

func getProfilePath() string {
	place := ""
	for _, e := range os.Environ() {
		pair := strings.SplitN(e, "=", 2)
		if pair[0] == "PROFILE_PLACE" {
			place = pair[1]
		}
	}
	if place == "" {
		place = getDefaultProfilePath()
	}
	return place
}

func getDefaultProfilePath() string {
	place := ""
	if runtime.GOOS == "windows" {
		pwd, err := os.Getwd()
		if err != nil {
			panic(err)
		}
		place = pwd
	} else if runtime.GOOS == "darwin" {
		place = os.Getenv("HOME") + "/Library/Application Support/" + APP_ID
	} else {
		ex, err := os.Executable()
		if err != nil {
			panic(err)
		}
		place = filepath.Dir(ex)
	}
	return place
}

func GetLegacyStoragePath() string {
	place := getProfilePath()
	return filepath.Join(place, "storage.json")
}

func GetBoltStoragePath() string {
	place := getProfilePath()
	return filepath.Join(place, "storage.db")
}

func GetPreviewsPath() string {
	place := getProfilePath()
	return filepath.Join(place, "previews")
}
