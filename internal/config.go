package internal

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
)

type Config struct {
	Port                  int
	Address               string
	Public                string
	ShowHiddenFiles       bool
	ExtHandle             map[string]string
	WritablePlacePatterns []string
}

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

func (s *Config) GetFileHandler(ext string) (string, bool) {
	val, ok := s.ExtHandle[ext]
	return val, ok
}

func (s *Config) IsWritable(path string, isDir bool) bool {
	if isDir && path[len(path)-1:] != "/" {
		path += "/"
	}

	for _, pattern := range s.WritablePlacePatterns {
		m, _ := filepath.Match(pattern, path)
		if m {
			return true
		}
	}
	return false
}

func getNewConfig() Config {
	var config = Config{
		ExtHandle:             make(map[string]string),
		WritablePlacePatterns: make([]string, 0),
	}
	pwd := getProfilePath()
	config.Port = 80
	config.Public = pwd
	config.ShowHiddenFiles = false
	return config
}

func LoadConfig() Config {
	config := getNewConfig()

	path := getConfigPath()

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			err := SaveConfig(config)
			if err != nil {
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
	}

	return config
}

func SaveConfig(config Config) error {
	path := getConfigPath()
	if data, err := json.MarshalIndent(config, "", "  "); err == nil {
		err = ioutil.WriteFile(path, data, 0644)
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
	} else {
		ex, err := os.Executable()
		if err != nil {
			panic(err)
		}
		place = filepath.Dir(ex)
	}
	return place
}
