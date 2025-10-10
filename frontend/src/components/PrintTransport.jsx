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
      if (result.success) {
        alert("Déclaration de transport submitted successfully!");
        formRef.current && formRef.current.resetForm && formRef.current.resetForm();
        window.location.reload();
      } else {
        alert("❌ Submission failed: " + result.message);
      }
      
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
  className="px-4 py-2 cursor-pointer bg-blue-600 text-white font-medium rounded border border-blue-700 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition mr-3"
>
  Soumettre
</button>

<button
  onClick={handlePrint}
  className="px-4 py-2 cursor-pointer bg-white text-gray-800 font-medium rounded border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition"
>
  Exporter PDF (A4)
</button>

      {/* ✅ Critical: wrap in div with ref for printing */}
      <div ref={formContainerRef}>
        <DeclarationDeTransport ref={formRef} existingData={existingData} />
      </div>
    </div>
  );
}