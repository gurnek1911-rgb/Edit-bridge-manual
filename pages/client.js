import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function Client() {
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ✅ FIX: Added auth check — no more stuck unauthenticated landing
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login?type=client");
        return;
      }

      try {
        const snap = await getDocs(collection(db, "editors"));
        const list = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((e) => e.approved && e.active); // Only show approved + active editors
        setEditors(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div style={s.centerPage}>
        <div style={s.spinner}></div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <h1 style={s.heading}>🔥 Find an Editor</h1>
        <button
          style={s.logoutBtn}
          onClick={() => {
            auth.signOut();
            router.replace("/");
          }}
        >
          Logout
        </button>
      </div>

      {editors.length === 0 && (
        <p style={s.empty}>No editors available right now.</p>
      )}

      {editors.map((e) => (
        <div key={e.id} style={s.card}>
          <div>
            <h2 style={s.name}>{e.name}</h2>
            <p style={s.detail}>{e.skills?.join(", ")}</p>
            <p style={s.price}>₹{e.price}</p>
          </div>

          <button
            style={s.chatBtn}
            onClick={() => router.push(`/chat/${e.id}`)}
          >
            💬 Chat (🔒 ₹10)
          </button>
        </div>
      ))}
    </div>
  );
}

const s = {
  page: {
    padding: 20,
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
    minHeight: "100vh",
  },
  centerPage: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #333",
    borderTop: "4px solid #8b5cf6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  heading: { fontSize: 22, fontWeight: 800, margin: 0 },
  logoutBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: 8,
    cursor: "pointer",
  },
  card: {
    background: "#1e293b",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  name: { fontSize: 18, fontWeight: 700, margin: "0 0 4px 0" },
  detail: { color: "#94a3b8", fontSize: 13, margin: "0 0 4px 0" },
  price: { color: "#a78bfa", fontWeight: 600, margin: 0 },
  chatBtn: {
    padding: "10px 16px",
    background: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  empty: { color: "#94a3b8", textAlign: "center", marginTop: 40 },
};