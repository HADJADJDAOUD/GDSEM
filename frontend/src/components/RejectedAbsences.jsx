import React, { useEffect, useState } from "react";
import api from "../api/api";

export default function RejectedAbsences() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchRejected = async () => {
    try {
      const res = await api.get("/myRejectedAbsences");
      setItems(res.data.data || []);
    } catch (err) {
      console.error("fetchRejected error:", err);
      alert("Failed to load rejected absences");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejected();
  }, []);

  const openDetails = (abs) => setSelected(abs);
  const closeDetails = () => setSelected(null);

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 12 }}>My Rejected Absence Requests</h2>

      <div
        style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #eee" }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#fafafa" }}>
            <tr>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Start</th>
              <th style={thStyle}>End</th>
              <th style={thStyle}>Submitted</th>
              <th style={thStyle}>Justification</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: 16, textAlign: "center" }}>
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 16, textAlign: "center" }}>
                  No rejected requests 🎉
                </td>
              </tr>
            ) : (
              items.map((abs) => (
                <tr
                  key={abs._id}
                  onClick={() => openDetails(abs)}
                  style={{
                    borderTop: "1px solid #f0f0f0",
                    cursor: "pointer",
                  }}
                >
                  <td style={tdStyle}>{abs.type}</td>
                  <td style={tdStyle}>{formatDate(abs.startDate)}</td>
                  <td style={tdStyle}>{formatDate(abs.endDate)}</td>
                  <td style={tdStyle}>{formatDate(abs.createdAt)}</td>
                  <td
                    style={{
                      ...tdStyle,
                      color: "#b00020",
                      fontStyle: "italic",
                    }}
                  >
                    {abs.justification}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details modal */}
      {selected && (
        <div style={modalBackdropStyle} onClick={closeDetails}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0 }}>Rejected Absence Details</h3>
              <button onClick={closeDetails} style={closeBtnStyle}>
                ✕
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={detailRow}>
                <strong>Type:</strong> {selected.type}
              </div>
              <div style={detailRow}>
                <strong>Start:</strong> {formatDate(selected.startDate)}
              </div>
              <div style={detailRow}>
                <strong>End:</strong> {formatDate(selected.endDate)}
              </div>
              <div style={detailRow}>
                <strong>Submitted:</strong> {formatDate(selected.createdAt)}
              </div>
              <div style={detailRow}>
                <strong>Justification:</strong>{" "}
                <span style={{ color: "#b00020", fontStyle: "italic" }}>
                  {selected.justification}
                </span>
              </div>

              {selected.proofUrl && (
                <div style={detailRow}>
                  <strong>Proof:</strong>{" "}
                  {/\.(jpg|jpeg|png|gif)$/i.test(selected.proofUrl) ? (
                    <a
                      href={selected.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={selected.proofUrl}
                        alt="Proof"
                        style={{
                          display: "block",
                          maxWidth: "200px",
                          maxHeight: "200px",
                          marginTop: 8,
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      />
                    </a>
                  ) : (
                    <a
                      href={selected.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Proof
                    </a>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, textAlign: "right" }}>
              <button onClick={closeDetails} style={secondaryBtnStyle}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* styles */
const thStyle = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 13,
  color: "#333",
  borderBottom: "1px solid #eee",
};

const tdStyle = {
  padding: "10px 12px",
  fontSize: 14,
  color: "#111",
};

const formatDate = (v) => {
  if (!v) return "—";
  try {
    return new Date(v).toISOString().split("T")[0];
  } catch {
    return v;
  }
};

const modalBackdropStyle = {
  position: "fixed",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalStyle = {
  width: 600,
  maxWidth: "95%",
  background: "#fff",
  padding: 18,
  borderRadius: 10,
  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
};

const detailRow = { marginBottom: 8, fontSize: 14 };

const closeBtnStyle = {
  background: "transparent",
  border: "none",
  fontSize: 18,
  cursor: "pointer",
};

const secondaryBtnStyle = {
  background: "#eee",
  color: "#111",
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};
