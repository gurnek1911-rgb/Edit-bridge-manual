import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";

export default function Admin() {
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [editors, setEditors] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user || user.email !== "admin@editbridge.com") {
        router.push("/login");
      } else {
        loadData();
      }
    });
    return () => unsub();
  }, []);

  const loadData = async () => {
    const p = await getDocs(collection(db, "payments"));
    const e = await getDocs(collection(db, "editors"));

    setPayments(p.docs.map(d => ({ id: d.id, ...d.data() })));
    setEditors(e.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const approvePayment = async (id) => {
    await updateDoc(doc(db, "payments", id), { status: "approved" });
    loadData();
  };

  const rejectPayment = async (id) => {
    await updateDoc(doc(db, "payments", id), { status: "rejected" });
    loadData();
  };

  const approveEditor = async (id) => {
    await updateDoc(doc(db, "editors", id), { approved: true });
    loadData();
  };

  return (
    <div>
      <h1>Admin</h1>

      {payments.map(p => (
        <div key={p.id}>
          {p.email} - {p.status}
          <button onClick={()=>approvePayment(p.id)}>Approve</button>
          <button onClick={()=>rejectPayment(p.id)}>Reject</button>
        </div>
      ))}

      <h2>Editors</h2>
      {editors.map(e => (
        <div key={e.id}>
          {e.name} - {e.approved ? "Yes" : "No"}
          {!e.approved && (
            <button onClick={()=>approveEditor(e.id)}>Approve</button>
          )}
        </div>
      ))}
    </div>
  );
}