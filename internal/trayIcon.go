//go:build darwin || windows

package internal

import (
	"goHfs/assets"
	"log"
	"strconv"

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
		mOpenUpload := systray.AddMenuItem("Open upload path", "Open upload path")

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
				case <-mOpenUpload.ClickedCh:
					err := open.Run(config.Upload)
					if err != nil {
						log.Println("Open path error", err)
					}
				case <-mSetPublicPath.ClickedCh:
					result, err := ShowFolderSelection("Change public path", config.Public)
					if err != nil {
						if err.Error() != "Canceled" {
							log.Println("Select folder error", err)
						}
					} else {
						config.Public = result
						if err := SaveConfig(*config); err == nil {
							callChan <- "reload"
						}
					}
				case <-mSetUploadPath.ClickedCh:
					result, err := ShowFolderSelection("Change upload path", config.Upload)
					if err != nil {
						if err.Error() != "Canceled" {
							log.Println("Select folder error", err)
						}
					} else {
						config.Upload = result
						if err := SaveConfig(*config); err == nil {
							callChan <- "reload"
						}
					}
				case <-mSetPort.ClickedCh:
					result, err := ShowEntry("Change port", "Enter port number:", strconv.Itoa(config.Port))
					if err != nil {
						if err.Error() != "Canceled" {
							log.Println("Enter port error", err)
						}
					} else {
						portStr := result
						if port, err := strconv.Atoi(portStr); err == nil {
							config.Port = port
							if err := SaveConfig(*config); err == nil {
								callChan <- "reload"
							}
						}
					}
				case <-mSetAddress.ClickedCh:
					result, err := ShowEntry("Change address", "Enter address:", config.Address)
					if err != nil {
						if err.Error() != "Canceled" {
							log.Println("Enter address error", err)
						}
					} else {
						config.Address = result
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
