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
go build -ldflags -H=windowsgui -trimpath -o goHFS.exe
````

Build mac app
---
```
go build -trimpath -o goHFS
go get github.com/strosel/appify
go install github.com/strosel/appify
~/go/bin/appify -menubar -name goHFS -author "Anton V" -id com.rndnm.gohfs -icon ./assets/icon.icns goHFS
rm ./goHFS.app/Contents/README
```

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
