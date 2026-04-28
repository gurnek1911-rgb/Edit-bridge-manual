"use client";

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
import { onAuthStateChanged } from "firebase/auth";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const bottomRef = useRef();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // 🔥 LOAD MESSAGES
  useEffect(() => {
    if (!chatId || !user) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => unsub();
  }, [chatId, user]);

  // 🔥 SEND MESSAGE
  const send = async () => {
    if (!text.trim() || !user) return;

    const chatRef = doc(db, "chats", chatId);

    // ✅ ensure chat exists
    await setDoc(chatRef, {
      users: chatId.split("_"),
      createdAt: serverTimestamp(),
      lastMessage: text,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: user.uid,
      createdAt: serverTimestamp()
    });

    await updateDoc(chatRef, {
      lastMessage: text,
      lastUpdated: serverTimestamp()
    });

    setText("");
  };

  if (!user || !chatId) {
    return <div style={{color:"white",textAlign:"center",marginTop:50}}>Loading...</div>;
  }

  return (
    <div style={s.page}>
      <div style={s.chat}>
        {messages.map(m => (
          <div
            key={m.id}
            style={{
              ...s.msg,
              alignSelf: m.sender === user.uid ? "flex-end" : "flex-start"
            }}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={s.inputRow}>
        <input
          value={text}
          onChange={(e)=>setText(e.target.value)}
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
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  msg: {
    padding: 12,
    background: "#1e293b",
    borderRadius: 12,
    maxWidth: "70%"
  },
  inputRow: {
    display: "flex",
    padding: 10,
    gap: 8
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: "none"
  },
  btn: {
    background: "#7c3aed",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: 10
  }
};