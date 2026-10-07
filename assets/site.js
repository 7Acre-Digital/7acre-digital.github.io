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
    var btn = form.querySelector('button[type="submit"]');
    var note = document.getElementById("form-note");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var d = new FormData(form);
      if (d.get("_honey")) return; // spam bot filled the hidden field
      var who = d.get("business") || d.get("name");
      var payload = {
        _subject: "New website lead: " + who,
        _template: "table",
        _captcha: "false",
        _replyto: d.get("email"),
        "Name": d.get("name"),
        "Business": d.get("business"),
        "Email": d.get("email"),
        "Phone": d.get("phone") || "-",
        "Interested in": d.get("plan"),
        "Message": d.get("message") || "-",
        "Sent from": location.href
      };
      if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }
      if (note) note.textContent = "";
      fetch("https://formsubmit.co/ajax/" + email, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok || String(res.j.success) === "false") throw new Error(res.j.message || "send failed");
          form.reset();
          if (btn) btn.textContent = "Sent!";
          if (note) note.textContent = "Thanks, " + (d.get("name") || "") + "! Your request is in. I'll get back to you soon.";
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = "Send quote request"; }
          if (note) note.innerHTML = "Something went wrong sending that. Please email <a href=\"mailto:" + email + "\">" + email + "</a> or try again.";
        });
    });
  }
})();
