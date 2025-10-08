"use client";

import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

// Form components
import DemandePrestations from "./absences/DemandePrestations";
import DeclarationDeTransport from "./absences/DeclarationDeTransport";
import Declaration from "./absences/Declaration";
import FormHeuresSup from "./FormHeuresSup";

// Print preview wrappers (for "View" modal)
import PrintDemandePrestations from "./PrintDemandePrestations";
import PrintTransport from "./PrintTransport";
import PrintDeclarationPage from "./PrintDeclarationPage";
import PrintPage from "./PrintableForm";

// New printable wrapper for "Print All"
import PrintableAllForms from "./PrintableAllForms";

export default function AdminFormsPage() {
  const [currentForm, setCurrentForm] = useState("DemandePrestations");
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const printComponentRef = useRef(null); // ✅ For react-to-print with React component

  const endpointMap = {
    DemandePrestations: "/api/user/admin-demandesPrestations",
    FormHeuresSup: "/api/user/admin-formHeuresSup",
    Declaration: "/api/user/admin-declarations",
    DeclarationDeTransport: "/api/user/admin-transport",
  };

  useEffect(() => {
    const fetchForms = async () => {
      if (!token) {
        setForms([]);
        return;
      }

      setLoading(true);
      try {
        const url = "http://localhost:5000" + endpointMap[currentForm];
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Fetch failed: ${res.status} ${text}`);
        }

        const json = await res.json();
        const items = Array.isArray(json.data) ? json.data : [];
        setForms(items);
      } catch (err) {
        console.error("Error fetching admin forms:", err);
        setForms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [currentForm, token]);

  // ✅ Print all using React component (so pageStyle works)
  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
    documentTitle: "All_Submitted_Forms",
    pageStyle: `
      @page {
        size: A4;
        margin: 12mm;
      }
      body {
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
        font-family: Arial, sans-serif;
        font-size: 14px;
      }
      .no-print {
        display: none !important;
      }
      .print-only {
        display: block !important;
      }
      img {
        -webkit-print-color-adjust: exact;
      }
    `,
  });

  // Single print fallback (optional, but kept)
  const handleSinglePrint = (id) => {
  const singleWrapper = document.getElementById(`print-single-${id}`);
  if (!singleWrapper) {
    alert("Cannot print: element not found.");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups for printing.");
    return;
  }

  // Clone head styles (link + style tags) but also inject a safety .no-print rule.
  printWindow.document.open();
  printWindow.document.write("<!doctype html><html><head>");

  // Clone <link rel="stylesheet"> and <style> tags
  const headNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
  headNodes.forEach((node) => {
    try {
      printWindow.document.head.appendChild(node.cloneNode(true));
    } catch (e) {
      // ignore cross-origin clones or weird nodes
      console.warn("Failed to clone style node for print:", e);
    }
  });

  // Ensure .no-print exists in the new window (extra safety if styles didn't include it)
  const forcedNoPrint = `<style> .no-print{ display:none !important; } </style>`;
  printWindow.document.head.insertAdjacentHTML("beforeend", forcedNoPrint);

  printWindow.document.write("</head><body>");

  // Get the HTML, remove .no-print elements before writing
  const tmp = document.createElement("div");
  tmp.innerHTML = singleWrapper.innerHTML;

  // Remove nodes with class .no-print (so UI controls don't show)
  Array.from(tmp.querySelectorAll(".no-print")).forEach((n) => n.remove());

  // Also avoid printing elements with inline style `display:none` in the source:
  Array.from(tmp.querySelectorAll("[style]")).forEach((el) => {
    const s = el.getAttribute("style") || "";
    if (/\bdisplay\s*:\s*none\b/i.test(s)) el.removeAttribute("style");
  });

  printWindow.document.write(tmp.innerHTML);
  printWindow.document.write("</body></html>");
  printWindow.document.close();

  // Wait a moment for styles to apply, then print
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

  // Render printable for single view (used in modal)
  const renderPrintPreview = () => {
  if (!selectedForm) return null;
  const props = { existingData: selectedForm };

  switch (currentForm) {
    case "DemandePrestations":
      return <DemandePrestations {...props} />;
    case "FormHeuresSup":
      return <FormHeuresSup {...props} />;
    case "Declaration":
      return <Declaration {...props} />;
    case "DeclarationDeTransport":
      return <DeclarationDeTransport {...props} />;
    default:
      return <div>Unknown form</div>;
  }
};

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-2xl font-semibold mb-6">Admin — Submitted Forms</h1>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <button
          onClick={() => setCurrentForm("DemandePrestations")}
          className={`px-6 py-3 rounded-xl border ${currentForm === "DemandePrestations" ? "bg-green-100" : "bg-white"}`}
        >
          Demandes de Prestations
        </button>
        <button
          onClick={() => setCurrentForm("FormHeuresSup")}
          className={`px-6 py-3 rounded-xl border ${currentForm === "FormHeuresSup" ? "bg-green-100" : "bg-white"}`}
        >
          Heures Supplémentaires
        </button>
        <button
          onClick={() => setCurrentForm("Declaration")}
          className={`px-6 py-3 rounded-xl border ${currentForm === "Declaration" ? "bg-green-100" : "bg-white"}`}
        >
          Declaration d'arrêt de travail
        </button>
        <button
          onClick={() => setCurrentForm("DeclarationDeTransport")}
          className={`px-6 py-3 rounded-xl border ${currentForm === "DeclarationDeTransport" ? "bg-green-100" : "bg-white"}`}
        >
          Déclaration de Transport
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between max-w-5xl mx-auto mb-4">
        <div>
          <strong>{forms.length}</strong> {forms.length <= 1 ? "submission" : "submissions"} found
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            disabled={forms.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Print All ({forms.length})
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-5xl mx-auto bg-white p-4 rounded shadow">
        {loading ? (
          <div>Loading...</div>
        ) : forms.length === 0 ? (
          <div className="text-center py-6 text-gray-600">No submissions yet.</div>
        ) : (
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">#</th>
                <th className="p-2">Submitted By</th>
                <th className="p-2">Name on form</th>
                <th className="p-2">Date</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((f, idx) => (
                <tr key={f._id || idx} className="border-b">
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2">{(f.user && (f.user.name || f.user.email)) || "—"}</td>
                  <td className="p-2">{f.nomPrenoms || f.nom || "—"}</td>
                  <td className="p-2">{f.createdAt ? new Date(f.createdAt).toLocaleString() : "—"}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedForm(f)} className="px-3 py-1 border rounded">View</button>
                      <button onClick={() => handleSinglePrint(f._id)} className="px-3 py-1 border rounded">Print</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Selected form preview */}
      {selectedForm && (
        <div className="max-w-3xl mx-auto mt-6 bg-white rounded shadow p-4">
          <button onClick={() => setSelectedForm(null)} className="mb-3 text-sm text-gray-600">← Back</button>
          {renderPrintPreview()}
        </div>
      )}

      {/* ✅ HIDDEN PRINTABLE COMPONENT FOR "PRINT ALL" */}
      <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '210mm' }}>
          <PrintableAllForms ref={printComponentRef} forms={forms} currentForm={currentForm} />
      </div>

      {/* Fallback DOM for single print (optional) */}
      <div style={{ display: 'none' }}>
        {forms.map((f) => (
          <div id={`print-single-${f._id}`} key={`single-${f._id}`}>
            <div style={{ pageBreakAfter: "always" }}>
              {(() => {
                const props = { existingData: f };
                switch (currentForm) {
                  case "DemandePrestations": return <DemandePrestations {...props} />;
                  case "FormHeuresSup": return <FormHeuresSup {...props} />;
                  case "Declaration": return <Declaration {...props} />;
                  case "DeclarationDeTransport": return <DeclarationDeTransport {...props} />;
                  default: return <div>Unknown</div>;
                }
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}