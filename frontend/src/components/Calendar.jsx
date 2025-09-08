import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import addMonths from "date-fns/addMonths";
import subMonths from "date-fns/subMonths";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Mock API for demonstration - replace with your actual api import
import api from "../api/api";
console.log("some changes happend");
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

function CalendarView() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState(Views.MONTH);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/absences/me");
        const data = res.data.data?.absences || res.data.data || [];

        const parsed = data.map((a) => ({
          ...a,
          startDate: new Date(a.startDate),
          endDate: new Date(a.endDate),
        }));
        setAbsences(parsed);
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.message || err.message || "Failed to load"
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const events = useMemo(() => {
    return absences
      .filter((a) => !a.removed)
      .map((a) => {
        const end = new Date(a.endDate);
        end.setDate(end.getDate() + 1); // Add 1 day for proper display
        return {
          id: a._id || `${a.startDate}-${a.endDate}`,
          title: TYPE_LABELS[a.type] || a.type,
          start: new Date(a.startDate),
          end,
          allDay: true,
          type: a.type,
          status: a.status,
          raw: a,
        };
      });
  }, [absences]);

  const handleNavigate = useCallback((newDate) => {
    setDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView) => {
    setView(newView);
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const eventStyleGetter = useCallback((event) => {
    const bg = TYPE_COLOR[event.type] || "#9CA3AF";
    const style = {
      backgroundColor: bg,
      borderRadius: "6px",
      color: "#111827",
      border: "1px solid rgba(0,0,0,0.08)",
      padding: "2px 8px",
      fontWeight: 600,
      fontSize: "13px",
      cursor: "pointer",
      transition: "all 0.2s ease",
    };
    return { style };
  }, []);

  const CustomToolbar = useCallback(({ date, view, onNavigate, onView }) => {
    const goToBack = () => {
      if (view === Views.DAY) {
        onNavigate(Navigate.PREVIOUS);
      } else if (view === Views.WEEK) {
        onNavigate(Navigate.PREVIOUS);
      } else {
        onNavigate(Navigate.PREVIOUS);
      }
    };

    const goToNext = () => {
      if (view === Views.DAY) {
        onNavigate(Navigate.NEXT);
      } else if (view === Views.WEEK) {
        onNavigate(Navigate.NEXT);
      } else {
        onNavigate(Navigate.NEXT);
      }
    };

    const goToToday = () => {
      onNavigate(Navigate.TODAY);
    };

    const label = () => {
      const d = date;
      if (view === Views.DAY) {
        return format(d, "EEEE, MMMM d, yyyy");
      } else if (view === Views.WEEK) {
        const start = startOfWeek(d, { weekStartsOn: 0 });
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
      } else {
        return format(d, "MMMM yyyy");
      }
    };

    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button type="button" onClick={goToToday}>
            Aujourd'hui
          </button>
          <button type="button" onClick={goToBack}>
            ‹
          </button>
          <button type="button" onClick={goToNext}>
            ›
          </button>
        </span>
        <span className="rbc-toolbar-label">{label()}</span>
        <span className="rbc-btn-group">
          <button
            type="button"
            className={view === Views.MONTH ? "rbc-active" : ""}
            onClick={() => onView(Views.MONTH)}
          >
            Mois
          </button>
          <button
            type="button"
            className={view === Views.WEEK ? "rbc-active" : ""}
            onClick={() => onView(Views.WEEK)}
          >
            Semaine
          </button>
          <button
            type="button"
            className={view === Views.DAY ? "rbc-active" : ""}
            onClick={() => onView(Views.DAY)}
          >
            Jour
          </button>
        </span>
      </div>
    );
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center p-8 bg-white rounded-xl shadow-sm">
        <div className="text-gray-600 animate-pulse">
          Chargement du calendrier...
        </div>
      </div>
    );

  if (error)
    return (
      <div className="p-6 bg-red-50 rounded-xl border border-red-200">
        <p className="text-red-700 font-medium">Erreur de chargement</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );

  return (
    <>
      <style>{`
        .rbc-calendar {
          font-family: system-ui, -apple-system, sans-serif;
        }
        .rbc-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 12px;
          background: #f8fdf9;
          border-radius: 8px;
        }
        .rbc-toolbar button {
          background: white;
          border: 1px solid #d1d5db;
          padding: 6px 14px;
          margin: 0 2px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .rbc-toolbar button:hover {
          background: #0b6a3a;
          color: white;
          border-color: #0b6a3a;
        }
        .rbc-toolbar button.rbc-active {
          background: #0b6a3a;
          color: white;
          border-color: #0b6a3a;
        }
        .rbc-toolbar-label {
          font-size: 18px;
          font-weight: 600;
          color: #0b6a3a;
        }
        .rbc-month-view {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        .rbc-header {
          background: #f9fafb;
          font-weight: 600;
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        .rbc-today {
          background: #f0fdf4;
        }
        .rbc-event {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          animation: slideUp 0.3s;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-approved {
          background: #dcfce7;
          color: #166534;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status-rejected {
          background: #fee2e2;
          color: #991b1b;
        }
      `}</style>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: "20px",
            color: "#0b6a3a",
            fontSize: "24px",
            fontWeight: "600",
          }}
        >
          Calendrier des Absences
        </h3>

        <div style={{ marginBottom: "20px", display: "flex", gap: "16px" }}>
          {Object.entries(TYPE_COLOR).map(([type, color]) => (
            <div
              key={type}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: color,
                  borderRadius: "4px",
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              />
              <span
                style={{
                  fontSize: "14px",
                  color: "#4b5563",
                  textTransform: "capitalize",
                }}
              >
                {TYPE_LABELS[type] || type}
              </span>
            </div>
          ))}
        </div>

        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          date={date}
          view={view}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          views={[Views.MONTH, Views.WEEK, Views.DAY]}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          components={{
            toolbar: CustomToolbar,
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

      {selectedEvent && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3
              style={{
                marginTop: 0,
                color: "#0b6a3a",
                fontSize: "20px",
                marginBottom: "16px",
              }}
            >
              Détails de l'absence
            </h3>

            <div style={{ marginBottom: "12px" }}>
              <strong
                style={{
                  color: "#6b7280",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Type
              </strong>
              <div
                style={{
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: TYPE_COLOR[selectedEvent.type],
                    borderRadius: "3px",
                  }}
                />
                <span style={{ fontSize: "16px", fontWeight: "500" }}>
                  {selectedEvent.title}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <strong
                style={{
                  color: "#6b7280",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Période
              </strong>
              <div style={{ marginTop: "4px", fontSize: "16px" }}>
                {format(selectedEvent.start, "dd MMMM yyyy")} →{" "}
                {format(new Date(selectedEvent.raw.endDate), "dd MMMM yyyy")}
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <strong
                style={{
                  color: "#6b7280",
                  fontSize: "12px",
                  textTransform: "uppercase",
                }}
              >
                Statut
              </strong>
              <div style={{ marginTop: "8px" }}>
                <span className={`status-badge status-${selectedEvent.status}`}>
                  {selectedEvent.status === "approved"
                    ? "Approuvé"
                    : selectedEvent.status === "pending"
                    ? "En attente"
                    : selectedEvent.status === "rejected"
                    ? "Refusé"
                    : selectedEvent.status}
                </span>
              </div>
            </div>

            <button
              onClick={handleCloseModal}
              style={{
                width: "100%",
                padding: "10px",
                background: "#0b6a3a",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#094d2a")}
              onMouseLeave={(e) => (e.target.style.background = "#0b6a3a")}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default CalendarView;
