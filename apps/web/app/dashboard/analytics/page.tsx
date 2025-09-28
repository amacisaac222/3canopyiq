'use client'

import { useState, useEffect } from 'react'
import {
  GitPullRequest,
  Clock,
  CheckCircle,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Code2
} from 'lucide-react'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d')

  // These would come from your API
  const [stats, setStats] = useState({
    prsDone: 0,
    avgTimeSaved: '--',
    complianceRate: '--',
    activeSessions: 0,
    totalEvents: 0,
    codeQuality: 85
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface/30 backdrop-blur-sm">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text">Analytics</h1>
              <p className="text-sm text-text-muted mt-1">Track your documentation performance and metrics</p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-surface border border-border rounded-lg text-sm"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <GitPullRequest className="w-6 h-6 text-primary" />
              </div>
              <span className="text-2xl font-bold text-text">{stats.prsDone}</span>
            </div>
            <p className="text-sm text-text-muted">PRs Documented</p>
            <div className="flex items-center gap-1 mt-2">
              <Activity className="w-4 h-4 text-text-muted" />
              <span className="text-xs text-text-muted">No activity yet</span>
            </div>
          </div>

          <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-secondary" />
              </div>
              <span className="text-2xl font-bold text-text">{stats.avgTimeSaved}</span>
            </div>
            <p className="text-sm text-text-muted">Avg. Time Saved</p>
            <div className="flex items-center gap-1 mt-2">
              <Activity className="w-4 h-4 text-text-muted" />
              <span className="text-xs text-text-muted">Per documentation</span>
            </div>
          </div>

          <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-2xl font-bold text-text">{stats.complianceRate}</span>
            </div>
            <p className="text-sm text-text-muted">Compliance Rate</p>
            <div className="flex items-center gap-1 mt-2">
              <Activity className="w-4 h-4 text-text-muted" />
              <span className="text-xs text-text-muted">No data yet</span>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface/50 border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Code2 className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Active Sessions</span>
            </div>
            <p className="text-2xl font-bold">{stats.activeSessions}</p>
          </div>

          <div className="bg-surface/50 border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-secondary" />
              <span className="text-sm font-medium">Total Events</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalEvents}</p>
          </div>

          <div className="bg-surface/50 border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">Code Quality</span>
            </div>
            <p className="text-2xl font-bold">{stats.codeQuality}%</p>
          </div>

          <div className="bg-surface/50 border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium">Team Members</span>
            </div>
            <p className="text-2xl font-bold">1</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PR Activity Chart */}
          <div className="bg-surface/50 border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text">PR Activity</h3>
              <LineChart className="w-5 h-5 text-text-muted" />
            </div>
            <div className="h-64 flex items-center justify-center text-text-muted">
              <p className="text-sm">Chart will appear when data is available</p>
            </div>
          </div>

          {/* Session Distribution */}
          <div className="bg-surface/50 border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text">Session Distribution</h3>
              <PieChart className="w-5 h-5 text-text-muted" />
            </div>
            <div className="h-64 flex items-center justify-center text-text-muted">
              <p className="text-sm">Chart will appear when data is available</p>
            </div>
          </div>

          {/* Code Quality Trends */}
          <div className="bg-surface/50 border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text">Code Quality Trends</h3>
              <TrendingUp className="w-5 h-5 text-text-muted" />
            </div>
            <div className="h-64 flex items-center justify-center text-text-muted">
              <p className="text-sm">Chart will appear when data is available</p>
            </div>
          </div>

          {/* Time Saved Analysis */}
          <div className="bg-surface/50 border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text">Time Saved Analysis</h3>
              <Clock className="w-5 h-5 text-text-muted" />
            </div>
            <div className="h-64 flex items-center justify-center text-text-muted">
              <p className="text-sm">Chart will appear when data is available</p>
            </div>
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="mt-8 bg-surface/50 border border-border rounded-xl p-6">
          <h3 className="font-semibold text-text mb-4">Key Insights</h3>
          <div className="space-y-2 text-sm text-text-muted">
            <p>• Start documenting PRs to see analytics</p>
            <p>• Connect Claude Code to track session metrics</p>
            <p>• Analytics update in real-time as you work</p>
            <p>• Historical data is retained for 90 days</p>
          </div>
        </div>
      </div>
    </div>
  )
}