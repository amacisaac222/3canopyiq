// Test script to simulate Claude Code MCP activity
const API_URL = 'http://localhost:3000/api/claude';

async function simulateClaudeActivity() {
  console.log('🤖 Simulating Claude Code MCP Activity...\n');

  try {
    // 1. Register a connection (simulate MCP server connecting)
    console.log('1. Registering MCP connection...');
    const connectResponse = await fetch(`${API_URL}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectionId: 'claude-desktop-001',
        action: 'connect'
      })
    });
    console.log('   Connection registered:', connectResponse.ok ? '✓' : '✗');

    // 2. Start a Claude session
    console.log('\n2. Starting Claude Code session...');
    const sessionId = `claude-${Date.now()}`;

    const webhookResponse = await fetch(`${API_URL}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'session.started',
        sessionId: sessionId,
        payload: {
          summary: 'Claude Code session via MCP',
          repository: 'https://github.com/user/project',
          branch: 'main'
        }
      })
    });
    console.log('   Session started:', webhookResponse.ok ? '✓' : '✗');

    // 3. Simulate file edits
    console.log('\n3. Tracking file edits...');
    const files = [
      { fileName: 'app.tsx', linesAdded: 30, linesRemoved: 5 },
      { fileName: 'api/route.ts', linesAdded: 20, linesRemoved: 10 }
    ];

    for (const file of files) {
      await fetch(`${API_URL}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'file.edited',
          sessionId: sessionId,
          payload: {
            fileName: file.fileName,
            linesAdded: file.linesAdded,
            linesRemoved: file.linesRemoved,
            changes: `Modified ${file.fileName}`
          }
        })
      });
      console.log(`   ✓ Tracked: ${file.fileName}`);
    }

    // 4. Simulate commands
    console.log('\n4. Tracking commands...');
    const commands = ['npm install', 'npm run dev', 'git status'];

    for (const cmd of commands) {
      await fetch(`${API_URL}/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'command.executed',
          sessionId: sessionId,
          payload: {
            command: cmd,
            output: 'Command executed successfully'
          }
        })
      });
      console.log(`   ✓ Command: ${cmd}`);
    }

    // 5. Check status
    console.log('\n5. Checking connection status...');
    const statusResponse = await fetch(`${API_URL}/status`);
    const status = await statusResponse.json();
    console.log('   Status:', JSON.stringify(status, null, 2));

    // 6. Get sessions
    console.log('\n6. Fetching sessions...');
    const sessionsResponse = await fetch(`${API_URL}/sessions`);
    const sessions = await sessionsResponse.json();
    console.log('   Sessions found:', Array.isArray(sessions) ? sessions.length : 0);

    if (Array.isArray(sessions) && sessions.length > 0) {
      const latestSession = sessions[0];
      console.log('\n📊 Latest Session:');
      console.log(`   ID: ${latestSession.sessionId}`);
      console.log(`   Files: ${latestSession.filesModified}`);
      console.log(`   Commands: ${latestSession.commands}`);
      console.log(`   Events: ${latestSession.events?.length || 0}`);
    }

    console.log('\n✅ Simulation complete!');
    console.log('\n📌 Next Steps:');
    console.log('1. Check http://localhost:3000/dashboard/sessions');
    console.log('2. Configure Claude Desktop with the MCP server');
    console.log('3. See CLAUDE_CODE_INTEGRATION.md for setup instructions');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the simulation
simulateClaudeActivity();