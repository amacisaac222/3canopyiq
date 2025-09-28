'use client'

import { useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface DetailPanelProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  tabs?: Array<{
    id: string
    label: string
    content: React.ReactNode
  }>
  activeTab?: string
  onTabChange?: (tabId: string) => void
}

export default function DetailPanel({
  isOpen,
  onClose,
  title,
  children,
  tabs,
  activeTab,
  onTabChange
}: DetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Optional: uncomment to close on outside click
        // onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full bg-surface border-l border-border shadow-2xl transition-transform z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '600px', maxWidth: '90vw' }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-text">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          {/* Tabs (if provided) */}
          {tabs && tabs.length > 0 && (
            <div className="flex items-center gap-1 px-6 py-2 border-b border-border">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-muted hover:bg-surface-hover hover:text-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {tabs && activeTab ? (
              <div className="p-6">
                {tabs.find(tab => tab.id === activeTab)?.content}
              </div>
            ) : (
              <div className="p-6">{children}</div>
            )}
          </div>

          {/* Footer (optional navigation) */}
          {tabs && tabs.length > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-border">
              <button
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab)
                  if (currentIndex > 0) {
                    onTabChange?.(tabs[currentIndex - 1].id)
                  }
                }}
                disabled={tabs.findIndex(t => t.id === activeTab) === 0}
                className="flex items-center gap-1 px-3 py-1 text-sm text-text-muted hover:text-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => {
                  const currentIndex = tabs.findIndex(t => t.id === activeTab)
                  if (currentIndex < tabs.length - 1) {
                    onTabChange?.(tabs[currentIndex + 1].id)
                  }
                }}
                disabled={tabs.findIndex(t => t.id === activeTab) === tabs.length - 1}
                className="flex items-center gap-1 px-3 py-1 text-sm text-text-muted hover:text-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}