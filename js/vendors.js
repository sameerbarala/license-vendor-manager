// ---------- 1. Settings and state ----------
const API_URL = API_BASE + "/api/vendors";

// vendors is now just a copy of what the server returned.
// The server is the source of truth, not this array.
let vendors = [];

// null = "add" mode, a number = editing the vendor with that id
let editingId = null;

// ---------- 2. Grab elements from the page ----------
const form = document.getElementById("vendor-form");
const formTitle = document.getElementById("form-title");
const nameInput = document.getElementById("vendor-name");
const emailInput = document.getElementById("vendor-email");
const categorySelect = document.getElementById("vendor-category");
const statusSelect = document.getElementById("vendor-status");
const errorMessage = document.getElementById("form-error");
const apiError = document.getElementById("api-error");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");

const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");

const tableBody = document.getElementById("vendor-table-body");
const table = document.getElementById("vendor-table");
const emptyMessage = document.getElementById("empty-message");
const countLabel = document.getElementById("vendor-count");

// ---------- 3. Talking to the API ----------
// One helper for every request. "async/await" lets us write code that waits
// for the server's answer without freezing the page.
async function apiRequest(method, url, body) {
  const options = { method: method, headers: {} };
  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body); // object -> JSON text
  }

  let response;
  try {
    response = await authFetch(url, options);
  } catch (err) {
    // fetch only throws when the server can't be reached at all
    throw new Error("Cannot reach the server. Is the backend running on port 8080?");
  }

  if (!response.ok) {
    if (response.status === 403) throw new Error("You do not have permission to do this.");
    // Our Spring code puts a readable "message" in the JSON of error responses
    let message = "Request failed (status " + response.status + ").";
    try {
      const data = await response.json();
      if (data.message) message = data.message;
    } catch (err) {
      // body wasn't JSON, keep the default message
    }
    throw new Error(message);
  }

  if (response.status === 204) return null; // 204 = success with no body (delete)
  return response.json(); // JSON text -> JavaScript object
}

async function loadVendors() {
  try {
    vendors = await apiRequest("GET", API_URL);
  } catch (err) {
    showApiError(err.message);
  }
  renderVendors();
}

// ---------- 4. Messages ----------
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.hidden = true;
}

function showApiError(message) {
  apiError.textContent = message;
  apiError.hidden = false;
}

function hideApiError() {
  apiError.textContent = "";
  apiError.hidden = true;
}

// ---------- 5. Validation (quick checks before calling the server) ----------
function validateVendor(name, email, ignoreId) {
  if (name === "") {
    return "Vendor name is required.";
  }
  if (email === "") {
    return "Contact email is required.";
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return "Please enter a valid email address.";
  }
  const duplicate = vendors.some(
    (v) => v.id !== ignoreId && v.name.toLowerCase() === name.toLowerCase()
  );
  if (duplicate) {
    return "A vendor with this name already exists.";
  }
  return "";
}

// ---------- 6. Filtering ----------
function getFilteredVendors() {
  const searchText = searchInput.value.trim().toLowerCase();
  const statusValue = statusFilter.value;

  return vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchText) ||
      vendor.email.toLowerCase().includes(searchText);
    const matchesStatus = statusValue === "All" || vendor.status === statusValue;
    return matchesSearch && matchesStatus;
  });
}

// ---------- 7. Rendering ----------
function renderVendors() {
  const visibleVendors = getFilteredVendors();

  tableBody.innerHTML = "";
  countLabel.textContent = vendors.length;

  if (vendors.length === 0) {
    emptyMessage.textContent = "No vendors yet. Add your first vendor above.";
  } else if (visibleVendors.length === 0) {
    emptyMessage.textContent = "No vendors match your search or filter.";
  }
  const hasRows = visibleVendors.length > 0;
  emptyMessage.hidden = hasRows;
  table.hidden = !hasRows;

  visibleVendors.forEach((vendor) => {
    const row = document.createElement("tr");

    [vendor.name, vendor.email, vendor.category].forEach((text) => {
      const cell = document.createElement("td");
      cell.textContent = text;
      row.appendChild(cell);
    });

    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.textContent = vendor.status;
    badge.className =
      "badge " + (vendor.status === "Active" ? "badge-active" : "badge-inactive");
    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    const actionCell = document.createElement("td");
    actionCell.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "btn btn-edit";
    editBtn.addEventListener("click", () => startEdit(vendor.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "btn btn-danger";
    deleteBtn.addEventListener("click", () => deleteVendor(vendor.id));

    actionCell.appendChild(editBtn);
    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);

    tableBody.appendChild(row);
  });
}

// ---------- 8. Form mode helpers ----------
function resetFormState() {
  editingId = null;
  form.reset();
  clearError();
  formTitle.textContent = "Add Vendor";
  submitBtn.textContent = "Add Vendor";
  cancelBtn.hidden = true;
}

function startEdit(id) {
  const vendor = vendors.find((v) => v.id === id);
  if (!vendor) return;

  editingId = id;
  nameInput.value = vendor.name;
  emailInput.value = vendor.email;
  categorySelect.value = vendor.category;
  statusSelect.value = vendor.status;

  clearError();
  formTitle.textContent = "Edit Vendor";
  submitBtn.textContent = "Save Changes";
  cancelBtn.hidden = false;

  form.scrollIntoView({ behavior: "smooth" });
  nameInput.focus();
}

// ---------- 9. Actions (each one calls the API, then reloads the list) ----------
async function deleteVendor(id) {
  const vendor = vendors.find((v) => v.id === id);
  if (!vendor) return;

  if (!confirm('Delete vendor "' + vendor.name + '"?')) return;
  hideApiError();

  try {
    await apiRequest("DELETE", API_URL + "/" + id);
    hideApiError();
    if (editingId === id) {
      resetFormState();
    }
  } catch (err) {
    showApiError(err.message);
  }
  await loadVendors();
}

// ---------- 10. Event listeners ----------
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const vendorData = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    category: categorySelect.value,
    status: statusSelect.value,
  };

  const error = validateVendor(vendorData.name, vendorData.email, editingId);
  if (error !== "") {
    showError(error);
    return;
  }

  submitBtn.disabled = true; // prevent double-clicks while waiting for the server
  try {
    if (editingId === null) {
      await apiRequest("POST", API_URL, vendorData);
    } else {
      await apiRequest("PUT", API_URL + "/" + editingId, vendorData);
    }
    hideApiError();
    resetFormState();
    await loadVendors();
    nameInput.focus();
  } catch (err) {
    // Errors from the server (e.g. validation) show next to the form
    showError(err.message);
  } finally {
    submitBtn.disabled = false;
  }
});

cancelBtn.addEventListener("click", resetFormState);
searchInput.addEventListener("input", renderVendors);
statusFilter.addEventListener("change", renderVendors);

// ---------- 11. First load ----------
loadVendors();