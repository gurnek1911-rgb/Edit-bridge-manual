import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getAuth } from "firebase/auth";
import { app } from "../firebase";
import { getFirestore, addDoc, collection } from "firebase/firestore";

export default function PaymentPage() {
  const router = useRouter();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [user, setUser] = useState(null);
  const [txnId, setTxnId] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 Check login
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!txnId.trim()) {
      alert("Enter Transaction ID");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "payments"), {
        userId: user.uid,
        email: user.email,
        txnId: txnId,
        status: "pending",
        createdAt: new Date()
      });

      alert("Payment submitted ✅ Waiting for admin approval");
      setTxnId("");
    } catch (err) {
      alert(err.message);
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      padding: "20px",
      background: "#0f0f0f",
      color: "white"
    }}>
      <h1>Unlock Chat</h1>

      <p>Pay ₹99 to unlock chat feature</p>

      <div style={{
        margin: "20px 0",
        padding: "20px",
        border: "1px solid #333",
        borderRadius: "10px"
      }}>
        <p>UPI ID:</p>
        <h3>editbridge@upi</h3>
        <p>Amount: ₹99</p>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Enter Transaction ID"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          style={{ width: "100%", padding: "10px" }}
        />

        <button type="submit" style={{ marginTop: "10px" }}>
          {loading ? "Submitting..." : "Submit Payment"}
        </button>
      </form>
    </div>
  );
}