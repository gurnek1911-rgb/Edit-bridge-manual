import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from "firebase/firestore";

export default function Chat() {
  const router = useRouter();
  const { chatId } = router.query;

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });
  }, [router]);

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("createdAt")
    );

    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [chatId]);

  const send = async (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    await addDoc(collection(db, "messages"), {
      chatId,
      text,
      senderId: user.uid,
      createdAt: new Date()
    });

    setText("");
  };

  if (!chatId) return <p>Loading...</p>;

  return (
    <div>
      {messages.map(m => (
        <p key={m.id}>{m.text}</p>
      ))}

      <form onSubmit={send}>
        <input value={text} onChange={(e)=>setText(e.target.value)} />
        <button>Send</button>
      </form>
    </div>
  );
}