import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function Inbox() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login?type=editor");
      setUser(u);

      // ✅ FIX: query using users array-contains instead of editorId field
      const q = query(
        collection(db, "chats"),
        where("users", "array-contains", u.uid)
      );

      return onSnapshot(q, async (snap) => {
        const chatList = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            // Get the client's name from the other user in the chat
            const otherUid = data.users?.find((id) => id !== u.uid);
            let clientName = "Client";
            if (otherUid) {
              try {
                const userSnap = await getDoc(doc(db, "users", otherUid));
                if (userSnap.exists()) clientName = userSnap.data().email || "Client";
              } catch (_) {}
            }
            return { id: d.id, ...data, clientName };
          })
        );
        setChats(chatList);
        setLoading(false);
      });
    });

    return () => unsub();
  }, []);

  const handleBack = () => {
    router.push("/editor");
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

      {/* HEADER */}
      <div style={s.header}>
        <button onClick={handleBack} style={s.backBtn}>← Back</button>
        <h2 style={s.title}>📩 Inbox</h2>
        <div style={{ width: 60 }} />
      </div>

      {chats.length === 0 ? (
        <div style={s.empty}>
          <p>No chats yet.</p>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>Clients will appear here once they message you.</p>
        </div>
      ) : (
        <div style={s.list}>
          {chats.map((c) => (
            <div
              key={c.id}
              style={s.card}
              onClick={() => router.push(`/chat/${c.id}`)}
            >
              <div style={s.avatar}>{c.clientName?.[0]?.toUpperCase() || "C"}</div>
              <div style={s.info}>
                <div style={s.name}>{c.clientName}</div>
                <div style={s.lastMsg}>{c.lastMessage || "No messages yet"}</div>
              </div>
              <div style={s.arrow}>›</div>
            </div>
          ))}
        </div>
      )}
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
    width: 36,
    height: 36,
    border: "3px solid #333",
    borderTop: "3px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: 16,
    cursor: "pointer",
    padding: "6px 10px",
  },
  title: { margin: 0, fontSize: 18, fontWeight: 700 },
  list: { padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  card: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "#1e293b",
    padding: "14px 16px",
    borderRadius: 14,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#7c3aed,#6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 18,
    flexShrink: 0,
  },
  info: { flex: 1 },
  name: { fontWeight: 600, fontSize: 15, marginBottom: 4 },
  lastMsg: { color: "#94a3b8", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  arrow: { color: "#94a3b8", fontSize: 22 },
  empty: {
    textAlign: "center",
    marginTop: 80,
    padding: 20,
  },
};