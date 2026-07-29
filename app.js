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

function renderCandidateSummary(candidate) {
  const container = document.getElementById('candidate-summary');
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
  const preferred_location = document.getElementById('cand-location').value.trim();
  const role_type = document.getElementById('cand-role-type').value.trim();
  const domain_interest = document.getElementById('cand-domains').value.split(',').map(s => s.trim()).filter(Boolean);

  const payload = { name, skills, education, projects: projects.length ? projects : undefined, preferences: { preferred_location, role_type, domain_interest } };

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
  document.getElementById('candidate-form').reset();
  renderCandidateSummary(null);
  showToast('Profile cleared.');
}

function createJobCard(job) {
  const subtitle = `${job.company} • ${job.location}`;
  const description = `${job.description || ''}`;
  const statusBadge = `<span class="badge">${job.status}</span>`;
  const skills = job.required_skills && job.required_skills.length
    ? `<div class="meta">${job.required_skills.map(skill => `<span class="skill-chip">${skill}</span>`).join('')}</div>`
    : '';
  let applyBtn = '';
  if (job.apply_url) {
    applyBtn = `
      <div class="action-group">
        <a class="action-button external-apply" href="${job.apply_url}" target="_blank" rel="noopener noreferrer">Apply on company site</a>
        <button class="tertiary-button" type="button">Details</button>
      </div>
    `;
  } else {
    applyBtn = `
      <div class="action-group">
        <button class="action-button apply-button" data-job-id="${job.id}">Apply</button>
        <button class="tertiary-button" type="button">Details</button>
      </div>
    `;
  }
  return `
    <div class="card">
      <div class="card-header">
        <h3>${job.title}</h3>
        ${statusBadge}
      </div>
      <small>${subtitle}</small>
      <p>${description}</p>
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
const coverInput = document.getElementById('cover-letter');
const jobIdInput = document.getElementById('apply-job-id');
const jobMetaSpan = document.getElementById('apply-job-meta');
const cancelBtn = document.getElementById('cancel-application');

function openApplyModal(job) {
  jobIdInput.value = job.id;
  jobMetaSpan.textContent = `${job.title} • ${job.meta}`;
  coverInput.value = '';
  applyModal.classList.remove('hidden');
  applyModal.setAttribute('aria-hidden', 'false');

  // set submit handler
  applyForm.onsubmit = async (e) => {
    e.preventDefault();
    const cover = coverInput.value.trim();
    await submitApplication(job.id, cover);
    closeApplyModal();
  };
}

function closeApplyModal() {
  applyModal.classList.add('hidden');
  applyModal.setAttribute('aria-hidden', 'true');
  applyForm.onsubmit = null;
}

modalOverlay.addEventListener('click', closeApplyModal);
cancelBtn.addEventListener('click', closeApplyModal);

async function submitApplication(jobId, cover) {
  try {
    const payload = { job_id: jobId, candidate_id: currentCandidateId };
    if (cover) payload.cover_letter = cover;
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
  const query = document.getElementById("match-query").value.trim();
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

document.getElementById("match-button").addEventListener("click", runMatch);
document.getElementById("match-action").addEventListener("click", runMatch);
document.getElementById("clear-query").addEventListener("click", () => {
  document.getElementById("match-query").value = "";
  document.getElementById("match-results").innerHTML = "";
});

document.getElementById("refresh-jobs").addEventListener("click", fetchJobs);
fetchJobs();
// Candidate profile removed — no profile fetch
// Candidate profile wiring
document.getElementById('candidate-form').addEventListener('submit', saveCandidateFromForm);
document.getElementById('clear-profile').addEventListener('click', clearProfile);
loadCandidate();
