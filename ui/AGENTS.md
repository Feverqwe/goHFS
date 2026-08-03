# Web UI agent guide

These instructions extend the root `AGENTS.md` for code under `ui/`.

## Architecture

- `src/folder.tsx` and `src/player.tsx` are the two Rspack entry points.
- `src/components/Folder/` contains browsing, selection, uploads, file actions, dialogs, sorting, previews, and display modes.
- `src/components/Player/` contains media playback and URL/metadata handling.
- `src/components/RootStore/` owns the server-provided directory state and refresh operation.
- `src/tools/api.ts` is the typed API surface; `src/tools/apiRequest.ts` unwraps the backend response envelope.
- `src/types.ts` mirrors JSON produced by Go structs such as `internal.RootStore` and `internal.File`.
- `fork/@oplayer/**/dist` is a checked-in, prebuilt player dependency used by `Video2`. Treat it as vendored unless the task explicitly targets that fork.

## UI conventions

- Use strict TypeScript and React function components/hooks. Follow the existing colocated component structure rather than adding a new global abstraction for one use.
- Preserve the project's Prettier style: single quotes, no spaces inside object braces, trailing commas, and a 100-column target.
- Use Material UI components and the existing theme/cache helpers for UI consistent with the rest of the application.
- Put backend calls in `src/tools/api.ts` and use the shared response handler. Keep request/response types explicit for new endpoints.
- The initial folder state comes from the `window.ROOT_STORE` script injected by Go. Any change to that state shape must also update the Go structs and injection path.
- Keep public asset URLs under `/~/www`; Rspack's `publicPath` and the Go asset handler depend on this prefix.
- Do not edit `dist/` directly. Work in `src/`, run the UI checks, and regenerate embedded resources only if the requested deliverable includes production assets.
- Maintain upload protocol compatibility: init returns a signed key and chunk size, and subsequent multipart chunks include the fields expected by `internal/api.go`.

## Verification

From `ui/`, run:

```sh
npm run tsc
npm run lint
npm run build
```

For a release/embedding change, additionally run `npm run release` from `ui/`, then `./scripts/build.resources.sh` and `go test ./...` from the repository root. Review the generated `assets/bindata.go` diff separately because it is large.
