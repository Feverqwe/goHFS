#!/bin/sh

BINARY="goHFS"
NAME="goHFS"
AUTHOR="Anton V"
APP_ID="com.rndnm.gohfs"
ICON_PATH="./assets/icon.icns"

sh ./scripts/build.sh ${BINARY}

rm -r ./${NAME}.app
~/go/bin/appify -menubar -name ${NAME} -author "${AUTHOR}" -id ${APP_ID} -icon ${ICON_PATH} ${BINARY}
rm ./${NAME}.app/Contents/README
