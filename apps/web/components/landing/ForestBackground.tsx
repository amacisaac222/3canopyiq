'use client'

import { useRef, useEffect } from 'react'

interface ForestBackgroundProps {
  scrollY: number
}

export function ForestBackground({ scrollY }: ForestBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const timeRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])
  const treesRef = useRef<Tree[]>([])

  class Particle {
    x: number
    y: number
    size: number
    speedX: number
    speedY: number
    opacity: number
    color: string

    constructor(canvasWidth: number, canvasHeight: number) {
      this.x = Math.random() * canvasWidth
      this.y = Math.random() * canvasHeight
      this.size = Math.random() * 2 + 0.5
      this.speedX = (Math.random() - 0.5) * 0.5
      this.speedY = (Math.random() - 0.5) * 0.2
      this.opacity = Math.random() * 0.5 + 0.2
      this.color = Math.random() > 0.5 ? '#00FF88' : '#00A86B'
    }

    update(canvasWidth: number, canvasHeight: number, scrollOffset: number) {
      this.x += this.speedX
      this.y += this.speedY - scrollOffset * 0.02

      // Wrap around screen
      if (this.x > canvasWidth) this.x = 0
      if (this.x < 0) this.x = canvasWidth
      if (this.y > canvasHeight) this.y = 0
      if (this.y < 0) this.y = canvasHeight

      // Pulsate opacity
      this.opacity = 0.2 + Math.sin(timeRef.current * 2 + this.x) * 0.3
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = this.color
      ctx.globalAlpha = this.opacity
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }

  class Tree {
    x: number
    y: number
    width: number
    height: number
    swayOffset: number
    color: string
    growth: number

    constructor(canvasWidth: number, canvasHeight: number, index: number) {
      this.x = (index % 8) * (canvasWidth / 8) + Math.random() * 100
      this.y = canvasHeight - 200 - Math.random() * 400
      this.width = Math.random() * 30 + 20
      this.height = Math.random() * 200 + 100
      this.swayOffset = Math.random() * Math.PI * 2
      this.color = `rgba(0, ${Math.floor(Math.random() * 55 + 100)}, ${Math.floor(Math.random() * 40 + 40)}, 0.3)`
      this.growth = 0
    }

    update(scrollOffset: number) {
      // Grow trees as user scrolls
      this.growth = Math.min(1, scrollOffset / 1000)
    }

    draw(ctx: CanvasRenderingContext2D, time: number) {
      const sway = Math.sin(time + this.swayOffset) * 2
      const actualHeight = this.height * this.growth

      // Draw trunk
      ctx.fillStyle = 'rgba(74, 44, 23, 0.5)'
      ctx.fillRect(
        this.x - this.width / 6,
        this.y + this.height - actualHeight,
        this.width / 3,
        actualHeight
      )

      // Draw canopy
      ctx.fillStyle = this.color
      ctx.beginPath()
      ctx.ellipse(
        this.x + sway,
        this.y + this.height - actualHeight,
        this.width * this.growth,
        this.width * 0.8 * this.growth,
        0,
        0,
        Math.PI * 2
      )
      ctx.fill()

      // Draw second layer for depth
      ctx.fillStyle = this.color.replace('0.3', '0.2')
      ctx.beginPath()
      ctx.ellipse(
        this.x + sway * 0.5,
        this.y + this.height - actualHeight + 20,
        this.width * 0.7 * this.growth,
        this.width * 0.6 * this.growth,
        0,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Initialize particles
      if (particlesRef.current.length === 0) {
        for (let i = 0; i < 100; i++) {
          particlesRef.current.push(new Particle(canvas.width, canvas.height))
        }
      }

      // Initialize trees
      if (treesRef.current.length === 0) {
        for (let i = 0; i < 20; i++) {
          treesRef.current.push(new Tree(canvas.width, canvas.height, i))
        }
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const animate = () => {
      if (!ctx || !canvas) return

      timeRef.current += 0.01

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw and update trees
      treesRef.current.forEach(tree => {
        tree.update(scrollY)
        tree.draw(ctx, timeRef.current)
      })

      // Draw and update particles
      particlesRef.current.forEach(particle => {
        particle.update(canvas.width, canvas.height, scrollY)
        particle.draw(ctx)
      })

      // Add fog effect
      const gradient = ctx.createLinearGradient(0, canvas.height - 200, 0, canvas.height)
      gradient.addColorStop(0, 'rgba(0, 40, 20, 0)')
      gradient.addColorStop(1, 'rgba(0, 40, 20, 0.6)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw connecting lines between particles (constellation effect)
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)'
      ctx.lineWidth = 0.5
      particlesRef.current.forEach((p1, i) => {
        particlesRef.current.slice(i + 1, i + 3).forEach(p2 => {
          const distance = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
          if (distance < 100) {
            ctx.globalAlpha = (1 - distance / 100) * 0.3
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        })
      })
      ctx.globalAlpha = 1

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [scrollY])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ background: 'linear-gradient(to bottom, #000000, #001a0d)' }}
    />
  )
}