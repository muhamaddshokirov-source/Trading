/* ============================================================
   Analytics page
   ============================================================ */
(function () {
  const D = window.NX.data;
  const C = window.NX.chart;
  const F = window.NX.fmt;
  const t = (k, v) => window.NX.i18n.t(k, v);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAY_KEYS = ["analytics.mon", "analytics.tue", "analytics.wed", "analytics.thu", "analytics.fri", "analytics.sat", "analytics.sun"];

  function renderKpis() {
    const s = D.stats(D.trades());
    const cards = [
      { label: t("kpi.winRate"), value: s.winRate.toFixed(1) + "%", cls: "pos" },
      { label: t("kpi.maxDd"), value: "−" + s.maxDdPct.toFixed(1) + "%", cls: "neg" },
      { label: t("kpi.avgR"), value: (s.avgR >= 0 ? "+" : "−") + Math.abs(s.avgR).toFixed(2) + "R", cls: s.avgR >= 0 ? "pos" : "neg" },
      { label: t("trades.winStreak"), value: s.bestWinStreak + " ×", cls: "pos" }
    ];
    document.getElementById("anaKpis").innerHTML = cards.map((c, i) =>
      '<div class="card kpi reveal in" style="transition-delay:' + i * 40 + 'ms"><div class="label"><span>' + c.label + "</span></div>" +
      '<div class="value num ' + c.cls + '">' + c.value + "</div>" +
      '<div class="foot"><span>' + t("common.demo") + "</span></div></div>"
    ).join("");
  }

  function monthly() {
    const trades = D.trades();
    const map = {};
    trades.forEach((x) => {
      const key = x.date.slice(0, 7);
      map[key] = (map[key] || 0) + x.pnl;
    });
    const keys = Object.keys(map).sort().slice(-8);
    return {
      items: keys.map((k) => ({
        label: MONTHS[parseInt(k.slice(5, 7), 10) - 1],
        value: map[k]
      }))
    };
  }

  function renderMonth() {
    C.bars(document.getElementById("monthChart"), {
      ...monthly(),
      height: 250,
      barWidth: 34,
      tipValue: (it) => F.money(it.value)
    });
  }

  function renderWeekday() {
    const s = D.stats(D.trades());
    const order = [1, 2, 3, 4, 5, 6, 0];
    const items = order.map((d, i) => ({ label: t(DAY_KEYS[i]), value: s.byWeekday[d] }));
    C.bars(document.getElementById("weekdayChart"), { items, height: 250, barWidth: 26, tipValue: (it) => F.money(it.value) });
  }

  function renderR() {
    const trades = D.trades();
    const bins = [
      { label: "<−2R", test: (r) => r < -2, color: "#ff5470" },
      { label: "−2..−1", test: (r) => r >= -2 && r < -1, color: "#ff6d85" },
      { label: "−1..0", test: (r) => r >= -1 && r < 0, color: "#ff9aab" },
      { label: "0..1", test: (r) => r >= 0 && r < 1, color: "#6cf5c6" },
      { label: "1..2", test: (r) => r >= 1 && r < 2, color: "#2fe9ad" },
      { label: "2..3", test: (r) => r >= 2 && r < 3, color: "#14f0a4" },
      { label: ">3R", test: (r) => r >= 3, color: "#00c98a" }
    ];
    const items = bins.map((b) => ({
      label: b.label,
      value: trades.filter((x) => b.test(x.r)).length,
      color: b.color
    }));
    C.bars(document.getElementById("rChart"), {
      items,
      height: 230,
      barWidth: 30,
      tipValue: (it) => it.value + " " + t("kpi.trades").toLowerCase()
    });
  }

  function renderSide() {
    const trades = D.trades();
    const long = trades.filter((x) => x.side === "long");
    const short = trades.filter((x) => x.side === "short");
    const sum = (l) => l.reduce((a, b) => a + b.pnl, 0);
    const wr = (l) => (l.filter((x) => x.pnl > 0).length / Math.max(1, l.length)) * 100;

    C.donut(document.getElementById("sideChart"), {
      height: 180,
      thickness: 14,
      parts: [
        { value: long.length, color: "#14f0a4", label: t("common.long") },
        { value: short.length, color: "#8b5cff", label: t("common.short") }
      ],
      centerValue: long.length + "/" + short.length,
      centerLabel: t("common.long") + " / " + t("common.short")
    });

    document.getElementById("sideStats").innerHTML = [
      [t("common.long") + " · " + t("analytics.wr"), wr(long).toFixed(0) + "%", "pos"],
      [t("common.long") + " · " + t("analytics.net"), F.money(sum(long)), sum(long) >= 0 ? "pos" : "neg"],
      [t("common.short") + " · " + t("analytics.wr"), wr(short).toFixed(0) + "%", ""],
      [t("common.short") + " · " + t("analytics.net"), F.money(sum(short)), sum(short) >= 0 ? "pos" : "neg"]
    ].map((r) => '<div class="stat-row"><span>' + r[0] + '</span><b class="' + r[2] + '">' + r[1] + "</b></div>").join("");
  }

  function renderDrawdown() {
    const s = D.stats(D.trades());
    const pts = s.ddSeries.filter((_, i) => i % 1 === 0).map((p) => ({
      x: p.i,
      y: p.dd,
      label: F.date(p.date, "md")
    }));
    C.line(document.getElementById("ddChart"), {
      points: pts,
      height: 230,
      color: "#ff5470",
      tipValue: (p) => p.y.toFixed(2) + "%"
    });
    document.getElementById("ddBadge").textContent = t("kpi.maxDd") + " · −" + s.maxDdPct.toFixed(1) + "%";
  }

  function renderBestWorst() {
    const trades = D.trades();
    const sorted = trades.slice().sort((a, b) => b.pnl - a.pnl);
    const top = sorted.slice(0, 3);
    const bottom = sorted.slice(-3).reverse();

    const row = (x, i, kind) =>
      '<div class="entry" style="padding:12px 14px;display:flex;align-items:center;gap:12px">' +
        '<span class="badge ' + (kind === "win" ? "green" : "red") + '">#' + (i + 1) + "</span>" +
        '<div style="flex:1"><div style="font-size:12.5px;font-weight:600">' + x.symbol + " · " + t("common." + x.side) + "</div>" +
        '<div class="dim" style="font-size:11px">' + F.date(x.date) + " · " + x.setup + " · " + (x.r >= 0 ? "+" : "−") + Math.abs(x.r).toFixed(2) + "R</div></div>" +
        '<b class="num ' + (x.pnl >= 0 ? "pos" : "neg") + '" style="font-size:13.5px">' + F.money(x.pnl) + "</b>" +
      "</div>";

    document.getElementById("bestWorst").innerHTML =
      top.map((x, i) => row(x, i, "win")).join("") +
      bottom.map((x, i) => row(x, i, "loss")).join("");
  }

  function renderSetups() {
    const s = D.stats(D.trades());
    const list = s.bySetup.slice().sort((a, b) => b.pnl - a.pnl);
    document.getElementById("setupRows").innerHTML = list.map((x) =>
      "<tr>" +
        '<td><b>' + x.setup + "</b></td>" +
        '<td class="right num muted">' + x.n + "</td>" +
        '<td class="right num">' + x.winRate.toFixed(0) + "%</td>" +
        '<td class="right num ' + (x.avgR >= 0 ? "pos" : "neg") + '">' + (x.avgR >= 0 ? "+" : "−") + Math.abs(x.avgR).toFixed(2) + "R</td>" +
        '<td class="right num ' + (x.pnl >= 0 ? "pos" : "neg") + '" style="font-weight:650">' + F.money(x.pnl) + "</td>" +
        '<td><div class="mini-bar" style="width:100%"><i style="width:' + Math.max(3, x.winRate).toFixed(0) + "%;background:" + (x.winRate >= 50 ? "var(--green)" : "var(--violet)") + '"></i></div></td>' +
      "</tr>"
    ).join("");
  }

  function renderInsight() {
    const s = D.stats(D.trades());
    const worstSym = s.bySymbol[s.bySymbol.length - 1];
    const bestSetup = s.bySetup.slice().sort((a, b) => b.winRate - a.winRate)[0];
    const order = [1, 2, 3, 4, 5];
    let bestDayIdx = 1;
    order.forEach((d) => { if (s.byWeekday[d] > s.byWeekday[bestDayIdx]) bestDayIdx = d; });
    const dayNames = { 1: t("analytics.mon"), 2: t("analytics.tue"), 3: t("analytics.wed"), 4: t("analytics.thu"), 5: t("analytics.fri") };
    document.getElementById("insightText").textContent = t("analytics.insightText", {
      worstSym: worstSym ? worstSym.symbol : "—",
      bestSetup: bestSetup ? bestSetup.setup : "—",
      wr: bestSetup ? bestSetup.winRate.toFixed(0) : "0",
      bestDay: dayNames[bestDayIdx] || t("analytics.mon")
    });
  }

  function renderAll() {
    renderKpis();
    renderMonth();
    renderWeekday();
    renderR();
    renderSide();
    renderDrawdown();
    renderBestWorst();
    renderSetups();
    renderInsight();
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderAll();
    document.addEventListener("langchange", renderAll);
  });
})();
