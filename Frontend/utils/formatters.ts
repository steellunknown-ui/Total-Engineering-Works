/**
 * Formats a file size in bytes to a human-readable string.
 * Used in the RFQ file upload component.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Generates a reference ID for RFQ submissions.
 * Format: TDQ-YYYYMMDD-XXXX
 */
export function generateReferenceId(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TDQ-${date}-${random}`
}

/**
 * Sanitizes a string for safe use in email content.
 */
export function sanitizeInput(str: string): string {
  return str.replace(/[<>]/g, '').trim()
}
