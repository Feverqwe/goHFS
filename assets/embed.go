package assets

import "embed"

// WWW contains the production UI and the tray icon used by the application.
//
//go:embed icon.ico www/*
var WWW embed.FS
