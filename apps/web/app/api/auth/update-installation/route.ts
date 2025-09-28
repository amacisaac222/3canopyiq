import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { installationId } = await request.json()

    if (!installationId) {
      return NextResponse.json({ error: 'Installation ID required' }, { status: 400 })
    }

    const cookieStore = cookies()
    const userCookie = cookieStore.get('user')

    if (!userCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userData = JSON.parse(userCookie.value)

    // Initialize installations array if it doesn't exist
    if (!userData.installations) {
      userData.installations = []
    }

    // Check if installation already exists
    const existingInstallation = userData.installations.find(
      (inst: any) => inst.id === parseInt(installationId)
    )

    if (!existingInstallation) {
      // Add new installation
      userData.installations.push({
        id: parseInt(installationId),
        account: {
          login: userData.login,
          avatar_url: userData.avatar_url
        }
      })

      // Update the cookie with new installation
      const response = NextResponse.json({ success: true })

      response.cookies.set('user', JSON.stringify(userData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      })

      return response
    }

    return NextResponse.json({ success: true, message: 'Installation already exists' })
  } catch (error) {
    console.error('Error updating installation:', error)
    return NextResponse.json({ error: 'Failed to update installation' }, { status: 500 })
  }
}