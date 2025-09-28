'use client'

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus, Info, ChevronRight } from 'lucide-react'

interface ExecutiveKPICardProps {
  title: string
  value: string
  subtitle: string
  trend?: number
  icon: ReactNode
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red'
  lineage?: {
    source: string
    confidence: number
    lastUpdated: string
    drillDownAvailable: boolean
  }
  onClick?: () => void
}

export function ExecutiveKPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color,
  lineage,
  onClick
}: ExecutiveKPICardProps) {
  const colorClasses = {
    green: 'from-green-600 to-emerald-600 border-green-600/30',
    blue: 'from-blue-600 to-indigo-600 border-blue-600/30',
    purple: 'from-purple-600 to-pink-600 border-purple-600/30',
    orange: 'from-orange-600 to-amber-600 border-orange-600/30',
    red: 'from-red-600 to-rose-600 border-red-600/30'
  }

  const iconColors = {
    green: 'text-green-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500',
    red: 'text-red-500'
  }

  return (
    <div
      className="relative bg-surface/50 rounded-lg border border-border backdrop-blur-sm overflow-hidden cursor-pointer transition-all hover:scale-105 hover:shadow-lg group"
      onClick={onClick}
    >
      {/* Gradient background effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-5 group-hover:opacity-10 transition-opacity`} />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} bg-opacity-10`}>
            <div className={iconColors[color]}>
              {icon}
            </div>
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
              <span className={`text-sm font-medium ${
                trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-text-muted'
              }`}>
                {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>

        {/* Value */}
        <div className="mb-2">
          <p className="text-3xl font-bold text-text">{value}</p>
          <p className="text-sm text-text-muted mt-1">{subtitle}</p>
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-text-muted mb-4">{title}</h3>

        {/* Lineage info */}
        {lineage && (
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-text-muted">
                <Info className="w-3 h-3" />
                <span>{lineage.source}</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    lineage.confidence > 0.9
                      ? 'bg-green-500'
                      : lineage.confidence > 0.7
                      ? 'bg-yellow-500'
                      : 'bg-orange-500'
                  }`}
                  title={`${(lineage.confidence * 100).toFixed(0)}% confidence`}
                />
                {lineage.drillDownAvailable && (
                  <ChevronRight className="w-3 h-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
            <div className="text-xs text-text-muted mt-1">
              Updated: {new Date(lineage.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Hover effect border */}
      <div className={`absolute inset-0 rounded-lg border-2 ${colorClasses[color].split(' ')[2]} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
    </div>
  )
}