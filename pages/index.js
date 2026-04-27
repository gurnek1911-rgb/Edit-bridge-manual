import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return <div style={{ color: "white", padding: 40 }}>Loading...</div>;
  }

  return (
    <div style={s.page}>
      <div style={s.nav}>
        <h2>🎬 EditBridge</h2>

        {!user ? (
          <div>
            <button onClick={() => router.push("/login")} style={s.btn}>
              Login
            </button>
          </div>
        ) : (
          <button onClick={() => router.push("/client")} style={s.btn}>
            Dashboard
          </button>
        )}
      </div>

      <div style={s.hero}>
        <h1>Hire Top Video Editors</h1>
        <p>Chat instantly. Work faster. Grow content.</p>

        <button
          onClick={() => router.push(user ? "/client" : "/login")}
          style={s.cta}
        >
          🚀 Get Started
        </button>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white"
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: 20
  },
  hero: {
    textAlign: "center",
    marginTop: 120
  },
  btn: {
    padding: 10,
    background: "#7c3aed",
    color: "white",
    border: "none"
  },
  cta: {
    marginTop: 20,
    padding: 14,
    background: "#6366f1",
    border: "none",
    color: "white"
  }
};