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

Build app
---
````
go build -ldflags -H=windowsgui -trimpath
````

Build resources with go-bindata
---
````
go-bindata .\icon.ico .\folder.html
````

File icon, use rsrc 
---
````
.\rsrc_windows_amd64.exe -ico .\icon.ico -o FILE.syso
````
