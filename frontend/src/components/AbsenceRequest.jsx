import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/api";
import { uploadProof } from "../api/firebase";

export default function AbsenceRequest() {
  const [sDate, setSDate] = useState(null);
  const [eDate, setEDate] = useState(null);
  const [atype, setAtype] = useState("maladie");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const [userEndDate, setUserEndDate] = useState(null);
  const [lastAbsence, setLastAbsence] = useState(null);

  let user = JSON.parse(localStorage.getItem("user"));
  let userId = user._id;
  console.log("userId:", userId);
  useEffect(() => {
    const stored = localStorage.getItem("endDate");
    if (stored) setUserEndDate(new Date(stored));
    fetchLastAbsence();
  }, []);
  const fetchLastAbsence = async () => {
    try {
      const res = await api.get(`/getMyLastAbs/${userId}`);
      console.log("fetchLastAbsence response:", res.data);
      setLastAbsence(res.data.data || null);
      setMsg(res.data.message || "Fetched successfully"); // show backend message
    } catch (err) {
      console.error("fetchLastAbsence error:", err);
      setLastAbsence(null);
      setMsg(err?.response?.data?.message || "Failed to fetch last absence");
    }
  };
  console.log("21334");

  const deletePending = async () => {
    if (!lastAbsence) return;

    try {
      const res = await api.delete(`/absences/${lastAbsence._id}/delete`);
      console.log("deletePending response:", res.data);
      setMsg(res.data.message || "Pending request deleted"); // show backend message
      console.log(
        "Deleted absence and it will fetch the lastAbsence:",
        lastAbsence._id
      );
      fetchLastAbsence(); // refresh
    } catch (err) {
      console.error("deletePending error:", err);
      setMsg(err?.response?.data?.message || "Failed to delete absence");
    }
  };

  // helper: inclusive days between two dates

  const daysInclusive = (start, end) => {
    if (!start || !end) return 0;
    const s = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const e = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return Math.round((e - s) / 86400000) + 1;
  };

  const validate = () => {
    if (!sDate || !eDate) return "Start and end date required";
    if (eDate < sDate) return "endDate must be >= startDate";

    if (userEndDate) {
      const minStart = new Date(
        Date.UTC(
          userEndDate.getFullYear(),
          userEndDate.getMonth(),
          userEndDate.getDate()
        ) +
          24 * 3600 * 1000
      );
      const sUTC = Date.UTC(
        sDate.getFullYear(),
        sDate.getMonth(),
        sDate.getDate()
      );
      if (sUTC < minStart.getTime()) {
        return `Start date must be after your recorded end date (${
          userEndDate.toISOString().split("T")[0]
        }).`;
      }
    }

    const days = daysInclusive(sDate, eDate);
    if (atype === "conge" && !(days === 15 || days === 30)) {
      return "For 'conge' the duration must be exactly 15 or 30 days.";
    }

    return null;
  };
  console.log("validate():");

  const submit = async (ev) => {
    ev.preventDefault();
    setMsg(null);
    const vErr = validate();
    if (vErr) return setMsg(vErr);

    setLoading(true);
    try {
      let proofUrl = null;

      // upload to your server first (avoids CORS issues with firebase)
      if (file && atype !== "absence") {
        const formData = new FormData();
        formData.append("file", file);

        const upRes = await api.post("/upload/uploadProof", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        proofUrl = upRes?.data?.url || null;
      }

      const payload = {
        startDate: new Date(
          Date.UTC(sDate.getFullYear(), sDate.getMonth(), sDate.getDate())
        ).toISOString(),
        endDate: new Date(
          Date.UTC(eDate.getFullYear(), eDate.getMonth(), eDate.getDate())
        ).toISOString(),
        type: atype,
        proofUrl,
      };

      const res = await api.post("/absences", payload);
      setMsg(res?.data?.message || "Request sent");
      fetchLastAbsence();

      setSDate(null);
      setEDate(null);
      setFile(null);
    } catch (err) {
      console.error("submit error:", err);
      setMsg(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to send"
      );
    } finally {
      setLoading(false);
    }
  };

  const startMinDate = userEndDate
    ? new Date(
        Date.UTC(
          userEndDate.getFullYear(),
          userEndDate.getMonth(),
          userEndDate.getDate()
        ) +
          24 * 3600 * 1000
      )
    : null;

  const endMinDate = sDate || startMinDate;

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f6fff7 100%)",
        padding: 18,
        borderRadius: 12,
        boxShadow: "0 8px 30px rgba(6, 95, 52, 0.08)",
        maxWidth: 720,
        margin: "0 auto",
        fontFamily: "Inter, Roboto, system-ui, sans-serif",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#064f32" }}>Demande d'absence</h3>

      {/* if there's a pending request show it */}
      {lastAbsence && lastAbsence.status === "pending" ? (
        <div
          style={{ padding: 12, border: "1px solid #e6efe8", borderRadius: 8 }}
        >
          <p>
            <b>Pending request:</b> {lastAbsence.type} from{" "}
            {new Date(lastAbsence.startDate).toISOString().split("T")[0]} to{" "}
            {new Date(lastAbsence.endDate).toISOString().split("T")[0]}
          </p>
          {lastAbsence.proofUrl && (
            <div>
              <p>
                Proof:{" "}
                <a href={lastAbsence.proofUrl} target="_blank" rel="noreferrer">
                  View
                </a>
              </p>

              {/* if it's an image, preview it */}
              {/\.(jpg|jpeg|png|gif|webp)$/i.test(lastAbsence.proofUrl) && (
                <a href={lastAbsence.proofUrl} target="_blank" rel="noreferrer">
                  <img
                    src={lastAbsence.proofUrl}
                    alt="Proof"
                    style={{
                      maxWidth: "200px",
                      marginTop: "8px",
                      borderRadius: "8px",
                    }}
                  />
                </a>
              )}
            </div>
          )}
          <button
            onClick={deletePending}
            style={{
              padding: "8px 12px",
              background: "#b00020",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Delete Request
          </button>
          {msg && <div style={{ marginTop: 8, color: "#0b6a3a" }}>{msg}</div>}
        </div>
      ) : (
        // else show form
        <form
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div>
            <div style={{ fontSize: 13, color: "#0b6a3a", marginBottom: 6 }}>
              Type
            </div>
            <select
              value={atype}
              onChange={(e) => {
                setAtype(e.target.value);
                setSDate(null);
                setEDate(null);
                setFile(null);
                setMsg(null);
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #e6efe8",
                fontSize: 14,
                width: "100%",
              }}
            >
              <option value="maladie">Maladie (any days)</option>
              <option value="conge">Conge (must be 15 or 30 days)</option>
              <option value="absence">Absence (no proof required)</option>
            </select>
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#0b6a3a", marginBottom: 6 }}>
              Start
            </div>
            <DatePicker
              selected={sDate}
              onChange={(d) => setSDate(d)}
              minDate={startMinDate}
              dateFormat="yyyy-MM-dd"
              placeholderText={
                startMinDate
                  ? `Earliest: ${startMinDate.toISOString().slice(0, 10)}`
                  : "Select start date"
              }
            />
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#0b6a3a", marginBottom: 6 }}>
              End
            </div>
            <DatePicker
              selected={eDate}
              onChange={(d) => setEDate(d)}
              minDate={endMinDate}
              dateFormat="yyyy-MM-dd"
            />
          </div>

          {atype !== "absence" && (
            <div>
              <div style={{ fontSize: 13, color: "#0b6a3a", marginBottom: 6 }}>
                Proof (optional)
              </div>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                accept="image/*,application/pdf"
                style={{
                  padding: "8px",
                  borderRadius: 8,
                  border: "1px solid #e6efe8",
                  fontSize: 14,
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 14px",
              background: "#0b6a3a",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending..." : "Send request"}
          </button>

          {msg && (
            <div
              style={{
                fontSize: 13,
                marginTop: 6,
                color: msg.includes("Failed") ? "#b00020" : "#0b6a3a",
              }}
            >
              {msg}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
