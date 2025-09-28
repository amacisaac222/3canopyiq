# @canopyiq/mcp-server

MCP (Model Context Protocol) server for CanopyIQ that tracks Claude Code sessions and automatically generates PR documentation.

## Installation

Add the CanopyIQ MCP server to your Claude Code configuration:

### 1. Open Claude Code Settings

Open your Claude Code configuration file:
- **macOS/Linux**: `~/.config/claude/mcp_config.json`
- **Windows**: `%APPDATA%\claude\mcp_config.json`

### 2. Add CanopyIQ Server

Add the following configuration to your `mcpServers` object:

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

### 3. Get Your API Key

1. Visit [CanopyIQ Dashboard](http://localhost:3000/dashboard)
2. Go to Settings → API Keys
3. Generate a new API key for Claude Code integration
4. Replace `your-api-key` in the configuration above

## Features

The CanopyIQ MCP server automatically tracks:

- **📝 File Edits**: Every file you modify, including lines added/removed
- **💻 Commands**: Terminal commands executed during your session
- **🔍 Searches**: Code searches and queries performed
- **🌿 Git Context**: Current repository and branch information
- **⏱️ Session Duration**: Time spent on each coding session

## Available Tools

When connected, Claude Code will have access to these tools:

### `track_file_edit`
Automatically tracks when files are edited.

### `track_command`
Automatically tracks terminal commands.

### `track_search`
Automatically tracks code searches.

### `track_pr_created`
Links PR creation to your current session.

### `get_session_summary`
Get a summary of your current coding session.

## How It Works

1. **Start Coding**: When you start using Claude Code, the MCP server begins tracking your session
2. **Automatic Tracking**: All edits, commands, and searches are automatically logged
3. **Create PR**: When you create a PR, it's linked to your session
4. **Generate Documentation**: CanopyIQ automatically generates comprehensive PR documentation based on your session data

## Data Privacy

- Session data is only sent to your configured CanopyIQ endpoint
- All data transmission is secured with your API key
- No data is sent to third parties
- You control what gets tracked and documented

## Development

To run the MCP server locally for development:

```bash
# Clone the repository
git clone https://github.com/canopyiq/canopyiq.git
cd canopyiq/packages/mcp-server

# Install dependencies
npm install

# Build the server
npm run build

# Run in development mode
npm run dev
```

## Environment Variables

- `CANOPYIQ_API_KEY`: Your CanopyIQ API key
- `CANOPYIQ_ENDPOINT`: The CanopyIQ API endpoint (default: `http://localhost:3000/api/claude`)

## Troubleshooting

### Server Not Connecting

1. Check that the MCP server is properly configured in Claude Code
2. Verify your API key is valid
3. Ensure the CanopyIQ web app is running if using localhost

### Sessions Not Appearing

1. Check the Claude Sessions page in your CanopyIQ dashboard
2. Verify the endpoint URL is correct
3. Check Claude Code logs for any error messages

## Support

For issues or questions, please visit:
- [GitHub Issues](https://github.com/canopyiq/canopyiq/issues)
- [Documentation](https://docs.canopyiq.com)