// pages/admin/index.js
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../lib/AuthContext'
import {
  getAllPaymentRequests, updatePaymentRequest, getAllDeals,
  getAllUsers, setEditorApproval, getEditorProfile,
} from '../../lib/db'
import { Button, Badge, Card, Spinner } from '../../components/ui'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const TABS = ['Payment Requests', 'Editors', 'Deals', 'Users']

export default function AdminDashboard() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState(0)
  const [payments, setPayments] = useState([])
  const [deals, setDeals]       = useState([])
  const [users, setUsers]       = useState([])
  const [editors, setEditors]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'admin') router.push('/')
  }, [profile, authLoading])

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return
    const payReqs  = getAllPaymentRequests()
    const dealList = getAllDeals()
    const userList = getAllUsers()
    setPayments(payReqs)
    setDeals(dealList)
    setUsers(userList)
    const editorUsers = userList.filter(u => u.role === 'editor')
    const editorProfiles = editorUsers.map(u => getEditorProfile(u.id)).filter(Boolean)
    setEditors(editorProfiles)
    setLoading(false)
  }, [profile])

  const handlePaymentAction = (req, status) => {
    try {
      updatePaymentRequest(req.id, status, req.userId)
      setPayments(prev => prev.map(p => p.id === req.id ? { ...p, status } : p))
      toast.success(`Payment ${status}`)
    } catch {
      toast.error('Action failed')
    }
  }

  const handleEditorApproval = (editorId, approved) => {
    try {
      setEditorApproval(editorId, approved)
      setEditors(prev => prev.map(e => e.id === editorId ? { ...e, approved } : e))
      toast.success(`Editor ${approved ? 'approved' : 'revoked'}`)
    } catch {
      toast.error('Action failed')
    }
  }

  if (authLoading || loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  const pendingPayments = payments.filter(p => p.status === 'pending').length

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 page-enter">
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-cinnabar-500 mb-2">Dashboard</p>
        <h1 className="font-display text-4xl text-ink-900">Admin Panel</h1>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Users', value: users.length, icon: '👥' },
          { label: 'Editors', value: editors.length, icon: '✂️' },
          { label: 'Pending payments', value: pendingPayments, icon: '⏳' },
          { label: 'Total deals', value: deals.length, icon: '🤝' },
        ].map(stat => (
          <Card key={stat.label} className="p-4">
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className="font-mono text-2xl font-bold text-ink-900">{stat.value}</p>
            <p className="text-xs text-ink-400">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-1 border-b border-ink-100 mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === i ? 'text-ink-900 border-b-2 border-ink-800 -mb-px' : 'text-ink-400 hover:text-ink-700'
            }`}>
            {t}
            {i === 0 && pendingPayments > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-cinnabar-500 text-white text-xs rounded-full">{pendingPayments}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div className="space-y-3">
          {payments.length === 0 ? (
            <p className="text-ink-400 text-sm text-center py-10">No payment requests yet.</p>
          ) : payments.map(req => (
            <Card key={req.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink-800">User: <span className="font-mono text-ink-600">{req.userId}</span></p>
                  <p className="text-sm text-ink-600 mt-0.5">TXN ID: <span className="font-mono">{req.transactionId}</span></p>
                  <p className="text-xs text-ink-400 mt-1">
                    {req.createdAt?.toDate ? formatDistanceToNow(req.createdAt.toDate(), { addSuffix: true }) : 'Unknown time'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={req.status}>{req.status}</Badge>
                  {req.status === 'pending' && (
                    <>
                      <Button size="sm" variant="success" onClick={() => handlePaymentAction(req, 'approved')}>Approve</Button>
                      <Button size="sm" variant="danger" onClick={() => handlePaymentAction(req, 'rejected')}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 1 && (
        <div className="space-y-3">
          {editors.length === 0 ? (
            <p className="text-ink-400 text-sm text-center py-10">No editor profiles yet.</p>
          ) : editors.map(editor => (
            <Card key={editor.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink-800">{editor.name}</p>
                  <p className="text-xs text-ink-400 font-mono">{editor.id}</p>
                  {editor.bio && <p className="text-xs text-ink-500 mt-1 line-clamp-2 max-w-md">{editor.bio}</p>}
                  {editor.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {editor.skills.slice(0, 5).map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-ink-50 text-ink-600 text-xs rounded font-mono">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={editor.approved ? 'approved' : 'pending'}>{editor.approved ? 'Approved' : 'Pending'}</Badge>
                  {editor.approved ? (
                    <Button size="sm" variant="danger" onClick={() => handleEditorApproval(editor.id, false)}>Revoke</Button>
                  ) : (
                    <Button size="sm" variant="success" onClick={() => handleEditorApproval(editor.id, true)}>Approve</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 2 && (
        <div className="space-y-3">
          {deals.length === 0 ? (
            <p className="text-ink-400 text-sm text-center py-10">No deals yet.</p>
          ) : deals.map(deal => (
            <Card key={deal.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink-800">₹<span className="font-mono">{deal.amount}</span></p>
                  <p className="text-xs text-ink-400 font-mono mt-0.5">{deal.clientId} → {deal.editorId}</p>
                  {deal.message && <p className="text-xs text-ink-500 mt-1 max-w-md">{deal.message}</p>}
                </div>
                <Badge variant={deal.status}>{deal.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 3 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left">
                {['Name', 'Email', 'Role', 'Access', 'Credits'].map(h => (
                  <th key={h} className="py-2 pr-4 text-xs font-medium text-ink-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-ink-50 hover:bg-cream-50">
                  <td className="py-3 pr-4 font-medium text-ink-800">{u.name || '—'}</td>
                  <td className="py-3 pr-4 text-ink-500 font-mono text-xs">{u.email}</td>
                  <td className="py-3 pr-4"><Badge variant="default">{u.role}</Badge></td>
                  <td className="py-3 pr-4">
                    <Badge variant={u.user_access === 'unlocked' ? 'unlocked' : 'locked'}>{u.user_access || 'locked'}</Badge>
                  </td>
                  <td className="py-3 pr-4 font-mono text-ink-600">₹{u.user_credit || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
