import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";

export default function EditorInbox() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.push("/editor-login");

      setUser(u);

      // 🔥 REAL-TIME CHAT LISTENER
      const q = query(
        collection(db, "chats"),
        orderBy("lastUpdated", "desc")
      );

      return onSnapshot(q, async (snap) => {
        const list = [];

        for (let d of snap.docs) {
          const data = d.data();

          // Only include chats where editor is involved
          if (!data.users?.includes(u.uid)) continue;

          let otherUser = data.users.find((id) => id !== u.uid);

          let name = "Unknown";
          let email = "";

          // Try get client info
          try {
            const clientSnap = await getDoc(doc(db, "users", otherUser));
            if (clientSnap.exists()) {
              name = clientSnap.data().name || "Client";
              email = clientSnap.data().email || "";
            }
          } catch {}

          list.push({
            id: d.id,
            lastMessage: data.lastMessage || "No messages yet",
            name,
            email,
            updated: data.lastUpdated,
          });
        }

        setChats(list);
        setLoading(false);
      });
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div style={s.center}>
        <div style={s.loader}></div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={() => router.back()} style={s.back}>←</button>
        <h2 style={s.title}>Inbox</h2>
      </div>

      {chats.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 40 }}>📭</div>
          <p>No chats yet</p>
        </div>
      ) : (
        chats.map((c) => (
          <div
            key={c.id}
            style={s.card}
            onClick={() => router.push(`/chat/${c.id}`)}
          >
            <div style={s.avatar}>
              {(c.name?.[0] || "C").toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <div style={s.name}>{c.name}</div>
              <div style={s.msg}>{c.lastMessage}</div>
            </div>

            <div style={s.time}>
              {c.updated?.toDate?.().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 16,
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: 800,
  },

  back: {
    background: "none",
    border: "none",
    color: "white",
    fontSize: 18,
  },

  card: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    background: "rgba(255,255,255,0.05)",
    marginBottom: 10,
    cursor: "pointer",
    transition: "0.2s",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },

  name: {
    fontWeight: 700,
    fontSize: 14,
  },

  msg: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 3,
  },

  time: {
    fontSize: 10,
    color: "#64748b",
  },

  empty: {
    textAlign: "center",
    marginTop: 80,
    color: "#64748b",
  },

  center: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  loader: {
    width: 28,
    height: 28,
    border: "3px solid rgba(255,255,255,0.1)",
    borderTop: "3px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};