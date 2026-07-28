# AI Job Board

A simple job board web application with two roles: Company Admin and Candidate.

## Features

- Admin can create, edit, and manage job listings
- Candidate can create a profile, browse jobs, and apply
- AI-powered job matching using natural language queries
- Application pipeline tracking and dashboard summaries
- Job search and filtering by skills, location, and experience level

## Backend

### Start backend

1. Navigate to `backend`
2. Install dependencies: `pip install -r requirements.txt`
3. Run: `uvicorn main:app --reload --http://127.0.0.1:8000/`

### API Endpoints

- `GET /jobs`
- `POST /jobs`
- `GET /jobs/{job_id}`
- `PUT /jobs/{job_id}`
- `DELETE /jobs/{job_id}`
- `POST /candidates`
- `GET /candidates/{candidate_id}`
- `PUT /candidates/{candidate_id}`
- `POST /applications?job_id={job_id}&candidate_id={candidate_id}`
- `GET /jobs/{job_id}/applications`
- `PATCH /applications/{application_id}?status=shortlisted`
- `POST /match`
- `GET /admin/dashboard`

## Frontend

### Start frontend

1. Navigate to `frontend`
2. Install dependencies: `npm install`
3. Run: `npm start`

## Notes

- The backend uses in-memory storage and resets when restarted.
- The matching endpoint uses heuristic scoring to rank job listings and explain results.
