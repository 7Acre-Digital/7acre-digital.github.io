(function () {
  var email = (typeof CONTACT_EMAIL === "string" && CONTACT_EMAIL) ? CONTACT_EMAIL : "";
  document.querySelectorAll("[data-email]").forEach(function (el) {
    el.textContent = email;
    if (el.tagName === "A") el.href = "mailto:" + email;
  });
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); });
    });
  }
  var form = document.getElementById("quote-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form);
      var subject = "Website quote request: " + (d.get("business") || d.get("name"));
      var body = [
        "Name: " + d.get("name"),
        "Business: " + d.get("business"),
        "Email: " + d.get("email"),
        "Phone: " + (d.get("phone") || "-"),
        "Plan interest: " + d.get("plan"),
        "",
        d.get("message") || ""
      ].join("\n");
      window.location.href = "mailto:" + email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      var note = document.getElementById("form-note");
      if (note) note.textContent = "Your email app should open with your request filled in. Just press send. If it doesn't open, email " + email + " directly.";
    });
  }
})();
