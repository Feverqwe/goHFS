package internal

import (
	"log"
	"net"
	"strconv"
)

func GetAddresses(port int) []string {
	portPostfix := ""
	if port != 80 {
		portPostfix = ":" + strconv.Itoa(port)
	}
	result := make([]string, 0)
	ifaces, err := net.Interfaces()
	if err != nil {
		log.Println("Interfaces error", err)
		return result
	}
	for _, iface := range ifaces {
		addrs, err := iface.Addrs()
		if err != nil {
			log.Println("Get interface addrs error", err)
			continue
		}
		for _, a := range addrs {
			switch v := a.(type) {
			case *net.IPAddr:
				result = append(result, "http://"+v.String()+portPostfix)
			}
		}
	}
	return result
}
