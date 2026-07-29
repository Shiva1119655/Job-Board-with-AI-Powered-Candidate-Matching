from pathlib import Path
import sys

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from typing import Any, Dict, List, Optional, cast
import uuid
from datetime import datetime

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.database import db
from backend.schemas import (
    JobCreate, JobResponse, NaturalLanguageQuery,
    MatchResponse, ApplicationCreate, ApplicationResponse,
    ApplicationUpdateStatus, AdminAnalytics, ApplicationStatus,
    CandidateCreate, CandidateResponse
)
from backend.ai_matcher import ai_engine

app = FastAPI(title="AI-Powered Job Board API", version="1.0.0")
asgi_app = app

STATIC_DIR = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", include_in_schema=False)
def root():
    return FileResponse(STATIC_DIR / "index.html")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/jobs", response_model=List[JobResponse])
def get_jobs(
    skill: Optional[str] = None,
    location: Optional[str] = None,
    experience: Optional[str] = None
):
    jobs = list(db.jobs.values())
    if skill:
        jobs = [j for j in jobs if any(skill.lower() in s.lower() for s in j["required_skills"])]
    if location:
        jobs = [j for j in jobs if location.lower() in j["location"].lower()]
    if experience:
        jobs = [j for j in jobs if j["experience_level"].lower() == experience.lower()]
    return jobs

@app.get("/api/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: str):
    if job_id not in db.jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return db.jobs[job_id]

@app.post("/api/jobs", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(job: JobCreate):
    job_id = str(uuid.uuid4())
    job_dict = job.model_dump()
    job_dict["id"] = job_id
    job_dict["created_at"] = datetime.now().isoformat()
    db.jobs[job_id] = job_dict
    return job_dict

@app.put("/api/jobs/{job_id}", response_model=JobResponse)
def update_job(job_id: str, job: JobCreate):
    if job_id not in db.jobs:
        raise HTTPException(status_code=404, detail="Job listing not found")
    updated_dict = job.model_dump()
    updated_dict["id"] = job_id
    updated_dict["created_at"] = db.jobs[job_id]["created_at"]
    db.jobs[job_id] = updated_dict
    return updated_dict

@app.post("/api/jobs/match", response_model=List[MatchResponse])
def match_jobs(payload: NaturalLanguageQuery):
    open_jobs = [j for j in db.jobs.values() if j["status"] == "open"]
    return ai_engine.rank_jobs(payload.query, open_jobs)

# Candidate profile endpoints removed — applications reference candidate IDs only


@app.post("/api/candidates", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
def create_candidate(payload: CandidateCreate):
    cand_id = str(uuid.uuid4())
    cand_dict = payload.model_dump()
    cand_dict["id"] = cand_id
    cand_dict["created_at"] = datetime.now().isoformat()
    db.candidates[cand_id] = cand_dict
    return cand_dict


@app.get("/api/candidates", response_model=List[CandidateResponse])
def list_candidates():
    return list(db.candidates.values())


@app.get("/api/candidates/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: str):
    if candidate_id not in db.candidates:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return db.candidates[candidate_id]


@app.patch("/api/candidates/{candidate_id}", response_model=CandidateResponse)
def update_candidate(candidate_id: str, payload: CandidateCreate):
    if candidate_id not in db.candidates:
        raise HTTPException(status_code=404, detail="Candidate not found")
    existing = db.candidates[candidate_id]
    updated = payload.model_dump()
    updated["id"] = candidate_id
    updated["created_at"] = existing.get("created_at", datetime.now().isoformat())
    db.candidates[candidate_id] = updated
    return updated


@app.delete("/api/candidates/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(candidate_id: str):
    if candidate_id not in db.candidates:
        raise HTTPException(status_code=404, detail="Candidate not found")
    del db.candidates[candidate_id]
    return {}

@app.post("/api/applications", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_for_job(payload: ApplicationCreate):
    if payload.job_id not in db.jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    for app_item in db.applications.values():
        if app_item["job_id"] == payload.job_id and app_item.get("candidate_id") == payload.candidate_id:
            raise HTTPException(status_code=400, detail="Candidate has already applied to this job")

    app_id = str(uuid.uuid4())
    app_record = {
        "id": app_id,
        "job_id": payload.job_id,
        "job_title": db.jobs[payload.job_id]["title"],
        "candidate_id": payload.candidate_id,
        "candidate_name": None,
        "status": ApplicationStatus.APPLIED.value,
        "cover_letter": getattr(payload, 'cover_letter', None),
        "applied_at": datetime.now().isoformat()
    }
    db.applications[app_id] = app_record
    return app_record

@app.get("/api/applications", response_model=List[ApplicationResponse])
def get_applications(job_id: Optional[str] = None, candidate_id: Optional[str] = None):
    apps = list(db.applications.values())
    if job_id:
        apps = [a for a in apps if a["job_id"] == job_id]
    if candidate_id:
        apps = [a for a in apps if a.get("candidate_id") == candidate_id]
    return apps

@app.get("/api/applications/candidate/{candidate_id}", response_model=List[ApplicationResponse])
def get_candidate_applications(candidate_id: str):
    # Candidate profiles removed; return applications that reference the given candidate_id
    return [a for a in db.applications.values() if a.get("candidate_id") == candidate_id]

@app.patch("/api/applications/{app_id}/status", response_model=ApplicationResponse)
def update_application_status(app_id: str, payload: ApplicationUpdateStatus):
    if app_id not in db.applications:
        raise HTTPException(status_code=404, detail="Application not found")
    db.applications[app_id]["status"] = payload.status.value
    return db.applications[app_id]

@app.get("/api/admin/analytics", response_model=AdminAnalytics)
def get_admin_analytics():
    jobs = list(db.jobs.values())
    applications = list(db.applications.values())

    apps_per_job = {}
    for j in jobs:
        apps_per_job[j["title"]] = len([a for a in applications if a["job_id"] == j["id"]])

    skill_counts: Dict[str, int] = {}
    # Build skill distribution from jobs (candidates removed)
    pipeline_counts: Dict[str, int] = {"Applied": 0, "Shortlisted": 0, "Rejected": 0}
    for j in jobs:
        for skill in j.get("required_skills", []):
            skill_counts[skill] = skill_counts.get(skill, 0) + 1

    for app_item in applications:
        status_val = app_item.get("status")
        status_str = status_val if isinstance(status_val, str) else "Unknown"
        pipeline_counts[status_str] = pipeline_counts.get(status_str, 0) + 1

    return {
        "total_jobs": len(jobs),
        "active_jobs": len([j for j in jobs if j["status"] == "open"]),
        "total_applications": len(applications),
        "applications_per_job": apps_per_job,
        "skill_distribution": skill_counts,
        "pipeline_counts": pipeline_counts
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)