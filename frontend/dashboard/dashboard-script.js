document.addEventListener("DOMContentLoaded", () => {
  // Check authentication
  const token = localStorage.getItem("adminToken");
  if (!token) {
    window.location.href = "/admin";
    return;
  }

  // Elements
  const bookingsContainer = document.getElementById("bookingsContainer");
  const loadingState = document.getElementById("loadingState");
  const emptyState = document.getElementById("emptyState");
  const refreshBtn = document.getElementById("refreshBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const searchInput = document.getElementById("searchInput");
  const filterSelect = document.getElementById("filterSelect");
  const exportBtn = document.getElementById("exportBtn");
  const modal = document.getElementById("bookingModal");
  const modalClose = document.getElementById("modalClose");
  const modalBody = document.getElementById("modalBody");
  const navItems = document.querySelectorAll(".nav-item");

  let allBookings = [];
  let filteredBookings = [];

  // Navigation
  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");

      if (section === "bookings") {
        document.getElementById("bookingsSection").classList.add("active-section");
        document.getElementById("statsSection").style.display = "none";
      } else if (section === "stats") {
        document.getElementById("bookingsSection").classList.remove("active-section");
        document.getElementById("statsSection").style.display = "block";
      }
    });
  });

  // Logout
  logoutBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin";
    }
  });

  // Fetch bookings
  async function fetchBookings() {
    try {
      loadingState.style.display = "block";
      emptyState.style.display = "none";
      bookingsContainer.innerHTML = "";

      const response = await fetch("/api/admin/bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("adminToken");
        window.location.href = "/admin";
        return;
      }

      const data = await response.json();

      if (data.success) {
        allBookings = data.bookings || [];
        filteredBookings = [...allBookings];
        renderBookings();
        updateStats();
      } else {
        showError("Failed to load bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      showError("Network error. Please check your connection.");
    } finally {
      loadingState.style.display = "none";
    }
  }

  // Render bookings
  function renderBookings() {
    if (filteredBookings.length === 0) {
      emptyState.style.display = "block";
      bookingsContainer.innerHTML = "";
      return;
    }

    emptyState.style.display = "none";
    bookingsContainer.innerHTML = filteredBookings
      .map((booking, index) => {
        const date = booking.createdAt
          ? new Date(booking.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "N/A";
        const time = booking.createdAt
          ? new Date(booking.createdAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        return `
          <div class="booking-card fade-in-up" style="animation-delay: ${index * 0.05}s" data-booking-id="${booking._id}">
            <div class="booking-header">
              <h3 class="booking-name">${escapeHtml(booking.name || "N/A")}</h3>
              <div class="booking-date">
                <i class="fas fa-calendar"></i> ${date}<br>
                <small>${time}</small>
              </div>
            </div>
            <div class="booking-details">
              <div class="booking-detail">
                <i class="fas fa-phone"></i>
                <span><strong>Phone:</strong> ${escapeHtml(booking.phone || "N/A")}</span>
              </div>
              <div class="booking-detail">
                <i class="fas fa-envelope"></i>
                <span><strong>Email:</strong> ${escapeHtml(booking.email || "N/A")}</span>
              </div>
            </div>
            <div class="booking-event">
              <i class="fas fa-star"></i> ${escapeHtml(booking.eventType || "N/A")}
            </div>
            ${booking.date ? `<div class="booking-detail" style="margin-top: 8px;"><i class="fas fa-calendar-alt"></i> <span><strong>Event Date:</strong> ${escapeHtml(booking.date)}</span></div>` : ""}
            ${booking.message ? `<div class="booking-message">${escapeHtml(booking.message)}</div>` : ""}
          </div>
        `;
      })
      .join("");

    // Add click listeners to booking cards
    document.querySelectorAll(".booking-card").forEach((card) => {
      card.addEventListener("click", () => {
        const bookingId = card.dataset.bookingId;
        const booking = allBookings.find((b) => b._id === bookingId);
        if (booking) showBookingModal(booking);
      });
    });
  }

  // Show booking modal
  function showBookingModal(booking) {
    const date = booking.createdAt
      ? new Date(booking.createdAt).toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

    modalBody.innerHTML = `
      <h3>Booking Details</h3>
      <div class="modal-detail">
        <label>Name</label>
        <p>${escapeHtml(booking.name || "N/A")}</p>
      </div>
      <div class="modal-detail">
        <label>Phone</label>
        <p>${escapeHtml(booking.phone || "N/A")}</p>
      </div>
      <div class="modal-detail">
        <label>Email</label>
        <p>${escapeHtml(booking.email || "N/A")}</p>
      </div>
      <div class="modal-detail">
        <label>Event Type</label>
        <p>${escapeHtml(booking.eventType || "N/A")}</p>
      </div>
      ${booking.date ? `
      <div class="modal-detail">
        <label>Event Date</label>
        <p>${escapeHtml(booking.date)}</p>
      </div>
      ` : ""}
      ${booking.message ? `
      <div class="modal-detail">
        <label>Message</label>
        <p>${escapeHtml(booking.message)}</p>
      </div>
      ` : ""}
      <div class="modal-detail">
        <label>Booking Created</label>
        <p>${date}</p>
      </div>
    `;
    modal.classList.add("open");
  }

  // Close modal
  modalClose.addEventListener("click", () => {
    modal.classList.remove("open");
  });

  modal.querySelector(".modal-overlay").addEventListener("click", () => {
    modal.classList.remove("open");
  });

  // Update stats
  function updateStats() {
    const total = allBookings.length;
    document.getElementById("totalBookings").textContent = total;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = allBookings.filter((booking) => {
      if (!booking.createdAt) return false;
      const bookingDate = new Date(booking.createdAt);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate.getTime() === today.getTime();
    }).length;
    document.getElementById("todayBookings").textContent = todayCount;

    const uniqueCustomers = new Set(allBookings.map((b) => b.email || b.phone)).size;
    document.getElementById("totalCustomers").textContent = uniqueCustomers;

    // Popular event
    const eventCounts = {};
    allBookings.forEach((booking) => {
      const event = booking.eventType || "Unknown";
      eventCounts[event] = (eventCounts[event] || 0) + 1;
    });
    const popularEvent = Object.keys(eventCounts).reduce((a, b) =>
      eventCounts[a] > eventCounts[b] ? a : b,
      "N/A"
    );
    document.getElementById("popularEvent").textContent = popularEvent || "-";
  }

  // Search and filter
  function filterBookings() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;

    filteredBookings = allBookings.filter((booking) => {
      const matchesSearch =
        !searchTerm ||
        (booking.name && booking.name.toLowerCase().includes(searchTerm)) ||
        (booking.email && booking.email.toLowerCase().includes(searchTerm)) ||
        (booking.phone && booking.phone.includes(searchTerm)) ||
        (booking.eventType && booking.eventType.toLowerCase().includes(searchTerm));

      const matchesFilter = filterValue === "all" || booking.eventType === filterValue;

      return matchesSearch && matchesFilter;
    });

    renderBookings();
  }

  searchInput.addEventListener("input", filterBookings);
  filterSelect.addEventListener("change", filterBookings);

  // Refresh
  refreshBtn.addEventListener("click", () => {
    refreshBtn.classList.add("spinning");
    fetchBookings().finally(() => {
      setTimeout(() => refreshBtn.classList.remove("spinning"), 1000);
    });
  });

  // Export PDF
  exportBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/admin/bookings/pdf", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("adminToken");
        window.location.href = "/admin";
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookings-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export PDF. Please try again.");
    }
  });

  // Utility functions
  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function showError(message) {
    bookingsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }

  // Initial load
  fetchBookings();
});

