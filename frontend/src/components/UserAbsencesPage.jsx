import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Calendar,
  Check,
  X,
  AlertTriangle,
  Baby,
  Heart,
  FileText,
  Clock,
  User,
  Briefcase,
  TrendingUp,
  BarChart2,
  Archive,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
} from "lucide-react";
import api from "../api/api";

export default function UserAbsencesPage() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both main absences and rejected absences
        const [mainRes, rejectedRes] = await Promise.all([
          api.get(`/${userId}/absences`),
          api.get(`/userRejectedAbsences/${userId}`),
        ]);
        console.log("Main absences response:", mainRes.data.data.absences);
        console.log("Rejected absences response:", rejectedRes.data.data);
        setSelected(null);
        // Combine the data
        const allAbsences = [
          ...mainRes.data.data.absences,
          ...rejectedRes.data.data,
        ];

        setData({
          user: mainRes.data.data.user,
          absences: allAbsences,
        });
        console.log("Fetched absences data:", allAbsences);
      } catch (err) {
        console.error("fetchAbsences error:", err);
        setError("Failed to load absence data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e)) return 0;
    return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatDate = (v) => {
    if (!v) return "—";
    try {
      const d = new Date(v);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return v;
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case "maladie":
        return <X size={16} className="text-red-500 mr-2" />;
      case "conge_annuel":
        return <Calendar size={16} className="text-green-500 mr-2" />;
      case "conge_sans_solde":
        return <Calendar size={16} className="text-yellow-500 mr-2" />;
      case "maternite":
        return <Baby size={16} className="text-purple-500 mr-2" />;
      case "absence_sans_justification":
        return <AlertTriangle size={16} className="text-orange-500 mr-2" />;
      case "deuil":
        return <Heart size={16} className="text-pink-500 mr-2" />;
      default:
        return <FileText size={16} className="text-gray-500 mr-2" />;
    }
  };
  // consoling the absences data
  
 if (loading) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-500">Chargement des enregistrements d'absence...</p>
      </div>
    </div>
  );
}

if (error) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center py-12">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  );
}

const openDetails = (row) => setSelected({ ...row, justifyText: "" });
const closeDetails = () => setSelected(null);

if (!data || !data.absences || data.absences.length === 0) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center py-12">
        <div className="text-gray-400 text-4xl mb-4">📄</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">
          Aucun enregistrement d'absence trouvé
        </h2>
        <p className="text-gray-500">Cet utilisateur n'a aucune demande d'absence</p>
      </div>
    </div>
  );
}


  // Calculate absence statistics
  let totalDays = 0;
  const typeBreakdown = {
    maladie: { count: 0, days: 0 },
    conge_annuel: { count: 0, days: 0 },
    conge_sans_solde: { count: 0, days: 0 },
    maternite: { count: 0, days: 0 },
    absence_sans_justification: { count: 0, days: 0 },
    deuil: { count: 0, days: 0 },
  };

  const statusBreakdown = {
    accepted: 0,
    pending: 0,
    declined: 0,
  };

  data.absences.forEach((absence) => {
    // Calculate days for this absence
    const duration = calculateDays(absence.startDate, absence.endDate);
    totalDays += duration;

    // Update type breakdown
    if (typeBreakdown[absence.type] !== undefined) {
      typeBreakdown[absence.type].count++;
      typeBreakdown[absence.type].days += duration;
    }

    // Update status breakdown
    if (statusBreakdown[absence.status] !== undefined) {
      statusBreakdown[absence.status]++;
    }
  });

  // Sort absences by most recent first
  const sortedAbsences = [...data.absences].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

 return (
  <div className="p-6 max-w-6xl mx-auto">
    {/* En-tête de l'utilisateur avec statistiques */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
      <div className="flex items-center">
        <User size={32} className="text-blue-500 mr-4" />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {data.user.username}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <span className="text-gray-500 px-3 py-1 rounded bg-gray-100">
              {data.user.email}
            </span>
            <span className="text-gray-500 px-3 py-1 rounded bg-gray-100">
              {data.user.role}
            </span>
            <span className="text-gray-500 px-3 py-1 rounded bg-gray-100">
              {data.user.service || "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Statistiques de l'utilisateur */}
      <div className="flex flex-wrap gap-4">
        <div className="bg-blue-50 p-4 rounded-xl shadow-sm">
          <div className="flex items-center">
            <Calendar size={20} className="text-blue-500 mr-2" />
            <div>
              <span className="text-2xl font-bold text-gray-800">
                {totalDays}
              </span>
              <p className="text-sm text-gray-500">Jours d’absence total</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-xl shadow-sm">
          <div className="flex items-center">
            <CheckCircle size={20} className="text-green-500 mr-2" />
            <div>
              <span className="text-2xl font-bold text-gray-800">
                {statusBreakdown.accepted}
              </span>
              <p className="text-sm text-gray-500">Absences approuvées</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-xl shadow-sm">
          <div className="flex items-center">
            <ClockIcon size={20} className="text-yellow-500 mr-2" />
            <div>
              <span className="text-2xl font-bold text-gray-800">
                {statusBreakdown.pending}
              </span>
              <p className="text-sm text-gray-500">Demandes en attente</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-xl shadow-sm">
          <div className="flex items-center">
            <XCircle size={20} className="text-red-500 mr-2" />
            <div>
              <span className="text-2xl font-bold text-gray-800">
                {statusBreakdown.declined}
              </span>
              <p className="text-sm text-gray-500">Demandes refusées</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Cartes de statistiques */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Répartition des types d'absence */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <BarChart2 size={24} className="text-purple-500 mr-3" />
          <h2 className="text-xl font-semibold">Répartition par type d’absence</h2>
        </div>

        <div className="space-y-4">
          {Object.entries(typeBreakdown).map(([type, data]) => {
            if (data.count === 0) return null;

            return (
              <div key={type} className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    {getIconForType(type)}
                    <span className="font-medium capitalize">
                      {type.replace("_", " ")}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {data.days} jours
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 rounded-full h-2"
                    style={{ width: `${(data.days / totalDays) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{data.count} demandes</span>
                  <span>{((data.days / totalDays) * 100).toFixed(1)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activité récente */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <TrendingUp size={24} className="text-yellow-500 mr-3" />
          <h2 className="text-xl font-semibold">Activité récente</h2>
        </div>

        <div className="space-y-4">
          {sortedAbsences.slice(0, 3).map((absence) => (
            <div key={absence._id} className="flex items-start">
              <div
                className={`w-2 h-2 rounded-full mt-1 mr-3 ${
                  absence.status === "accepted"
                    ? "bg-green-500"
                    : absence.status === "declined"
                    ? "bg-red-500"
                    : "bg-yellow-500"
                }`}
              ></div>
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  {getIconForType(absence.type)}
                  <span className="font-medium">
                    {absence.type.replace("_", " ")}
                  </span>
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      absence.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : absence.status === "declined"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {absence.status === "accepted"
                      ? "acceptée"
                      : absence.status === "declined"
                      ? "refusée"
                      : "en attente"}
                  </span>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar size={16} className="mr-2" />
                  <span>
                    {formatDate(absence.startDate)} -{" "}
                    {formatDate(absence.endDate)}
                  </span>
                </div>
                <div className="flex items-center text-gray-400 text-sm mt-1">
                  <Clock size={16} className="mr-2" />
                  <span>Soumise : {formatDate(absence.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Historique des absences */}
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center">
          <Archive size={24} className="text-gray-500 mr-3" />
          <h2 className="text-xl font-semibold">Historique des absences</h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durée
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Soumise le
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAbsences.map((absence) => {
              const duration = calculateDays(
                absence.startDate,
                absence.endDate
              );
              return (
                <tr
                  key={absence._id}
                  onClick={() => openDetails(absence)}
                  className="hover:bg-gray-50 hover:cursor-pointer "
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getIconForType(absence.type)}
                      <span className="text-sm font-medium">
                        {absence.type.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(absence.startDate)} -{" "}
                      {formatDate(absence.endDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {duration} jour{duration !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(absence.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        absence.status === "accepted"
                          ? "bg-green-100 text-green-800"
                          : absence.status === "declined"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {absence.status === "accepted"
                        ? "acceptée"
                        : absence.status === "declined"
                        ? "refusée"
                        : "en attente"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => openDetails(absence)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Voir les détails
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* Détails de l’absence */}
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
            <h3 className="text-xl font-bold">Détails de l’absence</h3>
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
                {data.user.username} {data.user.email}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-purple-500" />
              <div>
                <strong className="text-gray-700">Rôle :</strong>{" "}
                {data.user.role}
              </div>
            </div>

            <hr className="border-gray-200" />

            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-green-500" />
              <div>
                <strong className="text-gray-700">Type :</strong>{" "}
                {selected?.type}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-yellow-500" />
              <div>
                <strong className="text-gray-700">Statut :</strong>{" "}
                <span
                  className={`px-2 py-1 rounded-full  font-medium ${
                    selected?.status === "accepted"
                      ? "bg-green-100 text-green-800"
                      : selected?.status === "declined"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {selected?.status === "accepted"
                    ? "acceptée"
                    : selected?.status === "declined"
                    ? "refusée"
                    : "en attente"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-green-500" />
              <div>
                <strong className="text-gray-700">Début :</strong>{" "}
                {formatDate(selected?.startDate)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-green-500" />
              <div>
                <strong className="text-gray-700">Fin :</strong>{" "}
                {formatDate(selected?.endDate)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-yellow-500" />
              <div>
                <strong className="text-gray-700">Soumise le :</strong>{" "}
                {formatDate(selected?.createdAt)}
              </div>
            </div>

            {selected?.status === "declined" && selected?.justification && (
              <div className="flex items-start gap-2">
                <FileText size={18} className="text-blue-500" />
                <div>
                  <strong className="text-gray-700">Raison du refus :</strong>
                  <div className="mt-2 p-3 bg-red-100 rounded-lg">
                    {selected.justification}
                  </div>
                </div>
              </div>
            )}

            {selected?.proofUrl && (
              <div className="flex items-start gap-2">
                <FileText size={18} className="text-blue-500" />
                <div>
                  <strong className="text-gray-700">Justificatif :</strong>
                  {/\.(jpg|jpeg|png|gif)$/i.test(selected.proofUrl) ? (
                    <a
                      href={selected.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block"
                    >
                      <img
                        src={selected.proofUrl}
                        alt="Justificatif"
                        className="max-w-[220px] max-h-[220px] rounded-lg border border-gray-200"
                      />
                    </a>
                  ) : (
                    <a
                      href={selected.proofUrl}
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
        </div>
      </div>
    )}
  </div>
);

}
