// Script to generate test data for CanopyIQ
const API_URL = 'http://localhost:3000/api/claude';

async function makeRequest(endpoint, data) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`Request failed: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.log(`Request error: ${error.message}`);
    return null;
  }
}

async function generateTestData() {
  console.log('🚀 Generating test data for CanopyIQ...\n');

  try {
    // Create a test session
    const sessionId = `test-session-${Date.now()}`;

    console.log('1. Starting a new session...');
    await makeRequest('/sessions', {
      action: 'start',
      sessionId: sessionId,
      data: {
        summary: 'Test session for demonstration',
        repository: 'https://github.com/test/repo',
        branch: 'main'
      }
    });

    console.log('2. Adding file edit events...');

    // Add some file edit events
    const files = [
      { fileName: 'src/components/Header.tsx', linesAdded: 25, linesRemoved: 10, changes: 'Updated header styling' },
      { fileName: 'src/api/auth.ts', linesAdded: 45, linesRemoved: 5, changes: 'Added authentication logic' },
      { fileName: 'src/utils/helpers.ts', linesAdded: 15, linesRemoved: 3, changes: 'Added utility functions' }
    ];

    for (const file of files) {
      await makeRequest('/sessions', {
        action: 'addEvent',
        sessionId: sessionId,
        data: {
          type: 'file_edit',
          description: `Edited ${file.fileName}`,
          ...file
        }
      });
      console.log(`   ✓ Added file edit: ${file.fileName}`);
    }

    console.log('3. Adding command events...');

    // Add command events
    const commands = [
      { command: 'npm install axios', output: 'added 5 packages' },
      { command: 'npm run build', output: 'Build successful' },
      { command: 'git status', output: '3 files modified' }
    ];

    for (const cmd of commands) {
      await makeRequest('/sessions', {
        action: 'addEvent',
        sessionId: sessionId,
        data: {
          type: 'command',
          description: `Executed: ${cmd.command}`,
          ...cmd
        }
      });
      console.log(`   ✓ Added command: ${cmd.command}`);
    }

    console.log('4. Adding search events...');

    // Add search events
    const searches = [
      { query: 'authentication middleware', results: 5 },
      { query: 'useState hook', results: 12 }
    ];

    for (const search of searches) {
      await makeRequest('/sessions', {
        action: 'addEvent',
        sessionId: sessionId,
        data: {
          type: 'search',
          description: `Searched for: ${search.query}`,
          ...search
        }
      });
      console.log(`   ✓ Added search: ${search.query}`);
    }

    console.log('5. Linking to a PR...');

    // Update session with PR info
    await makeRequest('/sessions', {
      action: 'update',
      sessionId: sessionId,
      data: {
        prNumber: 42,
        prTitle: 'Add authentication system',
        repository: 'https://github.com/test/repo'
      }
    });

    console.log('6. Ending session...');

    // End the session
    await makeRequest('/sessions', {
      action: 'end',
      sessionId: sessionId,
      data: {
        summary: 'Completed authentication system implementation'
      }
    });

    console.log('\n✅ Test data generated successfully!');
    console.log('\n📊 View your data at:');
    console.log('   Dashboard: http://localhost:3000/dashboard');
    console.log('   Sessions: http://localhost:3000/dashboard/sessions');
    console.log('   Analytics: http://localhost:3000/dashboard/analytics');

    // Fetch and display the sessions
    console.log('\n📋 Current sessions in the system:');
    try {
      const response = await fetch(`${API_URL}/sessions`);
      if (response.ok) {
        const sessions = await response.json();
        console.log(JSON.stringify(sessions, null, 2));
      } else {
        console.log('Could not fetch sessions - you may need to be authenticated');
      }
    } catch (error) {
      console.log('Error fetching sessions:', error.message);
    }

  } catch (error) {
    console.error('Error generating test data:', error.message);
  }
}

// Run the generator
generateTestData();