'use client'

import { useState } from 'react'
import {
  Settings,
  Shield,
  Bell,
  Code,
  Database,
  Key,
  Globe,
  Users,
  Save,
  AlertCircle,
  Check,
  Github,
  Zap
} from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [saved, setSaved] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    general: {
      organizationName: 'Acme Corp',
      email: 'admin@acme.com',
      timezone: 'America/New_York',
      language: 'en'
    },
    github: {
      connected: true,
      username: 'acme-corp',
      repositories: ['main-app', 'api-service', 'web-client'],
      webhooks: true,
      autoDoc: true
    },
    claude: {
      connected: true,
      apiKey: '•••••••••••••key',
      model: 'claude-3-opus',
      autoAnalyze: true,
      contextWindow: 200000
    },
    notifications: {
      email: true,
      slack: false,
      prDocumented: true,
      securityAlerts: true,
      weeklyReports: true
    },
    security: {
      twoFactorAuth: true,
      ssoEnabled: false,
      ipWhitelist: [],
      apiTokens: 3
    }
  })

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'github', name: 'GitHub', icon: Github },
    { id: 'claude', name: 'Claude Code', icon: Code },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'data', name: 'Data & Privacy', icon: Database },
    { id: 'team', name: 'Team', icon: Users },
    { id: 'api', name: 'API Keys', icon: Key }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-text">Settings</h1>
          <p className="text-sm text-text-muted mt-1">
            Configure your CodeNarrative workspace
          </p>
        </div>
      </div>

      <div className="flex">
        {/* Settings Navigation */}
        <div className="w-64 border-r border-border bg-surface/30 min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'text-text-muted hover:bg-surface/50 hover:text-text'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-text mb-6">General Settings</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={settings.general.organizationName}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, organizationName: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={settings.general.email}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, email: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => setSettings({
                      ...settings,
                      general: { ...settings.general, timezone: e.target.value }
                    })}
                    className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* GitHub Settings */}
          {activeTab === 'github' && (
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-text mb-6">GitHub Integration</h2>

              <div className="bg-surface/50 border border-border rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Github className="w-8 h-8 text-text" />
                    <div>
                      <p className="font-medium text-text">GitHub Account</p>
                      <p className="text-sm text-text-muted">@{settings.github.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-500">Connected</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text">Automatic Documentation</p>
                      <p className="text-xs text-text-muted">Generate PR docs automatically</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.github.autoDoc}
                        onChange={(e) => setSettings({
                          ...settings,
                          github: { ...settings.github, autoDoc: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text">Webhook Events</p>
                      <p className="text-xs text-text-muted">Receive real-time updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.github.webhooks}
                        onChange={(e) => setSettings({
                          ...settings,
                          github: { ...settings.github, webhooks: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text mb-3">Connected Repositories</h3>
                <div className="space-y-2">
                  {settings.github.repositories.map((repo) => (
                    <div key={repo} className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
                      <span className="text-sm text-text">{repo}</span>
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Claude Code Settings */}
          {activeTab === 'claude' && (
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-text mb-6">Claude Code Integration</h2>

              <div className="bg-surface/50 border border-border rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Zap className="w-8 h-8 text-accent" />
                    <div>
                      <p className="font-medium text-text">Claude Code</p>
                      <p className="text-sm text-text-muted">Model: {settings.claude.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-500">Active</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      API Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={settings.claude.apiKey}
                        className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg text-text"
                        readOnly
                      />
                      <button className="px-4 py-2 bg-surface border border-border rounded-lg text-text hover:bg-accent/10">
                        Regenerate
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text">Auto-analyze Code</p>
                      <p className="text-xs text-text-muted">Automatically analyze changes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.claude.autoAnalyze}
                        onChange={(e) => setSettings({
                          ...settings,
                          claude: { ...settings.claude, autoAnalyze: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Context Window Size
                    </label>
                    <select
                      value={settings.claude.contextWindow}
                      onChange={(e) => setSettings({
                        ...settings,
                        claude: { ...settings.claude, contextWindow: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-text"
                    >
                      <option value="100000">100K tokens</option>
                      <option value="200000">200K tokens (recommended)</option>
                      <option value="400000">400K tokens</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-500">MCP Server Required</p>
                    <p className="text-xs text-text-muted mt-1">
                      To enable Claude Code tracking, install the MCP server following the setup guide.
                    </p>
                    <button className="text-xs text-accent hover:text-accent/80 mt-2">
                      View Setup Instructions →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="max-w-2xl">
              <h2 className="text-lg font-semibold text-text mb-6">Notification Preferences</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-text">Email Notifications</p>
                    <p className="text-xs text-text-muted">Receive updates via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, email: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-text">PR Documentation</p>
                    <p className="text-xs text-text-muted">When a PR is documented</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.prDocumented}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, prDocumented: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-text">Security Alerts</p>
                    <p className="text-xs text-text-muted">Critical security notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.securityAlerts}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, securityAlerts: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-text">Weekly Reports</p>
                    <p className="text-xs text-text-muted">Summary of your impact</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.weeklyReports}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, weeklyReports: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="fixed bottom-6 right-6">
            <button
              onClick={handleSave}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-accent to-secondary text-background hover:shadow-lg hover:shadow-accent/25'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-5 h-5" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}