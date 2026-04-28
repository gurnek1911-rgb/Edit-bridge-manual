import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  updateDoc,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  getDoc
} from "firebase/firestore";

const ADMIN_EMAIL = "admin@editbridge.com";

export default function Admin() {
  const router = useRouter();

  const [payments, setPayments] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState("");

  const adminUidRef = useRef(null);
  const unsubChatRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    let unsubPay;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (!u) return router.replace("/login");
      if (u.email !== ADMIN_EMAIL) return router.replace("/");

      adminUidRef.current = u.uid;

      unsubPay = onSnapshot(collection(db, "paymentRequests"), (snap) => {
        setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    });

    return () => {
      unsubAuth();
      unsubPay && unsubPay();
      unsubChatRef.current && unsubChatRef.current();
    };
  }, []);

  const openChat = async (uid, name) => {
    const chatId = [adminUidRef.current, uid].sort().join("_");

    const ref = doc(db, "chats", chatId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        users: [adminUidRef.current, uid],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastUpdated: serverTimestamp()
      });
    }

    setChatTarget({ chatId, name });
    setChatOpen(true);

    if (unsubChatRef.current) unsubChatRef.current();

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt")
    );

    unsubChatRef.current = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
  };

  const sendMsg = async () => {
    if (!msgText.trim()) return;

    await addDoc(collection(db, "chats", chatTarget.chatId, "messages"), {
      text: msgText,
      sender: adminUidRef.current,
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, "chats", chatTarget.chatId), {
      lastMessage: msgText,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    setMsgText("");
  };

  const approvePayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), {
      status: "approved"
    });

    await setDoc(doc(db, "clientAccess", p.uid + "_" + p.editorId), {
      uid: p.uid,
      editorId: p.editorId,
      status: "approved"
    });
  };

  return (
    <div style={s.page}>
      <h1>⚡ Admin Panel</h1>

      {payments.map(p => (
        <div key={p.id} style={s.card}>
          <div>
            <b>{p.email}</b>
            <div>Txn: {p.txnId}</div>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => approvePayment(p)} style={s.green}>
              Approve
            </button>

            <button onClick={() => openChat(p.uid, p.email)} style={s.purple}>
              Chat
            </button>
          </div>
        </div>
      ))}

      {chatOpen && (
        <div style={s.chat}>
          <div style={s.chatHeader}>
            {chatTarget?.name}
            <button onClick={() => setChatOpen(false)}>X</button>
          </div>

          <div style={s.body}>
            {messages.map(m => (
              <div key={m.id} style={s.msg}>{m.text}</div>
            ))}
            <div ref={bottomRef}/>
          </div>

          <div style={s.inputRow}>
            <input
              value={msgText}
              onChange={(e)=>setMsgText(e.target.value)}
              style={s.input}
            />
            <button onClick={sendMsg} style={s.send}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:{padding:20,color:"white",background:"linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",minHeight:"100vh"},
  card:{display:"flex",justifyContent:"space-between",padding:14,background:"#1e293b",marginTop:10,borderRadius:10},
  green:{background:"#22c55e",border:"none",padding:6,color:"white"},
  purple:{background:"#7c3aed",border:"none",padding:6,color:"white"},

  chat:{position:"fixed",bottom:0,right:0,width:320,height:420,background:"#0f172a",display:"flex",flexDirection:"column"},
  chatHeader:{padding:10,display:"flex",justifyContent:"space-between"},
  body:{flex:1,overflowY:"auto",padding:10},
  msg:{background:"#334155",padding:6,borderRadius:8,marginBottom:6},
  inputRow:{display:"flex",gap:6,padding:10},
  input:{flex:1,padding:6},
  send:{background:"#7c3aed",color:"white",border:"none",padding:6}
};