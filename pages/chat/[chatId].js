import { useEffect, useState, useRef } from "react";
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
  const { chatId } = router.query;

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [otherName, setOtherName] = useState("Chat");
  const [userRole, setUserRole] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login");
      setUser(u);

      // âœ… CHECK PAYMENT ACCESS (for clients only)
      const editorSnap = await getDoc(doc(db, "editors", u.uid));
      if (editorSnap.exists()) {
        setUserRole("editor");
      } else {
        setUserRole("client");
        const accessSnap = await getDoc(doc(db, "clientAccess", u.uid));
        if (!accessSnap.exists() || accessSnap.data().status !== "approved") {
          alert("ðŸ”’ Pay â‚¹10 to unlock chat");
          router.replace("/client");
          return;
        }
      }

      // âœ… CREATE CHAT DOC IF NOT EXISTS
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        const users = chatId.split("_");
        await setDoc(chatRef, {
          users,
          createdAt: serverTimestamp(),
          lastMessage: "",
          lastUpdated: serverTimestamp(),
        });
      } else {
        // Get other user name
        const data = chatSnap.data();
        const otherUid = data.users?.find((id) => id !== u.uid);
        if (otherUid) {
          try {
            const edSnap = await getDoc(doc(db, "editors", otherUid));
            if (edSnap.exists()) {
              setOtherName(edSnap.data().name || "Editor");
            } else {
              const clSnap = await getDoc(doc(db, "users", otherUid));
              if (clSnap.exists()) setOtherName(clSnap.data().email || "Client");
            }
          } catch (_) {}
        }
      }

      // âœ… REALTIME MESSAGES
      const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("createdAt", "asc")
      );

      const unsubSnap = onSnapshot(q, (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      });

      return () => unsubSnap();
    });

    return () => unsub();
  }, [chatId]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const msg = text;
    setText("");

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: msg,
      sender: user.uid,
      createdAt: serverTimestamp(),
    });

    await setDoc(
      doc(db, "chats", chatId),
      { lastMessage: msg, lastUpdated: serverTimestamp() },
      { merge: true }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // âœ… BACK BUTTON â†’ show confirm modal
  const handleBack = () => setShowExitModal(true);

  const confirmExit = () => {
    setShowExitModal(false);
    if (userRole === "editor") router.push("/editor/inbox");
    else router.push("/client");
  };

  if (loading) {
    return (
      <div style={s.loaderPage}>
        <style>{css}</style>
        <div style={s.spinner}></div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <style>{css}</style>

      {/* âœ… EXIT CONFIRMATION MODAL */}
      {showExitModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ margin: "0 0 10px 0" }}>Leave Chat?</h3>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 20px 0" }}>
              Are you sure you want to go back?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowExitModal(false)} style={s.modalCancel}>
                Stay
              </button>
              <button onClick={confirmExit} style={s.modalConfirm}>
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={s.header}>
        <button onClick={handleBack} style={s.backBtn}>â†</button>
        <div>
          <div style={s.headerName}>{otherName}</div>
          <div style={s.headerSub}>Chat</div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* MESSAGES */}
      <div style={s.chatBox}>
        {messages.map((m) => {
          const isMe = m.sender === user.uid;
          return (
            <div key={m.id} style={{ ...s.msgWrap, justifyContent: isMe ? "flex-end" : "flex-start" }}>
              <div style={{ ...s.msg, background: isMe ? "#7c3aed" : "#1e293b" }}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={s.inputRow}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type message..."
          style={s.input}
        />
        <button onClick={sendMessage} style={s.sendBtn}>Send</button>
      </div>
    </div>
  );
}

const css = `
  body { margin: 0; font-family: sans-serif; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
  },
  loaderPage: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617",
  },
  spinner: {
    width: 30,
    height: 30,
    border: "3px solid #333",
    borderTop: "3px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modal: {
    background: "#1e293b",
    borderRadius: 16,
    padding: 24,
    width: 280,
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  modalCancel: {
    flex: 1,
    padding: "10px 0",
    background: "#334155",
    border: "none",
    color: "white",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },
  modalConfirm: {
    flex: 1,
    padding: "10px 0",
    background: "#7c3aed",
    border: "none",
    color: "white",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: 22,
    cursor: "pointer",
    width: 36,
  },
  headerName: { fontWeight: 700, fontSize: 16, textAlign: "center" },
  headerSub: { color: "#94a3b8", fontSize: 12, textAlign: "center" },
  chatBox: {
    flex: 1,
    padding: "16px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  msgWrap: { display: "flex" },
  msg: {
    padding: "10px 14px",
    borderRadius: 14,
    maxWidth: "72%",
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  input: {
    flex: 1,
    padding: "11px 14px",
    borderRadius: 12,
    border: "none",
    background: "#1e293b",
    color: "white",
    fontSize: 14,
    outline: "none",
  },
  sendBtn: {
    padding: "11px 20px",
    background: "#7c3aed",
    border: "none",
    color: "white",
    borderRadius: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
};