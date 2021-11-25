package internal

import (
	"context"
	"goHfs/assets"
	"log"
	"strconv"

	"github.com/gabyx/githooks/githooks/apps/dialog/gui"
	"github.com/gabyx/githooks/githooks/apps/dialog/settings"
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
					props := settings.FileSelection{}
					props.OnlyDirectories = true
					props.Root = config.Public

					result, err := gui.ShowFileSelection(context.TODO(), &props)
					if err != nil {
						log.Println("Select folder error", err)
					} else if result.IsOk() && len(result.Paths) > 0 {
						config.Public = result.Paths[0]
						if err := SaveConfig(*config); err == nil {
							callChan <- "reload"
						}
					}
				case <-mSetUploadPath.ClickedCh:
					props := settings.FileSelection{}
					props.OnlyDirectories = true
					props.Root = config.Upload

					result, err := gui.ShowFileSelection(context.TODO(), &props)
					if err != nil {
						log.Println("Select folder error", err)
					} else if result.IsOk() && len(result.Paths) > 0 {
						config.Upload = result.Paths[0]
						if err := SaveConfig(*config); err == nil {
							callChan <- "reload"
						}
					}
				case <-mSetPort.ClickedCh:
					props := settings.Entry{}
					props.DefaultCancel = true
					props.DefaultEntry = strconv.Itoa(config.Port)
					props.Title = "Change port"
					props.Text = "Enter port number:"

					result, err := gui.ShowEntry(context.TODO(), &props)
					if err != nil {
						log.Println("Enter port error", err)
					} else if result.IsOk() {
						portStr := result.Text
						if port, err := strconv.Atoi(portStr); err == nil {
							config.Port = port
							if err := SaveConfig(*config); err == nil {
								callChan <- "reload"
							}
						}
					}
				case <-mSetAddress.ClickedCh:
					props := settings.Entry{}
					props.DefaultCancel = true
					props.DefaultEntry = config.Address
					props.Title = "Change address"
					props.Text = "Enter address:"

					result, err := gui.ShowEntry(context.TODO(), &props)
					if err != nil {
						log.Println("Enter address error", err)
					} else if result.IsOk() {
						config.Address = result.Text
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
