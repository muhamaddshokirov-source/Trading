/* ============================================================
   Pricing page
   ============================================================ */
(function () {
  const t = (k, v) => window.NX.i18n.t(k, v);
  let billing = "monthly";

  function renderPrices() {
    document.querySelectorAll(".plan .price").forEach((el) => {
      const amount = el.dataset[billing];
      const cur = el.querySelector("small");
      el.innerHTML = "";
      el.append(document.createTextNode(amount));
      if (cur) el.append(cur);
      else {
        const s = document.createElement("small");
        s.setAttribute("data-i18n", "pricing.perMonth");
        el.append(s);
      }
      el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "ease-out" });
    });

    // second small is removed when re-set: keep exactly one
    document.querySelectorAll(".plan .price small").forEach((s, i, arr) => {
      if (i > 0 && arr[i - 1].parentNode === s.parentNode) s.remove();
    });

    window.NX.i18n.apply();
  }

  function renderCta() {
    document.getElementById("ctaTitle").textContent = window.NX.i18n.lang === "uz"
      ? "Bugun birinchi savdodan boshlang"
      : "Start with your first trade today";
    document.getElementById("ctaText").textContent = window.NX.i18n.lang === "uz"
      ? "Demo ma'lumot bilan tanishib chiqing, keyin o'z savdolaringizni qo'shing."
      : "Explore the demo data, then add your own trades.";
    document.getElementById("ctaBtn").textContent = window.NX.i18n.lang === "uz" ? "Panelga o'tish" : "Open dashboard";
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderCta();
    document.querySelectorAll("#billingSeg button").forEach((b) => {
      b.addEventListener("click", () => {
        document.querySelectorAll("#billingSeg button").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        billing = b.dataset.billing;
        renderPrices();
      });
    });

    document.querySelectorAll("[data-plan]").forEach((b) => {
      b.addEventListener("click", () => {
        const plan = b.dataset.plan;
        const msg = window.NX.i18n.lang === "uz"
          ? (plan === "start" ? "Demo rejim: allaqachon Start tarifidasiz." : "Demo rejim: to'lov tizimi ulanmagan.")
          : (plan === "start" ? "Demo mode: you are already on Starter." : "Demo mode: payments are not connected.");
        window.NX.ui.toast(msg);
      });
    });

    document.addEventListener("langchange", () => {
      renderPrices();
      renderCta();
    });
  });
})();
