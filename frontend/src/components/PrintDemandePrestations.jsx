// PrintDemandePrestations.jsx
import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import DemandePrestations from "./absences/DemandePrestations";
import { useEffect } from "react";
export default function PrintDemandePrestations({ existingData }) {
  const formContainerRef = useRef(); 
  const formRef = useRef(); 
 // ref to child component
  // ref to child component
console.log("existingData",existingData)
  const handlePrint = useReactToPrint({
    contentRef: formContainerRef,
    documentTitle: "Demande_Prestations",
    pageStyle: `
        @page { size: A4; margin: 12mm; }
        body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          img { -webkit-print-color-adjust: exact; }
      `,
  });

  const handleSend = async () => {
    if (!formRef.current) {
      console.error("❌ Form ref not found.");
      return;
    }

    const data = formRef.current.getFormDataForBackend?.();
    if (!data) {
      console.error("❌ getFormDataForBackend returned nothing.");
      return;
    }

    console.log("📤 Data to send:", data);

    try {
     const res = await fetch("http://localhost:5000/api/user/demandesPrestations", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`, // if protected
  },
  body: JSON.stringify(data),
});

      const result = await res.json();
      console.log("✅ Backend response:", result);
      if (result.success) {
        alert("Demande de prestations submitted successfully!");
        // clear form or other actions
        formRef.current && formRef.current.resetForm && formRef.current.resetForm();
      } else {
        alert("❌ Submission failed: " + result.message);

      }
    } catch (err) {
      console.error("❌ Failed to send data:", err);
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
      <button onClick={handleSend} className="px-3 py-1 border rounded hover:bg-gray-100 mr-2">
        Send to Backend
      </button>
      <button onClick={handleSafePrint} className="px-3 py-1 border rounded hover:bg-gray-100">
        Export PDF (A4)
      </button>

      {/* ✅ This is the key: real DOM wrapper */}
      <div ref={formContainerRef}>
  <DemandePrestations ref={formRef} existingData={existingData} />
</div>
    </div>
  );
}