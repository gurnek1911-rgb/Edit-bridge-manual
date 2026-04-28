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
import { onAuthStateChanged } from "firebase/auth";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const bottomRef = useRef();

  // AUTH FIX
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

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

  const send = async () => {
    if (!text.trim() || !user) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: user.uid,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: text,
      lastUpdated: serverTimestamp()
    });

    setText("");
  };

  if (!user || !chatId) {
    return <div style={{color:"white",textAlign:"center",marginTop:50}}>Loading chat...</div>;
  }

  return (
    <div style={s.page}>
      <div style={s.chat}>
        {messages.map(m => (
          <div key={m.id} style={{
            ...s.msg,
            alignSelf: m.sender === user.uid ? "flex-end" : "flex-start"
          }}>
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={s.inputRow}>
        <input value={text} onChange={(e)=>setText(e.target.value)} />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}

const s = {
  page: { height: "100vh", display: "flex", flexDirection: "column", background: "#020617", color: "white" },
  chat: { flex: 1, padding: 10, display: "flex", flexDirection: "column", gap: 8 },
  msg: { padding: 10, background: "#1e293b", borderRadius: 10, maxWidth: "70%" },
  inputRow: { display: "flex", padding: 10 }
};