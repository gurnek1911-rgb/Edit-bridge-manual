import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Client() {
  const [editors, setEditors] = useState([]);
  const router = useRouter();

  useEffect(() => {
    loadEditors();
  }, []);

  const loadEditors = async () => {
    const snap = await getDocs(collection(db, "editors"));
    const list = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setEditors(list);
  };

  return (
    <div style={s.page}>
      <h1>🔥 Editors</h1>

      {editors.map(e => (
        <div key={e.id} style={s.card}>
          <h2>{e.name}</h2>
          <p>{e.skills?.join(", ")}</p>
          <p>₹{e.price}</p>

          <button
            style={s.btn}
            onClick={() => router.push(`/chat/${e.id}`)}
          >
            Chat (🔒 ₹10)
          </button>
        </div>
      ))}
    </div>
  );
}

const s = {
  page: {
    padding: 20,
    background: "#020617",
    color: "white",
    minHeight: "100vh"
  },
  card: {
    background: "#111827",
    padding: 20,
    borderRadius: 12,
    marginTop: 10
  },
  btn: {
    marginTop: 10,
    padding: 10,
    background: "#6366f1",
    color: "white",
    border: "none"
  }
};