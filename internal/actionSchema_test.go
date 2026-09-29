package internal

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestActionSchema(t *testing.T) {
	const template = "{schema}://{hostname}{url}"
	config := &Config{
		Public:    t.TempDir(),
		ExtHandle: map[string]string{".mp4": template},
		ExtActions: map[string][]ExtAction{
			".mp4": {{Name: "play", Url: template}},
		},
	}
	router := NewRouter()
	handleAction(router, config, nil)

	for _, endpoint := range []string{"extHandle", "extAction"} {
		for _, tt := range []struct {
			name, transport, forwardedProto, wantSchema string
		}{
			{"plain HTTP", "http", "", "http"},
			{"direct HTTPS", "https", "", "https"},
			{"nginx HTTPS termination", "http", "https", "https"},
			{"proxy HTTP overrides TLS", "https", "http", "http"},
			{"proxy chain", "http", "https, http", "https"},
			{"normalized header", "http", " HTTPS ", "https"},
			{"invalid header HTTP fallback", "http", "javascript", "http"},
			{"invalid header TLS fallback", "https", "invalid", "https"},
		} {
			t.Run(endpoint+"/"+tt.name, func(t *testing.T) {
				req := httptest.NewRequest(http.MethodGet, tt.transport+"://backend/~/"+endpoint+"?place=/media&name=clip.mp4&hostname=files.example&action=play&schema=invalid", nil)
				req.Header.Set("X-Forwarded-Proto", tt.forwardedProto)
				res := httptest.NewRecorder()
				router.ServeHTTP(res, req)
				if res.Code != http.StatusFound {
					t.Fatalf("status = %d, want %d: %s", res.Code, http.StatusFound, res.Body.String())
				}
				want := tt.wantSchema + "://files.example%2Fmedia%2Fclip.mp4"
				if got := res.Header().Get("Location"); got != want {
					t.Fatalf("Location = %q, want %q", got, want)
				}
			})
		}
	}
}
