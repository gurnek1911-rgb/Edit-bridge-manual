"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Client() {
  const [credits, setCredits] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchCredits = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      setCredits(snap.data()?.credits || 0);
    };

    fetchCredits();
  }, []);

  return (
    <div style={wrap}>
      
      {/* 💰 CREDIT FLOAT */}
      <div style={creditBox}>
        💰 {credits} Credits
      </div>

      <h1 style={title}>Editors Portfolio</h1>

      <div style={card}>
        <h3>Video Editor</h3>
        <p>Reels + YouTube editing</p>

        <button style={btn} onClick={() => router.push("/chat")}>
          Start Chat (-10 credits)
        </button>
      </div>

      <button style={payBtn} onClick={() => router.push("/payment")}>
        Buy Credits
      </button>

    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  padding: "20px",
  background: "linear-gradient(135deg,#020617,#0f172a,#4c1d95)",
  color: "white"
};

const title = {
  textAlign: "center",
  marginBottom: "20px"
};

const card = {
  background: "rgba(30,27,75,0.8)",
  padding: "20px",
  borderRadius: "15px",
  marginBottom: "15px",
  boxShadow: "0 0 20px rgba(139,92,246,0.4)"
};

const btn = {
  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  color: "white",
  padding: "10px",
  borderRadius: "10px",
  border: "none"
};

const payBtn = {
  marginTop: "20px",
  width: "100%",
  padding: "12px",
  background: "#22c55e",
  borderRadius: "10px",
  border: "none",
  color: "white"
};

const creditBox = {
  position: "fixed",
  top: 15,
  right: 15,
  background: "linear-gradient(135deg,#22c55e,#4ade80)",
  padding: "10px",
  borderRadius: "10px",
  fontWeight: "bold",
  boxShadow: "0 0 15px rgba(34,197,94,0.6)"
};