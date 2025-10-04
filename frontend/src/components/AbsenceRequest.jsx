"use client";

import React, { useState } from "react";
import DemandePrestations from "./absences/DemandePrestations";
import FormHeuresSup from "./FormHeuresSup";
import DeclarationDeTransport from "./absences/DeclarationDeTransport";
import Declaration from "./absences/Declaration";
import PrintPage from "./PrintableForm";
{
  /* <DemandePrestations />
      <DeclarationDeTransport />
      <DemandeForm /> */
}
{
  /* <FormHeuresSup /> */
}

export default function FormSwitcher() {
  const [currentForm, setCurrentForm] = useState(null);

  const renderForm = () => {
    switch (currentForm) {
      case "DemandePrestations":
        return <DemandePrestations />;
      case "FormHeuresSup":
        return <PrintPage />;
      case "Declaration":
        return <Declaration />;
      case "DeclarationDeTransport":
        return <DeclarationDeTransport />;
      default:
        return (
          <div className="text-center text-gray-600 mt-10">
            <p>Sélectionnez un formulaire pour commencer</p>
          </div>
        );
    }
  };
  console.log("Rendering DeclarationDeTransport component");
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      {/* Navigation buttons */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <button
          onClick={() => setCurrentForm("DemandePrestations")}
          className="px-6 py-3 bg-white shadow-md rounded-xl border border-gray-200 hover:bg-green-100 transition"
        >
          Demande de Prestations
        </button>
        <button
          onClick={() => setCurrentForm("FormHeuresSup")}
          className="px-6 py-3 bg-white shadow-md rounded-xl border border-gray-200 hover:bg-green-100 transition"
        >
          Heures Supplémentaires
        </button>
        <button
          onClick={() => setCurrentForm("Declaration")}
          className="px-6 py-3 bg-white shadow-md rounded-xl border border-gray-200 hover:bg-green-100 transition"
        >
          Declaration d'arrete de travail
        </button>
        <button
          onClick={() => setCurrentForm("DeclarationDeTransport")}
          className="px-6 py-3 bg-white shadow-md rounded-xl border border-gray-200 hover:bg-green-100 transition"
        >
          Déclaration de Transport
        </button>
      </div>

      {/* Dynamic Form */}
      <div className="max-w-3xl mx-auto">{renderForm()}</div>
    </div>
  );
}
