import { Trees, Activity, TrendingUp, Layers, Code2, GitBranch } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trees className="w-12 h-12 text-accent" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              CanopyIQ
            </h1>
          </div>
          <p className="text-xl text-text-muted">Intelligence above your code - see the forest AND the trees</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="canopy-card">
            <Activity className="w-8 h-8 text-accent mb-4" />
            <h3 className="text-lg font-semibold mb-2">Real-time Monitoring</h3>
            <p className="text-text-muted">Track development workflows and identify patterns across your entire codebase</p>
          </div>

          <div className="canopy-card">
            <TrendingUp className="w-8 h-8 text-accent mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analytics Engine</h3>
            <p className="text-text-muted">Advanced metrics calculation for code quality, velocity, and team performance</p>
          </div>

          <div className="canopy-card">
            <Layers className="w-8 h-8 text-accent mb-4" />
            <h3 className="text-lg font-semibold mb-2">MCP Integration</h3>
            <p className="text-text-muted">Seamlessly integrate with Claude Code through Model Context Protocol</p>
          </div>

          <div className="canopy-card">
            <Code2 className="w-8 h-8 text-accent mb-4" />
            <h3 className="text-lg font-semibold mb-2">Intelligent Insights</h3>
            <p className="text-text-muted">AI-powered recommendations for code improvements and optimization</p>
          </div>

          <div className="canopy-card">
            <GitBranch className="w-8 h-8 text-accent mb-4" />
            <h3 className="text-lg font-semibold mb-2">GitHub Integration</h3>
            <p className="text-text-muted">Deep integration with GitHub for comprehensive repository analysis</p>
          </div>

          <div className="canopy-card">
            <Trees className="w-8 h-8 text-accent mb-4" />
            <h3 className="text-lg font-semibold mb-2">Holistic View</h3>
            <p className="text-text-muted">See both the big picture and the details of your development ecosystem</p>
          </div>
        </div>

        <div className="canopy-card text-center">
          <h2 className="text-2xl font-bold mb-4">Get Started</h2>
          <p className="text-text-muted mb-6">Connect your development tools and let CanopyIQ provide intelligent oversight</p>
          <button className="canopy-button">
            Launch Dashboard
          </button>
        </div>
      </div>
    </main>
  )
}