"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
  setDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";

const ADMIN_EMAIL = "admin@editbridge.com";

export default function Admin() {
  const router = useRouter();

  const [payments, setPayments] = useState([]);
  const [editors, setEditors] = useState([]);
  const [users, setUsers] = useState([]);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");

  const adminUidRef = useRef(null);
  const unsubChatRef = useRef(null);
  const bottomRef = useRef(null);

  // 🔐 AUTH
  useEffect(() => {
    let unsubPay, unsubEditors, unsubUsers;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");
      if (u.email !== ADMIN_EMAIL) return router.replace("/");

      adminUidRef.current = u.uid;

      unsubPay = onSnapshot(collection(db, "paymentRequests"), (snap) => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      unsubEditors = onSnapshot(collection(db, "editors"), (snap) => {
        setEditors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    });

    return () => {
      unsubAuth();
      unsubPay && unsubPay();
      unsubEditors && unsubEditors();
      unsubUsers && unsubUsers();
      unsubChatRef.current && unsubChatRef.current();
    };
  }, []);

  // 💬 CHAT
  const openChat = async (targetUid, name) => {
    const chatId = [adminUidRef.current, targetUid].sort().join("_");

    const chatRef = doc(db, "chats", chatId);
    const snap = await getDoc(chatRef);

    if (!snap.exists()) {
      await setDoc(chatRef, {
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

  // ✅ APPROVE
  const approvePayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), {
      status: "approved"
    });
  };

  // ❌ DELETE EDITOR
  const deleteEditor = async (id) => {
    if (!confirm("Delete editor?")) return;
    await deleteDoc(doc(db, "editors", id));
  };

  // 🚪 LOGOUT
  const logout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1>⚡ Admin Panel</h1>
        <button onClick={logout} style={s.logout}>Logout</button>
      </div>

      {/* STATS */}
      <div style={s.stats}>
        <div style={s.statCard}>👨‍💻 Editors: {editors.length}</div>
        <div style={s.statCard}>👥 Users: {users.length}</div>
        <div style={s.statCard}>💰 Payments: {payments.length}</div>
      </div>

      {/* PAYMENTS */}
      <h2>💳 Payment Requests</h2>
      {payments.map(p => (
        <div key={p.id} style={s.card}>
          <div>
            <b>{p.email}</b>
            <div>Txn: {p.txnId}</div>
          </div>
          <div style={s.actions}>
            <button onClick={() => approvePayment(p)} style={s.approve}>Approve</button>
            <button onClick={() => openChat(p.uid, p.email)} style={s.chat}>Chat</button>
          </div>
        </div>
      ))}

      {/* EDITORS */}
      <h2>🎬 Editors</h2>
      {editors.map(e => (
        <div key={e.id} style={s.card}>
          <div>{e.name || e.email}</div>
          <button onClick={() => deleteEditor(e.id)} style={s.delete}>Delete</button>
        </div>
      ))}

      {/* CHAT */}
      {chatOpen && (
        <div style={s.chatBox}>
          <div>{chatTarget?.name}</div>

          <div style={s.chatBody}>
            {messages.map(m => (
              <div key={m.id}>{m.text}</div>
            ))}
            <div ref={bottomRef}/>
          </div>

          <input value={msgText} onChange={(e)=>setMsgText(e.target.value)} />
          <button onClick={sendMsg}>Send</button>
        </div>
      )}
    </div>
  );
}

const s = {
  page:{
    minHeight:"100vh",
    padding:20,
    background:"linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color:"white"
  },
  header:{display:"flex",justifyContent:"space-between",marginBottom:20},
  logout:{background:"#ef4444",padding:8,border:"none",borderRadius:8,color:"white"},
  stats:{display:"flex",gap:10,marginBottom:20},
  statCard:{background:"#1e293b",padding:10,borderRadius:10},
  card:{background:"#1e293b",padding:14,marginTop:10,borderRadius:12,display:"flex",justifyContent:"space-between"},
  actions:{display:"flex",gap:10},
  approve:{background:"#22c55e",border:"none",padding:6,borderRadius:6},
  chat:{background:"#7c3aed",border:"none",padding:6,borderRadius:6},
  delete:{background:"#ef4444",border:"none",padding:6,borderRadius:6},
  chatBox:{position:"fixed",bottom:0,right:0,width:300,background:"#111"},
  chatBody:{height:200,overflowY:"auto"}
};