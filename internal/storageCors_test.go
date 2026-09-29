package internal

import (
	"encoding/json"
	boltstorage "goHfs/internal/boltStorage"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
)

func TestStorageCORS(t *testing.T) {
	storage := boltstorage.GetStorage(filepath.Join(t.TempDir(), "storage.db"))
	t.Cleanup(func() { storage.Close() })
	router := NewRouter()
	HandleApi(router, &Config{}, storage, false, nil, nil)

	tests := []struct {
		name, method, path, origin, requestedMethod string
		status                                      int
		allowed                                     bool
	}{
		{"get preflight", "OPTIONS", "/~/storage/get", mediaToolsOrigin, "POST", 204, true},
		{"set preflight", "OPTIONS", "/~/storage/set", mediaToolsOrigin, "POST", 204, true},
		{"del preflight", "OPTIONS", "/~/storage/del", mediaToolsOrigin, "POST", 204, true},
		{"other origin", "OPTIONS", "/~/storage/set", "https://example.com", "POST", 403, false},
		{"origin lookalike", "OPTIONS", "/~/storage/set", mediaToolsOrigin + ".example.com", "POST", 403, false},
		{"other method", "OPTIONS", "/~/storage/set", mediaToolsOrigin, "DELETE", 403, false},
		{"other endpoint", "OPTIONS", "/~/mkdir", mediaToolsOrigin, "POST", 403, false},
		{"unknown storage endpoint", "OPTIONS", "/~/storage/other", mediaToolsOrigin, "POST", 403, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.path, nil)
			req.Header.Set("Origin", tt.origin)
			req.Header.Set("Access-Control-Request-Method", tt.requestedMethod)
			req.Header.Set("Access-Control-Request-Headers", "content-type")
			res := httptest.NewRecorder()
			router.ServeHTTP(res, req)
			if res.Code != tt.status {
				t.Fatalf("status = %d, want %d", res.Code, tt.status)
			}
			if got := res.Header().Get("Access-Control-Allow-Origin"); (got == mediaToolsOrigin) != tt.allowed {
				t.Fatalf("unexpected allowed origin %q", got)
			}
			wantCredentials := ""
			if tt.allowed {
				wantCredentials = "true"
			}
			if got := res.Header().Get("Access-Control-Allow-Credentials"); got != wantCredentials {
				t.Fatalf("allowed credentials = %q, want %q", got, wantCredentials)
			}
			if tt.allowed {
				if res.Header().Get("Access-Control-Allow-Methods") != "POST" || res.Header().Get("Access-Control-Allow-Headers") != "Content-Type" {
					t.Fatal("missing preflight permissions")
				}
			}
		})
	}

	for _, origin := range []string{mediaToolsOrigin, ""} {
		for _, step := range []struct{ path, body string }{
			{"/~/storage/set", `{"mediaTools-test":"saved"}`},
			{"/~/storage/get", `["mediaTools-test"]`},
			{"/~/storage/del", `["mediaTools-test"]`},
		} {
			req := httptest.NewRequest(http.MethodPost, step.path, strings.NewReader(step.body))
			req.Header.Set("Origin", origin)
			req.Header.Set("Content-Type", "application/json")
			res := httptest.NewRecorder()
			router.ServeHTTP(res, req)
			if res.Code != http.StatusOK || res.Header().Get("Access-Control-Allow-Origin") != origin {
				t.Fatalf("POST %s: status %d, headers %v", step.path, res.Code, res.Header())
			}
			wantCredentials := ""
			if origin == mediaToolsOrigin {
				wantCredentials = "true"
			}
			if got := res.Header().Get("Access-Control-Allow-Credentials"); got != wantCredentials {
				t.Fatalf("POST %s: allowed credentials = %q, want %q", step.path, got, wantCredentials)
			}
			if step.path == "/~/storage/get" {
				var response struct{ Result map[string]interface{} }
				if err := json.Unmarshal(res.Body.Bytes(), &response); err != nil || response.Result["mediaTools-test"] != "saved" {
					t.Fatalf("stored value missing: %s", res.Body.String())
				}
			}
		}
		if value, err := storage.GetKey("mediaTools-test"); err != nil || value != nil {
			t.Fatalf("deleted value still present: %v, %v", value, err)
		}
	}
}
