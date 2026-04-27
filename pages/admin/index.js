import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

export default function Admin() {
  const router = useRouter();

  const [payments, setPayments] = useState([]);
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("payments");

  const [hideApproved, setHideApproved] = useState(false);
  const [search, setSearch] = useState("");

  // 🔐 AUTH
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return router.replace("/login");
      if (user.email !== "admin@editbridge.com") return router.replace("/");

      const unsubPay = onSnapshot(collection(db, "paymentRequests"), (snap) => {
        setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });

      const unsubEdit = onSnapshot(collection(db, "editors"), (snap) => {
        setEditors(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      return () => {
        unsubPay();
        unsubEdit();
      };
    });

    return () => unsub();
  }, []);

  // 💳 PAYMENT ACTIONS
  const approvePayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), { status: "approved" });

    await setDoc(doc(db, "clientAccess", p.uid), {
      uid: p.uid,
      email: p.email,
      txnId: p.txnId,
      status: "approved",
    });
  };

  const rejectPayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), { status: "rejected" });

    await setDoc(doc(db, "clientAccess", p.uid), {
      uid: p.uid,
      email: p.email,
      txnId: p.txnId,
      status: "rejected",
    });
  };

  // 🎬 EDITOR ACTIONS
  const approveEditor = async (id) => {
    await updateDoc(doc(db, "editors", id), { approved: true });
  };

  const toggleActive = async (id, current) => {
    await updateDoc(doc(db, "editors", id), { active: !current });
  };

  const deleteEditor = async (id) => {
    if (!confirm("Delete editor?")) return;
    await deleteDoc(doc(db, "editors", id));
  };

  if (loading) {
    return (
      <div style={s.loaderPage}>
        <div style={s.loader}></div>
      </div>
    );
  }

  // 🎯 FILTERS
  const filteredPayments = payments
    .filter((p) => !hideApproved || p.status !== "approved")
    .filter((p) =>
      p.email?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (a.status === "pending" ? -1 : 1));

  const filteredEditors = editors.filter((e) =>
    e.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{css}</style>

      <div style={s.page}>
        {/* HEADER */}
        <div style={s.header}>
          <div style={s.logo}>🛡 Admin Panel</div>

          <div style={s.headerRight}>
            <button onClick={() => router.push("/")} style={s.homeBtn}>
              🏠 Home
            </button>

            <button
              onClick={() => setHideApproved(!hideApproved)}
              style={s.toggleBtn}
            >
              {hideApproved ? "👁 Show Approved" : "🙈 Hide Approved"}
            </button>

            <button
              onClick={() => {
                auth.signOut();
                router.push("/");
              }}
              style={s.logout}
            >
              Logout
            </button>
          </div>
        </div>

        {/* STATS */}
        <div style={s.stats}>
          <Stat label="Editors" value={editors.length} />
          <Stat
            label="Pending Payments"
            value={payments.filter((p) => p.status === "pending").length}
          />
          <Stat
            label="Approved"
            value={payments.filter((p) => p.status === "approved").length}
          />
        </div>

        {/* SEARCH */}
        <div style={s.searchWrap}>
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.search}
          />
        </div>

        {/* TABS */}
        <div style={s.tabs}>
          <button
            style={tab === "payments" ? s.tabActive : s.tab}
            onClick={() => setTab("payments")}
          >
            💳 Payments
          </button>
          <button
            style={tab === "editors" ? s.tabActive : s.tab}
            onClick={() => setTab("editors")}
          >
            🎬 Editors
          </button>
        </div>

        {/* CONTENT */}
        <div style={s.content}>
          {tab === "payments" &&
            filteredPayments.map((p) => (
              <div key={p.id} style={s.card}>
                <div>
                  <b>{p.email}</b>
                  <div style={s.sub}>Txn: {p.txnId}</div>
                </div>

                <div style={s.actions}>
                  {p.status === "pending" && (
                    <>
                      <button
                        onClick={() => approvePayment(p)}
                        style={s.green}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectPayment(p)}
                        style={s.red}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <span style={s.badge(p.status)}>{p.status}</span>
                </div>
              </div>
            ))}

          {tab === "editors" &&
            filteredEditors.map((e) => (
              <div key={e.id} style={s.card}>
                <div>
                  <b>{e.name}</b>
                  <div style={s.sub}>{e.skills?.join(", ")}</div>
                </div>

                <div style={s.actions}>
                  {!e.approved && (
                    <button
                      onClick={() => approveEditor(e.id)}
                      style={s.green}
                    >
                      Approve
                    </button>
                  )}

                  <button
                    onClick={() => toggleActive(e.id, e.active)}
                    style={s.blue}
                  >
                    {e.active ? "Disable" : "Enable"}
                  </button>

                  <button
                    onClick={() => deleteEditor(e.id)}
                    style={s.red}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}

// 🔹 STAT CARD
function Stat({ label, value }) {
  return (
    <div style={s.statCard}>
      <div style={s.statValue}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  );
}

// 🎨 CSS
const css = `
body { margin:0; font-family:sans-serif; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
  },

  loaderPage: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  loader: {
    width: 40,
    height: 40,
    border: "3px solid #333",
    borderTop: "3px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: 16,
  },

  headerRight: { display: "flex", gap: 10 },

  logo: { fontWeight: 800 },

  homeBtn: { background: "#334155", color: "white", padding: 8 },

  toggleBtn: { background: "#7c3aed", color: "white", padding: 8 },

  logout: { background: "#ef4444", color: "white", padding: 8 },

  stats: {
    display: "flex",
    gap: 10,
    padding: 16,
  },

  statCard: {
    flex: 1,
    background: "#1e293b",
    padding: 14,
    borderRadius: 10,
  },

  statValue: { fontSize: 20, fontWeight: 700 },

  statLabel: { fontSize: 12, color: "#94a3b8" },

  searchWrap: { padding: 16 },

  search: { width: "100%", padding: 10 },

  tabs: { display: "flex", gap: 10, padding: 16 },

  tab: { flex: 1, padding: 10, background: "#1e293b" },

  tabActive: { flex: 1, padding: 10, background: "#7c3aed" },

  content: { padding: 16 },

  card: {
    display: "flex",
    justifyContent: "space-between",
    padding: 14,
    background: "#1e293b",
    marginBottom: 10,
  },

  sub: { fontSize: 12, color: "#94a3b8" },

  actions: { display: "flex", gap: 8, alignItems: "center" },

  green: { background: "#10b981", color: "white", padding: 6 },

  red: { background: "#ef4444", color: "white", padding: 6 },

  blue: { background: "#3b82f6", color: "white", padding: 6 },

  badge: (status) => ({
    padding: "4px 8px",
    background:
      status === "approved"
        ? "#10b981"
        : status === "rejected"
        ? "#ef4444"
        : "#f59e0b",
  }),
};