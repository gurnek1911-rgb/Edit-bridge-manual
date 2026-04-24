// pages/editor/profile.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../lib/AuthContext'
import { getEditorProfile, saveEditorProfile } from '../../lib/db'
import { Button, Input, Textarea, Card, Badge, Spinner } from '../../components/ui'
import toast from 'react-hot-toast'

export default function EditorProfileEdit() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', bio: '', skills: '', portfolioLinks: '', pricing: '' })
  const [existingProfile, setExistingProfile] = useState(null)

  useEffect(() => {
    if (!authLoading && (!user || profile?.role !== 'editor')) {
      router.push('/')
    }
  }, [user, profile, authLoading])

  useEffect(() => {
    if (!user) return
    const p = getEditorProfile(user.uid)
    setExistingProfile(p)
    if (p) {
      setForm({
        name: p.name || '',
        bio: p.bio || '',
        skills: (p.skills || []).join(', '),
        portfolioLinks: (p.portfolioLinks || []).join('\n'),
        pricing: p.pricing || '',
      })
    } else {
      setForm(f => ({ ...f, name: profile?.name || '' }))
    }
    setLoading(false)
  }, [user])

  const handleSave = (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      saveEditorProfile(user.uid, {
        name: form.name.trim(),
        bio: form.bio.trim(),
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        portfolioLinks: form.portfolioLinks.split('\n').map(s => s.trim()).filter(Boolean),
        pricing: form.pricing,
      })
      toast.success('Profile saved! Awaiting admin approval if new.')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 page-enter">
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-cinnabar-500 mb-2">Editor</p>
        <h1 className="font-display text-4xl text-ink-900">My Profile</h1>
        <p className="text-ink-500 mt-2 text-sm">
          Fill in your profile — an admin will review and approve it before it goes public.
        </p>
      </div>

      {existingProfile && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-ink-600">Status:</span>
          <Badge variant={existingProfile.approved ? 'approved' : 'pending'}>
            {existingProfile.approved ? 'Approved — Public' : 'Pending admin review'}
          </Badge>
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <Input label="Display name" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Alex Kumar" required />
          <Textarea label="Bio" value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Tell clients about yourself…" rows={5} />
          <Input label="Skills (comma separated)" value={form.skills}
            onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
            placeholder="Premiere Pro, Color Grading, Motion Graphics" />
          <Textarea label="Portfolio links (one per line)" value={form.portfolioLinks}
            onChange={e => setForm(f => ({ ...f, portfolioLinks: e.target.value }))}
            placeholder={"https://youtube.com/watch?v=...\nhttps://vimeo.com/..."} rows={3} />
          <Input label="Starting price (₹)" type="number" value={form.pricing}
            onChange={e => setForm(f => ({ ...f, pricing: e.target.value }))}
            placeholder="5000" min="0" />
          <div className="pt-2">
            <Button type="submit" loading={saving} size="lg">Save profile</Button>
          </div>
        </form>
      </Card>
    </main>
  )
}
