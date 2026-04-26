"use client";

import { useState } from "react";
import { db, auth } from "../lib/firebase";
import { addDoc, collection } from "firebase/firestore";

export default function Payment() {
  const [txn, setTxn] = useState("");

  const submit = async () => {
    const user = auth.currentUser;

    await addDoc(collection(db, "payments"), {
      txnId: txn,
      status: "pending",
      userId: user.uid
    });

    alert("Submitted for approval");
  };

  return (
    <div style={wrap}>
      <div style={card}>

        <h1>Unlock Credits</h1>
        <p>Send ₹10 to unlock 50 credits</p>

        <div style={upi}>yourupi@okaxis</div>

        <div style={qr}>QR CODE</div>

        <input
          placeholder="Transaction ID"
          onChange={(e)=>setTxn(e.target.value)}
          style={input}
        />

        <button onClick={submit} style={btn}>
          Submit
        </button>

        <div style={rules}>
          <p>• Pay ₹10 for credits</p>
          <p>• Approval in 24 hours</p>
          <p>• Fake payments = ban</p>
        </div>

      </div>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
  color: "white"
};

const card = {
  width: "320px",
  padding: "20px",
  borderRadius: "20px",
  background: "rgba(30,27,75,0.8)",
  backdropFilter: "blur(10px)"
};

const upi = {
  textAlign: "center",
  margin: "10px 0",
  fontWeight: "bold"
};

const qr = {
  height: "120px",
  background: "#111",
  borderRadius: "10px",
  margin: "10px 0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const input = {
  width: "100%",
  padding: "10px",
  borderRadius: "10px",
  border: "none"
};

const btn = {
  width: "100%",
  marginTop: "10px",
  padding: "10px",
  background: "#22c55e",
  borderRadius: "10px",
  border: "none",
  color: "white"
};

const rules = {
  fontSize: "12px",
  marginTop: "10px",
  color: "#cbd5f5"
};