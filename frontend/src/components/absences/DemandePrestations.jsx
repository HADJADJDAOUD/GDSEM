// src/components/DemandePrestations.jsx
"use client";

import React, { forwardRef, useState } from "react";
import SignatureField from "../SignatureField";
import "./DemandePrestations.css";

const DemandePrestations = forwardRef((props, ref) => {
  const [signatureUrl, setSignatureUrl] = useState(null);

  const handleSaveSignature = (dataUrl) => {
    setSignatureUrl(dataUrl);
  };

  return (
    <div className="form-container" dir="rtl" lang="fr" ref={ref}>
      {/* Header */}
      <header className="header">
        <div className="logo-placeholder"></div>
        <div className="header-text">
          <h1 className="arabic-title">
            التعاضدية العامة لعمال البريد و المواصلات
          </h1>
          <p className="french-title">
            Mutuelle Générale des Postes & Télécommunications
          </p>
        </div>
      </header>

      <h2 className="form-title">DEMANDE DE PRESTATIONS</h2>

      {/* Checkboxes Section */}
      <div className="checkbox-section">
        <div className="checkbox-row">
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="nature" /> Prestations
            en Nature
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="indemnites" /> Indemnités
            journalières
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="optiques" /> Prestations
            Optiques
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="naissance" /> Naissance
          </label>
        </div>

        <div className="checkbox-row">
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="circoncision" /> Circoncision
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="hospitalisation" /> Frais
            d’hospitalisation
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="chirurgie" /> Chirurgie
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="laser" /> Laser-ophtalmologie
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="scanner" /> Scanner
          </label>
        </div>

        <div className="checkbox-row">
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="irm" /> IRM
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="angiographie" /> Angiographie
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="eco-doppler" /> Eco-doppler
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="divers" /> Divers radiologies
            et analyses médicales
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="deces" /> Décès
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="other" /> (1)
          </label>
        </div>
      </div>

      <p className="note">(1) Mettre une croix sur la case de la prestation demandée.</p>

      {/* Info Fields */}
      <div className="field-section">
        <p className="label">
          Numéro d’adhésion à la Mutuelle Générale des PTT :
          <input type="text" className="input-line large" />
        </p>
        <p className="label">
          Nom & Prénoms :
          <input type="text" className="input-line large" />
        </p>
        <p className="label">
          Date et lieu de naissance :
          <input type="text" className="input-line medium" /> Wilaya :
          <input type="text" className="input-line small" />
        </p>
        <p className="label">
          Organisme employeur :
          <input type="text" className="input-line medium" /> Wilaya ou région :
          <input type="text" className="input-line small" />
        </p>
        <p className="label">
          Numéros de compte CCP :
          <input type="text" className="input-line large" />
        </p>
        <p className="label">
          Adresse domicile :
          <input type="text" className="input-line large" />
        </p>
      </div>

      {/* Beneficiary Section */}
      <div className="field-section">
        <p className="label">**Bénéficiaire :**</p>
        <div className="checkbox-row beneficiary-options">
          <label className="checkbox-item">
            <input type="checkbox" name="beneficiaire" value="adherent" /> Adhérent
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="beneficiaire" value="epouse" /> Epouse
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="beneficiaire" value="enfant" /> Enfant
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="beneficiaire" value="autres" /> Autres
            personnes à charge
          </label>
        </div>
        <p className="label">
          Nom & Prénoms :
          <input type="text" className="input-line large" />
        </p>
        <p className="label">
          Date et lieu de naissance :
          <input type="text" className="input-line medium" /> Wilaya :
          <input type="text" className="input-line small" />
        </p>
        <p className="label">
          Nature de la prestation :
          <input type="text" className="input-line large" />
        </p>
      </div>

      {/* Declaration + Signature */}
      <div className="declaration-section">
        <p>Pièces justificatives :</p>
        <p>
          Je déclare sur l’honneur que les renseignements fournis et motifs
          invoqués ci-dessus sont sincères et véritables.
        </p>

        {/* Signature area */}
        <div style={{ marginTop: 0 }}>
          <div className="no-print" style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, marginBottom: 6 }}>Signature :</div>
            <SignatureField
              onSave={handleSaveSignature}
              initialDataUrl={signatureUrl}
            />
          </div>

          {/* Printed image */}
          {signatureUrl ? (
            <img
              src={signatureUrl}
              alt="signature"
              style={{
                width: "50mm",
                border: "0px solid #eee",
                display: "block",
                marginTop: 0,
              }}
              className="print-only"
            />
          ) : (
            <div
              style={{
                height: 28,
                border: "1px dashed #ddd",
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
          Mutuelle Générale des Postes & Télécommunications - 15, Rue des Frères
          Meslem Alger
          <br />
          Tél. : 021 23 73 58 / 46 - 021 23 09 49 / 94 . Fax : 021 23 83 36
        </div>
      </footer>
    </div>
  );
});

export default DemandePrestations;
