import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import * as fabric from "fabric";
import { PDFDocument } from "pdf-lib";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Correct worker assignment for Create React App and Webpack 4+
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

const PDFEditor = forwardRef(({ file, tool }, ref) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const canvasRef = useRef();
  const fabricRef = useRef();

  useImperativeHandle(ref, () => ({
    savePdf: handleSave
  }));

  useEffect(() => {
    if (!file) {
      setPdfUrl(null);
      setNumPages(null);
      setPageNum(1);
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
      return;
    }
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (canvasRef.current) {
      if (fabricRef.current) fabricRef.current.dispose();
      fabricRef.current = new fabric.fabric.Canvas(canvasRef.current, { selection: true });
      setupTool();
    }
    // eslint-disable-next-line
  }, [pdfUrl, pageNum, tool]);

  const setupTool = () => {
    if (!fabricRef.current) return;
    fabricRef.current.off();
    if (tool === "blur") {
      fabricRef.current.on("mouse:down", (opt) => {
        const pointer = fabricRef.current.getPointer(opt.e);
        const blurRect = new fabric.fabric.Rect({
          left: pointer.x - 40,
          top: pointer.y - 20,
          width: 80,
          height: 40,
          fill: "#bbb",
          opacity: 0.65,
          selectable: true,
        });
        fabricRef.current.add(blurRect);
      });
    } else if (tool === "erase") {
      fabricRef.current.on("mouse:down", (opt) => {
        const pointer = fabricRef.current.getPointer(opt.e);
        const eraseRect = new fabric.fabric.Rect({
          left: pointer.x - 40,
          top: pointer.y - 20,
          width: 80,
          height: 40,
          fill: "#fff",
          opacity: 1,
          selectable: true,
        });
        fabricRef.current.add(eraseRect);
      });
    } else if (tool === "text") {
      fabricRef.current.on("mouse:down", (opt) => {
        const pointer = fabricRef.current.getPointer(opt.e);
        const text = new fabric.fabric.IText("Sample Text", {
          left: pointer.x,
          top: pointer.y,
          fontSize: 18,
          fill: "#222",
          fontWeight: 600,
          selectable: true,
        });
        fabricRef.current.add(text);
        fabricRef.current.setActiveObject(text);
        text.enterEditing();
      });
    }
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNum(1);
  }

  function handlePageChange(delta) {
    setPageNum((prev) => Math.max(1, Math.min(numPages, prev + delta)));
  }

  function handleRenderSuccess() {
    setTimeout(() => {
      const pdfCanvas = document.querySelector(".react-pdf__Page__canvas");
      if (pdfCanvas && canvasRef.current) {
        canvasRef.current.width = pdfCanvas.width;
        canvasRef.current.height = pdfCanvas.height;
        fabricRef.current.setWidth(pdfCanvas.width);
        fabricRef.current.setHeight(pdfCanvas.height);
        fabricRef.current.renderAll();
      }
    }, 150);
  }

  async function handleSave(filename) {
    if (!pdfUrl || !fabricRef.current) return;
    const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Export current canvas as PNG
    const dataUrl = fabricRef.current.toDataURL({ format: "png", multiplier: 2 });
    const pngImageBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
    const pngImage = await pdfDoc.embedPng(pngImageBytes);

    // Get page dimensions
    const page = pdfDoc.getPage(pageNum - 1);
    const { width, height } = page.getSize();

    // Draw overlay on current page
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width,
      height,
      opacity: 1,
    });

    const finalPdf = await pdfDoc.save();
    const blob = new Blob([finalPdf], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = (filename || "edited") + ".pdf";
    link.click();
  }

  return (
    <div className="flex flex-col items-center">
      {!pdfUrl && (
        <div className="w-[600px] h-[800px] border-2 border-blue-200 flex items-center justify-center text-gray-400 text-xl">
          Upload a PDF to get started
        </div>
      )}
      {pdfUrl && (
        <div style={{ position: "relative", width: 600 }}>
          <div className="flex justify-between items-center mb-2">
            <button
              className="p-1 disabled:opacity-60"
              onClick={() => handlePageChange(-1)}
              disabled={pageNum <= 1}
            >
              <FaChevronLeft />
            </button>
            <span className="text-gray-600">Page {pageNum} / {numPages}</span>
            <button
              className="p-1 disabled:opacity-60"
              onClick={() => handlePageChange(1)}
              disabled={pageNum >= numPages}
            >
              <FaChevronRight />
            </button>
          </div>
          <div style={{ position: "relative", width: 600 }}>
            <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
              <Page
                pageNumber={pageNum}
                width={600}
                renderAnnotationLayer={true}
                onRenderSuccess={handleRenderSuccess}
              />
            </Document>
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0"
              style={{
                zIndex: 5,
                pointerEvents: tool !== "select" ? "auto" : "auto",
                border: "2px solid #8bc2f7",
                borderRadius: 3,
                background: "transparent",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default PDFEditor;