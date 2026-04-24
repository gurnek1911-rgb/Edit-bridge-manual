import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { getAuth } from "firebase/auth";
import { app } from "../../firebase";
import {
  getFirestore,
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

  const auth = getAuth(app);
  const db = getFirestore(app);

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");

  const bottomRef = useRef(null);

  // 🔐 Check login
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
      }
    });

    return () => unsubscribe();
  }, []);

  // 📡 Load messages (REAL-TIME)
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("createdAt")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMessages(msgs);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [chatId]);

  // 📤 Send message
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!msg.trim() || !user) return;

    try {
      await addDoc(collection(db, "messages"), {
        chatId: chatId,
        text: msg,
        senderId: user.uid,
        createdAt: new Date()
      });

      setMsg("");
    } catch (err) {
      alert(err.message);
    }
  };

  if (!chatId) return <p style={{ textAlign: "center" }}>Loading...</p>;

  return (
    <div style={{
      background: "#0f0f0f",
      color: "white",
      minHeight: "100vh",
      padding: "10px"
    }}>
      <h2>Private Chat</h2>

      {/* Messages */}
      <div style={{ height: "70vh", overflowY: "auto" }}>
        {messages.map((m) => (
          <div key={m.id} style={{
            textAlign: m.senderId === user?.uid ? "right" : "left",
            margin: "10px"
          }}>
            <p style={{
              display: "inline-block",
              padding: "10px",
              background: m.senderId === user?.uid ? "#333" : "#222",
              borderRadius: "10px"
            }}>
              {m.text}
            </p>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </div>

      {/* Input */}
      <form onSubmit={sendMessage}>
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Type message..."
          style={{ width: "80%", padding: "10px" }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}