"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import api from "../api/api";
import { format, addDays, differenceInCalendarDays } from "date-fns";

// Updated color scheme for modern UI
const TYPE_COLOR = {
  conge_annuel: "#FFD84D",
  conge_sans_solde: "#F97316",
  maternite: "#8B5CF6",
  absence_sans_justification: "#EF4444",
  deuil: "#6B7280",
  maladie: "#3B82F6",
};
const TYPE_LABELS = {
  conge_annuel: "Congé annuel",
  conge_sans_solde: "Congé sans solde",
  maternite: "Congé de maternité",
  absence_sans_justification: "Absence non justifiée",
  deuil: "Deuil",
  maladie: "Maladie",
};

function safeDate(d) {
  try {
    if (!d) return null;
    const dd = new Date(d);
    return Number.isNaN(dd.getTime()) ? null : dd;
  } catch {
    return null;
  }
}

export default function AbsenceDashboard() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // UI state
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchAbsences();
  }, []);

  const fetchAbsences = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/absences/me");
      const data = res.data?.data?.absences || res.data?.data || [];
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

  const items = useMemo(() => {
    return absences
      .filter((a) => !a.removed)
      .map((a) => {
        const s = safeDate(a.startDate) || new Date();
        const e = safeDate(a.endDate) || s;
        const days = differenceInCalendarDays(e, s) + 1;

        // Handle legacy type names
        const typeKey =
          {
            absence: "absence_sans_justification",
            conge: "conge_annuel",
          }[a.type] || a.type;

        return {
          id: a._id || `${s.toISOString()}-${e.toISOString()}`,
          title: TYPE_LABELS[typeKey] || typeKey,
          type: typeKey,
          status: (a.status || "pending").toLowerCase(),
          start: s,
          end: e,
          days,
          raw: a,
        };
      })
      .sort((a, b) => a.start - b.start);
  }, [absences]);

  const q = useMemo(() => (query || "").trim().toLowerCase(), [query]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filterType !== "all" && it.type !== filterType) return false;
      if (filterStatus !== "all" && it.status !== filterStatus) return false;
      if (q) {
        const hay = `${it.title} ${it.raw?.reason || ""} ${
          it.raw?.user?.username || ""
        }`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [items, filterType, filterStatus, q]);

  const stats = useMemo(() => {
    const total = items.length;
    const now = new Date();
    const upcomingWindow = addDays(now, 30);
    const upcoming = items.filter(
      (it) => it.start >= now && it.start <= upcomingWindow
    ).length;
    const pending = items.filter((it) => it.status === "pending").length;
    let longest = { days: 0, title: null };
    for (const it of items) {
      if (it.days > longest.days) longest = { days: it.days, title: it.title };
    }
    const byType = items.reduce((acc, it) => {
      acc[it.type] = (acc[it.type] || 0) + 1;
      return acc;
    }, {});
    return { total, upcoming, pending, longest, byType };
  }, [items]);

  const upcomingList = useMemo(() => {
    const now = new Date();
    const windowEnd = addDays(now, 30);
    return items
      .filter((it) => it.end >= now && it.start <= windowEnd)
      .slice(0, 8);
  }, [items]);

  const exportCSV = useCallback(() => {
    const header = ["Title", "Type", "Status", "Start", "End", "Reason"].join(
      ","
    );
    const rows = filtered.map((ev) => {
      const r = ev.raw || {};
      const start = ev.start ? format(ev.start, "yyyy-MM-dd") : "";
      const end = ev.end ? format(ev.end, "yyyy-MM-dd") : "";
      const reason = (r.reason || "").replace(/"/g, '""');
      return `"${ev.title}","${ev.type}","${ev.status}","${start}","${end}","${reason}"`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `absences_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  // Modern status badge
  const StatusBadge = ({ status }) => {
    const cls =
      {
        pending: "bg-yellow-500 text-white",
        accepted: "bg-green-500 text-white",
        rejected: "bg-red-500 text-white",
      }[status] || "bg-gray-500 text-white";
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${cls} shadow-sm`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes absences</h1>
          <p className="text-gray-500 mt-1">
            Gestion moderne de vos congés et absences
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAbsences}
            className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-xl text-sm shadow-sm hover:bg-gray-200 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 inline mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Rafraîchir
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm shadow-md transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 inline mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats cards with modern design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-xs font-medium text-gray-500">Total</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-xs font-medium text-gray-500">À venir (30j)</div>
          <div className="text-2xl font-bold mt-1">{stats.upcoming}</div>
        </div>
        <div className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-xs font-medium text-gray-500">En attente</div>
          <div className="text-2xl font-bold mt-1">{stats.pending}</div>
        </div>
        <div className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-xs font-medium text-gray-500">Plus longue</div>
          <div className="text-2xl font-bold mt-1">
            {stats.longest.days > 0 ? `${stats.longest.days} j` : "—"}
          </div>
        </div>
      </div>

      {/* Modern filter controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-6">
        <div className="flex-1 relative">
          <input
            className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            placeholder="Rechercher par motif, type, utilisateur..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 absolute right-4 top-3.5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl overflow-hidden border border-gray-200">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 text-sm font-medium ${
                filterType === "all"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              Tous
            </button>
            {Object.entries(TYPE_LABELS).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilterType(k)}
                className={`px-4 py-2 text-sm font-medium ${
                  filterType === k
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          >
            <option value="all">Tous statuts</option>
            <option value="pending">En attente</option>
            <option value="accepted">Accepté</option>
            <option value="rejected">Rejeté</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main list with modern cards */}
        <div className="lg:col-span-2 space-y-4">
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-100 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="p-5 bg-red-50 rounded-2xl border border-red-100 text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="p-8 bg-gray-50 rounded-2xl text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-4 text-gray-500">
                Aucune absence trouvée avec ces filtres
              </p>
            </div>
          )}

          {!loading &&
            filtered.map((it) => (
              <div
                key={it.id}
                className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="flex items-start gap-4">
                    {/* Modern vertical indicator */}
                    <div
                      className="w-2 h-10 rounded-l-xl"
                      style={{ background: TYPE_COLOR[it.type] }}
                    />
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-gray-900">
                          {it.title}
                        </div>
                        <span className="text-xs text-gray-500">
                          • {it.raw?.user?.username || "Vous"}
                        </span>
                        <span className="text-xs text-gray-500">
                          • {it.days} j
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {format(it.start, "dd MMM yyyy")} →{" "}
                        {format(it.end, "dd MMM yyyy")}
                      </div>
                      {it.raw?.reason && (
                        <div className="mt-2 text-sm text-gray-600">
                          {it.raw.reason.length > 160
                            ? it.raw.reason.slice(0, 160) + "…"
                            : it.raw.reason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <StatusBadge status={it.status} />
                    <button
                      onClick={() => setSelected(it)}
                      className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Modern right sidebar */}
        <aside className="space-y-4">
          {/* Upcoming section */}
          <div className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-gray-900">À venir</div>
              <div className="text-xs text-gray-500">Prochaines absences</div>
            </div>
            {upcomingList.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 mx-auto mb-2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p>Rien de prévu prochainement</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {upcomingList.map((it) => (
                  <li key={it.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {it.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(it.start, "dd MMM")} →{" "}
                        {format(it.end, "dd MMM")}
                      </div>
                    </div>
                    <StatusBadge status={it.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Modern legend */}
          <div className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="font-semibold text-gray-900 mb-3">Légende</div>
            <div className="flex flex-col gap-3">
              {Object.entries(TYPE_COLOR).map(([k, color]) => (
                <div key={k} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ background: color }}
                      className="w-4 h-4 rounded-full"
                    />
                    <div className="text-sm font-medium text-gray-800">
                      {TYPE_LABELS[k] || k}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {items.filter((it) => it.type === k).length}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modern tips section */}
          <div className="p-5 bg-emerald-50 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-emerald-700 mb-1">Conseils</h4>
                <ul className="list-disc pl-5 text-sm text-emerald-700 space-y-1">
                  <li>
                    Cliquez sur "Détails" pour voir le justificatif et le motif
                  </li>
                  <li>Utilisez l'export CSV pour audits et rapports</li>
                  <li>
                    Les absences non justifiées affectent votre solde de congés
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Modern modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelected(null)}
          />
          <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selected.title}
                </h3>
                <div className="text-sm text-gray-500">
                  {format(selected.start, "dd MMM yyyy")} →{" "}
                  {format(selected.end, "dd MMM yyyy")}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={selected.status} />
                <button
                  onClick={() => setSelected(null)}
                  className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>

            {selected.raw?.reason && (
              <div className="mt-6">
                <div className="font-medium text-gray-900 mb-2">Motif</div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selected.raw.reason}
                </p>
              </div>
            )}

            {selected.raw?.proofUrl && (
              <div className="mt-6">
                <div className="font-medium text-gray-900 mb-2">
                  Justificatif
                </div>
                {/\.(jpg|jpeg|png|gif)$/i.test(selected.raw.proofUrl) ? (
                  <a
                    href={selected.raw.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full"
                  >
                    <img
                      src={selected.raw.proofUrl}
                      alt="justificatif"
                      className="max-h-64 object-contain rounded-xl border border-gray-200"
                    />
                  </a>
                ) : (
                  <a
                    href={selected.raw.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm hover:bg-gray-200 transition-colors"
                  >
                    Télécharger le document
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
