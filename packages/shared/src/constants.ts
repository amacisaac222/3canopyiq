export const APP_NAME = 'CanopyIQ'
export const APP_VERSION = '1.0.0'
export const APP_DESCRIPTION = 'Intelligence above your code - see the forest AND the trees'

export const COLORS = {
  primary: '#0F4C2A',
  primaryDark: '#0A3A20',
  primaryLight: '#146634',
  secondary: '#00A86B',
  secondaryDark: '#008A57',
  secondaryLight: '#00C97F',
  accent: '#00FF88',
  accentDark: '#00CC6E',
  accentLight: '#33FFA0',
  background: '#000805',
  surface: '#0A1A0F',
  text: '#E0FFE0',
  textMuted: '#A0D0A0',
  border: '#1A3A20',
} as const

export const METRIC_THRESHOLDS = {
  velocity: {
    excellent: 40,
    good: 30,
    average: 20,
    poor: 10,
  },
  coverage: {
    excellent: 90,
    good: 80,
    average: 60,
    poor: 40,
  },
  complexity: {
    excellent: 5,
    good: 10,
    average: 20,
    poor: 40,
  },
  maintainability: {
    excellent: 80,
    good: 60,
    average: 40,
    poor: 20,
  },
} as const

export const TIME_RANGES = {
  '7d': { label: 'Last 7 days', days: 7 },
  '14d': { label: 'Last 14 days', days: 14 },
  '30d': { label: 'Last 30 days', days: 30 },
  '90d': { label: 'Last 90 days', days: 90 },
  '180d': { label: 'Last 6 months', days: 180 },
  '365d': { label: 'Last year', days: 365 },
} as const

export const EVENT_PRIORITIES = {
  critical: { level: 0, color: '#FF0000' },
  high: { level: 1, color: '#FF6600' },
  medium: { level: 2, color: '#FFCC00' },
  low: { level: 3, color: '#00CC00' },
  info: { level: 4, color: '#0099FF' },
} as const

export const API_ENDPOINTS = {
  auth: '/api/auth',
  projects: '/api/projects',
  metrics: '/api/metrics',
  events: '/api/events',
  teams: '/api/teams',
  users: '/api/users',
  analytics: '/api/analytics',
  github: '/api/github',
  slack: '/api/slack',
} as const

export const CACHE_KEYS = {
  projects: 'canopyiq:projects',
  metrics: 'canopyiq:metrics',
  events: 'canopyiq:events',
  teams: 'canopyiq:teams',
  users: 'canopyiq:users',
  session: 'canopyiq:session',
} as const

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

export const REGEX_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  githubRepo: /^https?:\/\/github\.com\/[\w-]+\/[\w.-]+$/,
  semver: /^\d+\.\d+\.\d+(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?$/i,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const

export const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: 20,
  maxPageSize: 100,
} as const

export const RATE_LIMITS = {
  api: {
    requests: 100,
    window: 60000,
  },
  auth: {
    requests: 5,
    window: 60000,
  },
  webhook: {
    requests: 1000,
    window: 60000,
  },
} as const