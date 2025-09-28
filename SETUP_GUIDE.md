# CodeNarrative Setup Guide

## ✅ Completed Steps

1. **Database Setup** - SQLite database initialized and ready
2. **API Server** - Running on http://localhost:5000
3. **Frontend** - Running on http://localhost:3000

## 🚀 Next Steps

### Step 1: Create a GitHub App

1. Go to https://github.com/settings/apps
2. Click "New GitHub App"
3. Fill in the following:
   - **App Name**: CodeNarrative-YourName (must be unique)
   - **Homepage URL**: http://localhost:3000
   - **Webhook URL**: Leave empty for now (we'll use ngrok later)
   - **Webhook Secret**: Generate a random string

4. **Permissions** - Set these repository permissions:
   - Pull requests: Read & Write
   - Contents: Read
   - Metadata: Read
   - Issues: Read

5. **Subscribe to events**:
   - Pull request
   - Pull request review
   - Pull request review comment

6. Click "Create GitHub App"

7. After creation, note down:
   - App ID
   - Client ID
   - Client Secret (generate one)
   - Private Key (generate and download)

8. Update your `.env` file:
```env
GITHUB_APP_ID="your-app-id"
GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"
GITHUB_WEBHOOK_SECRET="your-webhook-secret"
```

9. For the private key, save it as `github-app.private-key.pem` in the api folder

### Step 2: Add OpenAI API Key

1. Get your OpenAI API key from https://platform.openai.com/api-keys
2. Update your `.env` file:
```env
OPENAI_API_KEY="sk-..."
```

### Step 3: Install the GitHub App

1. Go to your GitHub App settings
2. Click "Install App"
3. Choose your account or organization
4. Select repositories to give access to
5. Complete installation

### Step 4: Configure MCP Server for Claude Code

1. Open Claude Code settings
2. Add the MCP server configuration:
```json
{
  "mcpServers": {
    "codenarrative": {
      "command": "node",
      "args": ["C:\\Users\\amaci\\Desktop\\3CanopyIQ\\packages\\mcp-server\\dist\\index.js"],
      "env": {
        "CODENARRATIVE_API_URL": "http://localhost:5000/api",
        "CODENARRATIVE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Step 5: Create Your First User

1. Open http://localhost:3000
2. Click "Start Free Beta"
3. Sign up with your email
4. You'll be logged into the dashboard

### Step 6: Test the Integration

1. Create a new PR in one of your connected repos
2. Use Claude Code to make changes
3. The MCP server will track your session
4. When you push, the PR will automatically get documentation

## 🎯 Current Status

- ✅ Database initialized
- ✅ API server running on port 5000
- ✅ Frontend running on port 3000
- ⏳ GitHub App needs to be created
- ⏳ OpenAI API key needs to be added
- ⏳ MCP server needs to be configured

## 📝 Important URLs

- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 🛠️ Troubleshooting

### Port already in use
If you get port conflicts, you can change the ports in:
- API: `apps/api/.env` - Change PORT value
- Frontend: Next.js uses 3000 by default

### Database issues
Reset the database:
```bash
cd apps/api
rm dev.db
npx prisma db push
```

### API not connecting
Make sure the API URL in the frontend matches your API port:
- Check `apps/web/.env.local` has the correct API_URL

## 🚦 Quick Commands

```bash
# Start everything
pnpm dev

# Start API only
cd apps/api && npm run dev

# Start frontend only
cd apps/web && npm run dev

# Build MCP server
cd packages/mcp-server && npm run build

# Check API health
curl http://localhost:5000/health
```