import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function Editor() {
  const router = useRouter();
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login?type=editor");
        return;
      }

      const uid = u.uid;

      // 🔥 CHECK ROLE FIRST
      const userSnap = await getDoc(doc(db, "users", uid));

      if (!userSnap.exists() || userSnap.data().role !== "editor") {
        router.replace("/client");
        return;
      }

      // 🔥 GET EDITOR DATA
      const editorSnap = await getDoc(doc(db, "editors", uid));

      if (!editorSnap.exists()) {
        router.replace("/login?type=editor");
        return;
      }

      if (!editorSnap.data().approved) {
        alert("Wait for approval");
        return;
      }

      setEditor(editorSnap.data());
    });

    return () => unsub();
  }, []);

  if (!editor) return <div>Loading...</div>;

  return (
    <div style={{padding:20}}>
      <h1>Editor Dashboard</h1>

      <h2>{editor.name}</h2>
      <p>{editor.email}</p>
      <p>{editor.skills.join(", ")}</p>
      <p>₹{editor.price}</p>
    </div>
  );
}