import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Editor() {
  const router = useRouter();

  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login?type=editor");

      const snap = await getDoc(doc(db, "editors", u.uid));

      if (!snap.exists()) {
        alert("Editor not found");
        return router.replace("/");
      }

      const data = snap.data();

      if (!data.approved) {
        alert("Wait for admin approval");
        return router.replace("/");
      }

      setEditor({ uid: u.uid, ...data });
      setPortfolio(data.portfolio || "");
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const savePortfolio = async () => {
    await updateDoc(doc(db, "editors", editor.uid), {
      portfolio
    });

    alert("Portfolio Updated ✅");
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) return <div style={s.center}>Loading...</div>;

  return (
    <div style={s.page}>
      <h1>🎬 Editor Dashboard</h1>

      <div style={s.card}>
        <h2>{editor.name}</h2>
        <p>{editor.email}</p>
        <p>Skills: {editor.skills?.join(", ")}</p>
        <p>₹{editor.price}</p>
      </div>

      {/* PORTFOLIO */}
      <div style={s.card}>
        <h3>Portfolio Video Link</h3>
        <input
          value={portfolio}
          onChange={(e) => setPortfolio(e.target.value)}
          placeholder="Paste Google Drive video link"
          style={s.input}
        />

        {portfolio && (
          <video src={portfolio} controls style={{ width: "100%", marginTop: 10 }} />
        )}

        <button style={s.btn} onClick={savePortfolio}>
          Save Portfolio
        </button>
      </div>

      <button style={s.chat} onClick={() => router.push("/editor/inbox")}>
        📩 Inbox
      </button>

      <button style={s.logout} onClick={logout}>
        Logout
      </button>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", padding: 20, background: "#020617", color: "white" },
  card: { padding: 20, background: "#111827", marginTop: 20, borderRadius: 12 },
  input: { width: "100%", padding: 10, marginTop: 10 },
  btn: { marginTop: 10, padding: 10, background: "#22c55e", border: "none", color: "white" },
  chat: { marginTop: 20, padding: 12, background: "#7c3aed", color: "white" },
  logout: { marginTop: 10, padding: 12, background: "#ef4444", color: "white" },
  center: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }
};