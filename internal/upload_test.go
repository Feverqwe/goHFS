package internal

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestUploadDirectories(t *testing.T) {
	public := t.TempDir()
	config := Config{
		Public:               public,
		prepWritablePatterns: PrepPatterns([]string{"!/project/private", "/project", "/project/**", "/file.txt"}),
	}
	router := NewRouter()
	handleUpload(router, &config)

	if err := os.WriteFile(filepath.Join(public, "file.txt"), []byte("existing"), 0600); err != nil {
		t.Fatal(err)
	}

	for _, step := range []struct {
		place string
		name  string
		ok    bool
	}{
		{"/", "project", true},
		{"/project", "assets", true},
		{"/project/assets", "empty", true},
		{"/project", "assets", true},
		{"/project", "private", false},
		{"/", "other", false},
		{"/", "file.txt", false},
	} {
		body, err := json.Marshal(map[string]string{"place": step.place, "name": step.name})
		if err != nil {
			t.Fatal(err)
		}
		response := httptest.NewRecorder()
		router.ServeHTTP(response, httptest.NewRequest(http.MethodPost, "/~/upload/mkdir", bytes.NewReader(body)))
		if ok := response.Code == http.StatusOK; ok != step.ok {
			t.Fatalf("creating %s in %s returned %d: %s", step.name, step.place, response.Code, response.Body)
		}
	}

	if info, err := os.Stat(filepath.Join(public, "project", "assets", "empty")); err != nil || !info.IsDir() {
		t.Fatalf("nested empty directory was not created: %v", err)
	}
	for _, denied := range []string{"other", "project/private"} {
		if _, err := os.Stat(filepath.Join(public, denied)); !os.IsNotExist(err) {
			t.Errorf("denied directory %s: expected it to be absent, got %v", denied, err)
		}
	}
	if data, err := os.ReadFile(filepath.Join(public, "file.txt")); err != nil || string(data) != "existing" {
		t.Fatalf("existing file changed: got %q, %v", data, err)
	}
}
