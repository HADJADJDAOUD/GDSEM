import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  RefreshCw,
  Download,
  Check,
  X,
  User,
  Calendar,
  XCircle,
  CheckCircle,
  FileText,
  Briefcase,
  Clock,
  TrendingUp,
  Baby,
  AlertTriangle,
  Heart,
  Archive,
} from "lucide-react";

import api from "../api/api";
export default function PendingRequests() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [lastUpdated, setLastUpdated] = useState(null);

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
      setLastUpdated(new Date());
      setPage(1);
    } catch (err) {
      console.error("fetchPending error:", err);
      setError("Failed to load pending requests");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const byType = items.reduce((acc, r) => {
      const type = r.absence?.type || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const byRole = items.reduce((acc, r) => {
      const role = r.role || r.absence?.user?.role || "user";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    return { total, byType, byRole };
  }, [items]);

  const getIconForType = (type) => {
    switch (type) {
      case "maladie":
        return <XCircle size={20} className="text-red-500" />;
      case "conge_annuel":
        return <Calendar size={20} className="text-green-500" />;
      case "conge_sans_solde":
        return <Calendar size={20} className="text-yellow-500" />;
      case "maternite":
        return <Baby size={20} className="text-purple-500" />;
      case "absence_sans_justification":
        return <AlertTriangle size={20} className="text-orange-500" />;
      case "deuil":
        return <Heart size={20} className="text-pink-500" />;
      default:
        return <FileText size={20} className="text-gray-500" />;
    }
  };

  const getHintForType = (type) => {
    switch (type) {
      case "maladie":
        return "Sick leave";
      case "conge_annuel":
        return "Annual leave";
      case "conge_sans_solde":
        return "Unpaid leave";
      case "maternite":
        return "Maternity leave";
      case "absence_sans_justification":
        return "Unjustified absence";
      case "deuil":
        return "Bereavement leave";
      default:
        return "";
    }
  };

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    return items.filter((r) => {
      const abs = r.absence || {};
      if (filterType !== "all" && abs.type !== filterType) return false;
      const role = r.role || (abs.user && abs.user.role) || "user";
      if (filterRole !== "all" && role !== filterRole) return false;
      if (from || to) {
        const created = abs.createdAt ? new Date(abs.createdAt) : null;
        if (!created) return false;
        if (from && created < from) return false;
        if (to && created > to) return false;
      }
      if (q) {
        const hay = `${r.username || ""} ${r.email || ""} ${
          abs.type || ""
        }`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, query, filterType, filterRole, dateFrom, dateTo]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

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
    <div className="p-4 max-w-[75rem] mx-auto font-sans">
      <Header
        title="Demandes d'absence en attente"
        subtitle="Demandes en attente de validation par les RH"
      />
      <div className="text-center py-12 text-gray-500">
        Chargement des demandes en attente…
      </div>
    </div>
  );

if (error)
  return (
    <div className="p-4 max-w-[75rem] mx-auto font-sans">
      <Header
        title="Demandes d'absence en attente"
        subtitle="Demandes en attente de validation par les RH"
      />
      <div className="text-red-500 p-4 rounded-lg bg-red-50">{error}</div>
    </div>
  );

return (
  <div className="p-4 max-w-[75rem] mx-auto font-sans">
    <Header
      title="Demandes d'absence en attente"
      subtitle="Examiner et traiter les demandes d'absence soumises par les employés."
      extra={
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPending}
            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-1"
          >
            <RefreshCw size={16} />
            Rafraîchir
          </button>
          <button
            onClick={downloadCSV}
            className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition flex items-center gap-1"
          >
            <Download size={16} />
            Exporter CSV
          </button>
        </div>
      }
    />

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      <StatCard
        label="Total en attente"
        value={stats.total}
        icon={<User size={20} className="text-blue-500" />}
      />
      {Object.entries(stats.byType).map(([type, count]) => (
        <StatCard
          key={type}
          label={type}
          value={count}
          icon={getIconForType(type)}
          hint={getHintForType(type)}
        />
      ))}
      <StatCard
        label="Par rôle"
        value={Object.entries(stats.byRole)
          .map(([k, v]) => `${k}: ${v}`)
          .join(" • ")}
        small
        icon={<Briefcase size={20} className="text-purple-500" />}
      />
      <div className="ml-auto">
        <small className="text-gray-500">
          Dernière mise à jour : {lastUpdated ? formatDateTime(lastUpdated) : "—"}
        </small>
      </div>
    </div>

    <div className="flex flex-wrap gap-4 items-center mt-4">
      <input
        placeholder="Rechercher par nom d'utilisateur, email ou type..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-[200px]"
      />
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg"
      >
        <option value="all">Tous les types</option>
        <option value="conge_annuel">Congé annuel</option>
        <option value="conge_sans_solde">Congé sans solde</option>
        <option value="maladie">Maladie</option>
        <option value="maternite">Maternité</option>
        <option value="absence_sans_justification">
          Absence sans justification
        </option>
        <option value="deuil">Deuil</option>
      </select>
      <select
        value={filterRole}
        onChange={(e) => setFilterRole(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg"
      >
        <option value="all">Tous les rôles</option>
        <option value="user">Utilisateur</option>
        <option value="RH">RH</option>
      </select>
      <label className="flex items-center gap-2">
        <small className="text-gray-500">Du</small>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
      </label>
      <label className="flex items-center gap-2">
        <small className="text-gray-500">Au</small>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
      </label>
      <div className="ml-auto">
        <small className="text-gray-500">{filtered.length} résultat(s)</small>
      </div>
    </div>

    <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Nom d'utilisateur
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Email
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Rôle
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Type
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Statut
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Soumis le
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {paginated.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-gray-500">
                Aucune demande en attente ne correspond à vos filtres.
              </td>
            </tr>
          ) : (
            paginated.map((row) => {
              const abs = row.absence || {};
              return (
                <tr
                  key={abs._id || Math.random()}
                  onClick={() => openDetails(row)}
                  className="border-b border-gray-100 hover:bg-gray-50 hover:cursor-pointer"
                >
                  <td className="px-4 py-3">{row.username || "—"}</td>
                  <td className="px-4 py-3">{row.email || "—"}</td>
                  <td className="px-4 py-3">
                    {row.role || (abs.user && abs.user.role) || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize">{abs.type || "—"}</span>
                  </td>
                  <td className="px-4 py-3">{abs.status || "en attente"}</td>
                  <td className="px-4 py-3">{formatDate(abs.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptAbsence(abs._id)}
                        disabled={actionLoading}
                        className="p-2 text-green-500 hover:text-green-700 rounded-lg transition"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => openDetails(row)}
                        disabled={actionLoading}
                        className="p-2 text-red-500 hover:text-red-700 rounded-lg transition"
                      >
                        <X size={18} />
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/absences/user/${abs.user._id}`)
                        }
                        className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition"
                      >
                        <Archive size={18} />
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

    <div className="flex justify-between items-center mt-4">
      <div className="text-gray-500">
        Affichage de {(page - 1) * pageSize + 1} -{" "}
        {Math.min(page * pageSize, filtered.length)} sur {filtered.length}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Précédent
        </button>
        <span className="px-3 py-1">{page}</span>
        <button
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          disabled={page === pageCount}
          className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>

    {selected && (
      <div
        className="fixed inset-0 bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
        onClick={closeDetails}
      >
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Détails de l'absence</h3>
            <button
              onClick={closeDetails}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User size={18} className="text-blue-500" />
              <div>
                <strong className="text-gray-700">Utilisateur :</strong>{" "}
                {selected.username} {selected.email}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-purple-500" />
              <div>
                <strong className="text-gray-700">Rôle :</strong>{" "}
                {selected.role}
              </div>
            </div>

            <hr className="border-gray-200" />

            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-green-500" />
              <div>
                <strong className="text-gray-700">Type :</strong>{" "}
                {selected.absence?.type}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-yellow-500" />
              <div>
                <strong className="text-gray-700">Statut :</strong>{" "}
                {selected.absence?.status}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-green-500" />
              <div>
                <strong className="text-gray-700">Début :</strong>{" "}
                {formatDate(selected.absence?.startDate)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-green-500" />
              <div>
                <strong className="text-gray-700">Fin :</strong>{" "}
                {formatDate(selected.absence?.endDate)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-yellow-500" />
              <div>
                <strong className="text-gray-700">Soumis le :</strong>{" "}
                {formatDate(selected.absence?.createdAt)}
              </div>
            </div>

            {selected.absence?.reason && (
              <div className="flex items-start gap-2">
                <FileText size={18} className="text-blue-500" />
                <div>
                  <strong className="text-gray-700">Raison :</strong>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    {selected.absence.reason}
                  </div>
                </div>
              </div>
            )}

            {selected.absence?.proofUrl && (
              <div className="flex items-start gap-2">
                <FileText size={18} className="text-blue-500" />
                <div>
                  <strong className="text-gray-700">Justificatif :</strong>
                  {/\.(jpg|jpeg|png|gif)$/i.test(selected.absence.proofUrl) ? (
                    <a
                      href={selected.absence.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block"
                    >
                      <img
                        src={selected.absence.proofUrl}
                        alt="Justificatif"
                        className="max-w-[220px] max-h-[220px] rounded-lg border border-gray-200"
                      />
                    </a>
                  ) : (
                    <a
                      href={selected.absence.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-blue-500 hover:underline"
                    >
                      Voir le justificatif
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="block mb-2 font-medium">
              Justification du refus (obligatoire pour refuser)
            </label>
            <textarea
              value={selected.justifyText}
              onChange={(e) =>
                setSelected({ ...selected, justifyText: e.target.value })
              }
              placeholder="Expliquez pourquoi cette demande doit être refusée (visible par l'utilisateur)"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => acceptAbsence(selected.absence._id)}
              disabled={actionLoading}
              className="px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2"
            >
              <Check size={16} />
              Accepter
            </button>

            <button
              onClick={() =>
                declineAbsence(selected.absence._id, selected.justifyText)
              }
              disabled={actionLoading}
              className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
            >
              <X size={16} />
              Refuser
            </button>

            <button
              onClick={closeDetails}
              className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

}

function Header({ title, subtitle, extra }) {
  return (
    <div className="flex items-start gap-4 justify-between">
      <div>
        <h2 className="m-0 text-2xl font-bold">{title}</h2>
        {subtitle && <p className="mt-1 text-gray-500">{subtitle}</p>}
      </div>
      {extra}
    </div>
  );
}

function StatCard({ label, value, hint = "", small = false, icon }) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${
        small ? "min-w-28" : "min-w-36"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <div>
          <div className="text-gray-500 text-sm">{label}</div>
          <div className="font-bold text-lg mt-1">{value}</div>
          {hint && <div className="text-gray-500 text-sm mt-1">{hint}</div>}
        </div>
      </div>
    </div>
  );
}

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