'use client'

import { Users, TrendingUp, Award, Zap, GitBranch, Code, Clock, Target, Shield } from 'lucide-react'

interface TeamPerformanceProps {
  teamMetrics: any
  onMemberClick: (memberId: string) => void
}

export function TeamPerformance({ teamMetrics, onMemberClick }: TeamPerformanceProps) {
  const teamMembers = [
    {
      id: 'dev-001',
      name: 'Sarah Chen',
      role: 'Senior Developer',
      avatar: '👩‍💻',
      metrics: {
        velocity: 142,
        velocityTrend: 15,
        prCount: 47,
        reviewsGiven: 89,
        issuesPrevented: 23,
        documentationScore: 94,
        aiUsage: 78,
        complianceScore: 100
      },
      achievements: ['🏆 Top Contributor', '⚡ Speed Demon', '🛡️ Security Champion'],
      lineage: {
        eventsTracked: 1247,
        confidence: 0.94,
        lastActive: '2 hours ago'
      }
    },
    {
      id: 'dev-002',
      name: 'Marcus Johnson',
      role: 'Full Stack Developer',
      avatar: '👨‍💻',
      metrics: {
        velocity: 128,
        velocityTrend: 8,
        prCount: 38,
        reviewsGiven: 67,
        issuesPrevented: 19,
        documentationScore: 88,
        aiUsage: 92,
        complianceScore: 98
      },
      achievements: ['🤖 AI Pioneer', '📚 Documentation Hero'],
      lineage: {
        eventsTracked: 1089,
        confidence: 0.91,
        lastActive: '30 minutes ago'
      }
    },
    {
      id: 'dev-003',
      name: 'Emily Rodriguez',
      role: 'DevOps Engineer',
      avatar: '👩‍🔧',
      metrics: {
        velocity: 115,
        velocityTrend: 12,
        prCount: 31,
        reviewsGiven: 45,
        issuesPrevented: 34,
        documentationScore: 91,
        aiUsage: 65,
        complianceScore: 100
      },
      achievements: ['🚀 Deployment Master', '🔧 Infrastructure Expert'],
      lineage: {
        eventsTracked: 892,
        confidence: 0.93,
        lastActive: '1 hour ago'
      }
    },
    {
      id: 'dev-004',
      name: 'Alex Kim',
      role: 'Frontend Developer',
      avatar: '🧑‍💻',
      metrics: {
        velocity: 136,
        velocityTrend: -3,
        prCount: 42,
        reviewsGiven: 71,
        issuesPrevented: 16,
        documentationScore: 82,
        aiUsage: 88,
        complianceScore: 97
      },
      achievements: ['🎨 UI/UX Expert', '♿ Accessibility Advocate'],
      lineage: {
        eventsTracked: 967,
        confidence: 0.89,
        lastActive: '4 hours ago'
      }
    }
  ]

  const teamStats = {
    totalVelocity: teamMembers.reduce((sum, m) => sum + m.metrics.velocity, 0),
    avgVelocity: Math.round(teamMembers.reduce((sum, m) => sum + m.metrics.velocity, 0) / teamMembers.length),
    totalPRs: teamMembers.reduce((sum, m) => sum + m.metrics.prCount, 0),
    totalIssuesPrevented: teamMembers.reduce((sum, m) => sum + m.metrics.issuesPrevented, 0),
    avgAIUsage: Math.round(teamMembers.reduce((sum, m) => sum + m.metrics.aiUsage, 0) / teamMembers.length),
    avgComplianceScore: Math.round(teamMembers.reduce((sum, m) => sum + m.metrics.complianceScore, 0) / teamMembers.length)
  }

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-lg border border-blue-600/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-text flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" />
              Team Performance
            </h2>
            <p className="text-text-muted mt-1">Real-time productivity metrics</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-blue-400">{teamStats.totalVelocity}</p>
            <p className="text-sm text-text-muted">Total velocity points</p>
          </div>
        </div>

        {/* Team Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-text">{teamStats.avgVelocity}</p>
            <p className="text-xs text-text-muted">Avg Velocity</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text">{teamStats.totalPRs}</p>
            <p className="text-xs text-text-muted">Total PRs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text">{teamStats.totalIssuesPrevented}</p>
            <p className="text-xs text-text-muted">Issues Prevented</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text">{teamStats.avgAIUsage}%</p>
            <p className="text-xs text-text-muted">AI Usage</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text">{teamStats.avgComplianceScore}%</p>
            <p className="text-xs text-text-muted">Compliance</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">Elite</p>
            <p className="text-xs text-text-muted">DORA Level</p>
          </div>
        </div>
      </div>

      {/* Individual Team Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="bg-surface/50 rounded-lg border border-border p-6 hover:border-accent/50 transition-all cursor-pointer"
            onClick={() => onMemberClick(member.id)}
          >
            {/* Member Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{member.avatar}</span>
                <div>
                  <h3 className="text-lg font-semibold text-text">{member.name}</h3>
                  <p className="text-sm text-text-muted">{member.role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-accent">{member.metrics.velocity}</p>
                <p className="text-xs text-text-muted flex items-center justify-end gap-1">
                  <TrendingUp className={`w-3 h-3 ${member.metrics.velocityTrend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  {Math.abs(member.metrics.velocityTrend)}%
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center p-2 bg-background/50 rounded-lg">
                <GitBranch className="w-4 h-4 text-text-muted mx-auto mb-1" />
                <p className="text-lg font-semibold text-text">{member.metrics.prCount}</p>
                <p className="text-xs text-text-muted">PRs</p>
              </div>
              <div className="text-center p-2 bg-background/50 rounded-lg">
                <Code className="w-4 h-4 text-text-muted mx-auto mb-1" />
                <p className="text-lg font-semibold text-text">{member.metrics.reviewsGiven}</p>
                <p className="text-xs text-text-muted">Reviews</p>
              </div>
              <div className="text-center p-2 bg-background/50 rounded-lg">
                <Shield className="w-4 h-4 text-text-muted mx-auto mb-1" />
                <p className="text-lg font-semibold text-text">{member.metrics.issuesPrevented}</p>
                <p className="text-xs text-text-muted">Prevented</p>
              </div>
              <div className="text-center p-2 bg-background/50 rounded-lg">
                <Zap className="w-4 h-4 text-text-muted mx-auto mb-1" />
                <p className="text-lg font-semibold text-text">{member.metrics.aiUsage}%</p>
                <p className="text-xs text-text-muted">AI Use</p>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-2 mb-4">
              <div>
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>Documentation</span>
                  <span>{member.metrics.documentationScore}%</span>
                </div>
                <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    style={{ width: `${member.metrics.documentationScore}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>Compliance</span>
                  <span>{member.metrics.complianceScore}%</span>
                </div>
                <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    style={{ width: `${member.metrics.complianceScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="flex gap-2 mb-4">
              {member.achievements.map((achievement, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-accent/10 border border-accent/30 rounded-lg text-xs text-accent"
                >
                  {achievement}
                </span>
              ))}
            </div>

            {/* Lineage Info */}
            <div className="flex items-center justify-between text-xs text-text-muted pt-4 border-t border-border">
              <span>{member.lineage.eventsTracked} events tracked</span>
              <span>{(member.lineage.confidence * 100).toFixed(0)}% confidence</span>
              <span>{member.lineage.lastActive}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Team Insights */}
      <div className="bg-surface/50 rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-secondary" />
          Team Insights & Recommendations
        </h3>
        <div className="space-y-3">
          {[
            {
              type: 'success',
              title: 'Strong Code Review Culture',
              description: 'Team averages 68 reviews per member monthly, 40% above industry standard',
              icon: '✅'
            },
            {
              type: 'improvement',
              title: 'AI Adoption Opportunity',
              description: 'Increasing AI usage to 90% could save additional 12 hours/week',
              icon: '💡'
            },
            {
              type: 'success',
              title: 'Excellent Compliance',
              description: '98.5% average compliance score across all frameworks',
              icon: '🛡️'
            },
            {
              type: 'insight',
              title: 'Velocity Trending Up',
              description: '12% average velocity increase over last quarter',
              icon: '📈'
            }
          ].map((insight, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                insight.type === 'success' ? 'bg-green-900/20 border border-green-600/30' :
                insight.type === 'improvement' ? 'bg-yellow-900/20 border border-yellow-600/30' :
                'bg-blue-900/20 border border-blue-600/30'
              }`}
            >
              <span className="text-2xl">{insight.icon}</span>
              <div>
                <p className="text-sm font-medium text-text">{insight.title}</p>
                <p className="text-xs text-text-muted mt-1">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="bg-surface/50 rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-text mb-4">Performance vs Industry Benchmarks</h3>
        <div className="space-y-3">
          {[
            { metric: 'Deployment Frequency', team: 23, industry: 8, unit: 'per month' },
            { metric: 'Lead Time for Changes', team: 2.3, industry: 6.5, unit: 'days' },
            { metric: 'Change Failure Rate', team: 2.1, industry: 15, unit: '%' },
            { metric: 'Mean Time to Recovery', team: 0.75, industry: 4.2, unit: 'hours' }
          ].map((metric, index) => {
            const performance = ((metric.industry - metric.team) / metric.industry * 100).toFixed(0)
            const isPositive = metric.metric === 'Change Failure Rate' || metric.metric === 'Mean Time to Recovery'
              ? metric.team < metric.industry
              : metric.team > metric.industry

            return (
              <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text">{metric.metric}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-text-muted">Team: {metric.team} {metric.unit}</span>
                    <span className="text-xs text-text-muted">Industry: {metric.industry} {metric.unit}</span>
                  </div>
                </div>
                <div className={`text-lg font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{Math.abs(Number(performance))}%
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}