import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Editor() {
  const [editor, setEditor] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.replace("/login?type=editor");

      try {
        // 🔥 DIRECT DOC FETCH (NO LOOP)
        const snap = await getDoc(doc(db, "editors", u.uid));

        if (!snap.exists()) {
          alert("Editor profile not found");
          return router.replace("/login?type=editor");
        }

        if (!snap.data().approved) {
          alert("Not approved yet");
          return router.replace("/");
        }

        setEditor(snap.data());

      } catch (err) {
        console.log(err);
      }
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (!editor) return <div style={{color:"white"}}>Loading...</div>;

  return (
    <div style={{color:"white", padding:20}}>
      <h1>🎬 Editor Dashboard</h1>

      <p>Name: {editor.name}</p>
      <p>Email: {editor.email}</p>
      <p>Skills: {editor.skills?.join(", ")}</p>
      <p>Price: ₹{editor.price}</p>

      <button onClick={() => router.push("/editor/inbox")}>
        Inbox
      </button>

      <button onClick={logout}>
        Logout
      </button>
    </div>
  );
}