# GitHub App Setup Guide for CanopyIQ

## Creating a GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the following details:

   - **Application name**: CanopyIQ (Development)
   - **Homepage URL**: http://localhost:3007
   - **Authorization callback URL**: http://localhost:3007/api/auth/github/callback
   - **Application description**: Automatic PR documentation from Claude sessions

4. Click "Register application"
5. Copy the **Client ID**
6. Generate a new **Client Secret** and copy it immediately (you won't be able to see it again)

## Setting up Environment Variables

1. Copy `.env.example` to `.env.local` in the `apps/web` directory:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

2. Update the following variables in `.env.local`:
   ```
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   GITHUB_REDIRECT_URI=http://localhost:3007/api/auth/github/callback
   ```

3. Generate a webhook secret (use a random string generator or run this command):
   ```bash
   openssl rand -hex 32
   ```

   Add it to your `.env.local`:
   ```
   GITHUB_WEBHOOK_SECRET=your_generated_secret_here
   ```

## Setting up Webhooks (for PR automation)

1. Go to your repository → Settings → Webhooks
2. Click "Add webhook"
3. Configure the webhook:

   - **Payload URL**: https://your-domain.com/api/webhooks/github
     (For local testing, use ngrok: `ngrok http 3007`)
   - **Content type**: application/json
   - **Secret**: Use the same secret from `GITHUB_WEBHOOK_SECRET`
   - **Which events?**: Select individual events:
     - Pull requests
     - Pushes
   - **Active**: Check this box

4. Click "Add webhook"

## Testing the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3007
3. Click "Get Started" or "Sign in"
4. You'll be redirected to GitHub to authorize the app
5. After authorization, you'll be redirected back to the dashboard

## Required GitHub Permissions

The app requests the following OAuth scopes:
- `read:user` - Read user profile information
- `user:email` - Access user email addresses
- `repo` - Full control of private repositories
- `write:repo_hook` - Write repository hooks

## Production Setup

For production deployment:

1. Create a production GitHub OAuth App with your production URLs
2. Update environment variables with production values:
   ```
   GITHUB_REDIRECT_URI=https://yourdomain.com/api/auth/github/callback
   ```
3. Set up webhooks with your production webhook URL
4. Ensure all environment variables are properly configured in your hosting platform

## Troubleshooting

### "Bad credentials" error
- Double-check your Client ID and Client Secret
- Ensure there are no extra spaces in the environment variables

### Redirect URI mismatch
- The redirect URI in your GitHub app settings must exactly match `GITHUB_REDIRECT_URI`
- Include the protocol (http:// or https://) and port number if applicable

### Webhook not receiving events
- Verify the webhook secret matches in both GitHub and your environment variables
- Check that the webhook is marked as "Active" in GitHub
- Use the "Recent Deliveries" tab in GitHub webhook settings to debug

## Security Notes

- Never commit `.env.local` or any file containing secrets
- In production, use a proper session management system instead of storing tokens in cookies
- Implement rate limiting on webhook endpoints
- Use HTTPS in production for all OAuth flows