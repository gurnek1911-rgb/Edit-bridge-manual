import { useEffect, useState, useCallback } from "react";
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
  const [loading, setLoading] = useState(true);

  // ✅ stable function (fix re-render issues)
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [pSnap, eSnap] = await Promise.all([
        getDocs(collection(db, "payments")),
        getDocs(collection(db, "editors"))
      ]);

      setPayments(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setEditors(eSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      if (user.email !== "admin@editbridge.com") {
        router.push("/");
        return;
      }

      loadData();
    });

    return () => unsub();
  }, [router, loadData]);

  // ✅ Payment actions
  const approvePayment = async (id) => {
    await updateDoc(doc(db, "payments", id), {
      status: "approved"
    });
    loadData();
  };

  const rejectPayment = async (id) => {
    await updateDoc(doc(db, "payments", id), {
      status: "rejected"
    });
    loadData();
  };

  // ✅ Editor approval
  const approveEditor = async (id) => {
    await updateDoc(doc(db, "editors", id), {
      approved: true
    });
    loadData();
  };

  if (loading) return <p style={{ textAlign: "center" }}>Loading admin...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin Panel</h1>

      {/* PAYMENTS */}
      <h2>Payments</h2>
      {payments.length === 0 ? (
        <p>No payments</p>
      ) : (
        payments.map((p) => (
          <div key={p.id} style={{ marginBottom: 10 }}>
            <p>{p.email} - {p.status}</p>

            {p.status === "pending" && (
              <>
                <button onClick={() => approvePayment(p.id)}>
                  Approve
                </button>
                <button onClick={() => rejectPayment(p.id)}>
                  Reject
                </button>
              </>
            )}
          </div>
        ))
      )}

      {/* EDITORS */}
      <h2>Editors</h2>
      {editors.length === 0 ? (
        <p>No editors</p>
      ) : (
        editors.map((e) => (
          <div key={e.id} style={{ marginBottom: 10 }}>
            <p>
              {e.name} - {e.approved ? "Approved" : "Pending"}
            </p>

            {!e.approved && (
              <button onClick={() => approveEditor(e.id)}>
                Approve
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}