// pages/editor/index.js

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");

      setUser(u);

      const ref = doc(db, "editors", u.uid);

      const unsubDoc = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          const data = snap.data();

          setProfile({
            ...data,
            skills: Array.isArray(data.skills)
              ? data.skills.join(", ")
              : data.skills || ""
          });
        }

        setLoading(false);
      });

      return () => unsubDoc();
    });

    return () => unsub();
  }, []);

  const saveProfile = async () => {
    if (!user) return;

    await setDoc(
      doc(db, "editors", user.uid),
      {
        ...profile,
        skills: profile.skills.split(",").map(s => s.trim()),
        email: user.email,
        active: true,
        approved: true
      },
      { merge: true }
    );

    alert("✅ Profile saved");
  };

  if (loading) return <div style={{color:"white"}}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2>🎬 Editor Dashboard</h2>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => router.push("/editor/inbox")} style={s.inbox}>
            📩 Inbox
          </button>

          <button onClick={() => signOut(auth)} style={s.logout}>
            Logout
          </button>
        </div>
      </div>

      <div style={s.card}>
        <h3>Profile</h3>

        <input
          placeholder="Name"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          style={s.input}
        />

        <textarea
          placeholder="Bio"
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          style={s.input}
        />

        <input
          placeholder="Skills"
          value={profile.skills}
          onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
          style={s.input}
        />

        <input
          placeholder="Price ₹"
          value={profile.price}
          onChange={(e) => setProfile({ ...profile, price: e.target.value })}
          style={s.input}
        />
      </div>

      <button onClick={saveProfile} style={s.save}>
        Save Profile
      </button>
    </div>
  );
}

const s = {
  page:{minHeight:"100vh",padding:20,background:"linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",color:"white"},
  header:{display:"flex",justifyContent:"space-between",marginBottom:20},
  logout:{background:"#ef4444",border:"none",padding:"8px 14px",borderRadius:8,color:"white"},
  inbox:{background:"#7c3aed",border:"none",padding:"8px 14px",borderRadius:8,color:"white"},
  card:{background:"rgba(30,41,59,0.6)",padding:16,borderRadius:14,marginBottom:16},
  input:{width:"100%",padding:10,marginTop:8,borderRadius:8,border:"none",background:"#0f172a",color:"white"},
  save:{width:"100%",padding:12,background:"#7c3aed",border:"none",borderRadius:10,color:"white"}
};