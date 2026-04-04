import { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import "./App.css";

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
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
        setSummary(data.summary || "");
      }
    } catch (err) {
      console.error("Error extracting tasks:", err);
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
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
        setSummary(data.summary || "");
      }
    } catch (err) {
      console.error("Error processing audio:", err);
      setError("Failed to process the audio file. Please try again.");
      setTasks([]);
      setSummary("");
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
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      let y = 50;

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text("Meeting Summary", margin, y);
      y += 30;

      // Summary text
      if (summary) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        const summaryLines = doc.splitTextToSize(summary, contentWidth);
        doc.text(summaryLines, margin, y);
        y += summaryLines.length * 16 + 20;
      }

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageWidth - margin, y);
      y += 20;

      // Tasks heading
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("Extracted Tasks", margin, y);
      y += 24;

      // Table header background
      const colWidths = [30, contentWidth * 0.48, contentWidth * 0.24, contentWidth * 0.24];
      const headers = ["#", "Task", "Owner", "Deadline"];
      const rowHeight = 28;

      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, rowHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);

      let xPos = margin + 8;
      headers.forEach((h, i) => {
        doc.text(h, xPos, y + 18);
        xPos += colWidths[i];
      });
      y += rowHeight;

      // Table rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      tasks.forEach((t, i) => {
        const rowValues = [
          String(i + 1),
          t.task || "",
          t.owner || "",
          t.deadline || "",
        ];

        // Determine row height based on wrapped task text
        const taskLines = doc.splitTextToSize(rowValues[1], colWidths[1] - 12);
        const thisRowHeight = Math.max(rowHeight, taskLines.length * 14 + 14);

        // Check for page overflow
        if (y + thisRowHeight > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin + 20;
        }

        // Alternate row shading
        if (i % 2 === 0) {
          doc.setFillColor(255, 255, 255);
        } else {
          doc.setFillColor(248, 250, 252);
        }
        doc.rect(margin, y, contentWidth, thisRowHeight, "F");

        // Row border
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y + thisRowHeight, pageWidth - margin, y + thisRowHeight);

        xPos = margin + 8;
        // Row number
        doc.text(rowValues[0], xPos, y + 18);
        xPos += colWidths[0];
        // Task (wrapped)
        doc.text(taskLines, xPos, y + 18);
        xPos += colWidths[1];
        // Owner
        const ownerLines = doc.splitTextToSize(rowValues[2], colWidths[2] - 12);
        doc.text(ownerLines, xPos, y + 18);
        xPos += colWidths[2];
        // Deadline
        const deadlineLines = doc.splitTextToSize(rowValues[3], colWidths[3] - 12);
        doc.text(deadlineLines, xPos, y + 18);

        y += thisRowHeight;
      });

      doc.save("meeting-tasks.pdf");
    } catch (err) {
      console.error("Error generating PDF:", err);
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
            Automatically identifies action items, owners, and deadlines from
            natural language.
          </p>
        </div>
        <div className="feature-card">
          <span className="feature-icon feature-icon--green">✅</span>
          <h3 className="feature-title">Structured Output</h3>
          <p className="feature-desc">
            Organises tasks with assignees and due dates in a clean, readable
            table.
          </p>
        </div>
        <div className="feature-card">
          <span className="feature-icon feature-icon--blue">⬇️</span>
          <h3 className="feature-title">Easy Export</h3>
          <p className="feature-desc">
            Download results as JSON for seamless integration with your project
            tools.
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
                📄 Export to PDF
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