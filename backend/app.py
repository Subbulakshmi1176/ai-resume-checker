# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from resume_scanner import extract_text_from_pdf, compute_scores

app = Flask(__name__)
CORS(app)

# load roles
ROLES_PATH = os.path.join(os.path.dirname(__file__), "roles.json")
with open(ROLES_PATH, "r", encoding="utf-8") as f:
    ROLES = json.load(f)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/roles", methods=["GET"])
def list_roles():
    # return available role keys and titles
    out = {k: {"title": v.get("title"), "description": v.get("description")} for k,v in ROLES.items()}
    return jsonify(out)

@app.route("/analyze_resume", methods=["POST"])
def analyze_resume():
    # expects form-data: file=resumefile, role_key (e.g., 'java_developer') OR role_description
    if "file" not in request.files:
        return jsonify({"error": "no file uploaded"}), 400
    file = request.files["file"]
    filename = file.filename
    saved_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(saved_path)

    role_key = request.form.get("role_key")
    role_description = request.form.get("role_description")

    if role_key:
        role_info = ROLES.get(role_key)
        if not role_info:
            return jsonify({"error": "unknown role_key"}), 400
    elif role_description:
        role_info = {"title": "custom", "description": role_description, "skills": []}
    else:
        return jsonify({"error": "role_key or role_description required"}), 400

    try:
        text = extract_text_from_pdf(saved_path)
        if not text:
            return jsonify({"error": "no text extracted (scanned PDF?)"}), 400
        scores = compute_scores(text, role_info)
        resp = {
            "filename": filename,
            "role": role_info.get("title"),
            "scores": scores,
            "suggestions": generate_suggestions(scores)
        }
        return jsonify(resp)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_suggestions(scores):
    suggestions = []
    if scores["ats_score"] < 50:
        suggestions.append("Increase coverage of required skills — add missing technologies in your experience/skills section.")
    if scores["similarity"] < 0.5:
        suggestions.append("Rewrite your summary to reflect the role responsibilities and keywords.")
    if len(scores["missing_skills"]) > 0:
        suggestions.append("Add at least 2–3 of the missing skills (if you know them) or highlight transferable experience.")
    suggestions.append("Use clear section headings (Skills, Experience, Projects) and avoid images that confuse parsers.")
    return suggestions

@app.route("/", methods=["GET"])
def home():
    return "✅ Resume Checker Backend Running"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


#http://localhost:5174/test-upload.html