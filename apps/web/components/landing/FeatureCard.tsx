'use client'

import { ReactNode, useState } from 'react'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  delay?: number
}

export function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative group"
      style={{ animationDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient border effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur`} />

      <div className="relative bg-black/90 border border-green-900/50 rounded-lg p-6 h-full backdrop-blur-sm transform transition-all duration-300 hover:scale-105 hover:border-green-600/50">
        {/* Icon container */}
        <div className="mb-4 relative">
          <div className={`absolute inset-0 bg-green-600/20 rounded-full blur-xl transition-all duration-300 ${
            isHovered ? 'scale-150 opacity-100' : 'scale-100 opacity-0'
          }`} />
          <div className="relative">
            {icon}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-3 transition-colors group-hover:text-green-400">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-400 text-sm leading-relaxed">
          {description}
        </p>

        {/* Animated corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-600/0 group-hover:border-green-600 transition-all duration-300 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-600/0 group-hover:border-green-600 transition-all duration-300 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-600/0 group-hover:border-green-600 transition-all duration-300 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-600/0 group-hover:border-green-600 transition-all duration-300 rounded-br-lg" />

        {/* Hover glow effect */}
        <div className={`absolute inset-0 rounded-lg transition-opacity duration-300 pointer-events-none ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-t from-green-600/10 to-transparent rounded-lg" />
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .group {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}