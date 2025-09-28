'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Github, ArrowRight, Code2, Check, Zap } from 'lucide-react'

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGitHubSignup = () => {
    setIsLoading(true)
    // In production, this would initiate GitHub OAuth flow with signup intent
    window.location.href = '/api/auth/github?signup=true'
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Benefits */}
      <div className="hidden lg:flex flex-1 bg-surface/30 items-center justify-center px-8 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-5" />

        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold uppercase tracking-wider text-primary mb-6">
              14-DAY FREE TRIAL
            </div>

            <h2 className="text-5xl lg:text-6xl font-black tracking-tighter mb-6">
              Start saving
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                45 minutes
              </span>
              <br />
              per PR today
            </h2>
          </div>

          {/* Benefits list */}
          <div className="space-y-4 mb-8">
            {[
              'Automatic PR documentation from Claude sessions',
              'Complete decision tracking and context',
              'Security and compliance checks',
              'Team analytics and insights',
              'Works with your existing GitHub workflow'
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-text/90">{benefit}</p>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="pt-8 border-t border-border">
            <p className="text-sm text-text-muted mb-4">Trusted by engineering teams at</p>
            <div className="flex items-center gap-8 opacity-60">
              <div className="text-lg font-bold">TechCorp</div>
              <div className="text-lg font-bold">StartupCo</div>
              <div className="text-lg font-bold">DevShop</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Signup */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl">CanopyIQ</span>
          </Link>

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-black tracking-tighter mb-3">Start your free trial</h1>
            <p className="text-lg text-text-muted">14 days free • No credit card required</p>
          </div>

          {/* GitHub signup button - Primary CTA */}
          <button
            onClick={handleGitHubSignup}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-200 group text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Github className="w-6 h-6" />
            {isLoading ? 'Connecting...' : 'Continue with GitHub'}
            {!isLoading && <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />}
          </button>

          {/* What happens next */}
          <div className="mt-8 p-4 bg-surface/50 border border-border rounded-lg">
            <p className="text-sm font-semibold text-text mb-3">What happens next:</p>
            <div className="space-y-2 text-sm text-text-muted">
              <div className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                <span>Authorize CanopyIQ to access your GitHub repos</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                <span>We'll set up webhooks for your repositories</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                <span>Start coding with Claude and see automatic PR docs</span>
              </div>
            </div>
          </div>

          {/* Security note */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-text-muted">
            <Zap className="w-3 h-3 text-green-500" />
            <span>We never store your code • Read-only access • Cancel anytime</span>
          </div>

          {/* Sign in link */}
          <p className="mt-8 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary-dark font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}