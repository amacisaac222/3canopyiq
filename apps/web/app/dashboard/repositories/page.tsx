'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Github, Link2, LinkIcon, CheckCircle, AlertCircle, Loader2, Plus, Settings } from 'lucide-react'

interface Repository {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  language: string | null
  updated_at: string
  connected?: boolean
  permissions?: {
    admin: boolean
    push: boolean
    pull: boolean
  }
}

interface Installation {
  id: number
  account: {
    login: string
    avatar_url: string
  }
}

export default function RepositoriesPage() {
  const searchParams = useSearchParams()
  const shouldInstall = searchParams.get('install') === 'true'
  const justInstalled = searchParams.get('installed') === 'true'
  const installationId = searchParams.get('installation_id')
  const setupAction = searchParams.get('setup_action')

  const [repositories, setRepositories] = useState<Repository[]>([])
  const [installations, setInstallations] = useState<Installation[]>([])
  const [selectedInstallation, setSelectedInstallation] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  useEffect(() => {
    // Handle GitHub App installation callback
    if (installationId && setupAction === 'install') {
      handleInstallationCallback()
    } else {
      fetchInstallations()
    }
  }, [])

  useEffect(() => {
    // Show installation prompt if user just authenticated and has no installations
    if (shouldInstall && !loading && installations.length === 0) {
      setShowInstallPrompt(true)
      // Optionally auto-open the installation page
      setTimeout(() => {
        installGitHubApp()
      }, 1500) // Give user time to see the message
    }

    // Show success message if user just installed the app
    if (justInstalled && !loading && installations.length > 0) {
      setShowSuccessMessage(true)
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 5000) // Hide after 5 seconds
    }
  }, [shouldInstall, justInstalled, loading, installations])

  useEffect(() => {
    if (selectedInstallation) {
      fetchRepositories(selectedInstallation)
    }
  }, [selectedInstallation])

  const handleInstallationCallback = async () => {
    // GitHub has redirected back after installation
    setShowSuccessMessage(true)
    setLoading(true)

    try {
      // Update user with new installation
      if (installationId) {
        const updateResponse = await fetch('/api/auth/update-installation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ installationId })
        })

        if (!updateResponse.ok) {
          console.error('Failed to update installation')
        }
      }

      // Fetch installations normally (will now include the new one)
      await fetchInstallations()

      // Clean up URL to remove query parameters
      window.history.replaceState({}, '', '/dashboard/repositories')

      // Show success for longer
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 5000)
    } catch (error) {
      console.error('Error handling installation callback:', error)
      setError('Failed to complete installation setup')
    }
  }

  const fetchInstallations = async () => {
    try {
      // Get user data from API
      const response = await fetch('/api/auth/me')

      if (!response.ok) {
        setError('Not authenticated. Please sign in.')
        setLoading(false)
        return
      }

      const user = await response.json()

      // Check if user has installations
      if (user.installations && user.installations.length > 0) {
        setInstallations(user.installations)
        setSelectedInstallation(user.installations[0].id)
      } else {
        setError('No GitHub App installations found. Please install the CanopyIQ GitHub App first.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Error fetching installations:', err)
      setError('Failed to load installations')
      setLoading(false)
    }
  }

  const fetchRepositories = async (installationId: number) => {
    setLoading(true)
    try {
      // In production, this would call your backend API that uses installation access tokens
      const response = await fetch(`/api/installations/${installationId}/repositories`)

      if (!response.ok) {
        // For now, show a placeholder message
        setRepositories([])
        setError('Repository fetching requires backend implementation')
      } else {
        const data = await response.json()
        setRepositories(data.repositories)
      }
    } catch (err) {
      console.error('Error fetching repositories:', err)
      setRepositories([])
    } finally {
      setLoading(false)
    }
  }

  const installGitHubApp = () => {
    // Redirect to GitHub App installation page
    const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME || 'canopyiq-dev'
    window.open(`https://github.com/apps/${appName}/installations/new`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Repository Management</h1>
        <p className="text-text-muted">
          Connect your repositories to automatically generate PR documentation from Claude sessions.
        </p>
      </div>

      {/* Success message */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-600 font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            GitHub App successfully installed! Your repositories will appear below.
          </p>
        </div>
      )}

      {/* Installation selector */}
      {installations.length > 0 && (
        <div className="mb-6 p-4 bg-surface border border-border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-2">GitHub App Installation</p>
              <select
                value={selectedInstallation || ''}
                onChange={(e) => setSelectedInstallation(Number(e.target.value))}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
              >
                {installations.map(install => (
                  <option key={install.id} value={install.id}>
                    {install.account.login}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={installGitHubApp}
              className="px-4 py-2 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Manage App
            </button>
          </div>
        </div>
      )}

      {/* No installations state */}
      {installations.length === 0 && (
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
          {showInstallPrompt && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-primary font-medium">
                ✨ Welcome! You're almost done. Just one more step to connect your repositories.
              </p>
            </div>
          )}
          <Github className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {shouldInstall ? 'One More Step!' : 'GitHub App Not Installed'}
          </h3>
          <p className="text-text-muted mb-6">
            {shouldInstall
              ? 'You\'ve successfully authenticated! Now install the GitHub App on your repositories to start tracking PRs.'
              : 'Install the CanopyIQ GitHub App to start connecting your repositories.'}
          </p>
          <button
            onClick={installGitHubApp}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
          >
            <Github className="w-5 h-5" />
            Install GitHub App
          </button>
          {shouldInstall && (
            <p className="text-xs text-text-muted mt-4">
              Opening installation page in a new tab...
            </p>
          )}
        </div>
      )}

      {/* Repositories list */}
      {installations.length > 0 && repositories.length > 0 && (
        <div className="grid gap-4">
          {repositories.map(repo => (
            <div
              key={repo.id}
              className="bg-surface border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{repo.name}</h3>
                    {repo.private && (
                      <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 text-xs rounded-full">
                        Private
                      </span>
                    )}
                    {repo.connected && (
                      <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Connected
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-text-muted mb-3">
                    {repo.description || 'No description'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-primary rounded-full" />
                        {repo.language}
                      </span>
                    )}
                    <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-text-muted hover:text-text transition-colors"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Placeholder for backend implementation */}
      {installations.length > 0 && repositories.length === 0 && !error && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-yellow-600">Backend Implementation Required</h3>
          <p className="text-sm text-yellow-600/80">
            To fetch repositories, you need to implement the backend API endpoint that uses GitHub App installation access tokens.
            Create an API route at <code className="bg-black/20 px-1 rounded">/api/installations/[id]/repositories</code> that
            fetches repos using the installation access token.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}