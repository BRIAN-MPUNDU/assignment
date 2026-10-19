// When the frontend is served by Express, a relative URL keeps the UI and API on the same host.
// For a separately hosted frontend, replace API_BASE with the deployed backend URL.
const API_BASE = '';
const API_URL = `${API_BASE}/api/notices`;
const form = document.getElementById('notice-form-element');
const tableBody = document.getElementById('notices-table-body');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const formMessage = document.getElementById('form-message');
const toast = document.getElementById('toast');
let notices = [];
let toastTimer;

const symbols = { Academic: '✧', Career: '↗', Community: '❋', Social: '♡', Sports: '⚽', Wellbeing: '☼', 'Arts & Culture': '✺', Other: '✦' };
const statusClass = { Upcoming: 'status-upcoming', Ongoing: 'status-ongoing', Completed: 'status-completed', Cancelled: 'status-cancelled' };
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
function formatDate(value) {
  if (!value) return 'Date not set';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
function showToast(message, isError = false) {
  clearTimeout(toastTimer); toast.textContent = message; toast.className = `toast show${isError ? ' error' : ''}`;
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3200);
}
function showFormMessage(message, type = 'success') {
  formMessage.textContent = message; formMessage.className = `inline-message show ${type}`;
}
function clearFormMessage() { formMessage.textContent = ''; formMessage.className = 'inline-message'; }

async function apiRequest(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) } });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.errors?.join(' ') || result.message || `Request failed (${response.status}).`);
  return result;
}

async function loadNotices() {
  loadingState.classList.remove('hidden'); emptyState.classList.add('hidden');
  try {
    const result = await apiRequest(API_URL);
    notices = result.data || [];
    renderNotices(); updateStats();
  } catch (error) {
    showToast(`Could not load notices: ${error.message}`, true);
    loadingState.textContent = 'Could not connect to the API. Check that the backend is running, then refresh.';
    loadingState.classList.remove('hidden');
    tableBody.innerHTML = '';
  }
}

function updateStats() {
  document.getElementById('total-count').textContent = notices.length;
  document.getElementById('upcoming-count').textContent = notices.filter(n => n.status === 'Upcoming' || n.status === 'Ongoing').length;
  document.getElementById('completed-count').textContent = notices.filter(n => n.status === 'Completed').length;
  document.getElementById('category-count').textContent = new Set(notices.map(n => n.category)).size;
  document.getElementById('list-count').textContent = notices.length;
}

function renderNotices() {
  loadingState.classList.add('hidden');
  const query = document.getElementById('search-input').value.trim().toLowerCase();
  const status = document.getElementById('status-filter').value;
  const filtered = notices.filter(n => {
    const haystack = [n.event_title, n.category, n.description, n.venue, n.organizer].join(' ').toLowerCase();
    return (!query || haystack.includes(query)) && (status === 'All' || n.status === status);
  });
  tableBody.innerHTML = filtered.map((n, index) => `
    <tr>
      <td><div class="event-cell"><div class="event-symbol symbol-${index % 5}">${symbols[n.category] || '✦'}</div><div><div class="event-title">${escapeHtml(n.event_title)}</div><div class="event-category">${escapeHtml(n.category)} · ${escapeHtml(n.organizer)}</div></div></div></td>
      <td><div class="date-main">${escapeHtml(formatDate(n.event_date))}</div><div class="date-sub">⌖ ${escapeHtml(n.venue)}</div></td>
      <td><span class="status-badge ${statusClass[n.status] || 'status-upcoming'}">${escapeHtml(n.status)}</span></td>
      <td><div class="actions"><button class="action-btn" title="Edit notice" aria-label="Edit ${escapeHtml(n.event_title)}" data-action="edit" data-id="${n.id}">✎</button><button class="action-btn delete" title="Delete notice" aria-label="Delete ${escapeHtml(n.event_title)}" data-action="delete" data-id="${n.id}">⌫</button></div></td>
    </tr>`).join('');
  emptyState.classList.toggle('hidden', filtered.length !== 0);
  document.getElementById('table-summary').textContent = `Showing ${filtered.length} of ${notices.length} notices`;
}

function resetForm() {
  form.reset(); document.getElementById('notice-id').value = '';
  document.getElementById('form-heading').textContent = 'Create a notice';
  document.getElementById('save-button').innerHTML = 'Publish notice <span>↗</span>';
  document.getElementById('cancel-edit').classList.add('hidden');
  document.getElementById('status').value = 'Upcoming'; clearFormMessage();
}

form.addEventListener('submit', async event => {
  event.preventDefault(); clearFormMessage();
  const id = document.getElementById('notice-id').value;
  const payload = {
    event_title: document.getElementById('event_title').value.trim(),
    category: document.getElementById('category').value,
    description: document.getElementById('description').value.trim(),
    venue: document.getElementById('venue').value.trim(),
    event_date: document.getElementById('event_date').value,
    organizer: document.getElementById('organizer').value.trim(),
    status: document.getElementById('status').value
  };
  const button = document.getElementById('save-button'); button.disabled = true;
  try {
    const result = await apiRequest(id ? `${API_URL}/${id}` : API_URL, { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    showFormMessage(result.message || 'Saved successfully.', 'success'); showToast(result.message || 'Notice saved.');
    resetForm(); await loadNotices();
  } catch (error) { showFormMessage(error.message, 'error'); showToast(error.message, true); }
  finally { button.disabled = false; }
});

document.getElementById('cancel-edit').addEventListener('click', resetForm);
document.getElementById('refresh-button').addEventListener('click', loadNotices);
document.getElementById('search-input').addEventListener('input', renderNotices);
document.getElementById('status-filter').addEventListener('change', renderNotices);

tableBody.addEventListener('click', async event => {
  const button = event.target.closest('button[data-action]'); if (!button) return;
  const id = Number(button.dataset.id); const action = button.dataset.action;
  const notice = notices.find(n => n.id === id); if (!notice) return;
  if (action === 'edit') {
    document.getElementById('notice-id').value = notice.id;
    for (const field of ['event_title', 'category', 'description', 'venue', 'event_date', 'organizer', 'status']) document.getElementById(field).value = notice[field] || '';
    document.getElementById('form-heading').textContent = 'Edit notice';
    document.getElementById('save-button').innerHTML = 'Save changes <span>✓</span>';
    document.getElementById('cancel-edit').classList.remove('hidden');
    showFormMessage(`Editing “${notice.event_title}”. Update the fields and save.`, 'success');
    document.getElementById('notice-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else if (action === 'delete') {
    if (!window.confirm(`Delete “${notice.event_title}”? This cannot be undone.`)) return;
    try {
      const result = await apiRequest(`${API_URL}/${id}`, { method: 'DELETE' });
      showToast(result.message || 'Notice deleted.');
      if (document.getElementById('notice-id').value === String(id)) resetForm();
      await loadNotices();
    } catch (error) { showToast(error.message, true); }
  }
});

loadNotices();
