import React, { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiCalendar,
  FiClock,
  FiX,
  FiImage,
  FiLink,
  FiCheckCircle,
} from "react-icons/fi";
import DemandePrestations from "./absences/DemandePrestations";
import DeclarationForm from "./absences/DeclarationDeTransport";
import DemandeForm from "./absences/Declaration";
import FormHeuresSup from "./FormHeuresSup";

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
      alert("Échec du chargement des demandes rejetées");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejected();
  }, []);

  const openDetails = (abs) => setSelected(abs);
  const closeDetails = () => setSelected(null);

  const formatDate = (v) => {
    if (!v) return "—";
    try {
      return new Date(v).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return v;
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate - startDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center mb-8">
              <FiAlertCircle className="text-red-500 w-8 h-8 mr-4" />
              <h2 className="text-3xl font-bold text-gray-800">
                Demandes d'absence rejetées
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-2xl p-6 animate-pulse"
                  >
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <FiCheckCircle className="text-green-500 w-12 h-12" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                  Aucune demande rejetée
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Toutes vos demandes d'absence ont été approuvées. Bravo pour
                  votre équilibre vie professionnelle-personnelle !
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 cursor-pointer overflow-hidden"
                    onClick={() => openDetails(item)}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-600">
                          Type
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            item.type === "maladie"
                              ? "bg-blue-100 text-blue-800"
                              : item.type === "conge"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.type === "maladie"
                            ? "Maladie"
                            : item.type === "conge"
                            ? "Congé"
                            : "Absence"}
                        </span>
                      </div>

                      <div className="flex items-center mb-3">
                        <FiCalendar className="text-blue-500 mr-2" />
                        <span className="text-gray-700">
                          Début: {formatDate(item.startDate)}
                        </span>
                      </div>

                      <div className="flex items-center mb-3">
                        <FiCalendar className="text-blue-500 mr-2" />
                        <span className="text-gray-700">
                          Fin: {formatDate(item.endDate)}
                        </span>
                      </div>

                      <div className="flex items-center mb-3">
                        <FiClock className="text-blue-500 mr-2" />
                        <span className="text-gray-700">
                          Durée:{" "}
                          {calculateDuration(item.startDate, item.endDate)}{" "}
                          jours
                        </span>
                      </div>

                      <div className="flex items-center mb-3">
                        <FiClock className="text-blue-500 mr-2" />
                        <span className="text-gray-700">
                          Soumis le: {formatDate(item.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-start mb-4">
                        <FiAlertCircle className="text-red-500 mt-1 mr-2" />
                        <span className="text-red-600 font-medium">
                          Raison du rejet:
                        </span>
                        <span className="text-red-600 ml-1 italic">
                          {item.justification}
                        </span>
                      </div>

                      {item.proofUrl && (
                        <div className="mt-2 flex items-center">
                          <FiLink className="text-blue-500 mr-2" />
                          <a
                            href={item.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Voir le document justificatif
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Details modal */}
            {selected && (
              <div
                className="fixed inset-0  bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={closeDetails}
              >
                <div
                  className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <FiAlertCircle className="text-red-500 w-6 h-6 mr-3" />
                      <h3 className="text-2xl font-bold text-gray-800">
                        Détails de la demande rejetée
                      </h3>
                    </div>
                    <button
                      onClick={closeDetails}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <FiX className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-gray-500 mb-1">Type</p>
                        <p className="font-medium text-gray-800 text-lg">
                          {selected.type === "maladie"
                            ? "Maladie"
                            : selected.type === "conge"
                            ? "Congé"
                            : "Absence"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Statut</p>
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-lg bg-red-100 text-red-800 font-bold">
                          Rejetée
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Date de début</p>
                        <p className="font-medium text-gray-800 text-lg">
                          {formatDate(selected.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Date de fin</p>
                        <p className="font-medium text-gray-800 text-lg">
                          {formatDate(selected.endDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Durée</p>
                        <p className="font-medium text-gray-800 text-lg">
                          {calculateDuration(
                            selected.startDate,
                            selected.endDate
                          )}{" "}
                          jours
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Soumis le</p>
                        <p className="font-medium text-gray-800 text-lg">
                          {formatDate(selected.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <p className="text-gray-500 mb-2">Raison du rejet</p>
                      <p className="text-red-600 font-medium italic text-lg">
                        {selected.justification}
                      </p>
                    </div>

                    {selected.proofUrl && (
                      <div className="border-t border-gray-200 pt-6">
                        <p className="text-gray-500 mb-2">
                          Document justificatif
                        </p>
                        {/\.(jpg|jpeg|png|gif|webp)$/i.test(
                          selected.proofUrl
                        ) ? (
                          <div className="border border-dashed border-gray-300 rounded-2xl overflow-hidden">
                            <img
                              src={selected.proofUrl}
                              alt="Preuve"
                              className="w-full h-64 object-cover"
                            />
                          </div>
                        ) : (
                          <a
                            href={selected.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-blue-600 hover:underline text-lg"
                          >
                            <FiLink className="mr-2" />
                            Voir le document justificatif
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={closeDetails}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-2xl text-gray-800 font-medium text-lg transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* <DemandePrestations />
      <DeclarationForm />
      <DemandeForm /> */}
      {/* <FormHeuresSup /> */}
    </>
  );
}
