// src/components/DemandePrestations.jsx
"use client";
import { useEffect } from "react";
import React, { forwardRef, useState, useImperativeHandle } from "react";
import SignatureField from "../SignatureField";
import "./DemandePrestations.css";

const DemandePrestations = forwardRef(({ existingData = {} }, ref) => {
    const [signatureUrl, setSignatureUrl] = useState(existingData.signature || null);

   const [formData, setFormData] = useState({
    prestations: existingData.prestations || [],
    numeroAdhesion: existingData.numeroAdhesion || "",
    nomPrenoms: existingData.nomPrenoms || "",
    dateNaissance: existingData.dateNaissance || "",
    wilayaNaissance: existingData.wilayaNaissance || "",
    organismeEmployeur: existingData.organismeEmployeur || "",
    wilayaEmployeur: existingData.wilayaEmployeur || "",
    numeroCompteCCP: existingData.numeroCompteCCP || "",
    adresseDomicile: existingData.adresseDomicile || "",
    beneficiaireType: existingData.beneficiaireType || [],
    beneficiaireNomPrenoms: existingData.beneficiaireNomPrenoms || "",
    beneficiaireDateNaissance: existingData.beneficiaireDateNaissance || "",
    beneficiaireWilaya: existingData.beneficiaireWilaya || "",
    naturePrestation: existingData.naturePrestation || "",
  });
 const isRH = (() => {
    if (typeof window === "undefined") return false;
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return false;
      const user = JSON.parse(userStr);
      return user.role === "RH";
    } catch (e) {
      console.warn("Failed to parse user from localStorage");
      return false;
    }
  })();

  const handleCheckboxChange = (group, value) => {
    setFormData((prev) => {
      const current = prev[group] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [group]: updated };
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSignature = (dataUrl) => {
    setSignatureUrl(dataUrl);
  };

  // ✅ Expose the exact method your parent expects
  useImperativeHandle(ref, () => ({
    getFormDataForBackend: () => ({
      ...formData,
      signature: signatureUrl,
    }),
  }), [formData, signatureUrl]);
useEffect(() => {
  if (existingData && Object.keys(existingData).length > 0) {
    setFormData({
      ...formData,
      ...existingData,
    });
    if (existingData.signature) setSignatureUrl(existingData.signature);
  }
}, [existingData]);
  return (
    // ❌ Remove <form> — it's not needed and can confuse refs
    <div className="form-container print-page-245" dir="rtl" lang="fr">
      {/* Header */}
      <header className="header">
        <div className="logo-placeholder"></div>
        <div className="header-text">
          <h1 className="arabic-title">التعاضدية العامة لعمال البريد و المواصلات</h1>
          <p className="french-title">Mutuelle Générale des Postes & Télécommunications</p>
        </div>
      </header>

      <h2 className="form-title">DEMANDE DE PRESTATIONS</h2>

      {/* Checkboxes Section */}
      <div className="checkbox-row ">
        {[
         { name: "nature", label: "Prestations en Nature" },
          { name: "indemnites", label: "Indemnités journalières" },
          { name: "optiques", label: "Prestations Optiques" },
          { name: "naissance", label: "Naissance" },
               { name: "circoncision", label: "Circoncision" },
            { name: "hospitalisation", label: "Frais d’hospitalisation" },
            { name: "chirurgie", label: "Chirurgie" },
            { name: "laser", label: "Laser-ophtalmologie" },
            { name: "scanner", label: "Scanner" },
            { name: "irm", label: "IRM" },
            { name: "angiographie", label: "Angiographie" },
            { name: "eco-doppler", label: "Eco-doppler" },
            { name: "divers", label: "Divers radiologies et analyses médicales" },
            { name: "deces", label: "Décès" },
            { name: "other", label: "(1)" },
        ].map((item) => (
          <label key={item.name} className="checkbox-item">
            <input
              type="checkbox"
              checked={formData.prestations.includes(item.name)}
              onChange={() => handleCheckboxChange("prestations", item.name)}
            />{" "}
            {item.label}
          </label>
        ))}

       
      </div>

      <p className="note">(1) Mettre une croix sur la case de la prestation demandée.</p>

      {/* Info Fields */}
      <div className="field-section">
        <p className="label">
          Numéro d’adhésion à la Mutuelle Générale des PTT :
          <input
            type="text"
            className="input-line large"
            value={formData.numeroAdhesion}
            onChange={(e) => handleInputChange("numeroAdhesion", e.target.value)}
          />
        </p>
        <p className="label">
          Nom & Prénoms :
          <input
            type="text"
            className="input-line large"
            value={formData.nomPrenoms}
            onChange={(e) => handleInputChange("nomPrenoms", e.target.value)}
          />
        </p>
        <p className="label">
          Date et lieu de naissance :
          <input
            type="text"
            className="input-line medium"
            value={formData.dateNaissance}
            onChange={(e) => handleInputChange("dateNaissance", e.target.value)}
          />{" "}
          Wilaya :
          <input
            type="text"
            className="input-line small"
            value={formData.wilayaNaissance}
            onChange={(e) => handleInputChange("wilayaNaissance", e.target.value)}
          />
        </p>
        <p className="label">
          Organisme employeur :
          <input
            type="text"
            className="input-line medium"
            value={formData.organismeEmployeur}
            onChange={(e) => handleInputChange("organismeEmployeur", e.target.value)}
          />{" "}
          Wilaya ou région :
          <input
            type="text"
            className="input-line small"
            value={formData.wilayaEmployeur}
            onChange={(e) => handleInputChange("wilayaEmployeur", e.target.value)}
          />
        </p>
        <p className="label">
          Numéros de compte CCP :
          <input
            type="text"
            className="input-line large"
            value={formData.numeroCompteCCP}
            onChange={(e) => handleInputChange("numeroCompteCCP", e.target.value)}
          />
        </p>
        <p className="label">
          Adresse domicile :
          <input
            type="text"
            className="input-line large"
            value={formData.adresseDomicile}
            onChange={(e) => handleInputChange("adresseDomicile", e.target.value)}
          />
        </p>
      </div>

      {/* Beneficiary Section */}
      <div className="field-section">
        <p className="label">**Bénéficiaire :**</p>
        <div className="checkbox-row beneficiary-options">
          {[
            { name: "adherent", label: "Adhérent" },
            { name: "epouse", label: "Epouse" },
            { name: "enfant", label: "Enfant" },
            { name: "autres", label: "Autres personnes à charge" },
          ].map((item) => (
            <label key={item.name} className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.beneficiaireType.includes(item.name)}
                onChange={() => handleCheckboxChange("beneficiaireType", item.name)}
              />{" "}
              {item.label}
            </label>
          ))}
        </div>
        <p className="label">
          Nom & Prénoms :
          <input
            type="text"
            className="input-line large"
            value={formData.beneficiaireNomPrenoms}
            onChange={(e) => handleInputChange("beneficiaireNomPrenoms", e.target.value)}
          />
        </p>
        <p className="label">
          Date et lieu de naissance :
          <input
            type="text"
            className="input-line medium"
            value={formData.beneficiaireDateNaissance}
            onChange={(e) => handleInputChange("beneficiaireDateNaissance", e.target.value)}
          />{" "}
          Wilaya :
          <input
            type="text"
            className="input-line small"
            value={formData.beneficiaireWilaya}
            onChange={(e) => handleInputChange("beneficiaireWilaya", e.target.value)}
          />
        </p>
        <p className="label">
          Nature de la prestation :
          <input
            type="text"
            className="input-line large"
            value={formData.naturePrestation}
            onChange={(e) => handleInputChange("naturePrestation", e.target.value)}
          />
        </p>
      </div>

      {/* Declaration + Signature */}
      <div className="declaration-section">
        <p>Pièces justificatives :</p>
        <p>
          Je déclare sur l’honneur que les renseignements fournis et motifs invoqués ci-dessus sont sincères et véritables.
        </p>

      <div style={{ marginTop: 0 }}>
          {/* Only show signature pad if NOT RH */}
          {!isRH && (
            <div className="no-print" style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 6 }}>Signature :</div>
              <SignatureField
                onSave={handleSaveSignature}
                initialDataUrl={signatureUrl}
              />
            </div>
          )}

          {/* Always show saved signature (or placeholder) */}
          {signatureUrl ? (
            <img
              src={signatureUrl}
              alt="signature"
              style={{ width: "50mm", display: "block", marginTop: 0 }}
              className="print-only"
            />
          ) : (
            <div
              style={{
                height: 28,
                border: "0px dashed #ddd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999",
              }}
            >
              No signature saved
            </div>
          )}
        </div>
      </div>

      <div className="reserved-frame">
        <p>Cadre réservé au centre payeur :</p>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-logo-placeholder">MG P&T</div>
        <div className="contact-info">
          Mutuelle Générale des Postes & Télécommunications - 15, Rue des Frères Meslem Alger
          <br />
          Tél. : 021 23 73 58 / 46 - 021 23 09 49 / 94 . Fax : 021 23 83 36
        </div>
      </footer>
    </div>
  );
});

export default DemandePrestations;