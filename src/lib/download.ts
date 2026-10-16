'use client'

/**
 * Скачивает текст как файл.
 */
export function downloadText(
  content: string,
  filename: string,
  mimeType = 'text/markdown;charset=utf-8'
) {
  const blob = new Blob([content], { type: mimeType })
  downloadBlob(blob, filename)
}

/**
 * Скачивает Blob.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Освобождаем память
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Копирует текст в буфер обмена.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}