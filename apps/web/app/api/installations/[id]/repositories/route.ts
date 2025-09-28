import { NextRequest, NextResponse } from 'next/server'
import { getInstallationAccessToken, getInstallationRepositories } from '@/lib/github-app'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user is authenticated
    const cookieStore = cookies()
    const userCookie = cookieStore.get('user')

    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const installationId = parseInt(params.id)

    // Get repositories for this installation
    const repositories = await getInstallationRepositories(installationId)

    return NextResponse.json({ repositories })
  } catch (error) {
    console.error('Error fetching repositories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}