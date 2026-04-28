import { useEffect, useState, useRef } from "react";
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

  const unsubRef = useRef(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");

      const q = query(
        collection(db, "chats"),
        where("users", "array-contains", u.uid)
      );

      unsubRef.current = onSnapshot(q, async (snap) => {
        const list = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            const other = data.users.find(id => id !== u.uid);

            let name = "User";

            try {
              const userSnap = await getDoc(doc(db, "users", other));
              if (userSnap.exists()) {
                name = userSnap.data().email;
              } else {
                const edSnap = await getDoc(doc(db, "editors", other));
                if (edSnap.exists()) name = edSnap.data().name;
                else name = "Admin";
              }
            } catch {}

            return {
              id: d.id,
              ...data,
              name
            };
          })
        );

        setChats(list);
      });
    });

    return () => {
      unsubAuth();
      unsubRef.current && unsubRef.current();
    };
  }, []);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={() => router.push("/editor")}>← Back</button>
        <h2>Inbox</h2>
      </div>

      {chats.length === 0 ? (
        <p style={{textAlign:"center",marginTop:50}}>No chats yet</p>
      ) : (
        chats.map(c => (
          <div
            key={c.id}
            style={s.card}
            onClick={() => router.push("/chat/" + c.id)}
          >
            <div>
              <b>{c.name}</b>
              <div style={{opacity:0.7}}>
                {c.lastMessage || "Start conversation"}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const s = {
  page:{padding:20,color:"white",background:"#020617",minHeight:"100vh"},
  header:{display:"flex",justifyContent:"space-between",marginBottom:20},
  card:{padding:15,background:"#1e293b",marginTop:10,borderRadius:10,cursor:"pointer"}
};