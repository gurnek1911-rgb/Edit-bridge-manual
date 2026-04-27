import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(u);

      try {
        const snap = await getDoc(doc(db, "users", u.uid));

        if (snap.exists()) {
          setRole(snap.data().role);
        }
      } catch (err) {
        console.log(err);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    location.reload();
  };

  if (loading) return <div style={s.loader}>Loading...</div>;

  return (
    <div style={s.page}>
      {/* NAV */}
      <div style={s.nav}>
        <div style={s.logo}>🎬 EditBridge</div>

        {!user ? (
          <div style={s.navBtns}>
            <button onClick={() => router.push("/login?type=client")} style={s.btn}>
              Client
            </button>

            <button onClick={() => router.push("/login?type=editor")} style={s.btnPrimary}>
              Editor
            </button>

            <button onClick={() => router.push("/admin-login")} style={s.adminBtn}>
              Admin
            </button>
          </div>
        ) : (
          <div style={s.navBtns}>
            <button
              onClick={() =>
                router.push(role === "editor" ? "/editor" : "/client")
              }
              style={s.btnPrimary}
            >
              Dashboard
            </button>

            <button onClick={logout} style={s.adminBtn}>
              Logout
            </button>
          </div>
        )}
      </div>

      {/* HERO */}
      <div style={s.hero}>
        <h1 style={s.title}>
          Work with <span style={s.gradient}>Top Editors</span>
        </h1>

        <p style={s.subtitle}>
          Chat instantly, hire fast, and scale your content production.
        </p>

        <button
          onClick={() =>
            router.push(user ? (role === "editor" ? "/editor" : "/client") : "/login")
          }
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
  loader: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617",
    color: "white"
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: 20
  },
  logo: { fontWeight: 800 },
  navBtns: { display: "flex", gap: 10 },

  btn: {
    background: "transparent",
    border: "1px solid #444",
    color: "white",
    padding: 8,
    borderRadius: 8
  },

  btnPrimary: {
    background: "#7c3aed",
    border: "none",
    color: "white",
    padding: 8,
    borderRadius: 8
  },

  adminBtn: {
    background: "#ef4444",
    border: "none",
    color: "white",
    padding: 8,
    borderRadius: 8
  },

  hero: {
    textAlign: "center",
    marginTop: 120
  },

  title: { fontSize: 42, fontWeight: 800 },

  gradient: {
    background: "linear-gradient(135deg,#a78bfa,#60a5fa)",
    WebkitBackgroundClip: "text",
    color: "transparent"
  },

  subtitle: {
    marginTop: 12,
    color: "#94a3b8"
  },

  cta: {
    marginTop: 20,
    padding: 14,
    background: "#6366f1",
    border: "none",
    color: "white",
    borderRadius: 10
  }
};