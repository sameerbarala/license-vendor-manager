// ---------- 1. Settings and state ----------
const LICENSES_URL = "http://localhost:8080/api/licenses";
const VENDORS_URL = "http://localhost:8080/api/vendors";
const EXPIRING_SOON_DAYS = 30;

// Both arrays are copies of what the server returned. The server is the source of truth.
let licenses = [];
let vendors = [];

// null = "add" mode, a number = editing the license with that id
let editingId = null;

// ---------- 2. Grab elements from the page ----------
const form = document.getElementById("license-form");
const formTitle = document.getElementById("form-title");
const nameInput = document.getElementById("license-name");
const vendorSelect = document.getElementById("license-vendor");
const vendorHint = document.getElementById("vendor-hint");
const typeSelect = document.getElementById("license-type");
const expiryInput = document.getElementById("license-expiry");
const seatsInput = document.getElementById("license-seats");
const costInput = document.getElementById("license-cost");
const errorMessage = document.getElementById("form-error");
const apiError = document.getElementById("api-error");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");

const searchInput = document.getElementById("search-input");
const typeFilter = document.getElementById("type-filter");
const summary = document.getElementById("summary");

const tableBody = document.getElementById("license-table-body");
const table = document.getElementById("license-table");
const emptyMessage = document.getElementById("empty-message");
const countLabel = document.getElementById("license-count");

// ---------- 3. Talking to the API ----------
async function apiRequest(method, url, body) {
  const options = { method: method, headers: {} };
  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    throw new Error("Cannot reach the server. Is the backend running on port 8080?");
  }

  if (!response.ok) {
    let message = "Request failed (status " + response.status + ").";
    try {
      const data = await response.json();
      if (data.message) message = data.message;
    } catch (err) {
      // body wasn't JSON, keep the default message
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

// Loads vendors (for the dropdown) and licenses (for the table) at the same time.
async function loadData() {
  try {
    const results = await Promise.all([
      apiRequest("GET", VENDORS_URL),
      apiRequest("GET", LICENSES_URL),
    ]);
    vendors = results[0];
    licenses = results[1];
    hideApiError();
  } catch (err) {
    showApiError(err.message);
  }
  fillVendorDropdown();
  renderLicenses();
}

// Reloads only the licenses (used after add, edit and delete).
async function loadLicenses() {
  try {
    licenses = await apiRequest("GET", LICENSES_URL);
    hideApiError();
  } catch (err) {
    showApiError(err.message);
  }
  renderLicenses();
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

// ---------- 5. Vendor dropdown ----------
function fillVendorDropdown() {
  vendorSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a vendor";
  vendorSelect.appendChild(placeholder);

  vendors.forEach((vendor) => {
    const option = document.createElement("option");
    option.value = String(vendor.id); // option values are always text
    option.textContent =
      vendor.status === "Inactive" ? vendor.name + " (Inactive)" : vendor.name;
    vendorSelect.appendChild(option);
  });

  const noVendors = vendors.length === 0;
  vendorHint.hidden = !noVendors;
  submitBtn.disabled = noVendors; // can't create a license without a vendor
}

// ---------- 6. Dates and expiry status ----------
// "2027-03-31" -> a Date at midnight in the user's own time zone.
function parseDate(text) {
  const parts = text.split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatDate(text) {
  return parseDate(text).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Returns { status, label, badgeClass } describing how close the license is to expiring.
function getExpiryInfo(license) {
  if (!license.expiryDate) {
    return { status: "none", label: "No expiry", badgeClass: "badge-inactive" };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((parseDate(license.expiryDate) - today) / 86400000);

  if (days < 0) {
    return { status: "expired", label: "Expired", badgeClass: "badge-expired" };
  }
  if (days <= EXPIRING_SOON_DAYS) {
    const label = days === 0 ? "Expires today" : "Expiring in " + days + " days";
    return { status: "soon", label: label, badgeClass: "badge-warning" };
  }
  return { status: "ok", label: "Active", badgeClass: "badge-active" };
}

function formatCost(cost) {
  return Number(cost).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ---------- 7. Validation (quick checks before calling the server) ----------
// Returns an error message, or "" if everything is fine.
function validateForm() {
  if (nameInput.value.trim() === "") {
    return "License name is required.";
  }
  if (vendorSelect.value === "") {
    return "Please select a vendor.";
  }

  const seats = Number(seatsInput.value);
  if (seatsInput.value === "" || !Number.isInteger(seats) || seats < 1) {
    return "Seats must be a whole number of at least 1.";
  }

  const cost = Number(costInput.value);
  if (costInput.value === "" || isNaN(cost) || cost < 0) {
    return "Cost must be 0 or more.";
  }

  if (typeSelect.value !== "Perpetual" && expiryInput.value === "") {
    return "Expiry date is required for Subscription and Trial licenses.";
  }
  return "";
}

// ---------- 8. Filtering and summary ----------
function getFilteredLicenses() {
  const searchText = searchInput.value.trim().toLowerCase();
  const typeValue = typeFilter.value;

  return licenses.filter((license) => {
    const matchesSearch =
      license.name.toLowerCase().includes(searchText) ||
      license.vendor.name.toLowerCase().includes(searchText);
    const matchesType = typeValue === "All" || license.licenseType === typeValue;
    return matchesSearch && matchesType;
  });
}

function updateSummary() {
  let soon = 0;
  let expired = 0;
  licenses.forEach((license) => {
    const status = getExpiryInfo(license).status;
    if (status === "soon") soon++;
    if (status === "expired") expired++;
  });

  const parts = [];
  if (soon > 0) parts.push(soon + " expiring within " + EXPIRING_SOON_DAYS + " days");
  if (expired > 0) parts.push(expired + " expired");

  summary.textContent = parts.join("  |  ");
  summary.hidden = parts.length === 0;
}

// ---------- 9. Rendering ----------
function renderLicenses() {
  const visible = getFilteredLicenses();

  tableBody.innerHTML = "";
  countLabel.textContent = licenses.length;
  updateSummary();

  if (licenses.length === 0) {
    emptyMessage.textContent = "No licenses yet. Add your first license above.";
  } else if (visible.length === 0) {
    emptyMessage.textContent = "No licenses match your search or filter.";
  }
  const hasRows = visible.length > 0;
  emptyMessage.hidden = hasRows;
  table.hidden = !hasRows;

  visible.forEach((license) => {
    const row = document.createElement("tr");

    // textContent (not innerHTML) keeps user input safe from script injection
    [
      license.name,
      license.vendor.name,
      license.licenseType,
      license.seats,
      formatCost(license.cost),
    ].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    // Expiry cell: the date (if any) plus a coloured status badge
    const expiryCell = document.createElement("td");
    const info = getExpiryInfo(license);
    if (license.expiryDate) {
      const dateText = document.createElement("div");
      dateText.textContent = formatDate(license.expiryDate);
      expiryCell.appendChild(dateText);
    }
    const badge = document.createElement("span");
    badge.textContent = info.label;
    badge.className = "badge " + info.badgeClass;
    expiryCell.appendChild(badge);
    row.appendChild(expiryCell);

    // Actions cell
    const actionCell = document.createElement("td");
    actionCell.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "btn btn-edit";
    editBtn.addEventListener("click", () => startEdit(license.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "btn btn-danger";
    deleteBtn.addEventListener("click", () => deleteLicense(license.id));

    actionCell.appendChild(editBtn);
    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);

    tableBody.appendChild(row);
  });
}

// ---------- 10. Form mode helpers ----------
// Perpetual licenses never expire, so the date box is switched off for them.
function updateExpiryState() {
  const isPerpetual = typeSelect.value === "Perpetual";
  expiryInput.disabled = isPerpetual;
  if (isPerpetual) {
    expiryInput.value = "";
  }
}

function resetFormState() {
  editingId = null;
  form.reset();
  updateExpiryState();
  clearError();
  formTitle.textContent = "Add License";
  submitBtn.textContent = "Add License";
  cancelBtn.hidden = true;
}

function startEdit(id) {
  const license = licenses.find((l) => l.id === id);
  if (!license) return;

  editingId = id;
  nameInput.value = license.name;
  vendorSelect.value = String(license.vendor.id);
  typeSelect.value = license.licenseType;
  seatsInput.value = license.seats;
  costInput.value = license.cost;
  expiryInput.value = license.expiryDate || "";
  updateExpiryState();

  clearError();
  formTitle.textContent = "Edit License";
  submitBtn.textContent = "Save Changes";
  cancelBtn.hidden = false;

  form.scrollIntoView({ behavior: "smooth" });
  nameInput.focus();
}

// ---------- 11. Actions ----------
async function deleteLicense(id) {
  const license = licenses.find((l) => l.id === id);
  if (!license) return;

  if (!confirm('Delete license "' + license.name + '"?')) return;

  try {
    await apiRequest("DELETE", LICENSES_URL + "/" + id);
    hideApiError();
    if (editingId === id) {
      resetFormState();
    }
  } catch (err) {
    showApiError(err.message);
  }
  await loadLicenses();
}

// ---------- 12. Event listeners ----------
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const error = validateForm();
  if (error !== "") {
    showError(error);
    return;
  }

  // This object becomes the JSON body. Its fields match LicenseRequest.java.
  const licenseData = {
    name: nameInput.value.trim(),
    licenseType: typeSelect.value,
    seats: Number(seatsInput.value),
    cost: Number(costInput.value),
    expiryDate: typeSelect.value === "Perpetual" ? null : expiryInput.value,
    vendorId: Number(vendorSelect.value),
  };

  submitBtn.disabled = true; // prevent double-clicks while waiting for the server
  try {
    if (editingId === null) {
      await apiRequest("POST", LICENSES_URL, licenseData);
    } else {
      await apiRequest("PUT", LICENSES_URL + "/" + editingId, licenseData);
    }
    hideApiError();
    resetFormState();
    await loadLicenses();
    nameInput.focus();
  } catch (err) {
    showError(err.message); // e.g. a validation message from Spring
  } finally {
    submitBtn.disabled = vendors.length === 0;
  }
});

cancelBtn.addEventListener("click", resetFormState);
typeSelect.addEventListener("change", updateExpiryState);
searchInput.addEventListener("input", renderLicenses);
typeFilter.addEventListener("change", renderLicenses);

// ---------- 13. First load ----------
updateExpiryState();
loadData();