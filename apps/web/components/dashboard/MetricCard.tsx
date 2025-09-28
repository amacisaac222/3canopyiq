'use client'

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number
  max?: number
  unit?: string
  icon: ReactNode
  color: 'accent' | 'secondary' | 'primary' | 'yellow'
  trend?: number
  lineage?: {
    eventCount: number
    confidence: number
    metricId?: string
  }
  onClick?: () => void
}

export function MetricCard({
  title,
  value,
  max,
  unit = '',
  icon,
  color,
  trend,
  lineage,
  onClick,
}: MetricCardProps) {
  const percentage = max ? (value / max) * 100 : null
  
  const colorClasses = {
    accent: 'text-accent border-accent/30 bg-accent/5',
    secondary: 'text-secondary border-secondary/30 bg-secondary/5',
    primary: 'text-primary border-primary/30 bg-primary/5',
    yellow: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5',
  }

  const progressColorClasses = {
    accent: 'bg-accent',
    secondary: 'bg-secondary',
    primary: 'bg-primary',
    yellow: 'bg-yellow-500',
  }

  return (
    <div
      className={`relative bg-surface/50 rounded-lg border backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer ${colorClasses[color]}`}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-text-muted text-sm font-medium">{title}</span>
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : trend < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-text-muted" />
              )}
              <span className={`text-xs font-medium ${
                trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-text-muted'
              }`}>
                {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-3">
          <span className="text-3xl font-bold text-text">
            {value.toLocaleString()}
          </span>
          {unit && (
            <span className="text-lg text-text-muted ml-1">{unit}</span>
          )}
          {percentage !== null && (
            <span className="text-sm text-text-muted ml-2">
              ({percentage.toFixed(1)}%)
            </span>
          )}
        </div>

        {/* Progress bar */}
        {percentage !== null && (
          <div className="mb-3">
            <div className="h-2 bg-background/50 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${progressColorClasses[color]}`}
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
          </div>
        )}

        {/* Lineage info */}
        {lineage && (
          <div className="flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <Info className="w-3 h-3" />
              <span>{lineage.eventCount} events</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  lineage.confidence > 80
                    ? 'bg-green-500'
                    : lineage.confidence > 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              />
              <span>{lineage.confidence}% confidence</span>
            </div>
          </div>
        )}
      </div>

      {/* Hover effect glow */}
      <div
        className={`absolute inset-0 rounded-lg opacity-0 hover:opacity-20 transition-opacity pointer-events-none ${
          progressColorClasses[color]
        }`}
        style={{
          background: `radial-gradient(circle at center, currentColor, transparent)`,
        }}
      />
    </div>
  )
}