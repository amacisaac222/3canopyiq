#!/usr/bin/env node

const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');
require('dotenv').config();

// Configuration
const API_URL = process.env.CANOPYIQ_API_URL || 'http://localhost:3000/api/claude';
const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const SESSION_ID = `claude-auto-${Date.now()}`;

// Session tracking
let sessionData = {
  sessionId: SESSION_ID,
  filesModified: new Set(),
  commands: [],
  searches: [],
  startTime: new Date().toISOString()
};

// File tracking cache
let fileContents = new Map();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}[CanopyIQ Tracker]${colors.reset} ${message}`);
}

// Start session
async function startSession() {
  try {
    // Get git info if available
    let repository = '';
    let branch = 'main';

    try {
      repository = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
      branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch (e) {
      // Not a git repo, that's okay
    }

    const response = await axios.post(`${API_URL}/sessions`, {
      action: 'start',
      sessionId: SESSION_ID,
      data: {
        summary: 'Auto-tracked Claude Code session',
        repository,
        branch
      }
    });

    log(`✅ Session started: ${SESSION_ID}`, colors.green);
    log(`📊 Dashboard: http://localhost:3000/dashboard/sessions`, colors.cyan);

    return response.data;
  } catch (error) {
    log(`Failed to start session: ${error.message}`, colors.yellow);
  }
}

// Track file changes
async function trackFileChange(filePath, changeType) {
  try {
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    // Skip if file is in excluded patterns
    if (shouldExclude(relativePath)) return;

    let linesAdded = 0;
    let linesRemoved = 0;
    let changes = changeType;

    // Try to get line diff if file was modified
    if (changeType === 'change' && fileContents.has(filePath)) {
      try {
        const oldContent = fileContents.get(filePath);
        const newContent = await fs.readFile(filePath, 'utf8');

        const oldLines = oldContent.split('\n').length;
        const newLines = newContent.split('\n').length;

        linesAdded = Math.max(0, newLines - oldLines);
        linesRemoved = Math.max(0, oldLines - newLines);

        // Update cache
        fileContents.set(filePath, newContent);
      } catch (e) {
        // File might have been deleted or moved
      }
    } else if (changeType === 'add') {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        linesAdded = content.split('\n').length;
        fileContents.set(filePath, content);
      } catch (e) {
        // Ignore
      }
    }

    // Send to API
    await axios.post(`${API_URL}/sessions`, {
      action: 'addEvent',
      sessionId: SESSION_ID,
      data: {
        type: 'file_edit',
        description: `${changeType}: ${relativePath}`,
        fileName: relativePath,
        linesAdded,
        linesRemoved,
        changes
      }
    });

    sessionData.filesModified.add(relativePath);

    const icon = changeType === 'add' ? '➕' : changeType === 'change' ? '📝' : '🗑️';
    log(`${icon} ${changeType}: ${relativePath} (+${linesAdded}/-${linesRemoved})`, colors.blue);

  } catch (error) {
    log(`Error tracking file change: ${error.message}`, colors.yellow);
  }
}

// Check if file should be excluded
function shouldExclude(filePath) {
  const excludePatterns = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '.cache',
    'coverage',
    '*.log'
  ];

  return excludePatterns.some(pattern => filePath.includes(pattern));
}

// Track command execution (hook into terminal if possible)
async function trackCommand(command, output = '') {
  try {
    await axios.post(`${API_URL}/sessions`, {
      action: 'addEvent',
      sessionId: SESSION_ID,
      data: {
        type: 'command',
        description: `Executed: ${command}`,
        command,
        output: output.substring(0, 500)
      }
    });

    sessionData.commands.push(command);
    log(`💻 Command: ${command}`, colors.magenta);

  } catch (error) {
    log(`Error tracking command: ${error.message}`, colors.yellow);
  }
}

// Initialize file watcher
function startWatching() {
  const watcher = chokidar.watch('.', {
    ignored: /(^|[\/\\])\../, // Ignore dotfiles
    persistent: true,
    cwd: PROJECT_ROOT,
    ignoreInitial: true,
    depth: 10
  });

  watcher
    .on('add', path => trackFileChange(path, 'add'))
    .on('change', path => trackFileChange(path, 'change'))
    .on('unlink', path => trackFileChange(path, 'delete'))
    .on('error', error => log(`Watcher error: ${error}`, colors.yellow));

  log('👁️  Watching for file changes...', colors.green);

  // Pre-cache existing files
  watcher.on('ready', async () => {
    const watched = watcher.getWatched();
    for (const dir in watched) {
      for (const file of watched[dir]) {
        const fullPath = path.join(dir, file);
        if (!shouldExclude(fullPath)) {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            fileContents.set(fullPath, content);
          } catch (e) {
            // Ignore directories and unreadable files
          }
        }
      }
    }
    log(`📁 Cached ${fileContents.size} files for diff tracking`, colors.cyan);
  });

  return watcher;
}

// Handle graceful shutdown
async function shutdown() {
  try {
    await axios.post(`${API_URL}/sessions`, {
      action: 'end',
      sessionId: SESSION_ID,
      data: {
        summary: `Session ended after tracking ${sessionData.filesModified.size} files`,
        filesModified: sessionData.filesModified.size,
        commands: sessionData.commands.length
      }
    });

    log(`\n🏁 Session ended: ${SESSION_ID}`, colors.green);
    log(`📊 Files tracked: ${sessionData.filesModified.size}`, colors.cyan);
    log(`💻 Commands tracked: ${sessionData.commands.length}`, colors.cyan);

  } catch (error) {
    log(`Error ending session: ${error.message}`, colors.yellow);
  }

  process.exit(0);
}

// Main function
async function main() {
  console.clear();
  log('🚀 CanopyIQ Auto-Tracker Starting...', colors.bright + colors.green);
  log('===================================', colors.cyan);

  // Start session
  await startSession();

  // Start watching files
  const watcher = startWatching();

  // Monitor for manual commands (this is a simplified version)
  // In production, you'd want to hook into the actual terminal
  log('\n💡 Tip: File changes are tracked automatically!', colors.cyan);
  log('💡 View live updates at: http://localhost:3000/dashboard/sessions\n', colors.cyan);

  // Example: Track some test commands
  setTimeout(() => trackCommand('npm install'), 5000);
  setTimeout(() => trackCommand('npm run dev'), 10000);

  // Handle shutdown
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep process alive
  process.stdin.resume();
}

// Check if being run directly or imported
if (require.main === module) {
  main().catch(console.error);
} else {
  // Export for use as a module
  module.exports = {
    startSession,
    trackFileChange,
    trackCommand,
    startWatching,
    SESSION_ID
  };
}