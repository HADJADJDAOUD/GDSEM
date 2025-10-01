// src/components/DemandePrestations.jsx
import React from "react";
import "./DemandePrestations.css"; // move your CSS here

const DemandePrestations = () => {
  return (
    <div className="form-container" dir="rtl" lang="fr">
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

      <div className="checkbox-section">
        <div className="checkbox-row">
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="nature" />{" "}
            Prestations en Nature
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="indemnites" />{" "}
            Indemnités journalières
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="optiques" />{" "}
            Prestations Optiques
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="naissance" />{" "}
            Naissance
          </label>
        </div>

        <div className="checkbox-row">
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="circoncision" />{" "}
            Circoncision
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="hospitalisation" />{" "}
            Frais d’hospitalisation
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="chirurgie" />{" "}
            Chirurgie
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="laser" />{" "}
            Laser-ophtalmologie
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
            <input type="checkbox" name="prestation" value="angiographie" />{" "}
            Angiographie
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="eco-doppler" />{" "}
            Eco-doppler
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="divers" /> Divers
            radiologies et analyses médicales
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="deces" /> Décès
          </label>
          <label className="checkbox-item">
            <input type="checkbox" name="prestation" value="other" /> (1)
          </label>
        </div>
      </div>

      <p className="note">
        (1) Mettre une croix sur la case de la prestation demandée.
      </p>

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

      <div className="field-section">
        <p className="label">**Bénéficiaire :**</p>
        <div className="checkbox-row beneficiary-options">
          <label className="checkbox-item">
            <input type="checkbox" name="beneficiaire" value="adherent" />{" "}
            Adhérent
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

      <div className="declaration-section">
        <p>Pièces justificatives :</p>
        <p>
          Je déclare sur l’honneur que les renseignements fournis et motifs
          invoqués ci-dessus sont sincères et véritables.
          <span className="signature-line">
            Signature <input type="text" className="input-line signature" />
          </span>
        </p>
      </div>

      <div className="reserved-frame">
        <p>Cadre réservé au centre payeur :</p>
      </div>

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
};

export default DemandePrestations;
