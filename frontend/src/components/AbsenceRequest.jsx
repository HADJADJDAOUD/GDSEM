import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/api";

import {
  FiCalendar,
  FiFileText,
  FiUpload,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
  FiInfo,
  FiEye,
} from "react-icons/fi";

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

  useEffect(() => {
    const stored = localStorage.getItem("endDate");
    if (stored) setUserEndDate(new Date(stored));
    fetchLastAbsence();
  }, []);

  const fetchLastAbsence = async () => {
    try {
      const res = await api.get(`/getMyLastAbs/${userId}`);
      setLastAbsence(res.data.data || null);
    } catch (err) {
      setLastAbsence(null);
      setMsg(err?.response?.data?.message || "Failed to fetch last absence");
    }
  };

  const deletePending = async () => {
    if (!lastAbsence) return;

    try {
      const res = await api.delete(`/absences/${lastAbsence._id}/delete`);
      setMsg(res.data.message || "Pending request deleted");
      fetchLastAbsence();
    } catch (err) {
      setMsg(err?.response?.data?.message || "Failed to delete absence");
    }
  };

  const daysInclusive = (start, end) => {
    if (!start || !end) return 0;
    const s = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const e = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return Math.round((e - s) / 86400000) + 1;
  };

  const validate = () => {
    if (!sDate || !eDate) return "Start and end date required";
    if (eDate < sDate) return "End date must be after or equal to start date";

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
      return "For 'conge', the duration must be exactly 15 or 30 days.";
    }

    return null;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setMsg(null);
    const vErr = validate();
    if (vErr) return setMsg(vErr);

    setLoading(true);
    try {
      let proofUrl = null;

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

  const getTypeIcon = (type) => {
    switch (type) {
      case "maladie":
        return <FiFileText className="w-5 h-5" />;
      case "conge":
        return <FiCalendar className="w-5 h-5" />;
      case "absence":
        return <FiInfo className="w-5 h-5" />;
      default:
        return <FiFileText className="w-5 h-5" />;
    }
  };

  const getMsgIcon = (message) => {
    if (message?.includes("Failed")) {
      return <FiAlertCircle className="w-4 h-4 mr-1" />;
    }
    return <FiCheckCircle className="w-4 h-4 mr-1" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Demande d'Absence
          </h1>
          <p className="text-gray-600">
            Soumettez votre demande d'absence avec facilité
          </p>
        </div>

        {/* Pending Request Card */}
        {lastAbsence && lastAbsence.status === "pending" ? (
          <div className="bg-white rounded-xl shadow-lg border border-green-100 p-6 mb-8 animate-fadeIn">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-2 rounded-full mr-3">
                  <FiAlertCircle className="text-yellow-600 w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Demande en attente
                  </h2>
                  <p className="text-gray-600">
                    Votre demande est en cours de traitement
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium ml-2">
                    {lastAbsence.type === "maladie"
                      ? "Maladie"
                      : lastAbsence.type === "conge"
                      ? "Congé"
                      : "Absence"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Durée:</span>
                  <span className="font-medium ml-2">
                    {daysInclusive(
                      new Date(lastAbsence.startDate),
                      new Date(lastAbsence.endDate)
                    )}{" "}
                    jours
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-500">Période:</span>
                  <span className="font-medium ml-2">
                    {new Date(lastAbsence.startDate).toLocaleDateString(
                      "fr-FR"
                    )}{" "}
                    au{" "}
                    {new Date(lastAbsence.endDate).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            </div>

            {lastAbsence.proofUrl && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FiEye className="w-4 h-4 mr-1 text-blue-600" />
                  Justificatif joint :
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={lastAbsence.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <FiFileText className="w-4 h-4 mr-1" />
                    Voir le document
                  </a>

                  {/\.(jpg|jpeg|png|gif|webp)$/i.test(lastAbsence.proofUrl) && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden max-w-xs shadow-sm">
                      <img
                        src={lastAbsence.proofUrl}
                        alt="Proof"
                        className="h-24 w-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={deletePending}
              className="flex items-center px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <FiTrash2 className="w-4 h-4 mr-2" />
              Supprimer la demande
            </button>

            {msg && (
              <div
                className={`mt-4 flex items-center text-sm p-3 rounded-lg ${
                  msg.includes("Failed")
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : "bg-green-50 text-green-800 border border-green-200"
                }`}
              >
                {getMsgIcon(msg)}
                {msg}
              </div>
            )}
          </div>
        ) : (
          /* Form Section */
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <form onSubmit={submit} className="space-y-6">
              {/* Type Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <span className="mr-2">{getTypeIcon(atype)}</span>
                  Type d'absence
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      value: "maladie",
                      label: "Maladie",
                      desc: "Pour une maladie (durée flexible)",
                    },
                    {
                      value: "conge",
                      label: "Congé",
                      desc: "Congé annuel (15 ou 30 jours)",
                    },
                    {
                      value: "absence",
                      label: "Absence",
                      desc: "Absence sans justificatif",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setAtype(option.value);
                        setSDate(null);
                        setEDate(null);
                        setFile(null);
                        setMsg(null);
                      }}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        atype === option.value
                          ? "border-green-500 bg-green-50 shadow-md transform scale-105"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        <span className="text-sm font-medium text-gray-800 mr-2">
                          {option.label}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            option.value === "maladie"
                              ? "bg-blue-100 text-blue-800"
                              : option.value === "conge"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {option.value === "maladie"
                            ? "Flexible"
                            : option.value === "conge"
                            ? "Fixe"
                            : "Simple"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <FiCalendar className="w-4 h-4 mr-2" />
                    Date de début
                  </label>
                  <DatePicker
                    selected={sDate}
                    onChange={(d) => setSDate(d)}
                    minDate={startMinDate}
                    dateFormat="dd/MM/yyyy"
                    placeholderText={
                      startMinDate
                        ? `Plus tôt: ${startMinDate.toLocaleDateString(
                            "fr-FR"
                          )}`
                        : "Sélectionnez une date"
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow text-gray-800"
                    disabledKeyboardNavigation
                  />
                  {startMinDate && (
                    <p className="text-xs text-gray-500 mt-1">
                      ⚠️ Vous devez attendre après le{" "}
                      {startMinDate.toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <FiCalendar className="w-4 h-4 mr-2" />
                    Date de fin
                  </label>
                  <DatePicker
                    selected={eDate}
                    onChange={(d) => setEDate(d)}
                    minDate={endMinDate}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Sélectionnez une date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow text-gray-800"
                    disabledKeyboardNavigation
                  />
                </div>
              </div>

              {/* Proof Upload */}
              {atype !== "absence" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <FiUpload className="w-4 h-4 mr-2" />
                    Justificatif (facultatif)
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl border-gray-300 hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {file ? (
                          <div className="text-center">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                              <FiCheckCircle className="text-green-600" />
                            </div>
                            <p className="text-sm text-gray-700 font-medium">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {Math.round(file.size / 1024)} Ko
                            </p>
                          </div>
                        ) : (
                          <>
                            <svg
                              className="w-8 h-8 text-gray-400 mb-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              ></path>
                            </svg>
                            <p className="mb-2 text-sm text-gray-600">
                              <span className="font-semibold">
                                Cliquez pour télécharger
                              </span>{" "}
                              ou faites glisser un fichier
                            </p>
                            <p className="text-xs text-gray-500">
                              JPG, PNG, PDF jusqu'à 5MB
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        accept="image/*,application/pdf"
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Pour les maladies et congés, un justificatif est recommandé.
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
                  loading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-5 h-5" />
                    <span>Envoyer la demande</span>
                  </>
                )}
              </button>

              {/* Message Display */}
              {msg && (
                <div
                  className={`p-4 rounded-xl text-sm flex items-center ${
                    msg.includes("Failed")
                      ? "bg-red-50 text-red-800 border border-red-200"
                      : "bg-green-50 text-green-800 border border-green-200"
                  }`}
                >
                  {getMsgIcon(msg)}
                  {msg}
                </div>
              )}

              {/* Validation Tips */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-start">
                  <FiInfo className="text-blue-500 w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p>
                      <strong>Conseils:</strong>
                    </p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>
                        Pour les congés: seules les durées de 15 ou 30 jours
                        sont acceptées
                      </li>
                      <li>
                        La date de début doit être au moins 24h après votre
                        dernière absence
                      </li>
                      <li>
                        Les justificatifs peuvent être des certificats médicaux
                        ou documents officiels
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
