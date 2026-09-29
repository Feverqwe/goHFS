package internal

import "net/http"

const mediaToolsOrigin = "https://mediatools.rndnm.com"

func handleStorageCORS(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Vary", "Origin")
	if r.Header.Get("Origin") == mediaToolsOrigin {
		if r.Method == http.MethodOptions {
			w.Header().Add("Vary", "Access-Control-Request-Method")
			w.Header().Add("Vary", "Access-Control-Request-Headers")
			if r.Header.Get("Access-Control-Request-Method") != http.MethodPost {
				w.WriteHeader(http.StatusForbidden)
				return
			}
			w.Header().Set("Access-Control-Allow-Origin", mediaToolsOrigin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", http.MethodPost)
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method == http.MethodPost {
			w.Header().Set("Access-Control-Allow-Origin", mediaToolsOrigin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}
	}
	if next, ok := GetNext(r); ok {
		next()
	}
}
