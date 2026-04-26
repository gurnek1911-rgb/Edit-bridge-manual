import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  runTransaction,
  doc,
  getDoc
} from "firebase/firestore";
import { useRouter } from "next/router";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkAndDeduct = async () => {
      const user = auth.currentUser;

      if (!user) {
        router.push("/login");
        return;
      }

      const ref = doc(db, "users", user.uid);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref);

        let credits = snap.data().credits || 0;

        if (credits < 10) {
          alert("No credits");
          router.push("/payment");
          throw "no credits";
        }

        transaction.update(ref, {
          credits: credits - 10
        });
      });
    };

    checkAndDeduct();

    const unsub = onSnapshot(collection(db, "messages"), (snap) => {
      setMessages(snap.docs.map(d => d.data()));
    });

    return () => unsub();
  }, []);

  const send = async () => {
    await addDoc(collection(db, "messages"), {
      text,
      user: auth.currentUser.email
    });
    setText("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Chat</h1>

      {messages.map((m, i) => (
        <p key={i}><b>{m.user}:</b> {m.text}</p>
      ))}

      <input value={text} onChange={(e)=>setText(e.target.value)} />
      <button onClick={send}>Send</button>
    </div>
  );
}