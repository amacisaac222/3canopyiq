import { App, createNodeMiddleware } from '@octokit/app'
import { createAppAuth } from '@octokit/auth-app'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

// GitHub App configuration
const APP_ID = process.env.GITHUB_APP_ID!
const CLIENT_ID = process.env.GITHUB_CLIENT_ID!
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET!

// Private key can be provided as a path or as a string
const getPrivateKey = () => {
  if (process.env.GITHUB_PRIVATE_KEY) {
    return process.env.GITHUB_PRIVATE_KEY
  }

  if (process.env.GITHUB_PRIVATE_KEY_PATH) {
    const keyPath = path.resolve(process.cwd(), process.env.GITHUB_PRIVATE_KEY_PATH)
    return fs.readFileSync(keyPath, 'utf8')
  }

  throw new Error('GitHub App private key not configured')
}

// Initialize GitHub App
export const githubApp = new App({
  appId: APP_ID,
  privateKey: getPrivateKey(),
  webhooks: {
    secret: WEBHOOK_SECRET,
  },
})

// Create JWT for app authentication
export const createAppJWT = () => {
  const privateKey = getPrivateKey()

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iat: now - 30, // Issued 30 seconds ago to account for clock drift
    exp: now + (5 * 60), // Expires in 5 minutes (well under GitHub's 10 minute max)
    iss: APP_ID,
  }

  return jwt.sign(payload, privateKey, { algorithm: 'RS256' })
}

// Get installation access token
export const getInstallationAccessToken = async (installationId: number) => {
  const appJWT = createAppJWT()

  console.log('Getting installation access token for:', installationId)
  console.log('App ID:', APP_ID)

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${appJWT}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('GitHub API error:', errorText)
    throw new Error(`Failed to get installation access token: ${response.status}`)
  }

  const data = await response.json()
  return data.token
}

// Get user installations
export const getUserInstallations = async (userAccessToken: string) => {
  const response = await fetch('https://api.github.com/user/installations', {
    headers: {
      'Authorization': `Bearer ${userAccessToken}`,
      'Accept': 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get user installations: ${response.status}`)
  }

  const data = await response.json()
  return data.installations
}

// Get repositories for an installation
export const getInstallationRepositories = async (installationId: number) => {
  const token = await getInstallationAccessToken(installationId)

  const response = await fetch('https://api.github.com/installation/repositories', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get installation repositories: ${response.status}`)
  }

  const data = await response.json()
  return data.repositories
}

// OAuth flow for GitHub App
export const exchangeCodeForToken = async (code: string) => {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to exchange code for access token')
  }

  return response.json()
}

// Verify webhook signature
export const verifyWebhookSignature = (
  payload: string,
  signature: string
): boolean => {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}