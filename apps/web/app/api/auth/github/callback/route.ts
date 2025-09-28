import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCodeForToken, getUserInstallations } from '@/lib/github-app'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || ''
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || ''

interface GitHubAccessTokenResponse {
  access_token: string
  token_type: string
  scope: string
}

interface GitHubUser {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const cookieStore = cookies()
  const savedState = cookieStore.get('github_oauth_state')?.value
  const authIntent = cookieStore.get('auth_intent')?.value || 'login'

  // Verify state to prevent CSRF attacks
  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(new URL('/login?error=invalid_request', request.url))
  }

  try {
    console.log('GitHub callback - exchanging code for token...')
    // Exchange code for access token using GitHub App
    const tokenData: GitHubAccessTokenResponse = await exchangeCodeForToken(code)
    console.log('Token exchange successful')

    // Get user information
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    })

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user information')
    }

    const userData: GitHubUser = await userResponse.json()
    console.log('User data fetched:', userData.login)

    // Get user email if not public
    if (!userData.email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json'
        }
      })

      if (emailResponse.ok) {
        const emails = await emailResponse.json()
        const primaryEmail = emails.find((e: any) => e.primary)
        if (primaryEmail) {
          userData.email = primaryEmail.email
        }
      }
    }

    // Get user's GitHub App installations
    let installations = []
    try {
      installations = await getUserInstallations(tokenData.access_token)
    } catch (error) {
      console.log('No installations found for user')
    }

    // Here you would typically:
    // 1. Create or update user in your database
    // 2. Store the user's installations
    // 3. Create a session token
    // 4. Set session cookie

    // Determine redirect URL based on installation status
    const redirectUrl = installations.length > 0
      ? '/dashboard'
      : '/dashboard/repositories?install=true'

    // For now, we'll store basic info in a cookie (in production, use a proper session management system)
    const response = NextResponse.redirect(new URL(redirectUrl, request.url))

    response.cookies.set('user', JSON.stringify({
      id: userData.id,
      login: userData.login,
      name: userData.name,
      email: userData.email,
      avatar_url: userData.avatar_url,
      access_token: tokenData.access_token, // In production, store this securely in your database
      installations: installations.map((i: any) => ({ id: i.id, account: i.account })) // Store installation info
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    // Clean up OAuth state cookies
    response.cookies.delete('github_oauth_state')
    response.cookies.delete('auth_intent')

    return response

  } catch (error) {
    console.error('GitHub OAuth error:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.redirect(new URL('/login?error=authentication_failed', request.url))
  }
}