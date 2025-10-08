// PrintTransport.jsx
import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import DeclarationDeTransport from "./absences/DeclarationDeTransport"; // adjust path if needed

export default function PrintTransport({ existingData }) {
  const formContainerRef = useRef(); // ✅ DOM node for printing
  const formRef = useRef(); // ✅ ref to child component (for data extraction)

  const handlePrint = useReactToPrint({
    contentRef: formContainerRef,
    documentTitle: "Declaration_De_Transport",
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
      console.error("❌ No form data returned");
      return;
    }

    console.log("📤 Sending transport declaration:", data);

    try {
     const res = await fetch("http://localhost:5000/api/user/transport", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
  body: JSON.stringify(data),
});

      const result = await res.json();
      console.log("✅ Backend response:", result);
    } catch (err) {
      console.error("❌ Failed to send transport declaration:", err);
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
        <DeclarationDeTransport ref={formRef} existingData={existingData} />
      </div>
    </div>
  );
}