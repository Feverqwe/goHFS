# GoHFS agent upload

Upload only the files the user asked you to send. The destination is the folder
specified in the instruction link. Use the same scheme, host and port as that
link and use this path for the upload requests:

```text
{{uploadPath}}
```

## HTTP API

1. **POST** with `Content-Type: application/json` and a body such as
   `{"name":"report.pdf","size":12345}`. Use the file's exact size in bytes and
   its destination basename. The destination folder must exist and allow writes.
   A successful response is HTTP 201 with
   `{"result":{"token":"…","chunkSize":{{chunkSize}}}}`.
2. **PATCH** with `Content-Type: application/octet-stream`, `Upload-Token` from
   step 1, and `Upload-Offset` equal to the zero-based byte offset. Send only
   that chunk's raw bytes as the body. Start at offset 0 and keep each chunk
   at or below `chunkSize`. Send an empty PATCH at offset 0 for a zero-byte file.
3. HTTP 200 returns `{"result":{"offset":12345,"complete":true}}`. If
   `complete` is false, continue at the returned offset. If the proxy returns
   HTTP 413, retry the same offset with a smaller chunk. If a request times out,
   retry the same chunk with the same token and offset. Stop on other errors
   and report the status and response to the user.

Existing files are preserved. If the server restarts or the upload token
expires, start a new upload. Report success only after the server returns
`complete: true`.

## Automated upload with curl

Save the following as `gohfs-upload.sh` and run
`bash gohfs-upload.sh 'INSTRUCTION_URL' 'LOCAL_FILE'`. Pass the exact URL the
user supplied, including its query string. The script uses curl and jq.

```bash
set -euo pipefail

url=${1:?Provide the GoHFS instruction URL}
file=${2:?Provide the local file to upload}
name=${file##*/}
size=$(wc -c < "$file" | tr -d '[:space:]')
payload=$(jq -n --arg name "$name" --argjson size "$size" '{name: $name, size: $size}')
init=$(curl -fsS -H 'Content-Type: application/json' --data-binary "$payload" "$url")
token=$(jq -er '.result.token' <<< "$init")
chunk_size=$(jq -er '.result.chunkSize' <<< "$init")

tmp=$(mktemp -d)
trap 'rm -f "$tmp/chunk" "$tmp/reply"; rmdir "$tmp"' EXIT
offset=0

while :; do
  dd if="$file" of="$tmp/chunk" bs="$chunk_size" skip="$((offset / chunk_size))" count=1 2>/dev/null
  status=$(curl -sS --retry 3 -o "$tmp/reply" -w '%{http_code}' \
    -X PATCH -H 'Content-Type: application/octet-stream' \
    -H "Upload-Token: $token" -H "Upload-Offset: $offset" \
    --data-binary "@$tmp/chunk" "$url")
  case "$status" in
    200)
      if jq -e '.result.complete == true' "$tmp/reply" >/dev/null; then
        printf 'Uploaded %s\n' "$name"
        break
      fi
      offset=$(jq -er '.result.offset' "$tmp/reply")
      ;;
    413)
      if ((chunk_size <= 1)); then
        printf 'The proxy rejected a one-byte chunk.\n' >&2
        exit 1
      fi
      # The advertised chunk size is a power of two, so the offset stays aligned.
      chunk_size=$((chunk_size / 2))
      ;;
    *)
      printf 'Upload failed (HTTP %s).\n' "$status" >&2
      cat "$tmp/reply" >&2
      exit 1
      ;;
  esac
done
```
