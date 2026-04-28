import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc
} from "firebase/firestore";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [chat, setChat] = useState(null);

  const bottomRef = useRef();
  const user = auth.currentUser;

  // 🔄 LOAD CHAT + MESSAGES
  useEffect(() => {
    if (!chatId || !user) return;

    const chatRef = doc(db, "chats", chatId);

    const unsubChat = onSnapshot(chatRef, (snap) => {
      setChat(snap.data());
    });

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    const unsubMsg = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(list);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => {
      unsubChat();
      unsubMsg();
    };
  }, [chatId, user]);

  // 💬 SEND MESSAGE
  const send = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: user.uid,
      seen: false,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: text,
      lastUpdated: serverTimestamp(),
      [`seen.${user.uid}`]: true,
      [`typing.${user.uid}`]: false
    });

    setText("");
  };

  // 👁️ SEEN SYSTEM
  useEffect(() => {
    if (!chatId || !user) return;

    messages.forEach(async (m) => {
      if (!m.seen && m.sender !== user.uid) {
        await updateDoc(doc(db, "chats", chatId, "messages", m.id), {
          seen: true
        });
      }
    });
  }, [messages]);

  // ⌨️ TYPING SYSTEM (REAL)
  const handleTyping = async (val) => {
    setText(val);

    await updateDoc(doc(db, "chats", chatId), {
      [`typing.${user.uid}`]: true
    });

    setTimeout(() => {
      updateDoc(doc(db, "chats", chatId), {
        [`typing.${user.uid}`]: false
      });
    }, 1000);
  };

  const otherTyping = chat?.typing &&
    Object.entries(chat.typing).find(
      ([uid, val]) => uid !== user?.uid && val
    );

  // 💰 DEAL ACTIONS
  const acceptDeal = async () => {
    await updateDoc(doc(db, "chats", chatId), {
      "deal.status": "accepted"
    });
  };

  const counterDeal = async () => {
    const price = prompt("Enter counter offer:");
    if (!price) return;

    await updateDoc(doc(db, "chats", chatId), {
      "deal.price": Number(price),
      "deal.status": "pending",
      "deal.lastActionBy": user.uid
    });
  };

  return (
    <div style={s.page}>

      {/* HEADER */}
      <div style={s.header}>
        <button onClick={() => router.back()} style={s.back}>←</button>
        <div>
          <div style={s.name}>Chat</div>
          {otherTyping && <div style={s.typing}>typing...</div>}
        </div>
      </div>

      {/* DEAL BOX */}
      {chat?.deal && (
        <div style={s.dealBox}>
          <div>💰 ₹{chat.deal.price}</div>
          <div>Status: {chat.deal.status}</div>

          {chat.deal.status !== "accepted" && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={acceptDeal} style={s.accept}>Accept</button>
              <button onClick={counterDeal} style={s.counter}>Counter</button>
            </div>
          )}
        </div>
      )}

      {/* CHAT */}
      <div style={s.chat}>
        {messages.map((m) => {
          const isMe = m.sender === user?.uid;

          return (
            <div
              key={m.id}
              style={{
                ...s.msg,
                alignSelf: isMe ? "flex-end" : "flex-start",
                background: isMe ? "#6366f1" : "#1e293b"
              }}
            >
              {m.text}

              <div style={s.meta}>
                {isMe && (m.seen ? "✔✔" : "✔")}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={s.inputRow}>
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type message..."
          style={s.input}
        />
        <button onClick={send} style={s.btn}>➤</button>
      </div>
    </div>
  );
}

const s = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white"
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderBottom: "1px solid rgba(255,255,255,0.1)"
  },

  back: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: 18
  },

  name: { fontWeight: 600 },
  typing: { fontSize: 12, color: "#94a3b8" },

  dealBox: {
    margin: 10,
    padding: 12,
    borderRadius: 12,
    background: "rgba(124,58,237,0.2)",
    border: "1px solid rgba(124,58,237,0.4)"
  },

  accept: {
    background: "#22c55e",
    border: "none",
    padding: "6px 10px",
    borderRadius: 8,
    color: "white"
  },

  counter: {
    background: "#f59e0b",
    border: "none",
    padding: "6px 10px",
    borderRadius: 8,
    color: "white"
  },

  chat: {
    flex: 1,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflowY: "auto"
  },

  msg: {
    padding: 10,
    borderRadius: 14,
    maxWidth: "70%",
    fontSize: 14
  },

  meta: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 4,
    textAlign: "right"
  },

  inputRow: {
    display: "flex",
    gap: 6,
    padding: 10,
    borderTop: "1px solid rgba(255,255,255,0.1)"
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: "none",
    outline: "none",
    background: "#0f172a",
    color: "white"
  },

  btn: {
    background: "#7c3aed",
    border: "none",
    padding: "10px 14px",
    borderRadius: 10,
    color: "white"
  }
};