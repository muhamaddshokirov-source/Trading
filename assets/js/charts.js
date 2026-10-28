/* ============================================================
   Tiny SVG chart library — no dependencies
   ============================================================ */
(function () {
  const NS = "http://www.w3.org/2000/svg";

  /* ----------------------------- format ----------------------------- */
  const fmt = {
    money(n, opts) {
      const o = opts || {};
      const sign = n > 0 ? (o.plus === false ? "" : "+") : n < 0 ? "−" : "";
      const abs = Math.abs(n);
      const body = abs >= 1000
        ? abs.toLocaleString("en-US", { maximumFractionDigits: 0 })
        : abs.toLocaleString("en-US", { maximumFractionDigits: 2 });
      return sign + (o.currency === false ? "" : "$") + body;
    },
    signed(n) { return (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n); },
    pct(n, d) { return (n >= 0 ? "" : "−") + Math.abs(n).toFixed(d === undefined ? 1 : d) + "%"; },
    compact(n) {
      const a = Math.abs(n);
      if (a >= 1e6) return (n / 1e6).toFixed(1) + "M";
      if (a >= 1e3) return (n / 1e3).toFixed(1) + "k";
      return String(Math.round(n));
    },
    date(iso, style) {
      const d = new Date(iso + "T00:00:00Z");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      if (style === "md") return months[d.getUTCMonth()] + " " + d.getUTCDate();
      if (style === "d") return String(d.getUTCDate());
      return d.getUTCDate() + " " + months[d.getUTCMonth()];
    }
  };

  /* --------------------------- tooltip --------------------------- */
  let tipEl = null;
  function tip() {
    if (!tipEl) {
      tipEl = document.createElement("div");
      tipEl.className = "tooltip";
      document.body.appendChild(tipEl);
    }
    return tipEl;
  }
  function showTip(html, x, y) {
    const el = tip();
    el.innerHTML = html;
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.classList.add("show");
  }
  function hideTip() { if (tipEl) tipEl.classList.remove("show"); }

  /* ---------------------------- helpers ---------------------------- */
  function path(points) {
    return points.map((p, i) => (i ? "L" : "M") + p[0].toFixed(2) + " " + p[1].toFixed(2)).join(" ");
  }
  function smoothPath(points) {
    if (points.length < 3) return path(points);
    let d = "M" + points[0][0].toFixed(2) + " " + points[0][1].toFixed(2);
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
      const t = 0.18;
      const c1x = p1[0] + (p2[0] - p0[0]) * t / 2, c1y = p1[1] + (p2[1] - p0[1]) * t / 2;
      const c2x = p2[0] - (p3[0] - p1[0]) * t / 2, c2y = p2[1] - (p3[1] - p1[1]) * t / 2;
      d += " C" + c1x.toFixed(2) + " " + c1y.toFixed(2) + " " + c2x.toFixed(2) + " " + c2y.toFixed(2) + " " + p2[0].toFixed(2) + " " + p2[1].toFixed(2);
    }
    return d;
  }
  function el(tag, attrs, inner) {
    const node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach((k) => node.setAttribute(k, attrs[k]));
    if (inner !== undefined) node.innerHTML = inner;
    return node;
  }
  function clear(host) { while (host.firstChild) host.removeChild(host.firstChild); }
  function mount(host, svg, height) {
    clear(host);
    svg.setAttribute("class", "chart");
    svg.setAttribute("viewBox", "0 0 " + host.clientWidth + " " + height);
    svg.setAttribute("height", height);
    svg.setAttribute("width", host.clientWidth);
    host.appendChild(svg);
  }
  function reflow(host, render) {
    render();
    if (host._ro) host._ro.disconnect();
    let raf;
    host._ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (host.clientWidth && host.clientWidth !== host._w) { host._w = host.clientWidth; render(); }
      });
    });
    host._w = host.clientWidth;
    host._ro.observe(host);
  }

  /* ---------------------------- line / area ---------------------------- */
  function line(host, opts) {
    const render = () => {
      const W = host.clientWidth || 600;
      const H = opts.height || 230;
      const pad = { t: 14, r: 12, b: 24, l: 46 };
      const pts = opts.points;
      if (!pts || pts.length < 2) { clear(host); return; }
      const vals = pts.map((p) => p.y);
      let min = Math.min(...vals), max = Math.max(...vals);
      const span = max - min || 1;
      min -= span * 0.12; max += span * 0.12;
      const x = (i) => pad.l + (i / (pts.length - 1)) * (W - pad.l - pad.r);
      const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);

      const svg = el("svg", {});
      const defs = el("defs", {});
      const gid = "g" + Math.random().toString(36).slice(2, 8);
      const color = opts.color || "#14f0a4";
      defs.innerHTML =
        '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.34"/>' +
        '<stop offset="70%" stop-color="' + color + '" stop-opacity="0.05"/>' +
        '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/>' +
        "</linearGradient>";
      svg.appendChild(defs);

      const ticks = 4;
      for (let i = 0; i <= ticks; i++) {
        const v = min + ((max - min) * i) / ticks;
        const yy = y(v);
        svg.appendChild(el("line", { x1: pad.l, x2: W - pad.r, y1: yy, y2: yy, stroke: "rgba(255,255,255,0.06)", "stroke-dasharray": "3 5" }));
        svg.appendChild(el("text", { x: 4, y: yy + 3.5, "text-anchor": "start" }, fmt.compact(v)));
      }

      const coords = pts.map((p, i) => [x(i), y(p.y)]);
      const lineD = smoothPath(coords);
      svg.appendChild(el("path", { d: lineD + " L" + x(pts.length - 1) + " " + (H - pad.b) + " L" + pad.l + " " + (H - pad.b) + " Z", fill: "url(#" + gid + ")" }));
      svg.appendChild(el("path", { d: lineD, fill: "none", stroke: color, "stroke-width": 2.1, "stroke-linecap": "round", "stroke-linejoin": "round", filter: "drop-shadow(0 4px 12px rgba(20,240,164,.35))" }));

      // x axis labels
      const nLbl = Math.min(6, pts.length);
      for (let i = 0; i < nLbl; i++) {
        const idx = Math.round((i / (nLbl - 1)) * (pts.length - 1));
        svg.appendChild(el("text", { x: x(idx), y: H - 6, "text-anchor": i === 0 ? "start" : i === nLbl - 1 ? "end" : "middle" }, pts[idx].label));
      }

      // last point
      const last = coords[coords.length - 1];
      svg.appendChild(el("circle", { cx: last[0], cy: last[1], r: 9, fill: color, opacity: "0.18" }));
      svg.appendChild(el("circle", { cx: last[0], cy: last[1], r: 3.6, fill: "#04120d", stroke: color, "stroke-width": 2.2 }));

      // crosshair
      const cross = el("line", { x1: 0, x2: 0, y1: pad.t, y2: H - pad.b, stroke: "rgba(255,255,255,.22)", "stroke-dasharray": "3 4", opacity: "0" });
      const hoverDot = el("circle", { r: 4.5, fill: color, stroke: "#04120d", "stroke-width": 2, opacity: "0" });
      svg.appendChild(cross); svg.appendChild(hoverDot);

      const hit = el("rect", { x: pad.l, y: 0, width: W - pad.l - pad.r, height: H, fill: "transparent" });
      hit.style.cursor = "crosshair";
      hit.addEventListener("mousemove", (ev) => {
        const rect = svg.getBoundingClientRect();
        const rel = ((ev.clientX - rect.left) / rect.width) * W;
        let idx = Math.round(((rel - pad.l) / (W - pad.l - pad.r)) * (pts.length - 1));
        idx = Math.max(0, Math.min(pts.length - 1, idx));
        const cx = x(idx), cy = y(pts[idx].y);
        cross.setAttribute("x1", cx); cross.setAttribute("x2", cx); cross.setAttribute("opacity", "1");
        hoverDot.setAttribute("cx", cx); hoverDot.setAttribute("cy", cy); hoverDot.setAttribute("opacity", "1");
        const value = (opts.tipValue || ((p) => "$" + Math.round(p.y).toLocaleString("en-US")))(pts[idx]);
        showTip("<div>" + pts[idx].label + "</div><b>" + value + "</b>", ev.clientX, ev.clientY);
      });
      hit.addEventListener("mouseleave", () => {
        cross.setAttribute("opacity", "0"); hoverDot.setAttribute("opacity", "0"); hideTip();
      });
      svg.appendChild(hit);

      mount(host, svg, H);
    };
    reflow(host, render);
  }

  /* ------------------------------ bars ------------------------------ */
  function bars(host, opts) {
    const render = () => {
      const W = host.clientWidth || 600;
      const H = opts.height || 240;
      const pad = { t: 16, r: 10, b: 28, l: 44 };
      const items = opts.items;
      if (!items || !items.length) { clear(host); return; }
      const vals = items.map((i) => i.value);
      const max = Math.max(0, ...vals), min = Math.min(0, ...vals);
      const y = (v) => pad.t + (1 - (v - min) / (max - min || 1)) * (H - pad.t - pad.b);
      const zero = y(0);
      const innerW = W - pad.l - pad.r;
      const slot = innerW / items.length;
      const bw = Math.min(opts.barWidth || 26, slot * 0.58);

      const svg = el("svg", {});
      for (let i = 0; i <= 4; i++) {
        const v = min + ((max - min) * i) / 4;
        const yy = y(v);
        svg.appendChild(el("line", { x1: pad.l, x2: W - pad.r, y1: yy, y2: yy, stroke: "rgba(255,255,255,.05)", "stroke-dasharray": "3 5" }));
        svg.appendChild(el("text", { x: 4, y: yy + 3.5 }, fmt.compact(v)));
      }
      svg.appendChild(el("line", { x1: pad.l, x2: W - pad.r, y1: zero, y2: zero, stroke: "rgba(255,255,255,.16)" }));

      items.forEach((it, i) => {
        const cx = pad.l + slot * i + slot / 2;
        const top = it.value >= 0 ? y(it.value) : zero;
        const h = Math.max(2.5, Math.abs(zero - y(it.value)));
        const color = it.color || (it.value >= 0 ? "#14f0a4" : "#ff5470");
        const r = Math.min(5, bw / 2, h);
        const x0 = cx - bw / 2;
        const d = it.value >= 0
          ? "M" + x0 + " " + (top + h) + " L" + x0 + " " + (top + r) + " Q" + x0 + " " + top + " " + (x0 + r) + " " + top +
            " L" + (x0 + bw - r) + " " + top + " Q" + (x0 + bw) + " " + top + " " + (x0 + bw) + " " + (top + r) + " L" + (x0 + bw) + " " + (top + h) + " Z"
          : "M" + x0 + " " + (top - h) + " L" + x0 + " " + (top - r) + " Q" + x0 + " " + top + " " + (x0 + r) + " " + top +
            " L" + (x0 + bw - r) + " " + top + " Q" + (x0 + bw) + " " + top + " " + (x0 + bw) + " " + (top + r) + " L" + (x0 + bw) + " " + (top - h) + " Z";
        const p = el("path", { d, fill: color, opacity: "0.82" });
        p.style.filter = "drop-shadow(0 3px 10px " + color + "55)";
        p.style.transition = "opacity .15s";
        p.addEventListener("mouseenter", (ev) => {
          p.setAttribute("opacity", "1");
          showTip("<div>" + it.label + "</div><b style='color:" + color + "'>" + (opts.tipValue ? opts.tipValue(it) : fmt.money(it.value)) + "</b>", ev.clientX, ev.clientY);
        });
        p.addEventListener("mouseleave", () => { p.setAttribute("opacity", "0.82"); hideTip(); });
        svg.appendChild(p);
        svg.appendChild(el("text", { x: cx, y: H - 8, "text-anchor": "middle" }, it.label));
      });

      mount(host, svg, H);
    };
    reflow(host, render);
  }

  /* ------------------------------ donut ------------------------------ */
  function donut(host, opts) {
    const render = () => {
      const W = host.clientWidth || 240;
      const size = opts.height || 190;
      const cx = W / 2, cy = size / 2 + 4;
      const r = Math.min(size, W) / 2 - 22;
      const sw = opts.thickness || 16;
      const total = opts.parts.reduce((s, p) => s + p.value, 0) || 1;
      const C = 2 * Math.PI * r;
      const svg = el("svg", {});
      svg.appendChild(el("circle", { cx, cy, r, fill: "none", stroke: "rgba(255,255,255,.055)", "stroke-width": sw }));

      let offset = 0;
      opts.parts.forEach((p) => {
        const len = (p.value / total) * C;
        const arc = el("circle", {
          cx, cy, r, fill: "none", stroke: p.color, "stroke-width": sw,
          "stroke-dasharray": Math.max(0.001, len - 3) + " " + (C - len + 3),
          "stroke-dashoffset": -offset,
          "stroke-linecap": "round",
          transform: "rotate(-90 " + cx + " " + cy + ")"
        });
        arc.style.filter = "drop-shadow(0 0 8px " + p.color + "66)";
        arc.addEventListener("mouseenter", (ev) => showTip("<div>" + p.label + "</div><b style='color:" + p.color + "'>" + p.value + " · " + ((p.value / total) * 100).toFixed(1) + "%</b>", ev.clientX, ev.clientY));
        arc.addEventListener("mouseleave", hideTip);
        svg.appendChild(arc);
        offset += len;
      });

      svg.appendChild(el("text", { x: cx, y: cy - 2, "text-anchor": "middle", "font-size": "21", "font-weight": "700", fill: "#eaf0f7" }, opts.centerValue || ""));
      svg.appendChild(el("text", { x: cx, y: cy + 15, "text-anchor": "middle", "font-size": "10" }, opts.centerLabel || ""));

      mount(host, svg, size);
    };
    reflow(host, render);
  }

  /* ------------------------------ sparkline ------------------------------ */
  function spark(host, values, color) {
    const render = () => {
      const W = host.clientWidth || 110, H = host.clientHeight || 46;
      if (!values || values.length < 2) return;
      const min = Math.min(...values), max = Math.max(...values);
      const pts = values.map((v, i) => [(i / (values.length - 1)) * W, H - 4 - ((v - min) / (max - min || 1)) * (H - 10)]);
      const svg = el("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", height: "100%", preserveAspectRatio: "none" });
      const gid = "s" + Math.random().toString(36).slice(2, 7);
      const defs = el("defs", {});
      defs.innerHTML = '<linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity=".38"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0"/></linearGradient>';
      svg.appendChild(defs);
      svg.appendChild(el("path", { d: path(pts) + " L" + W + " " + H + " L0 " + H + " Z", fill: "url(#" + gid + ")" }));
      svg.appendChild(el("path", { d: path(pts), fill: "none", stroke: color, "stroke-width": 1.6, "stroke-linecap": "round" }));
      clear(host); host.appendChild(svg);
    };
    render();
    host._w = host.clientWidth;
  }

  window.NX = window.NX || {};
  window.NX.chart = { line, bars, donut, spark, hideTip };
  window.NX.fmt = fmt;
})();
