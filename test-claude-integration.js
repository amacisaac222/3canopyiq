#!/usr/bin/env node

/**
 * Test Claude Code Integration
 * Demonstrates the deep context tracking capabilities
 */

const API_BASE = 'http://localhost:3001/api';
const SESSION_ID = `test-claude-${Date.now()}`;

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function trackEvent(type, data) {
  try {
    const response = await fetch(`${API_BASE}/claude/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: SESSION_ID,
        action: 'addContextualEvent',
        data: {
          type,
          ...data
        }
      })
    });
    const result = await response.json();
    console.log(`✓ Tracked ${type}: ${data.description}`);
    return result;
  } catch (error) {
    console.error(`✗ Failed to track ${type}:`, error.message);
  }
}

async function runDemo() {
  console.log('\n🚀 Testing Claude Code Deep Context Tracking\n');
  console.log(`Session ID: ${SESSION_ID}`);
  console.log(`Dashboard: http://localhost:3001/dashboard/sessions\n`);

  // Phase 1: Exploration
  console.log('📖 Phase 1: Exploration & Discovery');
  await trackEvent('exploration', {
    description: 'Exploring authentication module',
    metadata: {
      filePath: '/src/api/auth.ts',
      fileName: 'auth.ts',
      lines: 245,
      isRevisit: false
    }
  });
  await wait(500);

  await trackEvent('exploration', {
    description: 'Checking middleware implementation',
    metadata: {
      filePath: '/src/middleware/auth.ts',
      fileName: 'auth.ts',
      lines: 180,
      isRevisit: false
    }
  });
  await wait(500);

  // Phase 2: Search & Investigation
  console.log('\n🔍 Phase 2: Search & Investigation');
  await trackEvent('search', {
    description: 'Searching for JWT expiration issues',
    pattern: 'JWT.*expir',
    metadata: {
      resultCount: 5,
      files: ['/src/lib/jwt.ts', '/src/api/auth.ts']
    }
  });
  await wait(500);

  await trackEvent('search', {
    description: 'Finding token refresh logic',
    pattern: 'refreshToken|refresh_token',
    metadata: {
      resultCount: 3,
      files: ['/src/api/refresh.ts']
    }
  });
  await wait(500);

  // Phase 3: Failed Attempts
  console.log('\n❌ Phase 3: Challenges & Recovery');
  await trackEvent('failed_attempt', {
    description: 'Attempted to set JWT expiration to 10 minutes',
    metadata: {
      reason: 'GitHub API rejected long-lived tokens',
      willRetry: true,
      errorCode: 'TOKEN_TOO_LONG'
    }
  });
  await wait(500);

  await trackEvent('command', {
    description: 'Running authentication tests',
    metadata: {
      command: 'npm test auth',
      hasError: true,
      exitCode: 1,
      output: 'Error: JWT expiration too long for GitHub API'
    }
  });
  await wait(500);

  // Phase 4: Decision Points
  console.log('\n🎯 Phase 4: Decision Making');
  await trackEvent('decision', {
    description: 'Choosing JWT expiration time',
    metadata: {
      alternatives: ['10 minutes', '5 minutes', '30 seconds'],
      chosen: '30 seconds',
      reasoning: 'GitHub API requires short-lived tokens for security'
    }
  });
  await wait(500);

  // Phase 5: Solution Implementation
  console.log('\n✅ Phase 5: Solution & Implementation');
  await trackEvent('file_edit', {
    description: 'Updated JWT expiration to 30 seconds',
    metadata: {
      filePath: '/src/lib/jwt.ts',
      fileName: 'jwt.ts',
      linesAdded: 1,
      linesRemoved: 1,
      type: 'modify'
    }
  });
  await wait(500);

  // Phase 6: Verification
  console.log('\n🔄 Phase 6: Verification');
  await trackEvent('command', {
    description: 'Re-running authentication tests',
    metadata: {
      command: 'npm test auth',
      hasError: false,
      exitCode: 0,
      output: 'All tests passed (12/12)'
    }
  });
  await wait(500);

  await trackEvent('exploration', {
    description: 'Verifying JWT changes in auth module',
    metadata: {
      filePath: '/src/api/auth.ts',
      fileName: 'auth.ts',
      lines: 245,
      isRevisit: true
    }
  });
  await wait(500);

  // Phase 7: Generate Insights
  console.log('\n📊 Phase 7: Session Insights');
  await trackEvent('session_insights', {
    description: 'Generated session insights',
    metadata: {
      explorationDepth: 3,
      searchPatterns: 2,
      failedAttempts: 2,
      timeToSolution: 5,
      filesExplored: 4,
      decisionsPoints: 1,
      verificationSteps: 2
    }
  });

  console.log('\n✨ Demo Complete!');
  console.log(`\nView the journey visualization at:`);
  console.log(`http://localhost:3001/dashboard/sessions`);
  console.log(`\nLook for session: ${SESSION_ID}\n`);
}

runDemo().catch(console.error);