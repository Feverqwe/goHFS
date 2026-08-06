#!/usr/bin/env sh

set -e

source "$(dirname $0)/_variables.sh"

sh ./scripts/build.ui.sh

if [ -f "./${BINARY}" ]; then
    rm ./${BINARY}
fi

go build -trimpath -o ${BINARY}
