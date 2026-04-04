import { useState, useRef } from "react";
import "./App.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  const fileInputRef = useRef(null);

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
        setTasks(data.tasks || []);
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
    setAudioFile(file);
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
        setTasks(data.tasks || []);
        setSummary(data.summary || "");
      }
    } catch (err) {
      setError("Failed to process the audio file. Please try again.");
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

  const exportJSON = () => {
    const exportData = { summary, tasks };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meeting-summary.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Meeting Summary Report", pageWidth / 2, 22, { align: "center" });

      // Date
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${timestamp}`, pageWidth / 2, 30, { align: "center" });

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 34, pageWidth - 14, 34);

      let y = 42;

      // Section 1 – Meeting Summary
      if (summary) {
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Meeting Summary", 14, y);
        y += 7;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59);
        const summaryLines = doc.splitTextToSize(summary, pageWidth - 28);
        doc.text(summaryLines, 14, y);
        y += summaryLines.length * 6 + 10;

        doc.setDrawColor(226, 232, 240);
        doc.line(14, y - 4, pageWidth - 14, y - 4);
      }

      // Section 2 – Extracted Tasks
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Extracted Tasks", 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [["#", "Task", "Owner", "Deadline"]],
        body: tasks.map((t, i) => [i + 1, t.task || "", t.owner || "", t.deadline || ""]),
        styles: { fontSize: 11, cellPadding: 5, valign: "middle" },
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 12, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 36 },
          3: { cellWidth: 36 },
        },
        margin: { left: 14, right: 14 },
      });

      const fileTimestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      doc.save(`meeting-summary-${fileTimestamp}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to generate PDF. Please try again.");
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
                accept="audio/*"
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
                    or click to browse — MP3, WAV, M4A supported
                  </p>
                </div>
              )}
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
        <section className="results-section" aria-label="Extracted tasks">
          <div className="results-header">
            <h2 className="results-title">Extracted Tasks</h2>
            <div className="export-actions">
              <button className="export-btn" onClick={exportJSON}>
                ⬇️ Export JSON
              </button>
              <button className="export-btn export-btn--pdf" onClick={exportPDF}>
                📄 Export PDF
              </button>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Task</th>
                  <th>Owner</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => (
                  <tr key={i}>
                    <td className="task-num">{i + 1}</td>
                    <td>{t.task}</td>
                    <td>{t.owner}</td>
                    <td>{t.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;