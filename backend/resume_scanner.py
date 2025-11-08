# resume_scanner.py
import pdfplumber
import re
import json
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# load embedding model (small & fast)
EMBED_MODEL = SentenceTransformer("all-MiniLM-L6-v2")  # compact model for semantic similarity

def extract_text_from_pdf(path):
    text_parts = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
    full_text = "\n".join(text_parts)
    # basic cleanup
    full_text = re.sub(r"\s+", " ", full_text).strip()
    return full_text

def skill_coverage(resume_text, required_skills):
    resume_lower = resume_text.lower()
    found = []
    missing = []
    for skill in required_skills:
        if skill.lower() in resume_lower:
            found.append(skill)
        else:
            # try fuzzy-ish match by token presence
            tokens = skill.lower().split()
            if all(t in resume_lower for t in tokens):
                found.append(skill)
            else:
                missing.append(skill)
    coverage = 0.0
    if len(required_skills) > 0:
        coverage = len(found) / len(required_skills)
    return found, missing, coverage

def semantic_similarity(resume_text, role_description):
    # compute embeddings for the resume (can chunk if long)
    emb_resume = EMBED_MODEL.encode([resume_text], convert_to_numpy=True)
    emb_role = EMBED_MODEL.encode([role_description], convert_to_numpy=True)
    sim = float(cosine_similarity(emb_resume, emb_role)[0,0])
    return sim  # between -1 and 1 (usually 0..1)

def compute_scores(resume_text, role_info):
    required_skills = role_info.get("skills", [])
    found, missing, coverage = skill_coverage(resume_text, required_skills)
    sim = semantic_similarity(resume_text, role_info.get("description",""))
    # Combine into an ATS-like score (simple weighted sum)
    # coverage weight = 0.6, semantic similarity weight = 0.4
    ats_raw = 0.6 * coverage + 0.4 * sim  # sim ~ 0..1
    ats_score = min(max(ats_raw, 0.0), 1.0) * 100
    return {
        "found_skills": found,
        "missing_skills": missing,
        "coverage": round(coverage, 3),
        "similarity": round(sim, 3),
        "ats_score": round(ats_score, 1)
    }
