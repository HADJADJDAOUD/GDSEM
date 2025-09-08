import React, { useEffect, useState } from "react";
import api from "../api/api";

/**
 * PendingRequests.jsx
 * - fetches GET /absences/pending
 * - shows a table with username, email, role, type, status
 * - clicking a row opens a modal with full details
 * - modal offers Accept and Delete (calls PATCH /absences/:id/accept and DELETE /absences/:id)
 *
 * Assumptions:
 * - api is an axios instance that includes Authorization header
 * - backend returns { status, results, data: [ { userId, username, email, role, absence } ] }
 */

export default function PendingRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // { userId, username, email, role, absence }
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/absences/pending");
      const data = res?.data?.data || [];
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchPending error:", err);
      setError("Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (row) => {
    setSelected(row);
    console.log("Selected row:", row.absence);
  };

  const closeDetails = () => {
    setSelected(null);
  };

  const acceptAbsence = async (absenceId) => {
    if (!absenceId) return;
    if (!confirm("Accept this absence?")) return;
    setActionLoading(true);
    try {
      await api.patch(`/absences/${absenceId}/accept`);
      await fetchPending();
      setSelected(null);
    } catch (err) {
      console.error("acceptAbsence error:", err);
      alert(err?.response?.data?.message || "Failed to accept");
    } finally {
      setActionLoading(false);
    }
  };


  const declineAbsence = async (absenceId) => {
    if (!absenceId) return;
    const justification = prompt(
      "Enter justification for rejecting this absence:"
    );
    if (!justification) return;

    setActionLoading(true);
    try {
      await api.post(`/absences/${absenceId}/decline`, { justification });
      await fetchPending();
      setSelected(null);
    } catch (err) {
      console.error("declineAbsence error:", err);
      alert(err?.response?.data?.message || "Failed to decline");
    } finally {
      setActionLoading(false);
    }
  };
  console.log("items:");
  if (loading) return <div>Loading pending requests...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 12 }}>Pending Absence Requests</h2>

      <div
        style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #eee" }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#fafafa" }}>
            <tr>
              <th style={thStyle}>Username</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 16, textAlign: "center" }}>
                  No pending requests
                </td>
              </tr>
            ) : (
              items.map((row) => {
                const abs = row.absence || {};
                return (
                  <tr
                    key={abs._id || Math.random()}
                    onClick={() => openDetails(row)}
                    style={{
                      cursor: "pointer",
                      borderTop: "1px solid #f0f0f0",
                    }}
                  >
                    <td style={tdStyle}>{row.username || "—"}</td>
                    <td style={tdStyle}>{row.email || "—"}</td>
                    <td style={tdStyle}>
                      {row.role || (abs.user && abs.user.role) || "—"}
                    </td>
                    <td style={tdStyle}>{abs.type}</td>
                    <td style={tdStyle}>{abs.status}</td>
                    <td style={tdStyle}>{formatDate(abs.createdAt)}</td>
                  </tr>
                );
              })
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
              <h3 style={{ margin: 0 }}>Absence Details</h3>
              <button onClick={closeDetails} style={closeBtnStyle}>
                ✕
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={detailRow}>
                <strong>User:</strong> {selected.username} &lt;{selected.email}
                &gt;
              </div>
              <div style={detailRow}>
                <strong>Role:</strong> {selected.role}
              </div>

              <hr style={{ margin: "12px 0" }} />

              <div style={detailRow}>
                <strong>Type:</strong> {selected.absence.type}
              </div>
              <div style={detailRow}>
                <strong>Status:</strong> {selected.absence.status}
              </div>
              <div style={detailRow}>
                <strong>Start:</strong> {formatDate(selected.absence.startDate)}
              </div>
              <div style={detailRow}>
                <strong>End:</strong> {formatDate(selected.absence.endDate)}
              </div>
              <div style={detailRow}>
                <strong>Submitted:</strong>{" "}
                {formatDate(selected.absence.createdAt)}
              </div>

              {selected.absence.proofUrl && (
                <div style={detailRow}>
                  <strong>Proof:</strong>{" "}
                  {/\.(jpg|jpeg|png|gif)$/i.test(selected.absence.proofUrl) ? (
                    <a
                      href={selected.absence.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={selected.absence.proofUrl}
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
                      href={selected.absence.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Proof
                    </a>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={() => acceptAbsence(selected.absence._id)}
                disabled={actionLoading}
                style={acceptBtnStyle}
              >
                {actionLoading ? "Processing..." : "Accept"}
              </button>
              <button
                onClick={() => declineAbsence(selected.absence._id)}
                disabled={actionLoading}
                style={declineBtnStyle}
              >
                {actionLoading ? "Processing..." : "Decline"}
              </button>
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

/* small helpers & styles */

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
  width: 680,
  maxWidth: "95%",
  background: "#fff",
  padding: 18,
  borderRadius: 10,
  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
};

const detailRow = { marginBottom: 8, fontSize: 14 };

const acceptBtnStyle = {
  background: "#0b6a3a",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
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

const closeBtnStyle = {
  background: "transparent",
  border: "none",
  fontSize: 18,
  cursor: "pointer",
};
const declineBtnStyle = {
  background: "#b00020",
  color: "#fff",
  padding: "8px 12px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};