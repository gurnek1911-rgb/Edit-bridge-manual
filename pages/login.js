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

  const login = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", userCred.user.uid));

      const role = snap.data()?.role;

      if (role === "editor") router.push("/editor");
      else router.push("/client");
    } catch (err) {
      alert(err.message);
    }
  };

  const signup = async () => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      const role = type === "editor" ? "editor" : "client";

      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        role
      });

      router.push(role === "editor" ? "/editor" : "/client");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={wrap}>
      <HomeButton />

      <div style={card}>
        <h1>🚀 Login</h1>

        <input placeholder="Email" onChange={(e)=>setEmail(e.target.value)} style={input}/>
        <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} style={input}/>

        <button onClick={login} style={btn}>Login</button>
        <button onClick={signup} style={signupBtn}>Create Account</button>
      </div>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "radial-gradient(circle,#020617,#0f172a,#4c1d95)"
};

const card = {
  padding: 30,
  borderRadius: 20,
  background: "rgba(30,27,75,0.7)",
  backdropFilter: "blur(15px)",
  color: "white"
};

const input = { width: "100%", padding: 12, marginTop: 10 };
const btn = { marginTop: 10, padding: 12, background: "#6366f1", color: "white" };
const signupBtn = { marginTop: 10, padding: 12, background: "#22c55e", color: "white" };