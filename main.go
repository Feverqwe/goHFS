package main

import (
	"flag"
	"fmt"
	"goHfs/internal"
	boltstorage "goHfs/internal/boltStorage"
	"log"
	"net/http"
	"os"
)

var DEBUG_UI = os.Getenv("DEBUG_UI") == "1"

func main() {
	if _, err := internal.CreateMutex("GoHFS"); err != nil {
		panic(err)
	}

	var config internal.Config

	var powerControl = internal.GetPowerControl()

	_, dbErr := os.Stat(internal.GetBoltStoragePath())
	storage := boltstorage.GetStorage(internal.GetBoltStoragePath())

	if os.IsNotExist(dbErr) {
		log.Println("Migrate to bolt")
		oldStorage := internal.GetStorage(internal.GetStoragePath())
		kv := oldStorage.GetKeys(nil)
		storage.SetObject(kv)
		oldStorage = nil
	}

	callChan := make(chan string)

	doReload := func() {
		callChan <- "reload"
	}

	go func() {
		var httpServer *http.Server

		go doReload()

		for {
			v := <-callChan
			fmt.Println("callChan", v)

			switch v {
			case "reload":
				config = internal.LoadConfig()

				if httpServer != nil {
					httpServer.Close()
				}

				router := internal.NewRouter()

				powerLock(router, powerControl)
				internal.HandleApi(router, &config, storage, DEBUG_UI, doReload)
				internal.HandleDir(router, &config, storage, DEBUG_UI)
				fsServer(router)

				address := config.GetAddress()

				log.Printf("Listening on %s...", address)
				httpServer = &http.Server{
					Addr:    address,
					Handler: router,
				}

				go func() {
					err := httpServer.ListenAndServe()
					if err != nil {
						log.Println("Server error", err)
					}
				}()
			}
		}
	}()

	disableTrayIconPtr := flag.Bool("disableTrayIcon", false, "Disable tray icon")
	flag.Parse()

	if !*disableTrayIconPtr {
		internal.TrayIcon(&config, callChan)
	} else {
		loopChan := make(chan string)
		<-loopChan
	}
}

func powerLock(router *internal.Router, powerControl *internal.PowerControl) {
	if powerControl == nil {
		return
	}
	router.Use(func(w http.ResponseWriter, r *http.Request) {
		powerControl.Inc()
		defer powerControl.Dec()

		if next, ok := internal.GetNext(r); ok {
			next()
		}
	})
}

func fsServer(router *internal.Router) {
	router.All("/index.html$", func(w http.ResponseWriter, r *http.Request) {
		p, ok := internal.GetParam[string](r, "path")
		if !ok {
			w.WriteHeader(403)
			return
		}

		file, err := os.Open(p)
		if err != nil {
			internal.HandleOpenFileError(err, w)
			return
		}
		defer file.Close()

		stat, err := file.Stat()
		if err != nil {
			internal.HandleOpenFileError(err, w)
			return
		}

		http.ServeContent(w, r, stat.Name(), stat.ModTime(), file)
	})

	router.Use(func(w http.ResponseWriter, r *http.Request) {
		p, ok := internal.GetParam[string](r, "path")
		if !ok {
			w.WriteHeader(403)
			return
		}

		http.ServeFile(w, r, p)
	})
}
