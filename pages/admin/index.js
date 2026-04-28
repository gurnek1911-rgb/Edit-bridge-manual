"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  updateDoc,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  getDoc
} from "firebase/firestore";

const ADMIN_EMAIL = "admin@editbridge.com";

export default function Admin() {
  const router = useRouter();

  const [payments, setPayments] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");

  const adminUidRef = useRef(null);
  const unsubChatRef = useRef(null);
  const bottomRef = useRef(null);

  // AUTH
  useEffect(() => {
    let unsubPay;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");
      if (u.email !== ADMIN_EMAIL) return router.replace("/");

      adminUidRef.current = u.uid;

      unsubPay = onSnapshot(collection(db, "paymentRequests"), (snap) => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    });

    return () => {
      unsubAuth();
      unsubPay && unsubPay();
      unsubChatRef.current && unsubChatRef.current();
    };
  }, []);

  // 🔥 APPROVE (FULL FIX)
  const approvePayment = async (p) => {
    const chatId = [p.uid, p.editorId].sort().join("_");

    await updateDoc(doc(db, "paymentRequests", p.id), {
      status: "approved"
    });

    await setDoc(doc(db, "clientAccess", p.uid + "_" + p.editorId), {
      uid: p.uid,
      editorId: p.editorId,
      status: "approved",
      chatId
    });

    // FORCE CHAT CREATION
    await setDoc(doc(db, "chats", chatId), {
      users: [p.uid, p.editorId],
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastUpdated: serverTimestamp()
    }, { merge: true });
  };

  // 💬 OPEN CHAT
  const openChat = async (targetUid, name) => {
    const chatId = [adminUidRef.current, targetUid].sort().join("_");

    const ref = doc(db, "chats", chatId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        users: [adminUidRef.current, targetUid],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastUpdated: serverTimestamp()
      });
    }

    setChatTarget({ chatId, name });
    setChatOpen(true);

    if (unsubChatRef.current) unsubChatRef.current();

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    unsubChatRef.current = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  };

  const sendMsg = async () => {
    if (!msgText.trim()) return;

    await addDoc(collection(db, "chats", chatTarget.chatId, "messages"), {
      text: msgText,
      sender: adminUidRef.current,
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, "chats", chatTarget.chatId), {
      lastMessage: msgText,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    setMsgText("");
  };

  return (
    <div style={s.page}>
      <h1>🔥 Admin Panel</h1>

      {payments.map(p => (
        <div key={p.id} style={s.card}>
          <div>
            <b>{p.email}</b>
            <div style={{opacity:0.7}}>Txn: {p.txnId}</div>
          </div>

          <div style={s.actions}>
            {p.status === "pending" && (
              <button onClick={() => approvePayment(p)} style={s.green}>
                Approve
              </button>
            )}

            <button onClick={() => openChat(p.uid, p.email)} style={s.purple}>
              Chat
            </button>
          </div>
        </div>
      ))}

      {/* CHAT PANEL */}
      {chatOpen && (
        <div style={s.chat}>
          <div style={s.chatHeader}>
            {chatTarget?.name}
            <button onClick={() => setChatOpen(false)}>X</button>
          </div>

          <div style={s.chatBody}>
            {messages.map(m => {
              const isMe = m.sender === adminUidRef.current;
              return (
                <div key={m.id} style={{
                  ...s.msg,
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  background: isMe ? "#7c3aed" : "#334155"
                }}>
                  {m.text}
                </div>
              );
            })}
            <div ref={bottomRef}/>
          </div>

          <div style={s.chatInput}>
            <input
              value={msgText}
              onChange={(e)=>setMsgText(e.target.value)}
              placeholder="Type message..."
            />
            <button onClick={sendMsg}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:{padding:20,color:"white",background:"linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",minHeight:"100vh"},
  card:{display:"flex",justifyContent:"space-between",padding:15,background:"#1e293b",marginTop:10,borderRadius:12},
  actions:{display:"flex",gap:10},
  green:{background:"#22c55e",border:"none",padding:8,color:"white",borderRadius:8},
  purple:{background:"#7c3aed",border:"none",padding:8,color:"white",borderRadius:8},

  chat:{position:"fixed",bottom:0,right:0,width:320,height:420,background:"#0f172a",display:"flex",flexDirection:"column"},
  chatHeader:{padding:10,display:"flex",justifyContent:"space-between"},
  chatBody:{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:8},
  msg:{padding:8,borderRadius:10,maxWidth:"70%"},
  chatInput:{display:"flex",gap:5,padding:10}
};