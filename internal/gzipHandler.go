package internal

import (
	"compress/gzip"
	"io"
	"net/http"
)

type gzipResponseWriter struct {
	io.Writer
	http.ResponseWriter
}

func (w gzipResponseWriter) Write(b []byte) (int, error) {
	return w.Writer.Write(b)
}

func GzipHandler(next http.Handler) http.Handler {
	fn := func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Content-Encoding", "gzip")
		gz := gzip.NewWriter(writer)
		defer gz.Close()
		gzr := gzipResponseWriter{Writer: gz, ResponseWriter: writer}
		next.ServeHTTP(gzr, request)
	}
	return http.HandlerFunc(fn)
}
