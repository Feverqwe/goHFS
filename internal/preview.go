package internal

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	boltstorage "goHfs/internal/boltStorage"
	"image"
	"image/jpeg"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"golang.org/x/image/draw"
)

type PreviewTask struct {
	SourcePath string
	PreviewID  string
	MimeType   string
	OnDone     func(err error)
}

type PreviewManager struct {
	cacheDir   string
	ffmpegPath string
	taskChan   chan PreviewTask
	active     sync.Map
	wg         sync.WaitGroup
	mu         sync.RWMutex
	isClosed   bool
	storage    *boltstorage.BoltStorage
}

func NewPreviewManager(config *Config, storage *boltstorage.BoltStorage) *PreviewManager {
	cacheDir := GetPreviewsPath()
	err := os.MkdirAll(cacheDir, 0755)
	if err != nil {
		log.Fatalf("Failed to create previews cache directory: %v", err)
	}

	workers := config.PreviewWorkers
	if workers <= 0 {
		workers = 1
	}

	mgr := &PreviewManager{
		cacheDir:   cacheDir,
		ffmpegPath: config.FfmpegPath,
		taskChan:   make(chan PreviewTask, 100),
		storage:    storage,
	}

	// Запуск пула воркеров
	for i := 0; i < workers; i++ {
		mgr.wg.Add(1)
		go mgr.worker()
	}

	return mgr
}

func (m *PreviewManager) GetPreviewID(osPath string, modTime int64) string {
	hash := sha256.Sum256([]byte(fmt.Sprintf("%s-%d", osPath, modTime)))
	return hex.EncodeToString(hash[:]) + ".jpg"
}

func (m *PreviewManager) GetPreviewPath(id string) string {
	return filepath.Join(m.cacheDir, id)
}

// TouchPreview обновляет время модификации файла, чтобы CleanCache не удалил его
func (m *PreviewManager) TouchPreview(path string) {
	now := time.Now()
	_ = os.Chtimes(path, now, now)
}

// Проверяем, помечен ли этот ID как завершившийся ошибкой
func (m *PreviewManager) IsFailed(id string) bool {
	v, err := m.storage.GetKey("preview-failed-" + id)
	if err != nil || v == nil {
		return false
	}
	failed, ok := v.(bool)
	return ok && failed
}

func (m *PreviewManager) MarkAsFailed(id string) {
	_ = m.storage.SetKey("preview-failed-"+id, true)
}

// CleanCache удаляет файлы превью, к которым не обращались дольше, чем указанный ttl
func (m *PreviewManager) CleanCache(ttl time.Duration) {
	m.mu.RLock()
	if m.isClosed {
		m.mu.RUnlock()
		return
	}
	m.mu.RUnlock()

	files, err := os.ReadDir(m.cacheDir)
	if err != nil {
		log.Printf("CleanCache: failed to read directory: %v", err)
		return
	}

	now := time.Now()
	var failedKeysToDelete []string

	for _, file := range files {
		if file.IsDir() || filepath.Ext(file.Name()) != ".jpg" {
			continue
		}

		info, err := file.Info()
		if err != nil {
			continue
		}

		id := strings.TrimSuffix(file.Name(), ".jpg")

		if now.Sub(info.ModTime()) > ttl {
			filePath := filepath.Join(m.cacheDir, file.Name())
			if err := os.Remove(filePath); err == nil {
				failedKeysToDelete = append(failedKeysToDelete, "preview-failed-"+id)
			}
		}
	}

	if len(failedKeysToDelete) > 0 {
		_ = m.storage.DelKeys(failedKeysToDelete)
		log.Printf("CleanCache: removed %d expired preview files and database states", len(failedKeysToDelete))
	}
}

func (m *PreviewManager) AddTask(src string, id string, videoExts []string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Если менеджер закрывается/закрыт, не принимаем новые задачи
	if m.isClosed {
		return false
	}

	if _, loaded := m.active.LoadOrStore(id, true); loaded {
		return false
	}

	ext := strings.ToLower(filepath.Ext(src))
	mime := "image"

	for _, videoExt := range videoExts {
		if ext == strings.ToLower(videoExt) {
			mime = "video"
			break
		}
	}

	m.taskChan <- PreviewTask{
		SourcePath: src,
		PreviewID:  id,
		MimeType:   mime,
		OnDone: func(err error) {
			m.active.Delete(id)
			if err != nil {
				log.Printf("Preview error for %s: %v. Marking as permanent failure.", src, err)
				m.MarkAsFailed(id)
			}
		},
	}
	return true
}

func (m *PreviewManager) worker() {
	defer m.wg.Done()
	for task := range m.taskChan {
		dst := m.GetPreviewPath(task.PreviewID)
		var err error

		if task.MimeType == "video" {
			err = m.generateVideoPreview(task.SourcePath, dst)
		} else {
			err = m.generateImagePreview(task.SourcePath, dst)
		}

		task.OnDone(err)
	}
}

func (m *PreviewManager) ResetFailedStates() error {
	m.mu.RLock()
	if m.isClosed {
		m.mu.RUnlock()
		return fmt.Errorf("preview manager is closed")
	}
	m.mu.RUnlock()

	// Получаем абсолютно все ключи из хранилища
	allKeysData := m.storage.GetKeys(nil)
	var keysToDelete []string

	// Фильтруем ключи, относящиеся к ошибкам превью
	for key := range allKeysData {
		if strings.HasPrefix(key, "preview-failed-") {
			keysToDelete = append(keysToDelete, key)
		}
	}

	// Если нашли такие ключи, выполняем пакетное удаление
	if len(keysToDelete) > 0 {
		err := m.storage.DelKeys(keysToDelete)
		if err != nil {
			return fmt.Errorf("failed to delete keys: %w", err)
		}
		log.Printf("ResetFailedStates: successfully cleared %d failure states from database", len(keysToDelete))
	}

	return nil
}

// Метод Close останавливает воркеры и дожидается завершения текущих операций
func (m *PreviewManager) Close() error {
	m.mu.Lock()
	if m.isClosed {
		m.mu.Unlock()
		return nil
	}
	m.isClosed = true
	m.mu.Unlock()

	// Закрываем канал задач. Воркеры выйдут из цикла, как только разберут оставшиеся задачи
	close(m.taskChan)

	// Ожидаем, пока все горутины-воркеры гарантированно завершат выполнение текущего кадра/картинки
	m.wg.Wait()
	return nil
}

func (m *PreviewManager) generateImagePreview(src, dst string) error {
	file, err := os.Open(src)
	if err != nil {
		return err
	}
	defer file.Close()

	img, _, err := image.Decode(file)
	if err != nil {
		return err
	}

	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()
	maxDim := 300

	if width > maxDim || height > maxDim {
		if width > height {
			height = (height * maxDim) / width
			width = maxDim
		} else {
			width = (width * maxDim) / height
			height = maxDim
		}
	}

	newImg := image.NewRGBA(image.Rect(0, 0, width, height))
	draw.CatmullRom.Scale(newImg, newImg.Bounds(), img, bounds, draw.Over, nil)

	outFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer outFile.Close()

	return jpeg.Encode(outFile, newImg, &jpeg.Options{Quality: 75})
}

// parseDurationToSeconds конвертирует строку вида "01:23:45.67" в секунды (float64)
func parseDurationToSeconds(timeStr string) float64 {
	parts := strings.Split(timeStr, ":")
	if len(parts) != 3 {
		return 0
	}
	h, _ := strconv.ParseFloat(parts[0], 64)
	m, _ := strconv.ParseFloat(parts[1], 64)
	s, _ := strconv.ParseFloat(parts[2], 64)
	return h*3600 + m*60 + s
}

func (m *PreviewManager) generateVideoPreview(src, dst string) error {
	// 1. Быстро запрашиваем метаданные файла через сам ffmpeg
	// Флаг -f null отправляет вывод в "пустоту", декодирование не происходит
	probeCmd := exec.Command(m.ffmpegPath, "-i", src, "-f", "null", "-")

	// ffmpeg пишет техническую информацию и метаданные в Stderr
	var stderr bytes.Buffer
	probeCmd.Stderr = &stderr
	_ = probeCmd.Run() // Игнорируем ошибку выхода, так как у нас нет флага выходного файла

	// 2. Ищем строку "Duration:" в выводе stderr
	outputStr := stderr.String()
	durationIdx := strings.Index(outputStr, "Duration:")

	startTime := "45" // Значение по умолчанию на случай сбоя парсинга

	if durationIdx != -1 {
		// Обрезаем строку, оставляя данные после "Duration: "
		subStr := outputStr[durationIdx+9:]
		commaIdx := strings.Index(subStr, ",")
		if commaIdx != -1 {
			// Выделяем таймкод вида "01:23:45.67"
			timeStr := strings.TrimSpace(subStr[:commaIdx])
			totalSeconds := parseDurationToSeconds(timeStr)

			if totalSeconds > 0 {
				// Вычисляем 50% от длины видео
				halfTime := totalSeconds / 2
				startTime = strconv.FormatFloat(halfTime, 'f', 2, 64)
			}
		}
	}

	// 3. Запускаем генерацию превью с вычисленной секунды середины фильма
	cmd := exec.Command(m.ffmpegPath,
		"-ss", startTime,
		"-i", src,
		"-vf", "thumbnail=100,scale=320:-1",
		"-vframes", "1",
		"-q:v", "5",
		"-y",
		dst,
	)
	return cmd.Run()
}
