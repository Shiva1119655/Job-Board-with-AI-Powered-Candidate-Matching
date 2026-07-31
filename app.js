const apiBase = "/api";

function createCard(title, subtitle, body) {
  return `
    <div class="card">
      <div class="card-header">
        <h3>${title}</h3>
        <span class="badge">${subtitle}</span>
      </div>
      <p>${body}</p>
    </div>
  `;
}

let currentCandidateId = "anonymous";
let refreshChannel = null;

function initJobRefreshSync() {
  if (window.BroadcastChannel) {
    refreshChannel = new BroadcastChannel('job-board-sync');
    refreshChannel.addEventListener('message', () => {
      fetchJobs();
    });
  }

  window.addEventListener('storage', (event) => {
    if (event.key === 'job-board-refresh') {
      fetchJobs();
    }
  });
}

function notifyJobsChanged() {
  localStorage.setItem('job-board-refresh', String(Date.now()));
  if (refreshChannel) {
    refreshChannel.postMessage({ type: 'refresh' });
  }
  return fetchJobs();
}

// Candidate profile helpers
function getStoredCandidateId() {
  return localStorage.getItem('candidate_id');
}

function setStoredCandidateId(id) {
  localStorage.setItem('candidate_id', id);
}

function clearStoredCandidateId() {
  localStorage.removeItem('candidate_id');
}

function renderHeroProfile(candidate) {
  const container = document.getElementById('hero-profile');
  if (!container) return;
  if (!candidate) {
    container.innerHTML = '';
    return;
  }

  const initials = (candidate.name || '').split(' ').map(n => n[0] || '').slice(0, 2).join('').toUpperCase();
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>${candidate.name || 'Candidate Profile'}</h3>
        <span class="badge">Saved</span>
      </div>
      <p>${(candidate.preferences && candidate.preferences.role_type) ? candidate.preferences.role_type : 'Ready to apply'}</p>
      <div class="meta"><span class="skill-chip">${initials || 'CU'}</span></div>
    </div>
  `;
}

function renderCandidateSummary(candidate) {
  const container = document.getElementById('candidate-summary');
  if (!container) return;
  if (!candidate) {
    container.innerHTML = '<p>No profile saved yet.</p>';
    renderHeroProfile(null);
    return;
  }

  const initials = (candidate.name || '').split(' ').map(n => n[0] || '').slice(0,2).join('').toUpperCase();
  container.innerHTML = `
    <div class="candidate-card">
      <div class="avatar-placeholder">${initials || 'CU'}</div>
      <div style="flex:1;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
              <h3 style="margin:0;">${candidate.name}</h3>
              <span class="badge">${(candidate.preferences && candidate.preferences.role_type) || ''}</span>
        </div>
        <div style="margin-top:8px;color:var(--muted)"><strong>Skills:</strong> ${candidate.skills?.join(', ') || ''}</div>
        <div style="margin-top:6px;color:var(--muted)"><strong>Education:</strong> ${candidate.education?.join(', ') || ''}</div>
        <div style="margin-top:6px;color:var(--muted)"><strong>Projects:</strong> ${candidate.projects?.join(', ') || ''}</div>
        <div style="margin-top:6px;color:var(--muted)"><strong>Location:</strong> ${(candidate.preferences && candidate.preferences.preferred_location) || ''} ${(candidate.preferences && candidate.preferences.domain_interest) ? ' • ' + (candidate.preferences.domain_interest || []).join(', ') : ''}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button id="hero-open-profile" class="secondary-button">Profile</button>
        <button id="hero-edit-profile" class="tertiary-button">Edit</button>
      </div>
    </div>
  `;

  // update hero and wire buttons
  renderHeroProfile(candidate);
  const editBtn = document.getElementById('hero-edit-profile');
  if (editBtn) editBtn.addEventListener('click', () => {
    document.getElementById('cand-name').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  const openBtn = document.getElementById('hero-open-profile');
  if (openBtn) openBtn.addEventListener('click', () => openProfileModal(candidate));
}

function openProfileModal(candidate) {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  document.getElementById('profile-name').textContent = candidate.name || '';
  document.getElementById('profile-skills').textContent = 'Skills: ' + (candidate.skills || []).join(', ');
  document.getElementById('profile-education').textContent = 'Education: ' + (candidate.education || []).join(' • ');
  document.getElementById('profile-projects').textContent = 'Projects: ' + (candidate.projects || []).join(', ');
  document.getElementById('profile-preferences').textContent = 'Preferences: ' + (candidate.preferences ? ((candidate.preferences.preferred_location || '') + ' • ' + (candidate.preferences.role_type || '')) : '');
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  // wire close
  const closeBtn = document.getElementById('close-profile-modal');
  const overlay = document.getElementById('profile-modal-overlay');
  if (closeBtn) closeBtn.onclick = () => closeProfileModal();
  if (overlay) overlay.onclick = () => closeProfileModal();
  const editModalBtn = document.getElementById('edit-profile-from-modal');
  if (editModalBtn) editModalBtn.onclick = () => {
    closeProfileModal();
    document.getElementById('cand-name').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
}

function closeProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

async function loadCandidate() {
  const stored = getStoredCandidateId();
  if (!stored) {
    renderCandidateSummary(null);
    return;
  }
  try {
    const res = await fetch(`${apiBase}/candidates/${stored}`);
    if (res.ok) {
      const cand = await res.json();
      currentCandidateId = cand.id;
      renderCandidateSummary(cand);
      // populate form
      document.getElementById('cand-name').value = cand.name || '';
      document.getElementById('cand-skills').value = (cand.skills || []).join(', ');
      document.getElementById('cand-education').value = (cand.education || []).join('\n');
      document.getElementById('cand-projects').value = (cand.projects || []).join(', ');
      document.getElementById('cand-email').value = cand.email || '';
      document.getElementById('cand-mobile').value = cand.mobile_number || '';
      document.getElementById('cand-linkedin').value = cand.linkedin_url || '';
      document.getElementById('cand-cover-letter').value = cand.cover_letter || '';
      document.getElementById('cand-resume').value = cand.resume_url || '';
      document.getElementById('cand-location').value = (cand.preferences && cand.preferences.preferred_location) || '';
      document.getElementById('cand-role-type').value = (cand.preferences && cand.preferences.role_type) || '';
      document.getElementById('cand-domains').value = (cand.preferences && cand.preferences.domain_interest ? (cand.preferences.domain_interest || []).join(', ') : '');
    } else {
      renderCandidateSummary(null);
    }
  } catch (err) {
    renderCandidateSummary(null);
  }
}

async function saveCandidateFromForm(e) {
  e.preventDefault();
  const name = document.getElementById('cand-name').value.trim();
  const skills = document.getElementById('cand-skills').value.split(',').map(s => s.trim()).filter(Boolean);
  const education = document.getElementById('cand-education').value.split('\n').map(s => s.trim()).filter(Boolean);
  const projects = document.getElementById('cand-projects').value.split(',').map(s => s.trim()).filter(Boolean);
  const email = document.getElementById('cand-email').value.trim() || null;
  const mobile_number = document.getElementById('cand-mobile').value.trim() || null;
  const linkedin_url = document.getElementById('cand-linkedin').value.trim() || null;
  const cover_letter = document.getElementById('cand-cover-letter').value.trim() || null;
  const resume_url = document.getElementById('cand-resume').value.trim() || null;
  const preferred_location = document.getElementById('cand-location').value.trim();
  const role_type = document.getElementById('cand-role-type').value.trim();
  const domain_interest = document.getElementById('cand-domains').value.split(',').map(s => s.trim()).filter(Boolean);

  const payload = { name, skills, education, projects: projects.length ? projects : undefined, email, mobile_number, linkedin_url, resume_url, cover_letter, preferences: { preferred_location, role_type, domain_interest } };

  try {
    const stored = getStoredCandidateId();
    let res;
    if (stored) {
      // try to update existing profile
      res = await fetch(`${apiBase}/candidates/${stored}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status === 404) {
        // if not found on server, create new
        res = await fetch(`${apiBase}/candidates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
    } else {
      res = await fetch(`${apiBase}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      const cand = await res.json();
      setStoredCandidateId(cand.id);
      currentCandidateId = cand.id;
      renderCandidateSummary(cand);
      showToast('Profile saved.');
    } else {
      showToast('Failed to save profile.');
    }
  } catch (err) {
    showToast('Network error saving profile.');
  }
}

function clearProfile() {
  clearStoredCandidateId();
  currentCandidateId = 'anonymous';
  const form = document.getElementById('candidate-form');
  if (form) form.reset();
  renderCandidateSummary(null);
  showToast('Profile cleared.');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatJobDescription(description) {
  const text = String(description || '').trim();
  if (!text) return '';

  const cleaned = text
    .replace(/\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\bApply on company site\b/gi, '')
    .replace(/\bDetails\b/gi, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  const lines = cleaned.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) return '';

  return lines.map((line) => {
    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const content = escapeHtml(headingMatch[2]);
      return `<p class="job-description-heading">${content}</p>`;
    }
    return `<p class="job-description-line">${escapeHtml(line)}</p>`;
  }).join('');
}

function createJobCard(job) {
  const subtitle = `${job.company} • ${job.location}`;
  const description = formatJobDescription(job.description);
  const statusBadge = `<span class="badge">${job.status}</span>`;
  const skills = job.required_skills && job.required_skills.length
    ? `<div class="meta">${job.required_skills.map(skill => `<span class="skill-chip">${skill}</span>`).join('')}</div>`
    : '';
  const applyBtn = `
    <div class="action-group">
      <button class="action-button apply-button" data-job-id="${job.id}">Apply</button>
    </div>
  `;
  return `
    <div class="card">
      <div class="card-header">
        <h3>${job.title}</h3>
        ${statusBadge}
      </div>
      <small>${subtitle}</small>
      ${description ? `<div class="job-description">${description}</div>` : ''}
      ${skills}
      ${applyBtn}
    </div>
  `;
}

function renderJobs(jobs) {
  const container = document.getElementById("jobs-list");
  if (!jobs.length) {
    container.innerHTML = "<p>No jobs found.</p>";
    return;
  }
  container.innerHTML = jobs.map(job => createJobCard(job)).join("");

  // attach apply handlers
  container.querySelectorAll('.apply-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const jobId = e.currentTarget.getAttribute('data-job-id');
      const h = e.currentTarget.closest('.card').querySelector('h3');
      const s = e.currentTarget.closest('.card').querySelector('small');
      const jobTitle = h ? h.textContent : '';
      const jobMeta = s ? s.textContent : '';
      openApplyModal({ id: jobId, title: jobTitle, meta: jobMeta });
    });
  });
}

function renderMatches(matches) {
  const container = document.getElementById("match-results");
  if (!matches.length) {
    container.innerHTML = "<p>No matches found.</p>";
    return;
  }
  container.innerHTML = matches.map(job => createCard(`${job.title} (${job.match_score}%)`, `${job.company} • ${job.location} • ${job.status}`, `${job.explanation}<br/><strong>Skills:</strong> ${job.required_skills.join(", ")}`)).join("");
}


async function fetchJobs() {
  const res = await fetch(`${apiBase}/jobs`);
  const jobs = await res.json();
  renderJobs(jobs);
}


async function applyForJob(jobId) {
  try {
    const payload = { job_id: jobId, candidate_id: currentCandidateId };
    const res = await fetch(`${apiBase}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('Application submitted successfully.');
    } else {
      const err = await res.json().catch(() => null);
      showToast(err && err.detail ? `Error: ${err.detail}` : 'Failed to apply.');
    }
  } catch (err) {
    showToast('Network error submitting application.');
  }
}

// Modal handling
const applyModal = document.getElementById('apply-modal');
const modalOverlay = document.getElementById('modal-overlay');
const applyForm = document.getElementById('apply-form');
const jobIdInput = document.getElementById('apply-job-id');
const jobMetaSpan = document.getElementById('apply-job-meta');
const cancelBtn = document.getElementById('cancel-application');

function populateApplyFormFromSavedProfile() {
  const formFields = {
    'apply-name': document.getElementById('cand-name')?.value || '',
    'apply-skills': document.getElementById('cand-skills')?.value || '',
    'apply-education': document.getElementById('cand-education')?.value || '',
    'apply-email': document.getElementById('cand-email')?.value || '',
    'apply-mobile': document.getElementById('cand-mobile')?.value || '',
    'apply-linkedin': document.getElementById('cand-linkedin')?.value || '',
    'apply-projects': document.getElementById('cand-projects')?.value || '',
    'apply-cover-letter': document.getElementById('cand-cover-letter')?.value || '',
    'apply-location': document.getElementById('cand-location')?.value || '',
    'apply-role-type': document.getElementById('cand-role-type')?.value || '',
    'apply-domains': document.getElementById('cand-domains')?.value || ''
  };

  Object.entries(formFields).forEach(([id, value]) => {
    const field = document.getElementById(id);
    if (field) field.value = value;
  });
}

function openApplyModal(job) {
  if (!applyModal || !jobIdInput || !jobMetaSpan || !applyForm) return;
  jobIdInput.value = job.id;
  jobMetaSpan.textContent = `${job.title} • ${job.meta}`;
  populateApplyFormFromSavedProfile();
  applyModal.classList.remove('hidden');
  applyModal.setAttribute('aria-hidden', 'false');

  applyForm.onsubmit = async (e) => {
    e.preventDefault();
    await submitApplication(job.id);
    closeApplyModal();
  };
}

function closeApplyModal() {
  if (!applyModal || !applyForm) return;
  applyModal.classList.add('hidden');
  applyModal.setAttribute('aria-hidden', 'true');
  applyForm.onsubmit = null;
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', closeApplyModal);
}
if (cancelBtn) {
  cancelBtn.addEventListener('click', closeApplyModal);
}

async function submitApplication(jobId) {
  try {
    const name = document.getElementById('apply-name')?.value.trim() || '';
    const skills = (document.getElementById('apply-skills')?.value || '')
      .split(',').map(item => item.trim()).filter(Boolean);
    const education = (document.getElementById('apply-education')?.value || '')
      .split(/\n|,/).map(item => item.trim()).filter(Boolean);
    const email = document.getElementById('apply-email')?.value.trim() || null;
    const mobile_number = document.getElementById('apply-mobile')?.value.trim() || null;
    const projects = (document.getElementById('apply-projects')?.value || '')
      .split(/\n|,/).map(item => item.trim()).filter(Boolean);
    const linkedin_url = document.getElementById('apply-linkedin')?.value.trim() || null;
    const cover_letter = document.getElementById('apply-cover-letter')?.value.trim() || null;
    const resumeInput = document.getElementById('apply-resume');
    const resume_url = resumeInput && resumeInput.files && resumeInput.files[0]
      ? resumeInput.files[0].name
      : null;
    const preferred_location = document.getElementById('apply-location')?.value.trim() || '';
    const role_type = document.getElementById('apply-role-type')?.value.trim() || '';
    const domain_interest = (document.getElementById('apply-domains')?.value || '')
      .split(',').map(item => item.trim()).filter(Boolean);

    if (!name) {
      showToast('Please enter your name before applying.');
      return;
    }

    const profilePayload = {
      name,
      skills,
      education,
      projects: projects.length ? projects : undefined,
      email,
      mobile_number,
      linkedin_url,
      resume_url,
      cover_letter,
      preferences: {
        preferred_location,
        role_type,
        domain_interest,
      }
    };

    const storedCandidateId = getStoredCandidateId();
    let candidateId = storedCandidateId || currentCandidateId;

    let profileRes;
    if (candidateId && candidateId !== 'anonymous') {
      profileRes = await fetch(`${apiBase}/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload)
      });
      if (profileRes.status === 404) {
        profileRes = await fetch(`${apiBase}/candidates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profilePayload)
        });
      }
    } else {
      profileRes = await fetch(`${apiBase}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload)
      });
    }

    if (!profileRes.ok) {
      const err = await profileRes.json().catch(() => null);
      showToast(err && err.detail ? `Error: ${err.detail}` : 'Failed to save profile before applying.');
      return;
    }

    const savedCandidate = await profileRes.json();
    candidateId = savedCandidate.id;
    setStoredCandidateId(candidateId);
    currentCandidateId = candidateId;

    const applicationPayload = {
      job_id: jobId,
      candidate_id: candidateId,
      cover_letter: cover_letter || undefined
    };

    const res = await fetch(`${apiBase}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(applicationPayload)
    });
    if (res.ok) {
      showToast('Application submitted successfully.');
      renderCandidateSummary(savedCandidate);
    } else {
      const err = await res.json().catch(() => null);
      showToast(err && err.detail ? `Error: ${err.detail}` : 'Failed to apply.');
    }
  } catch (err) {
    showToast('Network error submitting application.');
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
    toast.classList.add("hidden");
  }, 2600);
}

async function runMatch() {
  const queryInput = document.getElementById("match-query");
  if (!queryInput) return;
  const query = queryInput.value.trim();
  if (!query) {
    showToast("Please enter a search query.");
    return;
  }
  const res = await fetch(`${apiBase}/jobs/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const matches = await res.json();
  renderMatches(matches);
  showToast("Job matches loaded.");
}

let editingJobId = null;

function resetAdminJobForm() {
  editingJobId = null;
  const form = document.getElementById('admin-job-form');
  if (form) form.reset();
  const submitButton = document.querySelector('#admin-job-form button[type="submit"]');
  if (submitButton) submitButton.textContent = 'Save Job';
}

function populateAdminJobForm(job) {
  editingJobId = job.id;
  document.getElementById('admin-title').value = job.title || '';
  document.getElementById('admin-company').value = job.company || '';
  document.getElementById('admin-description').value = job.description || '';
  document.getElementById('admin-skills').value = (job.required_skills || []).join(', ');
  document.getElementById('admin-experience').value = job.experience_level || '';
  document.getElementById('admin-location').value = job.location || '';
  document.getElementById('admin-domain').value = job.domain || '';
  document.getElementById('admin-status').value = job.status || 'open';
  document.getElementById('admin-apply-url').value = job.apply_url || '';
  const submitButton = document.querySelector('#admin-job-form button[type="submit"]');
  if (submitButton) submitButton.textContent = 'Update Job';
}

function createAdminJobCard(job) {
  return `
    <div class="card">
      <div class="admin-job-card">
        <div>
          <h3>${job.title}</h3>
          <small>${job.company} • ${job.location}</small>
          <p>${job.description || ''}</p>
          <div class="meta">${(job.required_skills || []).map(skill => `<span class="skill-chip">${skill}</span>`).join('')}</div>
        </div>
        <div class="admin-list-actions">
          <button class="secondary-button admin-edit-job" data-job-id="${job.id}" type="button">Edit</button>
          <button class="primary-button admin-load-applications" data-job-id="${job.id}" type="button">Applications</button>
        </div>
      </div>
    </div>
  `;
}

function renderAdminJobs(jobs) {
  const container = document.getElementById('admin-job-list');
  if (!container) return;
  if (!jobs.length) {
    container.innerHTML = '<p>No jobs yet.</p>';
    return;
  }
  container.innerHTML = jobs.map(createAdminJobCard).join('');
  container.querySelectorAll('.admin-edit-job').forEach(btn => {
    btn.addEventListener('click', () => {
      const jobId = btn.getAttribute('data-job-id');
      const job = jobs.find(item => item.id === jobId);
      if (job) populateAdminJobForm(job);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
  container.querySelectorAll('.admin-load-applications').forEach(btn => {
    btn.addEventListener('click', () => {
      const jobId = btn.getAttribute('data-job-id');
      loadApplicationsForJob(jobId);
    });
  });
}

async function fetchAdminJobs() {
  try {
    const res = await fetch(`${apiBase}/jobs`);
    const jobs = await res.json();
    renderAdminJobs(jobs);
  } catch (err) {
    showToast('Unable to load admin jobs.');
  }
}

function createApplicationRow(application) {
  const statuses = ['Pending', 'Shortlisted', 'Rejected'];
  const candidateName = application.candidate_name || application.candidate_id || 'Anonymous';
  const details = application.candidate_details || {};
  const detailBits = [];
  if (details.preferred_location) detailBits.push(details.preferred_location);
  if (details.role_type) detailBits.push(details.role_type);
  if (details.skills && details.skills.length) detailBits.push(`Skills: ${details.skills.join(', ')}`);
  if (details.education && details.education.length) detailBits.push(`Education: ${details.education.join(', ')}`);
  if (details.projects && details.projects.length) detailBits.push(`Projects: ${details.projects.join(', ')}`);
  const detailMarkup = detailBits.length ? `<div class="muted">${escapeHtml(detailBits.join(' • '))}</div>` : '';

  return `
    <tr>
      <td>
        <div>${escapeHtml(candidateName)}</div>
        ${detailMarkup}
      </td>
      <td>${escapeHtml(application.job_title || '')}</td>
      <td><select class="admin-status-select" data-app-id="${application.id}">${statuses.map(status => `<option value="${status}" ${application.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></td>
      <td>${escapeHtml(application.created_at || application.applied_at || '')}</td>
    </tr>
  `;
}

function renderApplications(applications) {
  const container = document.getElementById('admin-application-list');
  if (!container) return;
  if (!applications.length) {
    container.innerHTML = '<p>No applications for this job yet.</p>';
    return;
  }
  container.innerHTML = `
    <div class="table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Job</th>
            <th>Status</th>
            <th>Applied At</th>
          </tr>
        </thead>
        <tbody>${applications.map(createApplicationRow).join('')}</tbody>
      </table>
    </div>
  `;
  container.querySelectorAll('.admin-status-select').forEach(select => {
    select.addEventListener('change', async (event) => {
      const appId = event.target.getAttribute('data-app-id');
      const status = event.target.value;
      try {
        const res = await fetch(`${apiBase}/applications/${appId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        if (res.ok) {
          showToast(`Application moved to ${status}.`);
        } else {
          showToast('Unable to update application status.');
        }
      } catch (err) {
        showToast('Network error updating application status.');
      }
    });
  });
}

async function loadApplicationsForJob(jobId) {
  try {
    const res = await fetch(`${apiBase}/applications?job_id=${encodeURIComponent(jobId)}`);
    const applications = await res.json();
    renderApplications(applications);
  } catch (err) {
    showToast('Unable to load applications.');
  }
}

async function saveAdminJob(event) {
  event.preventDefault();
  const payload = {
    title: document.getElementById('admin-title').value.trim(),
    company: document.getElementById('admin-company').value.trim(),
    description: document.getElementById('admin-description').value.trim(),
    required_skills: document.getElementById('admin-skills').value.split(',').map(item => item.trim()).filter(Boolean),
    experience_level: document.getElementById('admin-experience').value.trim(),
    location: document.getElementById('admin-location').value.trim(),
    domain: document.getElementById('admin-domain').value.trim(),
    status: document.getElementById('admin-status').value.trim(),
    apply_url: document.getElementById('admin-apply-url').value.trim() || null
  };

  if (!payload.title || !payload.company || !payload.description || !payload.experience_level || !payload.location || !payload.domain) {
    showToast('Please fill in the required job fields.');
    return;
  }

  try {
    const url = editingJobId ? `${apiBase}/jobs/${editingJobId}` : `${apiBase}/jobs`;
    const method = editingJobId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const successMessage = editingJobId ? 'Job updated successfully.' : 'Job created successfully.';
      sessionStorage.setItem('admin-success-message', successMessage);
      resetAdminJobForm();
      await fetchAdminJobs();
      await notifyJobsChanged();
      if (window.location.pathname === '/admin') {
        window.location.href = '/';
      }
    } else {
      const err = await res.json().catch(() => null);
      showToast(err && err.detail ? `Error: ${err.detail}` : 'Failed to save job.');
    }
  } catch (err) {
    showToast('Network error saving job.');
  }
}

function isAdminAuthenticated() {
  return new URLSearchParams(window.location.search).get('auth') === 'granted';
}

async function initializeApp() {
  initJobRefreshSync();

  const successMessage = sessionStorage.getItem('admin-success-message');
  if (successMessage) {
    showToast(successMessage);
    sessionStorage.removeItem('admin-success-message');
  }

  if (document.getElementById('match-button')) {
    document.getElementById('match-button').addEventListener('click', runMatch);
  }
  if (document.getElementById('match-action')) {
    document.getElementById('match-action').addEventListener('click', runMatch);
  }
  const clearQueryButton = document.getElementById('clear-query');
  if (clearQueryButton) {
    clearQueryButton.addEventListener('click', () => {
      const queryInput = document.getElementById('match-query');
      if (queryInput) queryInput.value = '';
      const results = document.getElementById('match-results');
      if (results) results.innerHTML = '';
    });
  }
  const refreshJobsButton = document.getElementById('refresh-jobs');
  if (refreshJobsButton) {
    refreshJobsButton.addEventListener('click', fetchJobs);
  }

  const candidateForm = document.getElementById('candidate-form');
  if (candidateForm) {
    candidateForm.addEventListener('submit', saveCandidateFromForm);
  }
  const clearProfileButton = document.getElementById('clear-profile');
  if (clearProfileButton) {
    clearProfileButton.addEventListener('click', clearProfile);
  }

  if (window.location.pathname === '/admin' && !isAdminAuthenticated()) {
    window.location.href = '/admin';
    return;
  }

  const adminJobForm = document.getElementById('admin-job-form');
  if (adminJobForm) {
    adminJobForm.addEventListener('submit', saveAdminJob);
  }
  const adminResetButton = document.getElementById('admin-reset');
  if (adminResetButton) {
    adminResetButton.addEventListener('click', resetAdminJobForm);
  }

  fetchJobs();
  loadCandidate();
  if (document.getElementById('admin-job-list')) {
    fetchAdminJobs();
    loadApplicationsForJob('');
  }
}

initializeApp();
