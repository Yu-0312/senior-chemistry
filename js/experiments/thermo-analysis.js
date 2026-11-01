/* 模組十二 · 選修：熱力學與分析 */
(function () {
  "use strict";
  const PL = window.PhysicsLab, CK = window.ChemLab, D = PL.draw;

  const REACTIONS = {
    methane: {
      name: "甲烷燃燒",
      eq: "CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l)",
      rows: [["CH₄(g)", -74.8, "反應物"], ["O₂(g)", 0, "反應物"], ["CO₂(g)", -393.5, "生成物"], ["H₂O(l)", -285.8, "生成物"]],
      dh: -890.3
    },
    water: {
      name: "水的生成",
      eq: "H₂(g) + ½O₂(g) → H₂O(l)",
      rows: [["H₂(g)", 0, "反應物"], ["O₂(g)", 0, "反應物"], ["H₂O(l)", -285.8, "生成物"]],
      dh: -285.8
    },
    co: {
      name: "一氧化碳燃燒",
      eq: "CO(g) + ½O₂(g) → CO₂(g)",
      rows: [["CO(g)", -110.5, "反應物"], ["O₂(g)", 0, "反應物"], ["CO₂(g)", -393.5, "生成物"]],
      dh: -283.0
    },
    lime: {
      name: "石灰石分解",
      eq: "CaCO₃(s) → CaO(s) + CO₂(g)",
      rows: [["CaCO₃(s)", -1206.9, "反應物"], ["CaO(s)", -635.1, "生成物"], ["CO₂(g)", -393.5, "生成物"]],
      dh: 178.3
    },
    ammonia: {
      name: "氨的合成",
      eq: "N₂(g) + 3H₂(g) → 2NH₃(g)",
      rows: [["N₂(g)", 0, "反應物"], ["H₂(g)", 0, "反應物"], ["NH₃(g)", -45.9, "生成物"]],
      dh: -91.8
    },
    ethanol: {
      name: "乙醇燃燒",
      eq: "C₂H₅OH(l) + 3O₂(g) → 2CO₂(g) + 3H₂O(l)",
      rows: [["C₂H₅OH(l)", -277.7, "反應物"], ["O₂(g)", 0, "反應物"], ["CO₂(g)", -393.5, "生成物"], ["H₂O(l)", -285.8, "生成物"]],
      dh: -1366.8
    }
  };

  PL.register("enthalpy", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const r = REACTIONS[reactionSel.get()];
          CK.panel(ctx, W * 0.06, H * 0.08, W * 0.88, H * 0.30, r.name);
          D.text(ctx, r.eq, W / 2, H * 0.19, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "ΔH = ΣΔHf(生成物) − ΣΔHf(反應物)", W / 2, H * 0.29, { color: PL.col("text-faint"), size: 10, align: "center" });
          CK.panel(ctx, W * 0.06, H * 0.42, W * 0.88, H * 0.42, "標準生成焓 ΔHf°（kJ/mol）");
          r.rows.forEach((row, i) => {
            const y = H * 0.50 + i * H * 0.07;
            D.text(ctx, row[0], W * 0.14, y, { color: row[2] === "生成物" ? "#66bb6a" : "#ff8a65", size: 10 });
            D.text(ctx, row[2], W * 0.52, y, { color: PL.col("text-faint"), size: 9, align: "center" });
            const v = row[1];
            D.text(ctx, (v > 0 ? "+" : "") + v.toFixed(1), W * 0.86, y, { color: PL.col("text-dim"), size: 11, align: "right" });
          });
          D.text(ctx, "ΔH = " + (r.dh > 0 ? "+" : "") + r.dh.toFixed(1) + " kJ/mol", W / 2, H * 0.87, {
            color: r.dh < 0 ? "#66bb6a" : "#ff8a65", size: 22, align: "center", weight: "700"
          });
          rDH.set(r.dh, 1);
          rType.set(r.dh < 0 ? "放熱（ΔH < 0）" : "吸熱（ΔH > 0）");
          rSign.set(r.dh < 0 ? "生成物能量較低" : "生成物能量較高");
          rHess.set("只與初末狀態有關，與途徑無關");
        }
      });
      const reactionSel = PL.ui.select(ui.L.controls, { label: "反應", value: "methane", options: Object.keys(REACTIONS).map(k => ({ value: k, label: REACTIONS[k].name })) });
      PL.ui.note(ui.L.controls, "赫斯定律：反應熱只取決於始態與末態。把已知反應式相加，就能算出難以直接測量的 ΔH。");
      const rDH = PL.ui.readout(ui.L.readouts, { label: "反應熱 ΔH", unit: "kJ/mol" });
      const rType = PL.ui.readout(ui.L.readouts, { label: "熱效應" });
      const rSign = PL.ui.readout(ui.L.readouts, { label: "能量圖" });
      const rHess = PL.ui.readout(ui.L.readouts, { label: "赫斯定律" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("calorimetry", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const m = massS.get(), P = powerS.get(), t = timeS.get(), T0 = startS.get();
          const q = P * t, dT = q / (m * 4.18), Tf = T0 + dT;
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.88, H * 0.50, "絕熱卡計");
          CK.calorimeter(ctx, W * 0.34, H * 0.52, 140, 130, Tf, { label: m + " g 水" });
          for (let i = 0; i < 9; i++) D.disc(ctx, W * 0.28 + (i * 31 % 80), H * 0.44 + (i * 17 % 40), 2.4, { fill: "rgba(255,220,180,0.8)" });
          CK.panel(ctx, W * 0.56, H * 0.09, W * 0.38, H * 0.50, "能量計算");
          D.text(ctx, "q = P·t", W * 0.75, H * 0.20, { color: PL.col("text-faint"), size: 11, align: "center" });
          D.text(ctx, q.toFixed(0) + " J", W * 0.75, H * 0.30, { color: PL.col("accent"), size: 20, align: "center", weight: "700" });
          D.text(ctx, "ΔT = q / (mc)", W * 0.75, H * 0.40, { color: PL.col("text-faint"), size: 11, align: "center" });
          D.text(ctx, "+" + dT.toFixed(1) + " °C", W * 0.75, H * 0.50, { color: "#ff8a65", size: 18, align: "center", weight: "700" });
          CK.panel(ctx, W * 0.06, H * 0.62, W * 0.88, H * 0.26, "水溫變化");
          const barW = W * 0.70, bx = W * 0.15;
          D.rect(ctx, bx, H * 0.72, barW, 14, { fill: PL.theme.shade(0.55), stroke: PL.col("border"), width: 1, r: 7 });
          D.rect(ctx, bx, H * 0.72, barW * PL.clamp((Tf - 15) / 85, 0, 1), 14, { fill: "#ff8a65", r: 7 });
          D.text(ctx, T0.toFixed(0) + " °C → " + Tf.toFixed(1) + " °C", W / 2, H * 0.82, { color: PL.col("text-dim"), size: 12, align: "center" });
          rQ.set(q, 0); rDT.set(dT, 1); rTf.set(Tf, 1); rC.set(4.18, 2);
        }
      });
      const massS = PL.ui.slider(ui.L.controls, { label: "水的質量", min: 100, max: 500, step: 10, value: 250, unit: "g", digits: 0 });
      const powerS = PL.ui.slider(ui.L.controls, { label: "加熱功率", min: 20, max: 200, step: 10, value: 100, unit: "W", digits: 0 });
      const timeS = PL.ui.slider(ui.L.controls, { label: "加熱時間", min: 10, max: 180, step: 10, value: 60, unit: "s", digits: 0 });
      const startS = PL.ui.slider(ui.L.controls, { label: "初溫", min: 15, max: 30, step: 1, value: 25, unit: "°C", digits: 0 });
      PL.ui.note(ui.L.controls, "q = mcΔT 是 calorimetry 的核心。實際量測時，卡計本身也吸熱，所以要用已知熱量先校正卡計熱容量。");
      const rQ = PL.ui.readout(ui.L.readouts, { label: "吸收熱量", unit: "J" });
      const rDT = PL.ui.readout(ui.L.readouts, { label: "溫升 ΔT", unit: "°C" });
      const rTf = PL.ui.readout(ui.L.readouts, { label: "末溫", unit: "°C" });
      const rC = PL.ui.readout(ui.L.readouts, { label: "水比熱", unit: "J/g·°C" });
      return { stop() { ui.stop(); } };
    }
  });

  const ENTROPY = {
    melt: { name: "冰融化", eq: "H₂O(s) → H₂O(l)", dS: 22, dH: 6.01 },
    boil: { name: "水沸騰", eq: "H₂O(l) → H₂O(g)", dS: 109, dH: 40.7 },
    expand: { name: "氣體自由膨脹", eq: "V₁ → V₂（V₂ > V₁）", dS: 20, dH: 0 },
    lime: { name: "石灰石分解", eq: "CaCO₃(s) → CaO(s) + CO₂(g)", dS: 160, dH: 178.3 },
    ammonia: { name: "氨的合成", eq: "N₂(g) + 3H₂(g) → 2NH₃(g)", dS: -198, dH: -92.4 }
  };

  PL.register("entropy", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const p = ENTROPY[procSel.get()], T = tempS.get();
          const dSsys = p.dS, dSsurr = -p.dH * 1000 / T, dSuniv = dSsys + dSsurr;
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.88, H * 0.30, p.name);
          D.text(ctx, p.eq, W / 2, H * 0.20, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "ΔH = " + (p.dH > 0 ? "+" : "") + p.dH + " kJ/mol　T = " + T + " K", W / 2, H * 0.30, { color: PL.col("text-faint"), size: 10, align: "center" });
          CK.panel(ctx, W * 0.06, H * 0.42, W * 0.88, H * 0.46, "熵的收支");
          const rows = [
            ["ΔS 系統", dSsys, "#66bb6a"],
            ["ΔS 環境", dSsurr, "#64b5f6"],
            ["ΔS 宇宙", dSuniv, dSuniv > 0 ? "#ffb74d" : "#ff8a65"]
          ];
          const maxAbs = Math.max(60, Math.abs(dSsys), Math.abs(dSsurr), Math.abs(dSuniv)) * 1.15;
          const cx = W * 0.50, half = W * 0.32;
          rows.forEach((row, i) => {
            const y = H * 0.52 + i * H * 0.10;
            D.text(ctx, row[0], W * 0.10, y + 4, { color: PL.col("text-dim"), size: 10 });
            D.line(ctx, cx, y - 6, cx, y + 10, PL.col("border"), 1);
            const len = Math.abs(row[1]) / maxAbs * half;
            D.rect(ctx, row[1] >= 0 ? cx : cx - len, y, len, 10, { fill: row[2], r: 4 });
            D.text(ctx, (row[1] > 0 ? "+" : "") + row[1].toFixed(0), W * 0.92, y + 8, { color: PL.col("text-dim"), size: 10, align: "right" });
          });
          D.text(ctx, dSuniv > 0 ? "ΔS宇宙 > 0：自發" : "ΔS宇宙 < 0：非自發", W / 2, H * 0.86, {
            color: dSuniv > 0 ? "#66bb6a" : "#ff8a65", size: 15, align: "center", weight: "700"
          });
          rSys.set(dSsys, 0); rSurr.set(dSsurr, 0); rUniv.set(dSuniv, 0);
          rSpont.set(dSuniv > 0 ? "自發" : "非自發");
        }
      });
      const procSel = PL.ui.select(ui.L.controls, { label: "過程", value: "melt", options: Object.keys(ENTROPY).map(k => ({ value: k, label: ENTROPY[k].name })) });
      const tempS = PL.ui.slider(ui.L.controls, { label: "溫度", min: 250, max: 500, step: 5, value: 273, unit: "K", digits: 0 });
      PL.ui.note(ui.L.controls, "自發性看的是「宇宙」的總熵，不是只有系統。放熱會讓環境熵增加，因此多數放熱反應在常溫下自發。");
      const rSys = PL.ui.readout(ui.L.readouts, { label: "ΔS 系統", unit: "J/K" });
      const rSurr = PL.ui.readout(ui.L.readouts, { label: "ΔS 環境", unit: "J/K" });
      const rUniv = PL.ui.readout(ui.L.readouts, { label: "ΔS 宇宙", unit: "J/K" });
      const rSpont = PL.ui.readout(ui.L.readouts, { label: "自發性" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("gibbs", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const dH = dhS.get(), dS = dsS.get() / 1000, T = tempS.get();
          const dG = dH - T * dS;
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.88, H * 0.78, "ΔG = ΔH − TΔS");
          D.text(ctx, "ΔH = " + (dH > 0 ? "+" : "") + dH + " kJ", W * 0.50, H * 0.22, { color: PL.col("text-dim"), size: 14, align: "center" });
          D.text(ctx, "TΔS = " + (T * dS > 0 ? "+" : "") + (T * dS).toFixed(1) + " kJ", W * 0.50, H * 0.31, { color: PL.col("text-dim"), size: 14, align: "center" });
          D.text(ctx, "ΔG = " + (dG > 0 ? "+" : "") + dG.toFixed(1) + " kJ", W / 2, H * 0.47, {
            color: dG < 0 ? "#66bb6a" : dG > 0 ? "#ff8a65" : "#ffb74d", size: 27, align: "center", weight: "700"
          });
          D.text(ctx, dG < 0 ? "ΔG < 0：反應自發" : dG > 0 ? "ΔG > 0：反應非自發" : "ΔG = 0：處於平衡", W / 2, H * 0.57, {
            color: dG < 0 ? "#66bb6a" : dG > 0 ? "#ff8a65" : "#ffb74d", size: 13, align: "center", weight: "700"
          });
          const barW = W * 0.72, bx = W * 0.14;
          D.text(ctx, "焓項 |ΔH|", bx, H * 0.67, { color: PL.col("text-faint"), size: 9 });
          D.rect(ctx, bx, H * 0.69, barW, 8, { fill: PL.theme.shade(0.55), stroke: PL.col("border"), width: 1, r: 4 });
          D.rect(ctx, bx, H * 0.69, barW * Math.min(1, Math.abs(dH) / 200), 8, { fill: "#ff8a65", r: 4 });
          D.text(ctx, "熵項 |TΔS|", bx, H * 0.76, { color: PL.col("text-faint"), size: 9 });
          D.rect(ctx, bx, H * 0.78, barW, 8, { fill: PL.theme.shade(0.55), stroke: PL.col("border"), width: 1, r: 4 });
          D.rect(ctx, bx, H * 0.78, barW * Math.min(1, Math.abs(T * dS) / 200), 8, { fill: "#64b5f6", r: 4 });
          rG.set(dG, 1);
          rSpont.set(dG < 0 ? "自發" : dG > 0 ? "非自發" : "平衡");
          rCross.set(dS !== 0 ? Math.abs(dH / dS) : "—", 0);
          rBalance.set(Math.abs(dH) > Math.abs(T * dS) ? "焓主導" : "熵主導");
        }
      });
      const dhS = PL.ui.slider(ui.L.controls, { label: "ΔH", min: -200, max: 200, step: 5, value: -80, unit: "kJ", digits: 0 });
      const dsS = PL.ui.slider(ui.L.controls, { label: "ΔS", min: -300, max: 300, step: 5, value: 100, unit: "J/K", digits: 0 });
      const tempS = PL.ui.slider(ui.L.controls, { label: "溫度", min: 200, max: 1000, step: 10, value: 298, unit: "K", digits: 0 });
      PL.ui.note(ui.L.controls, "四個象限代表四種情況：放熱且熵增永遠自發；吸熱且熵減永遠非自發；另外兩種則由溫度決定。");
      const chart = ui.chart("ΔG 對溫度", "曲線與零線的交點就是 ΔG = 0 的轉換溫度：T = ΔH / ΔS。");
      const drawChart = () => {
        const dH = dhS.get(), dS = dsS.get() / 1000, T = tempS.get();
        CK.plot(chart, {
          x0: 0, x1: 1000, y0: -200, y1: 200, xlabel: "T (K)", ylabel: "ΔG (kJ)",
          series: [{ fn: x => dH - x * dS, color: PL.col("accent") }],
          marks: [{ dot: [T, dH - T * dS], color: PL.col("accent-2"), label: "目前" }]
        });
      };
      chart.onResize(drawChart); drawChart();
      root.addEventListener("input", drawChart);
      const rG = PL.ui.readout(ui.L.readouts, { label: "ΔG", unit: "kJ" });
      const rSpont = PL.ui.readout(ui.L.readouts, { label: "自發性" });
      const rCross = PL.ui.readout(ui.L.readouts, { label: "轉換溫度", unit: "K" });
      const rBalance = PL.ui.readout(ui.L.readouts, { label: "主要驅動力" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("arrhenius", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const Ea = eaS.get(), T = tempS.get(), R = 8.314;
          const lnA = Math.log(1e10), lnk = lnA - Ea * 1000 / (R * T);
          const k = Math.exp(lnk);
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.88, H * 0.74, "阿瑞尼斯方程式");
          D.text(ctx, "ln k = ln A − Ea/(RT)", W / 2, H * 0.20, { color: PL.col("accent"), size: 18, align: "center", weight: "700" });
          D.text(ctx, "Ea = " + Ea + " kJ/mol", W * 0.28, H * 0.35, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "T = " + T + " K", W * 0.72, H * 0.35, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "k = " + k.toExponential(2) + " s⁻¹", W / 2, H * 0.49, { color: PL.col("accent"), size: 24, align: "center", weight: "700" });
          D.text(ctx, "ln k = " + lnk.toFixed(2), W / 2, H * 0.59, { color: PL.col("text-dim"), size: 13, align: "center" });
          D.text(ctx, "斜率 = −Ea/R = " + (-Ea * 1000 / R).toFixed(0) + " K", W / 2, H * 0.70, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, Ea > 100 ? "活化能高：升溫效果非常明顯" : "活化能較低：溫度敏感度較小", W / 2, H * 0.78, { color: PL.col("text-faint"), size: 10, align: "center" });
          rK.set(k, 0); rLn.set(lnk, 2); rSlope.set(-Ea * 1000 / R, 0); rEa.set(Ea, 0);
        }
      });
      const eaS = PL.ui.slider(ui.L.controls, { label: "活化能 Ea", min: 20, max: 150, step: 5, value: 80, unit: "kJ/mol", digits: 0 });
      const tempS = PL.ui.slider(ui.L.controls, { label: "溫度", min: 250, max: 700, step: 5, value: 300, unit: "K", digits: 0 });
      PL.ui.note(ui.L.controls, "把 ln k 對 1/T 作圖會得到直線，斜率是 −Ea/R。這也是實驗室測定活化能最常用的方法。");
      const chart = ui.chart("ln k 對 1000/T", "溫度越高，1000/T 越小，ln k 越大。直線斜率越陡，代表活化能越大。");
      const drawChart = () => {
        const Ea = eaS.get(), T = tempS.get(), R = 8.314;
        const f = x => Math.log(1e10) - Ea * 1000 / (R * (x / 1000));
        CK.plot(chart, {
          x0: 1.2, x1: 4.2, y0: -70, y1: 25, xlabel: "1000/T (K⁻¹)", ylabel: "ln k",
          series: [{ fn: f, color: PL.col("accent") }],
          marks: [{ dot: [1000 / T, f(1000 / T)], color: PL.col("accent-2"), label: "目前" }]
        });
      };
      chart.onResize(drawChart); drawChart();
      root.addEventListener("input", drawChart);
      const rK = PL.ui.readout(ui.L.readouts, { label: "速率常數 k" });
      const rLn = PL.ui.readout(ui.L.readouts, { label: "ln k" });
      const rSlope = PL.ui.readout(ui.L.readouts, { label: "直線斜率", unit: "K" });
      const rEa = PL.ui.readout(ui.L.readouts, { label: "活化能", unit: "kJ/mol" });
      return { stop() { ui.stop(); } };
    }
  });

  const SALTS = {
    AgCl: { name: "氯化銀", Ksp: 1.8e-10, p: 1, q: 1, color: "#e0e0e0" },
    PbCl2: { name: "氯化鉛", Ksp: 1.7e-5, p: 1, q: 2, color: "#cfd8dc" },
    CaF2: { name: "氟化鈣", Ksp: 3.9e-11, p: 1, q: 2, color: "#b3e5fc" },
    Ag2CrO4: { name: "鉻酸銀", Ksp: 1.1e-12, p: 2, q: 1, color: "#b71c1c" },
    BaSO4: { name: "硫酸鋇", Ksp: 1.1e-10, p: 1, q: 1, color: "#eceff1" }
  };

  PL.register("ksp", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          /*
           * 滑桿給的是 pC = −log[陽離子]，不是線性濃度。
           * 原本把另一種離子固定在 0.01 M，結果 AgCl 的 Q 在任何滑桿位置
           * 都大於 Ksp（永遠沉澱），學生看不到「越過 Ksp」的那一刻。
           * 現在陰離子濃度依化學式計量跟著陽離子走：
           *   AgCl → [Cl⁻] = c；CaF₂ → [F⁻] = 2c；Ag₂CrO₄ → [CrO₄²⁻] = c/2
           * 這樣 Q 會隨濃度單調變化，低於溶解度時澄清、高於時沉澱。
           */
          const s = SALTS[saltSel.get()];
          const c = Math.pow(10, -ionS.get());
          const other = (s.q / s.p) * c;
          const Q = Math.pow(c, s.p) * Math.pow(other, s.q);
          const precip = Q > s.Ksp;
          const ratio = Q / s.Ksp;
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.52, H * 0.74, s.name + " 的溶解度積");
          CK.beaker(ctx, W * 0.32, H * 0.75, 170, 160, 0.62, "#8fc6e8");
          if (precip) {
            const n = PL.clamp(Math.round(Math.log10(ratio) * 8), 4, 40);
            for (let i = 0; i < n; i++) {
              D.disc(ctx, W * 0.32 - 70 + (i * 37 % 140), H * 0.72 - (i % 3) * 4, 2.5 + (i % 2), { fill: s.color });
            }
            D.text(ctx, "產生沉澱", W * 0.32, H * 0.84, { color: "#ff8a65", size: 12, align: "center", weight: "700" });
          } else {
            D.text(ctx, "澄清溶液", W * 0.32, H * 0.84, { color: "#66bb6a", size: 12, align: "center", weight: "700" });
          }
          CK.panel(ctx, W * 0.62, H * 0.09, W * 0.32, H * 0.74, "Q 與 Ksp");
          D.text(ctx, "Ksp", W * 0.78, H * 0.20, { color: PL.col("text-faint"), size: 9, align: "center" });
          D.text(ctx, s.Ksp.toExponential(1), W * 0.78, H * 0.28, { color: PL.col("accent"), size: 18, align: "center", weight: "700" });
          D.text(ctx, "陽離子 " + c.toExponential(1) + " M", W * 0.78, H * 0.36, { color: PL.col("text-faint"), size: 8, align: "center" });
          D.text(ctx, "Q", W * 0.78, H * 0.44, { color: PL.col("text-faint"), size: 9, align: "center" });
          D.text(ctx, Q.toExponential(1), W * 0.78, H * 0.52, { color: precip ? "#ff8a65" : "#66bb6a", size: 18, align: "center", weight: "700" });
          D.text(ctx, precip ? "Q > Ksp → 沉澱" : "Q < Ksp → 未飽和", W * 0.78, H * 0.62, { color: precip ? "#ff8a65" : "#66bb6a", size: 10, align: "center" });
          D.text(ctx, "莫耳溶解度", W * 0.78, H * 0.71, { color: PL.col("text-faint"), size: 9, align: "center" });
          D.text(ctx, Math.pow(s.Ksp / (Math.pow(s.p, s.p) * Math.pow(s.q, s.q)), 1 / (s.p + s.q)).toExponential(1) + " M", W * 0.78, H * 0.78, { color: PL.col("text-dim"), size: 12, align: "center" });
          rKsp.set(s.Ksp.toExponential(1)); rQ.set(Q.toExponential(1)); rState.set(precip ? "沉澱" : "未飽和");
          rSol.set(Math.pow(s.Ksp / (Math.pow(s.p, s.p) * Math.pow(s.q, s.q)), 1 / (s.p + s.q)), 6);
          rConc.set(c, 8);
        }
      });
      const saltSel = PL.ui.select(ui.L.controls, { label: "難溶鹽", value: "AgCl", options: Object.keys(SALTS).map(k => ({ value: k, label: SALTS[k].name + "（" + k + "）" })) });
      // pC = −log[陽離子]；1 M 到 10⁻⁸ M 的範圍足以讓每種鹽都跨過自己的 Ksp。
      const ionS = PL.ui.slider(ui.L.controls, { label: "pC（−log 陽離子濃度）", min: 1, max: 8, step: 0.05, value: 5, digits: 2 });
      PL.ui.note(ui.L.controls, "陰離子濃度依化學式比例跟著陽離子變（AgCl 1:1、CaF₂ 1:2）。把 pC 調小代表加入更多離子，Q 會上升；超過 Ksp 就開始沉澱。");
      const rKsp = PL.ui.readout(ui.L.readouts, { label: "Ksp" });
      const rQ = PL.ui.readout(ui.L.readouts, { label: "離子積 Q" });
      const rState = PL.ui.readout(ui.L.readouts, { label: "狀態" });
      const rSol = PL.ui.readout(ui.L.readouts, { label: "莫耳溶解度", unit: "M" });
      const rConc = PL.ui.readout(ui.L.readouts, { label: "陽離子濃度", unit: "M" });
      return { stop() { ui.stop(); } };
    }
  });

  const WEAK = {
    acetic: { name: "乙酸", pKa: 4.76 },
    formic: { name: "甲酸", pKa: 3.75 },
    benzoic: { name: "苯甲酸", pKa: 4.20 }
  };

  PL.register("titration-advanced", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const a = WEAK[acidSel.get()], V = volS.get(), Ca = 0.1, Va = 25, Cb = 0.1;
          const pH = phAt(V, Ca, Va, Cb, a.pKa);
          const Veq = Ca * Va / Cb;
          CK.panel(ctx, W * 0.05, H * 0.09, W * 0.46, H * 0.76, "滴定裝置");
          CK.burette(ctx, W * 0.18, H * 0.16, H * 0.52, 0.85 - V / 60, "#cfe8ff");
          CK.flask(ctx, W * 0.30, H * 0.78, 110, 130, 0.45, CK.phColor(pH));
          if (V > 0) CK.drop(ctx, W * 0.18, H * 0.53, "#cfe8ff");
          D.text(ctx, "滴定管", W * 0.18, H * 0.13, { color: PL.col("text-faint"), size: 9, align: "center" });
          D.text(ctx, a.name + " 25 mL", W * 0.30, H * 0.86, { color: PL.col("text-dim"), size: 10, align: "center" });
          D.text(ctx, "pH " + pH.toFixed(2), W * 0.30, H * 0.92, { color: CK.phColor(pH), size: 15, align: "center", weight: "700" });
          CK.panel(ctx, W * 0.55, H * 0.09, W * 0.40, H * 0.76, "滴定曲線重點");
          D.text(ctx, "當量點", W * 0.75, H * 0.20, { color: PL.col("text-faint"), size: 9, align: "center" });
          D.text(ctx, Veq.toFixed(1) + " mL", W * 0.75, H * 0.28, { color: PL.col("accent"), size: 18, align: "center", weight: "700" });
          D.text(ctx, "半當量點", W * 0.75, H * 0.40, { color: PL.col("text-faint"), size: 9, align: "center" });
          D.text(ctx, (Veq / 2).toFixed(1) + " mL，pH = pKa = " + a.pKa, W * 0.75, H * 0.48, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "當量點 pH", W * 0.75, H * 0.58, { color: PL.col("text-faint"), size: 9, align: "center" });
          D.text(ctx, phAt(Veq, Ca, Va, Cb, a.pKa).toFixed(2) + "（> 7）", W * 0.75, H * 0.66, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "建議指示劑：酚酞", W * 0.75, H * 0.76, { color: "#66bb6a", size: 11, align: "center", weight: "700" });
          rPH.set(pH, 2); rVeq.set(Veq, 1); rPka.set(a.pKa, 2);
          rState.set(V < Veq ? "緩衝區" : Math.abs(V - Veq) < 0.3 ? "當量點附近" : "過量鹼");
        }
      });
      const acidSel = PL.ui.select(ui.L.controls, { label: "弱酸", value: "acetic", options: Object.keys(WEAK).map(k => ({ value: k, label: WEAK[k].name + "（pKa " + WEAK[k].pKa + "）" })) });
      const volS = PL.ui.slider(ui.L.controls, { label: "加入 NaOH", min: 0, max: 40, step: 0.5, value: 12.5, unit: "mL", digits: 1 });
      PL.ui.note(ui.L.controls, "弱酸滴定在當量點前有緩衝區，pH 上升緩慢；當量點時只看鹽類水解，所以 pH 大於 7，常用酚酞。");
      const chart = ui.chart("弱酸滴定曲線", "半當量點的 pH 等於 pKa，是求 Ka 最方便的位置。");
      const drawChart = () => {
        const a = WEAK[acidSel.get()], V = volS.get(), pts = [];
        for (let i = 0; i <= 300; i++) { const v = i / 300 * 40; pts.push([v, phAt(v, 0.1, 25, 0.1, a.pKa)]); }
        CK.plot(chart, {
          x0: 0, x1: 40, y0: 0, y1: 14, xlabel: "NaOH (mL)", ylabel: "pH",
          series: [{ pts, color: PL.col("accent") }],
          marks: [
            { vline: 25, color: PL.col("text-faint"), label: "當量點", dash: [4, 4] },
            { dot: [V, phAt(V, 0.1, 25, 0.1, a.pKa)], color: PL.col("accent-2"), label: "目前" }
          ]
        });
      };
      chart.onResize(drawChart); drawChart();
      root.addEventListener("input", drawChart);
      const rPH = PL.ui.readout(ui.L.readouts, { label: "pH" });
      const rVeq = PL.ui.readout(ui.L.readouts, { label: "當量點體積", unit: "mL" });
      const rPka = PL.ui.readout(ui.L.readouts, { label: "pKa" });
      const rState = PL.ui.readout(ui.L.readouts, { label: "所在區域" });
      return { stop() { ui.stop(); } };
    }
  });

  function phAt(V, Ca, Va, Cb, pKa) {
    const na = Ca * Va / 1000, nb = Cb * Math.max(0, V) / 1000, Vt = (Va + Math.max(0, V)) / 1000;
    if (V <= 0.001) return 0.5 * (pKa - Math.log10(Ca));
    if (Math.abs(nb - na) < 1e-9) return 7 + 0.5 * (pKa + Math.log10(na / Vt));
    if (nb < na) return pKa + Math.log10(nb / (na - nb));
    return 14 + Math.log10(Math.max(1e-13, (nb - na) / Vt));
  }

  const CHROMA = {
    pigment: {
      name: "植物色素", solvent: "石油醚／丙酮", stationary: "濾紙（纖維素）",
      spots: [
        { name: "胡蘿蔔素", rf: 0.95, color: "#ff9800" },
        { name: "葉黃素", rf: 0.62, color: "#fdd835" },
        { name: "葉綠素 a", rf: 0.45, color: "#43a047" },
        { name: "葉綠素 b", rf: 0.30, color: "#1b5e20" }
      ]
    },
    amino: {
      name: "胺基酸混合物", solvent: "正丁醇／醋酸", stationary: "濾紙（纖維素）",
      spots: [
        { name: "白胺酸", rf: 0.72, color: "#8e24aa" },
        { name: "丙胺酸", rf: 0.45, color: "#ab47bc" },
        { name: "甘胺酸", rf: 0.28, color: "#ce93d8" }
      ]
    },
    analgesic: {
      name: "止痛藥成分", solvent: "乙酸乙酯／甲醇", stationary: "矽膠 TLC",
      spots: [
        { name: "阿斯匹靈", rf: 0.68, color: "#90caf9" },
        { name: "咖啡因", rf: 0.42, color: "#fff59d" },
        { name: "乙醯胺酚", rf: 0.22, color: "#f48fb1" }
      ]
    }
  };

  PL.register("chromatography", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const m = CHROMA[mixSel.get()], pol = polarS.get();
          const spots = m.spots.map(s => ({ ...s, rf: PL.clamp(s.rf + (pol - 0.5) * 0.35, 0.05, 0.97) }));
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.52, H * 0.76, "層析片");
          const px = W * 0.14, py = H * 0.18, pw = W * 0.28, ph = H * 0.56;
          /* 濾紙是偏暖的米色，不是灰白：彩度留在 0.19 左右，深色主題下才不會像一塊刺眼的白板 */
          D.rect(ctx, px, py, pw, ph, { fill: "rgba(238,226,190,0.95)", stroke: PL.col("border"), r: 3 });
          const origin = py + ph * 0.86, front = py + ph * 0.10;
          D.line(ctx, px, origin, px + pw, origin, "rgba(90,90,90,0.7)", 1.4);
          D.line(ctx, px, front, px + pw, front, "rgba(90,90,90,0.5)", 1, [4, 3]);
          D.text(ctx, "溶劑前緣", px + pw + 8, front + 3, { color: PL.col("text-faint"), size: 8 });
          D.text(ctx, "原點", px + pw + 8, origin + 3, { color: PL.col("text-faint"), size: 8 });
          spots.forEach(s => {
            const y = origin - s.rf * (origin - front);
            ctx.beginPath(); ctx.ellipse(px + pw / 2, y, 10, 6, 0, 0, Math.PI * 2);
            ctx.fillStyle = s.color; ctx.fill();
          });
          CK.panel(ctx, W * 0.62, H * 0.09, W * 0.32, H * 0.76, "Rf 值");
          spots.forEach((s, i) => {
            const y = H * 0.20 + i * H * 0.13;
            D.disc(ctx, W * 0.65, y, 5, { fill: s.color, stroke: "rgba(0,0,0,0.2)" });
            D.text(ctx, s.name, W * 0.685, y + 3.5, { color: PL.col("text-dim"), size: 9 });
            D.text(ctx, s.rf.toFixed(2), W * 0.92, y + 3.5, { color: PL.col("accent"), size: 11, align: "right", weight: "700" });
          });
          D.text(ctx, "固定相：" + m.stationary, W * 0.78, H * 0.72, { color: PL.col("text-faint"), size: 8, align: "center" });
          D.text(ctx, "移動相：" + m.solvent, W * 0.78, H * 0.77, { color: PL.col("text-faint"), size: 8, align: "center" });
          const sorted = spots.map(s => s.rf).sort((a, b) => a - b);
          let minGap = 1;
          for (let i = 1; i < sorted.length; i++) minGap = Math.min(minGap, sorted[i] - sorted[i - 1]);
          rRf.set(spots.map(s => s.name + " " + s.rf.toFixed(2)).join("、"));
          rSep.set(minGap > 0.12 ? "分離良好" : minGap > 0.06 ? "部分重疊" : "幾乎分不開");
          rGap.set(minGap, 2); rPhase.set(m.stationary + " / " + m.solvent);
        }
      });
      const mixSel = PL.ui.select(ui.L.controls, { label: "混合物", value: "pigment", options: Object.keys(CHROMA).map(k => ({ value: k, label: CHROMA[k].name })) });
      const polarS = PL.ui.slider(ui.L.controls, { label: "移動相極性", min: 0, max: 1, step: 0.05, value: 0.5, digits: 2 });
      PL.ui.note(ui.L.controls, "層析靠的是各成分在固定相與移動相之間的分配差異。極性改變會讓所有 Rf 一起移動，但分離好壞要看相對差距。");
      const rRf = PL.ui.readout(ui.L.readouts, { label: "各成分 Rf" });
      const rSep = PL.ui.readout(ui.L.readouts, { label: "分離狀態" });
      const rGap = PL.ui.readout(ui.L.readouts, { label: "最小 Rf 差距" });
      const rPhase = PL.ui.readout(ui.L.readouts, { label: "固定相／移動相" });
      return { stop() { ui.stop(); } };
    }
  });
})();
