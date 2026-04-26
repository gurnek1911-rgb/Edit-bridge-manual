import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
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

export default function Chat() {
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

  // Messages realtime
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setMessages(arr);
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

  if (!chatId) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(135deg,#0f172a,#1e1b4b,#581c87)",
      color: "white"
    }}>

      {/* Header */}
      <div style={{
        padding: "18px",
        fontSize: "22px",
        fontWeight: "bold",
        borderBottom: "1px solid rgba(255,255,255,0.1)"
      }}>
        💬 Live Chat
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px"
      }}>
        {loading ? (
          <p>Loading...</p>
        ) : messages.length === 0 ? (
          <p>No messages yet</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user?.uid;

            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: mine ? "flex-end" : "flex-start",
                  marginBottom: "12px"
                }}
              >
                <div style={{
                  maxWidth: "75%",
                  padding: "12px 16px",
                  borderRadius: "18px",
                  background: mine
                    ? "linear-gradient(135deg,#7c3aed,#9333ea)"
                    : "#1e293b"
                }}>
                  <div>{m.text}</div>

                  <div style={{
                    fontSize: "11px",
                    marginTop: "5px",
                    opacity: 0.7
                  }}>
                    {mine ? "You" : m.senderEmail}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* Input */}
      <form
        onSubmit={send}
        style={{
          display: "flex",
          gap: "10px",
          padding: "15px",
          borderTop: "1px solid rgba(255,255,255,0.1)"
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "14px",
            border: "none",
            outline: "none"
          }}
        />

        <button
          type="submit"
          style={{
            padding: "14px 20px",
            border: "none",
            borderRadius: "14px",
            background: "#7c3aed",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}