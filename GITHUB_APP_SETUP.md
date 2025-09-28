# GitHub App Setup Guide for CanopyIQ

This guide walks you through setting up CanopyIQ as a GitHub App, which provides better security, automatic webhook management, and higher API rate limits compared to OAuth Apps.

## Step 1: Create a GitHub App

1. Go to GitHub Settings → Developer settings → **GitHub Apps**
2. Click **"New GitHub App"**

## Step 2: Configure Your GitHub App

Fill in the following details:

### Basic Information
- **GitHub App name**: `CanopyIQ` (or `CanopyIQ-Dev` for testing)
- **Description**: `Automatic PR documentation from Claude sessions`
- **Homepage URL**: `http://localhost:3007` (or your production URL)

### Identifying and authorizing users
- **Callback URL**: `http://localhost:3007/api/auth/github/callback`
- ✅ **Expire user authorization tokens**: Check this
- ❌ **Request user authorization (OAuth) during installation**: Leave unchecked
- ❌ **Enable Device Flow**: Leave unchecked

### Post installation
- **Setup URL**: `http://localhost:3007/dashboard/repositories`
- ✅ **Redirect on update**: Check this

### Webhook
- ✅ **Active**: Check this
- **Webhook URL**:
  - Development: `http://localhost:3007/api/webhooks/github` (use ngrok for testing)
  - Production: `https://yourdomain.com/api/webhooks/github`
- **Secret**: Generate with `openssl rand -hex 32`

### Permissions

#### Repository permissions:
- **Contents**: Read
- **Metadata**: Read (automatically selected)
- **Pull requests**: Write
- **Issues**: Read (optional)

#### Account permissions:
- **Email addresses**: Read

### Subscribe to events
After setting permissions, check these events:
- ✅ **Pull request**
- ✅ **Push**
- ✅ **Installation**
- ✅ **Installation repositories**

### Where can this GitHub App be installed?
- 🔘 **Only on this account** (for testing)
- 🔘 **Any account** (for production)

## Step 3: Create and Save App

Click **"Create GitHub App"**

## Step 4: Generate Credentials

After creation, you'll be on your app's settings page:

1. **Save the App ID** (shown at the top)
2. In the "Client secrets" section, click **"Generate a new client secret"**
   - Copy and save the Client Secret immediately (you won't see it again)
3. In the "Private keys" section, click **"Generate a private key"**
   - A `.pem` file will download - save this securely

## Step 5: Configure Environment Variables

1. Create `.env.local` in `apps/web/`:
```bash
cp apps/web/.env.example apps/web/.env.local
```

2. Update `.env.local` with your credentials:
```env
# GitHub App Configuration
GITHUB_APP_ID=123456
GITHUB_CLIENT_ID=Iv1.abcdef123456
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_PRIVATE_KEY_PATH=./private-key.pem
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
GITHUB_REDIRECT_URI=http://localhost:3007/api/auth/github/callback
```

3. Place your private key file in `apps/web/private-key.pem`

## Step 6: Install the App

1. Go to `https://github.com/apps/YOUR_APP_NAME`
2. Click **"Install"** or **"Configure"**
3. Select which repositories to give access to
4. Complete the installation

## Step 7: Test the Integration

1. Start the development server:
```bash
cd apps/web
npm run dev
```

2. Visit `http://localhost:3007`
3. Click "Get Started" to authenticate
4. Go to Dashboard → Repositories
5. You should see your GitHub App installation

## Testing Webhooks Locally

For local webhook testing, use ngrok:

1. Install ngrok: `npm install -g ngrok`
2. Start ngrok: `ngrok http 3007`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Update your GitHub App webhook URL to: `https://abc123.ngrok.io/api/webhooks/github`

## API Endpoints

The implementation provides these endpoints:

- `/api/auth/github` - Initiates GitHub OAuth flow
- `/api/auth/github/callback` - Handles OAuth callback
- `/api/webhooks/github` - Receives GitHub webhooks
- `/api/installations/[id]/repositories` - Fetches repos for an installation (needs implementation)

## Next Steps

To complete the backend implementation:

1. **Set up a database** to store:
   - User information
   - GitHub App installations
   - Repository connections
   - Claude session data

2. **Implement the repository API endpoint**:
```typescript
// app/api/installations/[id]/repositories/route.ts
import { getInstallationAccessToken, getInstallationRepositories } from '@/lib/github-app'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const installationId = parseInt(params.id)
  const repositories = await getInstallationRepositories(installationId)
  return Response.json({ repositories })
}
```

3. **Connect Claude MCP** to capture session data
4. **Implement PR documentation generation** from Claude sessions

## Security Notes

- Never commit `.env.local` or private key files
- Store private keys securely in production (use environment variables or secret management)
- Implement proper session management instead of cookies
- Add rate limiting to API endpoints
- Use HTTPS in production

## Troubleshooting

### "Bad credentials" error
- Verify App ID, Client ID, and Client Secret are correct
- Ensure private key file is properly formatted

### Webhook not receiving events
- Check webhook secret matches in GitHub and `.env.local`
- Verify webhook is "Active" in GitHub App settings
- Use ngrok for local testing
- Check "Recent Deliveries" in GitHub webhook settings

### No installations showing
- Ensure the GitHub App is installed on your account
- Check that the user has authorized the app
- Verify the OAuth callback is storing installation data

## Production Deployment

For production:

1. Create a production GitHub App with production URLs
2. Use environment variables for all secrets
3. Store private key securely (e.g., AWS Secrets Manager)
4. Set up proper session management
5. Implement database storage for user and installation data
6. Add monitoring and error tracking