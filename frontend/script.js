/**
 * script.js — Employee Management System Frontend
 * Plain ES6+ JavaScript, no frameworks.
 */

'use strict';

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api/employees';

// ─────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────
let currentSortBy  = 'id';
let currentOrder   = 'ASC';
let searchDebounce = null;
let pendingDeleteId = null;

// ─────────────────────────────────────────────────────────────
// DOM References
// ─────────────────────────────────────────────────────────────
const addForm         = document.getElementById('addEmployeeForm');
const editForm        = document.getElementById('editEmployeeForm');
const searchInput     = document.getElementById('searchInput');
const sortBySelect    = document.getElementById('sortBy');
const sortDirBtn      = document.getElementById('sortDirBtn');
const sortDirIcon     = document.getElementById('sortDirIcon');
const tableBody       = document.getElementById('tableBody');
const loader          = document.getElementById('loader');
const emptyState      = document.getElementById('emptyState');
const tableWrapper    = document.getElementById('tableWrapper');
const recordCount     = document.getElementById('recordCount');
const headerMeta      = document.getElementById('headerMeta');
const toggleFormBtn   = document.getElementById('toggleFormBtn');
const clearBtn        = document.getElementById('clearBtn');

// Edit modal
const editModalOverlay  = document.getElementById('editModalOverlay');
const editModalClose    = document.getElementById('editModalClose');
const cancelEditBtn     = document.getElementById('cancelEditBtn');

// Delete modal
const deleteModalOverlay  = document.getElementById('deleteModalOverlay');
const deleteModalClose    = document.getElementById('deleteModalClose');
const cancelDeleteBtn     = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn    = document.getElementById('confirmDeleteBtn');
const deleteConfirmText   = document.getElementById('deleteConfirmText');

// ─────────────────────────────────────────────────────────────
// Toast Notification
// ─────────────────────────────────────────────────────────────
let toastTimer = null;

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  toast.innerHTML = `<span class="toast__icon">${icons[type] || icons.info}</span><span>${message}</span>`;
  toast.className = `toast toast--${type} toast--show`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('toast--show');
  }, 4000);
}

// ─────────────────────────────────────────────────────────────
// Form Validation (client-side)
// ─────────────────────────────────────────────────────────────
const VALIDATORS = {
  name:       { required: true,  maxLen: 150, label: 'Full Name' },
  department: { required: true,  maxLen: 100, label: 'Department' },
  role:       { required: true,  maxLen: 100, label: 'Role' },
  salary:     { required: true,  numeric: true, minVal: 0, label: 'Salary' },
  joinDate:   { required: true,  isDate: true,  label: 'Join Date' },
};

function validateField(value, rules) {
  if (rules.required && (!value || value.toString().trim() === ''))
    return `${rules.label} is required.`;

  const trimmed = typeof value === 'string' ? value.trim() : value;

  if (rules.maxLen && trimmed.length > rules.maxLen)
    return `${rules.label} must be ${rules.maxLen} characters or fewer.`;

  if (rules.numeric) {
    const n = parseFloat(trimmed);
    if (isNaN(n)) return `${rules.label} must be a valid number.`;
    if (n < rules.minVal) return `${rules.label} must be 0 or greater.`;
  }

  if (rules.isDate) {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    if (!re.test(trimmed) || isNaN(new Date(trimmed).getTime()))
      return `${rules.label} must be a valid date.`;
  }

  return null;
}

/**
 * Validates a form using field-id ↔ error-span-id pairs.
 * Returns true if valid, false if not.
 */
function validateForm(fieldMap) {
  let isValid = true;

  for (const [fieldId, errorId] of Object.entries(fieldMap)) {
    const el      = document.getElementById(fieldId);
    const errorEl = document.getElementById(errorId);
    const rules   = VALIDATORS[fieldId.replace('edit', '').replace(/^./, c => c.toLowerCase())];
    if (!rules || !el || !errorEl) continue;

    const msg = validateField(el.value, rules);
    if (msg) {
      errorEl.textContent = msg;
      el.classList.add('is-invalid');
      isValid = false;
    } else {
      errorEl.textContent = '';
      el.classList.remove('is-invalid');
    }
  }
  return isValid;
}

function clearFormErrors(fieldMap) {
  for (const [fieldId, errorId] of Object.entries(fieldMap)) {
    const el      = document.getElementById(fieldId);
    const errorEl = document.getElementById(errorId);
    if (el)      el.classList.remove('is-invalid');
    if (errorEl) errorEl.textContent = '';
  }
}

const ADD_FIELDS = {
  name:       'nameError',
  department: 'departmentError',
  role:       'roleError',
  salary:     'salaryError',
  joinDate:   'joinDateError',
};

const EDIT_FIELDS = {
  editName:       'editNameError',
  editDepartment: 'editDepartmentError',
  editRole:       'editRoleError',
  editSalary:     'editSalaryError',
  editJoinDate:   'editJoinDateError',
};

// ─────────────────────────────────────────────────────────────
// API Helpers
// ─────────────────────────────────────────────────────────────
async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    const msg = data.errors
      ? data.errors.join(' ')
      : (data.message || `HTTP ${response.status}`);
    throw new Error(msg);
  }

  return data;
}

// ─────────────────────────────────────────────────────────────
// Helpers — Formatting
// ─────────────────────────────────────────────────────────────
function formatSalary(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  // dateStr from MySQL might be ISO (2021-03-15T00:00:00.000Z)
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC',
  }).format(d);
}

function toInputDate(dateStr) {
  // Returns YYYY-MM-DD suitable for <input type="date">
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const y  = d.getUTCFullYear();
  const m  = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dy = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dy}`;
}

function getDeptClass(dept) {
  const map = {
    engineering: 'dept-engineering',
    'human resources': 'dept-hr',
    hr: 'dept-hr',
    finance: 'dept-finance',
    marketing: 'dept-marketing',
    sales: 'dept-sales',
    operations: 'dept-operations',
  };
  return map[(dept || '').toLowerCase()] || 'dept-default';
}

// ─────────────────────────────────────────────────────────────
// Render Table
// ─────────────────────────────────────────────────────────────
function renderTable(employees) {
  tableBody.innerHTML = '';

  const count = employees.length;
  recordCount.textContent = `${count} record${count !== 1 ? 's' : ''}`;
  updateHeaderStats(count);

  if (count === 0) {
    loader.hidden      = true;
    emptyState.hidden  = false;
    tableWrapper.hidden = true;
    return;
  }

  emptyState.hidden  = true;
  tableWrapper.hidden = false;
  loader.hidden      = true;

  const fragment = document.createDocumentFragment();

  employees.forEach(emp => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', emp.id);

    tr.innerHTML = `
      <td><span class="id-chip">#${emp.id}</span></td>
      <td><span class="employee-name">${escapeHtml(emp.name)}</span></td>
      <td><span class="dept-pill ${getDeptClass(emp.department)}">${escapeHtml(emp.department)}</span></td>
      <td>${escapeHtml(emp.role)}</td>
      <td><span class="salary-cell">${formatSalary(emp.salary)}</span></td>
      <td>${formatDate(emp.join_date)}</td>
      <td>
        <div class="action-cell">
          <button
            class="btn btn--edit btn--sm"
            data-action="edit"
            data-id="${emp.id}"
            aria-label="Edit ${escapeHtml(emp.name)}"
          >✏️ Edit</button>
          <button
            class="btn btn--delete btn--sm"
            data-action="delete"
            data-id="${emp.id}"
            data-name="${escapeHtml(emp.name)}"
            aria-label="Delete ${escapeHtml(emp.name)}"
          >🗑️ Delete</button>
        </div>
      </td>
    `;
    fragment.appendChild(tr);
  });

  tableBody.appendChild(fragment);
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function updateHeaderStats(count) {
  headerMeta.innerHTML = `
    <div class="header__stat">
      <span class="header__stat-label">Total Employees</span>
      <span class="header__stat-value">${count}</span>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────
// Fetch & Render Employees
// ─────────────────────────────────────────────────────────────
async function loadEmployees() {
  loader.hidden      = false;
  emptyState.hidden  = true;
  tableWrapper.hidden = true;

  const search = searchInput.value.trim();
  const params = new URLSearchParams({
    sortBy: currentSortBy,
    order:  currentOrder,
    ...(search ? { search } : {}),
  });

  try {
    const data = await apiFetch(`${API_BASE}?${params}`);
    renderTable(data.data || []);
  } catch (err) {
    loader.hidden = true;
    showToast(`Failed to load employees: ${err.message}`, 'error');
    console.error(err);
  }
}

// ─────────────────────────────────────────────────────────────
// Add Employee
// ─────────────────────────────────────────────────────────────
addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFormErrors(ADD_FIELDS);

  if (!validateForm(ADD_FIELDS)) return;

  const addBtn = document.getElementById('addBtn');
  addBtn.disabled = true;
  addBtn.innerHTML = '<span class="btn__icon">⏳</span> Adding…';

  const payload = {
    name:       document.getElementById('name').value.trim(),
    department: document.getElementById('department').value.trim(),
    role:       document.getElementById('role').value.trim(),
    salary:     parseFloat(document.getElementById('salary').value),
    join_date:  document.getElementById('joinDate').value,
  };

  try {
    await apiFetch(API_BASE, { method: 'POST', body: JSON.stringify(payload) });
    showToast(`Employee "${payload.name}" added successfully!`, 'success');
    addForm.reset();
    clearFormErrors(ADD_FIELDS);
    await loadEmployees();
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    addBtn.disabled = false;
    addBtn.innerHTML = '<span class="btn__icon">➕</span> Add Employee';
  }
});

// Clear form button
clearBtn.addEventListener('click', () => {
  addForm.reset();
  clearFormErrors(ADD_FIELDS);
});

// Toggle add form
toggleFormBtn.addEventListener('click', () => {
  const expanded = toggleFormBtn.getAttribute('aria-expanded') === 'true';
  const form     = document.getElementById('addEmployeeForm');
  form.hidden    = expanded;
  toggleFormBtn.textContent      = expanded ? 'Expand' : 'Collapse';
  toggleFormBtn.setAttribute('aria-expanded', String(!expanded));
});

// ─────────────────────────────────────────────────────────────
// Edit Employee — open modal
// ─────────────────────────────────────────────────────────────
async function openEditModal(id) {
  clearFormErrors(EDIT_FIELDS);

  try {
    const data = await apiFetch(`${API_BASE}/${id}`);
    const emp  = data.data;

    document.getElementById('editId').value         = emp.id;
    document.getElementById('editName').value        = emp.name;
    document.getElementById('editDepartment').value  = emp.department;
    document.getElementById('editRole').value        = emp.role;
    document.getElementById('editSalary').value      = emp.salary;
    document.getElementById('editJoinDate').value    = toInputDate(emp.join_date);

    editModalOverlay.hidden = false;
    document.getElementById('editName').focus();
  } catch (err) {
    showToast(`Could not load employee data: ${err.message}`, 'error');
  }
}

function closeEditModal() {
  editModalOverlay.hidden = true;
  editForm.reset();
  clearFormErrors(EDIT_FIELDS);
}

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFormErrors(EDIT_FIELDS);

  if (!validateForm(EDIT_FIELDS)) return;

  const id      = document.getElementById('editId').value;
  const saveBtn = document.getElementById('saveEditBtn');

  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="btn__icon">⏳</span> Saving…';

  const payload = {
    name:       document.getElementById('editName').value.trim(),
    department: document.getElementById('editDepartment').value.trim(),
    role:       document.getElementById('editRole').value.trim(),
    salary:     parseFloat(document.getElementById('editSalary').value),
    join_date:  document.getElementById('editJoinDate').value,
  };

  try {
    const data = await apiFetch(`${API_BASE}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast(`Employee "${data.data.name}" updated successfully!`, 'success');
    closeEditModal();
    await loadEmployees();
  } catch (err) {
    showToast(`Update failed: ${err.message}`, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span class="btn__icon">💾</span> Save Changes';
  }
});

editModalClose.addEventListener('click',  closeEditModal);
cancelEditBtn.addEventListener('click',   closeEditModal);

// Close on overlay click
editModalOverlay.addEventListener('click', (e) => {
  if (e.target === editModalOverlay) closeEditModal();
});

// ─────────────────────────────────────────────────────────────
// Delete Employee — confirmation modal
// ─────────────────────────────────────────────────────────────
function openDeleteModal(id, name) {
  pendingDeleteId = id;
  deleteConfirmText.textContent =
    `Are you sure you want to delete "${name}" (ID: ${id})? This action cannot be undone.`;
  deleteModalOverlay.hidden = false;
  confirmDeleteBtn.focus();
}

function closeDeleteModal() {
  deleteModalOverlay.hidden = true;
  pendingDeleteId = null;
}

confirmDeleteBtn.addEventListener('click', async () => {
  if (!pendingDeleteId) return;

  confirmDeleteBtn.disabled = true;
  confirmDeleteBtn.innerHTML = '<span class="btn__icon">⏳</span> Deleting…';

  try {
    const data = await apiFetch(`${API_BASE}/${pendingDeleteId}`, { method: 'DELETE' });
    showToast(data.message || 'Employee deleted.', 'success');
    closeDeleteModal();
    await loadEmployees();
  } catch (err) {
    showToast(`Delete failed: ${err.message}`, 'error');
    closeDeleteModal();
  } finally {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.innerHTML = '<span class="btn__icon">🗑️</span> Yes, Delete';
  }
});

deleteModalClose.addEventListener('click',  closeDeleteModal);
cancelDeleteBtn.addEventListener('click',   closeDeleteModal);

deleteModalOverlay.addEventListener('click', (e) => {
  if (e.target === deleteModalOverlay) closeDeleteModal();
});

// ─────────────────────────────────────────────────────────────
// Table — delegated click handler (Edit / Delete buttons)
// ─────────────────────────────────────────────────────────────
tableBody.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const { action, id, name } = btn.dataset;

  if (action === 'edit')   openEditModal(id);
  if (action === 'delete') openDeleteModal(id, name);
});

// ─────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────
searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(loadEmployees, 350);
});

// ─────────────────────────────────────────────────────────────
// Sort
// ─────────────────────────────────────────────────────────────
sortBySelect.addEventListener('change', () => {
  currentSortBy = sortBySelect.value;
  loadEmployees();
});

sortDirBtn.addEventListener('click', () => {
  currentOrder   = currentOrder === 'ASC' ? 'DESC' : 'ASC';
  sortDirIcon.textContent = currentOrder === 'ASC' ? '↑ ASC' : '↓ DESC';
  loadEmployees();
});

// ─────────────────────────────────────────────────────────────
// Keyboard — close modals with Escape
// ─────────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!editModalOverlay.hidden)   closeEditModal();
  if (!deleteModalOverlay.hidden) closeDeleteModal();
});

// ─────────────────────────────────────────────────────────────
// Initialise
// ─────────────────────────────────────────────────────────────
(function init() {
  loadEmployees();
})();
