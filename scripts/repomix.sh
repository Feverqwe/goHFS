#!/usr/bin/env sh

set -e

source "$(dirname $0)/_variables.sh"

npx repomix@latest

go run "$(dirname $0)/repomix-collector/collector.go" --input ./repomix-output.md
