/* ============================================================
   Demo dataset + statistics engine
   ============================================================ */
(function () {
  const START_BALANCE = 25000;

  /* --- deterministic PRNG (same data on every reload) --- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const SYMBOLS = [
    { s: "BTCUSDT", base: 67420, step: 55, kind: "Crypto" },
    { s: "ETHUSDT", base: 3320, step: 4.5, kind: "Crypto" },
    { s: "SOLUSDT", base: 168, step: 0.9, kind: "Crypto" },
    { s: "XAUUSD", base: 2412, step: 3.2, kind: "Metals" },
    { s: "NAS100", base: 19840, step: 22, kind: "Indices" },
    { s: "EURUSD", base: 1.0865, step: 0.0016, kind: "Forex" },
    { s: "GBPUSD", base: 1.2734, step: 0.0019, kind: "Forex" },
    { s: "AAPL", base: 196.4, step: 0.7, kind: "Stocks" }
  ];

  const SETUPS = ["Breakout", "Trend follow", "Pullback", "Reversal", "Range", "News"];
  const SETUP_BIAS = { Breakout: 0.56, "Trend follow": 0.62, Pullback: 0.52, Reversal: 0.42, Range: 0.4, News: 0.3 };

  const WIN_NOTES = [
    "Waited for the retest, entered on the higher low. Textbook execution.",
    "Moved stop to break-even early — gave the trade room to run.",
    "Checked the higher timeframe first, so the entry was calm.",
    "Partial at 1R, trail on the rest. Felt easy.",
    "Order flow confirmed the break. Size was correct.",
    "Sat on hands for 40 minutes, then the setup came to me."
  ];
  const LOSS_NOTES = [
    "Entered before the confirmation candle. Impatience, not the market.",
    "Ignored my daily loss limit and took one more. Stop it.",
    "Chased an extended move, stop hit instantly.",
    "News spike took the stop out — should not have been in the trade.",
    "Size was 1.8% of the account. Broke the 1% rule.",
    "Wanted to win it back. Tilted after the earlier loss."
  ];

  function buildTrades() {
    const rnd = mulberry32(20261028);
    const trades = [];
    let balance = START_BALANCE;
    let cursor = new Date(Date.UTC(2026, 1, 3)); // 3 Feb 2026
    const end = new Date(Date.UTC(2026, 9, 26)); // 26 Oct 2026
    let id = 1;

    while (cursor <= end) {
      const dow = cursor.getUTCDay();
      const active = dow !== 0 && dow !== 6 ? rnd() < 0.78 : rnd() < 0.2;
      if (active) {
        const n = rnd() < 0.28 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          const meta = SYMBOLS[Math.floor(rnd() * SYMBOLS.length)];
          const setup = SETUPS[Math.floor(rnd() * SETUPS.length)];
          const skill = SETUP_BIAS[setup];
          const isWin = rnd() < skill;
          let r;
          if (isWin) {
            r = 0.55 + Math.pow(rnd(), 1.45) * 2.1;
            if (rnd() < 0.05) r += 1.9; // occasional runner
            r = Math.round(r * 100) / 100;
          } else {
            r = -(0.5 + Math.pow(rnd(), 1.25) * 1.15);
            if (rnd() < 0.06) r = -2.2;
            r = Math.round(r * 100) / 100;
          }
          const risk = Math.round((95 + rnd() * 175) / 5) * 5;
          const pnl = Math.round(r * risk);
          const side = rnd() < 0.6 ? "long" : "short";
          const entry = +(meta.base * (0.9 + rnd() * 0.2)).toFixed(meta.base > 1000 ? 1 : meta.base > 10 ? 2 : 4);
          const dir = side === "long" ? 1 : -1;
          const exit = +(entry * (1 + dir * r * 0.011)).toFixed(entry > 1000 ? 1 : entry > 10 ? 2 : 4);
          const qty = Math.max(0.01, +(risk / (entry * 0.012)).toFixed(entry > 1000 ? 4 : 2));
          balance += pnl;

          trades.push({
            id: "TR-" + String(id++).padStart(4, "0"),
            symbol: meta.s,
            kind: meta.kind,
            side,
            setup,
            date: cursor.toISOString().slice(0, 10),
            entry,
            exit,
            qty,
            risk,
            r,
            pnl,
            note: isWin ? WIN_NOTES[Math.floor(rnd() * WIN_NOTES.length)] : LOSS_NOTES[Math.floor(rnd() * LOSS_NOTES.length)]
          });
        }
      }
      cursor = new Date(cursor.getTime() + 86400000);
    }
    return trades;
  }

  const DEMO_TRADES = buildTrades();
  const USER_KEY = "nexora.userTrades";
  const JOURNAL_KEY = "nexora.journal";

  function userTrades() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || []; } catch (e) { return []; }
  }

  function allTrades() {
    const merged = DEMO_TRADES.concat(userTrades());
    merged.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : String(a.id).localeCompare(String(b.id))));
    return merged;
  }

  /* ------------------------- statistics ------------------------- */
  function stats(list) {
    const t = list.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const n = t.length;
    const wins = t.filter((x) => x.pnl > 0);
    const losses = t.filter((x) => x.pnl <= 0);
    const grossProfit = wins.reduce((s, x) => s + x.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, x) => s + x.pnl, 0));
    const net = grossProfit - grossLoss;
    const rSum = t.reduce((s, x) => s + x.r, 0);

    // equity + drawdown
    let bal = START_BALANCE, peak = START_BALANCE, maxDd = 0, maxDdPct = 0;
    const equity = [{ i: 0, date: t[0] ? t[0].date : "", balance: bal }];
    const ddSeries = [];
    let streak = 0, bestWinStreak = 0, curWin = 0, curLossStreak = 0, bestLossStreak = 0;
    let dayMap = {};

    t.forEach((x, i) => {
      bal += x.pnl;
      peak = Math.max(peak, bal);
      const dd = peak - bal;
      if (dd > maxDd) { maxDd = dd; maxDdPct = (dd / peak) * 100; }
      equity.push({ i: i + 1, date: x.date, balance: bal, pnl: x.pnl, symbol: x.symbol });
      ddSeries.push({ i: i + 1, date: x.date, dd: -((peak - bal) / peak) * 100 });

      if (x.pnl > 0) { curWin++; curLossStreak = 0; } else { curLossStreak++; curWin = 0; }
      bestWinStreak = Math.max(bestWinStreak, curWin);
      bestLossStreak = Math.max(bestLossStreak, curLossStreak);

      dayMap[x.date] = (dayMap[x.date] || 0) + x.pnl;
    });

    streak = 0;
    for (let i = n - 1; i >= 0; i--) {
      const same = streak === 0 ? true : (t[i].pnl > 0) === (t[n - 1].pnl > 0);
      if (!same) break;
      streak++;
    }

    const sorted = t.slice().sort((a, b) => b.pnl - a.pnl);
    const bySymbol = {};
    const bySetup = {};
    const byWeekday = [0, 0, 0, 0, 0, 0, 0];
    t.forEach((x) => {
      bySymbol[x.symbol] = bySymbol[x.symbol] || { symbol: x.symbol, pnl: 0, n: 0, wins: 0, r: 0 };
      bySymbol[x.symbol].pnl += x.pnl;
      bySymbol[x.symbol].n++;
      bySymbol[x.symbol].wins += x.pnl > 0 ? 1 : 0;
      bySymbol[x.symbol].r += x.r;

      bySetup[x.setup] = bySetup[x.setup] || { setup: x.setup, pnl: 0, n: 0, wins: 0, r: 0 };
      bySetup[x.setup].pnl += x.pnl;
      bySetup[x.setup].n++;
      bySetup[x.setup].wins += x.pnl > 0 ? 1 : 0;
      bySetup[x.setup].r += x.r;

      byWeekday[new Date(x.date + "T00:00:00Z").getUTCDay()] += x.pnl;
    });

    const setupList = Object.values(bySetup).map((s) => ({ ...s, winRate: (s.wins / s.n) * 100, avgR: s.r / s.n }));
    const symbolList = Object.values(bySymbol).sort((a, b) => b.pnl - a.pnl);

    return {
      trades: t,
      n,
      wins: wins.length,
      losses: losses.length,
      net,
      winRate: n ? (wins.length / n) * 100 : 0,
      grossProfit,
      grossLoss,
      profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit ? 99 : 0,
      avgWin: wins.length ? grossProfit / wins.length : 0,
      avgLoss: losses.length ? grossLoss / losses.length : 0,
      avgR: n ? rSum / n : 0,
      expectancy: n ? net / n : 0,
      maxDd,
      maxDdPct,
      equity,
      ddSeries,
      bestWinStreak,
      bestLossStreak,
      streak,
      streakIsWin: n ? t[n - 1].pnl > 0 : true,
      best: sorted[0] || null,
      worst: sorted[sorted.length - 1] || null,
      bySymbol: symbolList,
      bySetup: setupList,
      byWeekday,
      dayMap,
      balance: START_BALANCE + net,
      startBalance: START_BALANCE
    };
  }

  /* --------------------------- journal --------------------------- */
  const DEMO_JOURNAL = [
    {
      id: "J-1", date: "2026-10-26", mood: "focused",
      title: { uz: "Sabr — bugungi eng yaxshi savdo", en: "Patience was the best trade today" },
      body: {
        uz: "45 daqiqa hech narsa qilmadim va bu to'g'ri qaror edi. Setup paydo bo'lganda kirish aniq va xotirjam bo'ldi. Reja tashqarisida kirishga urinmaganim uchun bugun eng yaxshi kunim bo'ldi.",
        en: "I did nothing for 45 minutes and that was the right decision. When the setup finally showed up, the entry was clear and calm. Not forcing a single off-plan trade made this my best day this month."
      },
      tags: ["patience", "plan"]
    },
    {
      id: "J-2", date: "2026-10-23", mood: "tilted",
      title: { uz: "Tiltni tan olish", en: "Recognising tilt" },
      body: {
        uz: "Ikki zarardan keyin hajmni oshirdim. Bu klassik qasos savdosi edi. Qoida: ketma-ket 2 zarardan keyin 30 daqiqa tanaffus — ekrandan uzoqlashaman.",
        en: "I doubled size after two losses. Classic revenge trade. New rule: after two consecutive losses I step away from the screen for 30 minutes, no exceptions."
      },
      tags: ["tilt", "risk"]
    },
    {
      id: "J-3", date: "2026-10-19", mood: "calm",
      title: { uz: "Kamroq savdo — ko'proq natija", en: "Fewer trades, better results" },
      body: {
        uz: "Bu hafta faqat 6 ta savdo qildim, lekin hafta +2.4R bilan yopildi. Sifat miqdordan muhim. Eng yaxshi setup'lar faqat 2 ta edi.",
        en: "Only six trades this week, yet it closed at +2.4R. Quality beats quantity. Two setups carried the entire week."
      },
      tags: ["quality", "review"]
    },
    {
      id: "J-4", date: "2026-10-14", mood: "focused",
      title: { uz: "Yangiliklar paytida savdo qilmaslik", en: "Sitting out the news" },
      body: {
        uz: "CPI e'lon qilindi. Odatda shu paytda kirib zarar ko'rardim. Bugun kutdim va volatillik tugagach kirish yaxshi natija berdi.",
        en: "CPI dropped. In the past I'd jump in and get stopped out. Today I waited, let volatility settle, and the post-news entry worked perfectly."
      },
      tags: ["news", "patience"]
    },
    {
      id: "J-5", date: "2026-10-09", mood: "tired",
      title: { uz: "Charchoq — yashirin xatar", en: "Fatigue is a hidden risk" },
      body: {
        uz: "Yomon uyqudan keyin savdo qildim. Natija: uchta impulsiv kirish. Charchoq paytida savdo qilmaslikni qoidaga kiritaman.",
        en: "Traded after a bad night of sleep. Result: three impulsive entries. \"No trading when tired\" is now a hard rule, not a suggestion."
      },
      tags: ["psychology", "risk"]
    },
    {
      id: "J-6", date: "2026-10-02", mood: "confident",
      title: { uz: "Oylik ko'rik: sentabr", en: "Monthly review: September" },
      body: {
        uz: "Sof natija +18.6%, profit faktor 1.9. Eng katta xato — EURUSD'da trendga qarshi savdo. Keyingi oy faqat HTF yo'nalishi bo'yicha ishlayman.",
        en: "Net +18.6% for September, profit factor 1.9. Biggest mistake: counter-trend EURUSD trade. Next month I only trade with the higher-timeframe direction."
      },
      tags: ["review", "monthly"]
    },
    {
      id: "J-7", date: "2026-09-25", mood: "calm",
      title: { uz: "Birinchi marta to'liq reja bilan", en: "First fully planned week" },
      body: {
        uz: "Har kuni ertalab reja yozdim: darajalar, risk, maksimal savdo soni. Natija — 0 impulsiv savdo. Bu his qilishni xohlayman.",
        en: "Every morning I wrote the plan: levels, risk, max number of trades. Result — zero impulsive trades. I want to feel this way every week."
      },
      tags: ["plan", "discipline"]
    }
  ];

  function journal() {
    let custom = [];
    try { custom = JSON.parse(localStorage.getItem(JOURNAL_KEY)) || []; } catch (e) {}
    return custom.concat(DEMO_JOURNAL).sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  function addJournal(entry) {
    let custom = [];
    try { custom = JSON.parse(localStorage.getItem(JOURNAL_KEY)) || []; } catch (e) {}
    custom.unshift(entry);
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(custom));
  }

  function addTrade(trade) {
    const list = userTrades();
    list.push(trade);
    localStorage.setItem(USER_KEY, JSON.stringify(list));
  }

  window.NX = window.NX || {};
  window.NX.data = {
    START_BALANCE,
    SETUPS,
    SYMBOLS: SYMBOLS.map((s) => s.s),
    trades: allTrades,
    stats,
    journal,
    addJournal,
    addTrade,
    demoCount: DEMO_TRADES.length
  };
})();
