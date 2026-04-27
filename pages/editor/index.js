import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function Editor() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/editor-login");
        return;
      }

      setUser(u);

      // ✅ MUST match UID
      const ref = doc(db, "editors", u.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.log("❌ Editor doc not found");
        router.replace("/editor-login");
        return;
      }

      setEditor(snap.data());
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push("/");
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
        <button onClick={() => router.push("/")} style={s.home}>
          🏠 Home
        </button>

        <button onClick={logout} style={s.logout}>
          Logout
        </button>
      </div>

      <h1 style={s.title}>🎬 Editor Dashboard</h1>

      <div style={s.card}>
        <h2>{editor.name}</h2>
        <p>{user.email}</p>
        <p>Skills: {editor.skills?.join(", ")}</p>
        <p>Price: ₹{editor.price}</p>
        <p>Status: {editor.active ? "🟢 Online" : "🔴 Offline"}</p>
      </div>

      <div style={s.grid}>
        <button style={btn("#8b5cf6")} onClick={() => router.push("/editor/inbox")}>
          📩 Inbox
        </button>

        <button style={btn("#06b6d4")} onClick={() => router.push("/profile")}>
          ⚙️ Settings
        </button>

        <button style={btn("#10b981")} onClick={() => router.push(`/chat/admin_${user.uid}`)}>
          💬 Chat Admin
        </button>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
  },
  home: { background: "#334155", color: "white", padding: 8 },
  logout: { background: "#ef4444", color: "white", padding: 8 },
  title: { marginTop: 20 },
  card: {
    marginTop: 20,
    padding: 20,
    borderRadius: 14,
    background: "rgba(255,255,255,0.05)",
  },
  grid: {
    display: "grid",
    gap: 12,
    marginTop: 25,
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

function btn(bg) {
  return {
    padding: 14,
    border: "none",
    borderRadius: 10,
    background: bg,
    color: "white",
    fontWeight: "bold",
  };
}