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
  className="px-4 py-2 cursor-pointer bg-blue-600 text-white font-medium rounded border border-blue-700 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition mr-3"
>
  Submit
</button>

<button
  onClick={handlePrint}
  className="px-4 py-2 cursor-pointer bg-white text-gray-800 font-medium rounded border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition"
>
  Export PDF (A4)
</button>

      <div ref={formContainerRef}>
        <FormHeuresSup ref={formRef} existingData={existingData} />
      </div>
    </div>
  );
}
