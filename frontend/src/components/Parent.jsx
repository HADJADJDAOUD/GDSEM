import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import PrintPage from "./PrintPage";

export default function Parent() {
  const formRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: formRef, // ✅ new API in v3
    documentTitle: "Formulaire",
  });

  return (
    <div>
      <button
        onClick={handlePrint}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Print
      </button>

      {/* Pass the ref into the page you want to print */}
      <PrintPage ref={formRef} />
    </div>
  );
}
