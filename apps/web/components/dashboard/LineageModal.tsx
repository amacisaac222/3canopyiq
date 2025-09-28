'use client'

import { useState, useEffect } from 'react'
import { X, GitBranch, Clock, User, Shield, Zap, ChevronRight, ChevronDown, Info } from 'lucide-react'

interface LineageModalProps {
  metricId?: string
  eventId?: string
  onClose: () => void
}

interface LineageNode {
  id: string
  type: 'event' | 'metric' | 'session' | 'insight'
  timestamp: string
  label: string
  description?: string
  confidence: number
  userId?: string
  children?: LineageNode[]
  metadata?: Record<string, any>
}

export function LineageModal({ metricId, eventId, onClose }: LineageModalProps) {
  const [lineageData, setLineageData] = useState<LineageNode | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch lineage data
    fetchLineage()
  }, [metricId, eventId])

  const fetchLineage = async () => {
    setLoading(true)
    
    // Simulate API call - in production, fetch from your API
    setTimeout(() => {
      const mockLineage: LineageNode = {
        id: metricId || eventId || 'root',
        type: metricId ? 'metric' : 'event',
        timestamp: new Date().toISOString(),
        label: metricId ? 'Forest Health Metric' : 'Code Change Event',
        description: 'Root node of the lineage tree',
        confidence: 0.95,
        userId: 'system',
        children: [
          {
            id: 'event-1',
            type: 'event',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            label: 'Complexity Analysis',
            description: 'Analyzed code complexity across 12 files',
            confidence: 0.92,
            userId: 'claude',
            children: [
              {
                id: 'session-1',
                type: 'session',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                label: 'Refactoring Session',
                description: 'Claude session: Refactoring auth module',
                confidence: 0.88,
                userId: 'claude',
                metadata: {
                  filesModified: 8,
                  linesChanged: 234,
                  testsAdded: 5,
                },
              },
              {
                id: 'insight-1',
                type: 'insight',
                timestamp: new Date(Date.now() - 5400000).toISOString(),
                label: 'High Complexity Detected',
                description: 'AuthController exceeds complexity threshold',
                confidence: 0.85,
                metadata: {
                  severity: 'warning',
                  threshold: 50,
                  actual: 67,
                },
              },
            ],
          },
          {
            id: 'event-2',
            type: 'event',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            label: 'Test Coverage Update',
            description: 'Coverage increased from 72% to 85%',
            confidence: 0.98,
            userId: 'system',
            children: [
              {
                id: 'event-3',
                type: 'event',
                timestamp: new Date(Date.now() - 2700000).toISOString(),
                label: 'Unit Tests Added',
                description: '12 new unit tests for auth module',
                confidence: 0.95,
                userId: 'claude',
              },
              {
                id: 'event-4',
                type: 'event',
                timestamp: new Date(Date.now() - 2100000).toISOString(),
                label: 'Integration Tests',
                description: '3 new integration tests',
                confidence: 0.93,
                userId: 'user',
              },
            ],
          },
          {
            id: 'metric-1',
            type: 'metric',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            label: 'Dependency Health',
            description: 'All dependencies up to date',
            confidence: 0.96,
            metadata: {
              healthScore: 92,
              vulnerabilities: 0,
              outdated: 2,
            },
          },
        ],
      }
      
      setLineageData(mockLineage)
      // Auto-expand root node
      setExpandedNodes(new Set([mockLineage.id]))
      setLoading(false)
    }, 500)
  }

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Zap className="w-4 h-4" />
      case 'metric':
        return <Shield className="w-4 h-4" />
      case 'session':
        return <User className="w-4 h-4" />
      case 'insight':
        return <Info className="w-4 h-4" />
      default:
        return <GitBranch className="w-4 h-4" />
    }
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'event':
        return 'text-accent border-accent/30 bg-accent/5'
      case 'metric':
        return 'text-secondary border-secondary/30 bg-secondary/5'
      case 'session':
        return 'text-primary border-primary/30 bg-primary/5'
      case 'insight':
        return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5'
      default:
        return 'text-text-muted border-border bg-surface/30'
    }
  }

  const renderNode = (node: LineageNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)

    return (
      <div key={node.id} className={`${depth > 0 ? 'ml-6' : ''}`}>
        <div
          className={`p-3 rounded-lg border mb-2 transition-all cursor-pointer hover:shadow-md ${
            getNodeColor(node.type)
          }`}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {/* Node header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              {hasChildren && (
                <button className="mt-0.5">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
              {getNodeIcon(node.type)}
              <div className="flex-1">
                <div className="font-medium text-sm">{node.label}</div>
                {node.description && (
                  <div className="text-xs text-text-muted mt-1">
                    {node.description}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  node.confidence > 0.9
                    ? 'bg-green-500'
                    : node.confidence > 0.7
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                title={`Confidence: ${(node.confidence * 100).toFixed(0)}%`}
              />
            </div>
          </div>

          {/* Node metadata */}
          <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
            {node.userId && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {node.userId}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(node.timestamp).toLocaleTimeString()}
            </span>
            {node.metadata && (
              <span className="text-accent">
                {Object.keys(node.metadata).length} properties
              </span>
            )}
          </div>

          {/* Metadata details */}
          {node.metadata && isExpanded && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(node.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-text-muted">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-text font-mono">
                      {typeof value === 'object' ? JSON.stringify(value) : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border/50" />
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-surface rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-accent" />
              Data Lineage Explorer
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Trace the complete history and relationships of this {metricId ? 'metric' : 'event'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface/50 transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-text-muted">Loading lineage data...</p>
              </div>
            </div>
          ) : lineageData ? (
            <div>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-background/50 rounded-lg p-3 border border-border">
                  <div className="text-2xl font-bold text-accent">
                    {countNodes(lineageData)}
                  </div>
                  <div className="text-xs text-text-muted">Total Nodes</div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border border-border">
                  <div className="text-2xl font-bold text-secondary">
                    {getMaxDepth(lineageData)}
                  </div>
                  <div className="text-xs text-text-muted">Max Depth</div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border border-border">
                  <div className="text-2xl font-bold text-primary">
                    {(getAverageConfidence(lineageData) * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-text-muted">Avg Confidence</div>
                </div>
                <div className="bg-background/50 rounded-lg p-3 border border-border">
                  <div className="text-2xl font-bold text-yellow-500">
                    {getUniqueUsers(lineageData).size}
                  </div>
                  <div className="text-xs text-text-muted">Contributors</div>
                </div>
              </div>

              {/* Tree */}
              {renderNode(lineageData)}
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted">
              No lineage data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions
function countNodes(node: LineageNode): number {
  let count = 1
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child)
    }
  }
  return count
}

function getMaxDepth(node: LineageNode, depth: number = 1): number {
  if (!node.children || node.children.length === 0) {
    return depth
  }
  return Math.max(...node.children.map(child => getMaxDepth(child, depth + 1)))
}

function getAverageConfidence(node: LineageNode): number {
  const confidences: number[] = [node.confidence]
  
  function collect(n: LineageNode) {
    if (n.children) {
      for (const child of n.children) {
        confidences.push(child.confidence)
        collect(child)
      }
    }
  }
  
  collect(node)
  return confidences.reduce((a, b) => a + b, 0) / confidences.length
}

function getUniqueUsers(node: LineageNode): Set<string> {
  const users = new Set<string>()
  
  function collect(n: LineageNode) {
    if (n.userId) {
      users.add(n.userId)
    }
    if (n.children) {
      for (const child of n.children) {
        collect(child)
      }
    }
  }
  
  collect(node)
  return users
}