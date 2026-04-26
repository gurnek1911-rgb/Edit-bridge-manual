"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import { useRouter } from "next/router";

export default function Chat() {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const router = useRouter();

  const room = router.query.room;

  // 🔐 CREDIT CHECK (runs once)
  useEffect(() => {
    const run = async () => {
      if (!auth.currentUser) return;

      const ref = doc(db, "users", auth.currentUser.uid);

      try {
        await runTransaction(db, async (t) => {
          const snap = await t.get(ref);

          if (!snap.exists()) throw "User missing";

          let credits = snap.data().credits || 0;

          if (credits < 10) {
            router.push("/payment");
            throw "No credits";
          }

          t.update(ref, { credits: credits - 10 });
        });
      } catch (err) {
        console.log(err);
      }
    };

    if (room) run();
  }, [room]);

  // 📡 LOAD CHAT (real-time)
  useEffect(() => {
    if (!room) return;

    const q = query(
      collection(db, "chats", room, "messages"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      setMsgs(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    });
  }, [room]);

  const send = async () => {
    if (!text || !auth.currentUser) return;

    await addDoc(collection(db, "chats", room, "messages"), {
      text,
      user: auth.currentUser.email,
      createdAt: serverTimestamp()
    });

    setText("");
  };

  const del = async (id) => {
    await deleteDoc(doc(db, "chats", room, "messages", id));
  };

  const clear = async () => {
    if (!confirm("Clear chat?")) return;

    msgs.forEach(m => del(m.id));
  };

  return (
    <div style={wrap}>

      <h1>💬 Private Chat</h1>

      <button onClick={clear} style={clearBtn}>
        Clear Chat
      </button>

      <div style={chatBox}>
        {msgs.map(m => (
          <div key={m.id} style={msgRow}>
            <span>
              <b>{m.user}</b>: {m.text}
            </span>
            <button onClick={()=>del(m.id)} style={delBtn}>❌</button>
          </div>
        ))}
      </div>

      <input
        value={text}
        onChange={e=>setText(e.target.value)}
        style={input}
        placeholder="Type message..."
      />

      <button onClick={send} style={sendBtn}>
        Send
      </button>

    </div>
  );
}

/* UI */
const wrap = {
  minHeight: "100vh",
  padding: "20px",
  background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
  color: "white"
};

const chatBox = {
  height: "350px",
  overflow: "auto",
  background: "#111",
  padding: "10px",
  borderRadius: "12px",
  marginTop: "10px"
};

const msgRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
  background: "#1e1b4b",
  padding: "8px",
  borderRadius: "8px"
};

const delBtn = {
  background: "transparent",
  border: "none",
  color: "#ef4444",
  cursor: "pointer"
};

const clearBtn = {
  background: "#ef4444",
  padding: "8px",
  borderRadius: "8px",
  border: "none",
  color: "white",
  cursor: "pointer"
};

const input = {
  width: "100%",
  marginTop: "10px",
  padding: "10px",
  borderRadius: "10px",
  border: "none"
};

const sendBtn = {
  width: "100%",
  marginTop: "10px",
  padding: "10px",
  background: "#6366f1",
  border: "none",
  borderRadius: "10px",
  color: "white",
  cursor: "pointer"
};