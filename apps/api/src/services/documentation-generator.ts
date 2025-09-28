import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'
import { postCommentToPR } from './github-client'

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface GenerateDocOptions {
  pullRequestId: string
  regenerate?: boolean
}

export async function generateDocumentation(options: GenerateDocOptions) {
  const { pullRequestId, regenerate = false } = options

  try {
    // Get PR with sessions
    const pr = await prisma.pullRequest.findUnique({
      where: { id: pullRequestId },
      include: {
        sessions: true,
        repository: true,
        organization: true,
        author: true,
        documentation: true
      }
    })

    if (!pr) {
      throw new Error(`Pull request ${pullRequestId} not found`)
    }

    // Skip if already documented (unless regenerating)
    if (pr.documentationGenerated && !regenerate) {
      console.log(`PR #${pr.number} already has documentation`)
      return pr.documentation
    }

    // Get all Claude sessions linked to this PR
    if (pr.sessions.length === 0) {
      console.log(`No Claude sessions found for PR #${pr.number}`)
      return null
    }

    // Generate documentation from sessions
    const docContent = await generateDocFromSessions(pr.sessions)

    // Calculate metrics
    const metrics = calculateMetrics(pr.sessions, docContent)

    // Save documentation
    const documentation = await prisma.documentation.upsert({
      where: { pullRequestId },
      create: {
        pullRequestId,
        content: docContent.content,
        summary: docContent.summary,
        decisions: docContent.decisions,
        securityImpact: docContent.securityImpact,
        performanceImpact: docContent.performanceImpact,
        breakingChanges: docContent.breakingChanges,
        aiContribution: metrics.aiContribution,
        timeSaved: metrics.timeSaved,
        issuesPrevented: metrics.issuesPrevented
      },
      update: {
        content: docContent.content,
        summary: docContent.summary,
        decisions: docContent.decisions,
        securityImpact: docContent.securityImpact,
        performanceImpact: docContent.performanceImpact,
        breakingChanges: docContent.breakingChanges,
        aiContribution: metrics.aiContribution,
        timeSaved: metrics.timeSaved,
        issuesPrevented: metrics.issuesPrevented
      }
    })

    // Update PR
    await prisma.pullRequest.update({
      where: { id: pullRequestId },
      data: {
        documentationGenerated: true,
        documentationQuality: metrics.quality
      }
    })

    // Post to GitHub
    if (pr.organization.githubInstallationId) {
      await postDocumentationToPR(pr, documentation)

      await prisma.pullRequest.update({
        where: { id: pullRequestId },
        data: { documentationPosted: true }
      })
    }

    console.log(`Generated documentation for PR #${pr.number}`)

    return documentation
  } catch (error) {
    console.error('Documentation generation error:', error)
    throw error
  }
}

async function generateDocFromSessions(sessions: any[]): Promise<any> {
  // Combine all conversation chunks and decisions
  const allDecisions: string[] = []
  const allConversations: any[] = []
  const filesChanged = new Set<string>()

  for (const session of sessions) {
    allDecisions.push(...(session.decisionsExtracted || []))
    allConversations.push(...(session.conversationChunks || []))

    if (session.filesChanged) {
      session.filesChanged.forEach((file: string) => filesChanged.add(file))
    }
  }

  // Use GPT-4 to analyze and generate documentation
  const prompt = `
You are analyzing Claude Code sessions to generate PR documentation.

Decisions made during sessions:
${allDecisions.join('\n')}

Files changed:
${Array.from(filesChanged).join('\n')}

Generate professional PR documentation that includes:
1. Summary (2-3 sentences)
2. What changed and why (bullet points)
3. Architecture decisions with reasoning
4. Security implications
5. Performance impact
6. Breaking changes (if any)

Format the response as JSON with these fields:
- content: Full markdown documentation
- summary: Brief summary
- decisions: Array of key decisions
- securityImpact: "low", "medium", or "high"
- performanceImpact: "negative", "neutral", or "positive"
- breakingChanges: boolean
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: 'You are a technical documentation expert.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 2000
  })

  const result = JSON.parse(response.choices[0].message.content || '{}')

  // Add contribution breakdown
  const developerContribution = 100 - calculateAvgAIContribution(sessions)

  result.content = `${result.content}

---

## Contribution Breakdown

- **Developer (${developerContribution}%)**: Architecture decisions, design choices, code review
- **AI Assistant (${100 - developerContribution}%)**: Boilerplate code, syntax suggestions, implementation details

*Documentation generated automatically by [CodeNarrative](https://codenarrative.ai) from Claude Code sessions.*`

  return result
}

function calculateMetrics(sessions: any[], docContent: any) {
  // Calculate average AI contribution
  const aiContributions = sessions
    .map(s => s.aiContribution || 50)
    .filter(c => c !== null)

  const aiContribution = aiContributions.length > 0
    ? Math.round(aiContributions.reduce((a, b) => a + b) / aiContributions.length)
    : 30

  // Estimate time saved (based on doc length and complexity)
  const wordCount = docContent.content.split(' ').length
  const timeSaved = Math.round(wordCount / 40) // Assume 40 words per minute writing speed

  // Estimate issues prevented based on decisions made
  const issuesPrevented = Math.floor(docContent.decisions.length / 3)

  // Calculate quality score
  let quality = 70 // Base score

  if (docContent.summary) quality += 10
  if (docContent.decisions.length > 0) quality += 10
  if (docContent.securityImpact) quality += 5
  if (docContent.performanceImpact) quality += 5

  return {
    aiContribution,
    timeSaved,
    issuesPrevented,
    quality: Math.min(100, quality)
  }
}

function calculateAvgAIContribution(sessions: any[]): number {
  const contributions = sessions
    .map(s => s.aiContribution)
    .filter(c => c !== null && c !== undefined)

  if (contributions.length === 0) return 30

  return Math.round(
    contributions.reduce((a, b) => a + b) / contributions.length
  )
}

async function postDocumentationToPR(pr: any, doc: any) {
  const comment = `## 📝 CodeNarrative Documentation

${doc.content}

### Metrics
- ⏱️ **Time saved**: ${doc.timeSaved} minutes
- 🛡️ **Issues prevented**: ${doc.issuesPrevented}
- 🤖 **AI contribution**: ${doc.aiContribution}%
- 👨‍💻 **Developer contribution**: ${100 - doc.aiContribution}%
`

  await postCommentToPR(
    pr.organization.githubInstallationId,
    pr.repository.fullName,
    pr.number,
    comment
  )
}

export { generateDocFromSessions, calculateMetrics }