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
  const [search, setSearch] = useState("");
  const [accessStatus, setAccessStatus] = useState("none");

  const [showPayModal, setShowPayModal] = useState(false);
  const [txnId, setTxnId] = useState("");

  // ✅ AUTH FIX
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login");
        return;
      }

      setUser(u);

      const accessSnap = await getDoc(doc(db, "clientAccess", u.uid));
      setAccessStatus(accessSnap.exists() ? accessSnap.data().status : "none");

      const snap = await getDocs(collection(db, "editors"));
      setEditors(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((e) => e.approved)
      );

      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ✅ LIVE ACCESS
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(doc(db, "clientAccess", user.uid), (snap) => {
      setAccessStatus(snap.exists() ? snap.data().status : "none");
    });

    return () => unsub();
  }, [user]);

  const submitPayment = async () => {
    if (!txnId.trim()) return alert("Enter transaction ID");

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

    setShowPayModal(false);
    setTxnId("");
    alert("Submitted!");
  };

  const openChat = (editorId) => {
    if (accessStatus === "approved") {
      router.push(`/chat/${user.uid}_${editorId}`);
    } else {
      setShowPayModal(true);
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const filtered = editors.filter((e) =>
    e.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={s.loadingScreen}>
        <div style={s.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>

      <div style={s.page}>
        {/* TOPBAR */}
        <div style={s.topbar}>
          <div style={s.logo}>🎬 EditBridge</div>

          <div style={s.topRight}>
            {accessStatus === "approved" ? (
              <div style={s.badge}>✅ Active</div>
            ) : (
              <button onClick={() => setShowPayModal(true)} style={s.unlockBtn}>
                Unlock ₹10
              </button>
            )}

            <button onClick={() => router.push("/inbox")} style={s.inboxBtn}>
              Inbox
            </button>

            <button onClick={logout} style={s.logoutBtn}>
              Logout
            </button>
          </div>
        </div>

        {/* HERO */}
        <div style={s.hero}>
          <h1>Find Top Editors</h1>
          <p>Connect instantly with professionals</p>
        </div>

        {/* SEARCH */}
        <div style={s.searchWrap}>
          <input
            placeholder="Search editors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.input}
          />
        </div>

        {/* GRID */}
        <div style={s.grid}>
          {filtered.map((e) => (
            <div key={e.id} style={s.card}>
              <div style={s.avatar}>{e.name?.[0]}</div>

              <div>
                <div style={s.name}>{e.name}</div>
                <div style={s.skill}>{e.skills?.join(", ")}</div>
              </div>

              <button onClick={() => openChat(e.id)} style={s.chatBtn}>
                {accessStatus === "approved" ? "Chat" : "Unlock"}
              </button>
            </div>
          ))}
        </div>

        {/* MODAL */}
        {showPayModal && (
          <div style={s.modal}>
            <div style={s.modalBox}>
              <h3>Unlock Access</h3>

              <input
                placeholder="Transaction ID"
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                style={s.input}
              />

              <button onClick={submitPayment} style={s.unlockBtn}>
                Submit
              </button>

              <button onClick={() => setShowPayModal(false)} style={s.inboxBtn}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const css = `
@keyframes spin { to { transform: rotate(360deg); } }
`;

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
  },
  loadingScreen: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #333",
    borderTop: "3px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    padding: 16,
  },
  logo: { fontWeight: 800 },
  topRight: { display: "flex", gap: 10 },
  inboxBtn: { background: "#334155", color: "white", border: "none", padding: 8 },
  logoutBtn: { background: "#ef4444", color: "white", border: "none", padding: 8 },
  unlockBtn: { background: "#7c3aed", color: "white", border: "none", padding: 8 },
  badge: { color: "#10b981" },

  hero: { padding: 20 },

  searchWrap: { padding: 20 },
  input: { width: "100%", padding: 10 },

  grid: { display: "grid", gap: 12, padding: 20 },
  card: { display: "flex", gap: 10, padding: 14, background: "#1e293b" },
  avatar: { width: 40, height: 40, background: "#7c3aed" },
  name: { fontWeight: 700 },
  skill: { fontSize: 12, color: "#94a3b8" },
  chatBtn: { marginLeft: "auto", background: "#7c3aed", color: "white" },

  modal: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: { background: "#0f172a", padding: 20 },
};