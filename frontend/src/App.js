import { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const extractTasks = async () => {
    setLoading(true);
    const response = await fetch("http://127.0.0.1:8000/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    try {
      const parsed = JSON.parse(data.tasks.replace(/```json|```/g, "").trim());
      setTasks(parsed);
    } catch {
      setTasks([]);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>AI Meet-to-Action</h1>
      <textarea
        rows={6}
        style={{ width: "100%", fontSize: "16px" }}
        placeholder="Paste your meeting text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <br />
      <button
        onClick={extractTasks}
        style={{ marginTop: "10px", padding: "10px 20px", fontSize: "16px" }}
      >
        {loading ? "Extracting..." : "Generate Tasks"}
      </button>

      {tasks.length > 0 && (
        <table border="1" style={{ marginTop: "20px", width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Task</th>
              <th>Owner</th>
              <th>Deadline</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => (
              <tr key={i}>
                <td>{t.task}</td>
                <td>{t.owner}</td>
                <td>{t.deadline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App; 