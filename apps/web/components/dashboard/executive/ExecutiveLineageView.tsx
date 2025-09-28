'use client'

import { useRef, useEffect } from 'react'
import { GitBranch, Database, Cloud, Shield, Users, Zap } from 'lucide-react'

interface ExecutiveLineageViewProps {
  metrics: any
  onNodeClick: (nodeId: string) => void
}

export function ExecutiveLineageView({ metrics, onNodeClick }: ExecutiveLineageViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const nodesRef = useRef<any[]>([])
  const connectionsRef = useRef<any[]>([])
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Initialize nodes
    initializeNodes()

    // Animation loop
    const animate = () => {
      timeRef.current += 0.01

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 10, 5, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      drawConnections(ctx)

      // Draw nodes
      drawNodes(ctx)

      // Draw data flow particles
      drawDataFlow(ctx)

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [metrics])

  const initializeNodes = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Define node structure
    nodesRef.current = [
      // Central Executive Node
      {
        id: 'executive',
        x: centerX,
        y: centerY,
        radius: 40,
        label: 'Executive Metrics',
        type: 'primary',
        color: '#00FF88',
        value: metrics.totalValue || 0,
        confidence: 0.95
      },

      // Data Source Nodes (Bottom Layer)
      {
        id: 'database',
        x: centerX - 200,
        y: centerY + 150,
        radius: 30,
        label: 'Database',
        type: 'source',
        color: '#00A86B',
        icon: Database,
        events: 1247890
      },
      {
        id: 'github',
        x: centerX - 80,
        y: centerY + 150,
        radius: 30,
        label: 'GitHub',
        type: 'source',
        color: '#00A86B',
        icon: GitBranch,
        events: 45234
      },
      {
        id: 'claude',
        x: centerX + 80,
        y: centerY + 150,
        radius: 30,
        label: 'Claude AI',
        type: 'source',
        color: '#00A86B',
        icon: Zap,
        events: 89234
      },
      {
        id: 'monitoring',
        x: centerX + 200,
        y: centerY + 150,
        radius: 30,
        label: 'Monitoring',
        type: 'source',
        color: '#00A86B',
        icon: Shield,
        events: 67890
      },

      // Processing Nodes (Middle Layer)
      {
        id: 'analytics',
        x: centerX - 150,
        y: centerY,
        radius: 35,
        label: 'Analytics',
        type: 'processor',
        color: '#FFA500',
        confidence: 0.91
      },
      {
        id: 'compliance',
        x: centerX + 150,
        y: centerY,
        radius: 35,
        label: 'Compliance',
        type: 'processor',
        color: '#FF00FF',
        confidence: 0.98
      },

      // Output Nodes (Top Layer)
      {
        id: 'cost_savings',
        x: centerX - 180,
        y: centerY - 120,
        radius: 32,
        label: 'Cost Savings',
        type: 'output',
        color: '#00FF88',
        value: '$571k'
      },
      {
        id: 'roi',
        x: centerX - 60,
        y: centerY - 120,
        radius: 32,
        label: 'ROI',
        type: 'output',
        color: '#00FF88',
        value: '387%'
      },
      {
        id: 'team_velocity',
        x: centerX + 60,
        y: centerY - 120,
        radius: 32,
        label: 'Velocity',
        type: 'output',
        color: '#00FF88',
        value: '+42%'
      },
      {
        id: 'compliance_score',
        x: centerX + 180,
        y: centerY - 120,
        radius: 32,
        label: 'Compliance',
        type: 'output',
        color: '#00FF88',
        value: '98%'
      }
    ]

    // Define connections
    connectionsRef.current = [
      // Sources to Processors
      { from: 'database', to: 'analytics', strength: 0.9 },
      { from: 'github', to: 'analytics', strength: 0.7 },
      { from: 'claude', to: 'analytics', strength: 0.8 },
      { from: 'monitoring', to: 'compliance', strength: 0.95 },
      { from: 'database', to: 'compliance', strength: 0.6 },

      // Processors to Executive
      { from: 'analytics', to: 'executive', strength: 0.85 },
      { from: 'compliance', to: 'executive', strength: 0.9 },

      // Executive to Outputs
      { from: 'executive', to: 'cost_savings', strength: 0.92 },
      { from: 'executive', to: 'roi', strength: 0.88 },
      { from: 'executive', to: 'team_velocity', strength: 0.86 },
      { from: 'executive', to: 'compliance_score', strength: 0.94 }
    ]
  }

  const drawConnections = (ctx: CanvasRenderingContext2D) => {
    connectionsRef.current.forEach(conn => {
      const fromNode = nodesRef.current.find(n => n.id === conn.from)
      const toNode = nodesRef.current.find(n => n.id === conn.to)

      if (!fromNode || !toNode) return

      // Draw connection line
      ctx.strokeStyle = `rgba(0, 255, 136, ${conn.strength * 0.3})`
      ctx.lineWidth = conn.strength * 3
      ctx.setLineDash([5, 5])

      ctx.beginPath()
      ctx.moveTo(fromNode.x, fromNode.y)

      // Create curved path
      const midX = (fromNode.x + toNode.x) / 2
      const midY = (fromNode.y + toNode.y) / 2
      const offsetX = (Math.random() - 0.5) * 20
      const offsetY = (Math.random() - 0.5) * 20

      ctx.quadraticCurveTo(
        midX + offsetX,
        midY + offsetY,
        toNode.x,
        toNode.y
      )
      ctx.stroke()
      ctx.setLineDash([])
    })
  }

  const drawNodes = (ctx: CanvasRenderingContext2D) => {
    nodesRef.current.forEach(node => {
      // Draw node glow
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 2)
      gradient.addColorStop(0, `${node.color}33`)
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2)
      ctx.fill()

      // Draw node circle
      ctx.fillStyle = `${node.color}20`
      ctx.strokeStyle = node.color
      ctx.lineWidth = 2

      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius + Math.sin(timeRef.current * 2) * 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Draw inner circle
      ctx.fillStyle = `${node.color}40`
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius * 0.7, 0, Math.PI * 2)
      ctx.fill()

      // Draw label
      ctx.fillStyle = '#E0FFE0'
      ctx.font = `${node.type === 'primary' ? 'bold 12px' : '11px'} monospace`
      ctx.textAlign = 'center'
      ctx.fillText(node.label, node.x, node.y + node.radius + 20)

      // Draw value or metrics
      if (node.value) {
        ctx.fillStyle = node.color
        ctx.font = 'bold 14px monospace'
        ctx.fillText(node.value.toString(), node.x, node.y + 5)
      } else if (node.events) {
        ctx.fillStyle = '#A0FFA0'
        ctx.font = '10px monospace'
        ctx.fillText(`${(node.events / 1000).toFixed(0)}k events`, node.x, node.y + 5)
      } else if (node.confidence) {
        ctx.fillStyle = '#A0FFA0'
        ctx.font = '10px monospace'
        ctx.fillText(`${(node.confidence * 100).toFixed(0)}%`, node.x, node.y + 5)
      }

      // Add pulse effect for primary node
      if (node.type === 'primary') {
        ctx.strokeStyle = node.color
        ctx.globalAlpha = 0.3 * (1 - (timeRef.current % 1))
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius + (timeRef.current % 1) * 20, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    })
  }

  const drawDataFlow = (ctx: CanvasRenderingContext2D) => {
    // Draw flowing particles along connections
    connectionsRef.current.forEach(conn => {
      const fromNode = nodesRef.current.find(n => n.id === conn.from)
      const toNode = nodesRef.current.find(n => n.id === conn.to)

      if (!fromNode || !toNode) return

      // Calculate particle position
      const progress = (timeRef.current * 0.5) % 1
      const x = fromNode.x + (toNode.x - fromNode.x) * progress
      const y = fromNode.y + (toNode.y - fromNode.y) * progress

      // Draw particle
      ctx.fillStyle = '#00FF88'
      ctx.globalAlpha = 0.8
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    })
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if click is on a node
    nodesRef.current.forEach(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2)
      if (distance <= node.radius) {
        onNodeClick(node.id)
      }
    })
  }

  return (
    <div className="bg-surface/50 rounded-lg border border-border p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
        <GitBranch className="w-5 h-5 text-accent" />
        Executive Data Lineage
      </h3>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          onClick={handleCanvasClick}
          className="w-full h-[400px] rounded-lg cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #001a0d 0%, #003d1f 100%)' }}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00A86B]" />
              <span className="text-text-muted">Data Sources</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FFA500]" />
              <span className="text-text-muted">Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00FF88]" />
              <span className="text-text-muted">Metrics</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center">
              <div className="text-text font-bold">1.45M</div>
              <div className="text-text-muted text-xs">Events/Day</div>
            </div>
            <div className="text-center">
              <div className="text-text font-bold">94%</div>
              <div className="text-text-muted text-xs">Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-text font-bold">12</div>
              <div className="text-text-muted text-xs">Sources</div>
            </div>
            <div className="text-center">
              <div className="text-text font-bold">Real-time</div>
              <div className="text-text-muted text-xs">Updates</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lineage Details */}
      <div className="mt-4 p-4 bg-background/30 rounded-lg">
        <p className="text-sm text-text-muted">
          <strong>Data Flow:</strong> {nodesRef.current.filter(n => n.type === 'source').length} sources → {nodesRef.current.filter(n => n.type === 'processor').length} processors → {nodesRef.current.filter(n => n.type === 'output').length} metrics
        </p>
        <p className="text-xs text-text-muted mt-1">
          Click any node to explore detailed lineage and drill down into specific metrics.
        </p>
      </div>
    </div>
  )
}