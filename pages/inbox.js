"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";

export default function Inbox() {
  const [chats, setChats] = useState([]);
  const router = useRouter();

  useEffect(() => {
    let unsub;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");

      const q = query(
        collection(db, "chats"),
        where("users", "array-contains", u.uid),
        orderBy("lastUpdated", "desc")
      );

      unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setChats(data);
      });
    });

    return () => {
      unsubAuth();
      unsub && unsub();
    };
  }, []);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2>📩 Inbox</h2>
        <button onClick={() => signOut(auth)}>Logout</button>
      </div>

      {chats.length === 0 && <p>No chats yet</p>}

      {chats.map(chat => (
        <div
          key={chat.id}
          style={s.card}
          onClick={() => router.push(`/chat/${chat.id}`)}
        >
          <div>{chat.lastMessage || "Start chatting..."}</div>
        </div>
      ))}
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    color: "white",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },
  card: {
    padding: 14,
    background: "#1e293b",
    borderRadius: 12,
    marginBottom: 10,
    cursor: "pointer"
  }
};