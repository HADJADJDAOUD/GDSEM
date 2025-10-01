// FormHeuresSup.jsx
import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function FormHeuresSup() {
  const printRef = useRef();

  const initialState = {
    nom: "",
    prenom: "",
    service: "",
    interventionType: { distance: false, presentiel: false },
    lieuIntervention: "",
    datesIntervention: "",
    horaires: "",
    totalHeuresSupplementaires: "",
    objetsIntervention: "",
    nomDemandeur: "",
    signatureDateDemandeur: "",
    nomSuperieur: "",
    signatureDateSuperieur: "",
  };

  const [formData, setFormData] = useState(initialState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      interventionType: { ...prev.interventionType, [name]: checked },
    }));
  };

  const exportPDF = async () => {
    const input = printRef.current;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let position = 0;
    if (imgHeight < pageHeight) {
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    } else {
      // Split into multiple pages if needed
      let heightLeft = imgHeight;
      let y = 0;
      while (heightLeft > 0) {
        pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        y -= pageHeight;
        if (heightLeft > 0) pdf.addPage();
      }
    }

    pdf.save("Formulaire_Heures_Sup.pdf");
  };

  return (
    <>
      <div className="mb-4 print:hidden">
        <button
          type="button"
          onClick={exportPDF}
          className="px-3 py-1 border rounded hover:bg-gray-100"
        >
          Export PDF (A4)
        </button>
      </div>

      {/* Form container */}
      <div
        ref={printRef}
        className="max-w-2xl mx-auto bg-white border border-gray-300 p-6 md:p-8 text-black shadow"
        style={{ width: "210mm", minHeight: "297mm" }} // force A4 page size
      >
        {/* Header */}
        <header className="text-center mb-4">
          <h1 className="text-[14px] font-bold leading-snug">
            DIRECTION DE L&apos;INFORMATIQUE ET DE LA SÉCURITÉ DU RÉSEAU
          </h1>
        </header>

        {/* Form Info */}
        <div className="text-center mb-4">
          <h2 className="text-[13px] font-bold underline mb-1">
            FORMULAIRE DE DÉCLARATION D&apos;HEURES SUPPLÉMENTAIRES
          </h2>
          <p className="text-[12px] text-gray-700">
            À joindre aux demandes de récupération dans un délai ne dépassant
            pas 60 jours.
          </p>
        </div>

        {/* Fields */}
        <div className="text-[13px] mb-6">
          <p className="mb-2">
            <span className="font-bold mr-2">NOM :</span>
            <input
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              type="text"
              className="border-0 border-b border-dashed border-black outline-none w-3/4 bg-transparent"
            />
          </p>

          <p className="mb-2">
            <span className="font-bold mr-2">PRÉNOM :</span>
            <input
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              type="text"
              className="border-0 border-b border-dashed border-black outline-none w-3/4 bg-transparent"
            />
          </p>

          <p className="mb-2">
            <span className="font-bold mr-2">SERVICE :</span>
            <input
              name="service"
              value={formData.service}
              onChange={handleChange}
              type="text"
              className="border-0 border-b border-dashed border-black outline-none w-3/4 bg-transparent"
            />
          </p>

          <p className="font-bold mb-2">Type d&apos;intervention :</p>
          <div className="ml-6 mb-4 space-y-1">
            <label className="block text-[13px]">
              <input
                type="checkbox"
                name="distance"
                checked={formData.interventionType.distance}
                onChange={handleCheckbox}
                className="mr-1"
              />
              A distance (VPN)
            </label>
            <label className="block text-[13px]">
              <input
                type="checkbox"
                name="presentiel"
                checked={formData.interventionType.presentiel}
                onChange={handleCheckbox}
                className="mr-1"
              />
              En présentiel
            </label>
          </div>

          <p className="mb-2">
            <span className="font-bold mr-2">Lieu :</span>
            <input
              name="lieuIntervention"
              value={formData.lieuIntervention}
              onChange={handleChange}
              type="text"
              className="border-0 border-b border-dashed border-black outline-none w-4/5 bg-transparent"
            />
          </p>

          <p className="mb-2">
            <span className="font-bold mr-2">Date(s) :</span>
            <input
              name="datesIntervention"
              value={formData.datesIntervention}
              onChange={handleChange}
              type="text"
              className="border-0 border-b border-dashed border-black outline-none w-3/4 bg-transparent"
            />
          </p>

          <p className="mb-2">
            <span className="font-bold mr-2">Horaires :</span>
            <input
              name="horaires"
              value={formData.horaires}
              onChange={handleChange}
              type="text"
              className="border-0 border-b border-dashed border-black outline-none w-3/4 bg-transparent"
            />
          </p>

          <p className="mb-2">
            <span className="font-bold mr-2">Total heures sup :</span>
            <input
              name="totalHeuresSupplementaires"
              value={formData.totalHeuresSupplementaires}
              onChange={handleChange}
              type="text"
              className="border-0 border-b border-dashed border-black outline-none w-3/4 bg-transparent"
            />
          </p>

          <p className="mb-2">
            <span className="font-bold mr-2">Objet(s) :</span>
            <input
              name="objetsIntervention"
              value={formData.objetsIntervention}
              onChange={handleChange}
              type="text"
              className="border-0 border-b border-dashed border-black outline-none w-[90%] bg-transparent"
            />
          </p>
        </div>

        {/* Signature Section */}
        <div className="text-[14px] my-6">
          <h3 className="text-[13px] font-bold underline mb-2">
            Ont signé ce formulaire :
          </h3>

          <p className="flex items-baseline mb-2">
            <span className="font-bold mr-2 text-[13px]">
              Nom du demandeur :
            </span>
            <input
              name="nomDemandeur"
              value={formData.nomDemandeur}
              onChange={handleChange}
              type="text"
              className="flex-1 border-0 border-b border-dashed border-black outline-none bg-transparent"
            />
          </p>

          <p className="flex items-baseline mb-2">
            <span className="font-bold mr-2 text-[13px]">Signature Date :</span>
            <input
              name="signatureDateDemandeur"
              value={formData.signatureDateDemandeur}
              onChange={handleChange}
              type="text"
              className="flex-1 border-0 border-b border-dashed border-black outline-none bg-transparent"
            />
          </p>

          <p className="flex items-baseline mb-2">
            <span className="font-bold mr-2 text-[13px]">
              Nom du supérieur :
            </span>
            <input
              name="nomSuperieur"
              value={formData.nomSuperieur}
              onChange={handleChange}
              type="text"
              className="flex-1 border-0 border-b border-dashed border-black outline-none bg-transparent"
            />
          </p>

          <p className="flex items-baseline mb-2">
            <span className="font-bold mr-2 text-[13px]">Signature Date :</span>
            <input
              name="signatureDateSuperieur"
              value={formData.signatureDateSuperieur}
              onChange={handleChange}
              type="text"
              className="flex-1 border-0 border-b border-dashed border-black outline-none bg-transparent"
            />
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center text-[11px] text-gray-600 mt-4">
          Page 1 sur 1
        </footer>
      </div>
    </>
  );
}
