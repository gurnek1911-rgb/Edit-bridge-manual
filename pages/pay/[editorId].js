import { useRouter } from "next/router";
import { useState } from "react";
import { db, auth } from "../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function Pay() {
  const router = useRouter();
  const { editorId } = router.query;

  const [txnId, setTxnId] = useState("");

  const submit = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Login required");
    if (!txnId) return alert("Enter txn ID");

    await addDoc(collection(db, "paymentRequests"), {
      uid: user.uid,
      email: user.email,
      editorId,
      txnId,
      status: "pending",
      createdAt: serverTimestamp()
    });

    alert("Payment submitted");
    router.push("/client");
  };

  return (
    <div style={{padding:20}}>
      <h2>Pay ₹10</h2>

      <input
        placeholder="Transaction ID"
        value={txnId}
        onChange={(e)=>setTxnId(e.target.value)}
      />

      <button onClick={submit}>Submit</button>
    </div>
  );
}