import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

export default function ClientPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState("none");

  const [showPayModal, setShowPayModal] = useState(false);
  const [txnId, setTxnId] = useState("");

  // ✅ AUTH CHECK
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login");
        return;
      }

      setUser(u);

      // get access
      const accessRef = doc(db, "clientAccess", u.uid);
      const snap = await getDoc(accessRef);
      setAccessStatus(snap.exists() ? snap.data().status : "none");

      // get editors
      const snapEditors = await getDocs(collection(db, "editors"));
      setEditors(
        snapEditors.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((e) => e.approved)
      );

      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ✅ LIVE ACCESS UPDATE
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "clientAccess", user.uid), (snap) => {
      setAccessStatus(snap.exists() ? snap.data().status : "none");
    });

    return () => unsub();
  }, [user]);

  // ✅ PAYMENT
  const submitPayment = async () => {
    if (!txnId.trim()) return alert("Enter Transaction ID");

    await addDoc(collection(db, "paymentRequests"), {
      uid: user.uid,
      email: user.email,
      txnId,
      status: "pending",
      createdAt: new Date(),
    });

    await setDoc(doc(db, "clientAccess", user.uid), {
      status: "pending",
    });

    alert("Payment submitted!");
    setShowPayModal(false);
    setTxnId("");
  };

  // ✅ CHAT ACCESS CONTROL
  const openChat = (editorId) => {
    if (accessStatus === "approved") {
      router.push(`/chat/${user.uid}_${editorId}`);
    } else if (accessStatus === "pending") {
      alert("Wait for approval");
    } else {
      setShowPayModal(true);
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  if (loading) return <div style={{ color: "white" }}>Loading...</div>;

  return (
    <div style={{ color: "white", padding: 20 }}>
      <h1>EditBridge</h1>

      <button onClick={logout}>Logout</button>

      <h2>Editors</h2>

      {editors.map((e) => (
        <div key={e.id}>
          <p>{e.name}</p>
          <button onClick={() => openChat(e.id)}>
            {accessStatus === "approved" ? "Chat" : "Unlock"}
          </button>
        </div>
      ))}

      {showPayModal && (
        <div>
          <h3>Pay ₹10</h3>
          <input
            placeholder="Txn ID"
            value={txnId}
            onChange={(e) => setTxnId(e.target.value)}
          />
          <button onClick={submitPayment}>Submit</button>
        </div>
      )}
    </div>
  );
}