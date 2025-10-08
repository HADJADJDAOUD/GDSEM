// src/components/DeclarationDeTransport.jsx
"use client";

import React, { forwardRef, useState, useImperativeHandle } from "react";
import SignatureField from "../SignatureField";
import { useEffect } from "react";
const DeclarationDeTransport = forwardRef(({ existingData = {} }, ref) => {
  const [signatureInterestedUrl, setSignatureInterestedUrl] = useState(null);

  const [formData, setFormData] = useState({
    nomPrenom: existingData.nomPrenom || "",
    lieuNaissance: existingData.lieuNaissance || "",
    adresseDomicile: existingData.adresseDomicile || "",
    qualite: existingData.qualite || "", // e.g., "Agent", "Cadre", etc.
    lieuTravail: existingData.lieuTravail || "", // Direction / Centre rattaché
    distanceKm: existingData.distanceKm || "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveInterested = (dataUrl) => {
    setSignatureInterestedUrl(dataUrl);
  };

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

  // ✅ Expose data extraction method
  useImperativeHandle(ref, () => ({
    getFormDataForBackend: () => ({
      ...formData,
      signatureInterested: signatureInterestedUrl,
    }),
  }), [formData, signatureInterestedUrl]);
useEffect(() => {
  if (existingData && Object.keys(existingData).length > 0) {
    setFormData({
      ...formData,
      ...existingData,
    });
    if (existingData.signatureInterested) setSignatureInterestedUrl(existingData.signatureInterested);
  }
}, [existingData]);
  return (
    // ❌ Remove outer bg wrapper — it breaks print layout & isn't part of the form
    // ✅ Root must be the printable A4-like container
    <div
      className="bg-white border border-gray-300 shadow max-w-3xl w-full p-12"
      // Note: ref is NOT attached here — parent will wrap this in a div with ref
    >
      {/* Header */}
      <header className="text-left mb-8  text-[16px] leading-tight">
        <p className="font-bold mb-1 ">EPIC ALGERIE POSTE</p>
        <p className="font-semibold mb-1 ">Direction Générale</p>
        <p className="font-semibold mb-1 ">Direction des Ressources Humaines et de la Formation</p>
        <p className="font-semibold mb-1 ">
          Sous -Direction de l'Administration du Personnel et Système d'Information RH
        </p>
      </header>

      {/* Title Box */}
      <div className="text-center border border-black bg-gray-200 font-bold text-[16px] px-4 py-3 mb-10">
        <p>
          Imprimé à servir pour l'octroi de l'indemnité de transport ou son réajustement en cas de changement d'adresse.
        </p>
      </div>

      {/* Main Declaration Title */}
      <h2 className="text-center text-[16px] mb-10 underline font-semibold">
        Déclaration sur l'honneur
      </h2>

      {/* Declaration Body */}
      <div className="text-[16px] font-semibold mb-16 space-y-6">
        <p>
          Je soussigné (e) :
          <input
            type="text"
            className="ml-2 border-0 border-b border-dashed border-black outline-none w-3/4 bg-transparent"
            value={formData.nomPrenom}
            onChange={(e) => handleInputChange("nomPrenom", e.target.value)}
          />
        </p>
        <p >
          Né (e) :
          <input
            type="text"
            className="ml-2 border-0 border-b font-semibold border-dashed border-black outline-none w-3/4 bg-transparent"
            value={formData.lieuNaissance}
            onChange={(e) => handleInputChange("lieuNaissance", e.target.value)}
          />
        </p>
        <p>
          Demeurant à :
          <input
            type="text"
            className="ml-2 border-0 border-b border-dashed border-black outline-none w-3/4 bg-transparent"
            value={formData.adresseDomicile}
            onChange={(e) => handleInputChange("adresseDomicile", e.target.value)}
          />
        </p>
        <p>
          Exerçant en qualité de :
          <input
            type="text"
            className="ml-2 border-0 border-b border-dashed border-black outline-none w-1/3 bg-transparent"
            value={formData.qualite}
            onChange={(e) => handleInputChange("qualite", e.target.value)}
          />{" "}
          à la (1)
          <input
            type="text"
            className="ml-2 border-0 border-b border-dashed border-black outline-none w-1/6 bg-transparent"
            value={formData.lieuTravail}
            onChange={(e) => handleInputChange("lieuTravail", e.target.value)}
          />
          , déclare sur l'honneur que la distance séparant mon domicile de mon lieu de travail est de
          <input
            type="text"
            className="ml-2 border-0 border-b border-dashed border-black outline-none w-12 text-center bg-transparent"
            value={formData.distanceKm}
            onChange={(e) => handleInputChange("distanceKm", e.target.value)}
          />{" "}
          km.
        </p>
      </div>

      {/* Signature Section */}
      <div className="flex justify-between text-[14px] text-center my-14 px-14">
        <div className="inline ">
          <p>visa et cachet</p>
          <p>de l'APC</p>
          <div className="mt-3 h-16 flex items-center justify-center">
            <span className="mt-5">X</span>
          </div>
        </div>

        <div className="w-2/5">
  <p>Signature de</p>
  <p>l'intéressé (e)</p>

  {!isRH && (
    <div className="no-print mb-2">
      <div className="text-xs mb-1.5">Signature :</div>
      {/* Pull the signature field left using -ml and reduced width */}
      <div className="-ml-24 w-[calc(100%+2rem)]"> {/* 2rem = 32px ≈ space taken from left */}
        <SignatureField
          onSave={handleSaveInterested}
          initialDataUrl={signatureInterestedUrl}
        />
      </div>
    </div>
  )}

  <div style={{ marginTop: 8 }}>
    {signatureInterestedUrl ? (
      <img
        src={signatureInterestedUrl}
        alt="interested-signature"
        style={{ width: "50mm", display: "block", margin: "0 auto" }}
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

      {/* Bottom Note */}
      <div className="my-8 text-[13px]">
        <p>(1) Direction / Centre rattaché</p>
      </div>

      {/* Important Box */}
      <div className="border-t border-black pt-4 text-[13px] space-y-2">
        <p>
          <strong>Important</strong> : Le présent imprimé doit être légalisé par les services concernés de l'APC, qui doit être aussi appuyé par les pièces suivantes :
        </p>
        <p>1- Demande d'octroi de l'indemnité de transport adresser à la Direction des Ressources Humaines</p>
        <p>2- Certificat de résidence (récente)</p>
      </div>
    </div>
  );
});

export default DeclarationDeTransport;