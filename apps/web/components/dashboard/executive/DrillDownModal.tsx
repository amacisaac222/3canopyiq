'use client'

import { useState, useEffect } from 'react'
import { X, GitBranch, Clock, Users, Shield, Info, Download, Filter, ChevronRight } from 'lucide-react'

interface DrillDownModalProps {
  metricId: string
  onClose: () => void
}

export function DrillDownModal({ metricId, onClose }: DrillDownModalProps) {
  const [activeTab, setActiveTab] = useState<'lineage' | 'details' | 'history' | 'actions'>('lineage')
  const [loading, setLoading] = useState(true)
  const [metricData, setMetricData] = useState<any>(null)

  useEffect(() => {
    // Fetch metric details
    fetchMetricData()
  }, [metricId])

  const fetchMetricData = async () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setMetricData(generateMockData(metricId))
      setLoading(false)
    }, 500)
  }

  const generateMockData = (id: string) => {
    const baseData = {
      id,
      name: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      currentValue: Math.floor(Math.random() * 100000) + 50000,
      trend: Math.floor(Math.random() * 30) - 10,
      confidence: 0.85 + Math.random() * 0.14,
      lastUpdated: new Date().toISOString()
    }

    const lineageData = {
      sources: [
        {
          type: 'database',
          name: 'Production PostgreSQL',
          confidence: 0.99,
          lastSync: '2 minutes ago',
          recordCount: 1247890
        },
        {
          type: 'api',
          name: 'GitHub API',
          confidence: 0.95,
          lastSync: '5 minutes ago',
          recordCount: 4523
        },
        {
          type: 'stream',
          name: 'Redis Event Stream',
          confidence: 0.92,
          lastSync: 'Real-time',
          recordCount: 89234
        }
      ],
      transformations: [
        {
          step: 1,
          name: 'Data Extraction',
          description: 'Extract raw events from sources',
          recordsIn: 1341647,
          recordsOut: 1341647,
          duration: '234ms'
        },
        {
          step: 2,
          name: 'Data Cleaning',
          description: 'Remove duplicates and invalid records',
          recordsIn: 1341647,
          recordsOut: 1298456,
          duration: '567ms'
        },
        {
          step: 3,
          name: 'Aggregation',
          description: 'Calculate metrics and rollups',
          recordsIn: 1298456,
          recordsOut: 156,
          duration: '1.2s'
        },
        {
          step: 4,
          name: 'Enrichment',
          description: 'Add context and metadata',
          recordsIn: 156,
          recordsOut: 156,
          duration: '89ms'
        }
      ],
      dependencies: [
        { name: 'Event Capture System', status: 'healthy', impact: 'critical' },
        { name: 'Analytics Engine', status: 'healthy', impact: 'high' },
        { name: 'Compliance Framework', status: 'healthy', impact: 'medium' },
        { name: 'User Session Tracker', status: 'degraded', impact: 'low' }
      ]
    }

    const history = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      value: Math.floor(Math.random() * 20000) + baseData.currentValue - 10000,
      events: Math.floor(Math.random() * 100) + 50,
      confidence: 0.8 + Math.random() * 0.2
    })).reverse()

    const actions = [
      {
        type: 'export',
        label: 'Export to CSV',
        description: 'Download complete dataset',
        available: true
      },
      {
        type: 'alert',
        label: 'Set Alert',
        description: 'Configure threshold alerts',
        available: true
      },
      {
        type: 'share',
        label: 'Share Report',
        description: 'Generate shareable link',
        available: true
      },
      {
        type: 'refresh',
        label: 'Refresh Data',
        description: 'Force data recalculation',
        available: false,
        reason: 'Last refresh < 5 minutes ago'
      }
    ]

    return { ...baseData, lineage: lineageData, history, actions }
  }

  const exportData = () => {
    const exportData = {
      metric: metricData,
      exportedAt: new Date().toISOString(),
      exportedBy: 'Executive Dashboard'
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${metricId}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  if (loading || !metricData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <div className="bg-surface rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] p-12">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-text-muted">Loading metric details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-surface rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text">{metricData.name}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
              <span>Value: ${(metricData.currentValue / 1000).toFixed(0)}k</span>
              <span>Trend: {metricData.trend > 0 ? '+' : ''}{metricData.trend}%</span>
              <span>Confidence: {(metricData.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface/50 transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 border-b border-border">
          {[
            { id: 'lineage', label: 'Data Lineage', icon: GitBranch },
            { id: 'details', label: 'Details', icon: Info },
            { id: 'history', label: 'History', icon: Clock },
            { id: 'actions', label: 'Actions', icon: Filter }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'lineage' && (
            <div className="space-y-6">
              {/* Data Sources */}
              <div>
                <h3 className="text-lg font-semibold text-text mb-4">Data Sources</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {metricData.lineage.sources.map((source: any, index: number) => (
                    <div key={index} className="bg-background/50 rounded-lg p-4 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text">{source.name}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          source.confidence > 0.95 ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                      </div>
                      <div className="space-y-1 text-xs text-text-muted">
                        <p>Type: {source.type}</p>
                        <p>Records: {source.recordCount.toLocaleString()}</p>
                        <p>Last sync: {source.lastSync}</p>
                        <p>Confidence: {(source.confidence * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transformation Pipeline */}
              <div>
                <h3 className="text-lg font-semibold text-text mb-4">Transformation Pipeline</h3>
                <div className="space-y-3">
                  {metricData.lineage.transformations.map((transform: any, index: number) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                        {transform.step}
                      </div>
                      <div className="flex-1 bg-background/50 rounded-lg p-4 border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text">{transform.name}</span>
                          <span className="text-xs text-text-muted">{transform.duration}</span>
                        </div>
                        <p className="text-xs text-text-muted mb-2">{transform.description}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-text-muted">In: {transform.recordsIn.toLocaleString()}</span>
                          <ChevronRight className="w-3 h-3 text-accent" />
                          <span className="text-text-muted">Out: {transform.recordsOut.toLocaleString()}</span>
                        </div>
                      </div>
                      {index < metricData.lineage.transformations.length - 1 && (
                        <div className="w-px h-8 bg-border ml-4" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dependencies */}
              <div>
                <h3 className="text-lg font-semibold text-text mb-4">System Dependencies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {metricData.lineage.dependencies.map((dep: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border">
                      <div>
                        <p className="text-sm font-medium text-text">{dep.name}</p>
                        <p className="text-xs text-text-muted">Impact: {dep.impact}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        dep.status === 'healthy' ? 'bg-green-500/20 text-green-500' :
                        dep.status === 'degraded' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {dep.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="bg-background/50 rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-text mb-4">Metric Details</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-text-muted">Metric ID</dt>
                    <dd className="text-sm font-medium text-text">{metricData.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-muted">Last Updated</dt>
                    <dd className="text-sm font-medium text-text">{new Date(metricData.lastUpdated).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-muted">Current Value</dt>
                    <dd className="text-sm font-medium text-text">${(metricData.currentValue / 1000).toFixed(0)}k</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-muted">Confidence Score</dt>
                    <dd className="text-sm font-medium text-text">{(metricData.confidence * 100).toFixed(1)}%</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-muted">Data Points</dt>
                    <dd className="text-sm font-medium text-text">1,341,647</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-text-muted">Calculation Method</dt>
                    <dd className="text-sm font-medium text-text">Weighted Average</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="bg-background/50 rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-text mb-4">30-Day History</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {metricData.history.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-text">
                          ${(entry.value / 1000).toFixed(0)}k
                        </p>
                        <p className="text-xs text-text-muted">
                          {new Date(entry.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-muted">{entry.events} events</p>
                        <p className="text-xs text-text-muted">{(entry.confidence * 100).toFixed(0)}% conf</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-4">
              {metricData.actions.map((action: any, index: number) => (
                <div key={index} className="bg-background/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text">{action.label}</p>
                      <p className="text-xs text-text-muted mt-1">{action.description}</p>
                      {!action.available && (
                        <p className="text-xs text-yellow-500 mt-1">{action.reason}</p>
                      )}
                    </div>
                    <button
                      disabled={!action.available}
                      onClick={action.type === 'export' ? exportData : undefined}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        action.available
                          ? 'bg-accent text-background hover:bg-accent/80'
                          : 'bg-surface text-text-muted cursor-not-allowed'
                      }`}
                    >
                      {action.type === 'export' && <Download className="w-4 h-4 inline mr-1" />}
                      Execute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}