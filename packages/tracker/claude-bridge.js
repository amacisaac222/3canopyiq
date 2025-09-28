#!/usr/bin/env node

/**
 * Claude Code Activity Bridge
 * Intercepts and tracks Claude Code tool usage in real-time
 */

const fs = require('fs').promises;
const path = require('path');
const { trackFileChange, trackCommand, SESSION_ID } = require('./index');

// Track different Claude Code tool usage
class ClaudeCodeBridge {
  constructor() {
    this.lastFiles = new Map();
    this.sessionId = SESSION_ID;
  }

  // Track Read tool usage
  async trackRead(filePath) {
    console.log(`📖 Read: ${filePath}`);
    // This would be tracked as exploration, not modification
  }

  // Track Write tool usage
  async trackWrite(filePath, content) {
    const relativePath = path.relative(process.cwd(), filePath);
    const lines = content.split('\n').length;

    await trackFileChange(filePath, 'add');
    console.log(`✍️ Write: ${relativePath} (${lines} lines)`);
  }

  // Track Edit tool usage
  async trackEdit(filePath, oldContent, newContent) {
    const relativePath = path.relative(process.cwd(), filePath);

    const oldLines = oldContent.split('\n').length;
    const newLines = newContent.split('\n').length;
    const linesAdded = Math.max(0, newLines - oldLines);
    const linesRemoved = Math.max(0, oldLines - newLines);

    await trackFileChange(filePath, 'change');
    console.log(`✏️ Edit: ${relativePath} (+${linesAdded}/-${linesRemoved})`);
  }

  // Track Bash tool usage
  async trackBash(command, output) {
    await trackCommand(command, output);
    console.log(`🖥️ Bash: ${command}`);
  }

  // Track Search/Grep tool usage
  async trackSearch(query, results) {
    // This could be sent as a search event
    console.log(`🔍 Search: "${query}" (${results} results)`);
  }
}

// Export for use by MCP server or direct integration
module.exports = ClaudeCodeBridge;

// If run directly, start monitoring mode
if (require.main === module) {
  const bridge = new ClaudeCodeBridge();

  console.log('🌉 Claude Code Bridge Active');
  console.log('This bridge will track Claude Code tool usage');
  console.log('Session ID:', SESSION_ID);

  // Example usage (in production, this would hook into actual Claude Code tools)
  setTimeout(() => {
    bridge.trackWrite('test.js', 'console.log("test");');
  }, 2000);

  setTimeout(() => {
    bridge.trackBash('npm test', 'Tests passed');
  }, 4000);
}