'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  GitPullRequest,
  CheckCircle,
  Clock,
  ExternalLink,
  Search
} from 'lucide-react'

export default function PullRequestsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  // Remove dummy data - will fetch from API when PRs are created
  const pullRequests: any[] = []

  const filteredPRs = pullRequests.filter(pr =>
    pr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pr.repo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pr.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pr.number.toString().includes(searchTerm)
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-surface/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-text">Pull Requests</h1>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Simple search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search pull requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
        </div>

        {/* PR List */}
        {filteredPRs.length === 0 ? (
          <div className="bg-surface/50 border border-border rounded-lg p-12 text-center">
            <GitPullRequest className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pull Requests Yet</h3>
            <p className="text-text-muted max-w-md mx-auto">
              {searchTerm
                ? 'No pull requests match your search'
                : 'Pull requests from your connected repositories will appear here once they are created and documented by Claude.'}
            </p>
            <p className="text-sm text-text-muted mt-4">
              Create a PR in one of your connected repositories to get started!
            </p>
          </div>
        ) : (
          <div className="bg-surface/50 border border-border rounded-lg overflow-hidden">
            <div className="divide-y divide-border">
              {filteredPRs.map((pr) => (
                <div key={pr.id} className="p-6 hover:bg-surface/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-text-muted">#{pr.number}</span>
                        <h3 className="font-medium text-text truncate">{pr.title}</h3>
                        {pr.status === 'documented' ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded shrink-0">
                            <CheckCircle className="w-3 h-3" />
                            Documented
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-500 rounded shrink-0">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-muted">
                        <span>{pr.repo}</span>
                        <span>by {pr.author}</span>
                        {pr.status === 'documented' && (
                          <span>• Documented {pr.documentedAt}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {pr.status === 'documented' && pr.documentationUrl && (
                        <Link
                          href={pr.documentationUrl}
                          className="px-3 py-1.5 text-sm bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors"
                        >
                          View Docs
                        </Link>
                      )}
                      <a
                        href={pr.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-text-muted hover:text-text transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}