import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from "firebase/firestore";

export default function ChatPage() {
  const router = useRouter();
  const { chatId } = router.query;

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const [deal, setDeal] = useState(null);
  const [showDealBox, setShowDealBox] = useState(false);
  const [dealAmount, setDealAmount] = useState("");
  const [counterAmount, setCounterAmount] = useState("");

  const bottomRef = useRef(null);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/client-login");
      else setUser(u);
    });

    return () => unsub();
  }, []);

  // Messages
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data()
        }))
      );

      setLoading(false);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({
          behavior: "smooth"
        });
      }, 100);
    });

    return () => unsub();
  }, [chatId]);

  // Deal live
  useEffect(() => {
    if (!chatId) return;

    const unsub = onSnapshot(doc(db, "deals", chatId), (snap) => {
      if (snap.exists()) {
        setDeal(snap.data());
      } else {
        setDeal(null);
      }
    });

    return () => unsub();
  }, [chatId]);

  // Send Message
  const send = async (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    await addDoc(collection(db, "messages"), {
      chatId,
      text,
      senderId: user.uid,
      senderEmail: user.email,
      createdAt: new Date()
    });

    setText("");
  };

  // Create Deal (Client/Admin)
  const createDeal = async () => {
    if (!dealAmount) return alert("Enter amount");

    await setDoc(doc(db, "deals", chatId), {
      chatId,
      amount: Number(dealAmount),
      status: "pending",
      requestedBy: user.email,
      platformFee: Number(dealAmount) * 0.1,
      editorEarning: Number(dealAmount) * 0.9,
      createdAt: new Date()
    });

    setShowDealBox(false);
    setDealAmount("");
  };

  // Accept
  const acceptDeal = async () => {
    const ok = confirm("Accept this deal?");
    if (!ok) return;

    const ok2 = confirm("Final confirmation?");
    if (!ok2) return;

    await updateDoc(doc(db, "deals", chatId), {
      status: "accepted"
    });
  };

  // Reject
  const rejectDeal = async () => {
    const ok = confirm("Reject deal?");
    if (!ok) return;

    const ok2 = confirm("Are you sure?");
    if (!ok2) return;

    await updateDoc(doc(db, "deals", chatId), {
      status: "rejected"
    });
  };

  // Counter Offer
  const counterOffer = async () => {
    if (!counterAmount) return;

    await updateDoc(doc(db, "deals", chatId), {
      amount: Number(counterAmount),
      platformFee: Number(counterAmount) * 0.1,
      editorEarning: Number(counterAmount) * 0.9,
      status: "countered"
    });

    setCounterAmount("");
  };

  // Payment Received
  const markPaid = async () => {
    await updateDoc(doc(db, "deals", chatId), {
      status: "paid"
    });

    // add earning score to editor
    const editorId = chatId.split("_").pop();

    const ref = doc(db, "editors", editorId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const old = snap.data().earnings || 0;

      await updateDoc(ref, {
        earnings: old + deal.editorEarning,
        totalDeals: (snap.data().totalDeals || 0) + 1
      });
    }
  };

  if (!chatId || !user) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button
          style={styles.back}
          onClick={() => router.back()}
        >
          ← Back
        </button>

        <h2>💬 Deal Chat</h2>

        <button
          style={styles.dealBtn}
          onClick={() => setShowDealBox(!showDealBox)}
        >
          💼 Deal
        </button>
      </div>

      {/* Deal Create */}
      {showDealBox && (
        <div style={styles.panel}>
          <input
            placeholder="Deal Amount ₹"
            value={dealAmount}
            onChange={(e) =>
              setDealAmount(e.target.value)
            }
            style={styles.input}
          />

          <button
            style={styles.green}
            onClick={createDeal}
          >
            Send Deal Offer
          </button>
        </div>
      )}

      {/* Deal Status */}
      {deal && (
        <div style={styles.dealCard}>
          <h3>💼 Active Deal</h3>

          <p>Amount: ₹{deal.amount}</p>
          <p>Status: {deal.status}</p>
          <p>Platform Fee: ₹{deal.platformFee}</p>
          <p>Editor Earns: ₹{deal.editorEarning}</p>

          {(deal.status === "pending" ||
            deal.status === "countered") && (
            <>
              <button
                style={styles.green}
                onClick={acceptDeal}
              >
                Accept
              </button>

              <button
                style={styles.red}
                onClick={rejectDeal}
              >
                Reject
              </button>

              <input
                placeholder="Counter Offer ₹"
                value={counterAmount}
                onChange={(e) =>
                  setCounterAmount(e.target.value)
                }
                style={styles.input}
              />

              <button
                style={styles.blue}
                onClick={counterOffer}
              >
                Counter Offer
              </button>
            </>
          )}

          {deal.status === "accepted" && (
            <button
              style={styles.green}
              onClick={markPaid}
            >
              Payment Received
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div style={styles.chatBox}>
        {loading ? (
          <p>Loading chat...</p>
        ) : (
          messages.map((m) => {
            const mine =
              m.senderId === user.uid;

            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: mine
                    ? "flex-end"
                    : "flex-start",
                  marginBottom: "10px"
                }}
              >
                <div
                  style={{
                    ...styles.msg,
                    background: mine
                      ? "#7c3aed"
                      : "#1e293b"
                  }}
                >
                  <div>{m.text}</div>
                  <small>
                    {mine
                      ? "You"
                      : m.senderEmail}
                  </small>
                </div>
              </div>
            );
          })
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* Input */}
      <form
        onSubmit={send}
        style={styles.footer}
      >
        <input
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          placeholder="Type message..."
          style={styles.input}
        />

        <button
          type="submit"
          style={styles.send}
        >
          Send
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#0f172a,#1e1b4b,#581c87)",
    color: "white",
    display: "flex",
    flexDirection: "column"
  },

  loading: {
    minHeight: "100vh",
    background: "#0f172a",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  header: {
    padding: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  back: {
    padding: "10px",
    border: "none",
    borderRadius: "10px"
  },

  dealBtn: {
    padding: "10px 14px",
    background: "#f59e0b",
    border: "none",
    borderRadius: "10px",
    color: "white"
  },

  panel: {
    padding: "15px"
  },

  dealCard: {
    margin: "15px",
    padding: "18px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.08)"
  },

  chatBox: {
    flex: 1,
    overflowY: "auto",
    padding: "20px"
  },

  msg: {
    padding: "12px",
    borderRadius: "14px",
    maxWidth: "70%"
  },

  footer: {
    display: "flex",
    gap: "10px",
    padding: "15px"
  },

  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "12px",
    border: "none"
  },

  send: {
    padding: "12px 18px",
    background: "#8b5cf6",
    border: "none",
    borderRadius: "12px",
    color: "white"
  },

  green: {
    padding: "10px",
    marginTop: "10px",
    background: "#10b981",
    border: "none",
    borderRadius: "10px",
    color: "white",
    marginRight: "8px"
  },

  red: {
    padding: "10px",
    marginTop: "10px",
    background: "#ef4444",
    border: "none",
    borderRadius: "10px",
    color: "white",
    marginRight: "8px"
  },

  blue: {
    padding: "10px",
    marginTop: "10px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "10px",
    color: "white"
  }
};