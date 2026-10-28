/* ============================================================
   Journal page
   ============================================================ */
(function () {
  const D = window.NX.data;
  const F = window.NX.fmt;
  const t = (k, v) => window.NX.i18n.t(k, v);
  const lang = () => window.NX.i18n.lang;

  const MOODS = {
    focused: { icon: "🎯", uz: "Fokusda", en: "Focused", color: "green" },
    calm: { icon: "😌", uz: "Xotirjam", en: "Calm", color: "green" },
    confident: { icon: "💪", uz: "Ishonchli", en: "Confident", color: "violet" },
    tired: { icon: "😴", uz: "Charchagan", en: "Tired", color: "amber" },
    tilted: { icon: "😤", uz: "Tilt", en: "Tilted", color: "red" }
  };

  const state = { q: "", tag: "all" };
  const todayKey = () => new Date().toISOString().slice(0, 10);

  function text(field) {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[lang()] || field.uz || field.en || "";
  }

  function allEntries() {
    return D.journal();
  }

  function renderEntries() {
    let list = allEntries();
    if (state.tag !== "all") list = list.filter((e) => (e.tags || []).includes(state.tag));
    if (state.q) {
      const q = state.q.toLowerCase();
      list = list.filter((e) => (text(e.title) + " " + text(e.body)).toLowerCase().includes(q));
    }

    const host = document.getElementById("entries");
    if (!list.length) {
      host.innerHTML = '<div class="card empty">' + t("common.emptyJournal") + "</div>";
      return;
    }
    host.innerHTML = list.map((e) => {
      const mood = MOODS[e.mood] || MOODS.calm;
      return '<article class="entry reveal in">' +
        '<div class="entry-top">' +
          '<span class="badge ' + mood.color + '">' + mood.icon + " " + (lang() === "uz" ? mood.uz : mood.en) + "</span>" +
          "<h4>" + text(e.title) + "</h4>" +
          '<span class="date">' + F.date(e.date) + "</span>" +
        "</div>" +
        "<p>" + text(e.body) + "</p>" +
        '<div class="tags">' + (e.tags || []).map((x) => '<span class="pill">#' + x + "</span>").join("") + "</div>" +
      "</article>";
    }).join("");
  }

  function renderTags() {
    const tags = Array.from(new Set(allEntries().flatMap((e) => e.tags || [])));
    document.getElementById("tagSeg").innerHTML =
      '<button data-tag="all" class="' + (state.tag === "all" ? "on" : "") + '">' + t("common.all") + "</button>" +
      tags.map((x) => '<button data-tag="' + x + '" class="' + (state.tag === x ? "on" : "") + '">#' + x + "</button>").join("");
    document.querySelectorAll("#tagSeg button").forEach((b) => {
      b.addEventListener("click", () => {
        state.tag = b.dataset.tag;
        renderTags();
        renderEntries();
      });
    });
  }

  function renderStats() {
    const list = allEntries();
    const words = list.reduce((s, e) => s + text(e.body).split(/\s+/).filter(Boolean).length, 0);
    const now = new Date();
    const activeDays = new Set(list.filter((e) => (now - new Date(e.date + "T00:00:00Z")) / 86400000 <= 30).map((e) => e.date)).size;
    const moods = {};
    list.forEach((e) => { moods[e.mood] = (moods[e.mood] || 0) + 1; });
    const topMood = Object.keys(moods).sort((a, b) => moods[b] - moods[a])[0] || "calm";

    document.getElementById("statSub").textContent = t("journal.entries", { n: list.length });
    document.getElementById("jStats").innerHTML = [
      [t("journal.entriesLabel"), list.length, ""],
      [t("journal.activeDays"), activeDays + " 🔥", "pos"],
      [t("journal.words"), words.toLocaleString("en-US"), ""],
      [t("journal.mood"), MOODS[topMood].icon + " " + (lang() === "uz" ? MOODS[topMood].uz : MOODS[topMood].en), ""],
      [t("journal.discipline"), document.getElementById("rulesBadge").textContent, "pos"]
    ].map((r) => '<div class="stat-row"><span>' + r[0] + '</span><b class="' + r[2] + '">' + r[1] + "</b></div>").join("");
  }

  const RULE_KEYS = ["journal.rule1", "journal.rule2", "journal.rule3", "journal.rule4"];

  function rulesState() {
    try {
      const raw = JSON.parse(localStorage.getItem("nexora.rules") || "{}");
      if (raw.date !== todayKey()) return [];
      return raw.checked || [];
    } catch (e) { return []; }
  }
  function saveRules(checked) {
    localStorage.setItem("nexora.rules", JSON.stringify({ date: todayKey(), checked }));
  }

  function renderRules() {
    const checked = rulesState();
    document.getElementById("rules").innerHTML = RULE_KEYS.map((k, i) =>
      '<label class="check-row" style="cursor:pointer">' +
        '<span style="display:flex;align-items:center;gap:9px">' +
          '<input type="checkbox" class="rule-cb" data-rule="' + i + '" ' + (checked.includes(i) ? "checked" : "") + ">" +
          '<span>' + t(k) + "</span>" +
        "</span>" +
      "</label>"
    ).join("");

    document.querySelectorAll("[data-rule]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const set = new Set(rulesState());
        const i = parseInt(cb.dataset.rule, 10);
        if (cb.checked) set.add(i); else set.delete(i);
        saveRules(Array.from(set));
        renderRules();
        renderStats();
      });
    });

    const badge = document.getElementById("rulesBadge");
    badge.textContent = checked.length + "/4";
    badge.className = "badge " + (checked.length === 4 ? "green" : checked.length >= 2 ? "amber" : "red");
    document.getElementById("rulesSub").textContent = todayKey();
  }

  function renderMood() {
    const saved = localStorage.getItem("nexora.mood-" + todayKey()) || "";
    document.querySelectorAll("#moodSeg button").forEach((b) => {
      b.style.fontSize = "17px";
      b.classList.toggle("on", b.dataset.mood === saved);
      b.addEventListener("click", () => {
        localStorage.setItem("nexora.mood-" + todayKey(), b.dataset.mood);
        renderMood();
      }, { once: true });
    });
    const hint = saved && MOODS[saved] ? MOODS[saved] : null;
    document.getElementById("moodHint").textContent = hint
      ? (lang() === "uz" ? "Bugungi kayfiyat: " : "Today's mood: ") + (lang() === "uz" ? hint.uz : hint.en)
      : (lang() === "uz" ? "Bugungi holatingizni belgilang — bu statistika uchun muhim." : "Log how you feel today — it matters for your stats.");
  }

  /* ------------------------------ new entry ------------------------------ */
  function openEntryModal() {
    if (document.querySelector(".overlay.journal")) {
      document.querySelector(".overlay.journal").classList.add("show");
      return;
    }
    const ov = document.createElement("div");
    ov.className = "overlay journal";
    ov.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true">' +
        '<h3>' + t("journal.newTitle") + "</h3>" +
        '<p class="modal-sub">' + todayKey() + "</p>" +
        '<form id="jForm">' +
          '<div class="form-grid">' +
            '<div class="field full"><label>' + t("journal.titleField") + '</label><input name="title" required></div>' +
            '<div class="field full"><label>' + t("journal.bodyField") + '</label><textarea name="body" rows="4" required></textarea></div>' +
            '<div class="field"><label>' + t("journal.mood") + '</label><select name="mood">' +
              Object.keys(MOODS).map((m) => '<option value="' + m + '">' + MOODS[m].icon + " " + (lang() === "uz" ? MOODS[m].uz : MOODS[m].en) + "</option>").join("") +
            "</select></div>" +
            '<div class="field"><label>' + t("journal.tags") + '</label><input name="tags" placeholder="plan, risk"></div>' +
          "</div>" +
          '<div class="modal-foot">' +
            '<button type="button" class="btn" id="jCancel">' + t("common.cancel") + "</button>" +
            '<button type="submit" class="btn btn-primary">' + t("common.save") + "</button>" +
          "</div>" +
        "</form>" +
      "</div>";
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add("show"));

    const close = () => ov.classList.remove("show");
    ov.querySelector("#jCancel").addEventListener("click", close);
    ov.addEventListener("click", (e) => { if (e.target === ov) close(); });

    ov.querySelector("#jForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const title = String(f.get("title") || "").trim();
      const body = String(f.get("body") || "").trim();
      if (!title || !body) return;
      D.addJournal({
        id: "JU-" + Date.now(),
        date: todayKey(),
        mood: f.get("mood"),
        title,
        body,
        tags: String(f.get("tags") || "").split(",").map((s) => s.trim()).filter(Boolean)
      });
      close();
      window.NX.ui.toast(t("journal.saved"));
      renderTags(); renderEntries(); renderStats();
    });
  }

  function renderAll() {
    renderTags();
    renderEntries();
    renderRules();
    renderStats();
    renderMood();
    document.getElementById("newEntryBtn").innerHTML = window.NX.ui.ICONS.plus + "<span>" + t("common.addNote") + "</span>";
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderAll();
    document.getElementById("newEntryBtn").addEventListener("click", openEntryModal);
    document.getElementById("jq").addEventListener("input", (e) => {
      state.q = e.target.value.trim();
      renderEntries();
    });
    document.addEventListener("langchange", () => {
      renderAll();
      const btn = document.getElementById("newEntryBtn");
      btn.innerHTML = window.NX.ui.ICONS.plus + "<span>" + t("common.addNote") + "</span>";
    });
  });
})();
