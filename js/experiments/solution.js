/* 模組五 · 溶液與濃度 */
(function () {
  "use strict";
  const PL = window.PhysicsLab, CK = window.ChemLab, D = PL.draw;

  PL.register("dissolution", {
    build(root) {
      const SOLUTES = {
        NaCl: { name: "食鹽", ion: true, heat: "幾乎無熱效應", sol: 36, color: "#b07cf0", ionLabel: ["Na⁺", "Cl⁻"] },
        sugar: { name: "蔗糖", ion: false, heat: "吸熱（微冷）", sol: 200, color: "#eef4f9", ionLabel: ["糖"] },
        CuSO4: { name: "硫酸銅", ion: true, heat: "放熱（微溫）", sol: 32, color: "#2e86de", ionLabel: ["Cu²⁺", "SO₄²⁻"] },
        ethanol: { name: "乙醇", ion: false, heat: "放熱", sol: "任意比例", color: "#a5d6a7", ionLabel: ["C₂H₅OH"] }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = soluteSel.get(), s = SOLUTES[key], T = tempS.get(), stir = stirS.get() === "on";
          const cx = W * 0.34, base = H * 0.74;
          CK.beaker(ctx, cx, base, 160, 160, 0.62, s.ion ? "#8fc6e8" : "#b7d9ee");
          /*
           * 溫度要看得出來。
           *
           * 水溫原本只改了面板上的一行字，粒子分布完全不動。
           * 溫度越高，分子運動越劇烈、溶質粒子被打散得越開：
           * 把粒子環的半徑隨溫度放大，並在杯邊加一支溫度計。
           */
          const spreadK = 0.65 + T / 100 * 0.6;
          const n = 26;
          for (let i = 0; i < n; i++) {
            const a = i / n * PL.TAU + (stir ? i * 0.2 : 0), r = (22 + (i * 37 % 60)) * spreadK;
            const x = cx + Math.cos(a) * r, y = base - 70 + Math.sin(a) * r * 0.45;
            if (s.ion) {
              const lab = i % 2 ? s.ionLabel[1] : s.ionLabel[0];
              D.disc(ctx, x, y, 7, { fill: i % 2 ? CK.ionColor(s.ionLabel[1]) : CK.ionColor(s.ionLabel[0]) });
              D.text(ctx, lab, x, y + 3, { color: "#fff", size: 5, align: "center", weight: "700" });
            } else {
              D.disc(ctx, x, y, 6, { fill: s.color, stroke: "rgba(0,0,0,0.2)" });
            }
            if (s.ion) for (let k = 0; k < 3; k++) {
              const aa = k / 3 * PL.TAU + i;
              D.disc(ctx, x + Math.cos(aa) * 11, y + Math.sin(aa) * 11, 2.2, { fill: "#8fd0ff" });
            }
          }
          D.text(ctx, s.name + " 溶於水", cx, base + 20, { color: PL.col("text-dim"), size: 12, align: "center" });
          PL.apparatus.thermometer(ctx, cx + 96, H * 0.30, base + 6, 9, PL.clamp((T + 10) / 120, 0.04, 0.96));
          CK.panel(ctx, W * 0.62, H * 0.16, W * 0.32, H * 0.48, "溶解現象");
          D.text(ctx, "溫度 " + T + " °C", W * 0.78, H * 0.26, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, stir ? "攪拌中" : "未攪拌", W * 0.78, H * 0.33, { color: PL.col("accent"), size: 14, align: "center", weight: "700" });
          D.text(ctx, "熱效應", W * 0.78, H * 0.42, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, s.heat, W * 0.78, H * 0.49, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "溶解度", W * 0.78, H * 0.57, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, String(s.sol) + (s.sol === "任意比例" ? "" : " g/100g 水"), W * 0.78, H * 0.64, { color: PL.col("accent-2"), size: 11, align: "center" });
          rSol.set(s.name); rHeat.set(s.heat); rRate.set(stir ? "快（攪拌增加接觸）" : "慢（擴散控制）");
        }
      });
      const soluteSel = PL.ui.select(ui.L.controls, { label: "溶質", value: "NaCl", options: Object.keys(SOLUTES).map(k => ({ value: k, label: SOLUTES[k].name })) });
      const tempS = PL.ui.slider(ui.L.controls, { label: "水溫", min: 0, max: 100, step: 5, value: 25, unit: "°C", digits: 0 });
      const stirS = PL.ui.select(ui.L.controls, { label: "攪拌", value: "off", options: [{ value: "off", label: "不攪拌" }, { value: "on", label: "攪拌" }] });
      PL.ui.note(ui.L.controls, "溶解是粒子被水分子包圍、分散到水中的過程，不是消失。攪拌只加快溶解速率，不會讓更多固體溶解。");
      const rSol = PL.ui.readout(ui.L.readouts, { label: "溶質" });
      const rHeat = PL.ui.readout(ui.L.readouts, { label: "熱效應" });
      const rRate = PL.ui.readout(ui.L.readouts, { label: "溶解速率" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("molarity", {
    build(root) {
      const COMPOUNDS = {
        NaCl: { name: "食鹽", M: 58.44 },
        CuSO4: { name: "硫酸銅", M: 159.61 },
        glucose: { name: "葡萄糖", M: 180.16 },
        NaOH: { name: "氫氧化鈉", M: 40.00 }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const c = COMPOUNDS[compSel.get()], m = massS.get(), V = volS.get() / 1000;
          const n = m / c.M, M = n / V;
          const cx = W * 0.32, base = H * 0.78;
          /*
           * 容量瓶：細長頸 + 梨形瓶身 + 平底，刻度畫在頸上。
           *
           * 舊版把「頸」畫成一個獨立圓角矩形，瓶身又是另一條曲線，
           * 兩者在肩部接不起來，看起來像一支插著灰色棒子的氣球；
           * 刻度線還畫在瓶身最窄處的左右各 60 px，兩端直接戳出玻璃外。
           * 現在用同一條封閉路徑畫完，液面與溶質都裁在這條路徑裡。
           */
          const neckTop = H * 0.15, neckBottom = H * 0.34, neckHalf = 11;
          const shoulder = H * 0.60, bulbHalf = 72, footHalf = 60;
          const flaskPath = () => {
            ctx.beginPath();
            ctx.moveTo(cx - neckHalf, neckTop);
            ctx.lineTo(cx - neckHalf, neckBottom);
            ctx.bezierCurveTo(cx - neckHalf, H * 0.40, cx - bulbHalf, H * 0.44, cx - bulbHalf, shoulder);
            ctx.bezierCurveTo(cx - bulbHalf, H * 0.72, cx - footHalf, H * 0.74, cx - footHalf, base);
            ctx.lineTo(cx + footHalf, base);
            ctx.bezierCurveTo(cx + footHalf, H * 0.74, cx + bulbHalf, H * 0.72, cx + bulbHalf, shoulder);
            ctx.bezierCurveTo(cx + bulbHalf, H * 0.44, cx + neckHalf, H * 0.40, cx + neckHalf, neckBottom);
            ctx.lineTo(cx + neckHalf, neckTop);
            ctx.closePath();
          };
          /*
           * 液面高度代表定容體積，溶質點數代表秤取質量。
           *
           * 體積 100 mL 時液面在瓶身下部，1000 mL 時一路升到頸上的刻度線：
           * 「先溶解、再定容到刻度」這句話就有了畫面。
           * 質量決定「有多少溶質」，點數跟著秤取質量走。
           */
          const f = PL.clamp(V, 0.1, 1);
          const levelY = base - (base - H * 0.225) * f;
          ctx.save();
          flaskPath(); ctx.clip();
          D.rect(ctx, cx - bulbHalf - 2, levelY, bulbHalf * 2 + 4, base - levelY + 1, { fill: "rgba(120,190,230,0.40)" });
          const dots = Math.round(PL.clamp(m / 100, 0, 1) * 18) + 3;
          for (let i = 0; i < dots; i++) {
            const px = cx - 39 + (i % 6) * 13, py = Math.max(levelY + 16, H * 0.615) + Math.floor(i / 6) * 13;
            if (py < base - 8) D.disc(ctx, px, py, 2.5, { fill: "#4fa3d1" });
          }
          ctx.restore();
          ctx.save(); flaskPath();
          ctx.fillStyle = "rgba(160,215,240,0.10)"; ctx.fill();
          ctx.strokeStyle = "rgba(150,205,235,0.85)"; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore();
          // 頸上的刻度線：只比瓶頸寬一點點，不再橫跨整個瓶身
          D.line(ctx, cx - neckHalf - 6, H * 0.225, cx + neckHalf + 6, H * 0.225, PL.col("accent"), 2);
          D.text(ctx, "刻度線", cx + neckHalf + 12, H * 0.225 + 4, { color: PL.col("text-dim"), size: 10 });
          D.text(ctx, c.name + " " + m.toFixed(1) + " g", cx, base + 20, { color: PL.col("text-dim"), size: 12, align: "center" });
          CK.panel(ctx, W * 0.58, H * 0.18, W * 0.34, H * 0.52, "濃度計算");
          D.text(ctx, "n = m / M", W * 0.75, H * 0.28, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, n.toFixed(3) + " mol", W * 0.75, H * 0.35, { color: PL.col("text-dim"), size: 14, align: "center" });
          D.text(ctx, "M = n / V", W * 0.75, H * 0.45, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, M.toFixed(3) + " M", W * 0.75, H * 0.54, { color: PL.col("accent"), size: 24, align: "center", weight: "700" });
          D.text(ctx, "溶液體積 " + (V * 1000).toFixed(0) + " mL", W * 0.75, H * 0.63, { color: PL.col("text-dim"), size: 11, align: "center" });
          rM.set(M, 3); rN.set(n, 3); rV.set(V * 1000, 0); rFormula.set(c.name);
        }
      });
      const compSel = PL.ui.select(ui.L.controls, { label: "溶質", value: "NaCl", options: Object.keys(COMPOUNDS).map(k => ({ value: k, label: COMPOUNDS[k].name })) });
      const massS = PL.ui.slider(ui.L.controls, { label: "秤取質量", min: 1, max: 100, step: 1, value: 5.8, unit: "g", digits: 1 });
      const volS = PL.ui.slider(ui.L.controls, { label: "定容體積", min: 100, max: 1000, step: 50, value: 500, unit: "mL", digits: 0 });
      PL.ui.note(ui.L.controls, "濃度中的體積是「溶液體積」，不是溶劑體積。配製時先溶於少量水，再移到容量瓶定容到刻度。");
      const rM = PL.ui.readout(ui.L.readouts, { label: "體積莫耳濃度", unit: "M" });
      const rN = PL.ui.readout(ui.L.readouts, { label: "溶質莫耳數", unit: "mol" });
      const rV = PL.ui.readout(ui.L.readouts, { label: "溶液體積", unit: "mL" });
      const rFormula = PL.ui.readout(ui.L.readouts, { label: "溶質" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("dilution", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const M1 = m1S.get(), V1 = v1S.get(), V2 = v2S.get();
          const M2 = M1 * V1 / V2;
          /*
           * 三根滑桿各自要有看得見的後果：
           * M₁ 改左杯的溶質點數、V₁ 改左杯液面、V₂ 改右杯液面，
           * 稀釋後的點數（M₂）則同時反映了濃度和體積。
           * 以前兩杯永遠是同一個高度、同一片藍，只有標籤上的數字在變。
           */
          const drawFlask = (cx, base, w, h, level, tint, label, val, conc) => {
            CK.beaker(ctx, cx, base, w, h, level, tint);
            const n = Math.round(PL.clamp(conc / 5, 0.03, 1) * 24);
            for (let i = 0; i < n; i++) {
              const px = cx - w * 0.28 + (i % 6) * w * 0.11;
              const py = base - 10 - Math.floor(i / 6) * (h * level * 0.22);
              D.disc(ctx, px, py, 2.4, { fill: "rgba(30,90,150,0.85)" });
            }
            D.text(ctx, label, cx, base + 18, { color: PL.col("text-dim"), size: 12, align: "center" });
            D.text(ctx, val, cx, base + 34, { color: PL.col("accent"), size: 13, align: "center", weight: "700" });
          };
          drawFlask(W * 0.28, H * 0.74, 120, 130, 0.16 + 0.62 * (V1 / 100), "#2e86de", "稀釋前", M1.toFixed(2) + " M / " + V1 + " mL", M1);
          D.arrow(ctx, W * 0.42, H * 0.50, W * 0.56, H * 0.50, { color: PL.col("accent"), width: 2.4, label: "加水" });
          drawFlask(W * 0.72, H * 0.74, 150, 150, 0.16 + 0.62 * (V2 / 1000), "#6fb6e8", "稀釋後", M2.toFixed(3) + " M / " + V2 + " mL", M2);
          CK.panel(ctx, W * 0.08, H * 0.10, W * 0.84, H * 0.24, "M₁V₁ = M₂V₂");
          D.text(ctx, M1.toFixed(2) + " × " + V1 + " = " + M2.toFixed(3) + " × " + V2, W / 2, H * 0.22, { color: PL.col("accent"), size: 16, align: "center", weight: "700" });
          D.text(ctx, "溶質莫耳數不變：" + (M1 * V1 / 1000).toFixed(4) + " mol", W / 2, H * 0.29, { color: PL.col("text-dim"), size: 11, align: "center" });
          rM2.set(M2, 3); rN.set(M1 * V1 / 1000, 4); rFactor.set((V2 / V1).toFixed(1) + " 倍");
        }
      });
      const m1S = PL.ui.slider(ui.L.controls, { label: "原濃度 M₁", min: 0.1, max: 5, step: 0.1, value: 2, unit: "M", digits: 1 });
      const v1S = PL.ui.slider(ui.L.controls, { label: "取用體積 V₁", min: 5, max: 100, step: 5, value: 25, unit: "mL", digits: 0 });
      const v2S = PL.ui.slider(ui.L.controls, { label: "稀釋後體積 V₂", min: 50, max: 1000, step: 50, value: 250, unit: "mL", digits: 0 });
      PL.ui.note(ui.L.controls, "稀釋只加水，溶質的莫耳數不變。把 V₂ 拉大，M₂ 會等比例變小；反過來把 V₂ 拉小，濃度就升高。");
      const rM2 = PL.ui.readout(ui.L.readouts, { label: "稀釋後濃度", unit: "M" });
      const rN = PL.ui.readout(ui.L.readouts, { label: "溶質莫耳數", unit: "mol" });
      const rFactor = PL.ui.readout(ui.L.readouts, { label: "稀釋倍數" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("solubility", {
    build(root) {
      const SOLUTES = {
        KNO3: { name: "硝酸鉀", a: 13, b: 2.0, color: "#8fd0ff" },
        NaCl: { name: "食鹽", a: 35.7, b: 0.02, color: "#b07cf0" },
        NH4Cl: { name: "氯化銨", a: 29, b: 0.45, color: "#a5d6a7" },
        Ce2SO4: { name: "硫酸鈰(III)", a: 18, b: -0.55, color: "#ffb74d" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = solSel.get(), s = SOLUTES[key], T = tempS.get();
          const S = Math.max(1, s.a + s.b * T);
          const water = 100, maxDissolve = S;
          const added = addedS.get();
          const saturated = added >= maxDissolve;
          CK.beaker(ctx, W * 0.24, H * 0.70, 130, 130, 0.62, "#8fc6e8");
          for (let i = 0; i < Math.min(30, Math.round((added - maxDissolve) * 2)); i++) {
            D.rect(ctx, W * 0.18 + (i * 17 % 80), H * 0.68 - (i % 2) * 5, 5, 5, { fill: s.color, angle: i * 20 });
          }
          D.text(ctx, s.name + " " + added + " g / 100 g 水", W * 0.24, H * 0.78, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, saturated ? "飽和：底部有未溶固體" : "未飽和：固體全溶", W * 0.24, H * 0.86, { color: saturated ? "#ffb74d" : PL.col("accent"), size: 11, align: "center" });
          rS.set(S, 1); rState.set(saturated ? "飽和" : "未飽和"); rT.set(T, 0);
        }
      });
      const solSel = PL.ui.select(ui.L.controls, { label: "溶質", value: "KNO3", options: Object.keys(SOLUTES).map(k => ({ value: k, label: SOLUTES[k].name })) });
      const tempS = PL.ui.slider(ui.L.controls, { label: "水溫", min: 0, max: 100, step: 5, value: 25, unit: "°C", digits: 0 });
      const addedS = PL.ui.slider(ui.L.controls, { label: "加入溶質", min: 0, max: 250, step: 5, value: 40, unit: "g", digits: 0 });
      PL.ui.note(ui.L.controls, "先看曲線：硝酸鉀的溶解度隨溫度大幅上升，食鹽幾乎不變，硫酸鈰反而下降。降溫結晶就是利用這個差異。");
      const chart = ui.chart("溶解度曲線", "曲線上的每一點都是飽和溶液；曲線上方代表過飽和或未溶固體。");
      const drawChart = () => {
        const s = SOLUTES[solSel.get()], T = tempS.get(), S = Math.max(1, s.a + s.b * T);
        CK.plot(chart, {
          x0: 0, x1: 100, y0: 0, y1: 220, xlabel: "溫度 (°C)", ylabel: "S (g/100 g 水)",
          series: [{ fn: x => Math.max(1, s.a + s.b * x), color: PL.col("accent") }],
          marks: [{ dot: [T, S], color: PL.col("accent-2"), label: "目前" }]
        });
      };
      chart.onResize(drawChart); drawChart();
      root.addEventListener("input", drawChart);
      const rS = PL.ui.readout(ui.L.readouts, { label: "溶解度", unit: "g/100g" });
      const rState = PL.ui.readout(ui.L.readouts, { label: "溶液狀態" });
      const rT = PL.ui.readout(ui.L.readouts, { label: "溫度", unit: "°C" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("colligative", {
    build(root) {
      const SOLUTES = {
        sugar: { name: "蔗糖", i: 1, M: 342 },
        NaCl: { name: "食鹽", i: 2, M: 58.4 },
        CaCl2: { name: "氯化鈣", i: 3, M: 111 }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const s = SOLUTES[solSel.get()], m = molS.get();
          const dTb = 0.512 * m * s.i, dTf = 1.86 * m * s.i;
          CK.panel(ctx, W * 0.08, H * 0.12, W * 0.84, H * 0.74, s.name + " 水溶液");
          CK.beaker(ctx, W * 0.28, H * 0.72, 130, 130, 0.62, "#8fc6e8");
          /*
           * 溶質粒子畫出來：濃度越高、解離出的粒子越多，杯裡的點就越密。
           * 依數性（沸點上升、凝固點下降）看的是粒子「數量」，
           * 不是溶質的質量或種類——點數正好把這件事講清楚。
           */
          CK.counter(ctx, W * 0.28 - 34, H * 0.72 - 72, 68, Math.round(PL.clamp(m * s.i / 9, 0.05, 1) * 30),
            { r: 3, color: s.i > 1 ? "#5b8def" : "#7e57c2" });
          D.text(ctx, "m = " + m.toFixed(2) + " mol/kg", W * 0.28, H * 0.80, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "i = " + s.i + "（解離粒子數）", W * 0.28, H * 0.87, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, "沸點上升 +" + dTb.toFixed(2) + " °C", W * 0.68, H * 0.30, { color: "#ff8a65", size: 15, align: "center", weight: "700" });
          D.text(ctx, "凝固點下降 −" + dTf.toFixed(2) + " °C", W * 0.68, H * 0.42, { color: "#64b5f6", size: 15, align: "center", weight: "700" });
          D.text(ctx, "ΔTb = Kb · m · i", W * 0.68, H * 0.54, { color: PL.col("text-faint"), size: 11, align: "center" });
          D.text(ctx, "ΔTf = Kf · m · i", W * 0.68, H * 0.62, { color: PL.col("text-faint"), size: 11, align: "center" });
          D.text(ctx, "海水不易結冰，就是因為溶質粒子多。", W / 2, H * 0.93, { color: PL.col("text-faint"), size: 11, align: "center" });
          rDTb.set(dTb, 2); rDTf.set(dTf, 2); rI.set(s.i + " 個粒子");
        }
      });
      const solSel = PL.ui.select(ui.L.controls, { label: "溶質", value: "NaCl", options: Object.keys(SOLUTES).map(k => ({ value: k, label: SOLUTES[k].name })) });
      const molS = PL.ui.slider(ui.L.controls, { label: "重量莫耳濃度", min: 0.1, max: 3, step: 0.1, value: 1, unit: "mol/kg", digits: 1 });
      PL.ui.note(ui.L.controls, "同樣濃度的蔗糖、食鹽、氯化鈣，粒子數不同，依數性效果也不同。i 是每莫耳溶質解離出的粒子數。");
      const rDTb = PL.ui.readout(ui.L.readouts, { label: "沸點上升", unit: "°C" });
      const rDTf = PL.ui.readout(ui.L.readouts, { label: "凝固點下降", unit: "°C" });
      const rI = PL.ui.readout(ui.L.readouts, { label: "粒子數 i" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("conductivity", {
    build(root) {
      const SOLUTES = {
        NaCl: { name: "食鹽（強電解質）", type: "strong", k: 1.0, ion: "Na⁺ + Cl⁻" },
        HCl: { name: "鹽酸（強酸）", type: "strong", k: 1.1, ion: "H⁺ + Cl⁻" },
        acetic: { name: "醋酸（弱酸）", type: "weak", k: 0.08, ion: "CH₃COOH ⇌ H⁺ + CH₃COO⁻" },
        sugar: { name: "蔗糖（非電解質）", type: "none", k: 0, ion: "不導電" },
        ethanol: { name: "乙醇（非電解質）", type: "none", k: 0, ion: "不導電" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const s = SOLUTES[solSel.get()], c = concS.get();
          const kappa = s.k * c * 100;
          CK.beaker(ctx, W * 0.30, H * 0.74, 160, 140, 0.62, "#8fc6e8");
          /*
           * 杯中的離子點數代表可自由移動的離子量。
           * 燈泡亮度原本只改了 alpha（測試與肉眼都很難判斷），
           * 點數則是實實在在的圖形變化：濃度越高，導電的「搬運工」越多。
           */
          CK.counter(ctx, W * 0.30 - 38, H * 0.74 - 76, 76, Math.round(PL.clamp(kappa / 110, 0, 1) * 24),
            { r: 2.6, color: "#3d7fd8" });
          CK.electrode(ctx, W * 0.24, H * 0.32, H * 0.62, "#c0c7d1", "電極");
          CK.electrode(ctx, W * 0.36, H * 0.32, H * 0.62, "#c0c7d1", "電極");
          CK.wire(ctx, [[W * 0.24, H * 0.32], [W * 0.24, H * 0.16], [W * 0.50, H * 0.16]], "#d07a4a", 2);
          CK.wire(ctx, [[W * 0.36, H * 0.32], [W * 0.36, H * 0.22], [W * 0.50, H * 0.22]], "#d07a4a", 2);
          // 燈泡
          const bright = PL.clamp(kappa / 80, 0.05, 1);
          D.disc(ctx, W * 0.60, H * 0.19, 16, { fill: `rgba(255,220,120,${0.15 + bright * 0.85})`, glow: bright > 0.3 ? "#ffd54f" : null, glowSize: 16 });
          D.text(ctx, bright > 0.6 ? "亮" : bright > 0.2 ? "微亮" : "不亮", W * 0.60, H * 0.30, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, s.ion, W * 0.60, H * 0.48, { color: PL.col("accent"), size: 12, align: "center" });
          D.text(ctx, "濃度 " + c.toFixed(2) + " M", W * 0.60, H * 0.57, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "導電度指標 " + kappa.toFixed(1), W * 0.60, H * 0.64, { color: PL.col("text-dim"), size: 11, align: "center" });
          rK.set(kappa, 1); rIon.set(s.ion); rLevel.set(bright > 0.6 ? "亮" : bright > 0.2 ? "微亮" : "不亮");
        }
      });
      const solSel = PL.ui.select(ui.L.controls, { label: "溶質", value: "NaCl", options: Object.keys(SOLUTES).map(k => ({ value: k, label: SOLUTES[k].name })) });
      const concS = PL.ui.slider(ui.L.controls, { label: "濃度", min: 0.01, max: 1, step: 0.01, value: 0.1, unit: "M", digits: 2 });
      PL.ui.note(ui.L.controls, "導電度看的是「可自由移動的離子濃度」。強電解質完全解離，弱電解質只有一部分解離，非電解質則完全不導電。");
      const rK = PL.ui.readout(ui.L.readouts, { label: "導電度指標" });
      const rIon = PL.ui.readout(ui.L.readouts, { label: "主要離子" });
      const rLevel = PL.ui.readout(ui.L.readouts, { label: "燈泡亮度" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("colloid", {
    build(root) {
      const SYSTEMS = {
        milk: { name: "牛奶", size: "100–1000 nm", tyndall: true, type: "膠體（乳狀液）" },
        fog: { name: "霧", size: "100–1000 nm", tyndall: true, type: "膠體（氣溶膠）" },
        starch: { name: "澱粉水", size: "10–500 nm", tyndall: true, type: "膠體" },
        salt: { name: "食鹽水", size: "< 1 nm", tyndall: false, type: "真溶液" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const s = SYSTEMS[sysSel.get()], laser = laserS.get();
          CK.beaker(ctx, W * 0.30, H * 0.74, 160, 150, 0.62, s.tyndall ? "#e8d5c0" : "#8fc6e8");
          if (laser && s.tyndall) {
            D.line(ctx, W * 0.12, H * 0.44, W * 0.52, H * 0.64, "rgba(255,80,80,0.85)", 3);
            D.disc(ctx, W * 0.12, H * 0.44, 5, { fill: "#ff5252", glow: "#ff5252", glowSize: 8 });
          } else if (laser) {
            D.line(ctx, W * 0.12, H * 0.44, W * 0.52, H * 0.44, "rgba(255,80,80,0.25)", 2);
          }
          D.text(ctx, s.name, W * 0.30, H * 0.80, { color: PL.col("text-dim"), size: 12, align: "center" });
          CK.panel(ctx, W * 0.56, H * 0.16, W * 0.36, H * 0.48, "判讀");
          D.text(ctx, s.type, W * 0.74, H * 0.27, { color: PL.col("accent"), size: 14, align: "center", weight: "700" });
          D.text(ctx, "粒徑 " + s.size, W * 0.74, H * 0.36, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, s.tyndall ? "有廷得耳效應（可見光路）" : "無廷得耳效應", W * 0.74, H * 0.46, { color: s.tyndall ? "#ff8a65" : PL.col("text-faint"), size: 11, align: "center" });
          D.text(ctx, laser ? "雷射開啟" : "雷射關閉", W * 0.74, H * 0.56, { color: PL.col("text-faint"), size: 10, align: "center" });
          rType.set(s.type); rSize.set(s.size); rTyndall.set(s.tyndall ? "有" : "無");
        }
      });
      const sysSel = PL.ui.select(ui.L.controls, { label: "系統", value: "milk", options: Object.keys(SYSTEMS).map(k => ({ value: k, label: SYSTEMS[k].name })) });
      const laserS = PL.ui.checkbox(ui.L.controls, { label: "開啟雷射光", checked: true });
      PL.ui.note(ui.L.controls, "膠體粒子大小約 1–1000 nm，會散射光而出現明亮光路。真溶液粒子太小，光直接通過，看不到光路。");
      const rType = PL.ui.readout(ui.L.readouts, { label: "分類" });
      const rSize = PL.ui.readout(ui.L.readouts, { label: "粒徑" });
      const rTyndall = PL.ui.readout(ui.L.readouts, { label: "廷得耳效應" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("hardness", {
    build(root) {
      const WATERS = {
        soft: { name: "軟水", ca: 10, mg: 2, note: "皂泡多，清潔效果好" },
        temp: { name: "暫時硬水", ca: 120, mg: 30, note: "含碳酸氫鈣，煮沸可沉澱軟化" },
        perm: { name: "永久硬水", ca: 180, mg: 45, note: "含硫酸鈣／氯化鈣，需離子交換" }
      };
      const TREATMENTS = {
        none: { name: "不處理", factor: 1, note: "直接使用" },
        boil: { name: "煮沸", factor: 0.55, note: "除去碳酸氫鈣" },
        lime: { name: "加石灰", factor: 0.35, note: "沉澱鈣鎂離子" },
        resin: { name: "離子交換", factor: 0.05, note: "以鈉離子交換鈣鎂" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const w = WATERS[waterSel.get()], t = TREATMENTS[treatSel.get()];
          const hardness = (w.ca + w.mg * 2) * t.factor;
          const lather = PL.clamp(1 - hardness / 250, 0.1, 1);
          CK.beaker(ctx, W * 0.30, H * 0.74, 150, 140, 0.62, "#b7d9ee");
          for (let i = 0; i < Math.round(lather * 22); i++) {
            D.disc(ctx, W * 0.22 + (i * 23 % 100), H * 0.55 - (i * 17 % 40), 7 + (i % 3) * 3, { stroke: "rgba(220,240,255,0.8)", width: 1.2 });
          }
          D.text(ctx, w.name + " + " + t.name, W * 0.30, H * 0.80, { color: PL.col("text-dim"), size: 12, align: "center" });
          CK.panel(ctx, W * 0.56, H * 0.16, W * 0.36, H * 0.52, "水質");
          D.text(ctx, "Ca²⁺ " + Math.round(w.ca) + " mg/L", W * 0.74, H * 0.26, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "Mg²⁺ " + Math.round(w.mg) + " mg/L", W * 0.74, H * 0.33, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "硬度 " + Math.round(hardness) + " mg/L", W * 0.74, H * 0.43, { color: PL.col("accent"), size: 15, align: "center", weight: "700" });
          D.text(ctx, lather > 0.7 ? "泡沫豐富" : lather > 0.35 ? "泡沫普通" : "泡沫少、易結皂垢", W * 0.74, H * 0.54, { color: lather > 0.7 ? "#66bb6a" : "#ffb74d", size: 11, align: "center" });
          D.text(ctx, t.note, W * 0.74, H * 0.63, { color: PL.col("text-faint"), size: 10, align: "center" });
          rHard.set(Math.round(hardness)); rLather.set(lather > 0.7 ? "多" : lather > 0.35 ? "中" : "少"); rNote.set(w.note);
        }
      });
      const waterSel = PL.ui.select(ui.L.controls, { label: "水樣", value: "temp", options: Object.keys(WATERS).map(k => ({ value: k, label: WATERS[k].name })) });
      const treatSel = PL.ui.select(ui.L.controls, { label: "軟化方式", value: "none", options: Object.keys(TREATMENTS).map(k => ({ value: k, label: TREATMENTS[k].name })) });
      PL.ui.note(ui.L.controls, "硬水中的鈣鎂離子會和肥皂形成難溶皂垢，浪費肥皂。煮沸只能除去暫時硬度；永久硬度要靠石灰或離子交換樹脂。");
      const rHard = PL.ui.readout(ui.L.readouts, { label: "總硬度", unit: "mg/L" });
      const rLather = PL.ui.readout(ui.L.readouts, { label: "肥皂泡沫" });
      const rNote = PL.ui.readout(ui.L.readouts, { label: "水質特性" });
      return { stop() { ui.stop(); } };
    }
  });
})();
