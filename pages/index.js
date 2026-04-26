import Link from "next/link";

export default function Home() {
  return (
    <div style={styles.page}>
      <div style={styles.overlay}></div>

      <div style={styles.container}>
        <h1 style={styles.title}>🎬 EditBridge</h1>
        <p style={styles.subtitle}>
          Connect Clients with Skilled Editors
        </p>

        <div style={styles.card}>
          <h2 style={styles.heading}>Choose Login Type</h2>

          <Link href="/login" style={styles.clientBtn}>
            👤 Client Login
          </Link>

          <Link href="/editor-login" style={styles.editorBtn}>
            🎥 Editor Login
          </Link>

          <Link href="/admin-login" style={styles.adminBtn}>
            🛡️ Admin Login
          </Link>

          <Link href="/editor-register" style={styles.registerBtn}>
            ✨ Become an Editor
          </Link>
        </div>

        <p style={styles.footer}>
          Our goal is helping students earn through editing skills.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#0f172a,#1e1b4b,#581c87,#312e81)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    position: "relative",
    overflow: "hidden"
  },

  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at top right, rgba(255,255,255,0.08), transparent 30%)"
  },

  container: {
    position: "relative",
    zIndex: 2,
    textAlign: "center",
    width: "100%",
    maxWidth: "450px",
    color: "white"
  },

  title: {
    fontSize: "52px",
    marginBottom: "10px",
    fontWeight: "800"
  },

  subtitle: {
    opacity: 0.85,
    marginBottom: "30px",
    fontSize: "18px"
  },

  card: {
    background: "rgba(255,255,255,0.08)",
    padding: "30px",
    borderRadius: "22px",
    backdropFilter: "blur(12px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
  },

  heading: {
    marginBottom: "20px",
    fontSize: "24px"
  },

  clientBtn: button("#06b6d4"),
  editorBtn: button("#8b5cf6"),
  adminBtn: button("#ef4444"),
  registerBtn: button("#10b981"),

  footer: {
    marginTop: "25px",
    opacity: 0.75,
    fontSize: "14px"
  }
};

function button(color) {
  return {
    display: "block",
    width: "100%",
    padding: "14px",
    marginBottom: "14px",
    borderRadius: "14px",
    background: color,
    color: "white",
    textDecoration: "none",
    fontWeight: "700",
    fontSize: "16px",
    transition: "0.2s"
  };
}