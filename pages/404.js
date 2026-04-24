// pages/404.js
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="text-center page-enter">
        <p className="font-mono text-6xl text-ink-200 mb-4">404</p>
        <h1 className="font-display text-3xl text-ink-900 mb-2">Page not found</h1>
        <p className="text-ink-500 text-sm mb-6">The page you're looking for doesn't exist.</p>
        <Link href="/" className="px-5 py-2.5 bg-ink-800 text-cream-50 rounded-lg text-sm font-medium hover:bg-ink-700 transition-colors">
          Back to home
        </Link>
      </div>
    </main>
  )
}
