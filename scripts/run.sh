#!/usr/bin/env sh

set -e

source "$(dirname $0)/_variables.sh"

if [ "$1" = "dev" ]; then
    export DEBUG_UI=1
fi

sh ./scripts/build.sh
./$BINARY
