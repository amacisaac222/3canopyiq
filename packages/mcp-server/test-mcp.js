#!/usr/bin/env node

// Test script to run the MCP server locally
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting CanopyIQ MCP Server in test mode...\n');

// Set environment variables
const env = {
  ...process.env,
  CANOPYIQ_API_KEY: 'test-api-key-123',
  CANOPYIQ_ENDPOINT: 'http://localhost:3000/api/claude'
};

// Start the MCP server
const mcpServer = spawn('node', [path.join(__dirname, 'dist/index.js')], {
  env,
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle server output
mcpServer.stdout.on('data', (data) => {
  console.log(`[MCP Server Output]: ${data.toString()}`);
});

mcpServer.stderr.on('data', (data) => {
  console.log(`[MCP Server]: ${data.toString()}`);
});

mcpServer.on('error', (error) => {
  console.error(`Error starting MCP server: ${error.message}`);
});

mcpServer.on('close', (code) => {
  console.log(`MCP server exited with code ${code}`);
});

// Send test commands to simulate Claude Code interactions
setTimeout(() => {
  console.log('\n📝 Sending test request to list available tools...\n');

  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };

  mcpServer.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 1000);

// Simulate a file edit event after 2 seconds
setTimeout(() => {
  console.log('\n📝 Simulating file edit tracking...\n');

  const trackFileRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'track_file_edit',
      arguments: {
        fileName: 'test-file.js',
        linesAdded: 10,
        linesRemoved: 5,
        changes: 'Added new feature'
      }
    }
  };

  mcpServer.stdin.write(JSON.stringify(trackFileRequest) + '\n');
}, 3000);

// Get session summary after 4 seconds
setTimeout(() => {
  console.log('\n📊 Getting session summary...\n');

  const summaryRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'get_session_summary',
      arguments: {}
    }
  };

  mcpServer.stdin.write(JSON.stringify(summaryRequest) + '\n');
}, 5000);

// Gracefully shutdown after 7 seconds
setTimeout(() => {
  console.log('\n🛑 Shutting down MCP server...\n');
  mcpServer.kill('SIGTERM');
  process.exit(0);
}, 7000);

console.log('Test is running for 7 seconds...\n');
console.log('The MCP server will:');
console.log('1. Start and initialize a session');
console.log('2. List available tools');
console.log('3. Track a simulated file edit');
console.log('4. Show session summary');
console.log('5. Gracefully shutdown\n');