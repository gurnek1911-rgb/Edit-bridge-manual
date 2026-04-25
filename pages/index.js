import { useEffect, useState } from "react";
import Link from "next/link";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "../lib/firebase";

export default function HomePage() {
  const [editors, setEditors] = useState([]);

  useEffect(() => {
    const load = async () => {
      const db = getFirestore(app);
      const snap = await getDocs(collection(db, "editors"));

      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.approved === true);

      setEditors(data);
    };

    load();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>EditBridge</h1>
      <p>Find editors</p>

      <Link href="/login">
        <button>Login</button>
      </Link>

      <h2>Approved Editors</h2>

      {editors.map(e => (
        <div key={e.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <h3>{e.name}</h3>
          <p>{e.bio}</p>
        </div>
      ))}
    </main>
  );
}