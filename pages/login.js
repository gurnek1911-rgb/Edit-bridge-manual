import { useRouter } from "next/router";
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import HomeButton from "../components/HomeButton";

export default function Login() {
  const router = useRouter();
  const { type } = router.query;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const role = type === "editor" ? "editor" : "client";

  // ✅ LOGIN
  const login = async () => {
    if (!email || !password) return alert("Enter all fields");

    setLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      if (role === "editor") {
        const snap = await getDoc(doc(db, "editors", uid));

        if (!snap.exists()) {
          alert("Editor profile not found. Create account first.");
          setLoading(false);
          return;
        }

        if (!snap.data().approved) {
          alert("Waiting for admin approval");
          setLoading(false);
          return;
        }

        router.push("/editor");
      } else {
        router.push("/client");
      }

    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  // ✅ SIGNUP
  const signup = async () => {
    if (!email || !password) return alert("Enter all fields");

    setLoading(true);

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      if (role === "editor") {
        // 🔥 CREATE EDITOR DOC (IMPORTANT)
        await setDoc(doc(db, "editors", uid), {
          email,
          name: "New Editor",
          skills: [],
          price: 0,
          approved: false,
          active: false,
          createdAt: new Date()
        });

        alert("Editor account created. Wait for admin approval.");

      } else {
        await setDoc(doc(db, "users", uid), {
          email,
          role: "client",
          createdAt: new Date()
        });

        router.push("/client");
      }

    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  return (
    <div style={s.page}>
      <HomeButton />

      <div style={s.card}>
        <h1 style={s.title}>
          {role === "editor" ? "🎬 Editor Login" : "🚀 Client Login"}
        </h1>

        <input
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          style={s.input}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          style={s.input}
        />

        <button onClick={login} style={s.btn} disabled={loading}>
          {loading ? "Loading..." : "Login"}
        </button>

        <button onClick={signup} style={s.signup} disabled={loading}>
          Create Account
        </button>

        <p style={s.switch}>
          {role === "editor" ? "Client?" : "Editor?"}{" "}
          <span
            style={s.link}
            onClick={() =>
              router.push(role === "editor" ? "/login" : "/login?type=editor")
            }
          >
            Switch
          </span>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "radial-gradient(circle at top,#020617,#0f172a,#4c1d95)",
    color: "white"
  },

  card: {
    width: 350,
    padding: 30,
    borderRadius: 20,
    background: "rgba(30,27,75,0.6)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 0 40px rgba(124,58,237,0.2)"
  },

  title: {
    marginBottom: 15,
    fontSize: 22,
    fontWeight: 800
  },

  input: {
    width: "100%",
    padding: 12,
    marginTop: 10,
    borderRadius: 10,
    border: "none",
    outline: "none",
    background: "rgba(255,255,255,0.08)",
    color: "white"
  },

  btn: {
    width: "100%",
    padding: 12,
    marginTop: 15,
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "white",
    fontWeight: 700
  },

  signup: {
    width: "100%",
    padding: 12,
    marginTop: 10,
    borderRadius: 10,
    border: "none",
    background: "#22c55e",
    color: "white",
    fontWeight: 700
  },

  switch: {
    marginTop: 15,
    fontSize: 12,
    color: "#94a3b8"
  },

  link: {
    color: "#a78bfa",
    cursor: "pointer",
    fontWeight: 700
  }
};