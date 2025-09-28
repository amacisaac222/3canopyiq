import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import Redis from 'ioredis'
import { WebSocketServer } from 'ws'
import { EventCapture } from './core/EventCapture'
import { SessionManager } from './core/SessionManager'
import { LineageTracker } from './core/LineageTracker'
import { createTools } from './tools'

// Initialize Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Initialize core services
const sessionManager = new SessionManager(redis)
const lineageTracker = new LineageTracker(redis)
const eventCapture = new EventCapture(redis, sessionManager, lineageTracker)

// Get organization ID from environment
const ORGANIZATION_ID = process.env.ORGANIZATION_ID || 'default-org'

// Create MCP server
const server = new Server(
  {
    name: 'canopyiq-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Register tools
const tools = createTools(eventCapture, sessionManager, ORGANIZATION_ID)

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }
})

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  const tool = tools.find(t => t.name === name)
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`)
  }

  try {
    console.log(`Executing tool: ${name}`, args)
    const result = await tool.execute(args)
    return result
  } catch (error) {
    console.error(`Tool execution failed: ${name}`, error)
    throw error
  }
})

// ============================================================================
// WebSocket Server for Real-time Updates
// ============================================================================

const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', (ws) => {
  console.log('WebSocket client connected')

  // Subscribe to Redis pub/sub
  const subscriber = redis.duplicate()

  subscriber.subscribe('events:new', (err) => {
    if (err) {
      console.error('Failed to subscribe to events:', err)
      return
    }
  })

  subscriber.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message)
      ws.send(JSON.stringify({
        type: 'event',
        channel,
        data,
        timestamp: new Date().toISOString(),
      }))
    } catch (error) {
      console.error('Failed to send WebSocket message:', error)
    }
  })

  // Stream events from Redis streams
  const streamReader = setInterval(async () => {
    try {
      const streams = await redis.xread(
        'COUNT', '10',
        'BLOCK', '1000',
        'STREAMS',
        `events:stream:${ORGANIZATION_ID}`,
        '$'
      )

      if (streams) {
        for (const [streamKey, entries] of streams) {
          for (const [id, fields] of entries) {
            const event = {
              id,
              streamKey,
              data: Object.fromEntries(
                fields.reduce((acc, val, idx) => {
                  if (idx % 2 === 0) {
                    acc.push([val, fields[idx + 1]])
                  }
                  return acc
                }, [] as any[])
              ),
            }

            ws.send(JSON.stringify({
              type: 'stream',
              data: event,
              timestamp: new Date().toISOString(),
            }))
          }
        }
      }
    } catch (error) {
      console.error('Failed to read from stream:', error)
    }
  }, 1000)

  ws.on('close', () => {
    console.log('WebSocket client disconnected')
    subscriber.unsubscribe()
    subscriber.quit()
    clearInterval(streamReader)
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

console.log('WebSocket server listening on port 8080')

// ============================================================================
// Cleanup and Error Handling
// ============================================================================

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...')

  // Clean up resources
  await eventCapture.cleanup()
  await lineageTracker.cleanup()
  await sessionManager.cleanupExpiredSessions()

  // Close connections
  wss.close()
  await redis.quit()

  process.exit(0)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// ============================================================================
// Start Server
// ============================================================================

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.log('CanopyIQ MCP Server running on stdio')
  console.log('Organization ID:', ORGANIZATION_ID)
}

main().catch((error) => {
  console.error('Server startup error:', error)
  process.exit(1)
})