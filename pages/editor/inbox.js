import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function Inbox() {
  const [chats, setChats] = useState([]);
  const router = useRouter();

  useEffect(() => {
    let unsub;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login?type=editor");

      // ✅ USE USERS ARRAY (BEST METHOD)
      const q = query(
        collection(db, "clientAccess"),
        where("users", "array-contains", u.uid),
        where("status", "==", "approved")
      );

      unsub = onSnapshot(q, async (snap) => {
        const list = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();

            // 🔥 find client (not editor)
            const clientUid = data.users.find(id => id !== u.uid);

            let clientName = "Client";

            try {
              const userSnap = await getDoc(doc(db, "users", clientUid));
              if (userSnap.exists()) {
                clientName = userSnap.data().email || "Client";
              }
            } catch {}

            // 🔥 ALWAYS SAFE chatId
            const chatId =
              data.chatId ||
              [clientUid, u.uid].sort().join("_");

            return {
              chatId,
              clientName
            };
          })
        );

        setChats(list);
      });
    });

    return () => {
      unsubAuth();
      if (unsub) unsub();
    };
  }, []);

  return (
    <div style={s.page}>
      <h2 style={s.title}>Inbox</h2>

      {chats.length === 0 ? (
        <p>No chats</p>
      ) : (
        chats.map((c, i) => (
          <div
            key={i}
            style={s.card}
            onClick={() => router.push("/chat/" + c.chatId)}
          >
            <b>{c.clientName}</b>
          </div>
        ))
      )}
    </div>
  );
}

const s = {
  page: { padding: 20, color: "white", background: "#020617", minHeight: "100vh" },
  title: { marginBottom: 20 },
  card: {
    padding: 12,
    background: "#1e293b",
    marginBottom: 10,
    borderRadius: 10,
    cursor: "pointer"
  }
};