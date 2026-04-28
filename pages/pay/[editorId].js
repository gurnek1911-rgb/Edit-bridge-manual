"use client";

import { useRouter } from "next/router";
import { useState } from "react";
import { db, auth } from "../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const UPI_ID = "yourupi@upi"; // 🔥 CHANGE THIS
const QR_IMAGE = "/qr.png";   // 🔥 PUT QR IMAGE IN public/

export default function Pay() {
  const router = useRouter();
  const { editorId } = router.query;

  const [txnId, setTxnId] = useState("");
  const [loading, setLoading] = useState(false);

  const copyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    alert("UPI ID copied");
  };

  const submit = async () => {
    const user = auth.currentUser;

    if (!user) return alert("Login required");
    if (!txnId) return alert("Enter transaction ID");

    setLoading(true);

    const chatId = [user.uid, editorId].sort().join("_");

    await addDoc(collection(db, "paymentRequests"), {
      uid: user.uid,
      email: user.email,
      editorId,
      chatId,
      txnId,
      status: "pending",
      createdAt: serverTimestamp()
    });

    alert("✅ Payment submitted");
    router.push("/client");
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        <h2 style={s.title}>🔒 Unlock Chat</h2>

        {/* UPI */}
        <div style={s.box}>
          <p>Send ₹10 to:</p>
          <b>{UPI_ID}</b>

          <button onClick={copyUpi} style={s.copy}>
            Copy UPI
          </button>
        </div>

        {/* QR */}
        <div style={s.qrBox}>
          <img src={QR_IMAGE} alt="QR" style={s.qr} />
          <p style={{fontSize:12,color:"#94a3b8"}}>Scan & Pay</p>
        </div>

        {/* TXN INPUT */}
        <input
          placeholder="Enter Transaction ID"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          style={s.input}
        />

        <button onClick={submit} style={s.btn}>
          {loading ? "Submitting..." : "Submit Payment"}
        </button>

      </div>
    </div>
  );
}

const s = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white"
  },

  card: {
    width: 320,
    background: "rgba(30,41,59,0.6)",
    padding: 20,
    borderRadius: 16,
    backdropFilter: "blur(10px)",
    textAlign: "center"
  },

  title: {
    marginBottom: 15
  },

  box: {
    background: "#1e293b",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15
  },

  copy: {
    marginTop: 8,
    background: "#22c55e",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    color: "white"
  },

  qrBox: {
    marginBottom: 15
  },

  qr: {
    width: 140,
    borderRadius: 10
  },

  input: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "none",
    marginBottom: 10
  },

  btn: {
    width: "100%",
    padding: 10,
    background: "#7c3aed",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontWeight: 600
  }
};