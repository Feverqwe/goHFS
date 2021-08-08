package internal

import (
	"github.com/getlantern/systray"
	"goHfs/asserts"
	"log"
	"os"
	"path/filepath"
	"runtime"
)

import "github.com/skratchdot/open-golang/open"

var icon []byte

func TrayIcon(config *Config, callChan chan string) {
	pwd := ""
	if _pwd, err := os.Getwd(); err == nil {
		pwd = _pwd
	}

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
		// mSetPublicPath := subConfig.AddSubMenuItem("Set public path", "Set public path")
		mEditConfig := subConfig.AddSubMenuItem("Edit config", "Edit config")
		mOpenConfigPath := subConfig.AddSubMenuItem("Open config path", "Open config path")
		mReloadConfig := subConfig.AddSubMenuItem("Reload config", "Reload config")

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
				case <-mEditConfig.ClickedCh:
					err := open.Run(filepath.Join(pwd, "config.json"))
					if err != nil {
						log.Println("Open config error", err)
					}
				/*case <-mSetPublicPath.ClickedCh:
				  fmt.Println("mSetPublicPath")
				  // todo: fix me*/
				case <-mOpenConfigPath.ClickedCh:
					err := open.Run(pwd)
					if err != nil {
						log.Println("Open config path error", err)
					}
				case <-mReloadConfig.ClickedCh:
					callChan <- "reloadConfig"
					callChan <- "restartServer"
				}
			}
		}()
	}

	onExit := func() {}

	go func() {
		systray.Run(onRun, onExit)
	}()
}
