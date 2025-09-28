import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const userCookie = cookieStore.get('user')

  if (!userCookie) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const userData = JSON.parse(userCookie.value)

    // Don't expose sensitive data like access_token to the client
    const safeUserData = {
      id: userData.id,
      login: userData.login,
      name: userData.name,
      email: userData.email,
      avatar_url: userData.avatar_url,
      installations: userData.installations
    }

    return NextResponse.json(safeUserData)
  } catch (error) {
    console.error('Error parsing user cookie:', error)
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }
}