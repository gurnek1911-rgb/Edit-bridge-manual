"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";

export default function Client() {
  const [editors, setEditors] = useState([]);
  const [accessMap, setAccessMap] = useState({});
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login");

      try {
        // ✅ LOAD ALL EDITORS
        const editorSnap = await getDocs(collection(db, "editors"));
        const editorList = editorSnap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setEditors(editorList);

        // ✅ LOAD USER ACCESS (pending / approved)
        const accessQuery = query(
          collection(db, "clientAccess"),
          where("uid", "==", u.uid)
        );

        const accessSnap = await getDocs(accessQuery);

        const map = {};
        accessSnap.docs.forEach(d => {
          const data = d.data();
          map[data.editorId] = data.status; // "pending" | "approved"
        });

        setAccessMap(map);

      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleAction = async (editorId) => {
    const user = auth.currentUser;
    if (!user) return;

    const status = accessMap[editorId];

    // 🔒 NOT PAID
    if (!status) {
      return router.push(`/pay/${editorId}`);
    }

    // ⏳ WAITING
    if (status === "pending") {
      return alert("⏳ Payment pending approval");
    }

    // ✅ APPROVED → OPEN CHAT
    const ids = [user.uid, editorId].sort();
    const chatId = ids.join("_");

    await setDoc(doc(db, "chats", chatId), {
      users: [user.uid, editorId],
      createdAt: serverTimestamp()
    }, { merge: true });

    router.push(`/chat/${chatId}`);
  };

  if (loading) {
    return (
      <div style={s.loaderPage}>
        <div style={s.spinner}></div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <h1 style={s.title}>🔥 Find an Editor</h1>
        <button onClick={() => signOut(auth)} style={s.logout}>
          Logout
        </button>
      </div>

      {/* EDITOR LIST */}
      {editors.map((e) => {
        const status = accessMap[e.id];

        let btnText = "🔒 Pay ₹10";
        let btnStyle = s.lockBtn;

        if (status === "pending") {
          btnText = "⏳ Waiting Approval";
          btnStyle = s.pendingBtn;
        }

        if (status === "approved") {
          btnText = "💬 Chat Now";
          btnStyle = s.chatBtn;
        }

        return (
          <div key={e.id} style={s.card}>
            <div>
              <h2 style={s.name}>{e.name}</h2>
              <p style={s.skills}>{e.skills?.join(", ")}</p>
              <p style={s.price}>₹{e.price}</p>
            </div>

            <button
              onClick={() => handleAction(e.id)}
              style={btnStyle}
              disabled={status === "pending"}
            >
              {btnText}
            </button>
          </div>
        );
      })}
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },

  title: { fontSize: 24, fontWeight: 800 },

  logout: {
    background: "#ef4444",
    border: "none",
    padding: "8px 16px",
    borderRadius: 8,
    color: "white"
  },

  card: {
    background: "rgba(30,41,59,0.6)",
    backdropFilter: "blur(20px)",
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  name: { fontSize: 18, fontWeight: 700 },
  skills: { color: "#94a3b8", fontSize: 13 },
  price: { color: "#a78bfa", fontWeight: 600 },

  chatBtn: {
    background: "#22c55e",
    padding: "10px 16px",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontWeight: 600
  },

  lockBtn: {
    background: "#7c3aed",
    padding: "10px 16px",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontWeight: 600
  },

  pendingBtn: {
    background: "#f59e0b",
    padding: "10px 16px",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontWeight: 600,
    cursor: "not-allowed"
  },

  loaderPage: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617"
  },

  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #333",
    borderTop: "4px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  }
};