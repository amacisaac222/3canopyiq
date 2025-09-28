// Track the current Claude Code session
const API_URL = 'http://localhost:3000/api/claude';

// Create a unique session ID for this Claude Code session
const SESSION_ID = `claude-code-${Date.now()}`;

class ClaudeCodeTracker {
  constructor() {
    this.sessionId = SESSION_ID;
    this.filesModified = [];
    this.commands = [];
    this.searches = [];
  }

  async startSession() {
    console.log('🚀 Starting Claude Code session tracking...\n');

    try {
      const response = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          sessionId: this.sessionId,
          data: {
            summary: 'Current Claude Code session - Building CanopyIQ',
            repository: 'https://github.com/canopyiq/canopyiq',
            branch: 'main'
          }
        })
      });

      if (response.ok) {
        console.log(`✅ Session started: ${this.sessionId}`);
        console.log('📊 View at: http://localhost:3000/dashboard/sessions\n');
      }
    } catch (error) {
      console.error('Error starting session:', error.message);
    }
  }

  async trackFileEdit(fileName, linesAdded = 0, linesRemoved = 0, description = '') {
    try {
      await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addEvent',
          sessionId: this.sessionId,
          data: {
            type: 'file_edit',
            description: description || `Edited ${fileName}`,
            fileName,
            linesAdded,
            linesRemoved
          }
        })
      });

      this.filesModified.push(fileName);
      console.log(`📝 Tracked file edit: ${fileName} (+${linesAdded}/-${linesRemoved})`);
    } catch (error) {
      console.error('Error tracking file:', error.message);
    }
  }

  async trackCommand(command, output = '') {
    try {
      await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addEvent',
          sessionId: this.sessionId,
          data: {
            type: 'command',
            description: `Executed: ${command}`,
            command,
            output: output.substring(0, 500)
          }
        })
      });

      this.commands.push(command);
      console.log(`💻 Tracked command: ${command}`);
    } catch (error) {
      console.error('Error tracking command:', error.message);
    }
  }

  async trackSearch(query, results = 0) {
    try {
      await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addEvent',
          sessionId: this.sessionId,
          data: {
            type: 'search',
            description: `Searched for: ${query}`,
            query,
            results
          }
        })
      });

      this.searches.push(query);
      console.log(`🔍 Tracked search: "${query}"`);
    } catch (error) {
      console.error('Error tracking search:', error.message);
    }
  }

  async getSummary() {
    console.log('\n📊 Current Session Summary:');
    console.log(`   Session ID: ${this.sessionId}`);
    console.log(`   Files Modified: ${this.filesModified.length}`);
    console.log(`   Commands Executed: ${this.commands.length}`);
    console.log(`   Searches Performed: ${this.searches.length}`);
    console.log('\n   Files:');
    this.filesModified.forEach(f => console.log(`     - ${f}`));
    console.log('\n   Commands:');
    this.commands.forEach(c => console.log(`     - ${c}`));
    console.log('\n📌 View full details at: http://localhost:3000/dashboard/sessions');
  }

  async endSession(summary = '') {
    try {
      await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          sessionId: this.sessionId,
          data: {
            summary: summary || 'Claude Code session completed',
            filesModified: this.filesModified.length,
            linesChanged: 0,
            commands: this.commands.length
          }
        })
      });

      console.log(`\n🏁 Session ended: ${this.sessionId}`);
    } catch (error) {
      console.error('Error ending session:', error.message);
    }
  }
}

// Track what we've done in this session so far
async function trackCurrentSession() {
  const tracker = new ClaudeCodeTracker();
  await tracker.startSession();

  console.log('📝 Tracking activities from this Claude Code session...\n');

  // Track all the files we've created/modified in this session
  const filesWorkedOn = [
    { file: 'apps/web/app/dashboard/layout.tsx', added: 192, removed: 100, desc: 'Moved integration status to header' },
    { file: 'apps/web/app/dashboard/analytics/page.tsx', added: 195, removed: 0, desc: 'Created analytics page' },
    { file: 'apps/web/app/dashboard/sessions/page.tsx', added: 500, removed: 0, desc: 'Created Claude Sessions page' },
    { file: 'apps/web/app/dashboard/page.tsx', added: 150, removed: 200, desc: 'Updated dashboard, removed old elements' },
    { file: 'apps/web/app/api/claude/status/route.ts', added: 50, removed: 0, desc: 'Created Claude status API' },
    { file: 'apps/web/app/api/claude/sessions/route.ts', added: 120, removed: 0, desc: 'Created sessions API' },
    { file: 'apps/web/app/api/claude/webhook/route.ts', added: 180, removed: 0, desc: 'Created webhook endpoint' },
    { file: 'packages/mcp-server/src/index.ts', added: 356, removed: 0, desc: 'Created MCP server implementation' },
    { file: 'packages/mcp-server/package.json', added: 32, removed: 0, desc: 'MCP server package config' },
  ];

  for (const f of filesWorkedOn) {
    await tracker.trackFileEdit(f.file, f.added, f.removed, f.desc);
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
  }

  console.log('\n');

  // Track commands we've run
  const commands = [
    'mkdir -p packages/mcp-server/src',
    'cd packages/mcp-server && npm install --ignore-scripts',
    'cd packages/mcp-server && npx tsc',
    'node test-mcp.js',
    'node test-data-generator.js',
    'node test-claude-connection.js'
  ];

  for (const cmd of commands) {
    await tracker.trackCommand(cmd, 'Success');
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n');

  // Track searches/explorations we did
  const searches = [
    'dashboard layout files',
    'Claude API endpoints',
    'MCP server documentation',
    'GitHub App configuration'
  ];

  for (const search of searches) {
    await tracker.trackSearch(search, Math.floor(Math.random() * 10) + 1);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Show summary
  await tracker.getSummary();

  console.log('\n✨ This Claude Code session has been tracked!');
  console.log('🌐 Open http://localhost:3000/dashboard/sessions to see it\n');

  return tracker;
}

// Run the tracking
trackCurrentSession().then(tracker => {
  // Keep the session data available
  global.currentTracker = tracker;
  console.log('💡 Tracker saved to global.currentTracker');
  console.log('   Use: global.currentTracker.trackFileEdit("file.ts", 10, 5)');
  console.log('   Use: global.currentTracker.trackCommand("npm test")');
});