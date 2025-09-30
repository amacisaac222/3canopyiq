import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

interface SessionEvent {
  type: string
  subtype?: string
  description: string
  timestamp: string
  metadata?: any
}

interface SessionData {
  sessionId: string
  events: SessionEvent[]
  filesModified: number
  linesChanged: number
  commands: number
  repository?: string
  branch?: string
  insights?: any
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, sessionData, prData, generateType = 'pr_description' } = await request.json()

    if (!sessionData || !sessionData.events) {
      return NextResponse.json({ error: 'No session data provided' }, { status: 400 })
    }

    // Prepare context from session events
    const context = prepareContext(sessionData)

    // Generate documentation based on type
    let documentation;
    switch (generateType) {
      case 'pr_description':
        documentation = await generatePRDescription(context, prData)
        break
      case 'implementation_guide':
        documentation = await generateImplementationGuide(context)
        break
      case 'test_plan':
        documentation = await generateTestPlan(context)
        break
      case 'knowledge_doc':
        documentation = await generateKnowledgeDoc(context)
        break
      default:
        return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 })
    }

    return NextResponse.json({
      documentation,
      sessionId,
      generatedAt: new Date().toISOString(),
      type: generateType
    })
  } catch (error) {
    console.error('Documentation generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate documentation' },
      { status: 500 }
    )
  }
}

function prepareContext(sessionData: SessionData) {
  const events = sessionData.events || []

  // Extract different event types
  const explorations = events.filter(e => e.type === 'exploration')
  const searches = events.filter(e => e.type === 'search')
  const edits = events.filter(e => e.type === 'file_edit')
  const commands = events.filter(e => e.type === 'command')
  const errors = events.filter(e =>
    e.type === 'command' && e.metadata?.hasError
  )
  const decisions = events.filter(e => e.type === 'decision')
  const failedAttempts = events.filter(e => e.type === 'failed_attempt')

  // Build exploration path
  const explorationPath = explorations.map(e => ({
    file: e.metadata?.filePath || e.description,
    readCount: e.metadata?.readCount || 1,
    isRevisit: e.metadata?.isRevisit || false
  }))

  // Analyze search patterns
  const searchPatterns = searches.map(s => ({
    pattern: s.metadata?.pattern || s.description,
    resultCount: s.metadata?.resultCount || 0,
    ledToEdit: s.metadata?.ledToEdit || false
  }))

  // Extract error recovery patterns
  const errorRecovery = errors.map((e, i) => {
    const nextCommands = commands.slice(
      commands.indexOf(e) + 1,
      commands.indexOf(e) + 4
    )
    return {
      error: e.metadata?.errorMessage,
      command: e.metadata?.command,
      recovery: nextCommands.map(c => c.metadata?.command)
    }
  })

  // Calculate complexity metrics
  const complexity = {
    explorationDepth: new Set(explorations.map(e =>
      e.metadata?.filePath
    )).size,
    searchComplexity: searches.length,
    iterationCount: failedAttempts.length + errors.length,
    decisionPoints: decisions.length,
    timeToSolution: calculateTimeToSolution(events)
  }

  return {
    events,
    explorationPath,
    searchPatterns,
    edits,
    commands,
    errors,
    errorRecovery,
    decisions,
    failedAttempts,
    complexity,
    filesModified: sessionData.filesModified,
    linesChanged: sessionData.linesChanged
  }
}

async function generatePRDescription(context: any, prData: any) {
  const prompt = `
You are an expert technical writer analyzing a coding session to generate a comprehensive PR description.

## Session Context:
- Files Modified: ${context.filesModified}
- Lines Changed: ${context.linesChanged}
- Searches Performed: ${context.searchPatterns.length}
- Commands Executed: ${context.commands.length}
- Errors Encountered: ${context.errors.length}
- Decision Points: ${context.decisions.length}

## Exploration Path:
${context.explorationPath.slice(0, 10).map((e: any) =>
  `- ${e.file} (read ${e.readCount} times${e.isRevisit ? ', revisited' : ''})`
).join('\n')}

## Search Patterns:
${context.searchPatterns.slice(0, 10).map((s: any) =>
  `- "${s.pattern}" (${s.resultCount} results${s.ledToEdit ? ', led to edit' : ''})`
).join('\n')}

## File Edits:
${context.edits.slice(0, 10).map((e: any) =>
  `- ${e.description} (+${e.metadata?.linesAdded || 0}/-${e.metadata?.linesRemoved || 0})`
).join('\n')}

## Errors and Recovery:
${context.errorRecovery.slice(0, 5).map((e: any) =>
  `- Error: ${e.error}\n  Recovery: ${e.recovery.join(' -> ')}`
).join('\n')}

## Failed Attempts:
${context.failedAttempts.slice(0, 5).map((f: any) =>
  `- ${f.description}: ${f.metadata?.reason}`
).join('\n')}

Based on this rich context, generate a comprehensive PR description that includes:

1. **Problem Statement**: What issue was being solved (inferred from searches and explorations)
2. **Solution Approach**: How the problem was solved (from edits and decisions)
3. **Implementation Details**: Key changes made and why
4. **Challenges Faced**: Errors encountered and how they were resolved
5. **Testing Performed**: Commands run to verify the solution
6. **Alternative Approaches**: What was tried but didn't work
7. **Impact Assessment**: Risk level and affected areas

Format as a professional GitHub PR description with proper markdown.
`

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 2000,
    temperature: 0.3,
    messages: [{
      role: 'user',
      content: prompt
    }]
  })

  return response.content[0].text
}

async function generateImplementationGuide(context: any) {
  const prompt = `
Analyze this coding session and create an implementation guide for other developers.

## Session Analysis:
- Exploration Depth: ${context.complexity.explorationDepth} unique files
- Search Complexity: ${context.complexity.searchComplexity} searches
- Iteration Count: ${context.complexity.iterationCount} attempts
- Decision Points: ${context.complexity.decisionPoints}

## Journey:
${context.events.slice(0, 30).map((e: any) =>
  `${e.timestamp}: ${e.type} - ${e.description}`
).join('\n')}

Create a step-by-step implementation guide that includes:
1. Prerequisites and setup
2. File exploration order
3. Key searches to perform
4. Implementation steps
5. Common pitfalls to avoid
6. Verification steps

Make it actionable and easy to follow.
`

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1500,
    temperature: 0.3,
    messages: [{
      role: 'user',
      content: prompt
    }]
  })

  return response.content[0].text
}

async function generateTestPlan(context: any) {
  const prompt = `
Based on this coding session, generate a comprehensive test plan.

## Changes Made:
${context.edits.map((e: any) => e.description).join('\n')}

## Commands Run:
${context.commands.filter((c: any) =>
  c.metadata?.commandType === 'test'
).map((c: any) => c.metadata?.command).join('\n')}

## Errors Encountered:
${context.errors.map((e: any) => e.metadata?.errorMessage).join('\n')}

Generate a test plan covering:
1. Unit tests needed
2. Integration tests required
3. Edge cases to cover
4. Performance considerations
5. Regression tests

Be specific and actionable.
`

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1000,
    temperature: 0.3,
    messages: [{
      role: 'user',
      content: prompt
    }]
  })

  return response.content[0].text
}

async function generateKnowledgeDoc(context: any) {
  const prompt = `
Extract key learnings and create a knowledge document from this coding session.

## Problem Solving Journey:
- Searches: ${context.searchPatterns.map((s: any) => s.pattern).join(', ')}
- Decisions: ${context.decisions.map((d: any) => d.description).join('; ')}
- Failed Attempts: ${context.failedAttempts.length}
- Error Recovery: ${context.errorRecovery.length} patterns

Create a knowledge document with:
1. Problem diagnosis approach
2. Solution patterns discovered
3. Key insights and learnings
4. Reusable code snippets
5. Best practices identified
6. Anti-patterns to avoid

Make it valuable for future reference.
`

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 1200,
    temperature: 0.3,
    messages: [{
      role: 'user',
      content: prompt
    }]
  })

  return response.content[0].text
}

function calculateTimeToSolution(events: SessionEvent[]) {
  if (events.length < 2) return 0

  const firstEvent = new Date(events[0].timestamp).getTime()
  const lastEdit = events
    .filter(e => e.type === 'file_edit')
    .pop()

  if (!lastEdit) return 0

  const lastEditTime = new Date(lastEdit.timestamp).getTime()
  return Math.round((lastEditTime - firstEvent) / 1000 / 60) // minutes
}

// GET endpoint to check available documentation types
export async function GET() {
  return NextResponse.json({
    availableTypes: [
      {
        type: 'pr_description',
        name: 'PR Description',
        description: 'Comprehensive pull request documentation'
      },
      {
        type: 'implementation_guide',
        name: 'Implementation Guide',
        description: 'Step-by-step guide for other developers'
      },
      {
        type: 'test_plan',
        name: 'Test Plan',
        description: 'Testing strategy and test cases'
      },
      {
        type: 'knowledge_doc',
        name: 'Knowledge Document',
        description: 'Learnings and best practices'
      }
    ]
  })
}