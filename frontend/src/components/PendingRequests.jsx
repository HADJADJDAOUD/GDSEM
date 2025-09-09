import React, { useEffect, useMemo, useState } from "react";
import api from "../api/api";

/**
 * PendingRequests.jsx - improved, professional, informative.
 *
 * - Search + filters + refresh + pagination
 * - Summary cards (total, by type, by role)
 * - Details modal with Accept / Decline (inline justification)
 * - CSV export of current table view
 *
 * Drop-in replacement for your previous component.
 */

export default function PendingRequests() {
  const [items, setItems] = useState([]); // raw rows from backend
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(null); // selected row for details
  const [actionLoading, setActionLoading] = useState(false);

  // UI state
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // conge, maladie, all
  const [filterRole, setFilterRole] = useState("all"); // user, RH, all
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/absences/pending");
      const data = res?.data?.data || [];
      setItems(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
      setPage(1);
    } catch (err) {
      console.error("fetchPending error:", err);
      setError("Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  };

  // derived stats
  const stats = useMemo(() => {
    const total = items.length;
    const byType = items.reduce(
      (acc, r) => {
        const t = (r.absence && r.absence.type) || "unknown";
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      },
      { conge: 0, maladie: 0 }
    );
    const byRole = items.reduce((acc, r) => {
      const role =
        r.role ||
        (r.absence && r.absence.user && r.absence.user.role) ||
        "user";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    return { total, byType, byRole };
  }, [items]);

  // filtering and searching
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    return items.filter((r) => {
      const abs = r.absence || {};
      // filter by type
      if (filterType !== "all" && abs.type !== filterType) return false;
      // filter by role
      const role = r.role || (abs.user && abs.user.role) || "user";
      if (filterRole !== "all" && role !== filterRole) return false;
      // date range on submission date
      if (from || to) {
        const created = abs.createdAt ? new Date(abs.createdAt) : null;
        if (!created) return false;
        if (from && created < from) return false;
        if (to && created > to) return false;
      }
      // text search against username/email/type
      if (q) {
        const hay = `${r.username || ""} ${r.email || ""} ${
          abs.type || ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, query, filterType, filterRole, dateFrom, dateTo]);

  // pagination slice
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // helpers
  const openDetails = (row) => setSelected({ ...row, justifyText: "" });
  const closeDetails = () => setSelected(null);

  const acceptAbsence = async (absenceId) => {
    if (!absenceId) return;
    if (!window.confirm("Accept this absence? This action cannot be undone."))
      return;
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

  const declineAbsence = async (absenceId, justification) => {
    if (!absenceId) return;
    if (!justification || justification.trim().length < 3) {
      alert("Provide a short justification (at least 3 characters).");
      return;
    }
    if (!window.confirm("Reject this absence? This will notify the user."))
      return;
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

  const downloadCSV = () => {
    const rows = ["Username,Email,Role,Type,Status,Submitted,Start,End"];
    for (const r of filtered) {
      const a = r.absence || {};
      rows.push(
        `"${(r.username || "").replace(/"/g, '""')}","${(r.email || "").replace(
          /"/g,
          '""'
        )}","${(r.role || (a.user && a.user.role) || "").replace(
          /"/g,
          '""'
        )}","${(a.type || "").replace(/"/g, '""')}","${(a.status || "").replace(
          /"/g,
          '""'
        )}","${formatDate(a.createdAt)}","${formatDate(
          a.startDate
        )}","${formatDate(a.endDate)}"`
      );
    }
    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pending_absences_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading)
    return (
      <div style={container}>
        <Header
          title="Pending Absence Requests"
          subtitle="Requests awaiting HR review"
        />
        <div style={centered}>Loading pending requests…</div>
      </div>
    );

  if (error)
    return (
      <div style={container}>
        <Header
          title="Pending Absence Requests"
          subtitle="Requests awaiting HR review"
        />
        <div style={{ color: "crimson", padding: 12 }}>{error}</div>
      </div>
    );

  return (
    <div style={container}>
      <Header
        title="Pending Absence Requests"
        subtitle="Review and action pending absence requests submitted by employees."
        extra={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={fetchPending} style={ctaButton}>
              🔄 Refresh
            </button>
            <button onClick={downloadCSV} style={secondaryButton}>
              ⤓ Export CSV
            </button>
          </div>
        }
      />

      {/* summary cards */}
      <div
        style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}
      >
        <StatCard label="Total pending" value={stats.total} />
        <StatCard
          label="Congé"
          value={stats.byType.conge || 0}
          hint="Paid leave"
        />
        <StatCard
          label="Maladie"
          value={stats.byType.maladie || 0}
          hint="Sick leave"
        />
        <StatCard
          label="By role"
          value={Object.entries(stats.byRole)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" • ")}
          small
        />
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <small style={{ color: "#666" }}>
            Last updated: {lastUpdated ? formatDateTime(lastUpdated) : "—"}
          </small>
        </div>
      </div>

      {/* controls: search + filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="Search username, email or type..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={searchInput}
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={smallSelect}
        >
          <option value="all">All types</option>
          <option value="conge">Congé</option>
          <option value="maladie">Maladie</option>
        </select>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={smallSelect}
        >
          <option value="all">All roles</option>
          <option value="user">User</option>
          <option value="RH">RH</option>
        </select>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <small style={{ color: "#666" }}>From</small>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={dateInput}
          />
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <small style={{ color: "#666" }}>To</small>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={dateInput}
          />
        </label>

        <div style={{ marginLeft: "auto" }}>
          <small style={{ color: "#666" }}>{filtered.length} result(s)</small>
        </div>
      </div>

      {/* table */}
      <div
        style={{
          marginTop: 14,
          overflowX: "auto",
          borderRadius: 10,
          border: "1px solid #eee",
        }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}
        >
          <thead style={{ background: "#fafafa" }}>
            <tr>
              <th style={th}>Username</th>
              <th style={th}>Email</th>
              <th style={th}>Role</th>
              <th style={th}>Type</th>
              <th style={th}>Status</th>
              <th style={th}>Submitted</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ padding: 28, textAlign: "center", color: "#666" }}
                >
                  No pending requests match your filters.
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                const abs = row.absence || {};
                return (
                  <tr key={abs._id || Math.random()} style={trStyle}>
                    <td style={td}>{row.username || "—"}</td>
                    <td style={td}>{row.email || "—"}</td>
                    <td style={td}>
                      {row.role || (abs.user && abs.user.role) || "—"}
                    </td>
                    <td style={td}>
                      <span style={{ textTransform: "capitalize" }}>
                        {abs.type || "—"}
                      </span>
                    </td>
                    <td style={td}>{abs.status || "pending"}</td>
                    <td style={td}>{formatDate(abs.createdAt)}</td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          style={linkButton}
                          onClick={() => openDetails(row)}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <div style={{ color: "#666" }}>
          Showing {(page - 1) * pageSize + 1} -{" "}
          {Math.min(page * pageSize, filtered.length)} of {filtered.length}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={page === 1 ? disabledPageBtn : pageBtn}
          >
            Prev
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              minWidth: 56,
              justifyContent: "center",
            }}
          >
            {page}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
            style={page === pageCount ? disabledPageBtn : pageBtn}
          >
            Next
          </button>
        </div>
      </div>

      {/* details modal */}
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
                <strong>Type:</strong> {selected.absence?.type}
              </div>
              <div style={detailRow}>
                <strong>Status:</strong> {selected.absence?.status}
              </div>
              <div style={detailRow}>
                <strong>Start:</strong>{" "}
                {formatDate(selected.absence?.startDate)}
              </div>
              <div style={detailRow}>
                <strong>End:</strong> {formatDate(selected.absence?.endDate)}
              </div>
              <div style={detailRow}>
                <strong>Submitted:</strong>{" "}
                {formatDate(selected.absence?.createdAt)}
              </div>

              {selected.absence?.reason && (
                <div style={detailRow}>
                  <strong>Reason:</strong>{" "}
                  <div style={{ marginTop: 6 }}>{selected.absence.reason}</div>
                </div>
              )}

              {selected.absence?.proofUrl && (
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
                          maxWidth: "220px",
                          maxHeight: "220px",
                          marginTop: 8,
                          borderRadius: 6,
                          cursor: "pointer",
                          border: "1px solid #f0f0f0",
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

            <div style={{ marginTop: 12 }}>
              <label
                style={{ display: "block", marginBottom: 6, fontWeight: 600 }}
              >
                Rejection justification (optional but recommended)
              </label>
              <textarea
                value={selected.justifyText}
                onChange={(e) =>
                  setSelected({ ...selected, justifyText: e.target.value })
                }
                placeholder="Explain why this request should be rejected (visible to user)"
                rows={3}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  resize: "vertical",
                }}
              />
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
                onClick={() =>
                  declineAbsence(selected.absence._id, selected.justifyText)
                }
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

/* ---------- small presentational pieces & styles ---------- */

function Header({ title, subtitle, extra }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        justifyContent: "space-between",
      }}
    >
      <div>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {subtitle && (
          <p style={{ margin: "6px 0 0", color: "#666" }}>{subtitle}</p>
        )}
      </div>
      {extra}
    </div>
  );
}

function StatCard({ label, value, hint = "", small = false }) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg,#fff,#fbfbfb)",
        border: "1px solid #eee",
        padding: small ? "8px 12px" : "12px 16px",
        borderRadius: 10,
        minWidth: small ? 120 : 140,
        boxShadow: "0 6px 18px rgba(10,20,40,0.03)",
      }}
    >
      <div style={{ color: "#666", fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: small ? 14 : 20, fontWeight: 700, marginTop: 6 }}>
        {value}
      </div>
      {hint && (
        <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>{hint}</div>
      )}
    </div>
  );
}

/* styles */
const container = {
  padding: 16,
  maxWidth: 1200,
  margin: "0 auto",
  fontFamily: "Inter, system-ui, sans-serif",
};
const centered = { padding: 40, textAlign: "center", color: "#666" };
const th = {
  textAlign: "left",
  padding: "12px 14px",
  fontSize: 13,
  color: "#333",
  borderBottom: "1px solid #eee",
};
const td = {
  padding: "12px 14px",
  fontSize: 14,
  color: "#111",
  verticalAlign: "middle",
};
const trStyle = { borderTop: "1px solid #f6f6f6", cursor: "default" };
const searchInput = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  minWidth: 260,
};
const smallSelect = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #ddd",
};
const dateInput = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #ddd",
};
const ctaButton = {
  background: "#0b6a3a",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: 8,
  cursor: "pointer",
};
const secondaryButton = {
  background: "#e9eef4",
  color: "#0b2330",
  border: "none",
  padding: "8px 10px",
  borderRadius: 8,
  cursor: "pointer",
};
const linkButton = {
  background: "transparent",
  border: "none",
  color: "#0b6a3a",
  cursor: "pointer",
  fontWeight: 600,
};
const pageBtn = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};
const disabledPageBtn = { ...pageBtn, opacity: 0.5, cursor: "not-allowed" };

const modalBackdropStyle = {
  position: "fixed",
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalStyle = {
  width: 760,
  maxWidth: "96%",
  background: "#fff",
  padding: 18,
  borderRadius: 10,
  boxShadow: "0 16px 48px rgba(2,6,23,0.14)",
};

const detailRow = { marginBottom: 8, fontSize: 14, color: "#222" };

const acceptBtnStyle = {
  background: "#0b6a3a",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
};

const declineBtnStyle = {
  background: "#b00020",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryBtnStyle = {
  background: "#f3f6fb",
  color: "#111",
  padding: "10px 14px",
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

/* helpers */
const formatDate = (v) => {
  if (!v) return "—";
  try {
    const d = new Date(v);
    return d.toISOString().split("T")[0];
  } catch {
    return v;
  }
};
const formatDateTime = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleString();
};
