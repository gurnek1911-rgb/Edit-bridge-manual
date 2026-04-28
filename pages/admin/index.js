"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
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
  const [editors, setEditors] = useState([]);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");

  const adminUidRef = useRef(null);
  const unsubChatRef = useRef(null);
  const bottomRef = useRef(null);

  // 🔐 AUTH
  useEffect(() => {
    let unsubPay, unsubEditors;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");
      if (u.email !== ADMIN_EMAIL) return router.replace("/");

      adminUidRef.current = u.uid;

      // 📥 PAYMENTS
      unsubPay = onSnapshot(collection(db, "paymentRequests"), (snap) => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      // 👨‍💻 EDITORS
      unsubEditors = onSnapshot(collection(db, "editors"), (snap) => {
        setEditors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    });

    return () => {
      unsubAuth();
      unsubPay && unsubPay();
      unsubEditors && unsubEditors();
      unsubChatRef.current && unsubChatRef.current();
    };
  }, []);

  // 💬 OPEN CHAT
  const openChat = async (targetUid, name) => {
    const chatId = [adminUidRef.current, targetUid].sort().join("_");

    const chatRef = doc(db, "chats", chatId);
    const snap = await getDoc(chatRef);

    if (!snap.exists()) {
      await setDoc(chatRef, {
        users: [adminUidRef.current, targetUid],
        userNames: {
          [adminUidRef.current]: "Admin",
          [targetUid]: name || "User"
        },
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

  // ✉️ SEND MESSAGE
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

  // ✅ APPROVE PAYMENT
  const approvePayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), {
      status: "approved"
    });

    await setDoc(doc(db, "clientAccess", p.uid + "_" + p.editorId), {
      uid: p.uid,
      editorId: p.editorId,
      status: "approved",
      chatId: p.chatId
    });
  };

  // ❌ DELETE EDITOR
  const deleteEditor = async (id) => {
    if (!confirm("Delete this editor?")) return;
    await deleteDoc(doc(db, "editors", id));
  };

  return (
    <div style={s.page}>
      
      {/* HEADER */}
      <div style={s.header}>
        <h1 style={s.title}>⚡ Admin Dashboard</h1>
        <button onClick={() => signOut(auth)} style={s.logout}>
          Logout
        </button>
      </div>

      {/* PAYMENTS */}
      <div style={s.section}>
        <h2>💰 Payment Requests</h2>

        {payments.map(p => (
          <div key={p.id} style={s.card}>
            <div>
              <b>{p.email}</b>
              <div>Txn: {p.txnId}</div>
            </div>

            <div style={s.actions}>
              <button onClick={() => approvePayment(p)} style={s.approve}>
                Approve
              </button>
              <button onClick={() => openChat(p.uid, p.email)} style={s.chatBtn}>
                Chat
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDITORS */}
      <div style={s.section}>
        <h2>🎬 Editors</h2>

        {editors.map(e => (
          <div key={e.id} style={s.card}>
            <div>
              <b>{e.name || "No name"}</b>
              <div>{e.email}</div>
            </div>

            <div style={s.actions}>
              <button onClick={() => openChat(e.id, e.name)} style={s.chatBtn}>
                Chat
              </button>
              <button onClick={() => deleteEditor(e.id)} style={s.delete}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CHAT BOX */}
      {chatOpen && (
        <div style={s.chatBox}>
          <div style={s.chatHeader}>
            {chatTarget?.name}
            <button onClick={() => setChatOpen(false)}>X</button>
          </div>

          <div style={s.chatBody}>
            {messages.map(m => (
              <div
                key={m.id}
                style={{
                  textAlign: m.sender === adminUidRef.current ? "right" : "left",
                  marginBottom: 6
                }}
              >
                <span style={s.msg}>{m.text}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={s.chatInput}>
            <input
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder="Type message..."
              style={s.input}
            />
            <button onClick={sendMsg} style={s.send}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    color: "white",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },

  title: { fontSize: 24 },

  logout: {
    background: "#ef4444",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    color: "white"
  },

  section: { marginBottom: 30 },

  card: {
    background: "rgba(30,41,59,0.6)",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    display: "flex",
    justifyContent: "space-between"
  },

  actions: { display: "flex", gap: 8 },

  approve: {
    background: "#22c55e",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    color: "white"
  },

  chatBtn: {
    background: "#3b82f6",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    color: "white"
  },

  delete: {
    background: "#ef4444",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    color: "white"
  },

  chatBox: {
    position: "fixed",
    bottom: 10,
    right: 10,
    width: 320,
    background: "#111",
    borderRadius: 10
  },

  chatHeader: {
    padding: 10,
    borderBottom: "1px solid #333",
    display: "flex",
    justifyContent: "space-between"
  },

  chatBody: {
    height: 220,
    overflowY: "auto",
    padding: 10
  },

  msg: {
    background: "#7c3aed",
    padding: "6px 10px",
    borderRadius: 8,
    display: "inline-block"
  },

  chatInput: {
    display: "flex",
    padding: 8,
    gap: 6
  },

  input: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    border: "none"
  },

  send: {
    background: "#7c3aed",
    border: "none",
    padding: "8px 10px",
    borderRadius: 6,
    color: "white"
  }
};