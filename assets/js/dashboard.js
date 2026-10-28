/* ============================================================
   Dashboard page
   ============================================================ */
(function () {
  const D = window.NX.data;
  const C = window.NX.chart;
  const F = window.NX.fmt;
  const t = (k, v) => window.NX.i18n.t(k, v);
  const I = () => window.NX.ui.ICONS;

  let rangeDays = 0;

  function cutoff(days) {
    if (!days) return null;
    const all = D.trades();
    const last = all.length ? new Date(all[all.length - 1].date + "T00:00:00Z") : new Date();
    return new Date(last.getTime() - days * 86400000);
  }
  function inRange(list, days) {
    const c = cutoff(days);
    if (!c) return list;
    return list.filter((x) => new Date(x.date + "T00:00:00Z") >= c);
  }

  /* ------------------------------ KPIs ------------------------------ */
  function renderKpis() {
    const all = D.trades();
    const s = D.stats(all);
    const last30 = inRange(all, 30), prev30 = all.filter((x) => {
      const d = new Date(x.date + "T00:00:00Z");
      const c1 = cutoff(30), c0 = new Date(c1.getTime() - 30 * 86400000);
      return d >= c0 && d < c1;
    });
    const net30 = last30.reduce((a, b) => a + b.pnl, 0);
    const netPrev = prev30.reduce((a, b) => a + b.pnl, 0);
    const deltaPct = netPrev ? ((net30 - netPrev) / Math.abs(netPrev)) * 100 : 0;

    const equityVals = s.equity.map((p) => p.balance);
    const recentBals = equityVals.slice(-40);

    const cards = [
      {
        label: t("kpi.netPnl"),
        value: F.money(s.net),
        cls: s.net >= 0 ? "pos" : "neg",
        foot: '<span class="trend ' + (net30 >= 0 ? "pos" : "neg") + '">' + (net30 >= 0 ? I().up : I().down) + F.money(net30, { plus: false }) + "</span><span>" + t("common.days30").toLowerCase() + "</span>",
        spark: recentBals, color: s.net >= 0 ? "#14f0a4" : "#ff5470"
      },
      {
        label: t("kpi.winRate"),
        value: s.winRate.toFixed(1) + "%",
        cls: "pos",
        foot: "<span>" + s.wins + " " + t("common.win") + " · " + s.losses + " " + t("common.loss") + "</span>",
        spark: [],
        donut: [s.wins, s.losses]
      },
      {
        label: t("kpi.profitFactor"),
        value: s.profitFactor.toFixed(2),
        cls: s.profitFactor >= 1 ? "pos" : "neg",
        foot: "<span>" + F.money(s.grossProfit, { plus: false }) + " / " + F.money(s.grossLoss, { plus: false }) + "</span>",
        spark: []
      },
      {
        label: t("kpi.expectancy"),
        value: F.money(s.expectancy),
        cls: s.expectancy >= 0 ? "pos" : "neg",
        foot: "<span>" + t("kpi.avgR") + " · " + (s.avgR >= 0 ? "+" : "−") + Math.abs(s.avgR).toFixed(2) + "R</span><span>" + s.n + " " + t("common.tradeCount") + "</span>",
        spark: []
      }
    ];

    const host = document.getElementById("kpis");
    host.innerHTML = cards.map((c, i) =>
      '<div class="card kpi reveal" style="transition-delay:' + i * 50 + 'ms">' +
        '<div class="label"><span>' + c.label + "</span>" +
          (i === 0 ? '<span class="badge green"><i class="dot"></i>' + t("common.demo") + "</span>" : "") +
        "</div>" +
        '<div class="value num ' + (c.cls || "") + '">' + c.value + "</div>" +
        '<div class="foot">' + c.foot + "</div>" +
        (c.spark && c.spark.length > 2 ? '<div class="spark" data-spark="' + i + '"></div>' : "") +
      "</div>"
    ).join("");

    cards.forEach((c, i) => {
      if (c.spark && c.spark.length > 2) {
        const holder = host.querySelector('[data-spark="' + i + '"]');
        C.spark(holder, c.spark, c.color);
      }
    });
    host.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  }

  /* ------------------------------ equity ------------------------------ */
  function renderEquity() {
    const all = D.trades();
    const list = inRange(all, rangeDays);
    const s = D.stats(list);
    const pts = s.equity.map((p, i) => ({
      x: i,
      y: p.balance,
      label: p.date ? F.date(p.date, rangeDays > 60 ? "md" : "md") : ""
    }));

    document.getElementById("equitySub").textContent = t("dash.equitySub", { n: s.n });
    document.getElementById("balanceNow").innerHTML = '<span class="cur">$</span>' + Math.round(s.balance).toLocaleString("en-US");

    const meta = document.getElementById("equityMeta");
    meta.innerHTML = [
      ["kpi.netPnl", F.money(s.net), s.net >= 0 ? "pos" : "neg"],
      ["kpi.maxDd", "−" + s.maxDdPct.toFixed(1) + "%", "neg"],
      ["kpi.best", s.best ? F.money(s.best.pnl) : "—", "pos"],
      ["kpi.worst", s.worst ? F.money(s.worst.pnl) : "—", "neg"]
    ].map((r) => "<div>" + t(r[0]) + "<b class='" + r[2] + "'>" + r[1] + "</b></div>").join("");

    C.line(document.getElementById("equityChart"), {
      points: pts,
      height: 252,
      color: s.net >= 0 ? "#14f0a4" : "#ff5470",
      tipValue: (p) => "$" + Math.round(p.y).toLocaleString("en-US")
    });
  }

  /* ------------------------------ win / loss ------------------------------ */
  function renderWinLoss() {
    const s = D.stats(D.trades());
    C.donut(document.getElementById("winLossChart"), {
      height: 190,
      thickness: 15,
      parts: [
        { value: s.wins, color: "#14f0a4", label: t("common.win") },
        { value: s.losses, color: "#ff5470", label: t("common.loss") }
      ],
      centerValue: s.winRate.toFixed(0) + "%",
      centerLabel: t("kpi.winRate")
    });

    document.getElementById("winLossLegend").innerHTML =
      '<span><i style="background:#14f0a4"></i>' + t("common.win") + " · " + s.wins + "</span>" +
      '<span><i style="background:#ff5470"></i>' + t("common.loss") + " · " + s.losses + "</span>";

    const rows = [
      [t("kpi.balance"), "$" + Math.round(s.balance).toLocaleString("en-US"), ""],
      [t("kpi.avgWin") , F.money(s.avgWin, { plus: false }), "pos"],
      [t("kpi.avgLoss"), F.money(-s.avgLoss), "neg"],
      [t("kpi.streak"), (s.streakIsWin ? I().up : I().down) + " " + s.streak, s.streakIsWin ? "pos" : "neg"]
    ];
    document.getElementById("winLossStats").innerHTML = rows.map((r) =>
      '<div class="stat-row"><span>' + r[0] + '</span><b class="' + r[2] + '">' + r[1] + "</b></div>"
    ).join("");
  }

  /* ------------------------------ recent ------------------------------ */
  function renderRecent() {
    const all = D.trades().slice(-7).reverse();
    document.getElementById("recentRows").innerHTML = all.map((x) =>
      "<tr>" +
        '<td><div class="sym"><span class="sym-badge">' + x.symbol.slice(0, 3) + '</span>' +
          '<span><div class="sym-name">' + x.symbol + '</div><div class="sym-meta">' + x.kind + "</div></span></div></td>" +
        '<td><span class="side ' + x.side + '">' + t("common." + x.side) + "</span></td>" +
        '<td><span class="pill">' + x.setup + "</span></td>" +
        '<td class="dim">' + F.date(x.date) + "</td>" +
        '<td class="right num ' + (x.r >= 0 ? "pos" : "neg") + '">' + (x.r >= 0 ? "+" : "−") + Math.abs(x.r).toFixed(2) + "R</td>" +
        '<td class="right num ' + (x.pnl >= 0 ? "pos" : "neg") + '" style="font-weight:600">' + F.money(x.pnl) + "</td>" +
      "</tr>"
    ).join("");
  }

  /* ------------------------------ calendar ------------------------------ */
  function renderCalendar() {
    const all = D.trades();
    const last = all[all.length - 1];
    const ref = last ? new Date(last.date + "T00:00:00Z") : new Date();
    const y = ref.getUTCFullYear(), m = ref.getUTCMonth();
    const s = D.stats(all);

    document.getElementById("calMonth").textContent =
      ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"][m] + " " + y;
    document.getElementById("calSub").textContent = t("dash.calendarSub");

    const first = new Date(Date.UTC(y, m, 1));
    const startDow = (first.getUTCDay() + 6) % 7; // Monday first
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const dows = ["D", "S", "C", "P", "J", "Sh", "Y"];

    let html = dows.map((d) => '<div class="dow">' + d + "</div>").join("");
    for (let i = 0; i < startDow; i++) html += '<div class="cal-cell off" style="background:transparent;border-color:transparent"></div>';

    let pos = 0, neg = 0, flat = 0;
    const vals = Object.values(s.dayMap);
    const maxAbs = Math.max(1, ...vals.map(Math.abs));

    for (let d = 1; d <= daysInMonth; d++) {
      const iso = new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
      const pnl = s.dayMap[iso];
      let cls = "";
      if (pnl === undefined) { flat++; }
      else if (pnl > 0) { pos++; const k = pnl / maxAbs; cls = k > 0.66 ? "p3" : k > 0.3 ? "p2" : "p"; }
      else if (pnl < 0) { neg++; const k = Math.abs(pnl) / maxAbs; cls = k > 0.66 ? "n3" : k > 0.3 ? "n2" : "n"; }
      else { flat++; }
      const tipv = pnl === undefined ? t("common.noResults") : F.money(pnl);
      html += '<div class="cal-cell ' + cls + '" data-tip="' + (pnl === undefined ? d : d + " · " + tipv) + '">' + d + "</div>";
    }
    const host = document.getElementById("calendar");
    host.innerHTML = html;
    host.querySelectorAll(".cal-cell[data-tip]").forEach((cell) => {
      cell.addEventListener("mousemove", (e) => {
        const tip = document.querySelector(".tooltip") || document.createElement("div");
        if (!tip.parentNode) { tip.className = "tooltip"; document.body.appendChild(tip); }
        tip.innerHTML = "<b>" + cell.dataset.tip + "</b>";
        tip.style.left = e.clientX + "px";
        tip.style.top = e.clientY + "px";
        tip.classList.add("show");
      });
      cell.addEventListener("mouseleave", () => C.hideTip());
    });

    document.getElementById("calPos").textContent = pos + " " + t("common.win").toLowerCase();
    document.getElementById("calNeg").textContent = neg + " " + t("common.loss").toLowerCase();
    document.getElementById("calFlat").textContent = flat + " ×";
  }

  /* ------------------------------ symbols ------------------------------ */
  function renderSymbols() {
    const s = D.stats(D.trades());
    const items = s.bySymbol.map((x) => ({ label: x.symbol.replace("USDT", ""), value: x.pnl, symbol: x.symbol }));
    C.bars(document.getElementById("symbolChart"), {
      items,
      height: 236,
      tipValue: (it) => it.symbol + " · " + F.money(it.value)
    });
  }

  /* ------------------------------ setups ------------------------------ */
  function renderSetups() {
    const s = D.stats(D.trades());
    const list = s.bySetup.slice().sort((a, b) => b.winRate - a.winRate);
    document.getElementById("setupList").innerHTML = list.map((x) =>
      '<div class="bd-row">' +
        '<span class="muted" style="font-size:11.5px">' + x.setup + "</span>" +
        '<div class="bd-track"><div class="bd-fill ' + (x.winRate < 50 ? "violet" : "") + '" style="width:' + Math.max(3, x.winRate).toFixed(0) + '%"></div></div>' +
        '<span class="bd-val">' + x.winRate.toFixed(0) + "%</span>" +
      "</div>"
    ).join("");
  }

  /* ------------------------------ discipline ------------------------------ */
  function renderDiscipline() {
    const s = D.stats(D.trades());
    const last50 = D.trades().slice(-50);
    const onPlan = last50.filter((x) => x.r >= -1 && x.pnl > -200).length;
    const score = Math.round((onPlan / Math.max(1, last50.length)) * 100);
    document.getElementById("discScore").innerHTML = score + "<small>/100</small>";
    document.getElementById("discFill").style.width = score + "%";
    const badge = document.getElementById("discBadge");
    badge.textContent = score >= 80 ? "A" : score >= 60 ? "B" : "C";
    badge.className = "badge " + (score >= 80 ? "green" : score >= 60 ? "amber" : "red");

    const rows = [
      [t("kpi.maxDd"), "−" + s.maxDdPct.toFixed(1) + "%", "neg"],
      [t("trades.winStreak"), s.bestWinStreak + " ×", "pos"],
      ["Risk ≤ 1%", Math.round((last50.filter((x) => x.risk <= 200).length / Math.max(1, last50.length)) * 100) + "%", ""],
      [t("kpi.trades"), s.n, ""]
    ];
    document.getElementById("discRows").innerHTML = rows.map((r) =>
      '<div class="stat-row"><span>' + r[0] + '</span><b class="' + r[2] + '">' + r[1] + "</b></div>"
    ).join("");
  }

  /* ------------------------------ boot ------------------------------ */
  function renderAll() {
    renderKpis();
    renderEquity();
    renderWinLoss();
    renderRecent();
    renderCalendar();
    renderSymbols();
    renderSetups();
    renderDiscipline();
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderAll();
    document.querySelectorAll("#rangeSeg button").forEach((b) => {
      b.addEventListener("click", () => {
        document.querySelectorAll("#rangeSeg button").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        rangeDays = parseInt(b.dataset.days, 10);
        renderEquity();
      });
    });
    document.addEventListener("langchange", () => {
      renderKpis(); renderEquity(); renderWinLoss(); renderRecent();
      renderCalendar(); renderSetups(); renderDiscipline();
    });
  });
})();
