'use client'

import Link from 'next/link'
import { Github, ArrowRight, Check, Zap, Code2, GitPullRequest, Shield } from 'lucide-react'

export default function LandingPage() {

  return (
    <div className="min-h-screen bg-background text-text antialiased">
      {/* Subtle gradient mesh background */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-[0.02] pointer-events-none" />

      {/* Clean navigation bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg">CanopyIQ</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-text-muted hover:text-text transition-colors text-sm font-medium">
              Dashboard
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Greptile style with massive text */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-16">
        <div className="max-w-5xl w-full text-center">
          {/* Small uppercase badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">SHIP 3X FASTER</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter leading-none">
            Never write
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              PR docs again
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-text-muted mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            CanopyIQ automatically documents every PR from your Claude sessions.
            <span className="text-text"> Save 45+ minutes per PR.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group px-8 py-4 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-all duration-200 flex items-center gap-3 text-base"
            >
              <Github className="w-5 h-5" />
              Start Free
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#proof"
              className="px-8 py-4 text-text-muted hover:text-text transition-colors font-semibold text-base"
            >
              See the proof →
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="font-medium">2,847 PRs documented</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="font-medium">439 hours saved</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem - Direct and punchy */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-wider text-primary mb-4">THE PROBLEM</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
              Your PRs lack context
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-black text-red-500 mb-4">67%</div>
              <p className="font-semibold text-lg mb-2">of PRs rejected</p>
              <p className="text-text-muted">due to missing documentation</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-yellow-500 mb-4">45m</div>
              <p className="font-semibold text-lg mb-2">wasted per PR</p>
              <p className="text-text-muted">writing docs manually</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-primary mb-4">0%</div>
              <p className="font-semibold text-lg mb-2">of decisions tracked</p>
              <p className="text-text-muted">from AI pair programming</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Ultra simple */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-wider text-primary mb-4">HOW IT WORKS</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
              Three steps. Zero effort.
            </h2>
          </div>

          <div className="space-y-16">
            <div className="flex items-start gap-8">
              <div className="text-7xl font-black text-primary/20 w-24 text-right flex-shrink-0">1</div>
              <div>
                <h3 className="text-2xl font-black mb-3">Code with Claude</h3>
                <p className="text-lg text-text-muted leading-relaxed">
                  Continue using Claude Code normally. We capture every conversation, decision, and iteration automatically.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="text-7xl font-black text-primary/20 w-24 text-right flex-shrink-0">2</div>
              <div>
                <h3 className="text-2xl font-black mb-3">Push your PR</h3>
                <p className="text-lg text-text-muted leading-relaxed">
                  Create your pull request on GitHub. CanopyIQ instantly matches your Claude session to the PR.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="text-7xl font-black text-primary/20 w-24 text-right flex-shrink-0">3</div>
              <div>
                <h3 className="text-2xl font-black mb-3">Get perfect docs</h3>
                <p className="text-lg text-text-muted leading-relaxed">
                  Receive complete documentation with context, decisions, and compliance checks. Automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof - Show the actual output */}
      <section id="proof" className="py-24 px-6 border-t border-border bg-surface/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-bold uppercase tracking-wider text-primary mb-4">THE PROOF</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-4">
              Real PR. Real documentation.
            </h2>
            <p className="text-xl text-text-muted">Generated in 0.3 seconds</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-8 font-mono text-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="ml-4 text-text-muted font-sans font-semibold">PR #234: Refactor authentication</span>
            </div>

            <div className="space-y-6 text-text/90">
              <div>
                <div className="text-primary font-bold mb-3">## WHAT CHANGED</div>
                <div className="pl-4 space-y-2 text-text-muted">
                  <div>• OAuth 2.0 replaced JWT (3 OWASP vulnerabilities fixed)</div>
                  <div>• Argon2id replaced SHA256 (NIST compliant)</div>
                  <div>• Rate limiting added (DDoS protection)</div>
                </div>
              </div>

              <div>
                <div className="text-primary font-bold mb-3">## WHY THESE DECISIONS</div>
                <div className="pl-4 space-y-3 text-text-muted">
                  <div>
                    <span className="text-xs text-text-muted/60">[14:32]</span>
                    <span className="text-yellow-500 ml-2">Developer:</span> "Need better security"
                  </div>
                  <div className="ml-8">
                    <span className="text-blue-500">Claude:</span> JWT, OAuth 2.0, or SAML?
                  </div>
                  <div className="ml-8">
                    <span className="text-yellow-500">→ Chose OAuth 2.0</span> for third-party integration
                  </div>
                </div>
              </div>

              <div>
                <div className="text-primary font-bold mb-3">## IMPACT</div>
                <div className="pl-4 space-y-2">
                  <div className="text-green-500 font-bold">✓ SECURITY: 100% compliant</div>
                  <div className="text-yellow-500 font-bold">⚠ BREAKING: 2.3k tokens need migration</div>
                  <div className="text-text-muted">○ PERFORMANCE: +47ms latency (acceptable)</div>
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-between text-xs text-text-muted font-sans">
                <span className="font-bold">Your contribution: 68%</span>
                <span className="font-bold">Time saved: 45 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - What you get */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-wider text-primary mb-4">FEATURES</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
              Everything. Automated.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'COMPLETE CONTEXT',
                description: 'Every "why" captured from Claude conversations'
              },
              {
                title: 'DECISION TRACKING',
                description: 'Trade-offs, alternatives, and final choices logged'
              },
              {
                title: 'CONTRIBUTION METRICS',
                description: 'Prove your work vs AI suggestions'
              },
              {
                title: 'SECURITY SCANNING',
                description: 'Automatic vulnerability and compliance checks'
              },
              {
                title: 'TIME ANALYTICS',
                description: 'Track effort with AI vs human breakdown'
              },
              {
                title: 'TEAM INSIGHTS',
                description: 'Pattern analysis and knowledge sharing'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl border border-border hover:border-primary/30 hover:bg-surface/50 transition-all duration-200"
              >
                <h3 className="font-black text-sm uppercase tracking-wider mb-2">{feature.title}</h3>
                <p className="text-text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Simple and direct */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-wider text-primary mb-4">PRICING</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
              Start free. Stay free.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border border-border rounded-xl p-8 hover:border-primary/30 transition-colors">
              <h3 className="text-xl font-black mb-2 uppercase">FREE</h3>
              <div className="text-4xl font-black mb-6">
                $0
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Unlimited PRs</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>All features included</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>GitHub integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Community support</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-6 w-full px-4 py-3 bg-surface border border-border text-text font-bold rounded-lg hover:bg-surface/80 transition-colors text-sm flex items-center justify-center"
              >
                Start Free
              </Link>
            </div>

            <div className="border-2 border-primary bg-primary/5 rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-black rounded-full uppercase tracking-wider">
                Most Popular
              </div>
              <h3 className="text-xl font-black mb-2 uppercase">TEAM</h3>
              <div className="text-4xl font-black mb-6">
                $20<span className="text-base font-normal text-text-muted">/user</span>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Team analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Compliance reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>SSO & audit logs</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-6 w-full px-4 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors text-sm flex items-center justify-center"
              >
                Start Team Trial
              </Link>
            </div>

            <div className="border border-border rounded-xl p-8 hover:border-primary/30 transition-colors">
              <h3 className="text-xl font-black mb-2 uppercase">ENTERPRISE</h3>
              <div className="text-4xl font-black mb-6">
                Custom
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Everything in Team</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>On-premise option</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>SLA guarantee</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Dedicated support</span>
                </li>
              </ul>
              <a
                href="mailto:sales@canopyiq.com"
                className="mt-6 w-full px-4 py-3 bg-surface border border-border text-text font-bold rounded-lg hover:bg-surface/80 transition-colors text-sm flex items-center justify-center"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Final push */}
      <section className="py-32 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-primary mb-6">START NOW</p>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-8">
            Ship faster.
            <br />
            Document instantly.
          </h2>
          <p className="text-xl md:text-2xl text-text-muted mb-12 font-medium">
            Join 1,247 developers saving 45+ minutes per PR
          </p>

          <Link
            href="/get-started"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-primary to-secondary text-white font-black rounded-lg hover:shadow-2xl hover:shadow-primary/30 transition-all duration-200 text-lg"
          >
            <Zap className="w-6 h-6" />
            Get Started Free
            <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
          </Link>

          <div className="mt-8 text-sm text-text-muted">
            No credit card • 5 minute setup • Works with Claude Code
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="border-t border-border px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">CanopyIQ</span>
            </div>
            <div className="flex items-center gap-8 text-sm font-medium">
              <a href="https://github.com/canopyiq/docs" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text transition-colors">
                Docs
              </a>
              <a href="https://github.com/canopyiq" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text transition-colors">
                GitHub
              </a>
              <Link href="/dashboard" className="text-text-muted hover:text-text transition-colors">
                Dashboard
              </Link>
              <a href="mailto:support@canopyiq.com" className="text-text-muted hover:text-text transition-colors">
                Support
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-xs text-text-muted">
            © 2024 CanopyIQ. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}