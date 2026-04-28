import { useRouter } from "next/router";
import { useState } from "react";
import { db, auth } from "../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function Pay() {
  const router = useRouter();
  const { editorId } = router.query;

  const [txnId, setTxnId] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Login required");
    if (!txnId) return alert("Enter txn ID");

    setLoading(true);

    const chatId = [user.uid, editorId].sort().join("_"); // ✅ IMPORTANT

    await addDoc(collection(db, "paymentRequests"), {
      uid: user.uid,
      email: user.email,
      editorId,
      chatId, // ✅ STORE CHAT ID
      txnId,
      status: "pending",
      createdAt: serverTimestamp()
    });

    alert("Payment submitted");
    router.push("/client");
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h2>🔒 Unlock Chat</h2>

        <input
          placeholder="Transaction ID"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          style={s.input}
        />

        <button onClick={submit} style={s.btn}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}

const s = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#020617"
  },
  card: {
    background: "#1e293b",
    padding: 25,
    borderRadius: 16,
    width: 300
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8
  },
  btn: {
    width: "100%",
    padding: 10,
    background: "#7c3aed",
    border: "none",
    color: "white",
    borderRadius: 10
  }
};