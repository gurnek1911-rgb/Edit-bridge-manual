// pages/chat.js
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/AuthContext'
import {
  getChatsForUser, subscribeToMessages, sendMessage,
  getOrCreateChat, getUser, getDealsForUser, updateDealStatus,
} from '../lib/db'
import { Button, Badge, Spinner, EmptyState } from '../components/ui'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function ChatPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()
  const router = useRouter()
  const chatIdFromQuery = router.query.chatId

  const [chats, setChats]           = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [messages, setMessages]     = useState([])
  const [newMsg, setNewMsg]         = useState('')
  const [sending, setSending]       = useState(false)
  const [chatUsers, setChatUsers]   = useState({})
  const [deals, setDeals]           = useState([])
  const [loadingChats, setLoadingChats] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    if (profile?.user_access !== 'unlocked') {
      toast.error('Unlock chat access first')
      router.push('/payment')
    }
  }, [user, profile, authLoading])

  useEffect(() => {
    if (!user || !profile) return
    const chatList = getChatsForUser(user.uid, profile.role)
    setChats(chatList)
    const uids = chatList.map(c => profile.role === 'client' ? c.editorId : c.clientId)
    const names = {}
    uids.forEach(uid => {
      const u = getUser(uid)
      if (u) names[uid] = u.name || u.email
    })
    setChatUsers(names)
    setLoadingChats(false)
  }, [user, profile])

  useEffect(() => {
    if (chatIdFromQuery) setActiveChatId(chatIdFromQuery)
  }, [chatIdFromQuery])

  useEffect(() => {
    if (!activeChatId) return
    const unsub = subscribeToMessages(activeChatId, msgs => {
      setMessages(msgs)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    })
    return unsub
  }, [activeChatId])

  useEffect(() => {
    if (!user || !profile) return
    setDeals(getDealsForUser(user.uid, profile.role))
  }, [user, profile, activeChatId])

  const handleSend = (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !activeChatId) return
    setSending(true)
    try {
      sendMessage(activeChatId, user.uid, newMsg.trim())
      setNewMsg('')
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleDealAction = (dealId, status, clientId) => {
    try {
      updateDealStatus(dealId, status, clientId)
      toast.success(`Deal ${status}!`)
      setDeals(getDealsForUser(user.uid, profile.role))
      refreshProfile()
    } catch {
      toast.error('Failed to update deal')
    }
  }

  if (authLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>

  const activeChat = chats.find(c => c.id === activeChatId)
  const otherUserId = activeChat
    ? (profile?.role === 'client' ? activeChat.editorId : activeChat.clientId)
    : null
  const chatDeals = deals.filter(d =>
    activeChat && d.clientId === activeChat.clientId && d.editorId === activeChat.editorId
  )

  return (
    <div className="h-[calc(100vh-56px)] flex bg-cream-100">
      {/* Sidebar */}
      <div className="w-64 border-r border-ink-100 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-ink-100">
          <p className="font-display text-lg text-ink-900">Messages</p>
        </div>
        <div className="overflow-y-auto flex-1">
          {loadingChats ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-xs text-ink-400 text-center">
              No conversations yet.<br />
              <Link href="/" className="text-cinnabar-500 hover:underline">Browse editors →</Link>
            </div>
          ) : (
            chats.map(chat => {
              const otherId = profile?.role === 'client' ? chat.editorId : chat.clientId
              const otherName = chatUsers[otherId] || 'Unknown'
              const isActive = chat.id === activeChatId
              return (
                <button key={chat.id} onClick={() => setActiveChatId(chat.id)}
                  className={`w-full text-left p-4 border-b border-ink-50 transition-colors ${
                    isActive ? 'bg-ink-50 border-l-2 border-l-cinnabar-500' : 'hover:bg-cream-50'
                  }`}>
                  <div className="w-8 h-8 rounded-full bg-ink-200 flex items-center justify-center text-xs font-bold text-ink-700 mb-1">
                    {otherName[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-ink-800 truncate">{otherName}</p>
                  <p className="text-xs text-ink-400">{profile?.role === 'client' ? 'Editor' : 'Client'}</p>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeChatId ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon="💬" title="Select a conversation"
              description="Choose a chat from the left to start messaging" />
          </div>
        ) : (
          <>
            <div className="h-14 border-b border-ink-100 bg-white px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-ink-200 flex items-center justify-center text-xs font-bold text-ink-700">
                  {(chatUsers[otherUserId] || '?')[0]?.toUpperCase()}
                </div>
                <p className="font-medium text-ink-800">{chatUsers[otherUserId] || '…'}</p>
              </div>
              <Badge variant={profile?.user_access === 'unlocked' ? 'unlocked' : 'locked'}>
                {profile?.user_access === 'unlocked' ? '🔓 Active' : '🔒 Locked'}
              </Badge>
            </div>

            {chatDeals.filter(d => d.status === 'pending').map(deal => (
              <div key={deal.id} className="mx-4 mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      🤝 Deal proposal — <strong>₹{deal.amount}</strong>
                    </p>
                    {deal.message && <p className="text-xs text-amber-700 mt-1">{deal.message}</p>}
                  </div>
                  {profile?.role === 'editor' ? (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="success" onClick={() => handleDealAction(deal.id, 'accepted', deal.clientId)}>Accept</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDealAction(deal.id, 'rejected', deal.clientId)}>Reject</Button>
                    </div>
                  ) : (
                    <Badge variant="pending">Awaiting response</Badge>
                  )}
                </div>
              </div>
            ))}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-ink-400 text-sm">No messages yet. Say hello! 👋</div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.senderId === user?.uid
                  const time = msg.timestamp?.toDate
                    ? formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true }) : ''
                  return (
                    <div key={msg.id} className={`flex bubble-enter ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        isMine ? 'bg-ink-800 text-cream-50 rounded-br-sm'
                               : 'bg-white border border-ink-100 text-ink-800 rounded-bl-sm'
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-xs mt-1 ${isMine ? 'text-ink-400' : 'text-ink-300'}`}>{time}</p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-ink-100 bg-white flex gap-3">
              <input type="text" value={newMsg} onChange={e => setNewMsg(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 px-4 py-2.5 rounded-xl border border-ink-200 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-400 bg-white" />
              <Button type="submit" loading={sending} disabled={!newMsg.trim()}>Send</Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
