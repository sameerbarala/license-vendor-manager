const form = document.getElementById("password-form");
const currentInput = document.getElementById("current-password");
const newInput = document.getElementById("new-password");
const confirmInput = document.getElementById("confirm-password");
const errorMessage = document.getElementById("form-error");
const successMessage = document.getElementById("form-success");
const submitBtn = document.getElementById("submit-btn");

document.getElementById("who").textContent = localStorage.getItem(USER_KEY) || "";
document.getElementById("my-role").textContent = getRole() || "";

function showError(message) {
  successMessage.hidden = true;
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.hidden = true;
  successMessage.hidden = true;

  const current = currentInput.value;
  const next = newInput.value;

  if (current === "") return showError("Current password is required.");
  if (next.length < 8 || next.length > 72) {
    return showError("New password must be 8 to 72 characters.");
  }
  if (next !== confirmInput.value) return showError("The new passwords do not match.");

  submitBtn.disabled = true;
  try {
    await apiCall("POST", API_BASE + "/api/auth/change-password", {
      currentPassword: current,
      newPassword: next,
    });
    form.reset();
    successMessage.textContent = "Password changed. Use the new one next time you sign in.";
    successMessage.hidden = false;
  } catch (err) {
    showError(err.message); // e.g. "Current password is incorrect."
  } finally {
    submitBtn.disabled = false;
  }
});