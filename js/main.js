/* ==========================================================================
   Malmö Watch Clinic — shared site behaviour
   ========================================================================== */
(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");

  /* Sticky header shadow/border on scroll */
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 8) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  if (header) {
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Mobile nav toggle */
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ------------------------------------------------------------------
     Language switcher (SV default / EN)
     Every translatable element carries data-sv / data-en (text) or
     data-sv-html / data-en-html (for content needing simple markup),
     and inputs use data-sv-placeholder / data-en-placeholder.
     Selection persists via localStorage across pages.
     ------------------------------------------------------------------ */
  var LANG_KEY = "mwc-lang";

  function getStoredLang() {
    try {
      return localStorage.getItem(LANG_KEY);
    } catch (e) {
      return null;
    }
  }

  function storeLang(lang) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      /* ignore */
    }
  }

  function applyLang(lang) {
    document.documentElement.setAttribute("lang", lang === "en" ? "en" : "sv");
    document.body.setAttribute("data-lang", lang);

    document.querySelectorAll("[data-" + lang + "]").forEach(function (el) {
      el.textContent = el.getAttribute("data-" + lang);
    });
    document.querySelectorAll("[data-" + lang + "-html]").forEach(function (el) {
      el.innerHTML = el.getAttribute("data-" + lang + "-html");
    });
    document.querySelectorAll("[data-" + lang + "-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", el.getAttribute("data-" + lang + "-placeholder"));
    });
    document.querySelectorAll("[data-" + lang + "-aria]").forEach(function (el) {
      el.setAttribute("aria-label", el.getAttribute("data-" + lang + "-aria"));
    });

    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      var isActive = btn.getAttribute("data-lang-btn") === lang;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function initLang() {
    var stored = getStoredLang();
    var lang = stored === "en" ? "en" : "sv";
    applyLang(lang);

    document.querySelectorAll(".lang-switch button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var chosen = btn.getAttribute("data-lang-btn");
        storeLang(chosen);
        applyLang(chosen);
      });
    });
  }

  /* ------------------------------------------------------------------
     Editable content (managed from /admin/)
     Published edits live in content/published.json and are layered over
     the HTML defaults before the language is applied. If the file is
     missing or unreachable the site simply shows its built-in content.
     ------------------------------------------------------------------ */
  /* Repeating blocks the owner can add to / remove from / reorder.
     Definitions are shared with the admin editor via window.MWC_LISTS. */
  function mk(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function bi(tag, sv, en, cls) {
    var e = mk(tag, cls);
    e.setAttribute("data-sv", sv || ""); e.setAttribute("data-en", en || "");
    e.textContent = sv || ""; return e;
  }
  function at(e, a) { return e ? e.getAttribute(a) || "" : ""; }
  var LISTS = {
    services: {
      label: "services", itemName: "Service", required: "title_sv",
      fields: [
        { name: "title", label: "Service name", kind: "line" },
        { name: "text", label: "Description", kind: "text" }
      ],
      blank: { title_sv: "Ny tjänst", title_en: "New service", text_sv: "", text_en: "" },
      render: function (it, i) {
        var row = mk("div", "service-row"), idx = mk("span", "service-index"), box = mk("div");
        idx.textContent = (i < 9 ? "0" : "") + (i + 1);
        box.appendChild(bi("h3", it.title_sv, it.title_en));
        box.appendChild(bi("p", it.text_sv, it.text_en));
        var a = bi("a", "Begär offert", "Request a quote", "btn btn-outline btn-sm service-cta");
        a.setAttribute("href", "kontakt.html");
        row.appendChild(idx); row.appendChild(box); row.appendChild(a); return row;
      },
      read: function (row) {
        var h = row.querySelector("h3"), p = row.querySelector("p");
        return { title_sv: at(h, "data-sv"), title_en: at(h, "data-en"), text_sv: at(p, "data-sv"), text_en: at(p, "data-en") };
      }
    },
    teasers: {
      label: "service cards on the home page", itemName: "Card", required: "title_sv",
      fields: [
        { name: "title", label: "Title", kind: "line" },
        { name: "text", label: "Short text", kind: "text" }
      ],
      blank: { title_sv: "Ny tjänst", title_en: "New service", text_sv: "", text_en: "" },
      render: function (it) {
        var c = mk("div", "teaser-card");
        c.appendChild(bi("h3", it.title_sv, it.title_en)); c.appendChild(bi("p", it.text_sv, it.text_en)); return c;
      },
      read: function (c) {
        var h = c.querySelector("h3"), p = c.querySelector("p");
        return { title_sv: at(h, "data-sv"), title_en: at(h, "data-en"), text_sv: at(p, "data-sv"), text_en: at(p, "data-en") };
      }
    },
    reviews: {
      label: "customer reviews", itemName: "Review", required: "text_sv",
      fields: [
        { name: "text", label: "Review text", kind: "text" },
        { name: "author", label: "Source", kind: "line" }
      ],
      blank: { text_sv: "", text_en: "", author_sv: "Google-recension", author_en: "Google review" },
      render: function (it) {
        var c = mk("div", "review-card"), st = mk("div", "review-stars");
        st.setAttribute("aria-hidden", "true"); st.textContent = "★★★★★";
        c.appendChild(st); c.appendChild(bi("p", it.text_sv, it.text_en));
        c.appendChild(bi("p", it.author_sv, it.author_en, "review-author")); return c;
      },
      read: function (c) {
        var p = c.querySelector("p:not(.review-author)"), a = c.querySelector(".review-author");
        return { text_sv: at(p, "data-sv"), text_en: at(p, "data-en"), author_sv: at(a, "data-sv"), author_en: at(a, "data-en") };
      }
    },
    gallery: {
      label: "gallery pictures", itemName: "Picture", required: "src",
      fields: [
        { name: "src", label: "Image", kind: "image" },
        { name: "alt", label: "Description of the image (for screen readers)", kind: "plain" },
        { name: "shape", label: "Shape in the gallery", kind: "choice", options: [["square", "Square"], ["tall", "Tall"], ["wide", "Wide"]] }
      ],
      blank: { src: "", alt: "", shape: "square" },
      render: function (it) {
        var f = mk("figure", "gallery-item gallery-item--" + (it.shape || "square")), im = mk("img");
        im.setAttribute("src", it.src); im.setAttribute("alt", it.alt || ""); im.setAttribute("loading", "lazy");
        f.appendChild(im); return f;
      },
      read: function (f) {
        var im = f.querySelector("img"), m = /gallery-item--(tall|square|wide)/.exec(f.className);
        return { src: at(im, "src"), alt: at(im, "alt"), shape: m ? m[1] : "square" };
      }
    }
  };
  window.MWC_LISTS = LISTS;

  function applyList(id, items) {
    var def = LISTS[id], box = document.querySelector('[data-cms-list="' + id + '"]');
    if (!def || !box || !Array.isArray(items)) return;
    box.innerHTML = "";
    items.forEach(function (it, i) { box.appendChild(def.render(it, i)); });
  }

  function applyContent(content) {
    Object.keys(content || {}).forEach(function (key) {
      var v = content[key];
      if (v && v.t === "list" && key.indexOf("list.") === 0) { applyList(key.slice(5), v.items); return; }
      var el = document.querySelector('[data-cms="' + key + '"]');
      if (!el || !v) return;
      if (v.t === "img" && el.tagName === "IMG") {
        if (v.src) el.setAttribute("src", v.src);
        if (typeof v.alt === "string") el.setAttribute("alt", v.alt);
        if (v.fit) el.style.objectFit = v.fit;
        if (v.pos) el.style.objectPosition = v.pos;
      } else if (v.t === "html") {
        el.setAttribute("data-sv-html", v.sv);
        el.setAttribute("data-en-html", v.en);
      } else if (v.t === "text") {
        el.setAttribute("data-sv", v.sv);
        el.setAttribute("data-en", v.en);
      }
    });
  }

  function loadContent() {
    var preview = /[?&]cms-preview=1/.test(location.search);
    return fetch(preview ? "/api/draft" : "content/published.json", {
      credentials: "same-origin",
      cache: "no-cache"
    })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; });
  }

  loadContent().then(function (content) {
    applyContent(content);
    initLang();
  });

  /* Send the contact form to our own server (/api/contact) without leaving the page. */
  var contactForm = document.querySelector("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var submitButton = contactForm.querySelector('button[type="submit"]');
      var status = contactForm.querySelector(".form-status");
      var lang = document.body.getAttribute("data-lang") || "sv";

      submitButton.disabled = true;
      status.classList.remove("is-visible");

      var data = {};
      new FormData(contactForm).forEach(function (v, k) { data[k] = v; });
      fetch("/api/contact", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json", Accept: "application/json" }
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Form submission failed");
          contactForm.reset();
          status.textContent =
            lang === "en"
              ? "Thank you for contacting us. We will get back to you as soon as we can."
              : "Tack för att ni kontaktar oss. Vi återkommer så snart vi kan.";
          status.classList.add("is-visible");
        })
        .catch(function () {
          status.textContent =
            lang === "en"
              ? "Something went wrong. Please try again or contact us by phone."
              : "Något gick fel. Försök igen eller kontakta oss per telefon.";
          status.classList.add("is-visible");
        })
        .finally(function () {
          submitButton.disabled = false;
        });
    });
  }

})();
