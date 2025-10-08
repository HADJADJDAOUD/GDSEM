import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import SignatureField from "./SignatureField";

const FormHeuresSup = forwardRef(({ existingData = {} }, ref) => {
  const formDivRef = useRef(); // DOM ref for printing ✅

  const initialState = {
    nom: existingData.nom || "", 
    prenom: existingData.prenom || "",
    service: existingData.service || "",
    interventionType: existingData.interventionType || { distance: false, presentiel: false },
    lieuIntervention: existingData.lieuIntervention || "",
    datesIntervention: existingData.datesIntervention || "",
    horaires: existingData.horaires || "",
    totalHeuresSupplementaires: existingData.totalHeuresSupplementaires || "",
    objetsIntervention: existingData.objetsIntervention || "",
    nomDemandeur: existingData.nomDemandeur || "",
    signatureDateDemandeur: existingData.signatureDateDemandeur || "",
    nomSuperieur: existingData.nomSuperieur || "",
    signatureDateSuperieur: existingData.signatureDateSuperieur || "",
  };

  const [formData, setFormData] = useState(initialState);
  const [signatureDemandeurUrl, setSignatureDemandeurUrl] = useState(null);
  const [signatureSuperieurUrl, setSignatureSuperieurUrl] = useState(null);

  // expose both the backend method and the DOM node for printing
  useImperativeHandle(ref, () => ({
    getFormDataForBackend: () => ({
      ...formData,
      signatureDemandeur: signatureDemandeurUrl,
      signatureSuperieur: signatureSuperieurUrl,
    }),
    printNode: formDivRef.current, // ✅ expose DOM node
  }));

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

  const onSaveDemandeur = (dataUrl) => {
    setSignatureDemandeurUrl(dataUrl);
    const d = new Date();
    const formatted = `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
    setFormData((prev) => ({
      ...prev,
      signatureDateDemandeur: formatted,
    }));
  };

  const onSaveSuperieur = (dataUrl) => {
    setSignatureSuperieurUrl(dataUrl);
    const d = new Date();
    const formatted = `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
    setFormData((prev) => ({
      ...prev,
      signatureDateSuperieur: formatted,
    }));
  };
  useEffect(() => {
    console.log("Form data updated:", formData);
  }, [formData]); 

  useEffect(() => {
    if (existingData && Object.keys(existingData).length > 0) {
      setFormData({
        ...formData,
        ...existingData,
      });
      if (existingData.signatureDemandeur) setSignatureDemandeurUrl(existingData.signatureDemandeur);
    }
  }, [existingData]);
  return (
    <div
        ref={formDivRef}
        className="max-w-2xl mx-auto bg-white border border-gray-300 p-6 md:p-8 text-black shadow"
        style={{ width: "210mm", minHeight: "297mm" }}
      >
        <header className="text-center mb-4">
          <h1 className="text-[14px] font-bold leading-snug">
            DIRECTION DE L'INFORMATIQUE ET DE LA SÉCURITÉ DU RÉSEAU
          </h1>
        </header>

        <div className="text-center mb-4">
          <h2 className="text-[13px] font-bold underline mb-1">
            FORMULAIRE DE DÉCLARATION D'HEURES SUPPLÉMENTAIRES
          </h2>
          <p className="text-[12px] text-gray-700">
            À joindre aux demandes de récupération dans un délai ne dépassant
            pas 60 jours.
          </p>
        </div>

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

          <p className="font-bold mb-2">Type d'intervention :</p>
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

        <div className="text-[14px] my-6">
          <h3 className="text-[13px] font-bold underline mb-2">
            Ont signé ce formulaire :
          </h3>

          <div style={{ marginBottom: 12 }}>
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
              <span className="font-bold mr-2 text-[13px]">
                Signature Date :
              </span>
              <input
                name="signatureDateDemandeur"
                value={formData.signatureDateDemandeur}
                onChange={handleChange}
                type="text"
                className="flex-1 border-0 border-b border-dashed border-black outline-none bg-transparent"
              />
            </p>

            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, marginBottom: 6 }}>
                Signature demandeur:
              </div>
              <SignatureField
                onSave={onSaveDemandeur}
                initialDataUrl={signatureDemandeurUrl}
              />
              <div style={{ marginTop: 8 }}>
                {signatureDemandeurUrl ? (
                  <img
                    src={signatureDemandeurUrl}
                    alt="demandeur-signature"
                    style={{ width: "50mm", border: "1px solid #eee" }}
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
          </div>

          <div>
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
              <span className="font-bold mr-2 text-[13px]">
                Signature Date :
              </span>
              <input
                name="signatureDateSuperieur"
                value={formData.signatureDateSuperieur}
                onChange={handleChange}
                type="text"
                className="flex-1 border-0 border-b border-dashed border-black outline-none bg-transparent"
              />
            </p>

            <p className="flex items-baseline mb-2">
              <span className="font-bold mr-2 text-[13px]">
                signature de supérieur :
              </span>
              <input
                name="nomSuperieur"
                value={formData.nomSuperieur}
                onChange={handleChange}
                type="text"
                className="flex-1 border-0 border-b border-dashed border-black outline-none bg-transparent"
              />
            </p>
          </div>
        </div>

        <footer className="text-center text-[11px] text-gray-600 mt-4">
          Page 1 sur 1
        </footer>
      </div>
    
  );
});

export default FormHeuresSup;
