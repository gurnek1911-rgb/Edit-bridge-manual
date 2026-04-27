import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

export default function ChatPage() {
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔥 AUTH + PAYMENT LOCK
  useEffect(() => {
    if (!id) return;

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login");

      setUser(u);

      // 🔒 CHECK PAYMENT ACCESS
      const accessSnap = await getDoc(doc(db, "clientAccess", u.uid));

      if (!accessSnap.exists() || accessSnap.data().status !== "approved") {
        alert("🔒 Pay ₹10 to unlock chat");
        router.replace("/client");
        return;
      }

      // ✅ CREATE CHAT IF NOT EXISTS
      const chatRef = doc(db, "chats", id);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        const users = id.split("_"); // clientId_editorId

        await setDoc(chatRef, {
          users,
          createdAt: serverTimestamp(),
          lastMessage: "",
          lastUpdated: serverTimestamp(),
        });
      }

      // 🔥 REALTIME MESSAGES
      const q = query(
        collection(db, "chats", id, "messages"),
        orderBy("createdAt", "asc")
      );

      return onSnapshot(q, (snap) => {
        setMessages(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
        setLoading(false);
      });
    });

    return () => unsub();
  }, [id]);

  // 🔥 SEND MESSAGE
  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", id, "messages"), {
      text,
      sender: user.uid,
      createdAt: serverTimestamp(),
    });

    // update last message
    await setDoc(
      doc(db, "chats", id),
      {
        lastMessage: text,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );

    setText("");
  };

  if (loading) {
    return (
      <div style={s.center}>
        <div style={s.loader}></div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <button onClick={() => router.back()} style={s.back}>
          ←
        </button>
        <h2>Chat</h2>
      </div>

      {/* MESSAGES */}
      <div style={s.chatBox}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              ...s.msg,
              alignSelf:
                m.sender === user.uid ? "flex-end" : "flex-start",
              background:
                m.sender === user.uid ? "#7c3aed" : "#1e293b",
            }}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div style={s.inputRow}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          style={s.input}
        />
        <button onClick={sendMessage} style={s.send}>
          Send
        </button>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 15,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },

  back: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: 18,
  },

  chatBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 15,
    overflowY: "auto",
  },

  msg: {
    padding: "10px 14px",
    borderRadius: 12,
    maxWidth: "70%",
    fontSize: 14,
  },

  inputRow: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: "none",
    outline: "none",
  },

  send: {
    marginLeft: 8,
    padding: "10px 16px",
    background: "#7c3aed",
    border: "none",
    color: "white",
    borderRadius: 10,
  },

  center: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  loader: {
    width: 30,
    height: 30,
    border: "3px solid #333",
    borderTop: "3px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};