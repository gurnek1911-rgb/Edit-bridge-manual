// pages/payment.js
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/AuthContext'
import { submitPaymentRequest, unlockWithCredit } from '../lib/db'
import { Button, Input, Card, Badge } from '../components/ui'
import toast from 'react-hot-toast'

export default function PaymentPage() {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()
  const [txnId, setTxnId]   = useState('')
  const [loading, setLoading] = useState(false)
  const [creditLoading, setCreditLoading] = useState(false)

  if (!user) {
    router.push('/login')
    return null
  }

  const alreadyUnlocked = profile?.user_access === 'unlocked'
  const credits = profile?.user_credit || 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!txnId.trim()) { toast.error('Enter transaction ID'); return }
    setLoading(true)
    try {
      submitPaymentRequest(user.uid, txnId.trim())
      toast.success('Request submitted! Admin will approve shortly.')
      setTxnId('')
    } catch {
      toast.error('Failed to submit request')
    } finally {
      setLoading(false)
    }
  }

  const handleUseCredit = () => {
    if (credits < 10) { toast.error('Insufficient credits'); return }
    setCreditLoading(true)
    try {
      unlockWithCredit(user.uid)
      refreshProfile()
      toast.success('Chat unlocked using credits!')
    } catch (err) {
      toast.error(err.message || 'Failed to use credits')
    } finally {
      setCreditLoading(false)
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-12 page-enter">
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-cinnabar-500 mb-2">Access</p>
        <h1 className="font-display text-4xl text-ink-900">Unlock Chat</h1>
        <p className="text-ink-500 mt-2 text-sm">
          One-time payment unlocks direct messaging with any editor on EditBridge.
        </p>
      </div>

      <Card className="p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ink-700">Chat access</p>
          <p className="text-xs text-ink-400 mt-0.5">Your current status</p>
        </div>
        <Badge variant={alreadyUnlocked ? 'unlocked' : 'locked'}>
          {alreadyUnlocked ? '🔓 Unlocked' : '🔒 Locked'}
        </Badge>
      </Card>

      {alreadyUnlocked ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
          <p className="text-2xl mb-2">🎉</p>
          <p className="font-medium text-emerald-800">Chat is already unlocked!</p>
          <p className="text-sm text-emerald-600 mt-1">You can message any editor.</p>
          <button onClick={() => router.push('/')} className="mt-4 text-sm text-emerald-700 underline">
            Browse editors →
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {credits >= 10 && (
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-ink-800">Use your credits</h3>
                  <p className="text-sm text-ink-500 mt-1">
                    You have <strong className="font-mono text-ink-700">₹{credits}</strong> credits.
                    Spend ₹10 to instantly unlock chat.
                  </p>
                </div>
                <Button onClick={handleUseCredit} loading={creditLoading} variant="success" size="sm">
                  Use ₹10
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-medium text-ink-800 mb-1">Pay via UPI</h3>
            <p className="text-sm text-ink-500 mb-4">
              Send <strong>₹99</strong> to UPI ID <span className="font-mono text-ink-700">editbridge@upi</span>,
              then submit your transaction ID below for admin verification.
            </p>
            <div className="bg-ink-50 rounded-lg p-6 text-center mb-4 border border-dashed border-ink-200">
              <div className="text-3xl mb-2">📱</div>
              <p className="font-mono text-sm text-ink-600">editbridge@upi</p>
              <p className="text-xs text-ink-400 mt-1">Amount: ₹99</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="UPI Transaction ID" value={txnId} onChange={e => setTxnId(e.target.value)}
                placeholder="e.g. 123456789012" required />
              <Button type="submit" loading={loading} className="w-full">Submit for verification</Button>
            </form>
          </Card>

          <p className="text-xs text-ink-400 text-center">
            Admin approves from the Admin Dashboard. After approval your access updates instantly.
          </p>
        </div>
      )}
    </main>
  )
}
