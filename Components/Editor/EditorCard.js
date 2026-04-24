// components/editor/EditorCard.js
import Link from 'next/link'
import { Card, Badge } from '../ui'

export default function EditorCard({ editor }) {
  const { id, name, bio, skills = [], pricing } = editor

  // Generate a deterministic avatar color from name
  const colors = ['bg-amber-200', 'bg-rose-200', 'bg-sky-200', 'bg-violet-200', 'bg-emerald-200']
  const colorIdx = (name?.charCodeAt(0) || 0) % colors.length
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'

  return (
    <Link href={`/editor/${id}`}>
      <Card hover className="p-5 h-full flex flex-col gap-4">
        {/* Avatar + name */}
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl ${colors[colorIdx]} flex items-center justify-center text-sm font-display font-bold text-ink-700 shrink-0`}>
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg text-ink-900 truncate">{name}</h3>
            {pricing && (
              <p className="text-xs font-mono text-cinnabar-500">₹{pricing}/project</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-sm text-ink-500 line-clamp-3 flex-1">{bio}</p>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {skills.slice(0, 4).map(skill => (
              <span
                key={skill}
                className="px-2 py-0.5 bg-ink-50 border border-ink-100 rounded-md text-xs text-ink-600 font-mono"
              >
                {skill}
              </span>
            ))}
            {skills.length > 4 && (
              <span className="px-2 py-0.5 text-xs text-ink-400">+{skills.length - 4}</span>
            )}
          </div>
        )}
      </Card>
    </Link>
  )
}
