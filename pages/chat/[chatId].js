import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function Chat() {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { chatId } = router.query;
  const bottomRef = useRef();

  // AUTH
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // LOAD MESSAGES REALTIME
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      setMsgs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [chatId]);

  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // SEND MESSAGE (🔥 IMPORTANT FIX)
  const send = async () => {
    if (!text.trim()) return;

    const messageData = {
      text: text.trim(),
      uid: user.uid,
      user: user.email,
      createdAt: serverTimestamp(),
    };

    // 1. Add message
    await addDoc(collection(db, "chats", chatId, "messages"), messageData);

    // 2. UPDATE CHAT DOC (THIS FIXES INBOX + LAST MESSAGE)
    await setDoc(
      doc(db, "chats", chatId),
      {
        lastMessage: text.trim(),
        lastMessageAt: serverTimestamp(),
        lastSender: user.email,
        participants: chatId.split("_"),
      },
      { merge: true }
    );

    setText("");
  };

  const del = async (id) => {
    await deleteDoc(doc(db, "chats", chatId, "messages", id));
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  const isMe = (m) => m.uid === user.uid;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={() => router.back()} style={s.back}>←</button>
        <div>Chat</div>
      </div>

      <div style={s.chat}>
        {msgs.map((m) => (
          <div
            key={m.id}
            style={{
              ...s.row,
              justifyContent: isMe(m) ? "flex-end" : "flex-start",
            }}
          >
            <div style={{
              ...s.bubble,
              background: isMe(m) ? "#7c3aed" : "#1e293b",
            }}>
              {!isMe(m) && <div style={s.sender}>{m.user}</div>}
              {m.text}
            </div>

            <button onClick={() => del(m.id)} style={s.delete}>×</button>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={s.inputWrap}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          style={s.input}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send} style={s.send}>Send</button>
      </div>
    </div>
  );
}

const s = {
  page: { height: "100vh", display: "flex", flexDirection: "column", background: "#020617", color: "white" },
  header: { padding: 12, borderBottom: "1px solid #222", display: "flex", gap: 10 },
  back: { background: "none", border: "none", color: "white" },
  chat: { flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 },
  row: { display: "flex", gap: 6 },
  bubble: { padding: 10, borderRadius: 12, maxWidth: "70%" },
  sender: { fontSize: 10, opacity: 0.6 },
  delete: { background: "none", border: "none", color: "#555" },
  inputWrap: { display: "flex", padding: 10, borderTop: "1px solid #222" },
  input: { flex: 1, padding: 10, borderRadius: 10, border: "none", background: "#111", color: "white" },
  send: { marginLeft: 6, padding: "10px 14px", background: "#7c3aed", border: "none", color: "white", borderRadius: 10 },
};