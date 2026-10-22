// Shared by every page except login. Must load BEFORE the page's own script.
const TOKEN_KEY = "lm_token";
const USER_KEY = "lm_user";

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (err) {
    return null;
  }
}

function saveLogin(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, username);
}

function logout() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    // ignore
  }
  window.location.href = "login.html";
}

// Same as fetch(), but adds the Authorization header.
// If the server says 401 (token missing, fake or expired), send the user to the login page.
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

// ---- Runs as soon as the file loads ----
// No token at all -> go to the login page right away.
if (!getToken()) {
  window.location.href = "login.html";
}

// Add a "Logout" link to the navigation bar.
const nav = document.querySelector(".topbar nav");
if (nav) {
  const link = document.createElement("a");
  link.href = "#";
  link.textContent = "Logout (" + (localStorage.getItem(USER_KEY) || "user") + ")";
  link.addEventListener("click", (event) => {
    event.preventDefault();
    logout();
  });
  nav.appendChild(link);
}