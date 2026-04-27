import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";

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

  // ✅ ROLE BASED DASHBOARD REDIRECT
  const goDashboard = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        alert("User data missing");
        return;
      }

      const role = snap.data().role;

      if (role === "editor") {
        router.push("/editor");
      } else if (role === "client") {
        router.push("/client");
      } else if (role === "admin") {
        router.push("/admin");
      } else {
        alert("Invalid role");
      }

    } catch (err) {
      alert(err.message);
    }
  };

  // ✅ LOGOUT
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    router.push("/");
  };

  if (loading) {
    return (
      <div style={s.loader}>
        <div style={s.spinner}></div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* NAVBAR */}
      <div style={s.nav}>
        <div style={s.logo}>🎬 EditBridge</div>

        {!user ? (
          <div style={s.navBtns}>
            <button
              onClick={() => router.push("/login?type=client")}
              style={s.btn}
            >
              Client
            </button>

            <button
              onClick={() => router.push("/login?type=editor")}
              style={s.btnPrimary}
            >
              Editor
            </button>

            <button
              onClick={() => router.push("/admin-login")}
              style={s.adminBtn}
            >
              Admin
            </button>
          </div>
        ) : (
          <div style={s.navBtns}>
            <button onClick={goDashboard} style={s.btnPrimary}>
              Dashboard
            </button>

            <button onClick={handleLogout} style={s.logout}>
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

        <button onClick={goDashboard} style={s.cta}>
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
    background: "#020617"
  },

  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #333",
    borderTop: "4px solid #8b5cf6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },

  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: 20,
    alignItems: "center"
  },

  logo: {
    fontWeight: 800,
    fontSize: 18
  },

  navBtns: {
    display: "flex",
    gap: 10
  },

  btn: {
    background: "transparent",
    border: "1px solid #444",
    color: "white",
    padding: "8px 12px",
    borderRadius: 8
  },

  btnPrimary: {
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    border: "none",
    color: "white",
    padding: "8px 12px",
    borderRadius: 8,
    fontWeight: 600
  },

  adminBtn: {
    background: "#ef4444",
    border: "none",
    color: "white",
    padding: "8px 12px",
    borderRadius: 8
  },

  logout: {
    background: "#dc2626",
    border: "none",
    color: "white",
    padding: "8px 12px",
    borderRadius: 8
  },

  hero: {
    textAlign: "center",
    marginTop: 120,
    padding: 20
  },

  title: {
    fontSize: 42,
    fontWeight: 800
  },

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
    borderRadius: 10,
    fontWeight: 600
  }
};