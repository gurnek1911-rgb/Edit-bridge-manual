"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../../lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";

export default function Editor() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    price: "",
    skills: "",
    portfolio: []
  });

  // 🔐 AUTH + LOAD DATA
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");

      setUser(u);

      const ref = doc(db, "editors", u.uid);

      const unsubDoc = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setProfile(snap.data());
        }
        setLoading(false);
      });

      return () => unsubDoc();
    });

    return () => unsub();
  }, []);

  // 💾 SAVE PROFILE
  const saveProfile = async () => {
    await setDoc(
      doc(db, "editors", user.uid),
      {
        ...profile,
        skills: profile.skills.split(",").map(s => s.trim()),
        active: true,
        approved: true,
        email: user.email
      },
      { merge: true }
    );

    alert("✅ Profile updated");
  };

  // ➕ ADD PORTFOLIO ITEM
  const addPortfolio = () => {
    setProfile({
      ...profile,
      portfolio: [
        ...(profile.portfolio || []),
        { title: "", link: "", thumbnail: "" }
      ]
    });
  };

  // ✏️ UPDATE PORTFOLIO ITEM
  const updatePortfolio = (i, key, value) => {
    const updated = [...profile.portfolio];
    updated[i][key] = value;
    setProfile({ ...profile, portfolio: updated });
  };

  // ❌ REMOVE PORTFOLIO
  const removePortfolio = (i) => {
    const updated = profile.portfolio.filter((_, index) => index !== i);
    setProfile({ ...profile, portfolio: updated });
  };

  if (loading) {
    return (
      <div style={s.loader}>
        <div style={s.spinner}></div>
      </div>
    );
  }

  return (
    <div style={s.page}>

      {/* HEADER */}
      <div style={s.header}>
        <h2>🎬 Editor Dashboard</h2>
        <button onClick={() => signOut(auth)} style={s.logout}>
          Logout
        </button>
      </div>

      {/* PROFILE */}
      <div style={s.card}>
        <h3>Profile</h3>

        <input
          placeholder="Name"
          value={profile.name || ""}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          style={s.input}
        />

        <textarea
          placeholder="Bio"
          value={profile.bio || ""}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          style={s.input}
        />

        <input
          placeholder="Skills (comma separated)"
          value={profile.skills?.join?.(", ") || profile.skills || ""}
          onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
          style={s.input}
        />

        <input
          placeholder="Price ₹"
          value={profile.price || ""}
          onChange={(e) => setProfile({ ...profile, price: Number(e.target.value) })}
          style={s.input}
        />
      </div>

      {/* PORTFOLIO */}
      <div style={s.card}>
        <div style={s.row}>
          <h3>Portfolio</h3>
          <button onClick={addPortfolio} style={s.addBtn}>+ Add</button>
        </div>

        {(profile.portfolio || []).map((item, i) => (
          <div key={i} style={s.portItem}>
            <input
              placeholder="Title"
              value={item.title}
              onChange={(e) => updatePortfolio(i, "title", e.target.value)}
              style={s.input}
            />

            <input
              placeholder="Video Link"
              value={item.link}
              onChange={(e) => updatePortfolio(i, "link", e.target.value)}
              style={s.input}
            />

            <input
              placeholder="Thumbnail URL"
              value={item.thumbnail}
              onChange={(e) => updatePortfolio(i, "thumbnail", e.target.value)}
              style={s.input}
            />

            <button onClick={() => removePortfolio(i)} style={s.delete}>
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* SAVE */}
      <button onClick={saveProfile} style={s.save}>
        Save Profile
      </button>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20
  },

  logout: {
    background: "#ef4444",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    color: "white"
  },

  card: {
    background: "rgba(30,41,59,0.6)",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    backdropFilter: "blur(10px)"
  },

  input: {
    width: "100%",
    padding: 10,
    marginTop: 8,
    borderRadius: 8,
    border: "none",
    background: "#0f172a",
    color: "white"
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  addBtn: {
    background: "#22c55e",
    border: "none",
    padding: "6px 10px",
    borderRadius: 8,
    color: "white"
  },

  portItem: {
    marginTop: 10,
    padding: 10,
    background: "#1e293b",
    borderRadius: 10
  },

  delete: {
    marginTop: 6,
    background: "#ef4444",
    border: "none",
    padding: "6px 10px",
    borderRadius: 8,
    color: "white"
  },

  save: {
    width: "100%",
    padding: 12,
    background: "#7c3aed",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontWeight: 700
  },

  loader: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #333",
    borderTop: "4px solid #7c3aed",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  }
};