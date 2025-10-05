// SignatureField.jsx
import React, { useEffect, useRef, useState } from "react";

/*
Safe SignatureField
- Draw or upload signature
- Ensures we never call getContext on a null canvas
- Props: onSave(dataUrl), initialDataUrl (optional), sigWidthMM, sigHeightMM
*/
export default function SignatureField({
  onSave,
  initialDataUrl = null,
  sigWidthMM = 50,
  sigHeightMM = 20,
}) {
  const DPI = 300;
  const exportWidth = Math.round((sigWidthMM / 25.4) * DPI);
  const exportHeight = Math.round((sigHeightMM / 25.4) * DPI);

  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const [mode, setMode] = useState("draw"); // 'draw' | 'upload'
  const [dataUrl, setDataUrl] = useState(initialDataUrl);
  const [isDrawing, setIsDrawing] = useState(false);
  const pointerIdRef = useRef(null);

  // If an initialDataUrl arrives before canvas is ready, hold it here
  const pendingImageRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    // configure internal buffer for high-res export
    c.width = exportWidth;
    c.height = exportHeight;
    c.style.width = "390px";
    c.style.height = `${Math.round((exportHeight / exportWidth) * 390)}px`;

    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.lineWidth = Math.max(2, Math.round(DPI / 150));
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    // If there's a pending image (arrived earlier), draw it now
    if (pendingImageRef.current) {
      drawImageFromSrc(pendingImageRef.current);
      pendingImageRef.current = null;
    } else if (initialDataUrl) {
      // draw initialDataUrl if provided
      drawImageFromSrc(initialDataUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportWidth, exportHeight]);

  // Watch for any change to initialDataUrl after mount
  useEffect(() => {
    if (!initialDataUrl) return;
    // if canvas ready, draw now, otherwise store pending
    if (canvasRef.current) {
      drawImageFromSrc(initialDataUrl);
    } else {
      pendingImageRef.current = initialDataUrl;
    }
  }, [initialDataUrl]);

  function getCanvasPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY);
    const x = ((clientX - rect.left) * canvas.width) / rect.width;
    const y = ((clientY - rect.top) * canvas.height) / rect.height;
    return { x, y };
  }

  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    pointerIdRef.current = e.pointerId;
    setIsDrawing(true);
    const pos = getCanvasPos(e, canvas);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    e.preventDefault();
  };

  const handlePointerMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawing || e.pointerId !== pointerIdRef.current) return;
    const pos = getCanvasPos(e, canvas);
    const ctx = canvas.getContext("2d");
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    e.preventDefault();
  };

  const handlePointerUp = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.releasePointerCapture && canvas.releasePointerCapture(e.pointerId);
    pointerIdRef.current = null;
    if (!isDrawing) return;
    setIsDrawing(false);
    const url = canvas.toDataURL("image/png");
    setDataUrl(url);
    e.preventDefault();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDataUrl(null);
  };

  function isCanvasBlank(canvas) {
    if (!canvas) return true;
    const ctx = canvas.getContext("2d");
    const buf = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    return !buf.some((v) => v !== 0);
  }

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return alert("No signature to save.");
    if (isCanvasBlank(canvas)) return alert("No signature to save.");
    const url = canvas.toDataURL("image/png");
    setDataUrl(url);
    if (onSave) onSave(url);
  };

  // core: draw an image src (data URL or blob URL) into the canvas safely
  function drawImageFromSrc(src) {
    const canvas = canvasRef.current;
    if (!src) return;

    // If canvas not ready, stash and return
    if (!canvas) {
      pendingImageRef.current = src;
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return; // defensive

    const img = new Image();
    // if src is cross-origin or blob, set crossOrigin as needed. DataURLs OK.
    img.onload = () => {
      // *very important* check canvas still exists (component might have unmounted)
      const cNow = canvasRef.current;
      if (!cNow) return;
      const ctxNow = cNow.getContext("2d");
      // white background for print clarity
      ctxNow.fillStyle = "#fff";
      ctxNow.fillRect(0, 0, cNow.width, cNow.height);
      const ratio = Math.min(cNow.width / img.width, cNow.height / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const dx = (cNow.width - w) / 2;
      const dy = (cNow.height - h) / 2;
      ctxNow.drawImage(img, dx, dy, w, h);
      const url = cNow.toDataURL("image/png");
      setDataUrl(url);
    };
    img.onerror = () => {
      // fallback: do nothing but log — avoid throwing
      // console.warn("Failed to load signature image", src);
    };
    img.src = src;
  }

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target.result;
      // draw or queue drawing depending on canvas state
      if (canvasRef.current) drawImageFromSrc(src);
      else pendingImageRef.current = src;
      // notify parent immediately (optional) after drawing completes - we call onSave from drawImageFromSrc via setDataUrl
      // but to be safe, also set dataUrl now so UI preview updates earlier
      setDataUrl(src);
      if (onSave) onSave(src);
    };
    reader.readAsDataURL(file);
  };

  const triggerFile = () => fileRef.current && fileRef.current.click();

  const download = () => {
    if (!dataUrl) return alert("No signature to download");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `signature_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="no-print" style={{ border: "1px solid #ddd", padding: 8, display: "inline-block" }}>
      <div style={{ marginBottom: 8 }}>
        <button className="button bg-gray-200 border-1 rounded pl-1 pr-1   " onClick={() => setMode("draw")} disabled={mode === "draw"}>
          Draw
        </button>
        <button className="button bg-gray-200 border-1 rounded pl-1 pr-1 "  onClick={() => setMode("upload")} disabled={mode === "upload"} style={{ marginLeft: 8 }}>
          Upload
        </button>
        <button className="button bg-gray-200 border-1 rounded pl-1 pr-1   " onClick={clearCanvas} style={{ marginLeft: 8 }}>
          Clear
        </button>
        <button className="button bg-gray-200 border-1 rounded pl-1 pr-1   " onClick={save} style={{ marginLeft: 8 }}>
          Save
        </button>
        <button className="button bg-gray-200 border-1 rounded pl-1 pr-1   " onClick={download} style={{ marginLeft: 8 }}>
          Download
        </button>
      </div>

      {mode === "draw" && (
        <div>
          <canvas
            ref={canvasRef}
            style={{ border: "1px solid #ccc", touchAction: "none", display: "block" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerOut={handlePointerUp}
          />
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>Draw signature (touch / mouse / stylus)</div>
        </div>
      )}

      {mode === "upload" && (
        <div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
          <button className="button bg-gray-200 border-1 rounded pl-1 pr-1   " onClick={triggerFile}>Choose file</button>
          <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>Upload a scanned signature (PNG/JPG)</div>
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, color: "#222" }}>Preview:</div>
        {dataUrl ? (
          <img src={dataUrl} alt="signature preview" style={{ width: 300, border: "1px solid #eee", marginTop: 6 }} />
        ) : (
          <div style={{ height: 80, border: "1px dashed #ddd", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", marginTop: 6 }}>
            No signature yet
          </div>
        )}
      </div>
    </div>
  );
}
