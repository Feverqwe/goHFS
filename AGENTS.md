# GoHFS agent guide

## Project overview

GoHFS is a cross-platform desktop file server. The Go application exposes files and a JSON API over HTTP, persists UI state in BoltDB, generates previews with `ffmpeg`, and provides platform-specific tray/dialog/power-management integrations. The browser UI is a React/TypeScript application built with Rspack and embedded into the Go binary.

## Repository map

- `main.go`: process lifecycle, server reload loop, router assembly, and tray/no-tray startup.
- `internal/`: HTTP routing, API handlers, path security, config, indexing, persistence, previews, and OS-specific integrations. See `internal/AGENTS.md`.
- `ui/`: React 19 and TypeScript UI. See `ui/AGENTS.md`.
- `assets/bindata.go`: generated embedded assets consumed by the Go application.
- `scripts/`: build, run, resource-generation, and packaging scripts.
- `FILE_windows.syso`, `assets/icon.ico`, `assets/icon.icns`: platform packaging resources.

## Development workflow

Use the smallest relevant verification set for a change:

```sh
# Go formatting and checks
gofmt -w <changed-go-files>
go test ./...
go vet ./...

# UI checks
cd ui
npm run tsc
npm run lint
npm run build
```

Useful project commands:

```sh
./scripts/build.sh       # build the Go binary
./scripts/run.sh         # build and run with embedded UI
./scripts/run.sh dev     # serve UI files from ui/dist
./scripts/build.mac.sh   # create the macOS app bundle
```

There is currently no dedicated automated test suite. For behavior changes, add focused Go tests where practical and at minimum run the compile/type/lint checks relevant to the files changed.

## Generated and local files

- Edit UI sources under `ui/src`, not `ui/dist` or `assets/www`.
- `npm run release` rebuilds `ui/dist` and copies it to ignored `assets/www`.
- `./scripts/build.resources.sh` regenerates the tracked `assets/bindata.go` from `assets/www` and icons. Regenerate it only when the task calls for updating embedded production assets; expect a large diff.
- Treat `ui/fork/@oplayer/**/dist` as vendored player code. Do not reformat or rewrite it incidentally.
- Do not commit runtime/profile data such as `config.json`, `config.yaml`, `storage.json`, `storage.db`, `previews/`, or `open.lock`.
- Do not commit local build products such as `goHFS`, `goHFS.exe`, `goHFS.app`, `ui/dist`, or `assets/www`.

## Cross-cutting rules

- Preserve the contract between Go JSON structs in `internal/` and TypeScript interfaces/API calls in `ui/src/types.ts` and `ui/src/tools/api.ts`. Update both sides when the contract changes.
- Keep filesystem operations behind normalized virtual paths and the configured public/link roots. Writable operations must continue to enforce `Config.IsWritable`.
- Preserve route ordering: the custom router is an ordered middleware chain, not `http.ServeMux`.
- Keep OS-specific behavior behind existing Go build tags. When introducing a platform-specific symbol, provide implementations for every supported build target or a correctly tagged fallback.
- Prefer focused changes. Do not modernize unrelated code, generated assets, dependencies, or formatting as part of a feature fix.
- Never silently weaken path validation, upload-signature checks, or writable-pattern checks.
