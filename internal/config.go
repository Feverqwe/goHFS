package internal

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strconv"
)

type Config struct {
	Port    int
	Address string
	Public  string
}

func (self *Config) GetAddress() string {
	return self.Address + ":" + strconv.Itoa(self.Port)
}

func (self *Config) GetBrowserAddress() string {
	addr := self.Address
	if addr == "" {
		addr = "127.0.0.1"
	}
	return "http://" + addr + ":" + strconv.Itoa(self.Port)
}

func getNewConfig() Config {
	var config = Config{}
	pwd, err := os.Getwd()
	if err != nil {
		panic(err)
	}
	config.Port = 80
	config.Public = pwd
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
	}

	return config
}

func SaveConfig(config Config) error  {
	path := getConfigPath()
	if data, err := json.Marshal(config); err == nil {
		err = ioutil.WriteFile(path, data, 0644)
		return err;
	}
	return nil
}

func getConfigPath() string  {
	path := ""
	if pwd, err := os.Getwd(); err == nil {
		path = filepath.Join(pwd, "config.json")
	}
	return path
}
