"use client";

import { useState } from "react";
import { db, auth } from "../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function Payment() {
  const [txn, setTxn] = useState("");

  const submit = async () => {
    const user = auth.currentUser;

    await addDoc(collection(db, "payments"), {
      txnId: txn,
      status: "pending",
      userId: user.uid,
      amount: 10,
      createdAt: serverTimestamp()
    });

    alert("Payment submitted");
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <h1>💳 Unlock Credits</h1>

        <p>Send ₹10 → Get 50 credits</p>

        <div style={upi}>yourupi@okaxis</div>

        <input
          placeholder="Enter Transaction ID"
          onChange={(e)=>setTxn(e.target.value)}
          style={input}
        />

        <button onClick={submit} style={btn}>Submit</button>
      </div>
    </div>
  );
}

/* UI */
const wrap = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg,#020617,#4c1d95)"
};

const card = {
  padding: "25px",
  borderRadius: "20px",
  background: "rgba(30,27,75,0.8)",
  color: "white",
  width: "300px"
};

const input = {
  width: "100%",
  padding: "10px",
  marginTop: "10px",
  borderRadius: "10px"
};

const btn = {
  marginTop: "10px",
  width: "100%",
  padding: "10px",
  background: "#22c55e",
  borderRadius: "10px"
};

const upi = {
  marginTop: "10px",
  fontWeight: "bold"
};