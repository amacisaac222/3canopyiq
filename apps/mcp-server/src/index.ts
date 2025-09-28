import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { db, getProjectMetrics, getCodeQualityMetrics } from '@canopyiq/database'
import { calculateVelocity, calculateComplexity } from '@canopyiq/analytics'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

const server = new Server(
  {
    name: 'canopyiq-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_project_metrics',
        description: 'Get comprehensive metrics for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The project ID to get metrics for',
            },
            timeRange: {
              type: 'string',
              description: 'Time range for metrics (7d, 30d, 90d)',
              enum: ['7d', '30d', '90d'],
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'analyze_code_quality',
        description: 'Analyze code quality metrics for a repository',
        inputSchema: {
          type: 'object',
          properties: {
            repositoryUrl: {
              type: 'string',
              description: 'GitHub repository URL',
            },
            branch: {
              type: 'string',
              description: 'Branch to analyze (default: main)',
            },
          },
          required: ['repositoryUrl'],
        },
      },
      {
        name: 'get_team_velocity',
        description: 'Calculate team velocity metrics',
        inputSchema: {
          type: 'object',
          properties: {
            teamId: {
              type: 'string',
              description: 'Team ID to calculate velocity for',
            },
            sprintCount: {
              type: 'number',
              description: 'Number of sprints to analyze',
            },
          },
          required: ['teamId'],
        },
      },
      {
        name: 'stream_events',
        description: 'Stream real-time development events',
        inputSchema: {
          type: 'object',
          properties: {
            eventTypes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['commit', 'pr', 'review', 'deployment', 'test'],
              },
              description: 'Types of events to stream',
            },
          },
          required: ['eventTypes'],
        },
      },
    ],
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  switch (name) {
    case 'get_project_metrics':
      const metrics = await getProjectMetrics(db, args.projectId, args.timeRange || '30d')
      await redis.publish('metrics:project', JSON.stringify({
        projectId: args.projectId,
        metrics,
        timestamp: new Date().toISOString(),
      }))
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(metrics, null, 2),
          },
        ],
      }

    case 'analyze_code_quality':
      const quality = await getCodeQualityMetrics(db, args.repositoryUrl, args.branch || 'main')
      const complexity = await calculateComplexity(quality)
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ quality, complexity }, null, 2),
          },
        ],
      }

    case 'get_team_velocity':
      const velocity = await calculateVelocity(db, args.teamId, args.sprintCount || 3)
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(velocity, null, 2),
          },
        ],
      }

    case 'stream_events':
      const subscriber = redis.duplicate()
      const channels = args.eventTypes.map((type: string) => `events:${type}`)
      await subscriber.subscribe(...channels)

      const events: any[] = []
      subscriber.on('message', (channel, message) => {
        events.push({
          channel,
          data: JSON.parse(message),
          timestamp: new Date().toISOString(),
        })
      })

      setTimeout(() => subscriber.disconnect(), 5000)

      return {
        content: [
          {
            type: 'text',
            text: `Subscribed to ${channels.join(', ')}. Streaming events for 5 seconds...`,
          },
        ],
      }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('CanopyIQ MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Server error:', error)
  process.exit(1)
})