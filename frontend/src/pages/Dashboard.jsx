import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/api";

// Calendar
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Chart
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Date picker for custom ranges
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Optional firebase upload helper (if you set it up earlier)
let uploadProof = null;
try {
  // eslint-disable-next-line import/no-unres\olved
  const fb = require("../api/firebase");
  uploadProof = fb.uploadProof;
} catch (e) {
  // no firebase helper present — we'll fallback to sending no proof or require your backend to accept file uploads
  uploadProof = null;
}

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// color map for absence types
const TYPE_COLOR = {
  conge: "#FFD84D", // yellow
  maladie: "#3B82F6", // blue
  absence: "#F97316", // orange
};

function eventStyleGetter(event) {
  const bg = TYPE_COLOR[event.type] || "#9CA3AF";
  const style = {
    backgroundColor: bg,
    borderRadius: "6px",
    color: "#111827",
    border: "1px solid rgba(0,0,0,0.08)",
    padding: "2px 4px",
    fontWeight: 600,
  };
  return { style };
}

export default function UserDashboard() {
  const auth = useSelector((s) => s.auth);
  const userId = auth?.user?._id || auth?.user?.id;

  const [absences, setAbsences] = useState([]); // raw absences from backend
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // chart range controls
  const [rangeMode, setRangeMode] = useState("3months"); // '3months' or 'custom'
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d;
  });
  const [customTo, setCustomTo] = useState(new Date());

  // fetch absences
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/absences/me");
        // adapt to your backend response shape
        // expected: { absences: [...] } or an array
        const data = res.data?.absences || res.data || [];
        // ensure dates are Date objects
        const parsed = data.map((a) => ({
          ...a,
          startDate: new Date(a.startDate),
          endDate: new Date(a.endDate),
        }));
        setAbsences(parsed);
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.message ||
            err.message ||
            "Failed to load absences"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // transform to calendar events
  const events = useMemo(() => {
    return absences
      .filter((a) => !a.removed)
      .map((a) => {
        // react-big-calendar treats end as exclusive in some cases; add one day to include end
        const end = new Date(a.endDate);
        end.setDate(end.getDate() + 1);
        return {
          id: a._id || `${a.startDate}-${a.endDate}`,
          title: a.type.toUpperCase(),
          start: new Date(a.startDate),
          end,
          allDay: true,
          type: a.type,
          status: a.status,
          raw: a,
        };
      });
  }, [absences]);

  // chart data: count absences per month in selected range
  const chartRange = useMemo(() => {
    if (rangeMode === "3months") {
      const to = new Date();
      const from = new Date();
      from.setMonth(from.getMonth() - 3);
      return { from, to };
    }
    return { from: customFrom, to: customTo };
  }, [rangeMode, customFrom, customTo]);

  const chartData = useMemo(() => {
    const { from, to } = chartRange;
    const start = new Date(from.getFullYear(), from.getMonth(), 1);
    const end = new Date(to.getFullYear(), to.getMonth(), 1);

    // build months array from start to end inclusive
    const months = [];
    const iter = new Date(start);
    while (iter <= end) {
      months.push({ y: iter.getFullYear(), m: iter.getMonth() });
      iter.setMonth(iter.getMonth() + 1);
    }

    const monthLabels = months.map(
      (mm) => `${mm.y}-${String(mm.m + 1).padStart(2, "0")}`
    );

    const counts = monthLabels.map((label) => ({
      label,
      conge: 0,
      maladie: 0,
      absence: 0,
      total: 0,
    }));

    absences.forEach((a) => {
      if (a.removed) return;
      const s = new Date(a.startDate);
      const e = new Date(a.endDate);
      // if any overlap between [s,e] and [from,to end-of-month]
      months.forEach((mm, idx) => {
        const monthStart = new Date(mm.y, mm.m, 1);
        const monthEnd = new Date(mm.y, mm.m + 1, 0, 23, 59, 59, 999);
        if (s <= monthEnd && e >= monthStart) {
          counts[idx][a.type] = (counts[idx][a.type] || 0) + 1; // increment by absence occurrence (not days)
          counts[idx].total += 1;
        }
      });
    });

    return counts.map((c) => ({
      name: c.label,
      Conge: c.conge,
      Maladie: c.maladie,
      Absence: c.absence,
      total: c.total,
    }));
  }, [absences, chartRange]);

  // form state
  const [sDate, setSDate] = useState(null);
  const [eDate, setEDate] = useState(null);
  const [atype, setAtype] = useState("maladie");
  const [proofFile, setProofFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState(null);

  const submitAbsence = async (ev) => {
    ev.preventDefault();
    setFormMsg(null);
    if (!sDate || !eDate) return setFormMsg("Start and end dates required");
    if (eDate < sDate) return setFormMsg("endDate must be >= startDate");

    setSubmitting(true);
    try {
      let proofUrl = null;
      if (proofFile && uploadProof) {
        // upload via firebase helper
        proofUrl = await uploadProof(proofFile, userId || "anon");
      }

      const payload = {
        startDate: sDate.toISOString(),
        endDate: eDate.toISOString(),
        type: atype,
        proofUrl,
      };

      const res = await api.post("/absences", payload);
      // assume backend returns created absence
      const created = res.data;
      // normalize dates
      const parsed = {
        ...created,
        startDate: new Date(created.startDate),
        endDate: new Date(created.endDate),
      };
      setAbsences((prev) => [...prev, parsed]);
      setFormMsg("Absence created");
      // reset form
      setSDate(null);
      setEDate(null);
      setProofFile(null);
    } catch (err) {
      console.error(err);
      setFormMsg(
        err?.response?.data?.message ||
          err.message ||
          "Failed to create absence"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 18, fontFamily: "Inter, system-ui, Arial" }}>
      <h2 style={{ color: "#0b6a3a", marginBottom: 12 }}>My Absences</h2>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 18 }}
      >
        <div
          style={{
            minHeight: 600,
            background: "white",
            padding: 12,
            borderRadius: 10,
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
          }}
        >
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 560 }}
            views={["month", "week", "day"]}
            defaultView="month"
            eventPropGetter={(event) => eventStyleGetter(event)}
            tooltipAccessor={(e) => `${e.title} (${e.status})`}
            onSelectEvent={(ev) =>
              alert(
                `Absence: ${ev.title}\n${format(
                  new Date(ev.start),
                  "yyyy-MM-dd"
                )} → ${format(new Date(ev.end), "yyyy-MM-dd")}\nStatus: ${
                  ev.status
                }`
              )
            }
          />
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              background: "white",
              padding: 12,
              borderRadius: 10,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
          >
            <h4 style={{ margin: 0 }}>Absences over time</h4>

            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <button
                onClick={() => setRangeMode("3months")}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #e6e6e6",
                  background: rangeMode === "3months" ? "#e6ffea" : "white",
                }}
              >
                Last 3 months
              </button>
              <button
                onClick={() => setRangeMode("custom")}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #e6e6e6",
                  background: rangeMode === "custom" ? "#e6ffea" : "white",
                }}
              >
                Custom
              </button>
            </div>

            {rangeMode === "custom" && (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 12 }}>From</div>
                  <DatePicker
                    selected={customFrom}
                    onChange={(d) => setCustomFrom(d)}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12 }}>To</div>
                  <DatePicker
                    selected={customTo}
                    onChange={(d) => setCustomTo(d)}
                  />
                </div>
              </div>
            )}

            <div style={{ height: 200, marginTop: 12 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Conge" stackId="a" />
                  <Bar dataKey="Maladie" stackId="a" />
                  <Bar dataKey="Absence" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            style={{
              background: "white",
              padding: 12,
              borderRadius: 10,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            }}
          >
            <h4 style={{ margin: 0 }}>New Absence Request</h4>
            <form
              onSubmit={submitAbsence}
              style={{
                marginTop: 8,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontSize: 12 }}>Start date</div>
                <DatePicker
                  selected={sDate}
                  onChange={(d) => setSDate(d)}
                  placeholderText="Start date"
                />
              </div>
              <div>
                <div style={{ fontSize: 12 }}>End date</div>
                <DatePicker
                  selected={eDate}
                  onChange={(d) => setEDate(d)}
                  placeholderText="End date"
                />
              </div>

              <div>
                <div style={{ fontSize: 12 }}>Type</div>
                <select
                  value={atype}
                  onChange={(e) => setAtype(e.target.value)}
                >
                  <option value="maladie">Maladie</option>
                  <option value="conge">Conge</option>
                  <option value="absence">Absence</option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: 12 }}>Proof (optional)</div>
                <input
                  type="file"
                  onChange={(e) => setProofFile(e.target.files[0])}
                  accept="image/*,application/pdf"
                />
                {!uploadProof && (
                  <small style={{ color: "#6b7280" }}>
                    No firebase upload helper found — proof will not be
                    uploaded. Set up ../api/firebase.js to enable file uploads.
                  </small>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "8px 12px",
                  background: "#0b6a3a",
                  color: "white",
                  borderRadius: 8,
                  border: "none",
                }}
              >
                {submitting ? "Submitting..." : "Send request"}
              </button>

              {formMsg && (
                <div
                  style={{
                    color: formMsg.includes("Failed") ? "#b00020" : "#0b6a3a",
                  }}
                >
                  {formMsg}
                </div>
              )}
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
