@echo off
cd ..

set GO111MODULE=on

if "%VERSION%"=="" set VERSION=dev

echo Building version: %VERSION%

call npm --prefix ui run release
if errorlevel 1 exit /b %errorlevel%

go build -ldflags "-H=windowsgui"
