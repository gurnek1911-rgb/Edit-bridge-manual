"use client";

import { useState } from "react";
import { db, auth } from "../lib/firebase";
import { addDoc, collection } from "firebase/firestore";

export default function Payment() {
  const [txn, setTxn] = useState("");

  const submit = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("Login first");
      return;
    }

    await addDoc(collection(db, "payments"), {
      txnId: txn,
      status: "pending",
      userId: user.uid,
    });

    alert("Payment submitted. Wait for admin approval.");
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={title}>Unlock Chat Access</h1>

        <p style={sub}>
          Pay ₹10 to unlock chat with editors
        </p>

        {/* 🔥 UPI ID */}
        <div style={upiBox}>
          <p>UPI ID:</p>
          <b style={{ fontSize: "18px" }}>yourupi@okaxis</b>
        </div>

        {/* 🔳 QR Placeholder */}
        <div style={qrBox}>
          <p>QR CODE</p>
        </div>

        {/* 🧾 TXN INPUT */}
        <input
          placeholder="Enter Transaction ID"
          onChange={(e) => setTxn(e.target.value)}
          style={input}
        />

        <button onClick={submit} style={btn}>
          Submit Payment
        </button>

        {/* 📜 RULES */}
        <div style={rules}>
          <h3>Rules</h3>
          <ul>
            <li>You must send ₹10 to unlock chat</li>
            <li>Enter correct transaction ID</li>
            <li>Access will be granted within 24 hours</li>
            <li>Fake payments will result in ban</li>
          </ul>
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
  color: "white",
};

const card = {
  width: "350px",
  padding: "25px",
  borderRadius: "20px",
  background: "rgba(30,27,75,0.8)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 0 30px rgba(139,92,246,0.5)",
};

const title = {
  textAlign: "center",
  marginBottom: "10px",
};

const sub = {
  textAlign: "center",
  marginBottom: "15px",
  color: "#cbd5f5",
};

const upiBox = {
  background: "#0f172a",
  padding: "10px",
  borderRadius: "10px",
  textAlign: "center",
  marginBottom: "15px",
};

const qrBox = {
  height: "150px",
  background: "#111827",
  borderRadius: "10px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginBottom: "15px",
};

const input = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  marginBottom: "10px",
};

const btn = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "#22c55e",
  color: "white",
  fontWeight: "bold",
};

const rules = {
  marginTop: "15px",
  fontSize: "13px",
  color: "#cbd5f5",
};