async function postRequest(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return { ok: response.ok, data };
}

function showError(error) {
  document.getElementById("authError").textContent = error;
}

async function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const result = await postRequest("/register", { username, password });
  if (result.ok) {
    window.location.reload();
  } else {
    showError("Failed to register");
  }
}
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const result = await postRequest("/login", { username, password });
  if (result.ok) {
    window.sessionStorage.setItem("token", result.data.token);
    window.sessionStorage.setItem("username", username);
    window.location.pathname = "/chat";
  } else {
    showError("Failed to log in");
  }
}

document.getElementById("loginButton").addEventListener("click", login);
document.getElementById("registerButton").addEventListener("click", register);
