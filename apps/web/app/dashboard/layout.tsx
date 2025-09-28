'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  GitBranch,
  Settings,
  Menu,
  X,
  Code2,
  ChevronRight,
  FolderGit2,
  BarChart3,
  Github,
  Activity
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: any
  badge?: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [githubConnected, setGithubConnected] = useState(false)
  const [claudeConnected, setClaudeConnected] = useState(false)
  const [githubDropdown, setGithubDropdown] = useState(false)
  const [claudeDropdown, setClaudeDropdown] = useState(false)
  const [activeSessions, setActiveSessions] = useState(0)

  useEffect(() => {
    const loadData = () => {
      // Get user data from API
      fetch('/api/auth/me')
        .then(res => {
          if (res.ok) {
            setGithubConnected(true)
            return res.json()
          }
          return null
        })
        .then(userData => {
          if (userData) {
            setUser(userData)
          }
        })
        .catch(error => {
          console.error('Error fetching user data:', error)
        })

      // Check Claude sessions
      fetch('/api/claude/sessions')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const active = data.filter(s => s.status === 'active').length
            setActiveSessions(active)
            setClaudeConnected(active > 0)
          }
        })
        .catch(() => {})
    }

    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const navigation: NavItem[] = [
    { name: 'Overview', href: '/dashboard', icon: Home },
    { name: 'Claude Sessions', href: '/dashboard/sessions', icon: Code2, badge: 'New' },
    { name: 'Repositories', href: '/dashboard/repositories', icon: FolderGit2 },
    { name: 'Pull Requests', href: '/dashboard/prs', icon: GitBranch },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Integration Status Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <span className="font-semibold">CanopyIQ</span>
          </div>

          <div className="flex items-center gap-3">
            {/* GitHub Status */}
            <div className="relative">
              <button
                onClick={() => {
                  setGithubDropdown(!githubDropdown)
                  setClaudeDropdown(false)
                }}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors text-sm ${
                  githubConnected
                    ? 'bg-green-500/10 hover:bg-green-500/20 text-green-500'
                    : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500'
                }`}
              >
                <Github className="w-4 h-4" />
                <span className="font-medium">GitHub</span>
                <div className={`w-2 h-2 rounded-full ${githubConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
              </button>

              {githubDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg py-2">
                  {githubConnected ? (
                    <>
                      <Link
                        href="/dashboard/repositories"
                        className="block px-4 py-2 text-sm hover:bg-surface-hover transition-colors"
                        onClick={() => setGithubDropdown(false)}
                      >
                        View Repositories
                      </Link>
                      <Link
                        href="/dashboard/prs"
                        className="block px-4 py-2 text-sm hover:bg-surface-hover transition-colors"
                        onClick={() => setGithubDropdown(false)}
                      >
                        Pull Requests
                      </Link>
                      <button
                        onClick={() => {
                          // Disconnect logic
                          setGithubDropdown(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-surface-hover transition-colors"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/api/auth/github"
                      className="block px-4 py-2 text-sm hover:bg-surface-hover transition-colors"
                      onClick={() => setGithubDropdown(false)}
                    >
                      Connect GitHub
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Claude Status */}
            <div className="relative">
              <button
                onClick={() => {
                  setClaudeDropdown(!claudeDropdown)
                  setGithubDropdown(false)
                }}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors text-sm ${
                  claudeConnected
                    ? 'bg-green-500/10 hover:bg-green-500/20 text-green-500'
                    : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span className="font-medium">Claude</span>
                {activeSessions > 0 && (
                  <span className="text-xs bg-green-500/20 px-1.5 py-0.5 rounded-full">{activeSessions}</span>
                )}
                <div className={`w-2 h-2 rounded-full ${claudeConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
              </button>

              {claudeDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-lg py-2">
                  {claudeConnected ? (
                    <>
                      <Link
                        href="/dashboard/sessions"
                        className="block px-4 py-2 text-sm hover:bg-surface-hover transition-colors"
                        onClick={() => setClaudeDropdown(false)}
                      >
                        View Active Sessions ({activeSessions})
                      </Link>
                      <button
                        onClick={() => {
                          // Stop tracking logic
                          setClaudeDropdown(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-yellow-500 hover:bg-surface-hover transition-colors"
                      >
                        Stop All Tracking
                      </button>
                    </>
                  ) : (
                    <div className="px-4 py-2">
                      <p className="text-sm text-text-muted mb-2">No active sessions</p>
                      <Link
                        href="/dashboard/sessions"
                        className="text-sm text-primary hover:underline"
                        onClick={() => setClaudeDropdown(false)}
                      >
                        View setup instructions
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User */}
            {user && (
              <div className="text-sm text-text-muted border-l border-border pl-3">
                {user.name || user.login}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-14 left-4 z-40 p-2 bg-surface border border-border rounded-lg hover:bg-surface/80 transition-colors"
      >
        {isSidebarOpen ? <X className="w-5 h-5 text-text" /> : <Menu className="w-5 h-5 text-text" />}
      </button>

      {/* Sidebar */}
      <div className={`fixed top-12 bottom-0 left-0 z-40 w-64 bg-surface/50 backdrop-blur-xl border-r border-border transform transition-transform lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo - now simplified since main logo is in header */}
          <div className="px-6 py-4 border-b border-border">
            <p className="text-xs text-text-muted uppercase tracking-wider">Navigation</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-text-muted hover:bg-surface hover:text-text'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {!isActive && !item.badge && (
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-border px-6 py-4">
            <div className="flex items-center gap-3">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name || user.login}
                  className="w-10 h-10 rounded-lg"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {user?.name?.charAt(0) || user?.login?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">
                  {user?.name || user?.login || 'User'}
                </p>
                <Link href="/dashboard/settings" className="text-xs text-text-muted hover:text-primary transition-colors">
                  Account Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content - adjusted for top status bar */}
      <div className="lg:pl-64 pt-12">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}