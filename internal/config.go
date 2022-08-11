package internal

import (
	"bytes"
	"encoding/json"
	"log"
	"os"
	"path"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/natefinch/atomic"
)

type Config struct {
	Port             int
	Address          string
	Public           string
	Name             string
	ShowHiddenFiles  bool
	ExtHandle        map[string]string
	WritablePatterns []string
	Salt             string
}

var APP_ID = "com.rndnm.gohfs"

func (s *Config) GetAddress() string {
	return s.Address + ":" + strconv.Itoa(s.Port)
}

func (s *Config) GetBrowserAddress() string {
	addr := s.Address
	if addr == "" {
		addr = "127.0.0.1"
	}
	return "http://" + addr + ":" + strconv.Itoa(s.Port)
}

func (s *Config) IsWritable(targetPath string, isDir bool) bool {
	lowPath := strings.ToLower(targetPath)
	if isDir && lowPath[len(lowPath)-1:] != "/" {
		lowPath += "/"
	}

	for _, pattern := range s.WritablePatterns {
		lowPattern := strings.ToLower(pattern)

		// like /a/b/c/**
		if len(lowPattern) > 1 && lowPattern[len(lowPattern)-2:] == "**" {
			lowPattern = lowPattern[0 : len(lowPattern)-1]

			slashCount := strings.Count(lowPattern, "/")
			lastIndex := slashCount + 1
			pathParts := strings.SplitN(lowPath, "/", lastIndex+1)
			if len(pathParts) < lastIndex {
				continue
			}
			lowPath = strings.Join(pathParts[0:lastIndex], "/")
		}

		m, _ := path.Match(lowPattern, lowPath)
		if m {
			return true
		}
	}
	return false
}

func getNewConfig() Config {
	var config = Config{
		ExtHandle:        make(map[string]string),
		WritablePatterns: make([]string, 0),
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

	path := getConfigPath()

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			if err := os.MkdirAll(getProfilePath(), 0750); err != nil {
				log.Println("Create profile path error", err)
			}

			if err := SaveConfig(config); err != nil {
				log.Println("Write new config error", err)
			}
		}
	} else {
		if err := json.Unmarshal(data, &config); err != nil {
			log.Println("Load config error", err)
		}
		if config.ExtHandle == nil {
			config.ExtHandle = make(map[string]string)
		}
		if len(config.Salt) == 0 {
			config.Salt = strconv.FormatInt(time.Now().Unix(), 10)
		}
	}

	return config
}

func SaveConfig(config Config) error {
	path := getConfigPath()
	if data, err := json.MarshalIndent(config, "", "  "); err == nil {
		reader := bytes.NewReader(data)
		err = atomic.WriteFile(path, reader)
		return err
	}
	return nil
}

func getConfigPath() string {
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
