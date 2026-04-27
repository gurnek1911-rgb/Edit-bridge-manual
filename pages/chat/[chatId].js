import { useEffect, useState, useRef } from "react";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function Chat() {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [accessOk, setAccessOk] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { chatId } = router.query;
  const bottomRef = useRef();

  // AUTH + ROLE
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.push("/login");

      setCurrentUser(u);

      if (u.email === "admin@editbridge.com") {
        setRole("admin");
        setAccessOk(true);
        setLoading(false);
        return;
      }

      const editorSnap = await getDoc(doc(db, "editors", u.uid));
      if (editorSnap.exists()) {
        setRole("editor");
        setAccessOk(true);
        setLoading(false);
        return;
      }

      setRole("client");
    });

    return () => unsub();
  }, []);

  // CLIENT ACCESS CHECK
  useEffect(() => {
    if (role !== "client" || !currentUser || !chatId) return;

    (async () => {
      const snap = await getDoc(doc(db, "clientAccess", currentUser.uid));
      if (snap.exists() && snap.data().status === "approved") {
        setAccessOk(true);
      } else {
        alert("⏳ Payment not approved yet");
        router.push("/");
      }
      setLoading(false);
    })();
  }, [role, currentUser, chatId]);

  // LOAD MESSAGES
  useEffect(() => {
    if (!chatId || !accessOk) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      setMsgs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [chatId, accessOk]);

  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: text.trim(),
      user: currentUser.email,
      uid: currentUser.uid,
      createdAt: serverTimestamp(),
    });

    setText("");
  };

  const del = async (id) => {
    await deleteDoc(doc(db, "chats", chatId, "messages", id));
  };

  const clear = async () => {
    if (!confirm("Clear all messages?")) return;
    msgs.forEach((m) => del(m.id));
  };

  if (loading) {
    return (
      <div style={s.center}>
        <div style={s.loader}></div>
      </div>
    );
  }

  if (!accessOk) return null;

  const isMe = (m) => m.uid === currentUser.uid;

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <button onClick={() => router.back()} style={s.back}>←</button>
        <div>
          <div style={s.title}>Deal Chat</div>
          <div style={s.sub}>{msgs.length} messages</div>
        </div>
        <button onClick={clear} style={s.clear}>Clear</button>
      </div>

      {/* CHAT */}
      <div style={s.chat}>
        {msgs.map((m) => (
          <div
            key={m.id}
            style={{
              ...s.row,
              justifyContent: isMe(m) ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                ...s.bubble,
                background: isMe(m)
                  ? "linear-gradient(135deg,#7c3aed,#4f46e5)"
                  : "rgba(255,255,255,0.05)",
              }}
            >
              {!isMe(m) && (
                <div style={s.sender}>{m.user}</div>
              )}

              {m.text}

              <div style={s.time}>
                {m.createdAt?.toDate?.().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            <button onClick={() => del(m.id)} style={s.delete}>
              ×
            </button>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={s.inputWrap}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          style={s.input}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send} style={s.send}>
          ➤
        </button>
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
    color: "white",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    backdropFilter: "blur(10px)",
    background: "rgba(0,0,0,0.4)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  title: { fontWeight: 700 },
  sub: { fontSize: 11, color: "#64748b" },

  back: { background: "none", border: "none", color: "white", fontSize: 18 },
  clear: { fontSize: 12, color: "#ef4444", background: "none", border: "none" },

  chat: {
    flex: 1,
    overflowY: "auto",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  row: { display: "flex", alignItems: "flex-end", gap: 6 },

  bubble: {
    padding: "10px 14px",
    borderRadius: 16,
    maxWidth: "70%",
    fontSize: 14,
  },

  sender: {
    fontSize: 10,
    color: "#94a3b8",
    marginBottom: 4,
  },

  time: {
    fontSize: 9,
    opacity: 0.6,
    marginTop: 4,
    textAlign: "right",
  },

  delete: {
    background: "none",
    border: "none",
    color: "#334155",
    fontSize: 12,
  },

  inputWrap: {
    display: "flex",
    padding: 12,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    border: "none",
    background: "rgba(255,255,255,0.05)",
    color: "white",
  },

  send: {
    marginLeft: 8,
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
    color: "white",
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
    border: "3px solid rgba(255,255,255,0.1)",
    borderTop: "3px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};