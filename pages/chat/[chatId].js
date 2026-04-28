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
  setDoc,
  updateDoc
} from "firebase/firestore";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUser, setTypingUser] = useState(null);

  const bottomRef = useRef();

  const user = auth.currentUser;

  // 🔄 LOAD CHAT + MESSAGES
  useEffect(() => {
    if (!chatId || !user) return;

    const chatRef = doc(db, "chats", chatId);

    const unsubChat = onSnapshot(chatRef, (snap) => {
      const data = snap.data();
      setTypingUser(data?.typing || null);
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

    // 🔥 UPDATE CHAT (VERY IMPORTANT)
    await setDoc(doc(db, "chats", chatId), {
      lastMessage: text,
      lastUpdated: serverTimestamp(),
      typing: null
    }, { merge: true });

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

  // ⌨️ TYPING
  const handleTyping = async (val) => {
    setText(val);

    await setDoc(doc(db, "chats", chatId), {
      typing: user.uid
    }, { merge: true });

    setTimeout(() => {
      setDoc(doc(db, "chats", chatId), {
        typing: null
      }, { merge: true });
    }, 1000);
  };

  return (
    <div style={s.page}>
      
      {/* CHAT AREA */}
      <div style={s.chat}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              ...s.msg,
              alignSelf: m.sender === user?.uid ? "flex-end" : "flex-start",
              background: m.sender === user?.uid ? "#6366f1" : "#334155"
            }}
          >
            {m.text}

            <div style={s.meta}>
              {m.sender === user?.uid && (m.seen ? "✔✔" : "✔")}
            </div>
          </div>
        ))}

        {/* Typing */}
        {typingUser && typingUser !== user?.uid && (
          <div style={s.typing}>Typing...</div>
        )}

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
        <button onClick={send} style={s.btn}>Send</button>
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
  chat: {
    flex: 1,
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflowY: "auto"
  },
  msg: {
    padding: 10,
    borderRadius: 12,
    maxWidth: "70%",
    fontSize: 14
  },
  meta: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 4,
    textAlign: "right"
  },
  typing: {
    fontSize: 12,
    opacity: 0.7
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
    outline: "none"
  },
  btn: {
    background: "#7c3aed",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: 10
  }
};