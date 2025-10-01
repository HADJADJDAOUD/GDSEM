import React, { useRef } from "react";

const DeclarationDeTransport = () => {
  const pdfRef = useRef();

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-10">
      {/* PDF content */}
      <div
        ref={pdfRef}
        className="bg-white border border-gray-300 shadow max-w-3xl w-full p-12"
      >
        {/* Header */}
        <header className="text-left mb-8 text-[11px] leading-tight">
          <p className="font-bold">EPIC ALGERIE POSTE</p>
          <p>Direction Générale</p>
          <p>Direction des Ressources Humaines et de la Formation</p>
          <p>
            Sous -Direction de l&apos;Administration du Personnel et Système
            d&apos;Information RH
          </p>
        </header>

        {/* Title Box */}
        <div className="text-center border border-black bg-gray-200 font-bold text-[14px] px-4 py-3 mb-10">
          <p>
            Imprimé à servir pour l&apos;octroi de l&apos;indemnité de transport
            ou son réajustement en cas de changement d&apos;adresse.
          </p>
        </div>

        {/* Main Declaration Title */}
        <h2 className="text-center text-[16px] mb-10 underline font-semibold">
          Déclaration sur l&apos;honneur
        </h2>

        {/* Declaration Body */}
        <div className="text-[14px] mb-16 space-y-6">
          <p>
            Je soussigné (e) :
            <input
              type="text"
              className="ml-2 border-0 border-b border-dashed  border-black outline-none w-3/4"
            />
          </p>
          <p>
            Né (e) :
            <input
              type="text"
              className="ml-2 border-0 border-b border-dashed border-black outline-none w-3/4"
            />
          </p>
          <p>
            Demeurant à :
            <input
              type="text"
              className="ml-2 border-0 border-b border-dashed border-black outline-none w-3/4"
            />
          </p>
          <p>
            Exerçant en qualité de :
            <input
              type="text"
              className="ml-2 border-0 border-b border-dashed border-black outline-none w-1/3"
            />{" "}
            à la (1)
            <input
              type="text"
              className="ml-2 border-0 border-b border-dashed border-black outline-none w-1/6"
            />
            , déclare sur l&apos;honneur que la distance séparant mon domicile
            de mon lieu de travail est de
            <input
              type="text"
              className="ml-2 border-0 border-b border-dashed border-black outline-none w-12 text-center"
            />{" "}
            km.
          </p>
        </div>

        {/* Signature Section */}
        <div className="flex justify-between text-[14px] text-center my-14 px-14">
          <div className="w-2/5">
            <p>visa et cachet</p>
            <p>de l&apos;APC</p>
            <div className="mt-3 h-16 flex justify-center align-center">
              <span className="align-items-center text-center mt-5">X</span>
            </div>
          </div>
          <div className="w-2/5">
            <p>Signature de</p>
            <p>l&apos;intéressé (e)</p>
            <div className="mt-3 h-16 flex justify-center align-center   ">
              <span className="align-items-center text-center mt-5">X</span>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="my-8 text-[12px]">
          <p>(1) Direction / Centre rattaché</p>
        </div>

        {/* Important Box */}
        <div className="border-t border-black pt-4 text-[12px] space-y-2">
          <p>
            <strong>Important</strong> : Le présent imprimé doit être légalisé
            par les services concernés de l&apos;APC, qui doit être aussi appuyé
            par les pièces suivantes :
          </p>
          <p>
            1- Demande d&apos;octroi de l&apos;indemnité de transport adresser à
            la Direction des Ressources Humaines
          </p>
          <p>2- Certificat de résidence (récente)</p>
        </div>
      </div>
    </div>
  );
};

export default DeclarationDeTransport;
