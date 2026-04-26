import { useRouter } from "next/router";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Login() {
  const router = useRouter();
  const { type } = router.query;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      // 🔥 Redirect based on login type (NOT homepage)
      if (type === "client") {
        router.push("/client");
      } else if (type === "editor") {
        router.push("/editor");
      } else if (type === "admin") {
        router.push("/admin");
      } else {
        router.push("/client"); // fallback
      }

    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <h1>Login</h1>

        <input placeholder="Email" onChange={(e)=>setEmail(e.target.value)} style={input}/>
        <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} style={input}/>

        <button onClick={login} style={btn}>Login</button>
      </div>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg,#0f172a,#4c1d95)",
};

const card = {
  background: "#1e1b4b",
  padding: "30px",
  borderRadius: "20px",
  width: "320px",
  color: "white",
};

const input = {
  width: "100%",
  padding: "12px",
  marginTop: "12px",
  borderRadius: "10px",
  border: "none",
};

const btn = {
  width: "100%",
  padding: "12px",
  marginTop: "15px",
  background: "#06b6d4",
  color: "white",
  border: "none",
  borderRadius: "10px",
};