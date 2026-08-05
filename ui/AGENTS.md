# Web UI agent guide

These instructions extend the root `AGENTS.md` for code under `ui/`.

## Architecture

- `src/folder.tsx` and `src/player.tsx` are the two Rspack entry points.
- `src/components/Folder/` contains browsing, selection, uploads, file actions, dialogs, sorting, previews, and display modes.
- `src/components/Player/` contains media playback and URL/metadata handling.
- `src/components/Player/components/Video2/` is the active player. It uses Video.js for playback and controls, Hls.js for supported HLS sources, a custom track controller for subtitles/audio, and colocated MUI-styled overrides for the Video.js UI.
- `src/components/RootStore/` owns the server-provided directory state and refresh operation.
- `src/tools/api.ts` is the typed API surface; `src/tools/apiRequest.ts` unwraps the backend response envelope.
- `src/types.ts` mirrors JSON produced by Go structs such as `internal.RootStore` and `internal.File`.

## UI conventions

- Use strict TypeScript and React function components/hooks. Follow the existing colocated component structure rather than adding a new global abstraction for one use.
- Preserve the project's Prettier style: single quotes, no spaces inside object braces, trailing commas, and a 100-column target.
- Use Material UI components and the existing theme/cache helpers for UI consistent with the rest of the application.
- Put backend calls in `src/tools/api.ts` and use the shared response handler. Keep request/response types explicit for new endpoints.
- Use TanStack React Query for all server state. Read data with `useQuery` and perform writes with `useMutation`; do not manage request loading, error, race, or response state manually with `useEffect`/`useState`.
- Define reusable query keys in `src/tools/queryClient.ts`. Query keys must include every input that can change the response, such as the current place, search pattern, or resource identifier.
- After a successful mutation, update or invalidate every affected query through the shared `QueryClient`. Use `refetch` only for an explicit user refresh of the same query; do not bypass the query cache by calling API methods directly from components.
- Use React Query's `enabled`, `isPending`/`isFetching`, `error`, caching, cancellation, and retry behavior instead of duplicating those mechanisms in component state. Keep only genuinely local UI state, such as an unsubmitted input value or dialog visibility, in React state.
- The initial folder state comes from the `window.ROOT_STORE` script injected by Go. Any change to that state shape must also update the Go structs and injection path.
- Keep public asset URLs under `/~/www`; Rspack's `publicPath` and the Go asset handler depend on this prefix.
- Do not edit `dist/` directly. Work in `src/`, run the UI checks, and regenerate embedded resources only if the requested deliverable includes production assets.
- Keep the Video.js instance lifecycle inside the player effect: dispose the player, destroy any Hls.js instance, unregister listeners, and clear custom DOM on cleanup.
- Keep Video.js UI overrides scoped through `Video2/styles.ts`. Prefer Video.js component options over CSS hiding when a built-in control or child component can be disabled through configuration.
- Preserve the custom track-controller path and non-native subtitle rendering when changing HLS, subtitle, or audio-track behavior.
- Maintain upload protocol compatibility: init returns a signed key and chunk size, and subsequent multipart chunks include the fields expected by `internal/api.go`.

## Verification

From `ui/`, run:

```sh
npm run tsc
npm run lint
npm run build
```

For a release/embedding change, additionally run `npm run release` from `ui/`, then `./scripts/build.resources.sh` and `go test ./...` from the repository root. Review the generated `assets/bindata.go` diff separately because it is large.
