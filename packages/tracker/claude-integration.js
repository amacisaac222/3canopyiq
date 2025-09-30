#!/usr/bin/env node

/**
 * Claude Code Integration Bridge
 * Automatically tracks ALL Claude Code tool usage in THIS session
 */

const ClaudeCodeContextTracker = require('./claude-code-hooks');

// Initialize tracker
const tracker = new ClaudeCodeContextTracker();

// THIS IS THE MAGIC: Hook into the actual Claude Code session
// These functions would be called by Claude Code's internal tools

/**
 * Integration points for Claude Code tools
 * In production, these would hook into the actual Claude Code MCP server
 */

// Track when Claude Code reads a file
global.onClaudeReadFile = async function(filePath, options) {
  console.log(`[Claude Integration] File read detected: ${filePath}`);
  await tracker.trackRead(filePath, options);
};

// Track when Claude Code searches
global.onClaudeSearch = async function(pattern, results, options) {
  console.log(`[Claude Integration] Search detected: ${pattern}`);
  await tracker.trackSearch(pattern, {
    ...options,
    resultCount: results?.length || 0
  });
};

// Track when Claude Code edits a file
global.onClaudeEdit = async function(filePath, oldContent, newContent, operation) {
  console.log(`[Claude Integration] Edit detected: ${filePath}`);

  const oldLines = (oldContent || '').split('\n').length;
  const newLines = (newContent || '').split('\n').length;

  await tracker.trackEdit(filePath, {
    linesAdded: Math.max(0, newLines - oldLines),
    linesRemoved: Math.max(0, oldLines - newLines),
    type: operation || 'modify'
  });
};

// Track when Claude Code runs commands
global.onClaudeCommand = async function(command, output, exitCode) {
  console.log(`[Claude Integration] Command detected: ${command}`);
  await tracker.trackCommand(command, output, { exitCode });
};

// Track decisions and alternatives
global.onClaudeDecision = async function(description, metadata) {
  console.log(`[Claude Integration] Decision point: ${description}`);
  await tracker.trackDecision(description, metadata);
};

// Track failed attempts
global.onClaudeFailure = async function(description, reason, willRetry) {
  console.log(`[Claude Integration] Failed attempt: ${description}`);
  await tracker.trackFailedAttempt(description, reason, { willRetry });
};

/**
 * Simulate Claude Code activity for demonstration
 * In production, this would be triggered by actual Claude Code tools
 */
async function demonstrateIntegration() {
  console.log('\n🚀 Claude Code Integration Active\n');
  console.log('This bridge captures ALL Claude Code activity:');
  console.log('  📖 Every file you read');
  console.log('  🔍 Every search you perform');
  console.log('  ✏️ Every edit you make');
  console.log('  💻 Every command you run');
  console.log('  🎯 Every decision point');
  console.log('  ❌ Every failed attempt\n');

  // Simulate a typical Claude Code session
  setTimeout(async () => {
    console.log('\n--- Simulating Claude Code Session ---\n');

    // 1. Exploration phase
    await global.onClaudeReadFile('/src/api/auth.ts');
    await global.onClaudeSearch('authentication error', ['/src/api/auth.ts', '/src/middleware/auth.ts']);
    await global.onClaudeReadFile('/src/middleware/auth.ts');

    // 2. Investigation
    await global.onClaudeSearch('JWT expiration', ['/src/lib/jwt.ts']);
    await global.onClaudeReadFile('/src/lib/jwt.ts');

    // 3. Failed attempt
    await global.onClaudeCommand('npm test', 'Error: JWT expiration too long', 1);
    await global.onClaudeFailure('Set JWT expiration to 10 minutes', 'GitHub API rejected token', true);

    // 4. Decision point
    await global.onClaudeDecision('Reduce JWT expiration time', {
      alternatives: ['10 minutes', '5 minutes', '30 seconds'],
      chosen: '30 seconds'
    });

    // 5. Solution
    await global.onClaudeEdit('/src/lib/jwt.ts',
      'expiresIn: 600',
      'expiresIn: 30',
      'modify'
    );

    // 6. Verification
    await global.onClaudeCommand('npm test', 'All tests passed', 0);

    // 7. Generate insights
    const insights = await tracker.generateInsights();
    console.log('\n📊 Session Insights:', insights);

  }, 1000);
}

// Export for use by MCP server or other integrations
module.exports = {
  tracker,
  onClaudeReadFile: global.onClaudeReadFile,
  onClaudeSearch: global.onClaudeSearch,
  onClaudeEdit: global.onClaudeEdit,
  onClaudeCommand: global.onClaudeCommand,
  onClaudeDecision: global.onClaudeDecision,
  onClaudeFailure: global.onClaudeFailure
};

// Run demonstration if called directly
if (require.main === module) {
  demonstrateIntegration();
}