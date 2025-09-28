'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Trees, AlertTriangle, CheckCircle } from 'lucide-react'

interface Tree {
  id: string
  name: string
  health: number
  coverage: number
  complexity: number
  linesOfCode: number
  dependencies: string[]
  circularDeps: number
  position?: { x: number; y: number }
}

interface ForestData {
  trees: Tree[]
  connections?: Array<{ from: string; to: string; type: string }>
}

interface ForestVisualizationProps {
  data: ForestData
  onTreeClick?: (tree: Tree) => void
}

export function ForestVisualization({ data, onTreeClick }: ForestVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [hoveredTree, setHoveredTree] = useState<string | null>(null)
  const [selectedTree, setSelectedTree] = useState<Tree | null>(null)
  const [time, setTime] = useState(0)

  // Animation loop for ambient effects
  useEffect(() => {
    const animate = () => {
      setTime(t => t + 0.01)
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Draw forest on canvas
  const drawForest = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight)
    gradient.addColorStop(0, 'rgba(0, 8, 5, 0.9)')
    gradient.addColorStop(1, 'rgba(15, 76, 42, 0.2)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

    // Draw ground
    ctx.fillStyle = 'rgba(10, 26, 15, 0.8)'
    ctx.fillRect(0, canvas.offsetHeight * 0.8, canvas.offsetWidth, canvas.offsetHeight * 0.2)

    // Calculate tree positions if not set
    const trees = data.trees.map((tree, index) => ({
      ...tree,
      position: tree.position || {
        x: ((index % 5) + 1) * (canvas.offsetWidth / 6),
        y: Math.floor(index / 5) * 180 + canvas.offsetHeight * 0.5,
      },
    }))

    // Draw connections (roots)
    trees.forEach(tree => {
      tree.dependencies.forEach((dep, i) => {
        const targetTree = trees.find(t => t.name === dep)
        if (targetTree) {
          ctx.strokeStyle = tree.circularDeps > 0
            ? 'rgba(255, 68, 68, 0.3)'
            : 'rgba(0, 168, 107, 0.2)'
          ctx.lineWidth = 1
          ctx.setLineDash([5, 5])

          // Draw underground root connection
          ctx.beginPath()
          ctx.moveTo(tree.position!.x, tree.position!.y + 50)

          // Create curved path underground
          const midX = (tree.position!.x + targetTree.position!.x) / 2
          const midY = tree.position!.y + 100

          ctx.quadraticCurveTo(
            midX,
            midY,
            targetTree.position!.x,
            targetTree.position!.y + 50
          )
          ctx.stroke()
          ctx.setLineDash([])
        }
      })
    })

    // Draw trees
    trees.forEach((tree, index) => {
      const x = tree.position!.x
      const y = tree.position!.y

      // Draw roots
      ctx.strokeStyle = tree.circularDeps > 0 ? '#ff4444' : '#00A86B'
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.6

      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.moveTo(x, y + 50)
        const rootX = x + (Math.random() - 0.5) * 60
        const rootY = y + 50 + Math.random() * 40
        ctx.quadraticCurveTo(
          x + (rootX - x) / 2,
          y + 70,
          rootX,
          rootY
        )
        ctx.stroke()
      }

      ctx.globalAlpha = 1

      // Draw trunk
      const trunkWidth = Math.max(8, Math.log(tree.linesOfCode + 1) * 3)
      const trunkHeight = 50 + tree.complexity

      // Trunk gradient
      const trunkGradient = ctx.createLinearGradient(x - trunkWidth / 2, y, x + trunkWidth / 2, y)
      trunkGradient.addColorStop(0, '#4A2C17')
      trunkGradient.addColorStop(0.5, '#8B4513')
      trunkGradient.addColorStop(1, '#4A2C17')

      ctx.fillStyle = trunkGradient
      ctx.fillRect(x - trunkWidth / 2, y, trunkWidth, trunkHeight)

      // Draw branches
      ctx.strokeStyle = '#654321'
      ctx.lineWidth = 2

      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(x, y + 20 + i * 15)
        ctx.lineTo(x - 20 - i * 10, y - 10 + i * 5)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(x, y + 20 + i * 15)
        ctx.lineTo(x + 20 + i * 10, y - 10 + i * 5)
        ctx.stroke()
      }

      // Draw canopy (animated)
      const canopySize = 30 + tree.coverage * 0.5
      const canopyY = y - 20 + Math.sin(time + index) * 2

      // Canopy gradient based on health
      const canopyGradient = ctx.createRadialGradient(x, canopyY, 0, x, canopyY, canopySize)

      if (tree.health > 70) {
        canopyGradient.addColorStop(0, 'rgba(0, 255, 136, 0.9)')
        canopyGradient.addColorStop(0.5, 'rgba(0, 168, 107, 0.7)')
        canopyGradient.addColorStop(1, 'rgba(0, 168, 107, 0.3)')
      } else if (tree.health > 40) {
        canopyGradient.addColorStop(0, 'rgba(255, 193, 7, 0.9)')
        canopyGradient.addColorStop(0.5, 'rgba(255, 170, 0, 0.7)')
        canopyGradient.addColorStop(1, 'rgba(255, 170, 0, 0.3)')
      } else {
        canopyGradient.addColorStop(0, 'rgba(255, 68, 68, 0.9)')
        canopyGradient.addColorStop(0.5, 'rgba(255, 68, 68, 0.7)')
        canopyGradient.addColorStop(1, 'rgba(255, 68, 68, 0.3)')
      }

      ctx.fillStyle = canopyGradient

      // Draw multiple overlapping circles for fuller canopy
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.arc(
          x + (Math.random() - 0.5) * 20,
          canopyY + (Math.random() - 0.5) * 10,
          canopySize - i * 5,
          0,
          Math.PI * 2
        )
        ctx.fill()
      }

      // Draw health bar
      const barWidth = 40
      const barHeight = 4
      const barX = x - barWidth / 2
      const barY = y - 60

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(barX, barY, barWidth, barHeight)

      const healthColor = tree.health > 70 ? '#00FF88' : tree.health > 40 ? '#FFAA00' : '#FF4444'
      ctx.fillStyle = healthColor
      ctx.fillRect(barX, barY, (barWidth * tree.health) / 100, barHeight)

      // Draw label
      ctx.fillStyle = hoveredTree === tree.id ? '#FFFFFF' : '#E0FFE0'
      ctx.font = hoveredTree === tree.id ? 'bold 12px monospace' : '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(tree.name, x, y + trunkHeight + 20)

      // Draw additional info if hovered
      if (hoveredTree === tree.id) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.fillRect(x - 60, y + trunkHeight + 25, 120, 50)

        ctx.fillStyle = '#00FF88'
        ctx.font = '10px monospace'
        ctx.fillText(`Health: ${tree.health}%`, x, y + trunkHeight + 40)
        ctx.fillText(`Coverage: ${tree.coverage}%`, x, y + trunkHeight + 52)
        ctx.fillText(`Complexity: ${tree.complexity}`, x, y + trunkHeight + 64)
      }
    })

    // Draw fireflies/particles
    ctx.fillStyle = 'rgba(0, 255, 136, 0.8)'
    for (let i = 0; i < 20; i++) {
      const particleX = (Math.sin(time * 0.5 + i) + 1) * canvas.offsetWidth / 2
      const particleY = (Math.cos(time * 0.3 + i * 2) + 1) * canvas.offsetHeight / 2
      const size = Math.sin(time * 2 + i) * 1 + 2

      ctx.beginPath()
      ctx.arc(particleX, particleY, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [data, time, hoveredTree])

  // Redraw on data or animation frame change
  useEffect(() => {
    drawForest()
  }, [drawForest])

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Find clicked tree
    const clickedTree = data.trees.find(tree => {
      const treeX = ((data.trees.indexOf(tree) % 5) + 1) * (canvas.offsetWidth / 6)
      const treeY = Math.floor(data.trees.indexOf(tree) / 5) * 180 + canvas.offsetHeight * 0.5

      return Math.abs(x - treeX) < 40 && Math.abs(y - treeY) < 60
    })

    if (clickedTree) {
      setSelectedTree(clickedTree)
      onTreeClick?.(clickedTree)
    }
  }

  // Handle mouse move for hover effects
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Find hovered tree
    const hoveredTreeObj = data.trees.find(tree => {
      const treeX = ((data.trees.indexOf(tree) % 5) + 1) * (canvas.offsetWidth / 6)
      const treeY = Math.floor(data.trees.indexOf(tree) / 5) * 180 + canvas.offsetHeight * 0.5

      return Math.abs(x - treeX) < 40 && Math.abs(y - treeY) < 60
    })

    setHoveredTree(hoveredTreeObj?.id || null)
  }

  return (
    <div className="bg-surface/50 rounded-lg border border-border backdrop-blur-sm overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-text font-bold flex items-center gap-2">
          <Trees className="w-5 h-5 text-accent" />
          Forest Overview
        </h2>
        <p className="text-text-muted text-sm mt-1">
          Click on a tree to explore its lineage
        </p>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredTree(null)}
          className="w-full h-[400px] cursor-pointer"
          style={{ imageRendering: 'crisp-edges' }}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-text-muted">Healthy (70%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-text-muted">Warning (40-70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-text-muted">Critical (&lt;40%)</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <CheckCircle className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="text-text font-bold">
                {data.trees.filter(t => t.health > 70).length}
              </div>
              <div className="text-text-muted text-xs">Healthy</div>
            </div>
            <div className="text-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <div className="text-text font-bold">
                {data.trees.filter(t => t.health > 40 && t.health <= 70).length}
              </div>
              <div className="text-text-muted text-xs">Warning</div>
            </div>
            <div className="text-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <div className="text-text font-bold">
                {data.trees.filter(t => t.health <= 40).length}
              </div>
              <div className="text-text-muted text-xs">Critical</div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Tree Details */}
      {selectedTree && (
        <div className="p-4 border-t border-border/50 bg-surface/30">
          <h3 className="text-text font-semibold mb-2">{selectedTree.name}</h3>
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-text-muted">Health:</span>
              <span className="ml-2 text-text font-mono">{selectedTree.health}%</span>
            </div>
            <div>
              <span className="text-text-muted">Coverage:</span>
              <span className="ml-2 text-text font-mono">{selectedTree.coverage}%</span>
            </div>
            <div>
              <span className="text-text-muted">Complexity:</span>
              <span className="ml-2 text-text font-mono">{selectedTree.complexity}</span>
            </div>
            <div>
              <span className="text-text-muted">Size:</span>
              <span className="ml-2 text-text font-mono">{selectedTree.linesOfCode} LOC</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}