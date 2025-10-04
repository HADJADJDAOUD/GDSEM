  import React, { useRef } from "react";
  import { useReactToPrint } from "react-to-print";
  import FormHeuresSup from "./FormHeuresSup";

  export default function PrintPage() {
    const formRef = useRef();

    const handlePrint = useReactToPrint({
      contentRef: formRef, // ✅ v3 API, not content()
      documentTitle: "Formulaire_Heures_Sup",
      pageStyle: `
        @page { size: A4; margin: 12mm; }
        body { -webkit-print-color-adjust: exact; }
      `,
    });

    return (
      <div className="p-4">
        <button
          onClick={handlePrint}
          className="px-3 py-1 border rounded hover:bg-gray-100"
        >
          Export PDF (A4)
        </button>

        {/* The form to be printed */}
        <FormHeuresSup ref={formRef} />
      </div>
    );
  }
