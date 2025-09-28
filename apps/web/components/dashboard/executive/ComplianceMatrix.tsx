'use client'

import { Shield, CheckCircle, AlertTriangle, XCircle, Info, FileText, TrendingUp } from 'lucide-react'

interface ComplianceMatrixProps {
  compliance: any
  onDrillDown: (framework: string) => void
}

export function ComplianceMatrix({ compliance, onDrillDown }: ComplianceMatrixProps) {
  const frameworks = [
    {
      id: 'owasp',
      name: 'OWASP Top 10',
      description: 'Web Application Security',
      categories: [
        { name: 'Injection', status: 'pass', score: 100, lastChecked: '2 hours ago' },
        { name: 'Broken Authentication', status: 'pass', score: 98, lastChecked: '2 hours ago' },
        { name: 'Sensitive Data Exposure', status: 'pass', score: 100, lastChecked: '2 hours ago' },
        { name: 'XML External Entities', status: 'pass', score: 100, lastChecked: '2 hours ago' },
        { name: 'Broken Access Control', status: 'warning', score: 85, lastChecked: '2 hours ago' },
        { name: 'Security Misconfiguration', status: 'pass', score: 95, lastChecked: '2 hours ago' },
        { name: 'Cross-Site Scripting', status: 'pass', score: 100, lastChecked: '2 hours ago' },
        { name: 'Insecure Deserialization', status: 'pass', score: 100, lastChecked: '2 hours ago' },
        { name: 'Using Components with Vulnerabilities', status: 'pass', score: 92, lastChecked: '2 hours ago' },
        { name: 'Insufficient Logging', status: 'pass', score: 96, lastChecked: '2 hours ago' }
      ],
      overallScore: 97,
      trend: 5,
      lastAudit: '2024-01-15',
      nextAudit: '2024-02-15'
    },
    {
      id: 'soc2',
      name: 'SOC 2 Type II',
      description: 'Service Organization Controls',
      categories: [
        { name: 'Security', status: 'pass', score: 98, lastChecked: '1 day ago' },
        { name: 'Availability', status: 'pass', score: 99, lastChecked: '1 day ago' },
        { name: 'Processing Integrity', status: 'pass', score: 97, lastChecked: '1 day ago' },
        { name: 'Confidentiality', status: 'pass', score: 100, lastChecked: '1 day ago' },
        { name: 'Privacy', status: 'pass', score: 96, lastChecked: '1 day ago' }
      ],
      overallScore: 98,
      trend: 2,
      lastAudit: '2024-01-01',
      nextAudit: '2024-04-01'
    },
    {
      id: 'hipaa',
      name: 'HIPAA',
      description: 'Health Insurance Portability',
      categories: [
        { name: 'Administrative Safeguards', status: 'pass', score: 100, lastChecked: '3 days ago' },
        { name: 'Physical Safeguards', status: 'pass', score: 100, lastChecked: '3 days ago' },
        { name: 'Technical Safeguards', status: 'pass', score: 98, lastChecked: '3 days ago' },
        { name: 'Organizational Requirements', status: 'pass', score: 100, lastChecked: '3 days ago' },
        { name: 'Breach Notification', status: 'pass', score: 100, lastChecked: '3 days ago' }
      ],
      overallScore: 99,
      trend: 0,
      lastAudit: '2023-12-15',
      nextAudit: '2024-03-15'
    },
    {
      id: 'gdpr',
      name: 'GDPR',
      description: 'General Data Protection Regulation',
      categories: [
        { name: 'Lawful Basis', status: 'pass', score: 100, lastChecked: '1 week ago' },
        { name: 'Consent Management', status: 'pass', score: 98, lastChecked: '1 week ago' },
        { name: 'Data Subject Rights', status: 'pass', score: 96, lastChecked: '1 week ago' },
        { name: 'Data Protection by Design', status: 'pass', score: 94, lastChecked: '1 week ago' },
        { name: 'Data Breach Response', status: 'pass', score: 100, lastChecked: '1 week ago' },
        { name: 'International Transfers', status: 'warning', score: 88, lastChecked: '1 week ago' }
      ],
      overallScore: 96,
      trend: 3,
      lastAudit: '2024-01-10',
      nextAudit: '2024-02-10'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Info className="w-4 h-4 text-text-muted" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-500'
    if (score >= 85) return 'text-yellow-500'
    if (score >= 70) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <div className="space-y-6">
      {/* Overall Compliance Score */}
      <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg border border-green-600/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-500" />
              Overall Compliance Score
            </h2>
            <p className="text-text-muted mt-1">Across all regulatory frameworks</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-green-400">98%</p>
            <p className="text-sm text-text-muted mt-1 flex items-center justify-end gap-1">
              <TrendingUp className="w-3 h-3" />
              +3% from last month
            </p>
          </div>
        </div>
      </div>

      {/* Framework Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {frameworks.map((framework) => (
          <div
            key={framework.id}
            className="bg-surface/50 rounded-lg border border-border p-6 hover:border-accent/50 transition-colors"
          >
            {/* Framework Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text">{framework.name}</h3>
                <p className="text-sm text-text-muted">{framework.description}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${getScoreColor(framework.overallScore)}`}>
                  {framework.overallScore}%
                </p>
                {framework.trend !== 0 && (
                  <p className="text-xs text-text-muted flex items-center justify-end gap-1">
                    <TrendingUp className={`w-3 h-3 ${framework.trend > 0 ? 'text-green-500' : 'text-red-500'}`} />
                    {Math.abs(framework.trend)}%
                  </p>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2 mb-4">
              {framework.categories.map((category, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-background/50 rounded-lg hover:bg-background/70 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(category.status)}
                    <span className="text-sm text-text">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${getScoreColor(category.score)}`}>
                      {category.score}%
                    </span>
                    <span className="text-xs text-text-muted">{category.lastChecked}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Audit Information */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="text-xs text-text-muted">
                <span>Last audit: {framework.lastAudit}</span>
              </div>
              <div className="text-xs text-text-muted">
                <span>Next audit: {framework.nextAudit}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => onDrillDown(framework.id)}
                className="flex-1 px-3 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-lg text-sm text-accent transition-colors"
              >
                View Details
              </button>
              <button className="px-3 py-2 bg-surface hover:bg-surface/80 border border-border rounded-lg text-sm text-text-muted transition-colors">
                <FileText className="w-4 h-4" />
              </button>
            </div>

            {/* Lineage Info */}
            <div className="mt-4 p-3 bg-background/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-text-muted mt-0.5" />
                <div className="text-xs text-text-muted">
                  <p className="font-medium mb-1">Compliance Lineage</p>
                  <p>Automated checks: Every 2 hours</p>
                  <p>Manual reviews: Weekly</p>
                  <p>Data sources: 12 integrated systems</p>
                  <p>Confidence: 99.2%</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Trends */}
      <div className="bg-surface/50 rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-text mb-4">Compliance Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">23</p>
            <p className="text-sm text-text-muted">Controls Passed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-500">2</p>
            <p className="text-sm text-text-muted">Warnings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">0</p>
            <p className="text-sm text-text-muted">Failures</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-accent">100%</p>
            <p className="text-sm text-text-muted">Audit Ready</p>
          </div>
        </div>
      </div>

      {/* Recent Compliance Events */}
      <div className="bg-surface/50 rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-text mb-4">Recent Compliance Events</h3>
        <div className="space-y-3">
          {[
            { time: '2 hours ago', event: 'OWASP scan completed', status: 'pass', details: 'All 10 categories passed' },
            { time: '1 day ago', event: 'SOC2 evidence collected', status: 'pass', details: '47 controls verified' },
            { time: '3 days ago', event: 'GDPR consent audit', status: 'warning', details: '2 consent forms need update' },
            { time: '1 week ago', event: 'HIPAA training completed', status: 'pass', details: '100% team compliance' }
          ].map((event, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(event.status)}
                <div>
                  <p className="text-sm text-text font-medium">{event.event}</p>
                  <p className="text-xs text-text-muted">{event.details}</p>
                </div>
              </div>
              <span className="text-xs text-text-muted">{event.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}