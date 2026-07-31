import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "files"))

from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_application_records_created_at_and_pending_status():
    job_payload = {
        "title": "QA Automation Engineer",
        "company": "Example Labs",
        "description": "Build robust automation tests.",
        "required_skills": ["Python", "Pytest"],
        "experience_level": "Mid",
        "location": "Remote",
        "domain": "Product",
        "status": "open",
        "apply_url": "https://example.com/job"
    }
    job_resp = client.post("/api/jobs", json=job_payload)
    assert job_resp.status_code == 201, job_resp.text
    job_id = job_resp.json()["id"]

    candidate_payload = {
        "name": "Test Candidate",
        "skills": ["Python", "FastAPI"],
        "education": ["B.Tech"],
        "projects": ["Job Board"],
        "linkedin_url": "https://linkedin.com/in/test-candidate",
        "resume_url": "https://example.com/resume.pdf",
        "cover_letter": "I am eager to contribute.",
        "preferences": {
            "preferred_location": "Hyderabad",
            "role_type": "Full-time",
            "domain_interest": ["Product"]
        }
    }
    candidate_resp = client.post("/api/candidates", json=candidate_payload)
    assert candidate_resp.status_code == 201, candidate_resp.text
    candidate_data = candidate_resp.json()
    assert candidate_data["linkedin_url"] == "https://linkedin.com/in/test-candidate"
    assert candidate_data["resume_url"] == "https://example.com/resume.pdf"
    candidate_id = candidate_data["id"]

    apply_resp = client.post("/api/applications", json={"job_id": job_id, "candidate_id": candidate_id, "cover_letter": "I am eager to contribute."})
    assert apply_resp.status_code == 201, apply_resp.text
    app_data = apply_resp.json()
    assert "created_at" in app_data
    assert "applied_at" in app_data
    assert app_data["created_at"] == app_data["applied_at"]
    assert app_data["status"] == "Pending"


def test_admin_can_update_application_status():
    job_payload = {
        "title": "Backend Engineer",
        "company": "Example Labs",
        "description": "Build APIs.",
        "required_skills": ["Python"],
        "experience_level": "Senior",
        "location": "Remote",
        "domain": "Product",
        "status": "open",
        "apply_url": "https://example.com/backend"
    }
    job_resp = client.post("/api/jobs", json=job_payload)
    assert job_resp.status_code == 201, job_resp.text
    job_id = job_resp.json()["id"]

    candidate_resp = client.post("/api/candidates", json={
        "name": "Status Candidate",
        "skills": ["Python"],
        "education": ["B.Tech"],
        "projects": ["API"],
        "preferences": {"preferred_location": "Remote", "role_type": "Full-time", "domain_interest": ["Product"]}
    })
    candidate_id = candidate_resp.json()["id"]

    apply_resp = client.post("/api/applications", json={"job_id": job_id, "candidate_id": candidate_id})
    app_id = apply_resp.json()["id"]

    patch_resp = client.patch(f"/api/applications/{app_id}/status", json={"status": "Shortlisted"})
    assert patch_resp.status_code == 200, patch_resp.text
    assert patch_resp.json()["status"] == "Shortlisted"
