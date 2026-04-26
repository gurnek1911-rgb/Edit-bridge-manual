import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function EditorRegister() {
  const router = useRouter();

  const [form, setForm] = useState({
    name:"",
    email:"",
    password:"",
    skill:"",
    price:"",
    photo:"",
    driveLink:"",
    dutyStart:"",
    dutyEnd:""
  });

  const submit = async (e) => {
    e.preventDefault();

    try {
      const user = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      await setDoc(doc(db,"editors",user.user.uid),{
        ...form,
        active:true,
        approved:false,
        role:"editor"
      });

      alert("Editor account created. Wait for admin approval.");
      router.push("/login");

    } catch(err){
      alert(err.message);
    }
  };

  return (
    <div style={styles.page}>
      <form style={styles.box} onSubmit={submit}>
        <h1>Become Editor</h1>

        <input placeholder="Name"
          onChange={(e)=>setForm({...form,name:e.target.value})}
          style={styles.input}
        />

        <input placeholder="Email"
          onChange={(e)=>setForm({...form,email:e.target.value})}
          style={styles.input}
        />

        <input type="password" placeholder="Password"
          onChange={(e)=>setForm({...form,password:e.target.value})}
          style={styles.input}
        />

        <input placeholder="Skill"
          onChange={(e)=>setForm({...form,skill:e.target.value})}
          style={styles.input}
        />

        <input placeholder="Price"
          onChange={(e)=>setForm({...form,price:e.target.value})}
          style={styles.input}
        />

        <input placeholder="Profile Photo URL"
          onChange={(e)=>setForm({...form,photo:e.target.value})}
          style={styles.input}
        />

        <input placeholder="Google Drive Portfolio Link"
          onChange={(e)=>setForm({...form,driveLink:e.target.value})}
          style={styles.input}
        />

        <input placeholder="Duty Start Time"
          onChange={(e)=>setForm({...form,dutyStart:e.target.value})}
          style={styles.input}
        />

        <input placeholder="Duty End Time"
          onChange={(e)=>setForm({...form,dutyEnd:e.target.value})}
          style={styles.input}
        />

        <button style={styles.btn}>Create Account</button>
      </form>
    </div>
  );
}

const styles = {
page:{
minHeight:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center",
background:"linear-gradient(135deg,#111827,#312e81,#581c87)"
},
box:{
width:"95%",
maxWidth:"450px",
padding:"30px",
borderRadius:"20px",
background:"rgba(255,255,255,0.08)",
color:"white"
},
input:{
width:"100%",
padding:"12px",
marginTop:"10px",
borderRadius:"10px",
border:"none"
},
btn:{
width:"100%",
padding:"13px",
marginTop:"18px",
border:"none",
borderRadius:"10px",
background:"linear-gradient(90deg,#7c3aed,#2563eb)",
color:"white",
fontWeight:"bold"
}
};