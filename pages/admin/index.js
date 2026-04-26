import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";

export default function Admin() {
  const router = useRouter();

  const [payments, setPayments] = useState([]);
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [paySnap, editSnap] = await Promise.all([
        getDocs(collection(db, "payments")),
        getDocs(collection(db, "editors"))
      ]);

      setPayments(
        paySnap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }))
      );

      setEditors(
        editSnap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }))
      );
    } catch (err) {
      console.log(err);
    }

    setLoading(false);
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

  const approveEditor = async (id) => {
    await updateDoc(doc(db, "editors", id), {
      approved: true
    });
    loadData();
  };

  const toggleActive = async (id, current) => {
    await updateDoc(doc(db, "editors", id), {
      active: !current
    });
    loadData();
  };

  const deleteEditor = async (id) => {
    const ok = confirm("Delete this editor?");
    if (!ok) return;

    await deleteDoc(doc(db, "editors", id));
    loadData();
  };

  const openChat = (id) => {
    router.push(`/chat/${id}`);
  };

  if (loading)
    return (
      <div style={styles.loadingWrap}>
        <h2 style={{ color: "white" }}>Loading Admin...</h2>
      </div>
    );

  const approvedCount = editors.filter((e) => e.approved).length;
  const pendingCount = editors.filter((e) => !e.approved).length;
  const paymentPending = payments.filter(
    (p) => p.status === "pending"
  ).length;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Admin Dashboard</h1>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3>{editors.length}</h3>
          <p>Total Editors</p>
        </div>

        <div style={styles.statCard}>
          <h3>{approvedCount}</h3>
          <p>Approved</p>
        </div>

        <div style={styles.statCard}>
          <h3>{pendingCount}</h3>
          <p>Pending Editors</p>
        </div>

        <div style={styles.statCard}>
          <h3>{paymentPending}</h3>
          <p>Pending Payments</p>
        </div>
      </div>

      {/* Payments */}
      <section style={styles.section}>
        <h2 style={styles.heading}>Payments</h2>

        {payments.length === 0 ? (
          <p style={styles.empty}>No Payments</p>
        ) : (
          payments.map((p) => (
            <div key={p.id} style={styles.card}>
              <div>
                <p><b>{p.email}</b></p>
                <p>Status: {p.status}</p>
                <p>Txn: {p.txnId}</p>
              </div>

              {p.status === "pending" && (
                <div style={styles.row}>
                  <button
                    style={styles.greenBtn}
                    onClick={() => approvePayment(p.id)}
                  >
                    Approve
                  </button>

                  <button
                    style={styles.redBtn}
                    onClick={() => rejectPayment(p.id)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {/* Editors */}
      <section style={styles.section}>
        <h2 style={styles.heading}>Editors</h2>

        {editors.length === 0 ? (
          <p style={styles.empty}>No Editors</p>
        ) : (
          editors.map((e) => (
            <div key={e.id} style={styles.card}>
              <div>
                <p><b>{e.name}</b></p>
                <p>{e.email}</p>
                <p>{e.skill}</p>
                <p>{e.price}</p>

                <p>
                  Status:{" "}
                  {e.approved ? "Approved" : "Pending"}
                </p>

                <p>
                  Active:{" "}
                  {e.active ? "Online" : "Offline"}
                </p>
              </div>

              <div style={styles.rowWrap}>
                {!e.approved && (
                  <button
                    style={styles.greenBtn}
                    onClick={() => approveEditor(e.id)}
                  >
                    Approve
                  </button>
                )}

                <button
                  style={styles.blueBtn}
                  onClick={() => openChat(e.id)}
                >
                  Chat
                </button>

                <button
                  style={styles.purpleBtn}
                  onClick={() =>
                    toggleActive(e.id, e.active)
                  }
                >
                  {e.active ? "Turn Off" : "Turn On"}
                </button>

                <button
                  style={styles.redBtn}
                  onClick={() => deleteEditor(e.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "30px",
    background:
      "linear-gradient(135deg,#0f172a,#1e1b4b,#581c87)",
    color: "white"
  },

  loadingWrap: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg,#0f172a,#1e1b4b,#581c87)"
  },

  title: {
    textAlign: "center",
    fontSize: "38px",
    marginBottom: "30px"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(180px,1fr))",
    gap: "15px",
    marginBottom: "35px"
  },

  statCard: {
    background: "rgba(255,255,255,0.08)",
    padding: "20px",
    borderRadius: "16px",
    textAlign: "center"
  },

  section: {
    marginTop: "30px"
  },

  heading: {
    marginBottom: "15px"
  },

  empty: {
    opacity: 0.7
  },

  card: {
    background: "rgba(255,255,255,0.08)",
    padding: "18px",
    borderRadius: "16px",
    marginBottom: "15px"
  },

  row: {
    display: "flex",
    gap: "10px",
    marginTop: "12px"
  },

  rowWrap: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "12px"
  },

  greenBtn: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "10px",
    background: "#22c55e",
    color: "white",
    cursor: "pointer"
  },

  redBtn: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "10px",
    background: "#ef4444",
    color: "white",
    cursor: "pointer"
  },

  blueBtn: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer"
  },

  purpleBtn: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "10px",
    background: "#7c3aed",
    color: "white",
    cursor: "pointer"
  }
};