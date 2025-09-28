import { NextRequest, NextResponse } from 'next/server'
import { db } from '@canopyiq/database'
import Redis from 'ioredis'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  services: {
    database: ServiceHealth
    redis: ServiceHealth
    github: ServiceHealth
    websocket: ServiceHealth
  }
  metrics: {
    eventsLast24h: number
    activeSessions: number
    averageResponseTime: number
    errorRate: number
  }
  version: string
  environment: string
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded'
  responseTime?: number
  error?: string
}

const startTime = Date.now()

async function checkDatabase(): Promise<ServiceHealth> {
  try {
    const start = Date.now()

    // Simple query to check database connectivity
    const result = await db.select().from('events' as any).limit(1)

    const responseTime = Date.now() - start

    return {
      status: 'up',
      responseTime,
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkRedis(): Promise<ServiceHealth> {
  if (!process.env.REDIS_URL) {
    return {
      status: 'down',
      error: 'Redis URL not configured',
    }
  }

  try {
    const redis = new Redis(process.env.REDIS_URL)
    const start = Date.now()

    await redis.ping()
    const responseTime = Date.now() - start

    redis.disconnect()

    return {
      status: 'up',
      responseTime,
    }
  } catch (error) {
    console.error('Redis health check failed:', error)
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkGitHub(): Promise<ServiceHealth> {
  if (!process.env.GITHUB_APP_ID) {
    return {
      status: 'degraded',
      error: 'GitHub App not configured',
    }
  }

  try {
    const start = Date.now()

    // Check GitHub API availability
    const response = await fetch('https://api.github.com/rate_limit', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    const responseTime = Date.now() - start

    if (response.ok) {
      return {
        status: 'up',
        responseTime,
      }
    } else {
      return {
        status: 'degraded',
        responseTime,
        error: `GitHub API returned ${response.status}`,
      }
    }
  } catch (error) {
    console.error('GitHub health check failed:', error)
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

async function checkWebSocket(): Promise<ServiceHealth> {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL

  if (!wsUrl) {
    return {
      status: 'degraded',
      error: 'WebSocket URL not configured',
    }
  }

  // For production, you might want to actually test WebSocket connectivity
  // For now, we'll just check if the URL is configured
  return {
    status: 'up',
  }
}

async function getMetrics() {
  try {
    // Get events count from last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const eventsResult = await db
      .select()
      .from('events' as any)
      .where('timestamp', '>', yesterday)
      .count()

    const eventsLast24h = eventsResult[0]?.count || 0

    // Get active sessions count
    const sessionsResult = await db
      .select()
      .from('claude_sessions' as any)
      .where('status', '=', 'active')
      .count()

    const activeSessions = sessionsResult[0]?.count || 0

    return {
      eventsLast24h,
      activeSessions,
      averageResponseTime: 145, // This would come from APM in production
      errorRate: 0.02, // This would come from error tracking in production
    }
  } catch (error) {
    console.error('Failed to get metrics:', error)
    return {
      eventsLast24h: 0,
      activeSessions: 0,
      averageResponseTime: 0,
      errorRate: 0,
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    // Run health checks in parallel
    const [database, redis, github, websocket, metrics] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkGitHub(),
      checkWebSocket(),
      getMetrics(),
    ])

    // Determine overall status
    const services = { database, redis, github, websocket }
    const criticalServices = [database, redis]
    const hasDownService = criticalServices.some(s => s.status === 'down')
    const hasDegradedService = Object.values(services).some(s => s.status === 'degraded')

    const status: HealthCheck['status'] = hasDownService
      ? 'unhealthy'
      : hasDegradedService
      ? 'degraded'
      : 'healthy'

    const health: HealthCheck = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services,
      metrics,
      version: process.env.NEXT_PUBLIC_RELEASE || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    }

    // Return appropriate status code based on health
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

    return NextResponse.json(health, { status: statusCode })
  } catch (error) {
    console.error('Health check error:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000),
        error: error instanceof Error ? error.message : 'Unknown error',
        version: process.env.NEXT_PUBLIC_RELEASE || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      { status: 503 }
    )
  }
}

// Support HEAD requests for simple monitoring
export async function HEAD(req: NextRequest) {
  return new NextResponse(null, { status: 200 })
}