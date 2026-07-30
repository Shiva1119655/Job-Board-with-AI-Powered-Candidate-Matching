#Data validation
#Request body checking
#Response formatting
#Automatic API documentation in Swagger
from enum import Enum
from typing import Any, List, Dict, Optional
from pydantic import BaseModel

class JobCreate(BaseModel):
    title: str
    company: str
    description: str
    required_skills: List[str]
    experience_level: str
    location: str
    domain: str
    status: str
    apply_url: Optional[str] = None

class JobResponse(JobCreate):
    id: str
    job_key: Optional[str] = None
    created_at: str
    apply_url: Optional[str] = None

class ApplicationCandidate(BaseModel):
    id: str
    name: Optional[str] = None


class CandidatePreferences(BaseModel):
    preferred_location: Optional[str] = None
    role_type: Optional[str] = None
    domain_interest: Optional[List[str]] = None


class CandidateCreate(BaseModel):
    name: str
    skills: List[str]
    education: List[str]
    projects: Optional[List[str]] = None
    preferences: Optional[CandidatePreferences] = None


class CandidateResponse(CandidateCreate):
    id: str
    created_at: str

class NaturalLanguageQuery(BaseModel):
    query: str

class MatchResponse(BaseModel):
    id: str
    title: str
    company: str
    description: str
    required_skills: List[str]
    experience_level: str
    location: str
    domain: str
    status: str
    created_at: str
    match_score: float
    explanation: str

class ApplicationCreate(BaseModel):
    job_id: str
    candidate_id: str
    cover_letter: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    job_title: str
    candidate_id: str
    candidate_name: Optional[str] = None
    candidate_details: Optional[Dict[str, Any]] = None
    status: str
    applied_at: str
    cover_letter: Optional[str] = None

class ApplicationStatus(str, Enum):
    APPLIED = "Applied"
    SHORTLISTED = "Shortlisted"
    REJECTED = "Rejected"

class ApplicationUpdateStatus(BaseModel):
    status: ApplicationStatus

class AdminAnalytics(BaseModel):
    total_jobs: int
    active_jobs: int
    total_applications: int
    applications_per_job: Dict[str, int]
    skill_distribution: Dict[str, int]
    pipeline_counts: Dict[str, int]
