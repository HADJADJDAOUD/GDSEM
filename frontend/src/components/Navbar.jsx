import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";

export default function NavbarWithMenu({ view, setView }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    localStorage.removeItem("endDate");

    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const displayName = user?.username || user?.email || "Unknown user";
  const displayEmail = user?.email || localStorage.getItem("email") || "";

  const navButtons =
    user?.role === "RH"
      ? [
          { key: "rhChart", label: "Graphique RH" },
          { key: "Pending", label: "Demandes en attente" },
          { key: "AdminFormsPage", label: "Toutes les demandes" },
        ]
      : [
          { key: "calendar", label: "Calendrier" },
          
          { key: "request", label: "Demande d'absence" },
          { key: "rejected", label: "Absences refusées" },
          { key: "myRequests", label: "Mes demandes" },
        ];

  return (
    <header style={styles.header}>
      <div style={styles.row}>
        {/* left: logo + brand */}
        <div style={styles.left}>
          <img src="/logo.png" alt="Logo" style={styles.logo} />
          <div style={styles.brand}>Algérie Poste</div>
        </div>

        {/* inline nav buttons (same row) */}
        <div style={styles.inlineNav} aria-label="main navigation">
          {navButtons.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              style={{
                ...styles.navButton,
                ...(view === item.key ? styles.navButtonActive : {}),
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* right: user area */}
        <div style={styles.userArea}>
          <div style={styles.userInfo}>
            {user?.role && <div style={styles.role}>{user.role}</div>}
            <div style={styles.avatar}>
              {displayName[0]?.toUpperCase() || "U"}
            </div>
            <div style={styles.text}>
              <div style={styles.name}>{displayName}</div>

              {displayEmail && <div style={styles.email}>{displayEmail}</div>}
            </div>
          </div>

          <button onClick={handleLogout} style={styles.button}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    width: "100%",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    fontFamily: "Eurostile, system-ui, sans-serif",
    background:
      "linear-gradient(90deg, rgb(0, 61, 114) 0%, rgb(0, 91, 172) 50%, rgb(0, 62, 116) 100%)",
    color: "white",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    justifyContent: "space-between",
    padding: "0.6rem 1rem",
  },
  left: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 },
  logo: {
    height: 40,
    width: "auto",
    borderRadius: 4,
    objectFit: "contain",
    background: "white",
    padding: "2px 6px",
  },
  brand: { fontSize: "1.05rem", fontWeight: 600, whiteSpace: "nowrap" },

  /* Inline nav sits between brand and spacer */
  inlineNav: {
    display: "flex",
    gap: 8,
    alignItems: "center",

    /* allow horizontal scroll on very small widths without wrapping */
    overflowX: "auto",
    paddingBottom: 2,
    flex: 1,
    justifyContent: "center",
    padding: "0 10px",
    maxWidth: "45%" /* keep nav from swallowing whole row; tweak to taste */,
    whiteSpace: "nowrap",
  },
  navButton: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: "transparent",
    color: "white",
    fontWeight: 300,
    opacity: 0.95,
    whiteSpace: "nowrap",
  },
  navButtonActive: {
    background: "white",
    color: "rgb(50, 70, 83)",
  },

  spacer: { flex: 1, minWidth: 8 },

  userArea: { display: "flex", alignItems: "center", gap: 12 },
  userInfo: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.15)",
    fontWeight: 700,
    fontSize: "1rem",
    color: "white",
  },
  text: { display: "flex", flexDirection: "column", lineHeight: 1.1 },
  name: { fontSize: "0.9rem", fontWeight: 600 },
  email: { fontSize: "0.75rem", color: "rgba(255,255,255,0.9)" },
  button: {
    padding: "0.35rem 0.7rem",
    border: "1px solid rgba(255,255,255,0.6)",
    background: "transparent",
    cursor: "pointer",
    borderRadius: 6,
    color: "white",
    fontWeight: 600,
  },
  role: {
    fontSize: "0.85rem",
    fontWeight: 400,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
};
