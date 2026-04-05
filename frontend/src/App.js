import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import "./App.css";

const SUPPORTED_AUDIO_FORMATS = [
  "audio/mpeg",       // MP3
  "audio/mp4",        // M4A, M4B
  "audio/x-m4a",      // M4A (alternate)
  "audio/aac",        // AAC
  "audio/ogg",        // OGG, OGA
  "audio/wav",        // WAV
  "audio/x-wav",      // WAV (alternate)
  "audio/flac",       // FLAC
  "audio/webm",       // WebM
  "audio/x-ms-wma",  // WMA
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

  // Auto-scroll to results when tasks are loaded
  useEffect(() => {
    if (tasks.length > 0) {
      resultsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [tasks]);

  // Close export dropdown on outside click or Escape key
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

  const extractTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://127.0.0.1:8000/extract", {
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
        const tasksWithStatus = (data.tasks || []).map(t => ({ ...t, status: "Pending" }));
        setTasks(tasksWithStatus);
        setSummary(data.summary || "");
      }
    } catch (err) {
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
      const response = await fetch("http://127.0.0.1:8000/extract-audio", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        setTasks([]);
        setSummary("");
      } else {
        const tasksWithStatus = (data.tasks || []).map(t => ({ ...t, status: "Pending" }));
        setTasks(tasksWithStatus);
        setSummary(data.summary || "");
      }
    } catch (err) {
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

    await fetch("http://127.0.0.1:8000/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: updated[index].task,
        status: updated[index].status
      })
    });
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], {
      type: "application/json",
    });
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
        const rowData = [
          String(idx + 1),
          t.task || "",
          t.owner || "",
          t.deadline || "",
          t.status || "Pending",
        ];
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
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <span className="ai-badge">✨ AI-Powered</span>
        <h1 className="app-title">Meet to Action</h1>
        <p className="app-subtitle">
          Convert meeting recordings and transcripts into actionable tasks
        </p>
      </header>

      {/* Main Card */}
      <main className="main-card">
        {/* Tab Navigation */}
        <div className="tab-nav" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "text"}
            className={`tab-btn${activeTab === "text" ? " tab-btn--active" : ""}`}
            onClick={() => setActiveTab("text")}
          >
            📝 Text Input
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "audio"}
            className={`tab-btn${activeTab === "audio" ? " tab-btn--active" : ""}`}
            onClick={() => setActiveTab("audio")}
          >
            🎙️ Audio Upload
          </button>
        </div>

        {/* Text Input Panel */}
        {activeTab === "text" && (
          <div className="panel" role="tabpanel">
            <div className="textarea-wrapper">
              <textarea
                className="meeting-textarea"
                rows={8}
                placeholder="Paste your meeting notes or transcript here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="Meeting text input"
              />
              <div className="textarea-footer">
                <span className="char-counter">{text.length} characters</span>
                <button
                  className="extract-btn"
                  onClick={extractTasks}
                  disabled={!text.trim() || loading}
                >
                  {loading ? "Extracting…" : "Extract Tasks"}
                </button>
              </div>
            </div>

            {/* Example Format */}
            <div className="example-box">
              <p className="example-title">📋 Example format:</p>
              <p className="example-text">
                "Alice will prepare the Q3 report by Friday. Bob needs to
                schedule a client call next week. The team should review the
                budget proposal before Thursday's meeting."
              </p>
            </div>
          </div>
        )}

        {/* Audio Upload Panel */}
        {activeTab === "audio" && (
          <div className="panel" role="tabpanel">
            <div
              className={`drop-zone${dragOver ? " drop-zone--active" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current.click()}
              role="button"
              tabIndex={0}
              aria-label="Audio file drop zone"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={SUPPORTED_EXTENSIONS}
                className="file-input-hidden"
                onChange={handleFileChange}
                aria-label="Audio file input"
              />
              {audioProcessing ? (
                <div className="processing-indicator">
                  <span className="spinner" aria-hidden="true"></span>
                  <p>Processing audio…</p>
                </div>
              ) : audioFile ? (
                <div className="file-selected">
                  <span className="file-icon">🎵</span>
                  <p className="file-name">{audioFile.name}</p>
                  <p className="file-hint">Click or drop another file to replace</p>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <span className="upload-icon">⬆️</span>
                  <p className="drop-zone-text">
                    Drag &amp; drop your audio file here
                  </p>
                  <p className="drop-zone-hint">
                    or click to browse — MP3, M4A, AAC, OGG, WAV, FLAC, WebM supported
                  </p>
                </div>
              )}
            </div>
            <div className="textarea-footer">
              <span></span>
              <button
                className="extract-btn"
                onClick={() => audioFile && handleAudioUpload(audioFile)}
                disabled={!audioFile || audioProcessing}
              >
                {audioProcessing ? "Processing…" : "Extract Tasks"}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Error Message */}
      {error && (
        <div role="alert" style={{ margin: "0 0 24px", padding: "14px 20px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", color: "#b91c1c", fontSize: "14px" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Feature Cards */}
      <section className="feature-cards" aria-label="Features">
        <div className="feature-card">
          <span className="feature-icon feature-icon--purple">🔮</span>
          <h3 className="feature-title">Smart Extraction</h3>
          <p className="feature-desc">
            Automatically identifies action items, owners, and deadlines from natural language.
          </p>
        </div>
        <div className="feature-card">
          <span className="feature-icon feature-icon--green">✅</span>
          <h3 className="feature-title">Structured Output</h3>
          <p className="feature-desc">
            Organises tasks with assignees and due dates in a clean, readable table.
          </p>
        </div>
        <div className="feature-card">
          <span className="feature-icon feature-icon--blue">⬇️</span>
          <h3 className="feature-title">Easy Export</h3>
          <p className="feature-desc">
            Download results as JSON for seamless integration with your project tools.
          </p>
        </div>
      </section>

      {/* Meeting Summary */}
      {summary && (
        <section className="results-section" style={{ marginBottom: "24px" }} aria-label="Meeting summary">
          <div className="results-header">
            <h2 className="results-title">Meeting Summary</h2>
          </div>
          <p style={{ padding: "16px 24px", fontSize: "14px", color: "#1e293b", lineHeight: "1.6" }}>{summary}</p>
        </section>
      )}

      {/* Results Table */}
      {tasks.length > 0 && (
        <section ref={resultsRef} className="results-section" aria-label="Extracted tasks">
          <div className="results-header">
            <h2 className="results-title">Extracted Tasks</h2>
            <div className="header-actions">
              <button
                className={`view-toggle-btn${viewMode === "tiles" ? " view-toggle-btn--active" : ""}`}
                onClick={() => setViewMode(viewMode === "table" ? "tiles" : "table")}
                aria-label={viewMode === "table" ? "Switch to Tiles View" : "Switch to Table View"}
                title={viewMode === "table" ? "Switch to Tiles View" : "Switch to Table View"}
              >
                {viewMode === "table" ? "⊞ Tiles View" : "≡ Table View"}
              </button>
              <div className="export-dropdown" ref={exportMenuRef}>
                <button
                  className="export-btn"
                  onClick={() => setShowExportMenu((prev) => !prev)}
                  aria-haspopup="true"
                  aria-expanded={showExportMenu}
                  aria-label="Export"
                >
                  ⬇️ Export
                </button>
                {showExportMenu && (
                  <ul className="export-menu" role="menu">
                    <li role="none">
                      <button
                        role="menuitem"
                        className="export-menu-item"
                        onClick={() => { exportJSON(); setShowExportMenu(false); }}
                      >
                        📄 Export JSON
                      </button>
                    </li>
                    <li role="none">
                      <button
                        role="menuitem"
                        className="export-menu-item"
                        onClick={() => { exportPDF(); setShowExportMenu(false); }}
                      >
                        🖨️ Export as PDF
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
          {viewMode === "table" ? (
          <div className="table-wrapper">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Task</th>
                  <th>Owner</th>
                  <th>Deadline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => (
                  <tr key={i} style={{ background: t.status === "Done" ? "#d4edda" : "white" }}>
                    <td className="task-num">{i + 1}</td>
                    <td>{t.task}</td>
                    <td>{t.owner}</td>
                    <td>{t.deadline}</td>
                    <td>
                      <span
                        className={`status-badge ${t.status === "Done" ? "status-badge--done" : "status-badge--pending"}`}
                        onClick={() => toggleStatus(i)}
                        style={{ cursor: "pointer" }}
                      >
                        {t.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : (
          <div className="tiles-grid">
            {tasks.map((t, i) => (
              <div key={i} className={`task-tile${t.status === "Done" ? " task-tile--done" : ""}`}>
                <div className="task-tile-number">{i + 1}</div>
                <h4 className="task-tile-title">{t.task}</h4>
                <div className="task-tile-meta">
                  <span className="task-tile-label">👤 Owner</span>
                  <span className="task-tile-value">{t.owner || "—"}</span>
                </div>
                <div className="task-tile-meta">
                  <span className="task-tile-label">📅 Deadline</span>
                  <span className="task-tile-value">{t.deadline || "—"}</span>
                </div>
                <div className="task-tile-footer">
                  <span
                    className={`status-badge ${t.status === "Done" ? "status-badge--done" : "status-badge--pending"}`}
                    onClick={() => toggleStatus(i)}
                    style={{ cursor: "pointer" }}
                    title="Click to toggle status"
                  >
                    {t.status || "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          )}
        </section>
      )}
    </div>
  );
}

export default App;
export { validateAudioFile, SUPPORTED_AUDIO_FORMATS, SUPPORTED_EXTENSIONS };
