# Claude Code + CanopyIQ Integration Guide

## ⚠️ Important: Claude Code MCP Configuration

Claude Code (the desktop app) needs to be configured to use the CanopyIQ MCP server.

## Step 1: Find Your Claude Desktop Config File

The configuration file location varies by Claude Desktop version:

### Option A: Check Claude Desktop Settings
1. Open Claude Desktop
2. Go to Settings → Developer → Model Context Protocol
3. Click "Edit Config" or "Open Config File"

### Option B: Common Locations
- **Windows**:
  - `%APPDATA%\Claude\claude_desktop_config.json`
  - `%USERPROFILE%\.claude\mcp_config.json`
  - `%LOCALAPPDATA%\Claude\config.json`

### Option C: Create the Config
If no config exists, create it at:
`%USERPROFILE%\.claude\claude_desktop_config.json`

## Step 2: Add CanopyIQ MCP Server Configuration

Add this to your config file:

```json
{
  "mcpServers": {
    "canopyiq": {
      "command": "C:\\Users\\amaci\\Desktop\\3CanopyIQ\\packages\\mcp-server\\dist\\index.js.bat",
      "env": {
        "CANOPYIQ_API_KEY": "test-api-key-123",
        "CANOPYIQ_ENDPOINT": "http://localhost:3000/api/claude"
      }
    }
  }
}
```

**Note**: If you already have other MCP servers, add `canopyiq` to the existing `mcpServers` object.

## Step 3: Verify the Integration

1. **Restart Claude Desktop** completely (not just close the window)
2. **Check the MCP Connection**:
   - Open Claude Desktop
   - Open Developer Tools (if available)
   - Look for "[CanopyIQ MCP Server] Ready for connections" in the console

3. **Check the Dashboard**:
   - Open http://localhost:3000/dashboard/sessions
   - The status should show "Connected" when Claude Desktop is running

## Step 4: Test the Integration

In Claude Desktop, try these commands to trigger tracking:

1. **Ask Claude to edit a file**:
   ```
   "Create a new React component called TestComponent.tsx"
   ```

2. **Run a command**:
   ```
   "Run npm install in the terminal"
   ```

3. **Search for something**:
   ```
   "Search for authentication functions in the codebase"
   ```

Then check http://localhost:3000/dashboard/sessions to see the tracked activities!

## Troubleshooting

### MCP Server Not Starting

1. **Check the path is correct**:
   ```
   dir C:\Users\amaci\Desktop\3CanopyIQ\packages\mcp-server\dist\index.js
   ```

2. **Test the batch file**:
   ```
   C:\Users\amaci\Desktop\3CanopyIQ\packages\mcp-server\dist\index.js.bat
   ```

3. **Check Node.js is in PATH**:
   ```
   node --version
   ```

### No Data Appearing

1. **Verify the web app is running**:
   - Check http://localhost:3000 is accessible
   - Ensure `npm run dev` is running in `apps/web`

2. **Check Claude Desktop Console**:
   - Open Developer Tools in Claude Desktop
   - Look for any error messages
   - Check for "[CanopyIQ]" log messages

3. **Test the API directly**:
   ```
   curl http://localhost:3000/api/claude/status
   ```

### Alternative: Direct Node Command

If the batch file doesn't work, try using node directly in the config:

```json
{
  "mcpServers": {
    "canopyiq": {
      "command": "node",
      "args": ["C:\\Users\\amaci\\Desktop\\3CanopyIQ\\packages\\mcp-server\\dist\\index.js"],
      "env": {
        "CANOPYIQ_API_KEY": "test-api-key-123",
        "CANOPYIQ_ENDPOINT": "http://localhost:3000/api/claude"
      }
    }
  }
}
```

## What Should Happen When It Works

When properly connected, you'll see:

1. **In Claude Desktop Console**:
   ```
   [CanopyIQ MCP Server] Ready for connections
   [CanopyIQ] Endpoint: http://localhost:3000/api/claude
   [CanopyIQ] Session started: claude-xxxxx-xxxxx
   ```

2. **In the Dashboard** (http://localhost:3000/dashboard/sessions):
   - Connection status: "Connected" (green)
   - Active session appearing in the list
   - Real-time events as you use Claude

3. **Available Tools in Claude**:
   When you type "/" in Claude, you should see CanopyIQ tools:
   - `/track_file_edit`
   - `/track_command`
   - `/track_search`
   - `/get_session_summary`

## Manual Test

To verify the MCP server works independently:

1. Open a terminal
2. Run: `node C:\Users\amaci\Desktop\3CanopyIQ\packages\mcp-server\test-mcp.js`
3. You should see successful tool listings and session tracking

## Need Help?

1. Check Claude Desktop version (must support MCP)
2. Ensure all paths use double backslashes in JSON
3. Try running Claude Desktop as Administrator
4. Check Windows Firewall isn't blocking localhost:3000