import { z } from 'zod'

export const UserRoleSchema = z.enum(['admin', 'manager', 'developer', 'viewer'])
export type UserRole = z.infer<typeof UserRoleSchema>

export const EventTypeSchema = z.enum([
  'commit',
  'pull_request',
  'review',
  'deployment',
  'test_run',
  'build',
  'alert',
  'metric_update',
])
export type EventType = z.infer<typeof EventTypeSchema>

export const MetricTypeSchema = z.enum([
  'velocity',
  'complexity',
  'coverage',
  'performance',
  'quality',
  'security',
  'reliability',
])
export type MetricType = z.infer<typeof MetricTypeSchema>

export interface Project {
  id: string
  name: string
  description?: string
  repositoryUrl?: string
  metadata?: {
    language?: string
    framework?: string
    tags?: string[]
  }
  createdAt: Date
  updatedAt: Date
}

export interface Team {
  id: string
  name: string
  description?: string
  members: TeamMember[]
  metadata?: Record<string, any>
  createdAt: Date
}

export interface TeamMember {
  id: string
  userId: string
  teamId: string
  role: string
  joinedAt: Date
}

export interface Sprint {
  id: string
  teamId: string
  name: string
  startDate: Date
  endDate: Date
  velocity?: number
  completed: boolean
}

export interface User {
  id: string
  email: string
  username: string
  name?: string
  avatar?: string
  role: UserRole
  isActive: boolean
  metadata?: {
    githubId?: string
    slackId?: string
    preferences?: Record<string, any>
  }
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    timestamp: string
    requestId: string
    duration?: number
  }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export interface GitHubRepository {
  owner: string
  repo: string
  branch?: string
  path?: string
}

export interface GitHubPullRequest {
  number: number
  title: string
  body?: string
  state: 'open' | 'closed' | 'merged'
  author: string
  createdAt: Date
  updatedAt: Date
  additions: number
  deletions: number
  changedFiles: number
}

export interface CodeMetrics {
  linesOfCode: number
  cyclomaticComplexity: number
  maintainabilityIndex: number
  testCoverage: number
  technicalDebt: number
  codeSmells: number
  duplicatedLines: number
}

export interface PerformanceMetrics {
  responseTime: number
  throughput: number
  errorRate: number
  availability: number
  apdex: number
}

export interface SecurityMetrics {
  vulnerabilities: {
    critical: number
    high: number
    medium: number
    low: number
  }
  lastScan: Date
  complianceScore: number
}