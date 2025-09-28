# CanopyIQ MCP Server - Local Setup Guide

## Quick Setup for Claude Code

### Step 1: Locate Your Claude Code Config File

The MCP configuration file is typically located at:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Step 2: Add the MCP Server Configuration

Since you have the MCP server built locally, add this to your Claude Code config file:

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

**Note**: If you already have other MCP servers configured, just add the `canopyiq` entry to the existing `mcpServers` object.

### Step 3: Restart Claude Code

After saving the configuration file, restart Claude Code for the changes to take effect.

### Step 4: Verify the Connection

1. Open Claude Code
2. Check the CanopyIQ dashboard at http://localhost:3000/dashboard/sessions
3. You should see the connection status change to "Connected"

## Testing the Integration

Once connected, the MCP server will automatically track:
- Every file you edit
- Commands you run
- Searches you perform
- PRs you create

You can test it by:
1. Asking Claude to edit a file
2. Running a command through Claude
3. Creating a PR

Then check the dashboard to see your session data!

## Available MCP Tools in Claude Code

When connected, you'll have access to these tools:
- `track_file_edit` - Automatically tracks file changes
- `track_command` - Automatically logs commands
- `track_search` - Records searches
- `track_pr_created` - Links PRs to sessions
- `get_session_summary` - View current session stats

## Troubleshooting

### MCP Server Not Connecting

1. Make sure the web app is running (`npm run dev` in apps/web)
2. Check that the path to index.js is correct
3. Look for errors in Claude Code's developer console

### Session Not Appearing

1. Verify the API endpoint is accessible: http://localhost:3000/api/claude/status
2. Check the browser console for any errors
3. Ensure cookies are enabled

## For NPM Installation (Future)

Once published to NPM, you can use the simpler configuration:

```json
{
  "mcpServers": {
    "canopyiq": {
      "command": "npx",
      "args": ["@canopyiq/mcp-server"],
      "env": {
        "CANOPYIQ_API_KEY": "your-api-key",
        "CANOPYIQ_ENDPOINT": "http://localhost:3000/api/claude"
      }
    }
  }
}
```

## Need Help?

- Check the Claude Sessions page for setup instructions
- View the MCP server logs in Claude Code's console
- The test script `test-mcp.js` can verify the server is working