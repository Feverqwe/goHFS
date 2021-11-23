package internal

import (
	"goHfs/assets"
	"log"
	"strconv"

	"github.com/gen2brain/dlgs"
	"github.com/getlantern/systray"
	"github.com/skratchdot/open-golang/open"
)

var icon []byte

func TrayIcon(config *Config, callChan chan string) {
	if icon == nil {
		data, err := assets.Asset("icon.ico")
		if err != nil {
			panic(err)
		}
		icon = data
	}

	onRun := func() {
		if icon != nil {
			systray.SetTemplateIcon(icon, icon)
		}
		systray.SetTooltip("GoHFS")

		mOpen := systray.AddMenuItem("Open", "Open")

		subConfig := systray.AddMenuItem("Config", "Config")
		mSetPublicPath := subConfig.AddSubMenuItem("Set public path", "Set public path")
		mSetUploadPath := subConfig.AddSubMenuItem("Set upload path", "Set upload path")
		mSetPort := subConfig.AddSubMenuItem("Set port", "Set port")
		mSetAddress := subConfig.AddSubMenuItem("Set address", "Set address")
		mShowHiddenFiles := subConfig.AddSubMenuItemCheckbox("Show hidden files", "Show hidden files", config.ShowHiddenFiles)

		mQuit := systray.AddMenuItem("Quit", "Quit")

		go func() {
			for {
				select {
				case <-mQuit.ClickedCh:
					systray.Quit()
				case <-mOpen.ClickedCh:
					err := open.Run(config.GetBrowserAddress())
					if err != nil {
						log.Println("Open url error", err)
					}
				case <-mSetPublicPath.ClickedCh:
					path, success, err := dlgs.File("Select folder", "", true)
					if err != nil {
						log.Println("Select folder error", err)
					} else if success {
						config.Public = path
						if err := SaveConfig(*config); err == nil {
							callChan <- "reload"
						}
					}
				case <-mSetUploadPath.ClickedCh:
					path, success, err := dlgs.File("Select folder", "", true)
					if err != nil {
						log.Println("Select folder error", err)
					} else if success {
						config.Upload = path
						if err := SaveConfig(*config); err == nil {
							callChan <- "reload"
						}
					}
				case <-mSetPort.ClickedCh:
					portStr, success, err := dlgs.Entry("Set port", "Enter port:", strconv.Itoa(config.Port))
					if err != nil {
						log.Println("Enter port error", err)
					} else if success {
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
					} else if success {
						config.Address = address
						if err := SaveConfig(*config); err == nil {
							callChan <- "reload"
						}
					}
				case <-mShowHiddenFiles.ClickedCh:
					if config.ShowHiddenFiles {
						config.ShowHiddenFiles = false
						mShowHiddenFiles.Uncheck()
					} else {
						config.ShowHiddenFiles = true
						mShowHiddenFiles.Checked()
					}
					if err := SaveConfig(*config); err == nil {
						callChan <- "reload"
					}
				}
			}
		}()
	}

	onExit := func() {}

	systray.Run(onRun, onExit)
}
