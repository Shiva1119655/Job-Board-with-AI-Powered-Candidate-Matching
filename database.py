from typing import Dict
import uuid
from datetime import datetime

class Database:
    def __init__(self):
        self.jobs: Dict[str, dict] = {}
        self.applications: Dict[str, dict] = {}
        self.candidates: Dict[str, dict] = {}
        self.seed_data()

    def seed_data(self):
        job1_id = str(uuid.uuid4())
        job2_id = str(uuid.uuid4())
        job3_id = str(uuid.uuid4())

        self.jobs[job1_id] = {
            "id": job1_id,
            "title": "Associate software developer",
            "company": "Heizen",
            "description": "Proficiency in at least one programming language (Python, Java, JavaScript/TypeScript, or similar).",
            "required_skills": ["Python", "FastAPI", "PostgreSQL", "Java", "REST API"],
            "experience_level": "Senior",
            "location": "Remote",
            "domain": "Healthcare",
            "status": "open",
            "apply_url": "https://www.heizen.work/careers/associate-software-engineer",
            "created_at": datetime.now().isoformat()
        }

        self.jobs[job2_id] = {
            "id": job2_id,
            "title": "Python Developer",
            "company": "KPT Tech Service Inc",
            "description": "High-performance Python Web Developer specializing in building responsive, scalable dashboards for web and mobile platforms. Expert in combining Python backends with modern Tailwind CSS frontends to deliver fast, data-driven user experiences.",
            "required_skills": ["Django", "Python", "flask Api", "Rest", "CI/CD"],
            "experience_level": "Entry-Level",
            "location": "Hyderabad, Telangana",
            "domain": "Fintech",
            "status": "open",
            "apply_url": "https://kpitechservices.com/careers",
            "created_at": datetime.now().isoformat()
        }

        self.jobs[job3_id] = {
            "id": job3_id,
            "title": "AI/ML Engineer",
            "company": "Infosys",
            "description": "Looking for a Python specialist to build computer vision AI models for radiology image analysis in an agile startup environment.",
            "required_skills": ["Python", "PyTorch", "Computer Vision", "Machine Learning", "Deep Learning"],
            "experience_level": "Entry-Level",
            "location": "Hyderabad, Telangana",
            "domain": "Product",
            "status": "open",
            "apply_url": "https://infosys.example.com/careers/ai-ml-001",
            "created_at": datetime.now().isoformat()
        }
        job4_id = str(uuid.uuid4())
        self.jobs[job4_id] = {
                    "id": job4_id,
                    "title": " Software Development Engineer",
                    "company": "MountBlu",
                    "description": "Familiarity with at least one programming language. Example: Javascript, Java, PHP or Python.",
                    "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "REST API"],
                    "experience_level": "Senior",
                    "location": "Chennai",
                    "domain": "Healthcare",
                    "status": "open",
                    "apply_url": "https://careers.mountblue.io/sde?utm_source=sp_auto_dm&fbclid=PARlRTSATVW8RwZG9mAmV4dG4DYWVtAjEwAHNydGMGYXBwX2lkDzEyNDAyNDU3NDI4NzQxNAABpwgSpnwljSlUilidr5PpzMRfRBBMmwSgTOTNIol4Vlx6wOJJbE93e6P2B5PN_aem_chKFzSkTFtLPx1mXlronkg",
                    "created_at": datetime.now().isoformat()
                }
        job5_id = str(uuid.uuid4())
        self.jobs[job5_id] = {
            "id": job5_id,
            "title": "QA Engineer",
            "company": "Abhi Bus",
            "description": "Familiarity with at least one programming language. Example: Javascript, Java, PHP or Python.",
            "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "REST API"],
            "experience_level": "Associate",
            "location": "Chennai",
            "domain": "product",
            "status": "open",
            "apply_url": "https://jobs.smartrecruiters.com/AbhiBus/744000137092471?fbclid=PARlRTSATS44pwZG9mAmV4dG4DYWVtAjEwAHNydGMGYXBwX2lkDzEyNDAyNDU3NDI4NzQxNAABp1T8rfF2tv-nDeYwt1TYBOjdZZbjXP33juwP9MvX_ZFpZ5pHC35mZRZC2bRC_aem_m6GNGiZm5wGBcafNi-UB0g",
            "created_at": datetime.now().isoformat()
        }
        job6_id = str(uuid.uuid4())
        self.jobs[job6_id] = {
                    "id": job6_id,
                    "title": "AI Developer",
                    "company": "Accenture",
                    "description": "Strong academic background. Relevant certifications in Python, Cloud, Data Analytics, or AI are an added advantage.",
                    "required_skills": ["Data Structures & Algorithms SQL and Database Concepts REST APIs Git/Version Control"],
                    "experience_level": "Associate",
                    "location": "Bengaluru, Karnataka",
                    "domain": "Service",
                    "status": "open",
                    "apply_url": "https://www.accenture.com/in-en/careers/jobdetails?id=AIOC-S01655439_en&fbclid=PARlRTSATSbw1wZG9mAmV4dG4DYWVtAjEwAHNydGMGYXBwX2lkDzEyNDAyNDU3NDI4NzQxNAABp5-fO1A541sfaxETGRSHifgd1QKteasbM2gFBUozp1K8_0jc2ua6_MWGbt8H_aem_uOlXiAHgiZfhpBIJeYQVGQ",
                    "created_at": datetime.now().isoformat()
                }
        job7_id = str(uuid.uuid4())
        self.jobs[job7_id] = {
                            "id": job7_id,
                            "title": "Voice/Non Voice Process",
                            "company": "Concentrix",
                            "description": "Good communication skills and good verbal writing skills.",
                            "required_skills": ["Test Link provided"],
                            "experience_level": "Associate",
                            "location": "Hyderabad, Telangana",
                            "domain": "Service",
                            "status": "closed",
                            "apply_url": "https://concentrix.myamcat.com/register?data=zfmPuUF9UxJRR0maCTAXsacw8z2SCN9CHKUEKlBxfKKuOiCtWiv9x2nQTjNAj9LSeNqPICO7o0HQzAYmoS6GUA==&fbclid=PARlRTSATLyFFUREVYBMrvWXBkb2YCZXh0bgNhZW0CMTAAc3J0YwZhcHBfaWQPMTI0MDI0NTc0Mjg3NDE0AAGnOfNB6ZTcUWBge_uTzTAX9z3JLCP8TiPqLskKBRuAdrRv_wJ5YUzTUkrPpXQ_aem_v9Tg6u-x9r9KdGqCIiz-Ow",
                            "created_at": datetime.now().isoformat()
                        }
        job8_id = str(uuid.uuid4())
        self.jobs[job8_id] = {
                            "id": job8_id,
                            "title": "Software Engineer (Multiple roles)",
                            "company": "Deloitte",
                            "description": "Builds, tests, and maintains secure, high-performance back-end applications using Java and enterprise frameworks like Spring..",
                                    "required_skills": ["Data Analytics,AI/ML,Python,Java,Spring Boot,REST APIs"],
                                    "experience_level": "Entry-Level",
                                    "location": "Hyderabad, Telangana",
                                    "domain": "product",
                                    "status": "open",
                                    "apply_url": "https://www.linkedin.com/jobs/view",
                                    "created_at": datetime.now().isoformat()
                                }
        job9_id = str(uuid.uuid4())
        self.jobs[job9_id] = {
                                    "id": job9_id,
                                    "title": "Software Dev Engineer",
                                    "company": "Amazon",
                                    "description": "Build distributed storage, index, and query systems that are scalable, fault-tolerant, low cost, and easy to manage/use.",
                                            "required_skills": ["Knowledge of programming languages such as C/C++, Python, Java or Perl"],
                                            "experience_level": "Entry-Level",
                                            "location": "bengaluru, karnataka",
                                            "domain": "product",
                                            "status": "open",
                                            "apply_url": "https://www.amazon.jobs/en/jobs/10454435/software-dev-engineer-i-amazon-university-talent-acquisition",
                                            "created_at": datetime.now().isoformat()
                                        }
        job10_id = str(uuid.uuid4())
        self.jobs[job10_id] = {
                                            "id": job10_id,
                                            "title": "Software Engineer",
                                            "company": "Resupulse",
                                            "description": "Build features end to end — UI in Next.js/React/TypeScript, API routes on the backend, and the MongoDB schema behind them",
                                                    "required_skills": ["Knowledge of programming languages such as C/C++, Python, Java or MongoDb,Ui/UX,Next.js,React,TypeScript"],
                                                    "experience_level": "Entry-Level",
                                                    "location": "Remote",
                                                    "domain": "product",
                                                    "status": "open",
                                                    "apply_url": "https://resupulse.online/careers/full-stack-engineer-fresher-3?utm_source=chatgpt.com&fbclid=PARlRTSATPw0BwZG9mAmV4dG4DYWVtAjEwAHNydGMGYXBwX2lkDzEyNDAyNDU3NDI4NzQxNAABp07bgD_uem22_PKJZUNtEnnf9DT5YTwHd9DVyQ1c6s3iwYGKQP0MJvyGe4aJ_aem_DcQoMd6ZVo2zagVyQtvjFA",
                                                    "created_at": datetime.now().isoformat()
                                                }
        
    

        # Candidate profiles removed — applications will reference candidate IDs only


db = Database()
