// PrintableAllForms.jsx
import React, { forwardRef } from "react";

// Presentational components only (must accept `existingData` and not call useReactToPrint)
import DemandePrestations from "./absences/DemandePrestations";
import DeclarationDeTransport from "./absences/DeclarationDeTransport";
import Declaration from "./absences/Declaration";
import FormHeuresSup from "./FormHeuresSup";

const PrintableAllForms = forwardRef(({ forms = [], currentForm = "DemandePrestations" }, ref) => {
  const renderForm = (form) => {
    const props = { existingData: form };
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
    // THIS must be a DOM node so useReactToPrint can access it.
    <div ref={ref} className="print-all-root">
      {forms.map((f) => (
        <div key={f._id} style={{ pageBreakAfter: "always", marginBottom: 12 }}>
          {renderForm(f)}
        </div>
      ))}
    </div>
  );
});

export default PrintableAllForms;
