// PrintDeclarationPage.jsx
import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import Declaration from "./absences/Declaration"; // adjust path if needed

export default function PrintDeclarationPage({ existingData }) {
  const formContainerRef = useRef(); // DOM node for printing
  const formRef = useRef(); // ref to access getFormDataForBackend

  const handlePrint = useReactToPrint({
    contentRef: formContainerRef,
    documentTitle: "Declaration_Residence_Arret",
    pageStyle: `
      @page { size: A4; margin: 12mm; }
      body { -webkit-print-color-adjust: exact; }
      .no-print { display: none !important; }
      img { -webkit-print-color-adjust: exact; }
    `,
  });

  const handleSend = async () => {
    if (!formRef.current) {
      console.error("❌ Form ref not attached");
      return;
    }

    const data = formRef.current.getFormDataForBackend?.();
    if (!data) {
      console.error("❌ No data returned from form");
      return;
    }

    console.log("📤 Sending declaration data:", data);

    try {
     const res = await fetch("http://localhost:5000/api/user/declarations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`, // include token
  },
  body: JSON.stringify(data),
});

      const result = await res.json();
      console.log("✅ Backend response:", result);
    } catch (err) {
      console.error("❌ Failed to send declaration:", err);
    }
  };

  const handleSafePrint = () => {
    if (!formContainerRef.current) {
      console.error("❌ Nothing to print");
      return;
    }
    handlePrint();
  };

  return (
    <div className="p-4">
      <button
        onClick={handleSend}
        className="px-3 py-1 border rounded hover:bg-gray-100 mr-2"
      >
        Send to Backend
      </button>

      <button
        onClick={handleSafePrint}
        className="px-3 py-1 border rounded hover:bg-gray-100"
      >
        Export PDF (A4)
      </button>

      {/* ✅ Critical: wrap in div with ref for printing */}
      <div ref={formContainerRef}>
        <Declaration  ref={formRef} existingData={existingData} />
      </div>
    </div>
  );
}