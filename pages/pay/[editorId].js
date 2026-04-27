import { useRouter } from "next/router";
import { useState } from "react";
import { auth, db } from "../../lib/firebase";
import { addDoc, collection } from "firebase/firestore";

export default function Pay() {
  const router = useRouter();
  const { editorId } = router.query;

  const [txn, setTxn] = useState("");

  const submit = async () => {
    if (!txn) return alert("Enter Transaction ID");

    await addDoc(collection(db, "paymentRequests"), {
      uid: auth.currentUser.uid,
      editorId,
      txnId: txn,
      status: "pending",
      createdAt: new Date()
    });

    alert("Payment submitted. Wait for approval");
    router.push("/client");
  };

  return (
    <div style={s.page}>
      <h1>💰 Pay ₹10 to unlock chat</h1>

      <p>UPI ID: yourupi@okaxis</p>

      <img src="/qr.png" style={{ width: 200 }} />

      <input
        placeholder="Transaction ID"
        onChange={(e) => setTxn(e.target.value)}
        style={s.input}
      />

      <button onClick={submit} style={s.btn}>
        Submit Payment
      </button>
    </div>
  );
}

const s = {
  page: { padding: 20, color: "white", background: "#020617", minHeight: "100vh" },
  input: { width: "100%", padding: 10, marginTop: 10 },
  btn: { marginTop: 10, padding: 10, background: "#22c55e", color: "white" }
};