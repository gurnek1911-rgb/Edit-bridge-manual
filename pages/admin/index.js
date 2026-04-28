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

  // AUTH
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

  // OPEN CHAT
  const openChat = async (targetUid, name) => {
    const chatId = [adminUidRef.current, targetUid].sort().join("_");

    const chatRef = doc(db, "chats", chatId);
    const snap = await getDoc(chatRef);

    if (!snap.exists()) {
      await setDoc(chatRef, {
        users: [adminUidRef.current, targetUid],
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

  // APPROVE
  const approvePayment = async (p) => {
    await updateDoc(doc(db, "paymentRequests", p.id), {
      status: "approved"
    });

    await setDoc(doc(db, "clientAccess", p.uid + "_" + p.editorId), {
      uid: p.uid,
      editorId: p.editorId,
      status: "approved",
      chatId: p.chatId
    });
  };

  return (
    <div style={s.page}>
      <h1>Admin Panel</h1>

      {payments.map(p => (
        <div key={p.id} style={s.card}>
          <div>
            <b>{p.email}</b>
            <div>Txn: {p.txnId}</div>
          </div>

          <div>
            <button onClick={() => approvePayment(p)}>Approve</button>
            <button onClick={() => openChat(p.uid, p.email)}>Chat</button>
          </div>
        </div>
      ))}

      {chatOpen && (
        <div style={s.chat}>
          <div>{chatTarget?.name}</div>

          <div style={s.body}>
            {messages.map(m => (
              <div key={m.id}>{m.text}</div>
            ))}
            <div ref={bottomRef}/>
          </div>

          <input
            value={msgText}
            onChange={(e)=>setMsgText(e.target.value)}
          />
          <button onClick={sendMsg}>Send</button>
        </div>
      )}
    </div>
  );
}

const s = {
  page:{padding:20,color:"white",background:"#020617",minHeight:"100vh"},
  card:{display:"flex",justifyContent:"space-between",padding:10,background:"#1e293b",marginTop:10},
  chat:{position:"fixed",bottom:0,right:0,width:300,background:"#111"},
  body:{height:200,overflowY:"auto"}
};