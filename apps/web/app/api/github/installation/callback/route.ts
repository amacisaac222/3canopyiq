import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const installationId = searchParams.get('installation_id')
  const setupAction = searchParams.get('setup_action') // 'install' or 'update'

  // Get the user cookie to update with new installation
  const cookieStore = cookies()
  const userCookie = cookieStore.get('user')

  if (!userCookie) {
    // User not authenticated, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const userData = JSON.parse(userCookie.value)

    // If we have an installation ID, add it to the user's installations
    if (installationId && setupAction === 'install') {
      // In production, you'd fetch full installation details from GitHub API
      // For now, just add the installation ID
      if (!userData.installations) {
        userData.installations = []
      }

      // Check if installation already exists
      const existingInstallation = userData.installations.find(
        (inst: any) => inst.id === parseInt(installationId)
      )

      if (!existingInstallation) {
        userData.installations.push({
          id: parseInt(installationId),
          account: { login: userData.login, avatar_url: userData.avatar_url }
        })
      }

      // Update the user cookie with new installation
      const response = NextResponse.redirect(
        new URL('/dashboard/repositories?installed=true', request.url)
      )

      response.cookies.set('user', JSON.stringify(userData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      })

      return response
    }

    // Redirect to repositories page
    return NextResponse.redirect(new URL('/dashboard/repositories', request.url))
  } catch (error) {
    console.error('Error handling installation callback:', error)
    return NextResponse.redirect(new URL('/dashboard/repositories?error=installation', request.url))
  }
}