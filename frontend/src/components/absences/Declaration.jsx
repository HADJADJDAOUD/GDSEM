// src/components/Declaration.jsx
import React, { forwardRef, useState, useImperativeHandle } from "react";
import "./Declaration.css";
import SignatureField from "../SignatureField";
import { useEffect } from "react";
const Declaration = forwardRef(({ existingData = {} }, ref) => {
  const [signatureAgentUrl, setSignatureAgentUrl] = useState(null);

  // Initialize form state
  const [formData, setFormData] = useState({
    accidentTravail: existingData.accidentTravail || "", // "oui" or "non"
    accidentCirculation: existingData.accidentCirculation || "", // "oui" or "non"
    nomPrenom: existingData.nomPrenom || "",
    dateNaissance: existingData.dateNaissance || "",
    lieuNaissance: existingData.lieuNaissance || "",
    numeroImmatriculation: existingData.numeroImmatriculation || "",
    employeur: existingData.employeur || "",
    dateDebutArret: existingData.dateDebutArret || "",
    dateFinArret: existingData.dateFinArret || "",
    lieuResidence: existingData.lieuResidence || "",
    faitA: existingData.faitA || "",
    faitLe: existingData.faitLe || "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field, value) => {
    // Only one checkbox per group can be selected (simulate radio)
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlesave = (dataUrl) => {
    setSignatureAgentUrl(dataUrl);
  };

  // ✅ Expose method for parent
  useImperativeHandle(ref, () => ({
    getFormDataForBackend: () => ({
      ...formData,
      signatureAgent: signatureAgentUrl,
    }),
  }), [formData, signatureAgentUrl]);
useEffect(() => {
  if (existingData && Object.keys(existingData).length > 0) {
    
    setFormData({
      ...formData,
      ...existingData,
    });
    if (existingData.signatureAgent) setSignatureAgentUrl(existingData.signatureAgent);
  }
}, [existingData]);

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
  return (
    // Root must be a plain div (no <form>)
    <div className="form-container">
      <header className="official-header">
        <div className="logo-placeholder">CNAS</div>
        <div className="header-text">
          <p className="arabic-text">وزارة العمل والتشغيل والضمان الاجتماعي</p>
          
          <p className="sub-text">الصندوق الوطني للتأمينات الإجتماعية للعمال الأجراء</p>
          <p className="sub-text bold-underline">- Assurances Sociales -</p>
        </div>
      </header>

      <h1 className="declaration-title">DÉCLARATION</h1>
      <h2 className="form-subtitle">
        RÉSIDENCE DE L'ASSURÉ(E) SOCIAL(E) PENDANT SON ARRÊT DE TRAVAIL
      </h2>

      <div className="consecutif-section">
        <p className="consecutif-title">Arrêt de travail consécutif :</p>

        <div className="question-row">
          <span className="question-text">- à un accident du travail ? (1)</span>
          <label className="radio-option">
            <input
              type="checkbox"
              checked={formData.accidentTravail === "oui"}
              onChange={() => handleCheckboxChange("accidentTravail", "oui")}
            />{" "}
            OUI
          </label>
          <label className="radio-option">
            <input
              type="checkbox"
              checked={formData.accidentTravail === "non"}
              onChange={() => handleCheckboxChange("accidentTravail", "non")}
            />{" "}
            NON
          </label>
        </div>

        <div className="question-row">
          <span className="question-text">- à un accident de la circulation ? (1)</span>
          <label className="radio-option">
            <input
              type="checkbox"
              checked={formData.accidentCirculation === "oui"}
              onChange={() => handleCheckboxChange("accidentCirculation", "oui")}
            />{" "}
            OUI
          </label>
          <label className="radio-option">
            <input
              type="checkbox"
              checked={formData.accidentCirculation === "non"}
              onChange={() => handleCheckboxChange("accidentCirculation", "non")}
            />{" "}
            NON
          </label>
        </div>
      </div>

      <div className="fields-section">
        <p className="field-line">
          <span className="label-text">Je soussigné(e) M. / Mme :</span>
          <input
            type="text"
            className="input-line large"
            value={formData.nomPrenom}
            onChange={(e) => handleInputChange("nomPrenom", e.target.value)}
          />
        </p>

        <p className="field-line split-line">
          <span className="label-text">Né(e) le :</span>
          <input
            type="text"
            className="input-line birth-date"
            value={formData.dateNaissance}
            onChange={(e) => handleInputChange("dateNaissance", e.target.value)}
          />
          <span className="label-text">à :</span>
          <input
            type="text"
            className="input-line medium"
            value={formData.lieuNaissance}
            onChange={(e) => handleInputChange("lieuNaissance", e.target.value)}
          />
        </p>

        <p className="field-line full-line">
          <span className="label-text">
            Immatriculé(e) à la sécurité sociale sous le numéro:
          </span>
          <input
            type="text"
            className="input-line immatriculation-revised"
            placeholder="12-digit number"
            value={formData.numeroImmatriculation}
            onChange={(e) => handleInputChange("numeroImmatriculation", e.target.value)}
          />
        </p>

        <p className="field-line">
          <span className="label-text">Et employé(e) à :</span>
          <input
            type="text"
            className="input-line large"
            value={formData.employeur}
            onChange={(e) => handleInputChange("employeur", e.target.value)}
          />
        </p>

        <p className="field-line date-range-line">
          <span className="label-text">
            Déclare que, durant mon arrêt de travail allant du:
          </span>
          <input
            type="text"
            className="input-line date-input"
            placeholder="JJ/MM/AAAA"
            value={formData.dateDebutArret}
            onChange={(e) => handleInputChange("dateDebutArret", e.target.value)}
          />
          <span className="label-text">au:</span>
          <input
            type="text"
            className="input-line date-input"
            placeholder="JJ/MM/AAAA"
            value={formData.dateFinArret}
            onChange={(e) => handleInputChange("dateFinArret", e.target.value)}
          />
        </p>

        <p className="field-line">
          <span className="label-text">Mon lieu de résidence est :</span>
          <input
            type="text"
            className="input-line large"
            value={formData.lieuResidence}
            onChange={(e) => handleInputChange("lieuResidence", e.target.value)}
          />
        </p>
      </div>

      <div className="signature-block">
        <p className="final-text">
          Et m'engage à informer les services de la caisse de tout changement de résidence pouvant survenir pendant cette période.
        </p>

        <div className="fait-le-row">
          <span className="fait-le-label">Fait à</span>
          <input
            type="text"
            className="input-line fait-le-field"
            value={formData.faitA}
            onChange={(e) => handleInputChange("faitA", e.target.value)}
          />
          <span className="fait-le-label">le</span>
          <input
            type="text"
            className="input-line fait-le-field"
            value={formData.faitLe}
            onChange={(e) => handleInputChange("faitLe", e.target.value)}
          />
        </div>

        <div className="signature-row">
          <div className="signature-column">
            <p>Signature de l'Agent</p>
             {!isRH && (
            <div className="no-print" style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 6 }}>Signature :</div>
              <SignatureField
                onSave={handlesave}
                initialDataUrl={signatureAgentUrl}
              />
            </div>
          )}
            <div style={{ marginTop: 8 }}>
              {signatureAgentUrl ? (
                <img
                  src={signatureAgentUrl}
                  alt="agent-signature"
                  style={{ width: "50mm", border: "0px solid #eee", display: "block" }}
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

          <div className="signature-column right-align">
            <p>Signature de l'Assuré(e) Social(e)</p>
            <div className="signature-space"></div>
          </div>
        </div>
      </div>

      <footer className="footer-note">
        <p>
          (1) Si OUI, l’agent des prestations doit remettre à l’assuré un formulaire à remplir concernant l’accident (AS.10).
        </p>
        <span className="reference">IMP. CNAS/11-2023 - C.ADM.05</span>
      </footer>
    </div>
  );
});

export default Declaration;