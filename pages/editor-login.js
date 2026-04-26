import { useState } from "react";
import { useRouter } from "next/router";
import {
  signInWithEmailAndPassword
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function EditorLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginEditor = async (e) => {
    e.preventDefault();

    try {
      const userCred = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCred.user;

      const ref = doc(db, "editors", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        alert("Editor profile not found");
        return;
      }

      const data = snap.data();

      if (!data.approved) {
        alert("Waiting for admin approval");
        return;
      }

      router.push("/editor");

    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{
      minHeight:"100vh",
      display:"flex",
      justifyContent:"center",
      alignItems:"center",
      background:"linear-gradient(135deg,#0f172a,#581c87)",
      color:"white"
    }}>
      <form onSubmit={loginEditor}
      style={{
        width:"350px",
        padding:"30px",
        background:"rgba(255,255,255,0.05)",
        borderRadius:"20px",
        backdropFilter:"blur(12px)"
      }}>
        <h1>🎬 Editor Login</h1>

        <input
          placeholder="Email"
          onChange={(e)=>setEmail(e.target.value)}
          style={input}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e)=>setPassword(e.target.value)}
          style={input}
        />

        <button style={btn}>
          Login as Editor
        </button>
      </form>
    </div>
  );
}

const input = {
  width:"100%",
  padding:"12px",
  marginTop:"12px",
  borderRadius:"10px",
  border:"none"
};

const btn = {
  width:"100%",
  padding:"12px",
  marginTop:"18px",
  border:"none",
  borderRadius:"10px",
  background:"#7c3aed",
  color:"white",
  fontWeight:"bold"
};