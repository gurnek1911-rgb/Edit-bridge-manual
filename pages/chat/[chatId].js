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
  setDoc
} from "firebase/firestore";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef();

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => d.data()));
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [chatId]);

  const send = async () => {
    if (!text.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

    const ids = chatId.split("_");

    // ✅ CREATE / UPDATE CHAT (VERY IMPORTANT)
    await setDoc(doc(db, "chats", chatId), {
      users: ids,
      lastMessage: text,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // ✅ ADD MESSAGE
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      sender: user.uid,
      createdAt: serverTimestamp()
    });

    setText("");
  };

  return (
    <div style={s.page}>
      <div style={s.chat}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              ...s.msg,
              alignSelf:
                m.sender === auth.currentUser?.uid
                  ? "flex-end"
                  : "flex-start",
              background:
                m.sender === auth.currentUser?.uid
                  ? "#6366f1"
                  : "#334155"
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
          onChange={(e) => setText(e.target.value)}
          style={s.input}
          placeholder="Type message..."
        />
        <button onClick={send} style={s.btn}>Send</button>
      </div>
    </div>
  );
}

const s = {
  page: { height: "100vh", display: "flex", flexDirection: "column", background: "#020617" },
  chat: { flex: 1, padding: 10, display: "flex", flexDirection: "column", gap: 8 },
  msg: { padding: 10, borderRadius: 12, color: "white", maxWidth: "70%" },
  inputRow: { display: "flex", padding: 10, gap: 8 },
  input: { flex: 1, padding: 10, borderRadius: 8, border: "none" },
  btn: { background: "#7c3aed", color: "white", border: "none", padding: 10, borderRadius: 8 }
};