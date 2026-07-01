(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------------------
     Header: shadow on scroll + active link highlighting
     ---------------------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".main-nav a"));

  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if ("IntersectionObserver" in window && sections.length && navLinks.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.getAttribute("id");
          navLinks.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (section) { navObserver.observe(section); });
  }

  /* ----------------------------------------------------------------------
     Mobile nav toggle
     ---------------------------------------------------------------------- */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    mainNav.addEventListener("click", function (event) {
      if (event.target.tagName === "A") {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && mainNav.classList.contains("is-open")) {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.focus();
      }
    });
  }

  /* ----------------------------------------------------------------------
     Reveal-on-scroll
     ---------------------------------------------------------------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ----------------------------------------------------------------------
     Testimonials carousel
     ---------------------------------------------------------------------- */
  var track = document.getElementById("testimonialsTrack");
  var dotsWrap = document.getElementById("testimonialDots");
  var prevBtn = document.getElementById("prevTestimonial");
  var nextBtn = document.getElementById("nextTestimonial");

  if (track && dotsWrap && prevBtn && nextBtn) {
    var slides = Array.prototype.slice.call(track.children);
    var current = 0;
    var autoplayId = null;

    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Ir para depoimento " + (i + 1));
      dot.addEventListener("click", function () { goTo(i); resetAutoplay(); });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function render() {
      track.style.transform = "translateX(-" + current * 100 + "%)";
      dots.forEach(function (dot, i) { dot.classList.toggle("is-active", i === current); });
    }

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      render();
    }

    prevBtn.addEventListener("click", function () { goTo(current - 1); resetAutoplay(); });
    nextBtn.addEventListener("click", function () { goTo(current + 1); resetAutoplay(); });

    function startAutoplay() {
      if (prefersReducedMotion) return;
      autoplayId = window.setInterval(function () { goTo(current + 1); }, 6000);
    }
    function resetAutoplay() {
      if (autoplayId) window.clearInterval(autoplayId);
      startAutoplay();
    }

    track.addEventListener("mouseenter", function () { if (autoplayId) window.clearInterval(autoplayId); });
    track.addEventListener("mouseleave", startAutoplay);

    render();
    startAutoplay();
  }

  /* ----------------------------------------------------------------------
     FAQ accordion
     ---------------------------------------------------------------------- */
  var accordionItems = Array.prototype.slice.call(document.querySelectorAll(".accordion-item"));

  accordionItems.forEach(function (item) {
    var trigger = item.querySelector(".accordion-trigger");
    if (!trigger) return;
    trigger.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      accordionItems.forEach(function (other) {
        other.classList.remove("is-open");
        var otherTrigger = other.querySelector(".accordion-trigger");
        if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ----------------------------------------------------------------------
     Pré-agendamento form (client-side only — sem backend)
     ---------------------------------------------------------------------- */
  var form = document.getElementById("agendarForm");

  if (form) {
    var successBox = document.getElementById("formSuccess");
    var phonePattern = /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/;

    var validators = {
      nomeMae: function (value) {
        return value.trim().length >= 2 ? "" : "Conta pra gente seu nome.";
      },
      nomeCrianca: function (value) {
        return value.trim().length >= 2 ? "" : "Nome (e idade, se puder) da criança.";
      },
      whatsapp: function (value) {
        return phonePattern.test(value.trim()) ? "" : "Confere o número, ex.: (19) 90000-0000.";
      }
    };

    function showError(field, message) {
      var input = document.getElementById(field);
      var errorEl = document.getElementById("err-" + field);
      if (input) input.classList.toggle("is-invalid", Boolean(message));
      if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
      if (errorEl) errorEl.textContent = message;
    }

    Object.keys(validators).forEach(function (field) {
      var input = document.getElementById(field);
      if (!input) return;
      input.addEventListener("blur", function () {
        showError(field, validators[field](input.value));
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var firstInvalid = null;
      Object.keys(validators).forEach(function (field) {
        var input = document.getElementById(field);
        if (!input) return;
        var message = validators[field](input.value);
        showError(field, message);
        if (message && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      form.querySelectorAll("input").forEach(function (input) { input.disabled = true; });
      var submitBtn = form.querySelector("button[type=submit]");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Enviando...";
      }

      window.setTimeout(function () {
        form.hidden = false;
        if (submitBtn) submitBtn.style.display = "none";
        form.querySelectorAll(".form-row, .form-disclaimer").forEach(function (el) { el.style.display = "none"; });
        if (successBox) successBox.hidden = false;
      }, 500);
    });
  }
})();
