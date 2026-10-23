// ---------- 1. Settings ----------
const LICENSES_URL = API_BASE + "/api/licenses";
const VENDORS_URL = API_BASE + "/api/vendors";
const EXPIRING_SOON_DAYS = 30;

// ---------- 2. Grab elements ----------
const apiError = document.getElementById("api-error");
const statVendors = document.getElementById("stat-vendors");
const statVendorsSub = document.getElementById("stat-vendors-sub");
const statLicenses = document.getElementById("stat-licenses");
const statLicensesSub = document.getElementById("stat-licenses-sub");
const statSeats = document.getElementById("stat-seats");
const statCost = document.getElementById("stat-cost");

const attentionEmpty = document.getElementById("attention-empty");
const attentionTable = document.getElementById("attention-table");
const attentionBody = document.getElementById("attention-body");

const costEmpty = document.getElementById("cost-empty");
const costBars = document.getElementById("cost-bars");

// ---------- 3. Talking to the API ----------
async function apiGet(url) {
  let response;
  try {
    response = await authFetch(url);
  } catch (err) {
    throw new Error("Cannot reach the server. Is the backend running on port 8080?");
  }
  if (!response.ok) {
    throw new Error("Request failed (status " + response.status + ").");
  }
  return response.json();
}

async function loadDashboard() {
  try {
    // Both requests run at the same time.
    const results = await Promise.all([apiGet(VENDORS_URL), apiGet(LICENSES_URL)]);
    apiError.hidden = true;
    render(results[0], results[1]);
  } catch (err) {
    apiError.textContent = err.message;
    apiError.hidden = false;
  }
}

// ---------- 4. Dates and expiry status ----------
// Same logic as licenses.js. We copy it for now; sharing it between pages comes later.
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

function formatNumber(value, decimals) {
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ---------- 5. Rendering ----------
function render(vendors, licenses) {
  renderStats(vendors, licenses);
  renderAttention(licenses);
  renderCostByVendor(licenses);
}

function renderStats(vendors, licenses) {
  const activeVendors = vendors.filter((v) => v.status === "Active").length;
  const totalSeats = licenses.reduce((sum, l) => sum + l.seats, 0);
  const totalCost = licenses.reduce((sum, l) => sum + Number(l.cost), 0);

  let soon = 0;
  let expired = 0;
  licenses.forEach((l) => {
    const status = getExpiryInfo(l).status;
    if (status === "soon") soon++;
    if (status === "expired") expired++;
  });

  statVendors.textContent = vendors.length;
  statVendorsSub.textContent = activeVendors + " active";

  statLicenses.textContent = licenses.length;
  statLicensesSub.textContent = soon + " expiring soon, " + expired + " expired";

  statSeats.textContent = formatNumber(totalSeats, 0);
  statCost.textContent = formatNumber(totalCost, 2);
}

function renderAttention(licenses) {
  // Keep only licenses that are expired or expiring soon, then sort by date.
  const needAttention = licenses
    .filter((l) => {
      const status = getExpiryInfo(l).status;
      return status === "soon" || status === "expired";
    })
    .sort((a, b) => parseDate(a.expiryDate) - parseDate(b.expiryDate));

  attentionBody.innerHTML = "";
  const hasRows = needAttention.length > 0;
  attentionEmpty.hidden = hasRows;
  attentionTable.hidden = !hasRows;

  needAttention.forEach((license) => {
    const row = document.createElement("tr");

    [license.name, license.vendor.name, formatDate(license.expiryDate)].forEach((text) => {
      const cell = document.createElement("td");
      cell.textContent = text; // textContent keeps user input safe
      row.appendChild(cell);
    });

    const info = getExpiryInfo(license);
    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.textContent = info.label;
    badge.className = "badge " + info.badgeClass;
    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    attentionBody.appendChild(row);
  });
}

function renderCostByVendor(licenses) {
  // Add up cost per vendor id.
  const totals = new Map();
  licenses.forEach((l) => {
    const entry = totals.get(l.vendor.id) || { name: l.vendor.name, cost: 0 };
    entry.cost += Number(l.cost);
    totals.set(l.vendor.id, entry);
  });

  const top = Array.from(totals.values())
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  costBars.innerHTML = "";
  costEmpty.hidden = top.length > 0;
  if (top.length === 0) return;

  const maxCost = top[0].cost; // the largest, used as 100% bar width

  top.forEach((vendor) => {
    const row = document.createElement("div");
    row.className = "bar-row";

    const label = document.createElement("div");
    label.className = "bar-label";
    label.textContent = vendor.name;

    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    // A vendor whose licenses are all free (cost 0) gets an empty bar.
    fill.style.width = (maxCost > 0 ? (vendor.cost / maxCost) * 100 : 0) + "%";
    track.appendChild(fill);

    const value = document.createElement("div");
    value.className = "bar-value";
    value.textContent = formatNumber(vendor.cost, 2);

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);
    costBars.appendChild(row);
  });
}

// ---------- 6. First load ----------
loadDashboard();