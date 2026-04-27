import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import HomeButton from "../components/HomeButton";

export default function Client() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login");

      const snap = await getDoc(doc(db, "users", u.uid));

      if (snap.data()?.role !== "client") {
        router.replace("/");
        return;
      }

      setUser(u);
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  return (
    <div style={s.page}>
      <HomeButton />

      <h1>Client Dashboard</h1>

      <button onClick={logout}>Logout</button>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#020617",
    color: "white",
    padding: 40
  }
}; 