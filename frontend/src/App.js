import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import "./App.css";
import { useTheme } from "./useTheme";
import AboutPage from "./AboutPage";

const SUPPORTED_AUDIO_FORMATS = [
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/webm",
  "audio/x-ms-wma",
];

const SUPPORTED_EXTENSIONS = ".mp3,.m4a,.m4b,.aac,.ogg,.oga,.wav,.flac,.webm,.wma";
const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function validateAudioFile(file) {
  if (!file) return { valid: false, error: "No file selected." };
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`,
    };
  }
  if (file.type && !SUPPORTED_AUDIO_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type "${file.type}". Supported formats: MP3, M4A, AAC, OGG, WAV, FLAC, WebM, WMA.`,
    };
  }
  const lastDot = file.name.lastIndexOf(".");
  const ext = lastDot !== -1 ? file.name.slice(lastDot + 1).toLowerCase() : "";
  const allowedExt = SUPPORTED_EXTENSIONS.replace(/\./g, "").split(",");
  if (!ext || !allowedExt.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file extension${ext ? ` ".${ext}"` : ""}. Supported formats: MP3, M4A, AAC, OGG, WAV, FLAC, WebM, WMA.`,
    };
  }
  return { valid: true, error: null };
}

function App() {
  const { isDark, toggleTheme } = useTheme();

  const [activeNav, setActiveNav] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("text");
  const [text, setText] = useState("");
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [audioProcessing, setAudioProcessing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [viewMode, setViewMode] = useState("table");

  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    if (tasks.length > 0) {
      resultsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [tasks]);

  useEffect(() => {
    if (!showExportMenu) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setShowExportMenu(false);
    };
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  const closeMobileMenu = () => setMenuOpen(false);

  const extractTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("https://meet-to-action-backend.onrender.com/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        setTasks([]);
        setSummary("");
      } else {
        const tasksWithStatus = (data.tasks || []).map((t) => ({ ...t, status: "Pending" }));
        setTasks(tasksWithStatus);
        setSummary(data.summary || "");
      }
    } catch {
      setError("Failed to connect to the server. Please ensure the backend is running.");
      setTasks([]);
      setSummary("");
    }
    setLoading(false);
  };

  const handleAudioUpload = async (file) => {
    if (!file) return;
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setAudioFile(file);
    setError("");
    setAudioProcessing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("https://meet-to-action-backend.onrender.com/extract-audio", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        setTasks([]);
        setSummary("");
      } else {
        const tasksWithStatus = (data.tasks || []).map((t) => ({ ...t, status: "Pending" }));
        setTasks(tasksWithStatus);
        setSummary(data.summary || "");
      }
    } catch {
      setError("Failed to connect to the server. Please ensure the backend is running.");
      setTasks([]);
    }
    setAudioProcessing(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleAudioUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleAudioUpload(file);
  };

  const toggleStatus = async (index) => {
    const updated = [...tasks];
    updated[index].status = updated[index].status === "Done" ? "Pending" : "Done";
    setTasks(updated);

    await fetch("https://meet-to-action-backend.onrender.com/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: updated[index].task,
        status: updated[index].status,
      }),
    });
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();

      doc.setFontSize(18);
      doc.text("Meeting Summary Report", 14, 18);
      doc.setFontSize(11);
      doc.text(`Generated: ${timestamp}`, 14, 28);

      if (summary) {
        doc.setFontSize(13);
        doc.text("Summary", 14, 42);
        doc.setFontSize(10);
        const summaryLines = doc.splitTextToSize(summary, 180);
        doc.text(summaryLines, 14, 50);
      }

      const tableStartY = summary ? 50 + doc.splitTextToSize(summary, 180).length * 6 + 10 : 42;
      doc.setFontSize(13);
      doc.text("Extracted Tasks", 14, tableStartY);

      const headers = ["#", "Task", "Owner", "Deadline", "Status"];
      const colWidths = [10, 80, 35, 35, 25];
      const colX = [14, 24, 104, 139, 174];
      let y = tableStartY + 8;

      doc.setFontSize(10);
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y - 4, 182, 8, "F");
      headers.forEach((h, i) => doc.text(h, colX[i], y));
      y += 8;

      tasks.forEach((t, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 14;
        }
        const rowData = [String(idx + 1), t.task || "", t.owner || "", t.deadline || "", t.status || "Pending"];
        rowData.forEach((val, i) => {
          const truncated = doc.splitTextToSize(val, colWidths[i] - 2)[0];
          doc.text(truncated, colX[i], y);
        });
        y += 8;
      });

      const filename = `meeting-summary-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF export failed:", err);
    }
  };

  return (
    <>
      <nav className="top-nav">
        <div className="brand-block">
          <button className="brand-btn" onClick={() => { setActiveNav("home"); closeMobileMenu(); }}>
            Meet to Action — AI Task Extraction
          </button>
        </div>

        <button
          className="menu-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          ☰
        </button>

        <div className={`desktop-links ${menuOpen ? "mobile-open" : ""}`}>
          <button className={`nav-link ${activeNav === "home" ? "active" : ""}`} onClick={() => { setActiveNav("home"); closeMobileMenu(); }}>
            Home
          </button>
          <button className={`nav-link ${activeNav === "about" ? "active" : ""}`} onClick={() => { setActiveNav("about"); closeMobileMenu(); }}>
            About
          </button>
          <a className="nav-link" href="https://github.com/KoushalKishor09/meet-to-action" target="_blank" rel="noopener noreferrer" onClick={closeMobileMenu}>
            GitHub
          </a>
        </div>
      </nav>

      <button
        className="theme-toggle-btn"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? "☀️" : "🌙"}
      </button>

      {activeNav === "about" ? (
        <AboutPage />
      ) : (
        <div className="app-container">
          <header className="app-header">
            <span className="ai-badge">✨ AI-Powered</span>
            <h1 className="app-title">Meet to Action</h1>
            <p className="app-subtitle">Convert meeting recordings and transcripts into actionable tasks</p>
          </header>

          <main className="main-card">
            <div className="tab-nav" role="tablist">
              <button role="tab" aria-selected={activeTab === "text"} className={`tab-btn${activeTab === "text" ? " tab-btn--active" : ""}`} onClick={() => setActiveTab("text")}>📝 Text Input</button>
              <button role="tab" aria-selected={activeTab === "audio"} className={`tab-btn${activeTab === "audio" ? " tab-btn--active" : ""}`} onClick={() => setActiveTab("audio")}>🎙️ Audio Upload</button>
            </div>

            {activeTab === "text" && (
              <div className="panel" role="tabpanel">
                <div className="textarea-wrapper">
                  <textarea className="meeting-textarea" rows={8} placeholder="Paste your meeting notes or transcript here..." value={text} onChange={(e) => setText(e.target.value)} aria-label="Meeting text input" />
                  <div className="textarea-footer">
                    <span className="char-counter">{text.length} characters</span>
                    <button className="extract-btn" onClick={extractTasks} disabled={!text.trim() || loading}>
                      {loading ? "Extracting…" : "Extract Tasks"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "audio" && (
              <div className="panel" role="tabpanel">
                <div className={`drop-zone${dragOver ? " drop-zone--active" : ""}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => fileInputRef.current.click()} role="button" tabIndex={0} aria-label="Audio file drop zone">
                  <input ref={fileInputRef} type="file" accept={SUPPORTED_EXTENSIONS} className="file-input-hidden" onChange={handleFileChange} aria-label="Audio file input" />
                  {audioProcessing ? <div className="processing-indicator"><span className="spinner"></span><p>Processing audio…</p></div> : <div className="drop-zone-content"><p className="drop-zone-text">Drag & drop your audio file here</p></div>}
                </div>
              </div>
            )}
          </main>

          {error && <div role="alert" className="error-alert">⚠️ {error}</div>}

          {tasks.length > 0 && (
            <section ref={resultsRef} className="results-section" aria-label="Extracted tasks">
              <div className="results-header">
                <h2 className="results-title">Extracted Tasks</h2>
                <div className="header-actions">
                  <button className={`view-toggle-btn${viewMode === "tiles" ? " view-toggle-btn--active" : ""}`} onClick={() => setViewMode(viewMode === "table" ? "tiles" : "table")}>
                    {viewMode === "table" ? "⊞ Tiles View" : "≡ Table View"}
                  </button>
                  <div className="export-dropdown" ref={exportMenuRef}>
                    <button className="export-btn" onClick={() => setShowExportMenu((prev) => !prev)}>⬇️ Export</button>
                    {showExportMenu && (
                      <ul className="export-menu" role="menu">
                        <li><button className="export-menu-item" onClick={() => { exportJSON(); setShowExportMenu(false); }}>📄 Export JSON</button></li>
                        <li><button className="export-menu-item" onClick={() => { exportPDF(); setShowExportMenu(false); }}>🖨️ Export as PDF</button></li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      <footer className="app-footer">
        <div className="footer-links">
          <button className="footer-link" onClick={() => setActiveNav("home")}>Meet to Action</button>
          <span className="footer-sep">|</span>
          <a className="footer-link" href="https://github.com/KoushalKishor09/meet-to-action" target="_blank" rel="noopener noreferrer">GitHub</a>
          <span className="footer-sep">|</span>
          <button className="footer-link" onClick={() => setActiveNav("about")}>About Us</button>
        </div>
      </footer>
    </>
  );
}

export default App;
export { validateAudioFile, SUPPORTED_AUDIO_FORMATS, SUPPORTED_EXTENSIONS };