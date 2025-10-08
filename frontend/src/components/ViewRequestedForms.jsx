"use client";

import React, { useEffect, useState } from "react";
import PrintDemandePrestations from "./PrintDemandePrestations";
import PrintTransport from "./PrintTransport";
import PrintDeclarationPage from "./PrintDeclarationPage";
import PrintPage from "./PrintableForm";

export default function ViewRequestedForms() {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch all user forms from each route
  useEffect(() => {
    const fetchAllForms = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No auth token found.");
          setLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const endpoints = [
          { url: "http://localhost:5000/api/user/formHeuresSup/me", type: "HeuresSup" },
          { url: "http://localhost:5000/api/user/declarations/me", type: "Declaration" },
          { url: "http://localhost:5000/api/user/transport/me", type: "DeclarationDeTransport" },
          { url: "http://localhost:5000/api/user/demandesPrestations/me", type: "DemandePrestations" },
        ];

        const responses = await Promise.allSettled(
          endpoints.map((e) =>
            fetch(e.url, { headers }).then((r) => r.ok ? r.json() : [])
          )
        );
        console.log("Fetched form responses:", responses);

        responses.forEach((res, i) => {
  console.log(`🔎 [${endpoints[i].type}] Response:`, res.value);
});
            /// consoling the first reponse 
            console.log("First response data:", responses[0].value.forms);
        // Flatten all results, tag each with its type
        const allForms = responses.flatMap((res, i) => {
  if (res.status !== "fulfilled" || !res.value) return [];

  const val = res.value;

  // normalize based on known response structure
  const data =
    val.forms ||
    val.declarations ||
    val.transports ||
    val.demandes ||
    val.data ||
    []; // fallback

  if (!Array.isArray(data)) {
    console.warn(`⚠ Unexpected response format for ${endpoints[i].url}:`, val);
    return [];
  }

  return data.map((f) => ({ ...f, type: endpoints[i].type }));
});
        console.log("All fetched forms:", allForms);
        // Sort by newest first
        setForms(allForms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        console.error("❌ Error fetching forms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllForms();
  }, []);

  // ✅ Select correct printable component based on form type
  const renderForm = (form) => {
    switch (form.type) {
      case "DemandePrestations":
        return <PrintDemandePrestations existingData={form} />;
      case "DeclarationDeTransport":
        return <PrintTransport existingData={form} />;
      case "Declaration":
        return <PrintDeclarationPage existingData={form} />;
      case "HeuresSup":
        return <PrintPage existingData={form} />;
      default:
        return <p>Unknown form type: {form.type}</p>;
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading your forms...
      </div>
    );

  if (selectedForm) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <button
          onClick={() => setSelectedForm(null)}
          className="mb-4 px-4 py-2 bg-blue-100 border rounded hover:bg-blue-200"
        >
          ← Back to All Forms
        </button>
        <div className="bg-white shadow-md rounded-xl p-4">
          {renderForm(selectedForm)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <h1 className="text-2xl font-semibold text-center mb-8">
        📋 My Requested Forms
      </h1>

      {forms.length === 0 ? (
        <p className="text-center text-gray-600">
          You haven’t submitted any forms yet.
        </p>
      ) : (
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 border-b">#</th>
                <th className="p-3 border-b">Type</th>
                <th className="p-3 border-b">Name</th>
                <th className="p-3 border-b">Date</th>
                <th className="p-3 border-b text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form, index) => (
                <tr
                  key={form._id || index}
                  className="hover:bg-gray-50 transition"
                >
                  <td className="p-3 border-b">{index + 1}</td>
                  <td className="p-3 border-b">{form.type}</td>
                  <td className="p-3 border-b">
                    {form.nomPrenom || form.nom || form.nomPrenoms || "—"}
                  </td>
                  <td className="p-3 border-b">
                    {form.createdAt
                      ? new Date(form.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="p-3 border-b text-center">
                    <button
                      onClick={() => setSelectedForm(form)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                    >
                      View / Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
