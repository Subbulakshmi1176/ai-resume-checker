import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState("");
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Load roles from backend
  useEffect(() => {
    fetch("http://127.0.0.1:5000/roles")
      .then((res) => res.json())
      .then((data) => setRoles(data));
  }, []);

  const analyzeResume = async () => {
    if (!file || !role) {
      alert("Please upload a resume and select a role.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("role_key", role);

    const res = await fetch("http://127.0.0.1:5000/analyze_resume", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="app">

      <h1 className="title">AI Resume Strength Checker</h1>

      {/* Upload Card */}
      <div className="upload-card">
        <label className="label">Select Job Role</label>
        <select className="dropdown" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">-- Choose Role --</option>
          {Object.entries(roles).map(([key, value]) => (
            <option key={key} value={key}>
              {value.title}
            </option>
          ))}
        </select>

        <label className="label">Upload Resume (PDF only)</label>
        <input
          className="file-input"
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button className="btn" onClick={analyzeResume}>
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="result-box">
          <h2 className="subtitle">Results for: {result.role}</h2>

          {/* ATS Score */}
          <p className="score-title">ATS Score: {result.scores.ats_score}%</p>
          <div className="score-bar">
            <div
              className="score-fill red"
              style={{ width: `${result.scores.ats_score}%` }}
            ></div>
          </div>

          {/* Similarity */}
          <p className="score-title">
            Role Match: {(result.scores.similarity * 100).toFixed(1)}%
          </p>
          <div className="score-bar">
            <div
              className="score-fill green"
              style={{ width: `${result.scores.similarity * 100}%` }}
            ></div>
          </div>

          {/* Missing Skills */}
          <h3 className="section-title">Missing Skills</h3>
          <ul className="list">
            {result.scores.missing_skills.map((s, i) => (
              <li key={i}>❌ {s}</li>
            ))}
          </ul>

          {/* Suggestions */}
          <h3 className="section-title">Suggestions</h3>
          <div className="suggest-box">
            {result.suggestions.map((s, i) => (
              <p key={i}>✅ {s}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
