// pages/index.js
import { useEffect, useState } from 'react'
import { getApprovedEditors } from '../lib/db'
import EditorCard from '../components/editor/EditorCard'
import { Spinner, EmptyState } from '../components/ui'
import Link from 'next/link'
import { useAuth } from '../lib/AuthContext'

export default function HomePage() {
  const { user } = useAuth()
  const [editors, setEditors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    setEditors(getApprovedEditors())
    setLoading(false)
  }, [])

  const filtered = editors.filter(e =>
    !search ||
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.skills?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 page-enter">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-cinnabar-500 mb-2">Find your collaborator</p>
          <h1 className="font-display text-5xl md:text-6xl text-ink-900 leading-tight">
            Meet the<br /><span className="italic text-cinnabar-500">editors.</span>
          </h1>
          <p className="text-ink-500 mt-4 max-w-md">
            Handpicked video editors ready to bring your story to life. Browse, connect, and create.
          </p>
        </div>
        {!user && (
          <div className="flex gap-3">
            <Link href="/login" className="px-5 py-2.5 bg-ink-800 text-cream-50 rounded-lg text-sm font-medium hover:bg-ink-700 transition-colors">
              Get started →
            </Link>
          </div>
        )}
      </div>

      <div className="mb-8">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or skill…"
          className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-ink-200 bg-white text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400" />
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="✂️" title="No editors found"
          description={search ? `No results for "${search}"` : 'No approved editors yet.'} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((editor, i) => (
            <div key={editor.id} className="page-enter"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both', opacity: 0 }}>
              <EditorCard editor={editor} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-16 pt-8 border-t border-ink-100 flex gap-8 text-sm text-ink-400">
        <span><strong className="text-ink-700 font-mono">{editors.length}</strong> approved editors</span>
        <span><strong className="text-ink-700 font-mono">Real-time</strong> chat</span>
        <span><strong className="text-ink-700 font-mono">Deal</strong> system</span>
      </div>
    </main>
  )
    }
