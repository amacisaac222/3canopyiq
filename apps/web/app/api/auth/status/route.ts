import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const userCookie = cookieStore.get('user')

  if (!userCookie) {
    return NextResponse.json({
      github: false,
      claude: false,
      user: null
    })
  }

  try {
    const userData = JSON.parse(userCookie.value)

    return NextResponse.json({
      github: true,
      claude: false, // Claude integration not yet implemented
      user: {
        name: userData.name || userData.login,
        email: userData.email,
        avatar: userData.avatar_url
      }
    })
  } catch (error) {
    console.error('Error parsing user cookie:', error)
    return NextResponse.json({
      github: false,
      claude: false,
      user: null
    })
  }
}