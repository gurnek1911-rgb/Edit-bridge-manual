import { useState } from "react";
import { useRouter } from "next/router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function AdminLogin() {
  const router = useRouter();

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth,email,password);

      if(email !== "admin@editbridge.com"){
        alert("Not Admin");
        return;
      }

      router.push("/admin");

    } catch(err){
      alert(err.message);
    }
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <h1>🛡️ Admin Login</h1>

        <form onSubmit={submit}>
          <input placeholder="Admin Email" onChange={(e)=>setEmail(e.target.value)} style={input}/>
          <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} style={input}/>
          <button style={btn("#ef4444")}>Login</button>
        </form>
      </div>
    </div>
  );
}

const wrap={minHeight:"100vh",display:"flex",justifyContent:"center",alignItems:"center",background:"#0f172a"};
const card={background:"#111827",padding:"30px",borderRadius:"16px",width:"350px",color:"white"};
const input={width:"100%",padding:"12px",marginTop:"12px",borderRadius:"10px",border:"none"};
const btn=(c)=>({width:"100%",padding:"12px",marginTop:"15px",background:c,color:"white",border:"none",borderRadius:"10px"});