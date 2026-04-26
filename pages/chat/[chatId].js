import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from "firebase/firestore";

export default function ChatPage() {
  const router = useRouter();
  const { chatId } = router.query;

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);

  // Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
      }
    });

    return () => unsub();
  }, [router]);

  // Load messages
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setMessages(data);
      setLoading(false);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({
          behavior: "smooth"
        });
      }, 100);
    });

    return () => unsub();
  }, [chatId]);

  // Send message
  const send = async (e) => {
    e.preventDefault();

    if (!text.trim() || !user) return;

    await addDoc(collection(db, "messages"), {
      chatId,
      text,
      senderId: user.uid,
      senderEmail: user.email,
      createdAt: new Date()
    });

    setText("");
  };

  const logoutBack = () => {
    router.back();
  };

  const isLink = (msg) => {
    return (
      msg.includes("http://") ||
      msg.includes("https://")
    );
  };

  if (!chatId || !user) {
    return (
      <div style={styles.loading}>
        Loading Chat...
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={logoutBack} style={styles.backBtn}>
          ← Back
        </button>

        <div>
          <h2 style={{ margin: 0 }}>💬 Private Chat</h2>
          <p style={styles.sub}>
            Secure messaging + Drive links
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.chatBox}>
        {loading ? (
          <p>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user.uid;

            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: mine
                    ? "flex-end"
                    : "flex-start",
                  marginBottom: "12px"
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    background: mine
                      ? "linear-gradient(135deg,#7c3aed,#9333ea)"
                      : "#1e293b"
                  }}
                >
                  {isLink(m.text) ? (
                    <a
                      href={m.text}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.link}
                    >
                      📎 Open Shared File
                    </a>
                  ) : (
                    <div>{m.text}</div>
                  )}

                  <small style={styles.small}>
                    {mine ? "You" : "Other User"}
                  </small>
                </div>
              </div>
            );
          })
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* Input */}
      <form onSubmit={send} style={styles.form}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message or paste Drive link..."
          style={styles.input}
        />

        <button type="submit" style={styles.sendBtn}>
          Send
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background:
      "linear-gradient(135deg,#0f172a,#1e1b4b,#581c87)",
    color: "white"
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
    color: "white"
  },

  header: {
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    gap: "15px"
  },

  sub: {
    margin: 0,
    fontSize: "13px",
    color: "#cbd5e1"
  },

  backBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#334155",
    color: "white",
    cursor: "pointer"
  },

  chatBox: {
    flex: 1,
    overflowY: "auto",
    padding: "20px"
  },

  bubble: {
    maxWidth: "75%",
    padding: "12px 16px",
    borderRadius: "18px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.25)"
  },

  small: {
    display: "block",
    marginTop: "8px",
    opacity: 0.7,
    fontSize: "11px"
  },

  link: {
    color: "#67e8f9",
    textDecoration: "underline",
    fontWeight: "bold"
  },

  form: {
    display: "flex",
    gap: "10px",
    padding: "16px",
    borderTop: "1px solid rgba(255,255,255,0.1)"
  },

  input: {
    flex: 1,
    padding: "14px",
    borderRadius: "14px",
    border: "none",
    outline: "none",
    fontSize: "15px"
  },

  sendBtn: {
    padding: "14px 20px",
    borderRadius: "14px",
    border: "none",
    background: "#8b5cf6",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer"
  }
};