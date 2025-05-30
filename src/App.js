import React, { useRef, useState } from "react";
import PDFEditor from "./components/PDFEditor";
import { FaGithub, FaEdit, FaEraser, FaHighlighter, FaFont, FaFilePdf } from "react-icons/fa";

function App() {
  const [file, setFile] = useState(null);
  const [pdfName, setPdfName] = useState("");
  const [tool, setTool] = useState("select");
  const editorRef = useRef();

  const handleFileChange = (f) => {
    setFile(f);
    setPdfName(f?.name.replace(/\.pdf$/i, "") || "");
  };

  const handleNameChange = (e) => setPdfName(e.target.value);

  const handleSave = () => {
    if (editorRef.current) editorRef.current.savePdf(pdfName);
  };

  return (
    <div className="min-h-screen bg-[#f6f9fb]">
      <header className="w-full px-0 py-4 bg-[#eaf0f6] flex items-center justify-between">
        <div className="flex gap-2 items-center ml-2">
          <label htmlFor="pdf-upload">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded transition font-medium flex items-center gap-2">
              <FaFilePdf /> Choose PDF
            </button>
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files[0] && handleFileChange(e.target.files[0])}
            />
          </label>
          <button
            title="Blur"
            className={`toolbar-btn ${tool === "blur" ? "active" : ""}`}
            onClick={() => setTool("blur")}
          >
            <FaHighlighter />
          </button>
          <button
            title="Erase"
            className={`toolbar-btn ${tool === "erase" ? "active" : ""}`}
            onClick={() => setTool("erase")}
          >
            <FaEraser />
          </button>
          <button
            title="Add Text"
            className={`toolbar-btn ${tool === "text" ? "active" : ""}`}
            onClick={() => setTool("text")}
          >
            <FaFont />
          </button>
        </div>
        <div className="flex-1 flex items-center gap-2 ml-6 mr-2">
          <FaEdit className="text-gray-400" />
          <input
            className="rounded px-2 py-1 border border-gray-300 outline-none w-60 text-gray-700 bg-white"
            value={pdfName}
            onChange={handleNameChange}
            placeholder="Rename your PDF here"
            disabled={!file}
          />
        </div>
        <div className="flex gap-4 items-center mr-4">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-1 rounded font-medium"
            onClick={handleSave}
            disabled={!file}
          >
            Save
          </button>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-black text-2xl"
            title="GitHub"
          >
            <FaGithub />
          </a>
        </div>
      </header>
      <main className="flex justify-center items-start mt-8">
        <div className="bg-white border-2 border-blue-200 rounded-md shadow-lg p-4" style={{ minWidth: 800, minHeight: 1000 }}>
          <PDFEditor ref={editorRef} file={file} tool={tool} />
        </div>
      </main>
    </div>
  );
}

export default App;