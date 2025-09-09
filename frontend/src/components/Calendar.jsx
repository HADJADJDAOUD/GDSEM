"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Navigate,
  Views,
} from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import addDays from "date-fns/addDays";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import "react-big-calendar/lib/css/react-big-calendar.css";
import api from "../api/api";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const TYPE_COLOR = {
  conge: "#FFD84D",
  maladie: "#3B82F6",
  absence: "#F97316",
};

const TYPE_LABELS = {
  conge: "Congé",
  maladie: "Maladie",
  absence: "Absence",
};

function safeDate(d) {
  try {
    return d ? new Date(d) : null;
  } catch {
    return null;
  }
}

export default function CalendarView() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.MONTH);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // UI controls
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // accepted, pending, rejected
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchAbsences();
  }, []);

  const fetchAbsences = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/absences/me");
      // backend shape could be { data: { absences: [...] } } or data: [...]
      const data = res.data.data?.absences || res.data.data || [];
      const parsed = (Array.isArray(data) ? data : []).map((a) => ({
        ...a,
        startDate: safeDate(a.startDate),
        endDate: safeDate(a.endDate),
      }));
      setAbsences(parsed);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || err.message || "Failed to load absences"
      );
    } finally {
      setLoading(false);
    }
  };

  // transform to calendar events
  const events = useMemo(() => {
    return absences
      .filter((a) => !a.removed)
      .map((a) => {
        const start = safeDate(a.startDate);
        const end = safeDate(a.endDate);
        // react-big-calendar expects end to be exclusive for allDay events often — add 1 day for display
        const displayEnd = end ? new Date(end) : start;
        if (displayEnd) displayEnd.setDate(displayEnd.getDate() + 1);

        return {
          id: a._id || `${start}-${displayEnd}`,
          title: TYPE_LABELS[a.type] || a.type || "Absence",
          start: start || new Date(),
          end: displayEnd || new Date(),
          allDay: true,
          type: a.type,
          status: a.status,
          raw: a,
        };
      });
  }, [absences]);

  // filters applied to the right-side list and CSV export
  const filteredEvents = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    return events.filter((ev) => {
      if (filterType !== "all" && ev.type !== filterType) return false;
      if (
        filterStatus !== "all" &&
        (ev.status || "").toLowerCase() !== filterStatus
      )
        return false;
      if (q) {
        const hay = `${ev.title} ${ev.raw?.reason || ""} ${
          ev.raw?.user?.username || ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, filterType, filterStatus, query]);

  // summary stats
  const stats = useMemo(() => {
    const total = events.length;
    const today = new Date();
    const upcomingWindowEnd = addDays(today, 7);
    const upcoming = events.filter(
      (ev) => ev.start >= today && ev.start <= upcomingWindowEnd
    ).length;
    const pending = events.filter(
      (ev) => (ev.status || "").toLowerCase() === "pending"
    ).length;
    // longest absence in days
    let longest = { days: 0, title: null, start: null, end: null };
    for (const ev of events) {
      const s = safeDate(ev.raw?.startDate);
      const e = safeDate(ev.raw?.endDate);
      if (!s || !e) continue;
      const days = differenceInCalendarDays(e, s) + 1; // inclusive
      if (days > longest.days) {
        longest = { days, title: ev.title, start: s, end: e };
      }
    }
    // counts by type
    const byType = events.reduce((acc, ev) => {
      acc[ev.type] = (acc[ev.type] || 0) + 1;
      return acc;
    }, {});
    return { total, upcoming, pending, longest, byType };
  }, [events]);

  const handleNavigate = useCallback((newDate) => setDate(newDate), []);
  const handleViewChange = useCallback((newView) => setView(newView), []);
  const handleSelectEvent = useCallback((event) => setSelectedEvent(event), []);
  const handleCloseModal = useCallback(() => setSelectedEvent(null), []);

  const eventStyleGetter = useCallback((event) => {
    const bg = TYPE_COLOR[event.type] || "#9CA3AF";
    // decide text color based on bg brightness (simple luminance)
    const hex = bg.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const color = luminance > 0.6 ? "#111827" : "#ffffff";
    return {
      style: {
        backgroundColor: bg,
        borderRadius: "6px",
        color,
        border: "1px solid rgba(0,0,0,0.06)",
        padding: "2px 6px",
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
      },
    };
  }, []);

  // CSV export of filtered events
  const exportCSV = useCallback(() => {
    const header = ["Title,Type,Status,Start,End,Reason"].join(",");
    const rows = filteredEvents.map((ev) => {
      const r = ev.raw || {};
      const start = ev.start ? format(ev.start, "yyyy-MM-dd") : "";
      const end = r.endDate ? format(new Date(r.endDate), "yyyy-MM-dd") : "";
      const reason = (r.reason || "").replace(/"/g, '""');
      return `"${ev.title}","${ev.type || ""}","${
        ev.status || ""
      }","${start}","${end}","${reason}"`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `absences_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredEvents]);

  // small "upcoming" list for the right column (next 5)
  const upcomingList = useMemo(() => {
    const now = new Date();
    return events
      .filter((ev) => ev.end >= now)
      .sort((a, b) => a.start - b.start)
      .slice(0, 5);
  }, [events]);

  // responsive layout: left = calendar, right = upcoming + filters
  return (
    <>
      <style>{`
        /* baked-in styles to keep file single-shot */
        .calendar-shell { font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
        .top-row { display:flex; gap:12px; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; }
        .summary-cards { display:flex; gap:12px; align-items:stretch; flex-wrap:wrap; }
        .card { background: linear-gradient(180deg,#ffffff,#fbfbfb); border:1px solid #eef2f7; padding:10px 14px; border-radius:10px; min-width:120px; box-shadow: 0 6px 18px rgba(8,15,30,0.03); }
        .card small { color:#6b7280; display:block; font-size:12px; }
        .card strong { display:block; font-size:18px; margin-top:6px; color:#0b6a3a; }
        .controls { display:flex; gap:8px; align-items:center; margin-top:12px; flex-wrap:wrap; }
        .controls input[type="text"], .controls select { padding:8px 10px; border-radius:8px; border:1px solid #e6e9ef; min-width:160px; }
        .controls .btn { padding:8px 12px; border-radius:8px; border:none; cursor:pointer; font-weight:600; }
        .btn.primary { background:#0b6a3a; color:white; }
        .btn.ghost { background:transparent; border:1px solid #e6e9ef; color:#0b6a3a; }
        .layout { display:grid; grid-template-columns: 1fr 320px; gap:16px; align-items:start; }
        @media (max-width: 980px) { .layout { grid-template-columns: 1fr; } .right-col { order: 2; } }
        .upcoming { background:#fff; padding:12px; border-radius:10px; border:1px solid #eef2f7; box-shadow: 0 6px 18px rgba(0,0,0,0.03); }
        .upcoming li { list-style:none; padding:8px 0; border-bottom:1px dashed #f1f5f9; }
        .upcoming li:last-child { border-bottom: none; }
        .event-row { display:flex; align-items:center; gap:10px; justify-content:space-between; }
        .small-badge { padding:6px 10px; border-radius:999px; font-weight:700; font-size:12px; }
        .status.pending { background:#fef3c7; color:#92400e; }
        .status.accepted { background:#dcfce7; color:#166534; }
        .status.rejected { background:#fee2e2; color:#991b1b; }
        /* rbc overrides (gentle) */
        .rbc-toolbar { display:flex; justify-content:space-between; gap:12px; align-items:center; margin-bottom:12px; padding:10px; background:#f8fdf9; border-radius:8px; }
        .rbc-toolbar button { background:#fff; border:1px solid #e6e9ef; padding:6px 10px; border-radius:8px; cursor:pointer; font-weight:600; color:#0b6a3a; }
        .rbc-toolbar button.rbc-active, .rbc-toolbar button:hover { background:#0b6a3a; color:#fff; border-color:#0b6a3a; }
        .rbc-month-view, .rbc-time-view { border: 1px solid #e6e9ef; border-radius:10px; overflow:hidden; }
      `}</style>

      <div className="calendar-shell">
        {/* header & summary */}
        <div className="top-row">
          <div>
            <h3 style={{ margin: 0, color: "#0b6a3a", fontSize: 22 }}>
              Calendrier des absences
            </h3>
            <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
              Vue claire des absences — filtrez, exportez ou cliquez sur un
              événement pour voir les détails.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={fetchAbsences} className="btn ghost">
              🔄 Refresh
            </button>
            <button
              onClick={() => {
                // quick client CSV of all events
                const header = ["Title,Type,Status,Start,End,Reason"].join(",");
                const rows = events.map((ev) => {
                  const r = ev.raw || {};
                  const start = ev.start ? format(ev.start, "yyyy-MM-dd") : "";
                  const end = r.endDate
                    ? format(new Date(r.endDate), "yyyy-MM-dd")
                    : "";
                  const reason = (r.reason || "").replace(/"/g, '""');
                  return `"${ev.title}","${ev.type || ""}","${
                    ev.status || ""
                  }","${start}","${end}","${reason}"`;
                });
                const csv = [header, ...rows].join("\n");
                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8;",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `calendar_absences_${new Date()
                  .toISOString()
                  .slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn"
            >
              ⤓ Export CSV
            </button>
          </div>
        </div>

        <div className="summary-cards" style={{ marginBottom: 14 }}>
          <div className="card">
            <small>Total absences</small>
            <strong>{stats.total}</strong>
          </div>
          <div className="card">
            <small>Upcoming (7 days)</small>
            <strong>{stats.upcoming}</strong>
          </div>
          <div className="card">
            <small>Pending approvals</small>
            <strong>{stats.pending}</strong>
          </div>
          <div className="card">
            <small>Longest absence</small>
            <strong>
              {stats.longest.days > 0 ? `${stats.longest.days} day(s)` : "—"}
            </strong>
            {stats.longest.title && (
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                {stats.longest.title} •{" "}
                {stats.longest.start
                  ? format(stats.longest.start, "dd MMM yyyy")
                  : "—"}
              </div>
            )}
          </div>

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div style={{ color: "#6b7280", fontSize: 13 }}>By type:</div>
            {Object.entries(stats.byType).map(([k, v]) => (
              <div
                key={k}
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    background: TYPE_COLOR[k] || "#cbd5e1",
                    borderRadius: 3,
                  }}
                />
                <small style={{ color: "#374151" }}>
                  {TYPE_LABELS[k] || k}: {v}
                </small>
              </div>
            ))}
          </div>
        </div>

        {/* layout grid */}
        <div className="layout" style={{ marginTop: 6 }}>
          {/* left: calendar */}
          <div>
            <div
              style={{
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div className="controls" style={{ alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Search reason, title..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All types</option>
                  {Object.keys(TYPE_LABELS).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 13,
                    alignSelf: "center",
                  }}
                >
                  Showing {filteredEvents.length} item(s)
                </div>
              </div>
            </div>

            <div style={{ background: "white", padding: 10, borderRadius: 10 }}>
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 620 }}
                date={date}
                view={view}
                onNavigate={handleNavigate}
                onView={handleViewChange}
                views={[Views.MONTH, Views.WEEK, Views.DAY]}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleSelectEvent}
                components={{
                  toolbar: ({
                    date: toolbarDate,
                    view: toolbarView,
                    onNavigate,
                    onView,
                  }) => {
                    const label = () => {
                      const d = toolbarDate;
                      if (toolbarView === Views.DAY)
                        return format(d, "EEEE, MMMM dd, yyyy");
                      if (toolbarView === Views.WEEK) {
                        const start = startOfWeek(d, { weekStartsOn: 0 });
                        const end = addDays(start, 6);
                        return `${format(start, "MMM d")} - ${format(
                          end,
                          "MMM d, yyyy"
                        )}`;
                      }
                      return format(d, "MMMM yyyy");
                    };
                    return (
                      <div className="rbc-toolbar">
                        <span>
                          <button
                            onClick={() => onView(Views.MONTH)}
                            className={
                              toolbarView === Views.MONTH ? "rbc-active" : ""
                            }
                          >
                            Mois
                          </button>
                          <button
                            onClick={() => onView(Views.WEEK)}
                            className={
                              toolbarView === Views.WEEK ? "rbc-active" : ""
                            }
                          >
                            Semaine
                          </button>
                          <button
                            onClick={() => onView(Views.DAY)}
                            className={
                              toolbarView === Views.DAY ? "rbc-active" : ""
                            }
                          >
                            Jour
                          </button>
                        </span>

                        <span className="rbc-toolbar-label">{label()}</span>

                        <span>
                          <button onClick={() => onNavigate(Navigate.TODAY)}>
                            Aujourd'hui
                          </button>
                          <button onClick={() => onNavigate(Navigate.PREVIOUS)}>
                            ‹
                          </button>
                          <button onClick={() => onNavigate(Navigate.NEXT)}>
                            ›
                          </button>
                        </span>
                      </div>
                    );
                  },
                }}
                messages={{
                  today: "Aujourd'hui",
                  previous: "Précédent",
                  next: "Suivant",
                  month: "Mois",
                  week: "Semaine",
                  day: "Jour",
                  agenda: "Agenda",
                  date: "Date",
                  time: "Heure",
                  event: "Événement",
                  noEventsInRange: "Aucun événement dans cette période",
                }}
              />
            </div>
          </div>

          {/* right: upcoming + legend */}
          <aside
            className="right-col"
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div className="upcoming">
              <strong style={{ display: "block", marginBottom: 8 }}>
                Upcoming Absences
              </strong>
              <small style={{ color: "#6b7280" }}>
                Next scheduled absences (top 5)
              </small>
              <ul style={{ padding: "10px 0 0 0", margin: 0 }}>
                {upcomingList.length === 0 && (
                  <li style={{ color: "#6b7280", padding: 12 }}>
                    No upcoming absences
                  </li>
                )}
                {upcomingList.map((ev) => {
                  const s = ev.start ? format(ev.start, "dd MMM") : "—";
                  const e = ev.raw?.endDate
                    ? format(new Date(ev.raw.endDate), "dd MMM")
                    : "—";
                  return (
                    <li key={ev.id}>
                      <div className="event-row">
                        <div
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              background: TYPE_COLOR[ev.type] || "#cbd5e1",
                              borderRadius: 3,
                            }}
                          />
                          <div style={{ minWidth: 140 }}>
                            <div style={{ fontWeight: 700 }}>{ev.title}</div>
                            <div style={{ color: "#6b7280", fontSize: 13 }}>
                              {s} → {e}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                          }}
                        >
                          <div style={{ marginBottom: 6 }}>
                            <span
                              className={`small-badge status ${
                                ev.status || ""
                              }`.trim()}
                              style={{ padding: "6px 8px", borderRadius: 999 }}
                            >
                              {(ev.status || "pending").toUpperCase()}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedEvent(ev)}
                            className="btn ghost"
                            style={{ padding: "6px 8px" }}
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="upcoming" style={{ paddingBottom: 12 }}>
              <strong style={{ display: "block", marginBottom: 8 }}>
                Legend
              </strong>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(TYPE_COLOR).map(([key, color]) => (
                  <div
                    key={key}
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        background: color,
                        borderRadius: 3,
                      }}
                    />
                    <div style={{ fontWeight: 600 }}>
                      {TYPE_LABELS[key] || key}
                    </div>
                    <div style={{ marginLeft: "auto", color: "#6b7280" }}>
                      {events.filter((e) => e.type === key).length || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="upcoming">
              <strong style={{ display: "block", marginBottom: 8 }}>
                Quick tips
              </strong>
              <ol style={{ margin: 0, paddingLeft: 18, color: "#374151" }}>
                <li>Use filters to focus on types or pending approvals.</li>
                <li>Click an event to see details and status.</li>
                <li>Export CSV to audit absences offline.</li>
              </ol>
            </div>
          </aside>
        </div>

        {/* event details modal */}
        {selectedEvent && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 3000,
            }}
            onClick={handleCloseModal}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                maxWidth: 560,
                width: "92%",
                padding: 20,
                boxShadow: "0 20px 40px rgba(2,6,23,0.12)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "start",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, color: "#0b6a3a" }}>
                    {selectedEvent.title}
                  </h3>
                  <div style={{ color: "#6b7280", marginTop: 6 }}>
                    {format(selectedEvent.start, "dd MMM yyyy")} →{" "}
                    {selectedEvent.raw?.endDate
                      ? format(
                          new Date(selectedEvent.raw.endDate),
                          "dd MMM yyyy"
                        )
                      : "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ marginBottom: 8 }}>
                    <span
                      className={`small-badge status ${
                        selectedEvent.status || ""
                      }`}
                      style={{ padding: "6px 10px" }}
                    >
                      {(selectedEvent.status || "pending").toUpperCase()}
                    </span>
                  </div>
                  <button onClick={handleCloseModal} className="btn ghost">
                    Close
                  </button>
                </div>
              </div>

              {selectedEvent.raw?.reason && (
                <>
                  <hr style={{ margin: "12px 0" }} />
                  <div>
                    <strong style={{ color: "#374151" }}>Reason</strong>
                    <p style={{ marginTop: 8, color: "#374151" }}>
                      {selectedEvent.raw.reason}
                    </p>
                  </div>
                </>
              )}

              {selectedEvent.raw?.proofUrl && (
                <div style={{ marginTop: 8 }}>
                  <strong style={{ color: "#374151" }}>Proof</strong>
                  <div style={{ marginTop: 8 }}>
                    {/\.(jpg|jpeg|png|gif)$/i.test(
                      selectedEvent.raw.proofUrl
                    ) ? (
                      <a
                        href={selectedEvent.raw.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={selectedEvent.raw.proofUrl}
                          alt="proof"
                          style={{
                            maxWidth: "100%",
                            borderRadius: 8,
                            border: "1px solid #eef2f7",
                          }}
                        />
                      </a>
                    ) : (
                      <a
                        href={selectedEvent.raw.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View file
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                }}
              >
                <button onClick={handleCloseModal} className="btn ghost">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* loading / error states */}
        {loading && (
          <div style={{ marginTop: 12, color: "#6b7280" }}>Loading...</div>
        )}
        {error && (
          <div style={{ marginTop: 12, color: "crimson" }}>{error}</div>
        )}
      </div>
    </>
  );
}
