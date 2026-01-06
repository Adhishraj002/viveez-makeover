document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("setupForm");
  const errorMessage = document.getElementById("errorMessage");
  const successMessage = document.getElementById("successMessage");
  const setupBtn = document.getElementById("setupBtn");
  const btnText = setupBtn.querySelector(".btn-text");
  const btnLoader = setupBtn.querySelector(".btn-loader");

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add("show");
    successMessage.classList.remove("show");
    setTimeout(() => {
      errorMessage.classList.remove("show");
    }, 5000);
  }

  function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.add("show");
    errorMessage.classList.remove("show");
  }

  function setLoading(loading) {
    if (loading) {
      setupBtn.disabled = true;
      btnText.style.opacity = "0.7";
      btnLoader.style.display = "inline-block";
    } else {
      setupBtn.disabled = false;
      btnText.style.opacity = "1";
      btnLoader.style.display = "none";
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Validation
    if (!username || !password || !confirmPassword) {
      showError("Please fill in all fields");
      return;
    }

    if (username.length < 3) {
      showError("Username must be at least 3 characters long");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("Admin account created successfully! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/admin";
        }, 2000);
      } else {
        showError(data.message || "Failed to create admin account");
        setLoading(false);
      }
    } catch (error) {
      console.error("Setup error:", error);
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

