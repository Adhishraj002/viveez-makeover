// script.js - frontend page logic + booking submit + popup modal

document.addEventListener("DOMContentLoaded", () => {

  // ---------- FOOTER YEAR ----------
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // ---------- PAGE SWITCHING ----------
  const sections = document.querySelectorAll(".page-section");
  const pageTriggers = document.querySelectorAll("[data-page]");

  function showPage(pageId) {
    sections.forEach((sec) => sec.classList.toggle("active-page", sec.id === pageId));
    const navLinks = document.querySelectorAll(".nav-link, .nav-cta");
    navLinks.forEach((link) => link.classList.toggle("active", link.dataset.page === pageId));
    const hashName = pageId.replace("page-", "");
    window.location.hash = hashName;

    // reset old animations
    document.querySelectorAll(".fade-item.in-view").forEach((el) => {
      el.classList.remove("in-view");
      el.style.setProperty("--delay", "");
    });

    const pageEl = document.getElementById(pageId);
    if (pageEl) {
      const items = Array.from(pageEl.querySelectorAll(".fade-item"));
      items.forEach((el, i) => {
        const delay = (i + 1) * 80;
        el.style.setProperty("--delay", `${delay}ms`);
        setTimeout(() => el.classList.add("in-view"), delay);
      });
    }

    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }

  pageTriggers.forEach((el) => {
    el.addEventListener("click", (e) => {
      const pageId = el.dataset.page;
      if (!pageId) return;
      e.preventDefault();
      showPage(pageId);

      const scrollTargetId = el.dataset.scrollTarget;
      if (scrollTargetId) {
        const targetEl = document.getElementById(scrollTargetId);
        if (targetEl) {
          setTimeout(() => targetEl.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
        }
      }
    });
  });

  let startPage = "page-home";
  if (window.location.hash) {
    const hash = window.location.hash.replace("#", "");
    const candidate = "page-" + hash;
    if (document.getElementById(candidate)) startPage = candidate;
  }
  showPage(startPage);

  // ---------- MODAL UTIL ----------
  const modal = document.getElementById("modal");
  const modalContent = document.getElementById("modalContent");
  const modalClose = document.getElementById("modalClose");
  const modalOk = document.getElementById("modalOk");

  function showModal(html) {
    if (!modal) return;
    modalContent.innerHTML = html;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalOk) modalOk.addEventListener("click", closeModal);
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // ---------- BOOKING FORM SUBMIT ----------
  const form = document.getElementById("bookingForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const email = document.getElementById("email").value.trim();
      const eventType = document.getElementById("event").value;
      const date = document.getElementById("date").value;
      const message = document.getElementById("message").value.trim();

      // basic client-side validation
      if (!name || !phone || !email || !eventType) {
        showModal(`<h3>Missing details</h3><p>Please fill the required fields: Name, Phone and Event Type.</p>`);
        return;
      }

         // basic email format quick check (optional, browser already validates)
     const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRe.test(email)) {
       showModal(`<h3>Invalid Email</h3><p>Please enter a valid email address.</p>`);
      return;
    }

      const payload = { name, phone, email, eventType, date, message };

      try {
        // update this URL if your backend is deployed 
        const API_BASE = window.CONFIG.API_BASE;
        const res = await fetch(`${API_BASE}/api/book`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        const data = await res.json();
         
         if (data.success) {
          showModal(`<h3>Booking Received</h3><p>Thank you, ${name}! A confirmation will be sent to <b>${email}</b>. We will contact you soon.</p>`);
          form.reset();
        } else {
          let html = `<h3>Unable to Send Booking</h3><p>${data.message || "Server error"}</p>`;
          if (data.errors && Array.isArray(data.errors) && data.errors.length) {
            html += "<ul style='margin-top:8px;'>";
            data.errors.forEach(err => {
              html += `<li>${err.msg} (${err.param})</li>`;
            });
            html += "</ul>";
          }
          showModal(html);
        }
      } catch (err) {
        console.error(err);
        showModal(`<h3>Network Error</h3><p>Unable to reach the server. Please try again in a few seconds.</p>`);

      }
    });
  }
});

  // ---------- HAMBURGER MENU (MOBILE ONLY) ----------
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");

  if (hamburger && mobileMenu) {

    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      mobileMenu.classList.toggle("open");
    });

    document.querySelectorAll(".mobile-menu a").forEach(link => {
      link.addEventListener("click", (e) => {

        const page = link.dataset.page;
        if (page) {
          e.preventDefault();
          showPage(page);   // now works because inside same scope
        }

        hamburger.classList.remove("active");
        mobileMenu.classList.remove("open");
      });
    });

  }
