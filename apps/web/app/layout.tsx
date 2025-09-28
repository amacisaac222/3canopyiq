import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CanopyIQ - AI Intelligence Layer for Your Codebase',
  description: 'Transform your development workflow with AI-powered intelligence that grows with your code',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background text-text">{children}</body>
    </html>
  )
}
