import { z } from 'zod'

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function calculateDuration(start: Date, end: Date): number {
  return Math.abs(end.getTime() - start.getTime())
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export function parseTimeRange(range: string): { start: Date; end: Date } {
  const now = new Date()
  const match = range.match(/(\d+)([dhm])/)

  if (!match) {
    return {
      start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      end: now,
    }
  }

  const [, value, unit] = match
  const amount = parseInt(value)

  let milliseconds = 0
  switch (unit) {
    case 'd':
      milliseconds = amount * 24 * 60 * 60 * 1000
      break
    case 'h':
      milliseconds = amount * 60 * 60 * 1000
      break
    case 'm':
      milliseconds = amount * 60 * 1000
      break
  }

  return {
    start: new Date(now.getTime() - milliseconds),
    end: now,
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

export function validateEmail(email: string): boolean {
  const emailSchema = z.string().email()
  try {
    emailSchema.parse(email)
    return true
  } catch {
    return false
  }
}

export function validateUrl(url: string): boolean {
  const urlSchema = z.string().url()
  try {
    urlSchema.parse(url)
    return true
  } catch {
    return false
  }
}

export function parseGitHubUrl(url: string): {
  owner: string
  repo: string
} | null {
  const match = url.match(/github\.com[:/]([^/]+)\/([^/.]+)/)
  if (!match) return null

  return {
    owner: match[1],
    repo: match[2],
  }
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key])
    if (!groups[group]) groups[group] = []
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]

    if (aVal === bVal) return 0

    const comparison = aVal < bVal ? -1 : 1
    return order === 'asc' ? comparison : -comparison
  })
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  return fn().catch((error) => {
    if (retries === 0) throw error
    return new Promise((resolve) => setTimeout(resolve, delay)).then(() =>
      retry(fn, retries - 1, delay * 2)
    )
  })
}

export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}