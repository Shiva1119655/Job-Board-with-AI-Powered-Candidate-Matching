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
      const jobTitle = e.currentTarget.closest('.card').querySelector('h3')?.textContent || '';
      const jobMeta = e.currentTarget.closest('.card').querySelector('small')?.textContent || '';
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
