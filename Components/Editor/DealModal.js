// components/editor/DealModal.js
import { useState } from 'react'
import { useAuth } from '../../lib/AuthContext'
import { createDeal } from '../../lib/db'
import { Button, Input, Textarea } from '../ui'
import toast from 'react-hot-toast'

export default function DealModal({ open, onClose, editorId, editorName }) {
  const { user } = useAuth()
  const [amount, setAmount]   = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return }
    setLoading(true)
    try {
      createDeal(user.uid, editorId, amount, message)
      toast.success('Deal proposal sent!')
      setAmount('')
      setMessage('')
      onClose()
    } catch {
      toast.error('Failed to send proposal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-ink-100 shadow-xl w-full max-w-md p-6 page-enter">
        <div className="mb-5">
          <p className="text-xs font-mono uppercase tracking-widest text-cinnabar-500 mb-1">Proposal</p>
          <h2 className="font-display text-2xl text-ink-900">Send deal to {editorName}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Offer amount (₹)" type="number" value={amount}
            onChange={e => setAmount(e.target.value)} placeholder="5000" min="1" required />
          <Textarea label="Message (optional)" value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe the project scope, timeline, deliverables…" rows={4} />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Send proposal</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
