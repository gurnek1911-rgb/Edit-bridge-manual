import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const signup = async () => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    // save role as client
    await setDoc(doc(db, "users", userCred.user.uid), {
      role: "client"
    });

    router.push("/client");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Signup</h1>

      <input placeholder="Email" onChange={(e)=>setEmail(e.target.value)} /><br/>
      <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} /><br/>

      <button onClick={signup}>Create Account</button>
    </div>
  );
}