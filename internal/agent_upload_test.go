package internal

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

func TestAgentUpload(t *testing.T) {
	public := t.TempDir()
	destination := filepath.Join(public, "Project files")
	if err := os.Mkdir(destination, 0700); err != nil {
		t.Fatal(err)
	}
	config := Config{
		Public:               public,
		prepWritablePatterns: PrepPatterns([]string{"/Project files/*"}),
	}
	router := NewRouter()
	HandleApi(router, &config, nil, false, nil, nil)

	do := func(method, path, mediaType, token string, offset int, body []byte, wantStatus int) *httptest.ResponseRecorder {
		t.Helper()
		r := httptest.NewRequest(method, path, bytes.NewReader(body))
		r.Header.Set("Content-Type", mediaType)
		r.Header.Set("Upload-Token", token)
		r.Header.Set("Upload-Offset", strconv.Itoa(offset))
		w := httptest.NewRecorder()
		router.ServeHTTP(w, r)
		if w.Code != wantStatus {
			t.Fatalf("%s %s: got HTTP %d, want %d: %s", method, path, w.Code, wantStatus, w.Body)
		}
		return w
	}

	endpoint := "/~/agent.md?place=%2FProject+files"
	docs := do(http.MethodGet, endpoint, "", "", 0, nil, http.StatusOK)
	if !strings.Contains(docs.Body.String(), endpoint) {
		t.Fatal("instructions did not retain the requested destination")
	}
	do(http.MethodPost, "/~/agent.md?place=/", "application/json", "", 0,
		[]byte(`{"name":"denied.txt","size":6}`), http.StatusForbidden)

	start := func(name string, size int) (string, int) {
		t.Helper()
		body, err := json.Marshal(map[string]any{"name": name, "size": size})
		if err != nil {
			t.Fatal(err)
		}
		w := do(http.MethodPost, endpoint, "application/json", "", 0, body, http.StatusCreated)
		var response struct {
			Result struct {
				Token     string
				ChunkSize int
			}
		}
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatal(err)
		}
		return response.Result.Token, response.Result.ChunkSize
	}

	patch := func(token string, offset int, data []byte, status int) agentUploadProgress {
		t.Helper()
		w := do(http.MethodPatch, endpoint, "application/octet-stream", token, offset, data, status)
		var response struct {
			Result agentUploadProgress
		}
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatal(err)
		}
		return response.Result
	}

	token, maxChunk := start("report.bin", 6)
	patch(token, 0, make([]byte, maxChunk+1), http.StatusRequestEntityTooLarge)
	patch(token, 3, []byte("def"), http.StatusConflict)
	if got := patch(token, 0, []byte("abc"), http.StatusOK); got.Offset != 3 || got.Complete {
		t.Fatalf("unexpected partial upload status: %+v", got)
	}
	if _, err := os.Stat(filepath.Join(destination, "report.bin")); !os.IsNotExist(err) {
		t.Fatalf("incomplete file was published: %v", err)
	}
	patch(token, 0, []byte("xyz"), http.StatusConflict)
	patch(token, 0, []byte("abc"), http.StatusOK)
	for range 2 {
		if got := patch(token, 3, []byte("def"), http.StatusOK); got.Offset != 6 || !got.Complete {
			t.Fatalf("unexpected completed upload status: %+v", got)
		}
	}
	do(http.MethodPost, endpoint, "application/json", "", 0,
		[]byte(`{"name":"report.bin","size":6}`), http.StatusConflict)
	if data, err := os.ReadFile(filepath.Join(destination, "report.bin")); err != nil || string(data) != "abcdef" {
		t.Fatalf("unexpected published file: %q, %v", data, err)
	}

	emptyToken, _ := start("empty.txt", 0)
	if got := patch(emptyToken, 0, nil, http.StatusOK); !got.Complete {
		t.Fatalf("empty upload did not complete: %+v", got)
	}
	if stat, err := os.Stat(filepath.Join(destination, "empty.txt")); err != nil || stat.Size() != 0 {
		t.Fatalf("empty file was not published: %v", err)
	}
}
