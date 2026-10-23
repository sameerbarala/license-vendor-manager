const API_BASE = ["3000", "5500", "5501"].includes(window.location.port)
  ? "http://localhost:8080"
  : "";
const LOGIN_URL = API_BASE + "/api/auth/login";

const form = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const errorMessage = document.getElementById("login-error");
const loginBtn = document.getElementById("login-btn");

// Already logged in? Skip the form.
if (localStorage.getItem("lm_token")) {
  window.location.href = "index.html";
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.hidden = true;

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (username === "" || password === "") {
    showError("Please enter your username and password.");
    return;
  }

  loginBtn.disabled = true;
  try {
    // Plain fetch, not authFetch: there is no token yet, and a wrong password
    // also returns 401, which must show a message instead of redirecting.
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, password: password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      showError(data.message || "Login failed (status " + response.status + ").");
      return;
    }

    localStorage.setItem("lm_token", data.token);
    localStorage.setItem("lm_user", data.username);
    localStorage.setItem("lm_role", data.role);
    window.location.href = "index.html";
  } catch (err) {
    showError("Cannot reach the server. Is the backend running on port 8080?");
  } finally {
    loginBtn.disabled = false;
  }
});