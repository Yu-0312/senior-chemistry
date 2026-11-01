/*
 * chem-kit.js — 化學實驗室共用繪圖與場景工具
 *
 * 96 個實驗各自有模型，但器材長相與版面骨架應該一致：
 * 燒杯、錐形瓶、滴定管、試管、天平、電極、粒子盒、分子模型、週期表小卡。
 * 這個檔案只放「畫得出來」與「版面接得起來」的共用零件，
 * 每個實驗自己的化學模型仍寫在 js/experiments/*.js，不藏在這裡。
 */
(function () {
  "use strict";
  const PL = window.PhysicsLab;
  if (!PL) return;
  const D = PL.draw, TAU = PL.TAU;
  const clamp = PL.clamp, lerp = PL.lerp;

  /* ------------------------------ 色彩 ------------------------------ */
  const ELEMENT_COLORS = {
    H: "#e8eef7", C: "#3b4654", N: "#5b8def", O: "#e25555", F: "#8bc34a",
    Na: "#b07cf0", Mg: "#7fbf6a", Al: "#a8b6c6", Si: "#c9a06a", P: "#ff9f43",
    S: "#f2c94c", Cl: "#6fcf97", K: "#c471ed", Ca: "#ffb36b", Fe: "#c97b4a",
    Cu: "#c77b3f", Zn: "#9aa8b8", Ag: "#c0c7d1", Au: "#e0b94a", Pb: "#7b8794",
    Mn: "#9c6ade", Cr: "#69b3a2", Br: "#b5482a", I: "#6e3fa3", Ba: "#7fbf9f",
    Li: "#d16ba5", Be: "#4fd1c5", B: "#e6a15c", Ne: "#ff7f7f", Ar: "#8fa6ff"
  };
  const ION_COLORS = {
    "H+": "#e25555", "OH-": "#5b8def", "Na+": "#b07cf0", "Cl-": "#6fcf97",
    "Cu2+": "#2e86de", "Zn2+": "#8e9aa8", "Ag+": "#aab4c0", "Fe2+": "#9c6b3f",
    "Fe3+": "#c97b4a", "Ca2+": "#ffb36b", "Mg2+": "#7fbf6a", "K+": "#c471ed",
    "SO4^2-": "#f2c94c", "NO3-": "#7aa5d9", "CO3^2-": "#a1887f", "Pb2+": "#7b8794"
  };
  function elementColor(el) { return ELEMENT_COLORS[el] || "#9aa8b8"; }
  function ionColor(ion) { return ION_COLORS[ion] || "#9aa8b8"; }

  // pH 0–14：紅 → 橙 → 黃 → 綠 → 藍 → 紫
  function phColor(ph) {
    const stops = [
      [0, "#d32f2f"], [2, "#f4511e"], [4, "#fb8c00"], [6, "#fdd835"],
      [7, "#66bb6a"], [8, "#26a69a"], [10, "#1e88e5"], [12, "#5e35b1"], [14, "#311b92"]
    ];
    const v = clamp(ph, 0, 14);
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i], b = stops[i + 1];
      if (v <= b[0]) {
        const f = (v - a[0]) / (b[0] - a[0] || 1);
        const ca = hex(a[1]), cb = hex(b[1]);
        return "rgb(" + ca.map((c, k) => Math.round(lerp(c, cb[k], f))).join(",") + ")";
      }
    }
    return stops[stops.length - 1][1];
  }
  function hex(h) {
    const s = String(h).replace("#", "");
    return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16));
  }
  function mix(a, b, f) {
    const ca = hex(a), cb = hex(b);
    return "rgb(" + ca.map((c, i) => Math.round(lerp(c, cb[i], f))).join(",") + ")";
  }
  /*
   * 透明的液體色不能用字串接尾：phColor() 回傳 rgb(102,187,106)，
   * 接上 "aa" 會變成 rgb(102,187,106)aa，addColorStop() 直接丟錯，
   * 該頁的畫布就停在那一幀。這裡兩種格式都轉成 rgba()。
   */
  function tintAlpha(c, a) {
    if (/^#[0-9a-f]{6}$/i.test(c)) {
      const n = parseInt(c.slice(1), 16);
      return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
    }
    if (/^rgb\(/i.test(c)) return c.replace(/^rgb\(/i, "rgba(").replace(/\)\s*$/, "," + a + ")");
    return c;
  }

  /* ------------------------------ 版面 ------------------------------ */
  function scaffold(root, o) {
    o = o || {};
    // 標記「這是化學實驗」，讓建置後的教學鷹架保險只作用在化學版。
    if (root.dataset) root.dataset.chemScaffold = "1";
    const L = PL.ui.layout(root, {
      chrome: o.chrome || "quiet",
      brief: o.brief,
      procedure: o.procedure,
      instrument: o.instrument
    });
    const cv = PL.canvas.create(L.canvasWrap, o.aspect || 0.64);
    /*
     * draw() 會讀取滑桿與讀數，而這些控制項是在 scaffold() 回傳後才建立的。
     * 建置期間若同步畫第一格，會撞上 const 的暫時性死區；因此先標記「尚未就緒」，
     * 等 build() 整個跑完（微任務），控制項都就位後再畫第一格。
     */
    const state = { t: 0, running: false, ready: false };
    const paint = (dt, t) => {
      if (!state.ready) return;
      state.running = true;
      o.draw(dt || 0, t == null ? state.t : t);
      state.running = false;
    };
    let anim = null;
    if (o.animate) {
      anim = PL.loop((dt, t) => { state.t = t; paint(dt, t); }, { ambient: o.ambient !== false, fps: o.fps });
      anim.start();
    }
    const redraw = () => { if (!anim || !anim.running) paint(0, state.t); };
    root.addEventListener("input", redraw);
    root.addEventListener("change", redraw);
    /*
     * 實驗的 build() 通常只回傳 { stop }，不會把 scaffold 的介面帶出去。
     * 但 app.js 切換主題、收合側欄與每影格耗時測試都靠 api.rerender()。
     * 在 buildContext 上留一份，由 register() 的包裝接到 api 上。
     */
    const rerender = () => { state.ready = true; paint(0, state.t); };
    const bc = PL._hooks && typeof PL._hooks.current === "function" ? PL._hooks.current() : null;
    if (bc) bc.rerender = rerender;
    cv.onResize(() => paint(0, state.t));
    /*
     * 第一格排到下一影格，而不是 microtask。
     *
     * 排 microtask 在瀏覽器沒問題，但測試的 DOM 替身是整段同步執行完才讓出執行緒，
     * microtask 永遠輪不到——於是「暫停時拉滑桿」的稽核看到的是 96 個實驗全部
     * 沒有第一格畫面，誤判成滑桿壞掉。排進 requestAnimationFrame 後，
     * 瀏覽器照樣在下一格畫，測試也能用既有的 flushFrames() 把第一格跑掉。
     */
    const firstPaint = () => { state.ready = true; paint(0, state.t); };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(firstPaint);
    else if (typeof queueMicrotask === "function") queueMicrotask(firstPaint);
    else Promise.resolve().then(firstPaint);
    return {
      L, cv, anim, state, redraw,
      charts: PL.ui.charts(root),
      chart(title, cap, aspect) {
        const c = PL.ui.chart(PL.ui.charts(root), { title, cap, aspect: aspect || 0.52 });
        return c;
      },
      /*
       * 暫停時重畫一格。
       * app.js 在切換主題、收合側欄後會呼叫 api.rerender()；
       * 每影格耗時測試也靠它量真正的繪圖路徑。少了這個方法，
       * 兩邊都只會靜靜地什麼都不做。
       */
      rerender,
      stop() { if (anim) anim.stop(); cv.destroy(); }
    };
  }

  /* ------------------------------ 器材 ------------------------------ */
  function bench(cv) {
    const ctx = cv.ctx, W = cv.W, H = cv.H;
    D.bg(cv);
    PL.apparatus.benchTop ? PL.apparatus.benchTop(ctx, W, H, H - 26) : null;
    return { ctx, W, H, floor: H - 26 };
  }

  // 錐形瓶（底部寬、頸窄）
  function flask(ctx, cx, baseY, w, h, level, tint) {
    const lv = clamp(level == null ? 0.55 : level, 0, 1);
    const x0 = cx - w / 2, neckW = w * 0.34, neckH = h * 0.30, bodyH = h - neckH;
    const top = baseY - h;
    const liquidTop = baseY - bodyH * lv;
    // 液體
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0 + 2, baseY - 1);
    ctx.lineTo(x0 + 2, baseY - bodyH);
    ctx.lineTo(cx - neckW / 2, top);
    ctx.lineTo(cx + neckW / 2, top);
    ctx.lineTo(x0 + w - 2, baseY - bodyH);
    ctx.lineTo(x0 + w - 2, baseY - 1);
    ctx.closePath();
    ctx.clip();
    const c = tint || "#63b7e6";
    const g = ctx.createLinearGradient(0, liquidTop, 0, baseY);
    g.addColorStop(0, tintAlpha(c, 0.67)); g.addColorStop(1, tintAlpha(c, 0.87));
    ctx.fillStyle = g; ctx.fillRect(x0, liquidTop, w, baseY - liquidTop);
    ctx.fillStyle = "rgba(220,244,255,0.65)";
    ctx.beginPath(); ctx.ellipse(cx, liquidTop, w * 0.31, 3.2, 0, 0, TAU); ctx.fill();
    ctx.restore();
    // 玻璃
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, baseY);
    ctx.lineTo(x0, baseY - bodyH);
    ctx.lineTo(cx - neckW / 2, top);
    ctx.moveTo(cx + neckW / 2, top);
    ctx.lineTo(x0 + w, baseY - bodyH);
    ctx.lineTo(x0 + w, baseY);
    ctx.strokeStyle = PL.theme.isLight() ? "rgba(84,124,152,0.8)" : "rgba(206,232,244,0.8)";
    ctx.lineWidth = 1.8; ctx.lineJoin = "round"; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, baseY); ctx.lineTo(x0 + w, baseY); ctx.stroke();
    // 瓶口
    ctx.beginPath(); ctx.moveTo(cx - neckW / 2 - 4, top); ctx.lineTo(cx - neckW / 2 + 1, top);
    ctx.moveTo(cx + neckW / 2 - 1, top); ctx.lineTo(cx + neckW / 2 + 4, top); ctx.stroke();
    // 刻度
    ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const y = baseY - bodyH * i / 5, half = lerp(w * 0.5, w * 0.18, i / 5) - 4;
      ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx - half + 7, y); ctx.stroke();
    }
    ctx.restore();
    return { liquidTop };
  }

  // 燒杯
  function beaker(ctx, cx, baseY, w, h, level, tint) {
    return PL.apparatus.beaker(ctx, cx, baseY, w, h, level, tint);
  }

  // 滴定管：含刻度、活栓與液滴
  function burette(ctx, x, top, bottom, level, tint) {
    const w = 16, lv = clamp(level == null ? 0.9 : level, 0, 1);
    const y0 = top + 18, y1 = bottom - 44;
    const liqY = lerp(y1, y0, lv);
    // 玻璃管
    ctx.save();
    ctx.fillStyle = PL.theme.isLight() ? "rgba(210,230,245,0.75)" : "rgba(200,226,242,0.18)";
    ctx.fillRect(x - w / 2, y0, w, y1 - y0);
    ctx.strokeStyle = PL.theme.isLight() ? "rgba(84,124,152,0.8)" : "rgba(206,232,244,0.7)";
    ctx.lineWidth = 1.4; ctx.strokeRect(x - w / 2, y0, w, y1 - y0);
    // 液體
    ctx.fillStyle = tintAlpha(tint || "#cfe8ff", 0.80);
    ctx.fillRect(x - w / 2 + 2, liqY, w - 4, y1 - liqY - 1);
    // 刻度
    ctx.strokeStyle = "rgba(80,120,150,0.7)"; ctx.lineWidth = 0.8;
    for (let i = 0; i <= 10; i++) {
      const y = lerp(y0, y1, i / 10), major = i % 5 === 0;
      ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2 + (major ? 8 : 5), y); ctx.stroke();
    }
    // 活栓
    ctx.fillStyle = "#d9e6f2"; ctx.strokeStyle = "rgba(60,90,120,0.7)";
    ctx.beginPath(); ctx.arc(x, y1 + 10, 7, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 12, y1 + 10); ctx.lineTo(x + 12, y1 + 10); ctx.stroke();
    // 管尖
    ctx.beginPath(); ctx.moveTo(x - 2, y1 + 17); ctx.lineTo(x, bottom - 8); ctx.lineTo(x + 2, y1 + 17); ctx.stroke();
    ctx.restore();
    return { tipY: bottom - 8, liqY };
  }

  function drop(ctx, x, y, color) {
    D.disc(ctx, x, y, 3.2, { fill: color || "#7ec8ff" });
    D.disc(ctx, x - 1, y - 1, 1, { fill: "rgba(255,255,255,0.8)" });
  }

  // 直立試管（底端圓弧）
  function testTube(ctx, cx, baseY, w, h, level, tint) {
    ctx.save();
    ctx.translate(cx, baseY);
    PL.apparatus.testTube(ctx, w, h, level == null ? h * 0.4 : h * level, { tint: tint || "#5aa2e0" });
    ctx.restore();
  }

  // 試管架
  function tubeRack(ctx, cx, baseY, n, w, h) {
    const gap = w + 12, start = cx - (n - 1) * gap / 2;
    D.rect(ctx, cx - (n - 1) * gap / 2 - 18, baseY - 10, (n - 1) * gap + 36, 10, { fill: "#8a6a4c", r: 3 });
    for (let i = 0; i < n; i++) {
      const x = start + i * gap;
      D.rect(ctx, x - w / 2 - 1, baseY - h * 0.62, w + 2, 7, { fill: "#9c7a58", r: 2 });
      return { x };
    }
  }

  // 電子天平
  function balance(ctx, cx, baseY, reading, unit) {
    const w = 190, h = 58;
    D.rect(ctx, cx - w / 2, baseY - h, w, h, { fill: PL.theme.isLight() ? "#eef2f7" : "#1b2530", stroke: "#7a8a9c", r: 8 });
    D.rect(ctx, cx - w / 2 + 8, baseY - h - 10, w - 16, 12, { fill: "#b8c4d0", r: 3 });
    D.rect(ctx, cx - w / 2 + 18, baseY - h + 12, 90, 26, { fill: "#0c1a16", r: 4 });
    D.text(ctx, reading == null ? "0.000" : reading, cx - w / 2 + 63, baseY - h + 31, { color: "#65e6a8", size: 18, align: "center", weight: "700" });
    D.text(ctx, unit || "g", cx + 28, baseY - h + 31, { color: PL.col("text-dim"), size: 11, align: "left" });
    /*
     * 荷重條。
     *
     * 秤盤上的讀數本來只是一個數字：把樣品質量從 1 g 拉到 100 g，
     * 畫面除了數字以外完全沒動，學生會以為滑桿壞了。
     * 在螢幕下方加一條隨荷重伸長的綠條，拉滑桿時「秤重」這件事就看得見。
     * 用 reading/(reading+50) 而不是線性：小質量也看得出差別，
     * 最大值 200 g 時條長仍不會滿格。
     */
    const num = typeof reading === "number" ? reading : parseFloat(reading);
    if (isFinite(num) && num >= 0) {
      const f = clamp(num / (num + 50), 0, 0.96);
      D.rect(ctx, cx - w / 2 + 18, baseY - h + 42, 96, 4, { fill: PL.theme.shade(0.5), r: 2 });
      D.rect(ctx, cx - w / 2 + 18, baseY - h + 42, Math.max(2, 96 * f), 4, { fill: "#43d18a", r: 2 });
    }
    D.disc(ctx, cx + w / 2 - 22, baseY - 20, 6, { fill: "#5d6b7a" });
  }

  // 加熱板
  function hotplate(ctx, cx, baseY, w, heat) {
    return PL.apparatus.hotPlate(ctx, cx, baseY, w, heat);
  }

  function burner(ctx, cx, baseY, lit) {
    PL.apparatus.alcoholLamp(ctx, cx, baseY, 1, lit);
  }

  // 電極片
  function electrode(ctx, x, yTop, yBot, color, label) {
    D.rect(ctx, x - 7, yTop, 14, yBot - yTop, { fill: color, stroke: "rgba(255,255,255,0.35)", r: 2 });
    if (label) D.text(ctx, label, x, yTop - 8, { color: PL.col("text-dim"), size: 11, align: "center" });
  }

  // 伏特計／安培計
  function meter(ctx, cx, cy, value, label, unit) {
    D.disc(ctx, cx, cy, 26, { fill: PL.theme.isLight() ? "#f5f8fb" : "#101821", stroke: "#7f8fa1", width: 2 });
    D.text(ctx, label || "V", cx, cy - 7, { color: PL.col("text-faint"), size: 10, align: "center" });
    D.text(ctx, value == null ? "—" : value, cx, cy + 12, { color: PL.col("accent"), size: 13, align: "center", weight: "700" });
    if (unit) D.text(ctx, unit, cx + 17, cy + 15, { color: PL.col("text-faint"), size: 8 });
  }

  // 導線（折線）
  function wire(ctx, pts, color, w) {
    ctx.save(); ctx.strokeStyle = color || "#d07a4a"; ctx.lineWidth = w || 2.2; ctx.lineJoin = "round";
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.stroke(); ctx.restore();
  }

  /* ------------------------------ 粒子 ------------------------------ */
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }

  /*
   * 粒子盒：state = solid / liquid / gas。
   * 位置用固定種子決定，升溫只改變振幅與速度，不重新洗牌——
   * 學生才看得到「同一群粒子」在狀態改變時如何鬆開。
   */
  function particleBox(ctx, box, o) {
    o = o || {};
    const state = o.state || "gas", tempN = clamp(o.temp == null ? 0.5 : o.temp, 0, 1);
    const n = o.count || 42, rnd = rng(o.seed || 7);
    const cols = Math.ceil(Math.sqrt(n * box.w / box.h)), rows = Math.ceil(n / cols);
    const cellW = box.w / cols, cellH = box.h / rows;
    const color = o.color || "#7fc8ff";
    const t = o.time || 0;
    // 盒壁
    D.rect(ctx, box.x, box.y, box.w, box.h, { stroke: PL.col("border"), width: 1.4, r: 8, fill: o.bg || "rgba(120,180,220,0.05)" });
    for (let i = 0; i < n; i++) {
      const baseX = box.x + cellW * ((i % cols) + 0.5), baseY = box.y + cellH * (Math.floor(i / cols) + 0.5);
      const jx = (rnd() - 0.5) * cellW * 0.55, jy = (rnd() - 0.5) * cellH * 0.55;
      let x = baseX + jx, y = baseY + jy, r = o.radius || 5;
      if (state === "solid") {
        x += Math.sin(t * 6 + i) * 0.7 * (0.4 + tempN);
        y += Math.cos(t * 7 + i * 1.7) * 0.7 * (0.4 + tempN);
      } else if (state === "liquid") {
        x += Math.sin(t * (1.1 + tempN) + i * 1.3) * cellW * 0.22;
        y += Math.cos(t * (1.4 + tempN) + i * 0.9) * cellH * 0.22;
      } else {
        const sp = 0.5 + tempN * 1.6;
        x += Math.sin(t * sp + i * 2.1) * cellW * 0.42;
        y += Math.cos(t * sp * 1.23 + i * 1.7) * cellH * 0.42;
      }
      if (x < box.x + r) x = box.x + r; if (x > box.x + box.w - r) x = box.x + box.w - r;
      if (y < box.y + r) y = box.y + r; if (y > box.y + box.h - r) y = box.y + box.h - r;
      D.disc(ctx, x, y, r, { fill: color, glow: o.glow || null, glowSize: 6 });
      D.disc(ctx, x - r * 0.3, y - r * 0.3, r * 0.32, { fill: "rgba(255,255,255,0.55)" });
    }
    // 盒內溫度條
    D.text(ctx, o.label || "", box.x + 6, box.y + 14, { color: PL.col("text-dim"), size: 10 });
  }

  /*
   * 分子模型：atoms = [{el,x,y,r}]（x,y 為相對單位，中心 0,0）
   * bonds = [[i,j,order]]，order 1/2/3。
   */
  function molecule(ctx, cx, cy, atoms, bonds, scale, angle, opts) {
    opts = opts || {};
    const ca = Math.cos(angle || 0), sa = Math.sin(angle || 0);
    const P = atoms.map(a => ({
      x: cx + (a.x * ca - a.y * sa) * scale,
      y: cy + (a.x * sa + a.y * ca) * scale,
      r: (a.r || 0.34) * scale,
      el: a.el, color: a.color || elementColor(a.el), label: a.label
    }));
    (bonds || []).forEach(b => {
      const A = P[b[0]], B = P[b[1]], order = b[2] || 1;
      const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      for (let k = 0; k < order; k++) {
        const off = (k - (order - 1) / 2) * 4.4;
        D.line(ctx, A.x + nx * off, A.y + ny * off, B.x + nx * off, B.y + ny * off,
          opts.bondColor || PL.col("text-dim"), order === 1 ? 3.4 : 2.2);
      }
    });
    P.forEach(p => {
      D.disc(ctx, p.x, p.y, p.r, { fill: p.color, stroke: "rgba(0,0,0,0.25)", width: 1 });
      D.text(ctx, p.label || p.el, p.x, p.y + p.r * 0.34, {
        color: p.el === "C" ? "#fff" : "#18202b",
        size: Math.max(9, Math.round(p.r * 0.9)), align: "center", weight: "700"
      });
    });
    return P;
  }

  // 常見分子模板
  const MOLECULES = {
    H2O: {
      atoms: [{ el: "O", x: 0, y: 0, r: 0.42 }, { el: "H", x: -0.58, y: 0.42, r: 0.26 }, { el: "H", x: 0.58, y: 0.42, r: 0.26 }],
      bonds: [[0, 1], [0, 2]]
    },
    CO2: {
      atoms: [{ el: "C", x: 0, y: 0, r: 0.38 }, { el: "O", x: -0.78, y: 0, r: 0.4 }, { el: "O", x: 0.78, y: 0, r: 0.4 }],
      bonds: [[0, 1, 2], [0, 2, 2]]
    },
    CH4: {
      atoms: [{ el: "C", x: 0, y: 0, r: 0.4 }, { el: "H", x: -0.55, y: -0.55, r: 0.24 }, { el: "H", x: 0.55, y: -0.55, r: 0.24 }, { el: "H", x: -0.55, y: 0.55, r: 0.24 }, { el: "H", x: 0.55, y: 0.55, r: 0.24 }],
      bonds: [[0, 1], [0, 2], [0, 3], [0, 4]]
    },
    NH3: {
      atoms: [{ el: "N", x: 0, y: -0.1, r: 0.4 }, { el: "H", x: -0.62, y: 0.45, r: 0.24 }, { el: "H", x: 0.62, y: 0.45, r: 0.24 }, { el: "H", x: 0, y: 0.72, r: 0.24 }],
      bonds: [[0, 1], [0, 2], [0, 3]]
    },
    O2: {
      atoms: [{ el: "O", x: -0.42, y: 0, r: 0.4 }, { el: "O", x: 0.42, y: 0, r: 0.4 }],
      bonds: [[0, 1, 2]]
    },
    N2: {
      atoms: [{ el: "N", x: -0.44, y: 0, r: 0.4 }, { el: "N", x: 0.44, y: 0, r: 0.4 }],
      bonds: [[0, 1, 3]]
    },
    HCl: {
      atoms: [{ el: "H", x: -0.4, y: 0, r: 0.26 }, { el: "Cl", x: 0.34, y: 0, r: 0.42 }],
      bonds: [[0, 1]]
    },
    NaCl: {
      atoms: [{ el: "Na", x: -0.5, y: 0, r: 0.38, label: "Na⁺" }, { el: "Cl", x: 0.5, y: 0, r: 0.44, label: "Cl⁻" }],
      bonds: []
    }
  };
  function moleculeByName(ctx, cx, cy, name, scale, angle) {
    const m = MOLECULES[name];
    if (!m) return null;
    return molecule(ctx, cx, cy, m.atoms, m.bonds, scale, angle);
  }

  /* ------------------------------ 教學圖形 ------------------------------ */

  /*
   * 原子示意圖：原子核＋電子殼層。
   * shells 是每層電子數，例如 [2,8,1]。
   */
  function atomDiagram(ctx, cx, cy, R, shells, o) {
    o = o || {};
    const n = (shells || []).length || 1;
    for (let i = 0; i < n; i++) {
      const rr = R * (0.32 + 0.68 * (i + 1) / n);
      D.disc(ctx, cx, cy, rr, { stroke: i === (o.highlightShell == null ? -1 : o.highlightShell) ? PL.col("accent") : PL.col("border"), width: i === o.highlightShell ? 2 : 1 });
      const count = shells[i] || 0;
      for (let k = 0; k < count; k++) {
        const a = -Math.PI / 2 + k / Math.max(1, count) * TAU + i * 0.35;
        D.disc(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, Math.max(2.2, R * 0.035), { fill: PL.col("accent-2") });
      }
    }
    /*
     * 原子核。
     *
     * 以往原子核只是寫著「p⁺11 n⁰12」的一個紅點：質子數、中子數改了，
     * 除了那行字以外畫面完全沒動，學生看不到「原子核真的變了」。
     * 給定 o.nucleons = [質子數, 中子數] 時，把核子一顆一顆畫出來
     * （黃金角螺旋排布，核越大越擠），數量改變就看得到。
     */
    if (o.nucleons) {
      const np = o.nucleons[0], nn = o.nucleons[1], total = Math.max(1, np + nn);
      const nR = R * 0.22;
      D.disc(ctx, cx, cy, nR, { fill: PL.theme.shade(0.35), stroke: "rgba(0,0,0,0.25)" });
      const dotR = Math.max(1.5, nR * 0.16);
      for (let i = 0; i < total; i++) {
        const a = i * 2.39996;
        const rr = nR * 0.74 * Math.sqrt((i + 0.5) / total);
        D.disc(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, dotR, { fill: i < np ? "#ff7f7f" : "#cfd8dc" });
      }
    } else {
      D.disc(ctx, cx, cy, R * 0.15, { fill: "#e25555", stroke: "rgba(0,0,0,0.3)" });
      D.text(ctx, o.nucleus || "核", cx, cy + 3.5, { color: "#fff", size: Math.max(8, R * 0.09), align: "center", weight: "700" });
    }
    if (o.label) D.text(ctx, o.label, cx, cy + R + 16, { color: PL.col("text-dim"), size: 11, align: "center" });
    return { R };
  }

  /*
   * 反應能量圖：反應物平台 → 過渡態 → 生成物平台。
   * dh > 0 為吸熱，dh < 0 為放熱；ea 是活化能高度。
   */
  function energyProfile(ctx, box, o) {
    o = o || {};
    const dh = clamp(o.dh == null ? -0.35 : o.dh, -0.45, 0.45);
    const ea = clamp(o.ea == null ? 0.45 : o.ea, 0.12, 0.6);
    const base = box.y + box.h * 0.78;
    const scale = box.h * 0.62;
    const reactY = base, prodY = base - dh * scale;
    const peakY = Math.min(reactY, prodY) - ea * scale;
    const x0 = box.x, x1 = box.x + box.w;
    const startY = o.reverse ? prodY : reactY, endY = o.reverse ? reactY : prodY;
    const peakX = x0 + box.w * (o.reverse ? 0.62 : 0.42);
    D.line(ctx, x0, base + 4, x1, base + 4, PL.col("border"), 1);
    // 主曲線
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, startY);
    ctx.bezierCurveTo(x0 + box.w * 0.18, startY, peakX - box.w * 0.12, peakY, peakX, peakY);
    ctx.bezierCurveTo(peakX + box.w * 0.12, peakY, x1 - box.w * 0.18, endY, x1, endY);
    ctx.strokeStyle = o.color || PL.col("accent"); ctx.lineWidth = 2.6; ctx.stroke();
    // 催化路徑
    if (o.catalyzed) {
      const lowPeak = peakY + box.h * 0.16;
      ctx.beginPath();
      ctx.moveTo(x0, startY);
      ctx.bezierCurveTo(x0 + box.w * 0.2, startY, peakX - box.w * 0.14, lowPeak, peakX, lowPeak);
      ctx.bezierCurveTo(peakX + box.w * 0.14, lowPeak, x1 - box.w * 0.2, endY, x1, endY);
      ctx.strokeStyle = "#66bb6a"; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
      D.text(ctx, "催化路徑", peakX, lowPeak - 8, { color: "#66bb6a", size: 10, align: "center" });
    }
    ctx.restore();
    // 標記
    D.line(ctx, x0, reactY, x1, reactY, "rgba(140,160,180,0.25)", 1, [3, 4]);
    D.line(ctx, x0, prodY, x1, prodY, "rgba(140,160,180,0.25)", 1, [3, 4]);
    D.text(ctx, o.reactLabel || "反應物", x0 + 6, startY - 8, { color: PL.col("text-dim"), size: 11 });
    D.text(ctx, o.prodLabel || "生成物", x1 - 12, endY - 8, { color: PL.col("text-dim"), size: 11, align: "right" });
    // Ea 箭頭
    const arrowX = peakX + box.w * 0.16;
    D.line(ctx, arrowX, Math.max(startY, endY), arrowX, peakY, PL.col("text-faint"), 1.2, [3, 3]);
    D.text(ctx, "Ea", arrowX + 5, (Math.max(startY, endY) + peakY) / 2, { color: PL.col("text-dim"), size: 11 });
    /*
     * ΔH：只留一截短線標出兩能階差，數值寫在軸線下方。
     * 以前數值放在 x1 - 18 的中間高度，和「生成物」標籤、右邊界疊在一起，
     * 視窗一窄就會被面板切掉。
     */
    D.line(ctx, x1 - 6, reactY, x1 - 6, prodY, dh >= 0 ? "#ff8a65" : "#66bb6a", 1.6);
    if (o.dhLabel !== false) D.text(ctx, "ΔH " + (dh >= 0 ? "+" : "") + Math.round(dh * 100) + " kJ/mol", x0, base + 22, { color: dh >= 0 ? "#ff8a65" : "#66bb6a", size: 11 });
    return { peakX, peakY, reactY, prodY };
  }

  /*
   * 迷你週期表：只畫前 36 號元素，足以說明主族趨勢。
   */
  const PERIODIC = [
    [1, "H", 1, 1], [2, "He", 1, 18],
    [3, "Li", 2, 1], [4, "Be", 2, 2], [5, "B", 2, 13], [6, "C", 2, 14], [7, "N", 2, 15], [8, "O", 2, 16], [9, "F", 2, 17], [10, "Ne", 2, 18],
    [11, "Na", 3, 1], [12, "Mg", 3, 2], [13, "Al", 3, 13], [14, "Si", 3, 14], [15, "P", 3, 15], [16, "S", 3, 16], [17, "Cl", 3, 17], [18, "Ar", 3, 18],
    [19, "K", 4, 1], [20, "Ca", 4, 2], [21, "Sc", 4, 3], [22, "Ti", 4, 4], [23, "V", 4, 5], [24, "Cr", 4, 6], [25, "Mn", 4, 7], [26, "Fe", 4, 8], [27, "Co", 4, 9], [28, "Ni", 4, 10], [29, "Cu", 4, 11], [30, "Zn", 4, 12], [31, "Ga", 4, 13], [32, "Ge", 4, 14], [33, "As", 4, 15], [34, "Se", 4, 16], [35, "Br", 4, 17], [36, "Kr", 4, 18]
  ];
  function periodicMap(ctx, box, o) {
    o = o || {};
    const cols = 18, rows = 4;
    const cw = box.w / cols, ch = box.h / rows;
    const hi = o.highlight || {}, dim = o.dim || {};
    PERIODIC.forEach(([z, sym, row, col]) => {
      const x = box.x + (col - 1) * cw, y = box.y + (row - 1) * ch;
      const active = hi[sym];
      D.rect(ctx, x + 1, y + 1, cw - 2, ch - 2, {
        fill: active ? CKColor(sym) : dim[sym] ? "rgba(150,170,190,0.08)" : PL.theme.shade(0.5),
        stroke: active ? PL.col("accent") : "rgba(140,160,180,0.22)",
        width: active ? 2 : 0.8, r: 2
      });
      D.text(ctx, sym, x + cw / 2, y + ch / 2 + 3, {
        color: active ? "#101820" : PL.col("text-dim"), size: Math.max(7, Math.min(11, cw * 0.6)), align: "center", weight: active ? "700" : "400"
      });
    });
    return { cw, ch };
  }
  function CKColor(sym) {
    const z = { H: 1, He: 2, Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8, F: 9, Ne: 10, Na: 11, Mg: 12, Al: 13, Si: 14, P: 15, S: 16, Cl: 17, Ar: 18, K: 19, Ca: 20, Fe: 26, Cu: 29, Zn: 30, Br: 35 }[sym];
    if (!z) return PL.col("accent");
    return elementColor(sym);
  }

  /*
   * 能階圖：levels = [{label, y, n}]，y 是相對高度 0–1（1 最高）。
   * transition = {from, to, color} 可畫箭頭。
   */
  function energyLevels(ctx, box, levels, o) {
    o = o || {};
    const yOf = l => box.y + box.h * (1 - l.y);
    (levels || []).forEach(l => {
      D.line(ctx, box.x, yOf(l), box.x + box.w, yOf(l), l.color || PL.col("text-dim"), l.width || 2);
      D.text(ctx, l.label, box.x - 6, yOf(l) + 4, { color: PL.col("text-dim"), size: 11, align: "right" });
      if (l.n != null) D.text(ctx, "n=" + l.n, box.x + box.w + 6, yOf(l) + 4, { color: PL.col("text-faint"), size: 10 });
    });
    const tr = o.transition;
    if (tr) {
      const a = levels[tr.from], b = levels[tr.to];
      if (a && b) {
        const x1 = box.x + box.w * (tr.x || 0.55), x2 = x1 + 22;
        D.line(ctx, x1, yOf(a), x1, yOf(b), tr.color || PL.col("accent"), 2);
        D.line(ctx, x1 - 4, yOf(b) + 7, x1, yOf(b), tr.color || PL.col("accent"), 2);
        D.line(ctx, x1 + 4, yOf(b) + 7, x1, yOf(b), tr.color || PL.col("accent"), 2);
      }
    }
    return { yOf };
  }

  /*
   * 光譜：peaks = [{x, h, color, label}]，x 為 0–1 位置。
   * 背景可依 o.rainbow = true 畫可見光連續背景。
   */
  function spectrum(ctx, box, peaks, o) {
    o = o || {};
    /*
     * 光譜底板刻意做深色（螢幕上的光譜就該在暗室裡看），但不能是純黑灰：
     * 淺色主題下低彩度的近黑大面積會像頁面上破了一個洞。
     * 用帶藍紫的深靛色，彩度 0.18，視覺上仍是暗底，卻不會被讀成「黑洞」。
     */
    D.rect(ctx, box.x, box.y, box.w, box.h, { fill: "#161f45", stroke: PL.col("border"), r: 3 });
    if (o.rainbow) {
      const g = ctx.createLinearGradient(box.x, 0, box.x + box.w, 0);
      ["#7b1fa2", "#3f51b5", "#039be5", "#43a047", "#fdd835", "#fb8c00", "#e53935"].forEach((c, i) => g.addColorStop(i / 6, c));
      ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = g; ctx.fillRect(box.x, box.y, box.w, box.h); ctx.restore();
    }
    (peaks || []).forEach(p => {
      const x = box.x + box.w * clamp(p.x, 0, 1);
      const h = box.h * (p.h == null ? 0.7 : p.h);
      D.line(ctx, x, box.y + box.h - 6, x, box.y + box.h - 6 - h, p.color || "#fff", p.width || 2.2);
      if (p.label) D.text(ctx, p.label, x, box.y + 12, { color: p.color || PL.col("text-dim"), size: 9, align: "center" });
    });
    D.text(ctx, o.xlabel || "", box.x + box.w / 2, box.y + box.h + 14, { color: PL.col("text-faint"), size: 10, align: "center" });
    return box;
  }

  /*
   * 電化學電池：兩個燒杯、電極、導線、鹽橋與伏特計。
   */
  function electroCell(ctx, box, o) {
    o = o || {};
    const w = box.w, h = box.h, cx = box.x + w / 2;
    const beakerW = w * 0.28, beakerH = h * 0.42, by = box.y + h * 0.82;
    const lx = box.x + w * 0.22, rx = box.x + w * 0.78;
    PL.apparatus.beaker(ctx, lx, by, beakerW, beakerH, 0.62, o.leftTint || "#8fc6e8");
    PL.apparatus.beaker(ctx, rx, by, beakerW, beakerH, 0.62, o.rightTint || "#8fc6e8");
    const topY = box.y + h * 0.30;
    electrode(ctx, lx, topY, by - 8, o.leftColor || "#c0c7d1", o.leftLabel || "陽極");
    electrode(ctx, rx, topY, by - 8, o.rightColor || "#c77b3f", o.rightLabel || "陰極");
    wire(ctx, [[lx, topY], [lx, box.y + h * 0.12], [cx, box.y + h * 0.12], [cx, box.y + h * 0.06]], "#d07a4a", 2);
    wire(ctx, [[rx, topY], [rx, box.y + h * 0.12], [cx, box.y + h * 0.12]], "#d07a4a", 2);
    meter(ctx, cx, box.y + h * 0.16, o.voltage == null ? "—" : o.voltage, "V", "V");
    // 鹽橋
    ctx.save();
    ctx.strokeStyle = "rgba(180,210,230,0.7)"; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(lx + beakerW * 0.2, by - beakerH * 0.78);
    ctx.bezierCurveTo(lx + beakerW * 0.2, by - beakerH * 1.25, rx - beakerW * 0.2, by - beakerH * 1.25, rx - beakerW * 0.2, by - beakerH * 0.78);
    ctx.stroke(); ctx.restore();
    D.text(ctx, "鹽橋", cx, by - beakerH * 1.06, { color: PL.col("text-dim"), size: 10, align: "center" });
    return { lx, rx, topY, by };
  }

  /*
   * 卡計：外杯、內杯、溫度計與攪拌棒。
   */
  function calorimeter(ctx, cx, baseY, w, h, temp, o) {
    o = o || {};
    D.rect(ctx, cx - w / 2, baseY - h, w, h, { fill: PL.theme.shade(0.45), stroke: PL.col("border"), r: 8 });
    D.rect(ctx, cx - w / 2 + 10, baseY - h + 12, w - 20, h - 24, { fill: "rgba(90,170,220,0.28)", stroke: "rgba(180,220,240,0.5)", r: 6 });
    PL.apparatus.thermometer(ctx, cx + w * 0.12, baseY - h - 34, baseY - 18, 10, clamp(((temp || 25) + 10) / 80, 0.05, 0.95));
    D.line(ctx, cx - w * 0.22, baseY - h - 26, cx - w * 0.22, baseY - 16, PL.col("text-dim"), 3);
    D.text(ctx, (temp == null ? 25 : temp).toFixed(1) + " °C", cx - w * 0.02, baseY - h - 30, { color: PL.col("accent"), size: 15, align: "center", weight: "700" });
    D.text(ctx, o.label || "絕熱卡計", cx, baseY + 16, { color: PL.col("text-dim"), size: 10, align: "center" });
    return { tempY: baseY - h - 30 };
  }

  /*
   * 溶液中的離子／粒子雲：ions = [{x,y,label,color,r}]，x/y 為 0–1。
   */
  function ionCloud(ctx, box, ions, o) {
    o = o || {};
    D.rect(ctx, box.x, box.y, box.w, box.h, { fill: "rgba(90,170,220,0.10)", stroke: "rgba(180,220,240,0.4)", r: 6 });
    (ions || []).forEach(ion => {
      const x = box.x + box.w * clamp(ion.x, 0.02, 0.98), y = box.y + box.h * clamp(ion.y, 0.04, 0.96);
      D.disc(ctx, x, y, ion.r || 8, { fill: ion.color || "#8fc6e8" });
      if (ion.label) D.text(ctx, ion.label, x, y + 3.5, { color: "#fff", size: 8, align: "center", weight: "700" });
    });
    return box;
  }

  /* ------------------------------ 圖表 ------------------------------ */

  function plot(cv, o) {
    cv.clear();
    const ctx = cv.ctx, W = cv.W, H = cv.H;
    const box = o.box || { x: 52, y: 18, w: W - 68, h: H - 48 };
    const g = PL.graph(cv, box, { x0: o.x0, x1: o.x1, y0: o.y0, y1: o.y1 });
    g.frame({ xlabel: o.xlabel, ylabel: o.ylabel, title: o.title, xticks: o.xticks, yticks: o.yticks });
    g.grid(o.xticks || 4, o.yticks || 4);
    (o.series || []).forEach(s => {
      if (typeof s.fn === "function") g.fn(s.fn, { color: s.color, width: s.width || 2.2, dash: s.dash });
      else if (s.pts) g.curve(s.pts, { color: s.color, width: s.width || 2.2, dash: s.dash });
    });
    (o.marks || []).forEach(m => {
      if (m.vline != null) g.vline(m.vline, { color: m.color, label: m.label, dash: m.dash });
      if (m.dot) g.dot(m.dot[0], m.dot[1], { color: m.color, r: m.r, label: m.label });
    });
    return g;
  }

  /* ------------------------------ 小工具 ------------------------------ */
  function badge(ctx, x, y, text, color) {
    const w = Math.max(44, String(text).length * 12 + 14);
    D.rect(ctx, x - w / 2, y - 11, w, 22, { fill: color || PL.col("accent"), r: 11 });
    D.text(ctx, text, x, y + 4, { color: "#fff", size: 11, align: "center", weight: "700" });
  }
  function panel(ctx, x, y, w, h, title) {
    D.rect(ctx, x, y, w, h, { fill: PL.theme.shade(0.55), stroke: PL.col("border"), r: 8 });
    if (title) D.text(ctx, title, x + 10, y + 17, { color: PL.col("text-dim"), size: 11, weight: "700" });
  }
  function arrow(ctx, x1, y1, x2, y2, color, label) {
    D.arrow(ctx, x1, y1, x2, y2, { color: color || PL.col("accent"), width: 2.2, label });
  }
  function legend(ctx, x, y, items, gap) {
    let cy = y;
    (items || []).forEach(it => {
      D.disc(ctx, x + 5, cy - 4, 4, { fill: it.color });
      D.text(ctx, it.label, x + 15, cy, { color: PL.col("text-dim"), size: 10 });
      cy += gap || 18;
    });
  }

  /*
   * 比例尺：軌道加上依比例長度的填色。
   *
   * 化學版很多讀數只是面板上的一個數字。數字變了、畫面沒變，
   * 就等於「拉了滑桿不知道改變了什麼」。比例尺把數字變成看得到的長度，
   * 也讓學生一眼比較兩端的差。
   */
  function meter(ctx, x, y, w, h, frac, o) {
    o = o || {};
    const f = clamp(frac == null ? 0 : frac, 0, 1);
    D.rect(ctx, x, y, w, h, { fill: PL.theme.shade(0.5), stroke: PL.col("border"), r: h / 2 });
    if (f > 0) D.rect(ctx, x + 1, y + 1, Math.max(2, (w - 2) * f), h - 2, { fill: o.color || PL.col("accent"), r: (h - 2) / 2 });
    if (o.label) D.text(ctx, o.label, x, y - 7, { color: PL.col("text-faint"), size: 9 });
    return f;
  }

  /*
   * 以點數表示「多少」：點的位置只由數量決定。
   * 濃度、粒子數、離子量這類讀數用它，增減一看就知道。
   */
  function counter(ctx, x, y, w, count, o) {
    o = o || {};
    const r = o.r || 4, gap = r * 3;
    const perRow = Math.max(1, Math.floor(w / gap));
    for (let i = 0; i < Math.max(0, count); i++) {
      const px = x + (i % perRow) * gap, py = y + Math.floor(i / perRow) * gap;
      D.disc(ctx, px, py, r, { fill: o.color || PL.col("accent"), stroke: o.stroke });
    }
  }

  /*
   * 教學鷹架保險
   *
   * sim-insight 會自動量出「哪個滑桿影響哪個讀數」，但它的前提是至少兩個變因。
   * 化學版有一批實驗只有一根滑桿（例如滴定體積），量不出關係，於是整張鷹架空白。
   * 這裡補一張「怎麼做這個實驗」：用實驗自己的控制項與讀數名稱寫步驟，
   * 而不是放一句到處都適用的「請注意安全」。手寫了任何一種鷹架的實驗不會被覆蓋。
   */
  function hasTeachingScaffold(root) {
    return [".sim-verdict", ".sim-causality", ".sim-procedure-card", ".sim-derived",
            ".sim-presets", ".sim-relations", ".sim-challenge", ".sim-poe"]
      .some(sel => root.querySelectorAll(sel).length > 0);
  }

  PL._hooks.onBuilt(context => {
    const root = context.root;
    if (!root || !root.dataset || root.dataset.chemScaffold !== "1") return;
    if (hasTeachingScaffold(root)) return;
    const host = root.querySelector(".sim-control-deck .sim-controls") || root.querySelector(".sim-controls");
    const readouts = context.readouts || [];
    if (!host || !readouts.length) return;

    const sliders = context.sliders || [];
    const first = readouts[0], second = readouts[1];
    const s1 = sliders[0], s2 = sliders[1];
    const steps = [];
    if (s1) {
      steps.push("先只動「" + s1.label + "」這一個滑桿，其他控制項保持不變。");
      steps.push("盯住讀數「" + first.label + "」，把「" + s1.label + "」從最小拉到最大，記下兩端的值。");
    } else {
      steps.push("切換上方的選項，觀察畫面與讀數哪裡跟著變。");
      steps.push("盯住讀數「" + first.label + "」，把每個選項都看過一次並記錄。");
    }
    if (s2) {
      steps.push("再單獨動「" + s2.label + "」，比較它和「" + s1.label + "」哪一個影響比較大。");
    } else if (second) {
      steps.push("再看讀數「" + second.label + "」，確認它和「" + first.label + "」是不是同步變化。");
    }
    steps.push("用一句話寫下量到的關係：「＿＿變大時，「" + first.label + "」＿＿」。");

    PL.ui.procedure(host, {
      title: "怎麼做這個實驗",
      steps,
      rule: "一次只改一個變因；同時動兩個控制項，就分不出是哪一個造成讀數改變。"
    });
  });

  window.ChemLab = {
    ELEMENT_COLORS, MOLECULES,
    elementColor, ionColor, phColor, mix,
    scaffold, bench,
    flask, beaker, burette, drop, testTube, tubeRack, balance, hotplate, burner,
    electrode, meter, wire,
    particleBox, molecule, moleculeByName,
    atomDiagram, energyProfile, periodicMap, energyLevels, spectrum,
    electroCell, calorimeter, ionCloud,
    plot, badge, panel, arrow, legend, meter, counter,
    clamp, lerp, fmt: PL.fmt
  };
})();
