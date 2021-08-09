package internal

import (
	"github.com/gen2brain/dlgs"
	"github.com/getlantern/systray"
	"goHfs/asserts"
	"log"
	"os"
	"runtime"
	"strconv"
)

import "github.com/skratchdot/open-golang/open"

var icon []byte

func TrayIcon(config *Config, callChan chan string) {
	if icon == nil {
		if runtime.GOOS == "windows" {
			data, err := asserts.Asset("icon.ico")
			if err != nil {
				panic(err)
			}
			icon = data
		}
	}

	onRun := func() {
		if icon != nil {
			systray.SetTemplateIcon(icon, icon)
		}
		systray.SetTitle("GoHFS")
		systray.SetTooltip("GoHFS")

		mOpen := systray.AddMenuItem("Open", "Open")

		subConfig := systray.AddMenuItem("Config", "Config")
		mSetPublicPath := subConfig.AddSubMenuItem("Set public path", "Set public path")
		mSetPort := subConfig.AddSubMenuItem("Set port", "Set port")
		mSetAddress := subConfig.AddSubMenuItem("Set address", "Set address")

		mQuit := systray.AddMenuItem("Quit", "Quit")

		go func() {
			for {
				select {
				case <-mQuit.ClickedCh:
					systray.Quit()
					os.Exit(0)
				case <-mOpen.ClickedCh:
					err := open.Run(config.GetBrowserAddress())
					if err != nil {
						log.Println("Open url error", err)
					}
				case <-mSetPublicPath.ClickedCh:
					path, success, err := dlgs.File("Select folder", "", true)
					if err != nil {
						log.Println("Select folder error", err)
					} else
					if success {
						config.Public = path
						if err := SaveConfig(*config); err == nil {
							callChan <- "reload"
						}
					}
				case <-mSetPort.ClickedCh:
					portStr, success, err := dlgs.Entry("Set port", "Enter port:", strconv.Itoa(config.Port))
					if err != nil {
						log.Println("Enter port error", err)
					} else
					if success {
						if port, err := strconv.Atoi(portStr); err == nil {
							config.Port = port
							if err := SaveConfig(*config); err == nil {
								callChan <- "reload"
							}
						}
					}
				case <-mSetAddress.ClickedCh:
					address, success, err := dlgs.Entry("Set address", "Enter address:", config.Address)
					if err != nil {
						log.Println("Enter address error", err)
					} else
					if success {
						config.Address = address
						if err := SaveConfig(*config); err == nil {
							callChan <- "reload"
						}
					}
				}
			}
		}()
	}

	onExit := func() {}

	go func() {
		systray.Run(onRun, onExit)
	}()
}
