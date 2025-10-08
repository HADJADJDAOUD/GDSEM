import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";

export default function NavbarWithMenu({ view, setView }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    localStorage.clear();
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
    <aside style={styles.sidebar}>
      <div style={styles.logoSection}>
        <img src="/logo.png" alt="Logo" style={styles.logo} />
        <div style={styles.brand}>Algérie Poste</div>
      </div>

      <nav style={styles.nav}>
        {navButtons.map((item) => (
          <button
            key={item.key}
            onClick={() => setView(item.key)}
            style={{
              ...styles.navButton,
              ...(view === item.key ? styles.activeButton : {}),
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div style={styles.footer}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>{displayName[0]?.toUpperCase() || "U"}</div>
          <div>
            <div style={styles.name}>{displayName}</div>
            <div style={styles.email}>{displayEmail}</div>
            <div style={styles.role}>{user?.role}</div>
          </div>
        </div>

        <button onClick={handleLogout} style={styles.logoutButton}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "240px",
    background:
      "linear-gradient(180deg, rgb(0, 61, 114) 0%, rgb(0, 91, 172) 100%)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "1rem 0.8rem",
    boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
  },
  logoSection: {
    textAlign: "center",
    marginBottom: "1rem",
  },
  logo: {
    height: 50,
    borderRadius: 6,
    background: "white",
    padding: "4px 8px",
  },
  brand: {
    fontWeight: 600,
    fontSize: "1.1rem",
    marginTop: "0.5rem",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    flex: 1,
  },
  navButton: {
    padding: "10px 12px",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "white",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: 400,
    transition: "background 0.2s",
  },
  activeButton: {
    background: "white",
    color: "rgb(50,70,83)",
    fontWeight: 600,
  },
  footer: {
    borderTop: "1px solid rgba(255,255,255,0.3)",
    paddingTop: "0.8rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "1rem",
  },
  name: { fontSize: "0.9rem", fontWeight: 600 },
  email: { fontSize: "0.75rem", color: "rgba(255,255,255,0.9)" },
  role: { fontSize: "0.75rem", color: "rgba(255,255,255,0.7)" },
  logoutButton: {
    border: "1px solid rgba(255,255,255,0.6)",
    borderRadius: 6,
    background: "transparent",
    color: "white",
    cursor: "pointer",
    padding: "0.4rem 0.7rem",
    fontWeight: 600,
  },
};
