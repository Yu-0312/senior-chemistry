/*
 * lab.js — 自由調配實驗室
 *
 * 這不是「把器材拖來拖去」的力學沙盒，而是化學課真正會做的一件事：
 * 從試劑架取溶液，設定濃度與體積，倒進同一個燒杯，看它變成什麼。
 *
 * 模型刻意保持可解釋：
 *   · 強酸／強鹼先中和，弱酸／弱鹼再依 Ka、Kb 與緩衝關係算 pH
 *   · Ag⁺、Cl⁻、Ca²⁺、CO₃²⁻、Cu²⁺ 之間的沉澱用限量試劑判斷
 *   · 碳酸根遇酸放出 CO₂
 *   · 中和熱以 57.1 kJ/mol 估計升溫
 * 目的不是取代嚴謹的平衡計算，而是讓學生看見「倒多少、混什麼」如何改變結果。
 */
(function () {
  "use strict";

  const $ = sel => document.querySelector(sel);
  const CAPACITY = 400;          // 燒杯容量 mL
  const SAVE_KEY = "chem-lab-v1";
  const BUILD = (window.PhysicsLabSite && window.PhysicsLabSite.build) || "";

  /* ------------------------------ 試劑 ------------------------------ */
  const REAGENTS = {
    hcl: {
      name: "鹽酸", formula: "HCl", cat: "acidbase", kind: "strongAcid",
      conc: 0.1, color: "#f3d7d0",
      note: "強酸，水中完全解離。與等莫耳的強鹼混合時，pH 會落在 7 附近。"
    },
    acetic: {
      name: "醋酸", formula: "CH₃COOH", cat: "acidbase", kind: "weakAcid",
      conc: 0.1, pKa: 4.76, color: "#efe3d2",
      note: "弱酸，只部分解離。和一半莫耳的強鹼混合時形成緩衝溶液，pH ≈ pKa。"
    },
    naoh: {
      name: "氫氧化鈉", formula: "NaOH", cat: "acidbase", kind: "strongBase",
      conc: 0.1, color: "#dfe9f4",
      note: "強鹼，水中完全解離。會與酸中和並放出熱。"
    },
    ammonia: {
      name: "氨水", formula: "NH₃", cat: "acidbase", kind: "weakBase",
      conc: 0.1, pKb: 4.75, color: "#e4eef7",
      note: "弱鹼。與酸反應生成銨鹽；與其共軛酸同時存在時形成鹼性緩衝。"
    },
    nacl: {
      name: "氯化鈉", formula: "NaCl", cat: "salt", kind: "salt",
      conc: 0.1, color: "#eef3f8",
      note: "中性鹽。提供 Cl⁻，可與 Ag⁺ 生成白色 AgCl 沉澱。"
    },
    cuso4: {
      name: "硫酸銅(II)", formula: "CuSO₄", cat: "salt", kind: "salt",
      conc: 0.05, color: "#4aa8df",
      note: "藍色溶液，提供 Cu²⁺。遇足量 OH⁻ 生成藍色 Cu(OH)₂ 沉澱。"
    },
    agno3: {
      name: "硝酸銀", formula: "AgNO₃", cat: "salt", kind: "salt",
      conc: 0.05, color: "#eef3f8",
      note: "無色溶液，提供 Ag⁺。遇 Cl⁻ 立刻生成白色 AgCl 沉澱。"
    },
    na2co3: {
      name: "碳酸鈉", formula: "Na₂CO₃", cat: "salt", kind: "salt",
      conc: 0.1, color: "#e9f1f7",
      note: "鹼性鹽，提供 CO₃²⁻。遇酸放出 CO₂；遇 Ca²⁺ 或 Cu²⁺ 生成沉澱。"
    },
    cacl2: {
      name: "氯化鈣", formula: "CaCl₂", cat: "salt", kind: "salt",
      conc: 0.1, color: "#eef3f8",
      note: "提供 Ca²⁺ 與 Cl⁻。遇 CO₃²⁻ 生成白色 CaCO₃ 沉澱。"
    },
    universal: {
      name: "廣用指示劑", formula: "混合指示劑", cat: "indicator", kind: "indicator",
      color: "#d8c7ef",
      note: "依 pH 由紅、橙、黃、綠、藍到紫連續變色，適合先看整體酸鹼範圍。"
    },
    phenolphthalein: {
      name: "酚酞", formula: "C₂₀H₁₄O₄", cat: "indicator", kind: "indicator",
      color: "#e58ab2",
      note: "pH 大於約 8.2 時由無色轉為粉紅，常用於強鹼滴定弱酸。"
    },
    methylorange: {
      name: "甲基橙", formula: "C₁₄H₁₄N₃NaO₃S", cat: "indicator", kind: "indicator",
      color: "#f0a050",
      note: "pH 小於 3.1 呈紅、3.1–4.4 呈橙、大於 4.4 呈黃，常用於強酸滴定。"
    },
    water: {
      name: "蒸餾水", formula: "H₂O", cat: "solvent", kind: "water",
      color: "#e8f4ff",
      note: "用來稀釋或補足體積。稀釋不會改變溶質的莫耳數，但會改變濃度。"
    }
  };

  const CATEGORIES = [
    { id: "acidbase", label: "酸鹼" },
    { id: "salt", label: "鹽類" },
    { id: "indicator", label: "指示劑" },
    { id: "solvent", label: "溶劑" }
  ];

  const EXAMPLES = [
    {
      id: "neutral", name: "強酸強鹼中和",
      desc: "25 mL 0.10 M HCl + 25 mL 0.10 M NaOH",
      parts: [["hcl", 25, 0.1], ["naoh", 25, 0.1]], indicator: "universal"
    },
    {
      id: "buffer", name: "弱酸緩衝",
      desc: "25 mL 0.10 M 醋酸 + 12.5 mL 0.10 M NaOH",
      parts: [["acetic", 25, 0.1], ["naoh", 12.5, 0.1]], indicator: "phenolphthalein"
    },
    {
      id: "agcl", name: "白色沉澱",
      desc: "10 mL 0.05 M AgNO₃ + 10 mL 0.10 M NaCl",
      parts: [["agno3", 10, 0.05], ["nacl", 10, 0.1]], indicator: null
    },
    {
      id: "co2", name: "碳酸鹽遇酸",
      desc: "10 mL 0.10 M Na₂CO₃ + 20 mL 0.10 M HCl",
      parts: [["na2co3", 10, 0.1], ["hcl", 20, 0.1]], indicator: "methylorange"
    },
    {
      id: "cuoh2", name: "藍色沉澱",
      desc: "20 mL 0.05 M CuSO₄ + 10 mL 0.10 M NaOH",
      parts: [["cuso4", 20, 0.05], ["naoh", 10, 0.1]], indicator: null
    }
  ];

  const state = {
    portions: [],          // { rid, volume, conc }
    indicator: null,
    selected: "hcl",
    tab: "acidbase",
    history: [],
    future: [],
    pour: null,
    lastMix: null
  };

  /* ------------------------------ 計算 ------------------------------ */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function phColor(ph) {
    const stops = [
      [0, [211, 47, 47]], [2, [244, 81, 30]], [4, [251, 140, 0]], [6, [253, 216, 53]],
      [7, [102, 187, 106]], [8, [38, 166, 154]], [10, [30, 136, 229]], [12, [94, 53, 177]], [14, [49, 27, 146]]
    ];
    const v = clamp(ph, 0, 14);
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i], b = stops[i + 1];
      if (v <= b[0]) {
        const f = (v - a[0]) / (b[0] - a[0] || 1);
        const c = a[1].map((x, k) => Math.round(x + (b[1][k] - x) * f));
        return "rgb(" + c.join(",") + ")";
      }
    }
    return "rgb(49,27,146)";
  }

  /*
   * 加上透明度時不能直接字串接尾。
   * phColor() 回傳的是 rgb(102,187,106)，接上 "cc" 會變成 rgb(102,187,106)cc，
   * addColorStop() 解析失敗就丟錯，整個實驗台從此不再重繪（預設情境一點就白屏）。
   */
  function withAlpha(c, a) {
    if (/^#[0-9a-f]{6}$/i.test(c)) {
      const n = parseInt(c.slice(1), 16);
      return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
    }
    if (/^rgb\(/i.test(c)) return c.replace(/^rgb\(/i, "rgba(").replace(/\)\s*$/, "," + a + ")");
    return c;
  }

  /*
   * 配方 → 混合結果。
   * 刻意把 portions / indicator 當參數而不是直接讀 state：
   * 測試才能在不碰 DOM、不模擬點擊的情況下，逐條驗證 pH、沉澱與氣體。
   */
  function computeFor(portions, indicator) {
    let V = 0, SA = 0, SB = 0, WA = 0, WB = 0, Aminus = 0, BH = 0;
    let Cu = 0, Ag = 0, Ca = 0, Cl = 0, CO3 = 0;
    const pKa = 4.76;
    let pKb = 4.75;
    let hasAmmonia = false;

    (portions || []).forEach(p => {
      const r = REAGENTS[p.rid];
      if (!r || r.kind === "indicator") return;
      const n = p.volume / 1000 * p.conc;
      V += p.volume;
      switch (r.kind) {
        case "strongAcid": SA += n; Cl += n; break;
        case "strongBase": SB += n; break;
        case "weakAcid": WA += n; break;
        case "weakBase": WB += n; hasAmmonia = true; break;
        case "salt":
          if (p.rid === "nacl") Cl += n;
          else if (p.rid === "cuso4") Cu += n;
          else if (p.rid === "agno3") Ag += n;
          else if (p.rid === "na2co3") CO3 += n;
          else if (p.rid === "cacl2") { Ca += n; Cl += 2 * n; }
          break;
      }
    });
    if (indicator) V += 0.1;
    if (!hasAmmonia) pKb = 3.68;         // 碳酸根的鹼性

    const precipitates = [];
    let heat = 0;

    /* 沉澱：限量試劑，先反應的先沉澱 */
    const agcl = Math.min(Ag, Cl);
    if (agcl > 1e-12) {
      Ag -= agcl; Cl -= agcl;
      precipitates.push({ id: "agcl", label: "AgCl 白色沉澱", color: "#f3f6f8", n: agcl });
    }
    if (Cu > 1e-12 && CO3 > 1e-12) {
      const cuCO3 = Math.min(Cu, CO3);
      Cu -= cuCO3; CO3 -= cuCO3;
      precipitates.push({ id: "cuco3", label: "CuCO₃ 藍綠色沉澱", color: "#5fa88f", n: cuCO3 });
    }
    if (Ca > 1e-12 && CO3 > 1e-12) {
      const caco3 = Math.min(Ca, CO3);
      Ca -= caco3; CO3 -= caco3;
      precipitates.push({ id: "caco3", label: "CaCO₃ 白色沉澱", color: "#f3f6f8", n: caco3 });
    }

    /* 碳酸根遇酸放出 CO₂ */
    let co2 = 0;
    if (CO3 > 1e-12 && (SA + WA) > 1e-12) {
      co2 = Math.min(CO3, (SA + WA) / 2);
      let need = co2 * 2;
      const fromSA = Math.min(SA, need);
      SA -= fromSA; need -= fromSA;
      WA = Math.max(0, WA - need);
      CO3 -= co2;
    }

    /* 酸鹼中和 */
    const ss = Math.min(SA, SB);
    SA -= ss; SB -= ss; heat += ss;

    if (SA > 1e-12 && WB > 1e-12) {
      const n = Math.min(SA, WB);
      SA -= n; WB -= n; BH += n; heat += n * 0.95;
    }
    if (SB > 1e-12 && WA > 1e-12) {
      const n = Math.min(SB, WA);
      SB -= n; WA -= n; Aminus += n; heat += n * 0.95;
    }
    if (WA > 1e-12 && WB > 1e-12) {
      const n = Math.min(WA, WB);
      WA -= n; WB -= n; heat += n * 0.95;
    }

    /* Cu(OH)₂：需要強鹼過量 */
    let cuOH = 0;
    if (SB > 1e-12 && Cu > 1e-12) {
      cuOH = Math.min(Cu, SB / 2);
      Cu -= cuOH; SB -= cuOH * 2;
      precipitates.push({ id: "cuoh2", label: "Cu(OH)₂ 藍色沉澱", color: "#2e86de", n: cuOH });
    }
    /* 剩下的碳酸根以弱鹼計 */
    if (CO3 > 1e-12) WB += CO3;

    const L = Math.max(V, 1) / 1000;
    let pH;
    if (SA > 1e-12) pH = -Math.log10(SA / L);
    else if (SB > 1e-12) pH = 14 + Math.log10(SB / L);
    else if (WA > 1e-12 && Aminus > 1e-12) pH = pKa + Math.log10(Aminus / WA);
    else if (WB > 1e-12 && BH > 1e-12) pH = (14 - pKb) + Math.log10(WB / BH);
    else if (WA > 1e-12) pH = 0.5 * (pKa - Math.log10(WA / L));
    else if (WB > 1e-12) pH = 14 - 0.5 * (pKb - Math.log10(WB / L));
    else if (Aminus > 1e-12) {
      const pKbConj = 14 - pKa;
      pH = 14 - 0.5 * (pKbConj - Math.log10(Aminus / L));
    } else if (BH > 1e-12) {
      const pKaConj = 14 - pKb;
      pH = 0.5 * (pKaConj - Math.log10(BH / L));
    } else {
      pH = 7;
    }
    pH = clamp(pH, 0, 14);

    /* 顏色 */
    let liquid = "#e8f4ff";
    if (Cu > 1e-12) liquid = "#4aa8df";
    if (precipitates.some(p => p.id === "cuoh2" || p.id === "cuco3")) liquid = "#7cc3e8";
    if (indicator === "universal") liquid = phColor(pH);
    else if (indicator === "phenolphthalein") liquid = pH >= 8.2 ? "#e06a9a" : (Cu > 1e-12 ? "#7cc3e8" : "#eef8ff");
    else if (indicator === "methylorange") liquid = pH < 3.1 ? "#d9534f" : pH < 4.4 ? "#f0a050" : "#f2d060";

    /* 溫度：以水的比熱與中和熱估計 */
    const temp = 25 + (heat * 57100) / Math.max(1, V * 4.18);

    const obs = [];
    if (co2 > 1e-12) obs.push("冒出 CO₂ 氣泡");
    precipitates.forEach(p => obs.push(p.label));
    if (indicator === "universal") obs.push("廣用指示劑呈 " + phBand(pH));
    else if (indicator === "phenolphthalein") obs.push(pH >= 8.2 ? "酚酞呈粉紅" : "酚酞無色");
    else if (indicator === "methylorange") obs.push(pH < 3.1 ? "甲基橙呈紅" : pH < 4.4 ? "甲基橙呈橙" : "甲基橙呈黃");
    if (!obs.length && V > 0) obs.push("沒有明顯的外觀變化");
    if (heat > 1e-12 && temp - 25 > 0.2) obs.push("中和放熱，溫度上升");

    return {
      V, pH, temp, liquid, precipitates, co2, heat, obs,
      band: phBand(pH),
      strong: { acid: SA, base: SB },
      moles: { Cu, Ag, Ca, Cl, CO3 }
    };
  }

  function compute() {
    return computeFor(state.portions, state.indicator);
  }

  function phBand(ph) {
    if (ph < 3) return "強酸性";
    if (ph < 6.5) return "弱酸性";
    if (ph <= 7.5) return "中性";
    if (ph < 11) return "弱鹼性";
    return "強鹼性";
  }

  /* ------------------------------ 狀態與復原 ------------------------------ */
  function snapshot() {
    return {
      portions: state.portions.map(p => ({ rid: p.rid, volume: p.volume, conc: p.conc })),
      indicator: state.indicator
    };
  }
  function restore(s) {
    state.portions = (s.portions || []).map(p => ({ rid: p.rid, volume: p.volume, conc: p.conc }));
    state.indicator = s.indicator || null;
    refresh();
  }
  function pushHistory() {
    state.history.push(snapshot());
    if (state.history.length > 60) state.history.shift();
    state.future.length = 0;
    updateUndoButtons();
  }
  function updateUndoButtons() {
    const u = $("#lab-undo"), r = $("#lab-redo");
    if (u) u.disabled = !state.history.length;
    if (r) r.disabled = !state.future.length;
  }
  function undo() {
    if (!state.history.length) return;
    state.future.push(snapshot());
    restore(state.history.pop());
    updateUndoButtons();
    toast("已復原");
  }
  function redo() {
    if (!state.future.length) return;
    state.history.push(snapshot());
    restore(state.future.pop());
    updateUndoButtons();
    toast("已重做");
  }

  function addPortion(rid, volume, conc) {
    const r = REAGENTS[rid];
    if (!r) return;
    if (r.kind === "indicator") {
      pushHistory();
      state.indicator = rid;
      refresh();
      toast("已滴入" + r.name);
      return;
    }
    const cur = compute();
    if (cur.V + volume > CAPACITY) {
      toast("燒杯只有 " + CAPACITY + " mL，請先倒掉一些");
      return;
    }
    pushHistory();
    state.portions.push({ rid, volume, conc });
    state.pour = { color: r.color || "#cfe8ff", t: performance.now() };
    refresh();
    toast("加入 " + volume + " mL " + r.name);
  }

  function removePortion(index) {
    if (index < 0 || index >= state.portions.length) return;
    pushHistory();
    state.portions.splice(index, 1);
    refresh();
    toast("已移除一杯");
  }

  function clearAll() {
    if (!state.portions.length && !state.indicator) return;
    pushHistory();
    state.portions = [];
    state.indicator = null;
    refresh();
    toast("已倒掉重來");
  }

  function loadExample(id) {
    const ex = EXAMPLES.find(x => x.id === id);
    if (!ex) return;
    pushHistory();
    state.portions = ex.parts.map(p => ({ rid: p[0], volume: p[1], conc: p[2] }));
    state.indicator = ex.indicator || null;
    state.pour = { color: "#cfe8ff", t: performance.now() };
    refresh();
    toast("載入範例：" + ex.name);
  }

  /* ------------------------------ 畫面 ------------------------------ */
  /*
   * 這支檔案也會被測試以純 Node 載入（只為了驗 computeFor 的化學計算）。
   * 那種環境裡沒有 #lab-canvas，若在這裡直接 canvas.getContext 就會在
   * 載入階段整個炸掉，連後面的 window.ChemLabMixer 都 export 不出來。
   * 因此畫布與繪圖環境都允許為 null；所有會用到它們的函式都由 init() 把关。
   */
  const canvas = $("#lab-canvas");
  const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  let W = 0, H = 0, dpr = 1;

  function css(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function resize() {
    const box = canvas.parentElement.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(320, box.width);
    H = Math.max(260, box.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.moveTo(x + rr, y);
      ctx.lineTo(x + w - rr, y); ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
      ctx.lineTo(x + w, y + h - rr); ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
      ctx.lineTo(x + rr, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
      ctx.lineTo(x, y + rr); ctx.quadraticCurveTo(x, y, x + rr, y);
    }
    ctx.closePath();
  }

  function draw(now) {
    if (!W || !H) resize();
    const m = state.lastMix || compute();
    const light = document.documentElement.getAttribute("data-theme") === "light";
    const bg = css("--sim-bg-1", light ? "#eef2f8" : "#171c22");
    const text = css("--text", light ? "#16202e" : "#eef3fa");
    const dim = css("--text-dim", light ? "#4b5b6f" : "#9fb0c4");
    const faint = css("--text-faint", light ? "#7b8a9c" : "#6e7f93");
    const border = css("--border", light ? "#cfdae8" : "#2b3643");
    const accent = css("--accent", "#3fb0f0");

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const cx = W * 0.44;
    const baseY = Math.min(H * 0.82, H - 58);
    const bw = Math.min(250, W * 0.34);
    const bh = Math.min(H * 0.50, 330);
    const left = cx - bw / 2, right = cx + bw / 2;
    const top = baseY - bh;

    /* 檯面 */
    ctx.fillStyle = light ? "rgba(120,100,80,0.18)" : "rgba(255,255,255,0.06)";
    ctx.fillRect(0, baseY + 10, W, 2);
    ctx.fillStyle = light ? "rgba(120,100,80,0.07)" : "rgba(255,255,255,0.025)";
    ctx.fillRect(0, baseY + 12, W, H - baseY - 12);

    /* 燒杯液體 */
    const level = clamp(m.V / CAPACITY, 0, 1);
    const liquidTop = baseY - bh * 0.88 * level;
    const inner = { x: left + 4, y: top + 4, w: bw - 8, h: baseY - top - 6 };
    if (level > 0.001) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(inner.x, baseY - 7);
      ctx.lineTo(inner.x, inner.y);
      ctx.lineTo(inner.x + inner.w, inner.y);
      ctx.lineTo(inner.x + inner.w, baseY - 7);
      ctx.quadraticCurveTo(cx, baseY + 4, inner.x, baseY - 7);
      ctx.closePath();
      ctx.clip();
      const g = ctx.createLinearGradient(0, liquidTop, 0, baseY);
      g.addColorStop(0, withAlpha(m.liquid, 0.80));
      g.addColorStop(1, withAlpha(m.liquid, 0.93));
      ctx.fillStyle = g;
      ctx.fillRect(inner.x, liquidTop, inner.w, baseY - liquidTop + 6);
      ctx.restore();

      /* 液面 */
      ctx.save();
      ctx.strokeStyle = light ? "rgba(255,255,255,0.9)" : "rgba(235,248,255,0.75)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(cx, liquidTop, bw * 0.47, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      /* 沉澱 */
      if (m.precipitates.length) {
        const p = m.precipitates[0];
        const amount = clamp(p.n * 4000, 6, 46);
        ctx.save();
        ctx.fillStyle = p.color;
        for (let i = 0; i < amount; i++) {
          const a = (i * 2.39996) % (Math.PI * 2);
          const rr = Math.sqrt((i + 0.5) / amount) * bw * 0.36;
          const x = cx + Math.cos(a) * rr;
          const y = baseY - 6 - Math.abs(Math.sin(a)) * 7 - (i % 4);
          ctx.beginPath();
          ctx.arc(x, y, 2 + (i % 3) * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      /* 氣泡 */
      if (m.co2 > 1e-12) {
        const n = Math.round(clamp(m.co2 * 22000, 6, 42));
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        for (let i = 0; i < n; i++) {
          const speed = 16 + (i % 5) * 5;
          const span = baseY - liquidTop - 10;
          const y = baseY - 12 - ((now / 1000 * speed + i * 37) % Math.max(20, span));
          const x = cx + Math.sin(i * 2.1 + now / 900) * bw * 0.30;
          const r = 1.6 + (i % 4) * 0.8;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.restore();
      }
    }

    /* 玻璃杯身 */
    ctx.save();
    ctx.strokeStyle = light ? "rgba(84,124,152,0.85)" : "rgba(206,232,244,0.75)";
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left, baseY - 10);
    ctx.quadraticCurveTo(left, baseY + 2, left + 14, baseY + 2);
    ctx.lineTo(right - 14, baseY + 2);
    ctx.quadraticCurveTo(right, baseY + 2, right, baseY - 10);
    ctx.lineTo(right, top);
    ctx.stroke();
    /* 杯口 */
    ctx.beginPath();
    ctx.moveTo(left - 6, top);
    ctx.lineTo(right + 6, top);
    ctx.stroke();
    ctx.restore();

    /* 刻度 */
    ctx.save();
    ctx.strokeStyle = faint;
    ctx.fillStyle = faint;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 8; i++) {
      const y = baseY - 8 - (baseY - top - 14) * i / 8;
      ctx.beginPath(); ctx.moveTo(right + 2, y); ctx.lineTo(right + (i % 2 ? 7 : 12), y); ctx.stroke();
      if (i % 2 === 0) ctx.fillText(String(i * 50), right + 15, y + 3);
    }
    ctx.restore();

    /* 燒杯標籤 */
    ctx.save();
    ctx.fillStyle = dim;
    ctx.font = "600 11px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.fillText("400 mL", cx, baseY + 24);
    ctx.fillStyle = faint;
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText(m.V.toFixed(1) + " mL", cx, baseY + 39);
    ctx.restore();

    /* 倒入動畫 */
    if (state.pour && now - state.pour.t < 750) {
      const k = (now - state.pour.t) / 750;
      const px = cx + bw * 0.18;
      const py = top - 86;
      ctx.save();
      ctx.strokeStyle = light ? "rgba(84,124,152,0.7)" : "rgba(206,232,244,0.55)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(px - 16, py);
      ctx.lineTo(px - 16, py + 58);
      ctx.moveTo(px + 16, py);
      ctx.lineTo(px + 16, py + 58);
      ctx.moveTo(px - 18, py);
      ctx.lineTo(px + 18, py);
      ctx.moveTo(px - 18, py + 58);
      ctx.quadraticCurveTo(px, py + 68, px + 18, py + 58);
      ctx.stroke();
      ctx.fillStyle = withAlpha(state.pour.color, 0.73);
      ctx.fillRect(px - 14, py + 14 + 30 * (1 - k), 28, 44 * k);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = withAlpha(state.pour.color, 0.80);
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(px, py + 66);
      ctx.lineTo(px + 2, liquidTop + 2);
      ctx.stroke();
      ctx.restore();
    }

    /* pH 計 */
    const meterW = Math.min(150, W * 0.19);
    const mx = Math.min(W - meterW - 26, right + 58);
    const my = top + 10;
    ctx.save();
    roundRect(mx, my, meterW, 88, 10);
    ctx.fillStyle = light ? "#f7fafc" : "#101821";
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = faint;
    ctx.font = "10px ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText("pH METER", mx + 12, my + 18);
    ctx.fillStyle = m.pH < 3 ? "#e25555" : m.pH > 11 ? "#5b8def" : accent;
    ctx.font = "700 26px ui-monospace, monospace";
    ctx.fillText(m.pH.toFixed(2), mx + 12, my + 54);
    ctx.fillStyle = dim;
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("T " + m.temp.toFixed(1) + " °C", mx + 12, my + 74);
    ctx.restore();

    /* 觀察文字 */
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = dim;
    ctx.font = "12px system-ui, sans-serif";
    const obs = m.obs.length ? m.obs.join(" · ") : "尚未加入任何溶液";
    ctx.fillText(obs.length > 46 ? obs.slice(0, 46) + "…" : obs, W / 2, H - 20);
    ctx.restore();
  }

  function loop(now) {
    draw(now == null ? performance.now() : now);
    requestAnimationFrame(loop);
  }

  /* ------------------------------ 面板 ------------------------------ */
  function buildTabs() {
    const host = $("#lab-tabs");
    host.innerHTML = "";
    CATEGORIES.forEach(cat => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "lab-tab";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(cat.id === state.tab));
      b.dataset.cat = cat.id;
      b.innerHTML = iconFor(cat.id) + "<span>" + cat.label + "</span>";
      b.addEventListener("click", () => {
        state.tab = cat.id;
        buildTabs();
        buildTiles();
      });
      host.appendChild(b);
    });
  }

  function iconFor(cat) {
    const stroke = "currentColor";
    if (cat === "acidbase") {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6M10 3v6L5 19.5A1 1 0 0 0 5.9 21h12.2a1 1 0 0 0 .9-1.5L14 9V3"/><path d="M8 15h8"/></svg>';
    }
    if (cat === "salt") {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 9h14l-1.5 10.2a1.4 1.4 0 0 1-1.4 1.3H7.9a1.4 1.4 0 0 1-1.4-1.3z"/><path d="M4 9h16"/><circle cx="10" cy="14" r="1"/><circle cx="14" cy="15" r="1"/><circle cx="12" cy="18" r="1"/></svg>';
    }
    if (cat === "indicator") {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6M12 3v7"/><path d="M9 10h6l2.4 7.6A2 2 0 0 1 15.5 20h-7a2 2 0 0 1-1.9-2.4z"/><path d="M10 15h4"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3s6 6.4 6 10a6 6 0 0 1-12 0c0-3.6 6-10 6-10z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/></svg>';
  }

  function reagentIcon(r) {
    const c = r.color || "#cfe8ff";
    if (r.cat === "indicator") {
      return '<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M26 4h12M32 4v10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M25 14h14l5 17a7 7 0 0 1-7 8H27a7 7 0 0 1-7-8z" fill="' + c + '" opacity="0.75" stroke="currentColor" stroke-width="1.6"/></svg>';
    }
    if (r.cat === "solvent") {
      return '<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M32 3s12 13.5 12 21a12 12 0 0 1-24 0c0-7.5 12-21 12-21z" fill="' + c + '" opacity="0.8" stroke="currentColor" stroke-width="1.6"/></svg>';
    }
    return '<svg viewBox="0 0 64 40" aria-hidden="true"><path d="M24 4h16M27 4v10L17 32a5 5 0 0 0 4.6 7h20.8A5 5 0 0 0 47 32L37 14V4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M22 27h20l3 5a5 5 0 0 1-4.6 7H23.6A5 5 0 0 1 19 32z" fill="' + c + '" opacity="0.8"/></svg>';
  }

  function buildTiles() {
    const host = $("#lab-tiles");
    host.innerHTML = "";
    Object.keys(REAGENTS).filter(id => REAGENTS[id].cat === state.tab).forEach(id => {
      const r = REAGENTS[id];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "lab-tile";
      b.dataset.rid = id;
      b.setAttribute("aria-pressed", String(state.selected === id));
      b.innerHTML = reagentIcon(r) + "<span>" + r.name + "</span><small>" + r.formula + "</small>";
      b.addEventListener("click", () => {
        state.selected = id;
        buildTiles();
        renderInspector();
      });
      host.appendChild(b);
    });
  }

  function buildExamples() {
    const host = $("#lab-examples");
    host.innerHTML = "<h3>範例配方</h3>";
    EXAMPLES.forEach(ex => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "menuitem");
      b.innerHTML = ex.name + "<small>" + ex.desc + "</small>";
      b.addEventListener("click", () => { closeMenus(); loadExample(ex.id); });
      host.appendChild(b);
    });
    const empty = $("#lab-empty-actions");
    if (empty) {
      empty.innerHTML = "";
      EXAMPLES.slice(0, 3).forEach(ex => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = ex.name;
        b.addEventListener("click", () => loadExample(ex.id));
        empty.appendChild(b);
      });
    }
  }

  function readoutHtml(m) {
    return '<dl class="lab-readouts">' +
      '<div><dt>pH</dt><dd>' + m.pH.toFixed(2) + '</dd></div>' +
      '<div><dt>總體積</dt><dd>' + m.V.toFixed(1) + ' mL</dd></div>' +
      '<div><dt>溫度</dt><dd>' + m.temp.toFixed(1) + ' °C</dd></div>' +
      '<div><dt>酸鹼</dt><dd>' + m.band + '</dd></div>' +
      '<div class="wide"><dt>觀察</dt><dd>' + (m.obs.length ? m.obs.join(" · ") : "—") + '</dd></div>' +
      '</dl>';
  }

  function renderInspector() {
    const host = $("#lab-inspector");
    const r = REAGENTS[state.selected];
    if (!r) { host.innerHTML = ""; return; }
    const m = state.lastMix || compute();
    const cat = (CATEGORIES.find(c => c.id === r.cat) || {}).label || "";
    const isIndicator = r.kind === "indicator";
    const maxVol = r.cat === "solvent" ? 200 : 100;
    const defVol = r.cat === "solvent" ? 50 : (isIndicator ? 0 : 25);
    const concStep = 0.01;
    const canConc = !isIndicator && r.kind !== "water";

    let html = '<h2>' + r.name + ' <span class="cat">' + cat + '</span></h2>' +
      '<p class="desc">' + r.formula + '　' + r.note + '</p>';

    if (isIndicator) {
      html += '<button class="lab-btn lab-add" id="lab-add" type="button">滴入 2 滴</button>';
    } else {
      if (canConc) {
        html += '<div class="lab-field"><div class="lab-field-head"><label for="lab-conc">濃度</label><output id="lab-conc-out">' + r.conc.toFixed(2) + ' M</output></div>' +
          '<input id="lab-conc" type="range" min="0.01" max="1" step="' + concStep + '" value="' + r.conc + '"></div>';
      }
      html += '<div class="lab-field"><div class="lab-field-head"><label for="lab-vol">體積</label><output id="lab-vol-out">' + defVol + ' mL</output></div>' +
        '<input id="lab-vol" type="range" min="5" max="' + maxVol + '" step="5" value="' + defVol + '"></div>' +
        '<button class="lab-btn lab-add" id="lab-add" type="button">倒入燒杯</button>';
    }

    html += '<div class="sec">燒杯內容</div>';
    if (!state.portions.length && !state.indicator) {
      html += '<p class="desc">空燒杯。先選一種試劑倒進去。</p>';
    } else {
      html += '<ul class="lab-portions">';
      state.portions.forEach((p, i) => {
        const rr = REAGENTS[p.rid];
        html += '<li><span><b>' + rr.name + '</b> ' + p.volume + ' mL · ' + p.conc.toFixed(2) + ' M</span>' +
          '<button type="button" data-remove="' + i + '" aria-label="移除 ' + rr.name + '">移除</button></li>';
      });
      if (state.indicator) {
        html += '<li><span><b>' + REAGENTS[state.indicator].name + '</b> 2 滴</span><button type="button" data-remove="indicator" aria-label="移除指示劑">移除</button></li>';
      }
      html += '</ul>';
    }

    html += '<div class="sec">即時讀數</div>' + readoutHtml(m);
    html += '<p class="tip">模型用限量試劑與 Ka／Kb 近似；沉澱與氣體以「反應完全」處理。真實實驗仍會受活度、動力學與副反應影響。</p>';
    html += '<p class="keys"><kbd>Ctrl</kbd>+<kbd>Z</kbd> 復原　<kbd>Esc</kbd> 關閉選單</p>';
    host.innerHTML = html;

    /* 事件 */
    const addBtn = host.querySelector("#lab-add");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        if (isIndicator) addPortion(r.id, 0.1, 0);
        else {
          const concEl = host.querySelector("#lab-conc");
          const volEl = host.querySelector("#lab-vol");
          addPortion(r.id, Number(volEl ? volEl.value : defVol), concEl ? Number(concEl.value) : r.conc);
        }
      });
    }
    const concEl = host.querySelector("#lab-conc");
    if (concEl) {
      concEl.addEventListener("input", () => {
        host.querySelector("#lab-conc-out").textContent = Number(concEl.value).toFixed(2) + " M";
      });
    }
    const volEl = host.querySelector("#lab-vol");
    if (volEl) {
      volEl.addEventListener("input", () => {
        host.querySelector("#lab-vol-out").textContent = Number(volEl.value) + " mL";
      });
    }
    host.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        const v = btn.dataset.remove;
        if (v === "indicator") {
          pushHistory(); state.indicator = null; refresh(); toast("已移除指示劑");
        } else removePortion(Number(v));
      });
    });
  }

  function updateHeader(m) {
    const ph = $("#lab-ph"), vol = $("#lab-volume"), temp = $("#lab-temp");
    if (ph) ph.textContent = "pH " + (m.V > 0 ? m.pH.toFixed(2) : "—");
    if (vol) vol.textContent = m.V.toFixed(1) + " mL";
    if (temp) temp.textContent = m.temp.toFixed(1) + " °C";
    const status = $("#lab-status");
    if (status) {
      status.textContent = m.V > 0
        ? "燒杯 " + m.V.toFixed(1) + " mL，pH " + m.pH.toFixed(2) + "（" + m.band + "）。" + (m.obs.length ? m.obs.join(" · ") : "")
        : "尚未加入任何溶液。";
    }
    const empty = $("#lab-empty");
    if (empty) empty.hidden = m.V > 0;
    canvas.setAttribute("aria-label",
      m.V > 0
        ? "燒杯實驗台。目前 " + m.V.toFixed(1) + " mL，pH " + m.pH.toFixed(2) + "，" + (m.obs.length ? m.obs.join("、") : "沒有明顯變化") + "。"
        : "燒杯實驗台。空燒杯，請從左側試劑架選擇溶液。");
  }

  function refresh() {
    state.lastMix = compute();
    updateHeader(state.lastMix);
    renderInspector();
    updateUndoButtons();
    save();
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 1,
        portions: state.portions,
        indicator: state.indicator
      }));
    } catch (e) { /* 私密模式不影響使用 */ }
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.portions)) return false;
      state.portions = data.portions.filter(p => REAGENTS[p.rid]).map(p => ({
        rid: p.rid, volume: Number(p.volume) || 0, conc: Number(p.conc) || 0.1
      }));
      state.indicator = data.indicator && REAGENTS[data.indicator] ? data.indicator : null;
      return state.portions.length > 0 || !!state.indicator;
    } catch (e) { return false; }
  }

  /* ------------------------------ 選單與檔案 ------------------------------ */
  function closeMenus() {
    ["#lab-examples", "#lab-file"].forEach(sel => {
      const pop = $(sel);
      if (pop) pop.hidden = true;
    });
    ["#lab-examples-btn", "#lab-file-btn"].forEach(sel => {
      const b = $(sel);
      if (b) b.setAttribute("aria-expanded", "false");
    });
  }
  function toggleMenu(btnSel, popSel) {
    const btn = $(btnSel), pop = $(popSel);
    if (!btn || !pop) return;
    const open = pop.hidden;
    closeMenus();
    pop.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  }

  function toast(message) {
    const t = $("#lab-toast");
    if (!t) return;
    t.textContent = message;
    t.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { t.hidden = true; }, 2200);
  }

  function encodeState() {
    const data = {
      p: state.portions.map(p => [p.rid, p.volume, p.conc]),
      i: state.indicator
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  }
  function decodeState(str) {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(str))));
      if (!data || !Array.isArray(data.p)) return false;
      state.portions = data.p.filter(a => Array.isArray(a) && REAGENTS[a[0]]).map(a => ({
        rid: a[0], volume: Number(a[1]) || 0, conc: Number(a[2]) || 0.1
      }));
      state.indicator = data.i && REAGENTS[data.i] ? data.i : null;
      return true;
    } catch (e) { return false; }
  }

  function share() {
    const hash = "#mix=" + encodeState();
    try { history.replaceState(null, "", hash); } catch (e) { location.hash = hash; }
    const url = location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => toast("配方連結已複製"), () => toast("已更新網址，請自行複製"));
    } else toast("已更新網址，請自行複製");
  }

  function exportJson() {
    const data = { app: "senior-chemistry-lab", v: 1, portions: state.portions, indicator: state.indicator };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    const d = new Date();
    const day = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    link.href = URL.createObjectURL(blob);
    link.download = "chemistry-lab-" + day + ".json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    toast("已下載配方");
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!data || !Array.isArray(data.portions)) throw new Error("格式不符");
        const parts = data.portions.filter(p => REAGENTS[p.rid]).map(p => ({
          rid: p.rid, volume: Number(p.volume) || 0, conc: Number(p.conc) || 0.1
        }));
        if (!parts.length) throw new Error("沒有可用的試劑");
        pushHistory();
        state.portions = parts;
        state.indicator = data.indicator && REAGENTS[data.indicator] ? data.indicator : null;
        refresh();
        toast("已載入配方");
      } catch (e) {
        toast("讀不到這個檔案：" + e.message);
      }
    };
    reader.readAsText(file);
  }

  function savePng() {
    try {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "chemistry-lab.png";
      link.click();
      toast("已存成圖片");
    } catch (e) { toast("這個瀏覽器無法存圖"); }
  }

  /* ------------------------------ 初始化 ------------------------------ */
  function initTheme() {
    const btn = $("#lab-theme");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      const next = cur === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("pl-theme", JSON.stringify(next)); } catch (e) {}
    });
  }

  function init() {
    // 測試或嵌入頁若沒有 lab 版面，不要把整支程式炸掉。
    if (!canvas) return;
    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas.parentElement);
    window.addEventListener("resize", resize);

    buildTabs();
    buildTiles();
    buildExamples();
    initTheme();

    /* 從分享連結或本機存檔還原 */
    let restored = false;
    const m = /#mix=([^&]+)/.exec(location.hash || "");
    if (m) restored = decodeState(m[1]);
    if (!restored) restored = loadSaved();
    refresh();
    if (restored) toast("已還原上次的配方");

    $("#lab-undo").addEventListener("click", undo);
    $("#lab-redo").addEventListener("click", redo);
    $("#lab-examples-btn").addEventListener("click", () => toggleMenu("#lab-examples-btn", "#lab-examples"));
    $("#lab-file-btn").addEventListener("click", () => toggleMenu("#lab-file-btn", "#lab-file"));

    $("#lab-file").addEventListener("click", e => {
      const b = e.target.closest("[data-act]");
      if (!b) return;
      closeMenus();
      const act = b.dataset.act;
      if (act === "share") share();
      else if (act === "export") exportJson();
      else if (act === "import") $("#lab-import").click();
      else if (act === "png") savePng();
      else if (act === "clear") clearAll();
    });
    $("#lab-import").addEventListener("change", e => {
      const f = e.target.files && e.target.files[0];
      if (f) importJson(f);
      e.target.value = "";
    });

    document.addEventListener("click", e => {
      if (!e.target.closest(".lab-menu")) closeMenus();
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closeMenus();
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.key === "Z" && e.shiftKey) || (e.key === "y" && !e.shiftKey)) { e.preventDefault(); redo(); }
    });

    requestAnimationFrame(loop);
  }

  /*
   * 對外（測試與未來的外部工具）只露出純函式，
   * 不暴露 DOM 狀態，避免有人繞過 UI 直接改配方而造成存檔不同步。
   */
  window.ChemLabMixer = { computeFor, REAGENTS, phColor, phBand };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
