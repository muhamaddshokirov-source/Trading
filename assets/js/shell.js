/* ============================================================
   App shell — sidebar, topbar, modal, toast, language switch
   ============================================================ */
(function () {
  const t = (k, v) => window.NX.i18n.t(k, v);

  const ICONS = {
    logo: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14f0a4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-6 4 3 5-7"/><path d="M3 21h18"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 4-6"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5A2.5 2.5 0 016.5 2H20v18H6.5A2.5 2.5 0 004 22z"/><path d="M4 17.5h16"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M18 9a6 6 0 10-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M10.4 20a2 2 0 003.2 0"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 11l5 5 5-5"/><path d="M4 21h16"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>'
  };

  const NAV = [
    { group: "nav.main", items: [
      { href: "index.html", key: "nav.dashboard", icon: "grid", page: "dashboard" },
      { href: "trades.html", key: "nav.trades", icon: "list", page: "trades" },
      { href: "analytics.html", key: "nav.analytics", icon: "chart", page: "analytics" },
      { href: "journal.html", key: "nav.journal", icon: "book", page: "journal" }
    ]},
    { group: "nav.account", items: [
      { href: "pricing.html", key: "nav.pricing", icon: "tag", page: "pricing" }
    ]}
  ];

  function buildSidebar(host, active) {
    const nav = NAV.map((g) => {
      return '<div class="nav-label" data-i18n="' + g.group + '"></div><div class="nav">' +
        g.items.map((it) =>
          '<a href="' + it.href + '" class="' + (it.page === active ? "active" : "") + '">' + ICONS[it.icon] + '<span data-i18n="' + it.key + '"></span></a>'
        ).join("") + "</div>";
    }).join("");

    host.innerHTML =
      '<a class="brand" href="index.html">' +
        '<span class="brand-mark">' + ICONS.logo + "</span>" +
        '<span><span class="brand-name">NEX<span>ORA</span></span><br><span class="brand-sub" data-i18n="app.tag"></span></span>' +
      "</a>" + nav +
      '<div class="sidebar-foot">' +
        '<div class="upgrade-card">' +
          '<h4 data-i18n="nav.upgradeTitle"></h4>' +
          '<p data-i18n="nav.upgradeText"></p>' +
          '<a class="btn btn-primary btn-sm" href="pricing.html" data-i18n="nav.upgradeBtn"></a>' +
        "</div>" +
        '<div class="user-chip">' +
          '<span class="avatar">SM</span>' +
          '<span><span class="who" data-i18n="user.name"></span><br><span class="plan" data-i18n="nav.plan"></span></span>' +
        "</div>" +
      "</div>";
  }

  function buildTopbar(host, opts) {
    host.innerHTML =
      '<button class="icon-btn burger" id="burger" aria-label="Menu">' + ICONS.menu + "</button>" +
      '<div><h1 data-i18n="' + opts.title + '"></h1><div class="sub" data-i18n="' + opts.sub + '"></div></div>' +
      '<div class="topbar-spacer"></div>' +
      '<div class="seg" id="langSwitch">' +
        '<button data-lang="uz">UZ</button><button data-lang="en">EN</button>' +
      "</div>" +
      '<button class="btn btn-ghost btn-sm hide-sm" id="exportBtn">' + ICONS.download + '<span data-i18n="common.export"></span></button>' +
      '<button class="btn btn-primary" id="addTradeBtn">' + ICONS.plus + '<span data-i18n="common.addTrade"></span></button>' +
      '<button class="icon-btn hide-sm" aria-label="Notifications">' + ICONS.bell + "</button>";

    host.querySelector("#burger").addEventListener("click", () => document.body.classList.toggle("nav-open"));
    host.querySelectorAll("#langSwitch button").forEach((b) => {
      b.addEventListener("click", () => window.NX.i18n.set(b.dataset.lang));
    });
    host.querySelector("#addTradeBtn").addEventListener("click", openTradeModal);
    host.querySelector("#exportBtn").addEventListener("click", exportCsv);
  }

  /* ------------------------------ toast ------------------------------ */
  function toast(msg, kind) {
    let stack = document.querySelector(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }
    const el = document.createElement("div");
    el.className = "toast" + (kind === "error" ? " error" : "");
    el.innerHTML = (kind === "error" ? ICONS.x : ICONS.check) + "<span>" + msg + "</span>";
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(6px)"; el.style.transition = ".25s"; }, 2600);
    setTimeout(() => el.remove(), 3000);
  }

  /* ------------------------------ modal ------------------------------ */
  function openTradeModal() {
    if (document.querySelector(".overlay")) {
      document.querySelector(".overlay").classList.add("show");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const ov = document.createElement("div");
    ov.className = "overlay";
    ov.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true">' +
        '<h3 data-i18n="modal.title"></h3>' +
        '<p class="modal-sub" data-i18n="modal.sub"></p>' +
        '<form id="tradeForm">' +
          '<div class="form-grid">' +
            '<div class="field"><label data-i18n="modal.symbol"></label><input name="symbol" placeholder="BTCUSDT" required></div>' +
            '<div class="field"><label data-i18n="modal.side"></label>' +
              '<select name="side"><option value="long" data-i18n="common.long"></option><option value="short" data-i18n="common.short"></option></select></div>' +
            '<div class="field"><label data-i18n="modal.date"></label><input type="date" name="date" value="' + today + '" required></div>' +
            '<div class="field"><label data-i18n="modal.setup"></label><select name="setup">' +
              window.NX.data.SETUPS.map((s) => '<option value="' + s + '">' + s + "</option>").join("") +
            "</select></div>" +
            '<div class="field"><label data-i18n="modal.entry"></label><input type="number" step="any" name="entry" placeholder="67000"></div>' +
            '<div class="field"><label data-i18n="modal.exit"></label><input type="number" step="any" name="exit" placeholder="68120"></div>' +
            '<div class="field"><label data-i18n="modal.risk"></label><input type="number" step="any" name="risk" placeholder="150"></div>' +
            '<div class="field"><label>P&L ($)</label><input type="number" step="any" name="pnl" placeholder="240" required></div>' +
            '<div class="field full"><label data-i18n="modal.notes"></label><textarea name="notes" rows="2"></textarea></div>' +
          "</div>" +
          '<div class="modal-foot">' +
            '<button type="button" class="btn" id="modalCancel" data-i18n="common.cancel"></button>' +
            '<button type="submit" class="btn btn-primary" data-i18n="modal.save"></button>' +
          "</div>" +
        "</form>" +
      "</div>";
    document.body.appendChild(ov);
    window.NX.i18n.apply(ov);

    requestAnimationFrame(() => ov.classList.add("show"));
    const close = () => ov.classList.remove("show");
    ov.querySelector("#modalCancel").addEventListener("click", close);
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
    });

    ov.querySelector("#tradeForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const symbol = String(f.get("symbol") || "").trim().toUpperCase();
      const pnl = parseFloat(f.get("pnl"));
      const risk = parseFloat(f.get("risk")) || Math.abs(pnl) || 100;
      const date = f.get("date");
      if (!symbol || !date || isNaN(pnl)) { toast(t("modal.invalid"), "error"); return; }
      window.NX.data.addTrade({
        id: "U-" + Date.now(),
        symbol,
        kind: "Custom",
        side: f.get("side"),
        setup: f.get("setup"),
        date,
        entry: parseFloat(f.get("entry")) || 0,
        exit: parseFloat(f.get("exit")) || 0,
        qty: 0,
        risk,
        r: Math.round((pnl / (risk || 1)) * 100) / 100,
        pnl: Math.round(pnl),
        note: String(f.get("notes") || "")
      });
      close();
      toast(t("modal.added"));
      setTimeout(() => window.location.reload(), 550);
    });
  }

  /* ------------------------------ export ------------------------------ */
  function exportCsv() {
    const trades = window.NX.data.trades();
    const head = ["id", "date", "symbol", "side", "setup", "entry", "exit", "risk", "r", "pnl"];
    const rows = trades.map((x) => [x.id, x.date, x.symbol, x.side, x.setup, x.entry, x.exit, x.risk, x.r, x.pnl].join(","));
    const blob = new Blob([head.join(",") + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "nexora-trades.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("CSV · " + trades.length + " rows");
  }

  /* ------------------------------ boot ------------------------------ */
  function boot() {
    const app = document.querySelector(".app");
    const page = app.dataset.page;
    const sidebar = document.getElementById("sidebar");
    const topbar = document.getElementById("topbar");
    if (sidebar) buildSidebar(sidebar, page);
    if (topbar) buildTopbar(topbar, { title: "nav." + page, sub: "page." + page + ".sub" });

    window.NX.i18n.apply();
    const syncLang = () => {
      document.querySelectorAll("#langSwitch button").forEach((b) => {
        b.classList.toggle("on", b.dataset.lang === window.NX.i18n.lang);
      });
      window.NX.i18n.apply();
      document.dispatchEvent(new CustomEvent("langchange"));
    };
    syncLang();
    document.addEventListener("langchange", () => {
      document.querySelectorAll("#langSwitch button").forEach((b) => {
        b.classList.toggle("on", b.dataset.lang === window.NX.i18n.lang);
      });
      window.NX.i18n.apply();
    });

    document.addEventListener("click", (e) => {
      if (document.body.classList.contains("nav-open") && !e.target.closest("#sidebar") && !e.target.closest("#burger")) {
        document.body.classList.remove("nav-open");
      }
    });

    // reveal on scroll
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".reveal").forEach((el, i) => {
      el.style.transitionDelay = (i % 6) * 40 + "ms";
      io.observe(el);
    });

    // footer year
    document.querySelectorAll(".year").forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  window.NX = window.NX || {};
  window.NX.ui = { toast, openTradeModal, exportCsv, ICONS };
  document.addEventListener("DOMContentLoaded", boot);
})();
