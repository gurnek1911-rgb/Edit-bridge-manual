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
  const [accessStatus, setAccessStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showPay, setShowPay] = useState(false);
  const [txnId, setTxnId] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.push("/");

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

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "clientAccess", user.uid), (snap) => {
      setAccessStatus(snap.exists() ? snap.data().status : "none");
    });
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

    setShowPay(false);
    setTxnId("");
    alert("Submitted! Wait for approval.");
  };

  const openChat = (editorId) => {
    if (accessStatus === "approved") {
      router.push(`/chat/${user.uid}_${editorId}`);
    } else {
      setShowPay(true);
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const filtered = editors.filter((e) =>
    e.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={s.center}>Loading...</div>;

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <div style={s.logo}>EditBridge</div>

        <div style={s.actions}>
          {accessStatus === "approved" ? (
            <span style={s.badge}>Access Active</span>
          ) : (
            <button style={s.unlock} onClick={() => setShowPay(true)}>
              Unlock ₹10
            </button>
          )}

          <button onClick={() => router.push("/inbox")} style={s.btn}>
            Inbox
          </button>

          <button onClick={logout} style={s.logout}>
            Logout
          </button>
        </div>
      </div>

      {/* HERO */}
      <div style={s.hero}>
        <h1>Find Top Editors</h1>
        <p>Connect instantly. Chat freely after one-time unlock.</p>
      </div>

      {/* SEARCH */}
      <div style={s.searchBox}>
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
      {showPay && (
        <div style={s.modal}>
          <div style={s.modalBox}>
            <h3>Unlock Chat Access</h3>
            <p>Pay once to chat with all editors.</p>

            <input
              placeholder="Transaction ID"
              value={txnId}
              onChange={(e) => setTxnId(e.target.value)}
              style={s.input}
            />

            <button onClick={submitPayment} style={s.unlock}>
              Submit
            </button>

            <button onClick={() => setShowPay(false)} style={s.btn}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: 16,
  },
  logo: { fontWeight: 800 },
  actions: { display: "flex", gap: 10 },
  btn: { padding: 8, background: "#334155", border: "none", color: "white" },
  logout: { padding: 8, background: "#ef4444", border: "none", color: "white" },
  unlock: { padding: 8, background: "#7c3aed", border: "none", color: "white" },
  badge: { color: "#10b981" },

  hero: { padding: 20 },

  searchBox: { padding: 20 },
  input: { padding: 10, width: "100%" },

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
  center: { display: "flex", justifyContent: "center", paddingTop: 100 },
};