#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import axios from 'axios'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Load environment variables
dotenv.config()

// Configuration
const CANOPYIQ_API_KEY = process.env.CANOPYIQ_API_KEY || ''
const CANOPYIQ_ENDPOINT = process.env.CANOPYIQ_ENDPOINT || 'http://localhost:3000/api/claude'

// Session tracking
interface SessionData {
  sessionId: string
  startTime: string
  filesModified: Set<string>
  linesChanged: number
  commands: string[]
  searches: string[]
  repository?: string
  branch?: string
}

let currentSession: SessionData | null = null

// Helper function to send events to CanopyIQ
async function sendEvent(event: string, payload: any) {
  try {
    await axios.post(
      `${CANOPYIQ_ENDPOINT}/webhook`,
      {
        event,
        sessionId: currentSession?.sessionId,
        payload,
      },
      {
        headers: {
          'Authorization': `Bearer ${CANOPYIQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error(`Failed to send event ${event}:`, error)
  }
}

// Get current Git repository info
function getGitInfo(): { repository?: string; branch?: string } {
  try {
    const { execSync } = require('child_process')

    // Get remote URL
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' })
      .trim()
      .replace(/\.git$/, '')
      .replace(/^git@github\.com:/, 'https://github.com/')

    // Get current branch
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()

    return { repository: remoteUrl, branch }
  } catch {
    return {}
  }
}

// Create the MCP server
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

// Start a new session when the server starts
async function startSession() {
  const gitInfo = getGitInfo()

  currentSession = {
    sessionId: `claude-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    startTime: new Date().toISOString(),
    filesModified: new Set(),
    linesChanged: 0,
    commands: [],
    searches: [],
    ...gitInfo,
  }

  await sendEvent('session.started', {
    summary: 'Claude Code session started',
    repository: currentSession.repository,
    branch: currentSession.branch,
  })

  console.error(`[CanopyIQ] Session started: ${currentSession.sessionId}`)
}

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'track_file_edit',
        description: 'Track when a file is edited (called automatically)',
        inputSchema: {
          type: 'object',
          properties: {
            fileName: { type: 'string', description: 'The file that was edited' },
            linesAdded: { type: 'number', description: 'Number of lines added' },
            linesRemoved: { type: 'number', description: 'Number of lines removed' },
            changes: { type: 'string', description: 'Description of changes' },
          },
          required: ['fileName'],
        },
      },
      {
        name: 'track_command',
        description: 'Track when a command is executed (called automatically)',
        inputSchema: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'The command that was executed' },
            output: { type: 'string', description: 'Command output (truncated)' },
          },
          required: ['command'],
        },
      },
      {
        name: 'track_search',
        description: 'Track when a search is performed (called automatically)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The search query' },
            results: { type: 'number', description: 'Number of results found' },
          },
          required: ['query'],
        },
      },
      {
        name: 'track_pr_created',
        description: 'Track when a PR is created (called automatically)',
        inputSchema: {
          type: 'object',
          properties: {
            prNumber: { type: 'number', description: 'Pull request number' },
            prTitle: { type: 'string', description: 'Pull request title' },
            repository: { type: 'string', description: 'Repository name' },
          },
          required: ['prNumber', 'prTitle'],
        },
      },
      {
        name: 'get_session_summary',
        description: 'Get a summary of the current Claude Code session',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  }
})

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!currentSession) {
    await startSession()
  }

  const { name, arguments: args } = request.params

  switch (name) {
    case 'track_file_edit': {
      const { fileName, linesAdded = 0, linesRemoved = 0, changes } = args as any

      currentSession!.filesModified.add(fileName)
      currentSession!.linesChanged += Math.abs(linesAdded) + Math.abs(linesRemoved)

      await sendEvent('file.edited', {
        fileName,
        linesAdded,
        linesRemoved,
        changes,
        linesChanged: Math.abs(linesAdded) + Math.abs(linesRemoved),
      })

      return {
        content: [
          {
            type: 'text',
            text: `Tracked file edit: ${fileName} (+${linesAdded}/-${linesRemoved} lines)`,
          },
        ],
      }
    }

    case 'track_command': {
      const { command, output } = args as any

      currentSession!.commands.push(command)

      await sendEvent('command.executed', {
        command,
        output: output?.substring(0, 1000), // Truncate output
      })

      return {
        content: [
          {
            type: 'text',
            text: `Tracked command: ${command}`,
          },
        ],
      }
    }

    case 'track_search': {
      const { query, results } = args as any

      currentSession!.searches.push(query)

      await sendEvent('search.performed', {
        query,
        results,
      })

      return {
        content: [
          {
            type: 'text',
            text: `Tracked search: "${query}" (${results} results)`,
          },
        ],
      }
    }

    case 'track_pr_created': {
      const { prNumber, prTitle, repository } = args as any

      await sendEvent('pr.created', {
        prNumber,
        prTitle,
        repository: repository || currentSession!.repository,
      })

      return {
        content: [
          {
            type: 'text',
            text: `Tracked PR creation: #${prNumber} - ${prTitle}`,
          },
        ],
      }
    }

    case 'get_session_summary': {
      if (!currentSession) {
        return {
          content: [
            {
              type: 'text',
              text: 'No active session',
            },
          ],
        }
      }

      const duration = Date.now() - new Date(currentSession.startTime).getTime()
      const durationMinutes = Math.floor(duration / 60000)

      const summary = `
📊 **CanopyIQ Session Summary**
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 **Session ID:** ${currentSession.sessionId}
⏱️ **Duration:** ${durationMinutes} minutes
📁 **Files Modified:** ${currentSession.filesModified.size}
📈 **Lines Changed:** ${currentSession.linesChanged}
💻 **Commands Executed:** ${currentSession.commands.length}
🔍 **Searches Performed:** ${currentSession.searches.length}
${currentSession.repository ? `🔗 **Repository:** ${currentSession.repository}` : ''}
${currentSession.branch ? `🌿 **Branch:** ${currentSession.branch}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

This session is being tracked by CanopyIQ for automatic PR documentation.
      `.trim()

      return {
        content: [
          {
            type: 'text',
            text: summary,
          },
        ],
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
})

// Handle server shutdown
async function shutdown() {
  if (currentSession) {
    await sendEvent('session.ended', {
      summary: `Session ended after ${currentSession.filesModified.size} files modified`,
      filesModified: currentSession.filesModified.size,
      linesChanged: currentSession.linesChanged,
      commands: currentSession.commands.length,
    })

    console.error(`[CanopyIQ] Session ended: ${currentSession.sessionId}`)
  }
}

// Set up graceful shutdown
process.on('SIGINT', async () => {
  await shutdown()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await shutdown()
  process.exit(0)
})

// Start the server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('[CanopyIQ MCP Server] Ready for connections')
  console.error(`[CanopyIQ] Endpoint: ${CANOPYIQ_ENDPOINT}`)

  // Start session tracking
  await startSession()
}

main().catch(console.error)