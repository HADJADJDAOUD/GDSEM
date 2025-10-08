// PrintableAllForms.jsx
import React, { forwardRef } from "react";
import DemandePrestations from "./absences/DemandePrestations";
import DeclarationDeTransport from "./absences/DeclarationDeTransport";
import Declaration from "./absences/Declaration";
import FormHeuresSup from "./FormHeuresSup";

const PrintableAllForms = forwardRef(({ forms = [], currentForm = "DemandePrestations" }, ref) => {
  const renderForm = (form) => {
    const props = { existingData: form || {} };
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
    // Note: data-print-root helps debugging in devtools
    <div ref={ref} className="print-all-root" data-print-root>
      {Array.isArray(forms) && forms.length > 0 ? (
        forms.map((f, i) => (
          <div key={f && (f._id || f.id) ? (f._id || f.id) : `print-${i}`} style={{ pageBreakAfter: "always", marginBottom: 12 }}>
            {renderForm(f)}
          </div>
        ))
      ) : (
        // keep an empty node so react-to-print still finds something
        <div style={{ minHeight: 10 }} />
      )}
    </div>
  );
});

export default PrintableAllForms;
