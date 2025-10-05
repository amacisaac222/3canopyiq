# Deploy CanopyIQ to Render

## Prerequisites

✅ GitHub App created (App ID: 2024979)
✅ Private key file: `apps/web/private-key.pem`
✅ Render account: https://render.com

## Step 1: Push to GitHub

```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin master
```

## Step 2: Deploy via Render Blueprint

1. Go to https://render.com/deploy
2. Click **"New Blueprint Instance"**
3. Connect your GitHub repository: `your-username/canopyiq`
4. Render will read `render.yaml` and show you what it will create:
   - PostgreSQL database
   - Redis cache
   - Web service (Next.js app)
   - MCP server (WebSocket)

## Step 3: Set Secret Environment Variables

Before clicking "Apply", you need to add the secret variables that can't be in the YAML:

### For `canopyiq-web` service:

1. **GITHUB_PRIVATE_KEY**: Copy the entire contents of `apps/web/private-key.pem` (including the BEGIN/END lines)
2. **GITHUB_WEBHOOK_SECRET**: Generate a secure random string:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Optional (but recommended):

3. **SENTRY_DSN**: If you want error tracking, create a project at https://sentry.io
4. **NEXT_PUBLIC_SENTRY_DSN**: Same as above

## Step 4: Click "Apply"

Render will:
- Create the database and Redis
- Build Docker images for both services
- Deploy everything
- Auto-wire the DATABASE_URL and REDIS_URL between services

This takes about 5-10 minutes.

## Step 5: Get Your URLs

Once deployed, you'll have:
- **Web app**: `https://canopyiq-web.onrender.com`
- **MCP server**: `https://canopyiq-mcp.onrender.com`

## Step 6: Update GitHub App Webhook

1. Go to https://github.com/settings/apps/canopyiq-ai
2. Update **Webhook URL** to: `https://canopyiq-web.onrender.com/api/github/webhook`
3. Save changes

## Step 7: Run Database Migrations

You need to run migrations once:

1. In Render Dashboard, go to **canopyiq-web** service
2. Click **"Shell"** tab
3. Run:
   ```bash
   cd /app && pnpm --filter @canopyiq/database db:push
   ```

## Step 8: Verify Everything Works

1. Visit `https://canopyiq-web.onrender.com/api/health`
2. You should see a health check response with all services "healthy"

## Troubleshooting

### Build fails with "Cannot find module"
- Check that all `workspace:*` dependencies are properly resolved
- Verify `pnpm-workspace.yaml` is in the root

### Database connection fails
- Make sure DATABASE_URL is properly set from the Render database
- Check that the database was created successfully

### GitHub webhooks not working
- Verify the webhook URL is updated in GitHub App settings
- Check that GITHUB_WEBHOOK_SECRET matches in both places
- Look at Render logs for incoming webhook requests

## Cost Estimate (Render Free/Starter Tiers)

- PostgreSQL Starter: $7/month
- Redis Starter: $10/month
- Web service (512MB RAM): $7/month
- MCP service (512MB RAM): $7/month

**Total: ~$31/month**

Or use the free tier to test (services sleep after inactivity).

## Next Steps

- Set up custom domain: canopyiq.ai
- Configure SSL (automatic with Render)
- Set up monitoring and alerts
- Enable auto-deploy on push to master
