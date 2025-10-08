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

  // ---------- NEW: map UI tab keys to backend "type" param ----------
  const typeMap = {
    DemandePrestations: "demandesPrestations",
    FormHeuresSup: "formHeuresSup",
    Declaration: "declarations",
    DeclarationDeTransport: "transport",
  };

  // loading state for per-action buttons (object keyed by id or special keys like 'acceptAll')
  const [actionLoading, setActionLoading] = useState({});

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
        console.log(`Fetched ${items.length} items for ${currentForm}:`, items);
      } catch (err) {
        console.error("Error fetching admin forms:", err);
        setForms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [currentForm, token]);

  // callback ref (more robust in StrictMode and easier to debug)
  const setPrintRootRef = (node) => {
    printComponentRef.current = node;
    if (node) console.debug("Printable root mounted:", node);
  };

  // react-to-print hook (unchanged pageStyle)
  const reactToPrintHandler = useReactToPrint({
    content: () => printComponentRef.current,
    documentTitle: "All_Submitted_Forms",
    pageStyle: `... your existing pageStyle ...`,
    // optional: let devs know if something odd happens
    onBeforePrint: () => console.debug("onBeforePrint — print root:", printComponentRef.current),
    onAfterPrint: () => console.debug("onAfterPrint"),
  });

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

  // ---------- NEW: backend status helpers & action handlers ----------
  const buildStatusUrl = (type, id) => `http://localhost:5000/api/user/admin-update/${type}/${id}`;
  const buildAcceptAllUrl = (type) => `http://localhost:5000/api/user/admin-acceptAll/${type}`;

  const handleStatusChange = async (id, newStatus) => {
    if (!token) {
      alert("No auth token found. Please log in again.");
      return;
    }

    const type = typeMap[currentForm];
    if (!type) return alert("Unsupported form type.");

    setActionLoading((s) => ({ ...s, [id]: true }));
    try {
      const res = await fetch(buildStatusUrl(type, id), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Status update failed: ${res.status} ${txt}`);
      }

      // remove from UI because server only returns pending items
      setForms((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      console.error("handleStatusChange:", err);
      alert("Failed to update status. See console for details.");
    } finally {
      setActionLoading((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
    }
  };

  const acceptForm = (id) => {
    if (!confirm("Accept this submission? This will mark it as accepted.")) return;
    handleStatusChange(id, "accepted");
  };

  const refuseForm = (id) => {
    if (!confirm("Refuse this submission? This will mark it as refused.")) return;
    handleStatusChange(id, "refused");
  };

  // Accept all pending (no refuse-all requested)
  const acceptAll = async () => {
    if (!token) {
      alert("No auth token found. Please log in again.");
      return;
    }

    const type = typeMap[currentForm];
    if (!type) return alert("Unsupported form type.");

    if (!confirm(`Accept all ${forms.length} pending ${currentForm}? This cannot be undone here.`)) return;

    setActionLoading((s) => ({ ...s, acceptAll: true }));
    try {
      const res = await fetch(buildAcceptAllUrl(type), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Accept all failed: ${res.status} ${txt}`);
      }

      const json = await res.json();
      // remove all pending from UI (server only returns pending on fetch)
      setForms([]);
      alert(`Accepted ${json.modifiedCount || json.modified || 0} items.`);
    } catch (err) {
      console.error("acceptAll:", err);
      alert("Failed to accept all. See console.");
    } finally {
      setActionLoading((s) => ({ ...s, acceptAll: false }));
    }
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
            onClick={() => {
              if (!printComponentRef.current) {
                console.error("Print aborted — printable root not mounted:", printComponentRef.current);
                alert("Print failed: printable content is not ready. Try refreshing or wait a second.");
                return;
              }

              try {
                reactToPrintHandler(); // call react-to-print
              } catch (err) {
                console.error("react-to-print failed, falling back to window.print():", err);

                // Fallback: open new window and print innerHTML of root (works like your single-print fallback)
                const printWindow = window.open("", "_blank");
                if (!printWindow) {
                  alert("Please allow popups for printing.");
                  return;
                }
                printWindow.document.open();
                printWindow.document.write("<!doctype html><html><head>");
                // clone styles (best-effort)
                Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach((node) => {
                  try { printWindow.document.head.appendChild(node.cloneNode(true)); } catch (e) {}
                });
                // safety CSS so UI controls hide
                printWindow.document.head.insertAdjacentHTML("beforeend", "<style>.no-print{display:none !important;}</style>");
                printWindow.document.write("</head><body>");
                printWindow.document.write(printComponentRef.current.innerHTML);
                printWindow.document.write("</body></html>");
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
              }
            }}
            disabled={forms.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Print All ({forms.length})
          </button>

          <button
            onClick={acceptAll}
            disabled={forms.length === 0 || !!actionLoading.acceptAll}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {actionLoading.acceptAll ? "Accepting..." : `Accept All (${forms.length})`}
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
                  <td className="p-2">{f.nomPrenoms || f.nom || f.nomPrenom|| "—"}</td>
                  <td className="p-2">{f.createdAt ? new Date(f.createdAt).toLocaleString() : "—"}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedForm(f)} className="px-3 py-1 border rounded">View</button>
                      <button onClick={() => handleSinglePrint(f._id)} className="px-3 py-1 border rounded">Print</button>

                      <button
                        onClick={() => acceptForm(f._id)}
                        disabled={!!actionLoading[f._id]}
                        className="px-3 py-1 rounded border bg-green-50 disabled:opacity-50"
                      >
                        {actionLoading[f._id] === true ? "..." : "Accept"}
                      </button>

                      <button
                        onClick={() => refuseForm(f._id)}
                        disabled={!!actionLoading[f._id]}
                        className="px-3 py-1 rounded border bg-red-50 disabled:opacity-50"
                      >
                        {actionLoading[f._id] === true ? "..." : "Refuse"}
                      </button>
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
          <PrintableAllForms ref={setPrintRootRef} forms={forms} currentForm={currentForm} />
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
