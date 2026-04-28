import { useRouter } from "next/router";
import { useState } from "react";
import { db, auth } from "../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

// 鉁� SET YOUR UPI ID HERE
const UPI_ID = "yourupi@okaxis";
const AMOUNT = 10;
const UPI_NAME = "EditBridge";

export default function PaymentPage() {
  const router = useRouter();
  const { chatId, editorId } = router.query;

  const [txnId, setTxnId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 鉁� UPI deep link for one-tap payment
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${AMOUNT}&cu=INR`;

  const submit = async () => {
    if (!txnId.trim()) return alert("Please enter the Transaction ID after paying");

    setSubmitting(true);

    try {
      await addDoc(collection(db, "paymentRequests"), {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        editorId: editorId || "",
        chatId: chatId || "",
        txnId: txnId.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (err) {
      alert("Error submitting: " + err.message);
    }

    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div style={s.page}>
        <style>{css}</style>
        <div style={s.successCard}>
          <div style={s.successIcon}>鉁�</div>
          <h2>Payment Submitted!</h2>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Admin will verify your payment and unlock the chat shortly.
          </p>
          <button onClick={() => router.push("/client")} style={s.backBtn}>
            鈫� Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <style>{css}</style>

      <div style={s.card}>
        {/* HEADER */}
        <h2 style={s.title}>馃挵 Unlock Chat</h2>
        <p style={s.subtitle}>Pay 鈧箋AMOUNT} to start chatting with this editor</p>

        {/* STEP 1 - PAY */}
        <div style={s.step}>
          <div style={s.stepNum}>1</div>
          <div style={s.stepText}>Pay via UPI</div>
        </div>

        {/* QR CODE */}
        <div style={s.qrWrap}>
          <img
            src="/qr.png"
            alt="UPI QR Code"
            style={s.qr}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>

        {/* UPI ID */}
        <div style={s.upiBox}>
          <span style={s.upiLabel}>UPI ID</span>
          <span style={s.upiId}>{UPI_ID}</span>
          <button
            style={s.copyBtn}
            onClick={() => {
              navigator.clipboard.writeText(UPI_ID);
              alert("UPI ID copied!");
            }}
          >
            Copy
          </button>
        </div>

        {/* ONE-TAP UPI BUTTON */}
        <a href={upiLink} style={s.upiDeepLink}>
          馃摬 Open UPI App to Pay 鈧箋AMOUNT}
        </a>

        <p style={s.orText}>鈥� or scan QR code above 鈥�</p>

        {/* STEP 2 - SUBMIT TXN */}
        <div style={s.step}>
          <div style={s.stepNum}>2</div>
          <div style={s.stepText}>Enter Transaction ID</div>
        </div>

        <input
          placeholder="Paste Transaction / UTR ID here"
          value={txnId}
          onChange={(e) => setTxnId(e.target.value)}
          style={s.input}
        />

        <button onClick={submit} style={s.submitBtn} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Payment 鉁�"}
        </button>

        <button onClick={() => router.back()} style={s.cancelBtn}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const css = `
  body { margin: 0; font-family: sans-serif; }
  a { text-decoration: none; }
`;

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "30px 16px",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    background: "rgba(30,41,59,0.9)",
    borderRadius: 20,
    padding: 28,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  title: { margin: "0 0 6px 0", fontSize: 22, fontWeight: 800, textAlign: "center" },
  subtitle: { color: "#94a3b8", fontSize: 14, textAlign: "center", margin: "0 0 24px 0" },
  step: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#7c3aed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },
  stepText: { fontWeight: 600, fontSize: 15 },
  qrWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 14,
    background: "white",
    borderRadius: 12,
    padding: 12,
  },
  qr: { width: 180, height: 180, objectFit: "contain" },
  upiBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#0f172a",
    borderRadius: 10,
    padding: "10px 14px",
    marginBottom: 12,
  },
  upiLabel: { color: "#94a3b8", fontSize: 12 },
  upiId: { flex: 1, fontWeight: 600, fontSize: 14 },
  copyBtn: {
    background: "#334155",
    border: "none",
    color: "white",
    padding: "4px 10px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
  },
  upiDeepLink: {
    display: "block",
    textAlign: "center",
    background: "#22c55e",
    color: "white",
    padding: "12px 0",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 15,
    marginBottom: 10,
  },
  orText: {
    textAlign: "center",
    color: "#475569",
    fontSize: 12,
    margin: "0 0 20px 0",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#0f172a",
    color: "white",
    fontSize: 14,
    outline: "none",
    marginBottom: 12,
    boxSizing: "border-box",
  },
  submitBtn: {
    width: "100%",
    padding: 13,
    background: "#7c3aed",
    border: "none",
    color: "white",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    marginBottom: 10,
  },
  cancelBtn: {
    width: "100%",
    padding: 11,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#94a3b8",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 14,
  },
  successCard: {
    textAlign: "center",
    padding: 40,
    maxWidth: 340,
    margin: "0 auto",
  },
  successIcon: { fontSize: 60, marginBottom: 16 },
  backBtn: {
    marginTop: 20,
    padding: "12px 24px",
    background: "#7c3aed",
    border: "none",
    color: "white",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 600,
  },
}; 