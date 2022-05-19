#!/bin/sh

NAME="${1:-goHFS}"

rm ./${NAME}
go build -trimpath -o ${NAME}
