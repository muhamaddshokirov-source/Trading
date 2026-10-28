/* ============================================================
   Trades page — filtering, sorting, pagination
   ============================================================ */
(function () {
  const D = window.NX.data;
  const F = window.NX.fmt;
  const t = (k, v) => window.NX.i18n.t(k, v);
  const PER_PAGE = 12;

  const state = { q: "", side: "all", setup: "all", sort: { key: "date", dir: "desc" }, page: 1 };

  function filtered() {
    let list = D.trades();
    if (state.side !== "all") list = list.filter((x) => x.side === state.side);
    if (state.setup !== "all") list = list.filter((x) => x.setup === state.setup);
    if (state.q) {
      const q = state.q.toLowerCase();
      list = list.filter((x) =>
        x.symbol.toLowerCase().includes(q) ||
        x.setup.toLowerCase().includes(q) ||
        x.date.includes(q) ||
        (x.note || "").toLowerCase().includes(q)
      );
    }
    const { key, dir } = state.sort;
    list = list.slice().sort((a, b) => {
      let av = a[key], bv = b[key];
      if (key === "date") { av = a.date; bv = b.date; }
      if (typeof av === "string") return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return dir === "asc" ? av - bv : bv - av;
    });
    return list;
  }

  function renderKpis() {
    const all = D.trades();
    const s = D.stats(all);
    const cards = [
      { label: t("kpi.trades"), value: s.n, cls: "", foot: t("common.allTime") },
      { label: t("trades.sumPnl"), value: F.money(s.net), cls: s.net >= 0 ? "pos" : "neg", foot: t("kpi.profitFactor") + " · " + s.profitFactor.toFixed(2) },
      { label: t("trades.avgWin"), value: F.money(s.avgWin, { plus: false }), cls: "pos", foot: s.wins + " " + t("common.win").toLowerCase() },
      { label: t("trades.avgLoss"), value: F.money(-s.avgLoss), cls: "neg", foot: s.losses + " " + t("common.loss").toLowerCase() }
    ];
    document.getElementById("tradeKpis").innerHTML = cards.map((c) =>
      '<div class="card kpi reveal in"><div class="label"><span>' + c.label + '</span></div>' +
      '<div class="value num ' + c.cls + '">' + c.value + "</div>" +
      '<div class="foot"><span>' + c.foot + "</span></div></div>"
    ).join("");

    document.getElementById("heroMeta").innerHTML =
      '<span><i style="background:#14f0a4"></i>' + t("common.win") + ": " + s.wins + "</span>" +
      '<span><i style="background:#ff5470"></i>' + t("common.loss") + ": " + s.losses + "</span>" +
      '<span><i style="background:#8b5cff"></i>' + t("kpi.profitFactor") + ": " + s.profitFactor.toFixed(2) + "</span>";
  }

  function renderSetupOptions() {
    const sel = document.getElementById("setupSel");
    const setups = Array.from(new Set(D.trades().map((x) => x.setup)));
    const prev = sel.value;
    sel.innerHTML = '<option value="all">' + t("trades.allSetups") + "</option>" +
      setups.map((s) => '<option value="' + s + '">' + s + "</option>").join("");
    sel.value = prev && (prev === "all" || setups.includes(prev)) ? prev : "all";
  }

  function renderTable() {
    const list = filtered();
    const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * PER_PAGE;
    const page = list.slice(start, start + PER_PAGE);

    document.getElementById("tradeRows").innerHTML = page.length ? page.map((x) =>
      "<tr>" +
        '<td class="dim">' + F.date(x.date) + "</td>" +
        '<td><div class="sym"><span class="sym-badge">' + x.symbol.slice(0, 3) + '</span>' +
          '<span><div class="sym-name">' + x.symbol + '</div><div class="sym-meta">' + x.kind + "</div></span></div></td>" +
        '<td><span class="side ' + x.side + '">' + t("common." + x.side) + "</span></td>" +
        '<td><span class="pill">' + x.setup + "</span></td>" +
        '<td class="right num muted">' + (x.entry ? x.entry.toLocaleString("en-US") : "—") + "</td>" +
        '<td class="right num muted">' + (x.exit ? x.exit.toLocaleString("en-US") : "—") + "</td>" +
        '<td class="right num ' + (x.r >= 0 ? "pos" : "neg") + '">' + (x.r >= 0 ? "+" : "−") + Math.abs(x.r).toFixed(2) + "R</td>" +
        '<td class="right num ' + (x.pnl >= 0 ? "pos" : "neg") + '" style="font-weight:650" title="' + (x.note || "").replace(/"/g, "&quot;") + '">' + F.money(x.pnl) + "</td>" +
      "</tr>"
    ).join("") : '<tr><td colspan="8"><div class="empty">' + t("common.noResults") + "</div></td></tr>";

    document.getElementById("countLbl").textContent =
      t("trades.count", { n: list.length }) + " · " + t("common.showing") + " " + (list.length ? start + 1 : 0) + "–" + Math.min(start + PER_PAGE, list.length);
    document.getElementById("pageLbl").textContent = t("trades.page", { p: state.page, t: totalPages });
    document.getElementById("prevBtn").disabled = state.page <= 1;
    document.getElementById("nextBtn").disabled = state.page >= totalPages;
    document.getElementById("prevBtn").style.opacity = state.page <= 1 ? ".4" : "1";
    document.getElementById("nextBtn").style.opacity = state.page >= totalPages ? ".4" : "1";

    document.querySelectorAll("#tradeTable th.sortable").forEach((th) => {
      const k = th.dataset.key;
      const arrow = th.querySelector(".arrow");
      if (arrow) arrow.remove();
      if (k === state.sort.key) {
        const span = document.createElement("span");
        span.className = "arrow";
        span.textContent = state.sort.dir === "asc" ? " ▲" : " ▼";
        th.appendChild(span);
      }
    });
  }

  function renderAll() {
    renderSetupOptions();
    renderKpis();
    renderTable();
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderAll();

    document.getElementById("q").addEventListener("input", (e) => {
      state.q = e.target.value.trim();
      state.page = 1;
      renderTable();
    });

    document.querySelectorAll("#sideSeg button").forEach((b) => {
      b.addEventListener("click", () => {
        document.querySelectorAll("#sideSeg button").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        state.side = b.dataset.side;
        state.page = 1;
        renderTable();
      });
    });

    document.getElementById("setupSel").addEventListener("change", (e) => {
      state.setup = e.target.value;
      state.page = 1;
      renderTable();
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
      state.q = ""; state.side = "all"; state.setup = "all"; state.page = 1;
      state.sort = { key: "date", dir: "desc" };
      document.getElementById("q").value = "";
      document.getElementById("setupSel").value = "all";
      document.querySelectorAll("#sideSeg button").forEach((x, i) => x.classList.toggle("on", i === 0));
      renderTable();
    });

    document.getElementById("csvBtn").innerHTML = window.NX.ui.ICONS.download + "<span>" + t("common.export") + "</span>";
    document.getElementById("csvBtn").addEventListener("click", window.NX.ui.exportCsv);

    document.getElementById("prevBtn").addEventListener("click", () => { state.page--; renderTable(); });
    document.getElementById("nextBtn").addEventListener("click", () => { state.page++; renderTable(); });

    document.querySelectorAll("#tradeTable th.sortable").forEach((th) => {
      th.addEventListener("click", () => {
        const k = th.dataset.key;
        if (state.sort.key === k) state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
        else state.sort = { key: k, dir: ["date", "pnl", "r", "entry", "exit"].includes(k) ? "desc" : "asc" };
        renderTable();
      });
    });

    document.addEventListener("langchange", () => { renderAll(); });
  });
})();
