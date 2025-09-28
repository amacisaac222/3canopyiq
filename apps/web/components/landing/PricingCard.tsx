'use client'

import { Check, Sparkles } from 'lucide-react'

interface PricingCardProps {
  name: string
  price: string
  priceUnit?: string
  description: string
  features: string[]
  highlighted?: boolean
}

export function PricingCard({
  name,
  price,
  priceUnit,
  description,
  features,
  highlighted = false
}: PricingCardProps) {
  return (
    <div className={`relative ${highlighted ? 'scale-105 z-10' : ''}`}>
      {/* Popular badge */}
      {highlighted && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            MOST POPULAR
          </div>
        </div>
      )}

      {/* Card container */}
      <div className={`relative group h-full ${highlighted ? 'mt-4' : ''}`}>
        {/* Animated gradient border for highlighted */}
        {highlighted && (
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 rounded-lg opacity-75 group-hover:opacity-100 blur transition-opacity animate-gradient" />
        )}

        <div className={`relative h-full bg-black/90 border rounded-lg p-6 backdrop-blur-sm transform transition-all duration-300 hover:scale-[1.02] ${
          highlighted
            ? 'border-transparent'
            : 'border-green-900/50 hover:border-green-600/50'
        }`}>
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className={`text-2xl font-bold mb-2 ${
              highlighted ? 'text-green-400' : 'text-white'
            }`}>
              {name}
            </h3>
            <p className="text-gray-400 text-sm mb-4">{description}</p>

            {/* Price */}
            <div className="flex items-end justify-center gap-1">
              <span className="text-4xl font-bold text-white">{price}</span>
              {priceUnit && (
                <span className="text-gray-400 text-lg mb-1">{priceUnit}</span>
              )}
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Check className={`w-5 h-5 ${
                    highlighted ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
                <span className="text-gray-300 text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <button className={`w-full py-3 px-6 rounded-lg font-bold transition-all transform hover:scale-105 ${
            highlighted
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:shadow-green-600/25'
              : 'bg-transparent border-2 border-green-600 text-green-400 hover:bg-green-600/20'
          }`}>
            {price === 'Custom' ? 'Contact Sales' : 'Get Started'}
          </button>

          {/* Decorative elements */}
          {highlighted && (
            <>
              <div className="absolute top-0 left-0 w-20 h-20 bg-green-600/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-emerald-600/10 rounded-full blur-3xl" />
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}