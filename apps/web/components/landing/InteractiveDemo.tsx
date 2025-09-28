'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Activity, GitBranch, FileCode, Shield } from 'lucide-react'

export function InteractiveDemo() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const eventsRef = useRef<DemoEvent[]>([])
  const timeRef = useRef(0)

  interface DemoEvent {
    id: string
    type: 'code' | 'analysis' | 'pr' | 'deploy'
    label: string
    x: number
    y: number
    targetX: number
    targetY: number
    progress: number
    color: string
    icon: string
  }

  const demoSteps = [
    { type: 'code', label: 'Claude edits auth.ts', icon: '🤖' },
    { type: 'analysis', label: 'Complexity analysis', icon: '📊' },
    { type: 'code', label: 'Tests added', icon: '✅' },
    { type: 'analysis', label: 'Security scan', icon: '🛡️' },
    { type: 'pr', label: 'PR created', icon: '🔀' },
    { type: 'analysis', label: 'Compliance check', icon: '✓' },
    { type: 'deploy', label: 'Deployed to prod', icon: '🚀' },
  ]

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) / 3

    // Generate event spawn position
    const spawnEvent = () => {
      if (currentStep >= demoSteps.length) {
        setCurrentStep(0)
        eventsRef.current = []
        return
      }

      const step = demoSteps[currentStep]
      const angle = (currentStep / demoSteps.length) * Math.PI * 2 - Math.PI / 2

      const event: DemoEvent = {
        id: `event-${Date.now()}`,
        type: step.type as any,
        label: step.label,
        x: 50,
        y: canvas.height / 2,
        targetX: centerX + Math.cos(angle) * radius,
        targetY: centerY + Math.sin(angle) * radius,
        progress: 0,
        color: getEventColor(step.type),
        icon: step.icon,
      }

      eventsRef.current.push(event)
      setCurrentStep(prev => prev + 1)
    }

    const getEventColor = (type: string) => {
      switch (type) {
        case 'code': return '#00FF88'
        case 'analysis': return '#00A86B'
        case 'pr': return '#FFA500'
        case 'deploy': return '#FF00FF'
        default: return '#FFFFFF'
      }
    }

    const animate = () => {
      timeRef.current += 0.016

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw central tree
      drawTree(ctx, centerX, centerY, radius)

      // Update and draw events
      eventsRef.current = eventsRef.current.filter(event => {
        event.progress += 0.02

        const x = event.x + (event.targetX - event.x) * event.progress
        const y = event.y + (event.targetY - event.y) * event.progress

        // Draw event
        ctx.fillStyle = event.color
        ctx.globalAlpha = 1 - event.progress * 0.3
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, Math.PI * 2)
        ctx.fill()

        // Draw label
        if (event.progress < 0.8) {
          ctx.fillStyle = '#FFFFFF'
          ctx.font = '12px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(event.icon, x, y - 15)
          ctx.fillText(event.label, x, y + 25)
        }

        // Draw trail
        ctx.strokeStyle = event.color
        ctx.globalAlpha = 0.3
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(event.x, event.y)
        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.globalAlpha = 1

        return event.progress < 1
      })

      // Spawn new events periodically
      if (timeRef.current % 1 < 0.016 && eventsRef.current.length < 3) {
        spawnEvent()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    const drawTree = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      // Draw trunk
      ctx.fillStyle = '#4A2C17'
      ctx.fillRect(x - size / 20, y, size / 10, size / 2)

      // Draw canopy layers
      const canopyColors = ['#00A86B', '#00FF88', '#00C060']
      canopyColors.forEach((color, i) => {
        const radius = Math.max(5, size / 2 - i * 30) // Ensure radius is never negative
        ctx.fillStyle = color
        ctx.globalAlpha = 0.6 - i * 0.1
        ctx.beginPath()
        ctx.arc(
          x + Math.sin(timeRef.current + i) * 5,
          y - size / 4 + i * 20,
          radius,
          0,
          Math.PI * 2
        )
        ctx.fill()
      })

      ctx.globalAlpha = 1

      // Draw growth rings
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)'
      ctx.lineWidth = 1
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath()
        ctx.arc(x, y, size * (i / 3), 0, Math.PI * 2)
        ctx.stroke()
      }

      // Draw branches (event connections)
      eventsRef.current.forEach((event, i) => {
        if (event.progress > 0.8) {
          ctx.strokeStyle = event.color
          ctx.globalAlpha = 0.5
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(event.targetX, event.targetY)
          ctx.stroke()
        }
      })

      ctx.globalAlpha = 1
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, currentStep])

  return (
    <div className="relative">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-[400px] rounded-lg"
        style={{ background: 'linear-gradient(135deg, #001a0d 0%, #003d1f 100%)' }}
      />

      {/* Controls */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-2 bg-green-600/80 hover:bg-green-600 rounded-lg transition-colors backdrop-blur-sm"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button
          onClick={() => {
            setCurrentStep(0)
            eventsRef.current = []
            timeRef.current = 0
          }}
          className="p-2 bg-green-600/80 hover:bg-green-600 rounded-lg transition-colors backdrop-blur-sm"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Event Legend */}
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3">
        <div className="text-xs font-semibold mb-2 text-green-400">Event Flow</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-[#00FF88]" />
            <span>Code Change</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-[#00A86B]" />
            <span>Analysis</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-[#FFA500]" />
            <span>Pull Request</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-[#FF00FF]" />
            <span>Deployment</span>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-green-950/30 rounded-lg p-3 border border-green-900/50">
          <Activity className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-white">247</div>
          <div className="text-xs text-gray-400">Events/hour</div>
        </div>
        <div className="bg-green-950/30 rounded-lg p-3 border border-green-900/50">
          <GitBranch className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-white">12</div>
          <div className="text-xs text-gray-400">Active PRs</div>
        </div>
        <div className="bg-green-950/30 rounded-lg p-3 border border-green-900/50">
          <FileCode className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-white">89%</div>
          <div className="text-xs text-gray-400">Coverage</div>
        </div>
        <div className="bg-green-950/30 rounded-lg p-3 border border-green-900/50">
          <Shield className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-white">100%</div>
          <div className="text-xs text-gray-400">Compliant</div>
        </div>
      </div>
    </div>
  )
}