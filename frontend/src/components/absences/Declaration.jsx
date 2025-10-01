// src/components/Declaration.jsx
import React from "react";
import "./Declaration.css"; // move styles here

export default function Declaration() {
  return (
    <div className="form-container">
      <header className="official-header">
        <div className="logo-placeholder">CNAS</div>
        <div className="header-text">
          <p className="arabic-text">وزارة العمل والتشغيل والضمان الاجتماعي</p>
          <p className="french-text">
            Caisse Nationale des Assurances Sociales
          </p>
          <p className="sub-text">
            الصندوق الوطني للتأمينات الإجتماعية للعمال الأجراء
          </p>
          <p className="sub-text bold-underline">- Assurances Sociales -</p>
        </div>
      </header>

      <h1 className="declaration-title">DÉCLARATION</h1>
      <h2 className="form-subtitle">
        RÉSIDENCE DE L&apos;ASSURÉ(E) SOCIAL(E) PENDANT SON ARRÊT DE TRAVAIL
      </h2>

      <div className="consecutif-section">
        <p className="consecutif-title">Arrêt de travail consécutif :</p>

        <div className="question-row">
          <span className="question-text">
            - à un accident du travail ? (1)
          </span>
          <label className="radio-option">
            <input type="checkbox" name="accident_travail" value="oui" /> OUI
          </label>
          <label className="radio-option">
            <input type="checkbox" name="accident_travail" value="non" /> NON
          </label>
        </div>

        <div className="question-row">
          <span className="question-text">
            - à un accident de la circulation ? (1)
          </span>
          <label className="radio-option">
            <input type="checkbox" name="accident_circulation" value="oui" />{" "}
            OUI
          </label>
          <label className="radio-option">
            <input type="checkbox" name="accident_circulation" value="non" />{" "}
            NON
          </label>
        </div>
      </div>

      <div className="fields-section">
        <p className="field-line">
          <span className="label-text">Je soussigné(e) M. / Mme :</span>
          <input type="text" className="input-line large" />
        </p>

        <p className="field-line split-line">
          <span className="label-text">Né(e) le :</span>
          <input type="text" className="input-line birth-date" />
          <span className="label-text">à :</span>
          <input type="text" className="input-line medium" />
        </p>

        <p className="field-line full-line">
          <span className="label-text">
            Immatriculé(e) à la sécurité sociale sous le numéro:
          </span>
          <input
            type="text"
            className="input-line immatriculation-revised"
            placeholder="12-digit number"
          />
        </p>

        <p className="field-line">
          <span className="label-text">Et employé(e) à :</span>
          <input type="text" className="input-line large" />
        </p>

        <p className="field-line date-range-line">
          <span className="label-text">
            Déclare que, durant mon arrêt de travail allant du:
          </span>
          <input
            type="text"
            className="input-line date-input"
            placeholder="JJ/MM/AAAA"
          />
          <span className="label-text">au:</span>
          <input
            type="text"
            className="input-line date-input"
            placeholder="JJ/MM/AAAA"
          />
        </p>

        <p className="field-line">
          <span className="label-text">Mon lieu de résidence est :</span>
          <input type="text" className="input-line large" />
        </p>
      </div>

      <div className="signature-block">
        <p className="final-text">
          Et m&apos;engage à informer les services de la caisse de tout
          changement de résidence pouvant survenir pendant cette période.
        </p>

        <div className="fait-le-row">
          <span className="fait-le-label">Fait à</span>
          <input type="text" className="input-line fait-le-field" />
          <span className="fait-le-label">le</span>
          <input type="text" className="input-line fait-le-field" />
        </div>

        <div className="signature-row">
          <div className="signature-column">
            <p>Signature de l&apos;Agent</p>
            <div className="signature-space"></div>
          </div>
          <div className="signature-column right-align">
            <p>Signature de l&apos;Assuré(e) Social(e)</p>
            <div className="signature-space"></div>
          </div>
        </div>
      </div>

      <footer className="footer-note">
        <p>
          (1) Si OUI, l’agent des prestations doit remettre à l’assuré un
          formulaire à remplir concernant l’accident (AS.10).
        </p>
        <span className="reference">IMP. CNAS/11-2023 - C.ADM.05</span>
      </footer>
    </div>
  );
}
