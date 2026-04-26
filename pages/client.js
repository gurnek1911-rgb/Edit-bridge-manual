import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

export default function ClientPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [editors, setEditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);

      try {
        const snap = await getDocs(collection(db, "editors"));
        const approvedEditors = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((item) => item.approved === true);
        setEditors(approvedEditors);
      } catch (err) {
        console.error("Failed to fetch editors:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const filtered = editors.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name?.toLowerCase().includes(q) ||
      e.skills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div style={s.loadingScreen}>
        <div style={s.spinner} />
        <p style={{ color: "#94a3b8", marginTop: 14, fontSize: 14 }}>
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div style={s.page}>

        {/* ── Topbar ── */}
        <div style={s.topbar}>
          <div style={s.logoWrap}>
            <div style={s.logoIcon}>🎬</div>
            <div>
              <div style={s.logoText}>EditBridge</div>
              <div style={s.logoBadge}>Client Dashboard</div>
            </div>
          </div>

          <div style={s.topRight}>
            <div style={s.emailPill}>{user?.email}</div>
            <button onClick={logout} style={s.logoutBtn}>
              Logout
            </button>
          </div>
        </div>

        {/* ── Hero ── */}
        <div style={s.hero}>
          <div style={s.heroGlow} />
          <h2 style={s.heroTitle}>Find Skilled Video Editors</h2>
          <p style={s.heroText}>
            Connect with talented editors, negotiate deals, and grow your content.
          </p>
          <div style={s.heroStats}>
            <div style={s.stat}>
              <div style={s.statNum}>{editors.length}</div>
              <div style={s.statLabel}>Editors Available</div>
            </div>
            <div style={s.statDivider} />
            <div style={s.stat}>
              <div style={s.statNum}>
                {editors.filter((e) => e.active).length}
              </div>
              <div style={s.statLabel}>Online Now</div>
            </div>
            <div style={s.statDivider} />
            <div style={s.stat}>
              <div style={s.statNum}>₹</div>
              <div style={s.statLabel}>Negotiate Price</div>
            </div>
          </div>
        </div>

        {/* ── Search ── */}
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            placeholder="Search by name or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.searchInput}
          />
        </div>

        {/* ── Section title ── */}
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>🔥 Marketplace Editors</h2>
          <span style={s.sectionCount}>{filtered.length} found</span>
        </div>

        {/* ── Grid ── */}
        {filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
            <p style={{ color: "#64748b", fontWeight: 600 }}>No editors found</p>
            <p style={{ color: "#334155", fontSize: 13, marginTop: 4 }}>
              Try a different search term
            </p>
          </div>
        ) : (
          <div style={s.grid}>
            {filtered.map((editor) => (
              <EditorCard
                key={editor.id}
                editor={editor}
                onChat={() =>
                  // chatId = clientUid_editorId  (consistent format)
                  router.push(`/chat/${user.uid}_${editor.id}`)
                }
              />
            ))}
          </div>
        )}

      </div>
    </>
  );
}

function EditorCard({ editor, onChat }) {
  return (
    <div style={c.card} className="editor-card">
      {/* Top row */}
      <div style={c.cardTop}>
        <div style={c.avatarCircle}>
          {(editor.name?.[0] || "E").toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={c.editorName}>{editor.name || "Unnamed Editor"}</div>
          <div style={{
            ...c.statusDot,
            color: editor.active ? "#10b981" : "#64748b",
          }}>
            {editor.active ? "● Online" : "○ Offline"}
          </div>
        </div>
        <div style={c.priceBadge}>
          ₹{editor.price || "?"}
        </div>
      </div>

      {/* Skills */}
      <div style={c.skillsRow}>
        {editor.skills?.length > 0
          ? editor.skills.slice(0, 4).map((skill, i) => (
              <span key={i} style={c.skillTag}>{skill}</span>
            ))
          : <span style={c.noSkill}>No skills listed</span>
        }
      </div>

      {/* Stats row */}
      {(editor.totalDeals || editor.earnings) ? (
        <div style={c.statsRow}>
          {editor.totalDeals ? (
            <span style={c.miniStat}>🤝 {editor.totalDeals} deals</span>
          ) : null}
          {editor.earnings ? (
            <span style={c.miniStat}>💰 ₹{editor.earnings} earned</span>
          ) : null}
        </div>
      ) : null}

      {/* CTA */}
      <button onClick={onChat} style={c.chatBtn} className="chat-btn">
        💬 Chat Now
      </button>
    </div>
  );
}

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  body { font-family: 'Segoe UI', system-ui, sans-serif; }

  .editor-card {
    animation: fadeUp 0.3s ease both;
  }
  .editor-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(124,58,237,0.25) !important;
    border-color: rgba(124,58,237,0.35) !important;
  }

  .chat-btn:hover {
    background: #7c3aed !important;
    transform: scale(1.02);
  }
  .chat-btn:active {
    transform: scale(0.98);
  }

  input:focus { outline: none; }
  input::placeholder { color: #475569; }
  button { cursor: pointer; transition: all 0.18s ease; }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
`;

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg,#080d1a 0%,#0f172a 50%,#160a2a 100%)",
    color: "white",
    padding: "0 0 60px",
  },

  loadingScreen: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#080d1a",
    color: "white",
  },

  spinner: {
    width: 32,
    height: 32,
    border: "3px solid rgba(124,58,237,0.15)",
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(8,13,26,0.85)",
    backdropFilter: "blur(14px)",
    position: "sticky",
    top: 0,
    zIndex: 20,
    flexWrap: "wrap",
    gap: 12,
  },

  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 11,
  },

  logoIcon: {
    fontSize: 28,
    width: 44,
    height: 44,
    borderRadius: 13,
    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: "-0.4px",
  },

  logoBadge: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },

  topRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },

  emailPill: {
    fontSize: 12,
    color: "#94a3b8",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: "5px 12px",
  },

  logoutBtn: {
    padding: "8px 14px",
    background: "#ef4444",
    border: "none",
    borderRadius: 10,
    color: "white",
    fontWeight: 600,
    fontSize: 13,
  },

  hero: {
    margin: "24px 20px",
    padding: "28px 24px",
    borderRadius: 20,
    background: "rgba(124,58,237,0.08)",
    border: "1px solid rgba(124,58,237,0.15)",
    position: "relative",
    overflow: "hidden",
  },

  heroGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: "50%",
    background: "radial-gradient(circle,rgba(124,58,237,0.2),transparent 70%)",
    pointerEvents: "none",
  },

  heroTitle: {
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: "-0.5px",
    marginBottom: 8,
  },

  heroText: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: 20,
  },

  heroStats: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
  },

  stat: {
    textAlign: "center",
  },

  statNum: {
    fontWeight: 800,
    fontSize: 22,
    color: "#a78bfa",
  },

  statLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 30,
    background: "rgba(255,255,255,0.07)",
  },

  searchWrap: {
    margin: "0 20px 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 13,
    padding: "10px 15px",
  },

  searchIcon: {
    fontSize: 16,
    flexShrink: 0,
  },

  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: 14,
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    marginBottom: 16,
  },

  sectionTitle: {
    fontWeight: 700,
    fontSize: 17,
  },

  sectionCount: {
    fontSize: 12,
    color: "#64748b",
    background: "rgba(255,255,255,0.04)",
    padding: "3px 10px",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.07)",
  },

  empty: {
    textAlign: "center",
    padding: "60px 20px",
    color: "white",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
    padding: "0 20px",
  },
};

const c = {
  card: {
    background: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 18,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
    cursor: "default",
  },

  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    background: "linear-gradient(135deg,#7c3aed,#3b82f6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 18,
    flexShrink: 0,
  },

  editorName: {
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: "-0.2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  statusDot: {
    fontSize: 11,
    fontWeight: 600,
    marginTop: 3,
  },

  priceBadge: {
    background: "rgba(124,58,237,0.15)",
    border: "1px solid rgba(124,58,237,0.25)",
    color: "#a78bfa",
    fontWeight: 700,
    fontSize: 13,
    padding: "4px 10px",
    borderRadius: 8,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  skillsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },

  skillTag: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#cbd5e1",
    fontSize: 11,
    padding: "3px 9px",
    borderRadius: 6,
    fontWeight: 500,
  },

  noSkill: {
    color: "#334155",
    fontSize: 12,
  },

  statsRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  miniStat: {
    fontSize: 11,
    color: "#64748b",
  },

  chatBtn: {
    marginTop: "auto",
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
    color: "white",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: "-0.2px",
    boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
  },
};