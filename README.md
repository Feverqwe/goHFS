<div align="center">
	<img src="assets/screenshot1.png" alt=""/>
	<h1>GoHFS</h1>
	<p>
		<b>Simple file server</b>
	</p>
	<br>
	<br>
	<br>
</div>

Build exe
---
````
rename FILE_windows.syso FILE.syso
go build -ldflags -H=windowsgui -trimpath -o goHFS.exe
````

Build mac app
---
```
./scripts/build.mac.sh
```

Build application with embedded UI
---
````
./scripts/build.sh
````

The build script compiles the UI, copies it to `assets/www`, and embeds it in the Go binary.

File icon, use rsrc 
---
````
.\rsrc_windows_amd64.exe -ico .\icon.ico -o FILE_windows.syso
````
