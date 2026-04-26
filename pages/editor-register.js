import { useState } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc
} from "firebase/firestore";

export default function EditorRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [skill, setSkill] = useState("");
  const [price, setPrice] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "editors"), {
        name,
        email,
        skill,
        price,
        approved: false
      });

      alert("Application Submitted");
      setName("");
      setEmail("");
      setSkill("");
      setPrice("");
    } catch (err) {
      alert("Error");
    }
  };

  return (
    <div style={styles.page}>
      <form style={styles.box} onSubmit={submit}>
        <h1>Become an Editor</h1>

        <input
          placeholder="Full Name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Skill (Reels, YouTube etc)"
          value={skill}
          onChange={(e)=>setSkill(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Price"
          value={price}
          onChange={(e)=>setPrice(e.target.value)}
          style={styles.input}
        />

        <button style={styles.btn}>
          Submit
        </button>
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
    background:"rgba(255,255,255,0.08)",
    padding:"30px",
    borderRadius:"18px",
    width:"95%",
    maxWidth:"420px",
    color:"white"
  },

  input:{
    width:"100%",
    padding:"12px",
    marginTop:"12px",
    borderRadius:"10px",
    border:"none"
  },

  btn:{
    width:"100%",
    marginTop:"18px",
    padding:"13px",
    border:"none",
    borderRadius:"10px",
    color:"white",
    fontWeight:"bold",
    background:"linear-gradient(90deg,#7c3aed,#2563eb)"
  }
};