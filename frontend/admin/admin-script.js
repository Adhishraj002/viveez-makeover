document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");
  const loginBtn = document.getElementById("loginBtn");
  const btnText = loginBtn.querySelector(".btn-text");
  const btnLoader = loginBtn.querySelector(".btn-loader");

  // Check if already logged in
  const token = localStorage.getItem("adminToken");
  if (token) {
    // Verify token is still valid by trying to access dashboard
    window.location.href = "/dashboard";
    return;
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add("show");
    setTimeout(() => {
      errorMessage.classList.remove("show");
    }, 5000);
  }

  function setLoading(loading) {
    if (loading) {
      loginBtn.disabled = true;
      btnText.style.opacity = "0.7";
      btnLoader.style.display = "inline-block";
    } else {
      loginBtn.disabled = false;
      btnText.style.opacity = "1";
      btnLoader.style.display = "none";
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
      showError("Please enter both username and password");
      return;
    }

    setLoading(true);

    try {
      const API_BASE = "https://viveez-makeover.onrender.com";
      fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Store token in localStorage
        localStorage.setItem("adminToken", data.token);
        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        showError(data.message || "Invalid username or password");
        setLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      showError("Network error. Please check if the server is running.");
      setLoading(false);
    }
  });

  // Add input animations
  const inputs = form.querySelectorAll("input");
  inputs.forEach((input) => {
    input.addEventListener("focus", function() {
      this.parentElement.style.transform = "scale(1.02)";
    });

    input.addEventListener("blur", function() {
      this.parentElement.style.transform = "scale(1)";
    });
  });
});

