// PrintPage.jsx
import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import FormHeuresSup from "./FormHeuresSup";

export default function PrintPage({ existingData }) {
  const formContainerRef = useRef();
  const formRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: formContainerRef, // ✅ DOM ref, not component ref
    documentTitle: "Formulaire_Heures_Sup",
     pageStyle: `
        @page { size: A4; margin: 12mm; }
        body { -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          img { -webkit-print-color-adjust: exact; }
      `,
  });
 const handleSend = async () => {
    if (!formRef.current) {
      console.error("Form ref not found");
      return;
    }

    const data = formRef.current.getFormDataForBackend();
    console.log("Data to send:", data);

    try {
      const res = await fetch("http://localhost:5000/api/user/formHeuresSup", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`, // if you're using JWT
  },
  body: JSON.stringify(data),
});

      const result = await res.json();  
      console.log("✅ Backend response:", result);
    } catch (err) {
      console.error("❌ Failed to send data:", err);
    }
  };
  const handleSafePrint = () => {
    if (!formContainerRef.current) {
      console.error("Nothing to print: ref is not attached");
      return;
    }
    console.log("Printing DOM node found:", formContainerRef.current);
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
        onClick={handlePrint}
        className="px-3 py-1 border rounded hover:bg-gray-100"
      >
        Export PDF (A4)
      </button>

      <div ref={formContainerRef}>
        <FormHeuresSup ref={formRef} existingData={existingData} />
      </div>
    </div>
  );
}
