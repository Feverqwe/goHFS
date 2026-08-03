# Go backend agent guide

These instructions extend the root `AGENTS.md` for code under `internal/`.

## Architecture

- `router.go` implements an ordered, middleware-style router. An empty path/method is a wildcard, `^` means path prefix, and `$` means path suffix. A handler continues the chain only by invoking the callback returned by `GetNext`.
- `api.go` owns endpoints below `/~/`. Successful and failed JSON responses use the shared `JsonSuccessResponse`/`JsonFailResponse` envelope through `apiCall` and `writeApiResult`.
- `fileIndex.go` serves directory pages and injects `window.ROOT_STORE` into the embedded HTML. Ordinary files fall through to the file-serving handlers assembled in `main.go`.
- `config.go` loads YAML, migrates legacy JSON, prepares writable patterns, and maps virtual places to the public root or configured links.
- `boltStorage/` is the active UI-state store. `storage.go` is legacy/migration-era JSON storage and should not be used for new state without a deliberate migration decision.
- `preview.go` owns the preview queue, cache, failure state, workers, and `ffmpeg`/`ffprobe` subprocesses.

## Backend conventions

- Normalize request paths with `NormalizePath`, then resolve them with `Config.GetPlaceOsPath`; do not concatenate untrusted URL paths with OS paths directly.
- Before mkdir, rename, remove, or upload operations, verify the resulting virtual path with `Config.IsWritable`.
- Keep endpoint payload field names compatible with `ui/src/tools/api.ts` and response shapes compatible with `ui/src/types.ts`.
- Return API errors through the existing response helpers. Use direct status codes for file-serving and access-control failures where the current handler family does so.
- Close files, databases, processes, and preview managers on every path that acquires them. Pay particular attention to server reloads and background workers.
- Preserve concurrency protection around shared state and caches. Run `go test -race ./...` when changing goroutines, channels, preview scheduling, storage, or reload behavior.
- Follow existing build-tag splits:
  - macOS: dialogs, caffeinate power control, and tray UI.
  - Windows: mutex, dialogs, execution-state power control, and tray UI.
  - Linux: no-op tray/power behavior plus the shared Windows/Linux dialog implementation.
- Format changed Go files with `gofmt` and run `go test ./...`; also run `go vet ./...` for non-trivial backend changes.

## Testing guidance

- Prefer table-driven tests in `*_test.go` beside the package being tested.
- High-value units include virtual-path normalization/resolution, writable-pattern precedence, router matching/continuation, API envelopes, storage serialization, and preview duration parsing.
- Use `httptest` for handlers and temporary directories for filesystem cases. Do not write tests against the user's real profile directory; set `PROFILE_PLACE` to a test-owned temporary directory when profile behavior is involved.

