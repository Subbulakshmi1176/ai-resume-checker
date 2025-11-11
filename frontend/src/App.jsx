import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState("");
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // ✅ Load backend URL from .env file
  const API = import.meta.env.VITE_BACKEND_URL;
  console.log("✅ Loaded Backend URL:", API);   // <--- IMPORTANT

  // ✅ Load roles from backend
  useEffect(() => {
    if (!API) {
      console.log("❌ API URL missing! Check .env file");
      return;
    }

    fetch(`${API}/roles`)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Roles loaded:", data);
        setRoles(data);
      })
      .catch((err) => console.error("❌ Roles API error:", err));
  }, [API]);

  const analyzeResume = async () => {
    if (!file || !role) {
      alert("Please upload a resume and select a role.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("role_key", role);

    try {
      const res = await fetch(`${API}/analyze_resume`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("❌ Error analyzing resume:", error);
      alert("Server error. Check backend.");
    }

    setLoading(false);
  };

  return (
    <div className="app">
      <h1 className="title">AI Resume Strength Checker</h1>

      {/* Upload Card */}
      <div className="upload-card">
        <label className="label">Select Job Role</label>

        <select
          className="dropdown"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">-- Choose Role --</option>

          {roles && Object.entries(roles).length > 0 ? (
            Object.entries(roles).map(([key, value]) => (
              <option key={key} value={key}>
                {value.title}
              </option>
            ))
          ) : (
            <option disabled>Loading roles...</option>
          )}
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


