package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// Лимит символов для одного сообщения.
// Для моделей 2026 года 8000-10000 — оптимальный баланс.
const maxBatchChars = 7500

func main() {
	inputPathRef := flag.String("input", "", "Path to repomix-output.md")
	flag.Parse()
	inputPath := *inputPathRef
	// Путь к файлу, который сгенерировал Repomix
	if inputPath == "" {
		fmt.Println("Ошибка: не указан путь к файлу. Используйте --input /path/to/repomix-output.md")
		return
	}

	reader := bufio.NewReader(os.Stdin)

	cmd := fmt.Sprintf("cd '%s' && npx repomix", filepath.Dir(inputPath))
	err := exec.Command("bash", "-c", cmd).Run()
	if err != nil {
		fmt.Printf("Ошибка запуска repomix: %v\n", err)
		return
	}

	content, err := os.ReadFile(inputPath)
	if err != nil {
		fmt.Printf("Ошибка: файл %s не найден\n", inputPath)
		return
	}

	text := string(content)
	runes := []rune(text)
	totalChars := len(runes)
	totalBatches := (totalChars / maxBatchChars) + 1

	fmt.Printf("--- Файл прочитан. Символов: %d. Батчей: %d ---\n", totalChars, totalBatches)

	startText := "Я использую Repomix для передачи контекста. Сначала пришлю структуру, затем содержимое файлов"
	err = copyToClipboard(startText)
	if err != nil {
		fmt.Printf("Ошибка при копировании в буфер: %v\n", err)
	} else {
		fmt.Printf("Стартовая фраза скопирована.\n")
		fmt.Println("👉 Вставьте текст в чат (Cmd+V) и нажмите Enter здесь для следующего шага...")
	}

	// Ждем нажатия Enter
	reader.ReadString('\n')

	batchNum := 1
	for i := 0; i < totalChars; i += maxBatchChars {
		end := i + maxBatchChars
		if end > totalChars {
			end = totalChars
		}

		batchContent := string(runes[i:end])

		finalText := printBatch(batchNum, totalBatches, batchContent)

		// Копируем в буфер обмена macOS
		err := copyToClipboard(finalText)
		if err != nil {
			fmt.Printf("Ошибка при копировании в буфер: %v\n", err)
		} else {
			fmt.Printf("\n✅ БАТЧ %d / %d скопирован в буфер обмена.\n", batchNum, totalBatches)
			fmt.Println("👉 Вставьте текст в чат (Cmd+V) и нажмите Enter здесь для следующего шага...")
		}

		batchNum++

		// Ждем нажатия Enter
		if i < totalChars {
			reader.ReadString('\n')
		}
	}

	fmt.Println("🎉 Все части успешно отправлены!")
}

func printBatch(num, total int, content string) string {
	text := ""
	text += fmt.Sprintf("\n================ BATCH %d / %d ================\n", num, total)

	// Инструкция для ИИ в начале каждого батча
	if num == 1 {
		text += fmt.Sprintln("ПРИМЕЧАНИЕ: Это начало контекста проекта (формат Repomix).")
	} else {
		text += fmt.Sprintf("ПРИМЕЧАНИЕ: Это продолжение контекста (часть %d). Пока не отвечай.\n", num)
	}

	text += fmt.Sprintln("\n" + content)

	if num == total {
		text += fmt.Sprintln("\n--- КОНЕЦ КОНТЕКСТА. Теперь проект загружен полностью. Жду твоих указаний. ---")
	} else {
		text += fmt.Sprintf("\n================ END OF BATCH %d =================\n", num)
	}
	return text
}

func copyToClipboard(text string) error {
	cmd := exec.Command("pbcopy")
	cmd.Stdin = strings.NewReader(text)
	return cmd.Run()
}
