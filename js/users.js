const USERS_URL = API_BASE + "/api/users";
const ME = localStorage.getItem(USER_KEY);

// Only admins belong here. (The server refuses everyone else anyway.)
if (!isAdmin()) {
  window.location.href = "index.html";
}

let users = [];
let resettingId = null;

const userForm = document.getElementById("user-form");
const usernameInput = document.getElementById("new-username");
const passwordInput = document.getElementById("new-user-password");
const roleSelect = document.getElementById("new-user-role");
const formError = document.getElementById("form-error");
const submitBtn = document.getElementById("submit-btn");

const resetCard = document.getElementById("reset-card");
const resetName = document.getElementById("reset-name");
const resetForm = document.getElementById("reset-form");
const resetPassword = document.getElementById("reset-password");
const resetError = document.getElementById("reset-error");

const apiError = document.getElementById("api-error");
const success = document.getElementById("success");
const tableBody = document.getElementById("user-table-body");
const countLabel = document.getElementById("user-count");

function showApiError(message) {
  success.hidden = true;
  apiError.textContent = message;
  apiError.hidden = false;
}

function showSuccess(message) {
  apiError.hidden = true;
  success.textContent = message;
  success.hidden = false;
}

function clearMessages() {
  apiError.hidden = true;
  success.hidden = true;
}

async function loadUsers() {
  try {
    users = await apiCall("GET", USERS_URL);
  } catch (err) {
    showApiError(err.message);
  }
  renderUsers();
}

function renderUsers() {
  tableBody.innerHTML = "";
  countLabel.textContent = users.length;

  users.forEach((user) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = user.username + (user.username === ME ? " (you)" : "");
    row.appendChild(nameCell);

    // Role dropdown: changing it saves immediately.
    const roleCell = document.createElement("td");
    const select = document.createElement("select");
    ["ADMIN", "VIEWER"].forEach((role) => {
      const option = document.createElement("option");
      option.value = role;
      option.textContent = role;
      select.appendChild(option);
    });
    select.value = user.role || "VIEWER";
    select.addEventListener("change", () => changeRole(user, select.value));
    roleCell.appendChild(select);
    row.appendChild(roleCell);

    const actionCell = document.createElement("td");
    actionCell.className = "actions";

    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset password";
    resetBtn.className = "btn btn-edit";
    resetBtn.addEventListener("click", () => startReset(user));
    actionCell.appendChild(resetBtn);

    // You cannot delete yourself, so the button isn't offered.
    if (user.username !== ME) {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.className = "btn btn-danger";
      deleteBtn.addEventListener("click", () => deleteUser(user));
      actionCell.appendChild(deleteBtn);
    }

    row.appendChild(actionCell);
    tableBody.appendChild(row);
  });
}

async function changeRole(user, role) {
  clearMessages();
  try {
    await apiCall("PUT", USERS_URL + "/" + user.id + "/role", { role: role });
    if (user.username === ME) {
      // Your own role changed, so the page must be rebuilt with the new role.
      logout();
      return;
    }
    showSuccess("Role of " + user.username + " is now " + role + ".");
  } catch (err) {
    showApiError(err.message); // e.g. "At least one admin must remain."
  }
  await loadUsers(); // also puts the dropdown back if the change was refused
}

async function deleteUser(user) {
  if (!confirm('Delete user "' + user.username + '"?')) return;
  clearMessages();
  try {
    await apiCall("DELETE", USERS_URL + "/" + user.id);
    if (resettingId === user.id) closeReset();
    showSuccess("User " + user.username + " deleted.");
  } catch (err) {
    showApiError(err.message);
  }
  await loadUsers();
}

// ---------- Add user ----------
function showFormError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.hidden = true;
  clearMessages();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (username.length < 3 || username.length > 50) {
    return showFormError("Username must be 3 to 50 characters.");
  }
  if (password.length < 8 || password.length > 72) {
    return showFormError("Password must be 8 to 72 characters.");
  }

  submitBtn.disabled = true;
  try {
    await apiCall("POST", USERS_URL, { username: username, password: password, role: roleSelect.value });
    userForm.reset();
    showSuccess("User " + username + " created.");
    await loadUsers();
  } catch (err) {
    showFormError(err.message); // e.g. duplicate username
  } finally {
    submitBtn.disabled = false;
  }
});

// ---------- Reset password ----------
function startReset(user) {
  resettingId = user.id;
  resetName.textContent = user.username;
  resetPassword.value = "";
  resetError.hidden = true;
  resetCard.hidden = false;
  resetCard.scrollIntoView({ behavior: "smooth" });
  resetPassword.focus();
}

function closeReset() {
  resettingId = null;
  resetCard.hidden = true;
  resetForm.reset();
}

resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  resetError.hidden = true;

  const password = resetPassword.value;
  if (password.length < 8 || password.length > 72) {
    resetError.textContent = "New password must be 8 to 72 characters.";
    resetError.hidden = false;
    return;
  }

  try {
    await apiCall("PUT", USERS_URL + "/" + resettingId + "/password", { newPassword: password });
    const name = resetName.textContent;
    closeReset();
    showSuccess("Password for " + name + " was reset.");
  } catch (err) {
    resetError.textContent = err.message;
    resetError.hidden = false;
  }
});

document.getElementById("reset-cancel").addEventListener("click", closeReset);

loadUsers();