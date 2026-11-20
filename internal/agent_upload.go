package internal

import (
	"bytes"
	"crypto/rand"
	_ "embed"
	"errors"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	agentUploadPath = "/~/agent.md"
	agentChunkSize  = 16 * 1024 * 1024
	agentUploadIdle = time.Hour
)

//go:embed agent_upload.md
var agentUploadInstructions string

type agentUpload struct {
	mu       sync.Mutex
	root     *os.Root
	stage    *os.File
	target   string
	size     int64
	offset   int64
	complete bool
	expires  time.Time
}

type agentUploadProgress struct {
	Offset   int64 `json:"offset"`
	Complete bool  `json:"complete"`
}

func handleAgentUpload(router *Router, config *Config) {
	var uploads sync.Map

	router.Custom([]string{http.MethodGet, http.MethodHead}, []string{agentUploadPath}, func(w http.ResponseWriter, r *http.Request) {
		place := NormalizePath(r.URL.Query().Get("place"))
		query := url.Values{"place": {place}}
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		instructions := strings.NewReplacer(
			"{{uploadPath}}", agentUploadPath+"?"+query.Encode(),
			"{{chunkSize}}", strconv.Itoa(agentChunkSize),
		).Replace(agentUploadInstructions)
		_, _ = io.WriteString(w, instructions)
	})

	router.Post(agentUploadPath, func(w http.ResponseWriter, r *http.Request) {
		if !agentContentType(r, "application/json") {
			respondAgentUpload(w, http.StatusUnsupportedMediaType, "Expected application/json")
			return
		}
		payload, err := ParseJson[struct {
			Name string `json:"name"`
			Size *int64 `json:"size"`
		}](http.MaxBytesReader(w, r.Body, 16*1024))
		if err != nil || payload.Size == nil || *payload.Size < 0 {
			respondAgentUpload(w, http.StatusBadRequest, "Expected a file name and a nonnegative size in bytes")
			return
		}

		token := rand.Text()
		upload, err := startAgentUpload(config, r.URL.Query().Get("place"), payload.Name, *payload.Size)
		if err != nil {
			writeAgentFileError(w, err)
			return
		}

		uploads.Store(token, upload)
		var expire func()
		expire = func() {
			upload.mu.Lock()
			defer upload.mu.Unlock()
			if remaining := time.Until(upload.expires); remaining > 0 {
				time.AfterFunc(remaining, expire)
				return
			}
			uploads.Delete(token)
			upload.close()
		}
		time.AfterFunc(agentUploadIdle, expire)

		_ = writeApiResultWithStatus(w, http.StatusCreated, struct {
			Token     string `json:"token"`
			ChunkSize int    `json:"chunkSize"`
		}{token, agentChunkSize}, nil)
	})

	router.Custom([]string{http.MethodPatch}, []string{agentUploadPath}, func(w http.ResponseWriter, r *http.Request) {
		if !agentContentType(r, "application/octet-stream") {
			respondAgentUpload(w, http.StatusUnsupportedMediaType, "Expected application/octet-stream")
			return
		}
		offset, err := strconv.ParseInt(r.Header.Get("Upload-Offset"), 10, 64)
		if err != nil || offset < 0 {
			respondAgentUpload(w, http.StatusBadRequest, "Expected a nonnegative Upload-Offset")
			return
		}
		value, found := uploads.Load(r.Header.Get("Upload-Token"))
		if !found {
			respondAgentUpload(w, http.StatusNotFound, "Upload token is unknown or expired")
			return
		}
		chunk, err := io.ReadAll(http.MaxBytesReader(w, r.Body, agentChunkSize))
		if err != nil {
			var tooLarge *http.MaxBytesError
			if errors.As(err, &tooLarge) {
				respondAgentUpload(w, http.StatusRequestEntityTooLarge, "Chunk exceeds the server limit")
			} else {
				respondAgentUpload(w, http.StatusBadRequest, "Could not read the chunk")
			}
			return
		}

		upload := value.(*agentUpload)
		upload.mu.Lock()
		defer upload.mu.Unlock()

		if time.Now().After(upload.expires) {
			respondAgentUpload(w, http.StatusNotFound, "Upload token is unknown or expired")
			return
		}
		end := offset + int64(len(chunk))
		if offset > upload.size || end < offset || end > upload.size || (len(chunk) == 0 && upload.size != 0) {
			respondAgentUpload(w, http.StatusBadRequest, "Chunk does not fit the declared file size")
			return
		}
		if offset > upload.offset || (offset < upload.offset && end > upload.offset) {
			respondAgentUpload(w, http.StatusConflict, fmt.Sprintf("Expected offset %d", upload.offset))
			return
		}

		if !upload.complete {
			if err := upload.acceptChunk(chunk, offset); err != nil {
				writeAgentFileError(w, err)
				return
			}
		}
		upload.expires = time.Now().Add(agentUploadIdle)
		_ = writeApiResultWithStatus(w, http.StatusOK, agentUploadProgress{upload.offset, upload.complete}, nil)
	})
}

func startAgentUpload(config *Config, place, name string, size int64) (*agentUpload, error) {
	root, relative, err := openWritableUploadTarget(config, place, name)
	if err != nil {
		return nil, err
	}
	defer root.Close()

	parent, err := root.OpenRoot(filepath.Dir(relative))
	if err != nil {
		return nil, err
	}
	target := filepath.Base(relative)
	if _, err = parent.Lstat(target); !errors.Is(err, os.ErrNotExist) {
		parent.Close()
		if err == nil {
			err = os.ErrExist
		}
		return nil, err
	}

	stage, err := parent.OpenFile(".gohfs-upload-"+rand.Text(), os.O_RDWR|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		parent.Close()
		return nil, err
	}
	return &agentUpload{
		root: parent, stage: stage, target: target, size: size,
		expires: time.Now().Add(agentUploadIdle),
	}, nil
}

var errAgentChunkMismatch = errors.New("Chunk differs from the data already received at this offset")

func (u *agentUpload) acceptChunk(chunk []byte, offset int64) error {
	if offset < u.offset {
		saved := make([]byte, len(chunk))
		if _, err := u.stage.ReadAt(saved, offset); err != nil {
			return err
		}
		if !bytes.Equal(chunk, saved) {
			return errAgentChunkMismatch
		}
	} else {
		if _, err := u.stage.WriteAt(chunk, offset); err != nil {
			return err
		}
		u.offset += int64(len(chunk))
	}

	if u.offset == u.size {
		if err := u.publish(); err != nil {
			return err
		}
		u.complete = true
		u.close()
	}
	return nil
}

func (u *agentUpload) publish() error {
	if err := u.stage.Sync(); err != nil {
		return err
	}
	if err := u.root.Link(filepath.Base(u.stage.Name()), u.target); err == nil || errors.Is(err, os.ErrExist) {
		return err
	}

	// Some file systems do not support hard links. Keep exclusive creation there too.
	target, err := u.root.OpenFile(u.target, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if err != nil {
		return err
	}
	_, copyErr := io.Copy(target, io.NewSectionReader(u.stage, 0, u.size))
	if err = errors.Join(copyErr, target.Close()); err != nil {
		return errors.Join(err, u.root.Remove(u.target))
	}
	return nil
}

func (u *agentUpload) close() {
	if u.root == nil {
		return
	}
	if err := errors.Join(u.stage.Close(), u.root.Remove(filepath.Base(u.stage.Name())), u.root.Close()); err != nil {
		log.Printf("agent upload cleanup: %v", err)
	}
	u.root = nil
	u.stage = nil
}

func agentContentType(r *http.Request, expected string) bool {
	mediaType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	return err == nil && mediaType == expected
}

func respondAgentUpload(w http.ResponseWriter, status int, message string) {
	_ = writeApiResultWithStatus(w, status, nil, errors.New(message))
}

func writeAgentFileError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, errInvalidUploadName):
		respondAgentUpload(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, errUploadReadOnly), errors.Is(err, os.ErrPermission):
		respondAgentUpload(w, http.StatusForbidden, "Destination is not writable")
	case errors.Is(err, os.ErrNotExist):
		respondAgentUpload(w, http.StatusNotFound, "Destination folder does not exist")
	case errors.Is(err, os.ErrExist):
		respondAgentUpload(w, http.StatusConflict, "A file or folder with that name already exists")
	case errors.Is(err, errAgentChunkMismatch):
		respondAgentUpload(w, http.StatusConflict, err.Error())
	default:
		log.Printf("agent upload: %v", err)
		respondAgentUpload(w, http.StatusInternalServerError, "Could not save the upload")
	}
}
