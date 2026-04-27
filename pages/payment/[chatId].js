import { useRouter } from "next/router";
import { useState } from "react";
import { db, auth } from "../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function Payment() {
  const router = useRouter();
  const { chatId, editorId } = router.query;

  const [txnId, setTxnId] = useState("");

  const submit = async () => {
    if (!txnId) return alert("Enter txn id");

    await addDoc(collection(db, "payments"), {
      clientId: auth.currentUser.uid,
      editorId,
      chatId,
      txnId,
      status: "pending",
      createdAt: serverTimestamp()
    });

    alert("Waiting for approval");
    router.push("/client");
  };

  return (
    <div style={{padding:20,color:"white",background:"#020617"}}>
      <h2>Pay via UPI</h2>
      <p>yourupi@upi</p>

      <input
        placeholder="Transaction ID"
        value={txnId}
        onChange={(e)=>setTxnId(e.target.value)}
      />

      <button onClick={submit}>Submit</button>
    </div>
  );
}