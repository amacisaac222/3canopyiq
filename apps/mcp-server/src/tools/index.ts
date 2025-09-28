import { z } from 'zod'
import { EventCapture } from '../core/EventCapture'
import { SessionManager } from '../core/SessionManager'
import { ComplexityAnalyzer } from '../analyzers/ComplexityAnalyzer'
import { createTrackedMetric } from '@canopyiq/database'

export function createTools(
  eventCapture: EventCapture,
  sessionManager: SessionManager,
  organizationId: string
) {
  return [
    {
      name: 'capture_event',
      description: 'Record any action with full lineage tracking',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          action: { type: 'string' },
          label: { type: 'string' },
          value: { type: 'object' },
          parentEventId: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
        required: ['category', 'action', 'value'],
      },
      execute: async (args: any) => {
        const result = await eventCapture.captureEvent({
          category: args.category,
          action: args.action,
          label: args.label,
          value: args.value,
          parentEventId: args.parentEventId,
          confidence: args.confidence,
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      },
    },

    {
      name: 'analyze_complexity',
      description: 'Calculate code complexity with full lineage tracking',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['filePath', 'content'],
      },
      execute: async (args: any) => {
        // Create analysis event
        const analysisEvent = await eventCapture.captureEvent({
          category: 'analysis',
          action: 'complexity_calculation',
          value: { filePath: args.filePath },
        })

        // Calculate complexity
        const analyzer = new ComplexityAnalyzer()
        const complexity = await analyzer.analyze(args.content)

        // Create metric with lineage
        const metric = await createTrackedMetric(
          null as any, // db instance would be injected
          {
            name: `complexity_${args.filePath.replace(/[^a-zA-Z0-9]/g, '_')}`,
            displayName: `Complexity: ${args.filePath}`,
            value: complexity.cyclomatic,
            unit: 'points',
            formula: 'branches + conditions - functions + 1',
            calculationSteps: [
              {
                step: 1,
                operation: 'parse',
                inputs: [args.content],
                output: { ast: 'parsed' },
                duration_ms: 10,
              },
              {
                step: 2,
                operation: 'calculate',
                inputs: ['ast'],
                output: complexity,
                duration_ms: 5,
              },
            ],
            sourceEventIds: [analysisEvent.eventId],
            metricType: 'complexity',
            periodStart: new Date(),
            periodEnd: new Date(),
            confidence: 0.95,
          },
          organizationId
        )

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                complexity,
                eventId: analysisEvent.eventId,
                metricId: metric.metric.id,
                lineage: `event:${analysisEvent.eventId} -> metric:${metric.metric.id}`,
              }, null, 2),
            },
          ],
        }
      },
    },

    {
      name: 'record_decision',
      description: 'Capture architectural decisions with lineage',
      inputSchema: {
        type: 'object',
        properties: {
          decision: { type: 'string' },
          reasoning: { type: 'string' },
          alternatives: {
            type: 'array',
            items: { type: 'string' },
          },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
        required: ['decision', 'reasoning'],
      },
      execute: async (args: any) => {
        const session = await sessionManager.getCurrentSession()
        if (!session) {
          throw new Error('No active session')
        }

        // Create decision event
        const decisionEvent = await eventCapture.captureEvent({
          category: 'decision',
          action: 'architecture_decision',
          value: {
            decision: args.decision,
            reasoning: args.reasoning,
            alternatives: args.alternatives || [],
            timestamp: new Date(),
            sessionId: session.id,
          },
          confidence: args.confidence || 0.9,
        })

        // Add to session
        const decisionId = await sessionManager.addDecision(session.id, {
          type: 'architecture',
          decision: args.decision,
          reasoning: args.reasoning,
          alternatives: args.alternatives || [],
          confidence: args.confidence || 0.9,
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                recorded: true,
                eventId: decisionEvent.eventId,
                decisionId,
                permalink: `/decisions/${decisionEvent.eventId}`,
              }, null, 2),
            },
          ],
        }
      },
    },

    {
      name: 'track_file_change',
      description: 'Track file modifications with lineage',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string' },
          changeType: {
            type: 'string',
            enum: ['created', 'modified', 'deleted'],
          },
          linesAdded: { type: 'number' },
          linesRemoved: { type: 'number' },
          content: { type: 'string' },
        },
        required: ['filePath', 'changeType'],
      },
      execute: async (args: any) => {
        const session = await sessionManager.getCurrentSession()
        if (!session) {
          throw new Error('No active session')
        }

        // Track file change
        const changeEvent = await eventCapture.captureEvent({
          category: 'code_change',
          action: `file_${args.changeType}`,
          label: args.filePath,
          value: {
            filePath: args.filePath,
            changeType: args.changeType,
            linesAdded: args.linesAdded || 0,
            linesRemoved: args.linesRemoved || 0,
            size: args.content?.length || 0,
          },
        })

        // Update session metrics
        await sessionManager.updateMetrics(session.id, {
          filesModified: session.metrics.filesModified + 1,
          linesAdded: session.metrics.linesAdded + (args.linesAdded || 0),
          linesRemoved: session.metrics.linesRemoved + (args.linesRemoved || 0),
        })

        // Add file to session scope
        await sessionManager.addFilesToScope(session.id, [args.filePath])

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                tracked: true,
                eventId: changeEvent.eventId,
                filePath: args.filePath,
                changeType: args.changeType,
              }, null, 2),
            },
          ],
        }
      },
    },

    {
      name: 'start_session',
      description: 'Start a new Claude session with context',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          projectId: { type: 'string' },
          taskDescription: { type: 'string' },
          environment: {
            type: 'string',
            enum: ['development', 'staging', 'production'],
          },
        },
        required: ['userId', 'taskDescription'],
      },
      execute: async (args: any) => {
        const session = await sessionManager.createSession({
          userId: args.userId,
          organizationId,
          projectId: args.projectId,
          taskDescription: args.taskDescription,
          environment: args.environment || 'development',
        })

        // Create session start event
        await eventCapture.captureEvent({
          category: 'planning',
          action: 'session_start',
          label: session.taskDescription,
          value: {
            sessionId: session.id,
            userId: args.userId,
            projectId: args.projectId,
          },
        })

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                sessionId: session.id,
                status: 'active',
                taskDescription: session.taskDescription,
              }, null, 2),
            },
          ],
        }
      },
    },

    {
      name: 'end_session',
      description: 'End the current Claude session',
      inputSchema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
        },
      },
      execute: async (args: any) => {
        const session = await sessionManager.getCurrentSession()
        if (!session) {
          throw new Error('No active session')
        }

        // Create session end event
        await eventCapture.captureEvent({
          category: 'planning',
          action: 'session_end',
          label: args.summary,
          value: {
            sessionId: session.id,
            summary: args.summary,
            metrics: session.metrics,
          },
        })

        // End session
        await sessionManager.endSession(session.id)

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                sessionId: session.id,
                status: 'completed',
                summary: args.summary,
                metrics: session.metrics,
              }, null, 2),
            },
          ],
        }
      },
    },
  ]
}