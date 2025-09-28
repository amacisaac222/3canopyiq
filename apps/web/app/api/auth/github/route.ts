import { NextRequest, NextResponse } from 'next/server'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || ''
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/api/auth/github/callback'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const isSignup = searchParams.get('signup') === 'true'

  console.log('GitHub Auth - Client ID:', GITHUB_CLIENT_ID)
  console.log('GitHub Auth - Redirect URI:', GITHUB_REDIRECT_URI)

  // Generate a random state for CSRF protection
  const state = Math.random().toString(36).substring(7)

  // GitHub App uses the same OAuth flow for user authorization
  // The main difference is that the app has already been installed
  const response = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?` +
    `client_id=${GITHUB_CLIENT_ID}&` +
    `redirect_uri=${GITHUB_REDIRECT_URI}&` +
    `state=${state}`
  )

  response.cookies.set('github_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10 // 10 minutes
  })

  response.cookies.set('auth_intent', isSignup ? 'signup' : 'login', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10 // 10 minutes
  })

  return response
}