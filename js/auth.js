// Shared by every page except login. Must load BEFORE the page's own script.
const TOKEN_KEY = "lm_token";
const USER_KEY = "lm_user";
const ROLE_KEY = "lm_role";
// Live Server (5500/5501) and the old dev nginx (3000) talk to the backend on 8080.
// Anywhere else (production, or the Caddy setup below) the API is on the same address as the page.
const API_BASE = ["3000", "5500", "5501"].includes(window.location.port)
  ? "http://localhost:8080"
  : "";

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (err) {
    return null;
  }
}

function getRole() {
  try {
    return localStorage.getItem(ROLE_KEY);
  } catch (err) {
    return null;
  }
}

function isAdmin() {
  return getRole() === "ADMIN";
}

function logout() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
  } catch (err) {
    // ignore
  }
  window.location.href = "login.html";
}

// Same as fetch(), but adds the Authorization header.
// 401 = token missing, fake or expired, or the user was deleted -> back to login.
async function authFetch(url, options) {
  const opts = options || {};
  opts.headers = Object.assign({}, opts.headers, {
    Authorization: "Bearer " + getToken(),
  });

  const response = await fetch(url, opts);
  if (response.status === 401) {
    logout();
  }
  return response;
}

// One helper for the newer pages: sends JSON, returns parsed JSON (or null for 204),
// and throws an Error with a readable message when something goes wrong.
async function apiCall(method, url, body) {
  const options = { method: method, headers: {} };
  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await authFetch(url, options);
  } catch (err) {
    throw new Error("Cannot reach the server. Is the backend running on port 8080?");
  }

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("You do not have permission to do this.");
    }
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

function setupNav() {
  // CSS hides everything marked "admin-only" while this class is on <body>.
  if (!isAdmin()) {
    document.body.classList.add("viewer");
  }

  const nav = document.querySelector(".topbar nav");
  if (!nav) return;

  function addLink(text, href, onClick) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    if (onClick) {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        onClick();
      });
    }
    nav.appendChild(link);
  }

  if (isAdmin()) addLink("Users", "users.html");
  addLink("Account", "account.html");
  const name = localStorage.getItem(USER_KEY) || "user";
  addLink("Logout (" + name + ", " + getRole() + ")", "#", logout);

  // Underline the link of the page we are on.
  const page = window.location.pathname.split("/").pop() || "index.html";
  nav.querySelectorAll("a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === page);
  });
}

// ---- Runs as soon as the file loads ----
// Logged in before roles existed (no role saved)? Log in again once to get one.
if (!getToken() || !getRole()) {
  window.location.href = "login.html";
} else {
  setupNav();
}