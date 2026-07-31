import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List

class AIMatchingEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')

    def _prepare_job_text(self, job: dict) -> str:
        skills_text = " ".join(job.get("required_skills", []))
        return f"{job.get('title', '')} {job.get('description', '')} {skills_text} {job.get('domain', '')} {job.get('location', '')} {job.get('experience_level', '')}"

    def rank_jobs(self, query: str, jobs: List[dict]) -> List[dict]:
        if not jobs or not query.strip():
            return []

        corpus = [query] + [self._prepare_job_text(job) for job in jobs]
        tfidf_matrix = self.vectorizer.fit_transform(corpus)

        query_vec = tfidf_matrix[0]
        job_vecs = tfidf_matrix[1:]
        similarities = cosine_similarity(query_vec, job_vecs).flatten()

        ranked_results = []
        for idx, job in enumerate(jobs):
            raw_score = float(similarities[idx])

            matched_skills = [s for s in job["required_skills"] if s.lower() in query.lower()]
            matched_domain = job["domain"].lower() in query.lower()
            matched_location = job["location"].lower() in query.lower()

            final_score = min(round((raw_score * 0.7 + len(matched_skills) * 0.15 + (0.15 if matched_domain else 0)) * 100, 1), 99.9)
            if raw_score > 0 and final_score < 30.0:
                final_score = round(30.0 + raw_score * 40, 1)

            explanations = []
            if matched_skills:
                explanations.append(f"Matches key required skills: {', '.join(matched_skills)}")
            if matched_domain:
                explanations.append(f"Aligns with requested domain '{job['domain']}'")
            if matched_location:
                explanations.append(f"Fits preferred location ({job['location']})")
            if not explanations:
                explanations.append("Matches general search criteria and job description text.")

            explanation_str = "; ".join(explanations) + "."

            result = dict(job)
            result["match_score"] = final_score
            result["explanation"] = explanation_str
            ranked_results.append(result)

        ranked_results.sort(key=lambda x: x["match_score"], reverse=True)
        return ranked_results

ai_engine = AIMatchingEngine()
