'use client'

import Link from 'next/link'
import { Github, ArrowRight, Code2, Zap } from 'lucide-react'

export default function LoginPage() {
  const handleGitHubLogin = () => {
    // In production, this would initiate GitHub OAuth flow
    window.location.href = '/api/auth/github'
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Login form */}
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
            <h1 className="text-4xl font-black tracking-tighter mb-3">Welcome back</h1>
            <p className="text-lg text-text-muted">Sign in to continue documenting PRs</p>
          </div>

          {/* GitHub login button - Primary CTA */}
          <button
            onClick={handleGitHubLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-200 group text-lg"
          >
            <Github className="w-6 h-6" />
            Continue with GitHub
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Security note */}
          <div className="mt-6 p-4 bg-surface/50 border border-border rounded-lg">
            <p className="text-sm text-text-muted text-center">
              <span className="text-green-500">●</span> Secure GitHub OAuth
              <br />
              We never store your code or credentials
            </p>
          </div>

          {/* Sign up link */}
          <p className="mt-8 text-center text-sm text-text-muted">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:text-primary-dark font-semibold">
              Start free trial
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-surface/30 items-center justify-center px-8 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-5" />

        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold uppercase tracking-wider text-primary mb-6">
              TRUSTED BY 1,247 DEVELOPERS
            </div>

            <h2 className="text-5xl lg:text-6xl font-black tracking-tighter mb-6">
              Ship code.
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Skip docs.
              </span>
            </h2>

            <p className="text-lg text-text-muted leading-relaxed mb-8">
              CanopyIQ automatically documents every PR from your Claude sessions.
              Never write PR descriptions manually again.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-black text-primary mb-1">2,847</div>
              <div className="text-xs uppercase tracking-wider text-text-muted">PRs Documented</div>
            </div>
            <div>
              <div className="text-3xl font-black text-primary mb-1">45min</div>
              <div className="text-xs uppercase tracking-wider text-text-muted">Saved per PR</div>
            </div>
            <div>
              <div className="text-3xl font-black text-primary mb-1">100%</div>
              <div className="text-xs uppercase tracking-wider text-text-muted">Compliant</div>
            </div>
          </div>

          {/* Features list */}
          <div className="mt-12 pt-8 border-t border-border space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm">Instant PR documentation from Claude sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm">Complete decision tracking and context</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm">Works with your existing GitHub workflow</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}