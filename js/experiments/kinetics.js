/* 模組八 · 反應速率與化學平衡 */
(function () {
  "use strict";
  const PL = window.PhysicsLab, CK = window.ChemLab, D = PL.draw;

  /* 哈伯法平衡：N₂ + 3H₂ ⇌ 2NH₃，回傳平衡時的反應進度 x（0–1）。 */
  function haberKp(T) {
    const dH = -92.4, dS = -0.1987;           // kJ/mol、kJ/(mol·K)
    return Math.exp(-(dH - T * dS) / (8.314e-3 * T));
  }
  function haberExtent(T, P) {
    const Kp = haberKp(T);
    const f = x => {
      const nT = 4 - 2 * x;
      const pN2 = (1 - x) / nT * P, pH2 = (3 - 3 * x) / nT * P, pNH3 = (2 * x) / nT * P;
      return pNH3 * pNH3 / (pN2 * pH2 * pH2 * pH2) - Kp;
    };
    let lo = 0, hi = 0.999;
    for (let i = 0; i < 70; i++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  PL.register("rate-factors", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        animate: true,
        draw(dt, t) {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const conc = concS.get(), T = tempS.get(), powder = areaSel.get() === "powder", cat = catChk.get();
          const fConc = Math.pow(conc, 1.2);
          const fTemp = Math.pow(2, (T - 25) / 10);
          const fArea = powder ? 2.2 : 1;
          const fCat = cat ? 3.5 : 1;
          const rate = fConc * fTemp * fArea * fCat;
          const bubbles = PL.clamp(Math.round(Math.log2(rate + 1) * 6), 0, 34);
          const tint = T > 55 ? "#e08a6a" : T > 35 ? "#8fbfd8" : "#7fb6e0";
          CK.flask(ctx, W * 0.26, H * 0.78, 150, 190, 0.55, tint);
          for (let i = 0; i < bubbles; i++) {
            const y = H * 0.72 - ((t * (18 + Math.log2(rate + 1) * 9) + i * 29) % (H * 0.30));
            const x = W * 0.26 + (((i * 37) % 70) - 35) * 0.8;
            D.disc(ctx, x, y, 1.8 + (i % 3), { fill: "rgba(235,248,255,0.85)" });
          }
          D.text(ctx, "反應速率 ×" + rate.toFixed(1), W * 0.26, H * 0.88, { color: PL.col("accent"), size: 17, align: "center", weight: "700" });
          CK.panel(ctx, W * 0.50, H * 0.12, W * 0.44, H * 0.62, "影響因素");
          const rows = [
            ["濃度", "×" + fConc.toFixed(2), fConc],
            ["溫度", "×" + fTemp.toFixed(1), fTemp],
            ["接觸面積", "×" + fArea.toFixed(1), fArea],
            ["催化劑", "×" + fCat.toFixed(1), fCat]
          ];
          const maxF = Math.max.apply(null, rows.map(r => r[2]));
          rows.forEach((r, i) => {
            const y = H * 0.22 + i * H * 0.115;
            D.text(ctx, r[0], W * 0.53, y, { color: PL.col("text-dim"), size: 11 });
            D.text(ctx, r[1], W * 0.90, y, { color: r[2] === maxF ? "#ff8a65" : PL.col("text-dim"), size: 12, align: "right", weight: r[2] === maxF ? "700" : "400" });
            D.rect(ctx, W * 0.53, y + 7, W * 0.37 * Math.min(1, Math.log2(r[2] + 1) / 5.5), 5, { fill: r[2] === maxF ? "#ff8a65" : PL.col("accent"), r: 3 });
          });
          D.text(ctx, "速率 = 濃度 × 溫度 × 表面積 × 催化", W / 2, H * 0.90, { color: PL.col("text-faint"), size: 10, align: "center" });
          rRate.set(rate, 1); rColl.set(Math.round(rate * 120), 0);
          rMain.set(maxF === fTemp ? "溫度" : maxF === fConc ? "濃度" : maxF === fArea ? "接觸面積" : "催化劑");
          rTemp.set(fTemp, 1);
        }
      });
      const concS = PL.ui.slider(ui.L.controls, { label: "濃度", min: 0.2, max: 2, step: 0.1, value: 1, unit: "M", digits: 1 });
      const tempS = PL.ui.slider(ui.L.controls, { label: "溫度", min: 10, max: 80, step: 5, value: 25, unit: "°C", digits: 0 });
      const areaSel = PL.ui.select(ui.L.controls, { label: "接觸面積", value: "block", options: [{ value: "block", label: "塊狀" }, { value: "powder", label: "粉末" }] });
      const catChk = PL.ui.checkbox(ui.L.controls, { label: "加入催化劑", checked: false });
      PL.ui.note(ui.L.controls, "溫度每升高 10°C，速率大約加倍。把固體磨成粉末、提高濃度或加入催化劑，都會讓有效碰撞變多。");
      const rRate = PL.ui.readout(ui.L.readouts, { label: "相對速率", unit: "×" });
      const rColl = PL.ui.readout(ui.L.readouts, { label: "碰撞頻率指數" });
      const rMain = PL.ui.readout(ui.L.readouts, { label: "影響最大的因素" });
      const rTemp = PL.ui.readout(ui.L.readouts, { label: "溫度係數", unit: "×" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("rate-law", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const mA = ordA.get(), nB = ordB.get(), a = concA.get(), b = concB.get(), k = kS.get();
          const rate = k * Math.pow(a, mA) * Math.pow(b, nB);
          CK.panel(ctx, W * 0.07, H * 0.12, W * 0.86, H * 0.28, "速率定律");
          D.text(ctx, "v = k [A]^" + mA + " [B]^" + nB, W / 2, H * 0.25, { color: PL.col("accent"), size: 20, align: "center", weight: "700" });
          /*
           * 級數用小方格表示：[A] 出現 m 次、[B] 出現 n 次。
           * 速率式中「濃度的次方」是抽象的，方格的個數把它變成看得見的量；
           * 也解釋了為什麼 [B] 的濃度在零級時不影響速率（式裡根本沒有它）。
           */
          let fx = W / 2 - (mA + nB) * 10;
          for (let i = 0; i < mA; i++) {
            D.rect(ctx, fx, H * 0.298, 16, 16, { fill: "#5b8def", r: 3 });
            D.text(ctx, "A", fx + 8, H * 0.298 + 12, { color: "#fff", size: 9, align: "center", weight: "700" });
            fx += 20;
          }
          for (let i = 0; i < nB; i++) {
            D.rect(ctx, fx, H * 0.298, 16, 16, { fill: "#7cb342", r: 3 });
            D.text(ctx, "B", fx + 8, H * 0.298 + 12, { color: "#fff", size: 9, align: "center", weight: "700" });
            fx += 20;
          }
          // 單獨一個 A 方塊浮在公式下方，不說明的話像亂入的圖示；補一句它代表什麼。
          D.text(ctx, "方塊數 = 級數", Math.min(W / 2 + (mA + nB) * 10 + 8, W * 0.78), H * 0.298 + 12, { color: PL.col("text-faint"), size: 9.5 });
          D.text(ctx, "[" + "A] = " + a.toFixed(2) + " M　[B] = " + b.toFixed(2) + " M　k = " + k.toFixed(2), W / 2, H * 0.365, { color: PL.col("text-dim"), size: 11, align: "center" });
          CK.panel(ctx, W * 0.07, H * 0.44, W * 0.86, H * 0.40, "級數的意義");
          const msg = mA === 0 && nB === 0 ? "零級：速率與濃度無關，圖形是水平線"
            : mA === 1 && nB === 0 ? "一級：速率與 [A] 成正比，直線通過原點"
              : mA === 2 && nB === 0 ? "二級：速率與 [A]² 成正比，圖形是拋物線"
                : "總級數 = " + (mA + nB) + "，各級數只能由實驗測定";
          D.text(ctx, msg, W / 2, H * 0.55, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "不能直接從方程式係數讀出級數", W / 2, H * 0.63, { color: PL.col("text-faint"), size: 11, align: "center" });
          D.text(ctx, "半生期 t½ = " + halfLife(mA, k, b, nB, a).toFixed(2) + " s", W / 2, H * 0.72, { color: PL.col("accent"), size: 13, align: "center" });
          /*
           * 兩瓶溶液：高度代表濃度。
           * 零級反應的速率真的與 [B] 無關——這是正確的化學，不能改公式；
           * 但濃度本身確實變了，所以讓學生看得到瓶子被稀釋或加濃，
           * 再對照上方速率沒有變，才是完整的學習。
           */
          CK.meter(ctx, W * 0.11, H * 0.775, W * 0.30, 7, a / 2, { color: "#5b8def", label: "[A] 濃度" });
          CK.meter(ctx, W * 0.57, H * 0.775, W * 0.30, 7, b / 2, { color: "#7cb342", label: "[B] 濃度" });
          rRate.set(rate, 4); rOrder.set(mA + nB, 0); rHalf.set(halfLife(mA, k, b, nB, a), 2);
          rUnit.set(mA + nB === 0 ? "M/s" : "M^(1−" + (mA + nB) + ")/s");
        }
      });
      const ordA = PL.ui.slider(ui.L.controls, { label: "A 的級數 m", min: 0, max: 3, step: 1, value: 1, digits: 0 });
      const ordB = PL.ui.slider(ui.L.controls, { label: "B 的級數 n", min: 0, max: 2, step: 1, value: 0, digits: 0 });
      const concA = PL.ui.slider(ui.L.controls, { label: "[A]", min: 0.2, max: 2, step: 0.1, value: 1, unit: "M", digits: 1 });
      const concB = PL.ui.slider(ui.L.controls, { label: "[B]", min: 0.2, max: 2, step: 0.1, value: 1, unit: "M", digits: 1 });
      const kS = PL.ui.slider(ui.L.controls, { label: "速率常數 k", min: 0.1, max: 2, step: 0.1, value: 0.5, digits: 1 });
      PL.ui.note(ui.L.controls, "把級數改一改，看右邊的半生期怎麼變：一級反應的半生期與濃度無關，二級反應則隨濃度升高而縮短。");
      const chart = ui.chart("v 對 [A] 的圖形", "固定 [B] 與 k，只改變 [A]。直線、拋物線或水平線，洩漏了反應級數。");
      const drawChart = () => {
        const mA = ordA.get(), nB = ordB.get(), b = concB.get(), k = kS.get(), a = concA.get();
        const v = x => k * Math.pow(x, mA) * Math.pow(b, nB);
        CK.plot(chart, {
          x0: 0, x1: 2, y0: 0, y1: Math.max(0.5, v(2) * 1.1), xlabel: "[A] (M)", ylabel: "v (M/s)",
          series: [{ fn: v, color: PL.col("accent") }],
          marks: [{ dot: [a, v(a)], color: PL.col("accent-2"), label: "目前" }]
        });
      };
      chart.onResize(drawChart); drawChart();
      root.addEventListener("input", drawChart);
      const rRate = PL.ui.readout(ui.L.readouts, { label: "反應速率", unit: "M/s" });
      const rOrder = PL.ui.readout(ui.L.readouts, { label: "總反應級數" });
      const rHalf = PL.ui.readout(ui.L.readouts, { label: "半生期", unit: "s" });
      const rUnit = PL.ui.readout(ui.L.readouts, { label: "k 的單位" });
      return { stop() { ui.stop(); } };
    }
  });

  function halfLife(m, k, b, n, a) {
    const keff = k * Math.pow(b, n);
    if (m === 0) return a / (2 * keff);
    if (m === 1) return Math.LN2 / keff;
    if (m === 2) return 1 / (keff * a);
    return 3 / (2 * keff * a * a);
  }

  PL.register("collision", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const T = tempS.get(), Ea = eaS.get();
          const RT = 8.314e-3 * T;
          const frac = Math.exp(-Ea / RT);
          CK.panel(ctx, W * 0.07, H * 0.10, W * 0.86, H * 0.78, "能量障礙");
          CK.energyProfile(ctx, { x: W * 0.10, y: H * 0.22, w: W * 0.80, h: H * 0.52 }, {
            dh: -0.25, ea: PL.clamp(Ea / 200, 0.12, 0.6),
            reactLabel: "反應物", prodLabel: "生成物"
          });
          D.text(ctx, "Ea = " + Ea + " kJ/mol", W / 2, H * 0.80, { color: PL.col("accent"), size: 14, align: "center", weight: "700" });
          D.text(ctx, "只有能量高於 Ea 的分子碰撞才有效", W / 2, H * 0.88, { color: PL.col("text-dim"), size: 11, align: "center" });
          rFrac.set(frac * 100, 3); rEa.set(Ea, 0); rT.set(T, 0); rRT.set(RT, 2);
        }
      });
      const tempS = PL.ui.slider(ui.L.controls, { label: "溫度", min: 250, max: 800, step: 10, value: 300, unit: "K", digits: 0 });
      const eaS = PL.ui.slider(ui.L.controls, { label: "活化能", min: 20, max: 150, step: 5, value: 60, unit: "kJ/mol", digits: 0 });
      PL.ui.note(ui.L.controls, "e^(−Ea/RT) 是能量足夠的分子比例。Ea 越大，能跨越門檻的分子越少；升溫則讓整個分布往高能端移動。");
      const chart = ui.chart("分子能量分布", "曲線下面積總和固定。Ea 右側那一小塊，就是能發生反應的分子。");
      const drawChart = () => {
        const T = tempS.get(), Ea = eaS.get(), RT = 8.314e-3 * T;
        const f = (E, Tk) => Math.sqrt(E) * Math.exp(-E / (8.314e-3 * Tk));
        const norm = (E, Tk) => {
          let sum = 0;
          for (let i = 0; i <= 200; i++) sum += Math.sqrt(i) * Math.exp(-i / (8.314e-3 * Tk));
          return f(E, Tk) / sum;
        };
        CK.plot(chart, {
          x0: 0, x1: 150, y0: 0, y1: 0.09, xlabel: "動能 (kJ/mol)", ylabel: "相對數量",
          series: [
            { fn: x => norm(x, T), color: PL.col("accent") },
            { fn: x => norm(x, Math.min(800, T + 100)), color: "#ff8a65", dash: [5, 4] }
          ],
          marks: [{ vline: Ea, color: "#ffb74d", label: "Ea", dash: [4, 4] }]
        });
        D.text(chart.ctx, "目前溫度", 80, chart.H - 20, { color: PL.col("accent"), size: 9 });
        D.text(chart.ctx, "升溫 100 K", 160, chart.H - 20, { color: "#ff8a65", size: 9 });
      };
      chart.onResize(drawChart); drawChart();
      root.addEventListener("input", drawChart);
      const rFrac = PL.ui.readout(ui.L.readouts, { label: "有效碰撞比例", unit: "%" });
      const rEa = PL.ui.readout(ui.L.readouts, { label: "活化能", unit: "kJ/mol" });
      const rT = PL.ui.readout(ui.L.readouts, { label: "溫度", unit: "K" });
      const rRT = PL.ui.readout(ui.L.readouts, { label: "RT", unit: "kJ/mol" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("catalyst", {
    build(root) {
      const CATS = {
        none: { name: "無催化劑", drop: 0 },
        iron: { name: "鐵（哈伯法）", drop: 22 },
        platinum: { name: "鉑（汽機車觸媒）", drop: 38 },
        enzyme: { name: "酵素（生物催化）", drop: 45 }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const c = CATS[catSel.get()], T = tempS.get(), base = 80;
          const eaCat = Math.max(10, base - c.drop);
          const RT = 8.314e-3 * T;
          const boost = c.drop ? Math.exp(c.drop / RT) : 1;
          // 以 500 K 為基準的相對速率；溫度改變時一定跟著變，催化劑再把它拉高。
          const kRel = Math.exp(-eaCat / RT) / Math.exp(-base / (8.314e-3 * 500));
          CK.panel(ctx, W * 0.07, H * 0.10, W * 0.86, H * 0.78, "反應路徑");
          CK.energyProfile(ctx, { x: W * 0.10, y: H * 0.24, w: W * 0.80, h: H * 0.44 }, {
            dh: -0.3, ea: PL.clamp(base / 200, 0.12, 0.6), catalyzed: c.drop > 0,
            reactLabel: "反應物", prodLabel: "生成物"
          });
          D.text(ctx, c.drop ? "催化：Ea " + base + " → " + eaCat + " kJ/mol" : "未催化：Ea " + base + " kJ/mol", W / 2, H * 0.755, { color: c.drop ? "#66bb6a" : PL.col("text-dim"), size: 12, align: "center" });
          /*
           * 溫度滑桿要留下圖形。
           *
           * 相對速率 k/k₅₀₀ 隨溫度呈指數變化，從 250 K 到 800 K 可以差好幾個數量級；
           * 線性長條在小值時完全看不出來，所以用對數尺度（每格十倍）。
           * 這也順便教會學生：阿瑞尼士方程裡的速率是指數關係。
           */
          const kLog = PL.clamp((Math.log10(Math.max(kRel, 1e-4)) + 3) / 6, 0, 1);
          CK.meter(ctx, W * 0.15, H * 0.800, W * 0.70, 7, kLog, { color: kRel >= 1 ? "#66bb6a" : "#ff8a65", label: "相對速率（對數尺度）" });
          D.text(ctx, "T = " + T + " K　k / k₅₀₀ = " + kRel.toFixed(2) + "×", W / 2, H * 0.862, { color: PL.col("text-faint"), size: 11, align: "center" });
          rEa.set(eaCat, 0); rBoost.set(boost, 0); rEq.set("不變"); rCat.set(c.name);
          rRate.set(kRel.toFixed(2), "×");
        }
      });
      const catSel = PL.ui.select(ui.L.controls, { label: "催化劑", value: "none", options: Object.keys(CATS).map(k => ({ value: k, label: CATS[k].name })) });
      const tempS = PL.ui.slider(ui.L.controls, { label: "溫度", min: 250, max: 800, step: 10, value: 500, unit: "K", digits: 0 });
      PL.ui.note(ui.L.controls, "催化劑提供一條較低活化能的路徑。它同時加快正逆反應，所以只縮短到達平衡的時間，不改變最終組成。");
      const rEa = PL.ui.readout(ui.L.readouts, { label: "催化後 Ea", unit: "kJ/mol" });
      const rBoost = PL.ui.readout(ui.L.readouts, { label: "速率提升", unit: "×" });
      const rEq = PL.ui.readout(ui.L.readouts, { label: "平衡常數" });
      const rCat = PL.ui.readout(ui.L.readouts, { label: "催化劑" });
      const rRate = PL.ui.readout(ui.L.readouts, { label: "相對速率 k / k₅₀₀", unit: "×" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("equilibrium", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        animate: true,
        draw(dt, t) {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const K = kS.get(), kf = 0.35, kr = kf / K;
          const Aeq = 1 / (1 + K), Beq = K / (1 + K);
          const tt = Math.min(20, t);
          const A = Aeq + (1 - Aeq) * Math.exp(-(kf + kr) * tt);
          const B = 1 - A;
          CK.panel(ctx, W * 0.06, H * 0.10, W * 0.44, H * 0.78, "反應容器");
          const box = { x: W * 0.09, y: H * 0.20, w: W * 0.38, h: H * 0.56 };
          D.rect(ctx, box.x, box.y, box.w, box.h, { fill: "rgba(120,180,220,0.06)", stroke: PL.col("border"), r: 8 });
          const n = 36, nA = Math.round(A * n);
          for (let i = 0; i < n; i++) {
            const isA = i < nA;
            const px = box.x + 12 + ((i * 41) % Math.max(20, box.w - 24));
            const py = box.y + 12 + ((i * 67) % Math.max(20, box.h - 24));
            const jx = Math.sin(t * 0.9 + i) * 2, jy = Math.cos(t * 1.1 + i * 1.7) * 2;
            D.disc(ctx, px + jx, py + jy, 5, { fill: isA ? "#e57373" : "#64b5f6" });
            D.text(ctx, isA ? "A" : "B", px + jx, py + jy + 3, { color: "#fff", size: 7, align: "center", weight: "700" });
          }
          D.text(ctx, "A  " + (A * 100).toFixed(0) + "%　B  " + (B * 100).toFixed(0) + "%", W * 0.28, H * 0.82, { color: PL.col("text-dim"), size: 11, align: "center" });
          CK.panel(ctx, W * 0.54, H * 0.10, W * 0.40, H * 0.34, "平衡狀態");
          const vf = kf * A, vr = kr * B;
          D.text(ctx, "v正 = " + vf.toFixed(3), W * 0.74, H * 0.23, { color: "#e57373", size: 12, align: "center" });
          D.text(ctx, "v逆 = " + vr.toFixed(3), W * 0.74, H * 0.30, { color: "#64b5f6", size: 12, align: "center" });
          D.text(ctx, Math.abs(vf - vr) < 0.004 ? "速率相等，達成平衡" : "正逆速率不相等，仍在淨反應", W * 0.74, H * 0.38, { color: Math.abs(vf - vr) < 0.004 ? "#66bb6a" : PL.col("text-faint"), size: 10, align: "center" });
          CK.panel(ctx, W * 0.54, H * 0.48, W * 0.40, H * 0.40, "動態平衡");
          D.text(ctx, "分子仍在反應，", W * 0.74, H * 0.58, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "只是巨觀濃度不再改變", W * 0.74, H * 0.65, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "K = [B]/[A] = " + K.toFixed(2), W * 0.74, H * 0.78, { color: PL.col("accent"), size: 15, align: "center", weight: "700" });
          rA.set(A, 2); rB.set(B, 2); rK.set(K, 2);
          rRate.set(vf.toFixed(3) + " : " + vr.toFixed(3));
          rState.set(tt < 3 ? "初期：正反應較快" : Math.abs(vf - vr) < 0.004 ? "已達平衡" : "接近平衡");
        }
      });
      const kS = PL.ui.slider(ui.L.controls, { label: "平衡常數 K", min: 0.1, max: 10, step: 0.1, value: 2, digits: 1 });
      PL.ui.note(ui.L.controls, "一開始只有 A，正反應速率最大；隨著 A 減少、B 增加，正反應變慢、逆反應變快，最後兩者相等。");
      const chart = ui.chart("濃度隨時間變化", "平衡不是反應停止，而是正逆速率相同。曲線趨平後，兩個速率仍然存在。");
      const drawChart = () => {
        const K = kS.get(), kf = 0.35, kr = kf / K, Aeq = 1 / (1 + K), Beq = K / (1 + K);
        CK.plot(chart, {
          x0: 0, x1: 20, y0: 0, y1: 1, xlabel: "時間 (s)", ylabel: "濃度 (M)",
          series: [
            { fn: x => Aeq + (1 - Aeq) * Math.exp(-(kf + kr) * x), color: "#e57373" },
            { fn: x => Beq * (1 - Math.exp(-(kf + kr) * x)), color: "#64b5f6" }
          ]
        });
        D.text(chart.ctx, "A", 62, 24, { color: "#e57373", size: 10, weight: "700" });
        D.text(chart.ctx, "B", 78, 24, { color: "#64b5f6", size: 10, weight: "700" });
      };
      chart.onResize(drawChart); drawChart();
      root.addEventListener("input", drawChart);
      const rA = PL.ui.readout(ui.L.readouts, { label: "[A]" });
      const rB = PL.ui.readout(ui.L.readouts, { label: "[B]" });
      const rK = PL.ui.readout(ui.L.readouts, { label: "平衡常數 K" });
      const rRate = PL.ui.readout(ui.L.readouts, { label: "v正 : v逆" });
      const rState = PL.ui.readout(ui.L.readouts, { label: "狀態" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("le-chatelier", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const T = tempS.get(), P = pressS.get();
          const x = haberExtent(T, P), nh3 = 2 * x / (4 - 2 * x);
          CK.panel(ctx, W * 0.06, H * 0.10, W * 0.50, H * 0.72, "反應器");
          const bx = W * 0.10, by = H * 0.22, bw = W * 0.42, bh = H * 0.48;
          D.rect(ctx, bx, by, bw, bh, { fill: "rgba(120,180,220,0.08)", stroke: PL.col("border"), r: 10 });
          const n = 30, nA = Math.round((1 - x) * n / 2), nH = Math.round((3 - 3 * x) * n / 2), nN = Math.round(2 * x * n / 2);
          let idx = 0;
          const put = (count, color, label) => {
            for (let i = 0; i < count; i++, idx++) {
              const px = bx + 10 + ((idx * 53) % Math.max(20, bw - 20));
              const py = by + 10 + ((idx * 71) % Math.max(20, bh - 20));
              D.disc(ctx, px, py, 5, { fill: color });
              D.text(ctx, label, px, py + 3, { color: "#fff", size: 7, align: "center", weight: "700" });
            }
          };
          put(nN, "#64b5f6", "N"); put(nH, "#cfd8dc", "H"); put(nA, "#81c784", "A");
          D.text(ctx, "N₂ " + (100 * (1 - x) / (4 - 2 * x)).toFixed(0) + "%　H₂ " + (100 * (3 - 3 * x) / (4 - 2 * x)).toFixed(0) + "%　NH₃ " + (100 * nh3).toFixed(0) + "%", W * 0.31, H * 0.76, { color: PL.col("text-dim"), size: 10, align: "center" });
          CK.panel(ctx, W * 0.60, H * 0.10, W * 0.34, H * 0.72, "平衡移動");
          D.text(ctx, "N₂ + 3H₂ ⇌ 2NH₃", W * 0.77, H * 0.21, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "ΔH < 0（放熱）", W * 0.77, H * 0.27, { color: "#ff8a65", size: 10, align: "center" });
          const tips = [];
          tips.push(T > 500 ? "高溫：往吸熱（左）移動" : "低溫：往放熱（右）移動");
          tips.push(P > 100 ? "高壓：往氣體莫耳數少（右）" : "低壓：往氣體莫耳數多（左）");
          D.text(ctx, tips[0], W * 0.77, H * 0.37, { color: PL.col("text-dim"), size: 10, align: "center" });
          D.text(ctx, tips[1], W * 0.77, H * 0.43, { color: PL.col("text-dim"), size: 10, align: "center" });
          D.text(ctx, "NH₃ 莫耳分率", W * 0.77, H * 0.55, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, (nh3 * 100).toFixed(1) + "%", W * 0.77, H * 0.64, { color: PL.col("accent"), size: 26, align: "center", weight: "700" });
          D.text(ctx, "Kp = " + haberKp(T).toExponential(1), W * 0.77, H * 0.74, { color: PL.col("text-faint"), size: 10, align: "center" });
          rYield.set(nh3 * 100, 1); rK.set(haberKp(T), 4); rP.set(P, 0); rT.set(T, 0);
          rShift.set(T > 500 ? "升溫 → 左移" : "降溫 → 右移");
        }
      });
      const tempS = PL.ui.slider(ui.L.controls, { label: "溫度", min: 300, max: 800, step: 10, value: 450, unit: "K", digits: 0 });
      const pressS = PL.ui.slider(ui.L.controls, { label: "壓力", min: 1, max: 300, step: 1, value: 200, unit: "atm", digits: 0 });
      PL.ui.presets(ui.L.controls, {
        label: "一鍵比較",
        options: [
          { label: "工業條件", apply() { tempS.set(450); pressS.set(200); ui.redraw(); } },
          { label: "低溫高壓", apply() { tempS.set(350); pressS.set(300); ui.redraw(); } },
          { label: "高溫低壓", apply() { tempS.set(750); pressS.set(1); ui.redraw(); } }
        ]
      });
      PL.ui.note(ui.L.controls, "勒沙特列原理：系統會朝抵消改變的方向移動。但平衡移動不等於速率變快，工業上必須同時考慮產率與速率。");
      const rYield = PL.ui.readout(ui.L.readouts, { label: "NH₃ 莫耳分率", unit: "%" });
      const rK = PL.ui.readout(ui.L.readouts, { label: "Kp" });
      const rT = PL.ui.readout(ui.L.readouts, { label: "溫度", unit: "K" });
      const rP = PL.ui.readout(ui.L.readouts, { label: "壓力", unit: "atm" });
      const rShift = PL.ui.readout(ui.L.readouts, { label: "升溫方向" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("equilibrium-constant", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const a = aS.get(), b = bS.get(), K = kS.get();
          const x = solveIce(a, b, K);
          CK.panel(ctx, W * 0.08, H * 0.10, W * 0.84, H * 0.76, "H₂ + I₂ ⇌ 2HI 的 ICE 表");
          const rows = [
            ["I（初始）", a, b, 0],
            ["C（變化）", -x, -x, 2 * x],
            ["E（平衡）", a - x, b - x, 2 * x]
          ];
          const cols = ["H₂", "I₂", "HI"];
          cols.forEach((c, i) => D.text(ctx, c, W * 0.30 + i * W * 0.21, H * 0.22, { color: PL.col("text-dim"), size: 12, align: "center", weight: "700" }));
          rows.forEach((r, ri) => {
            const y = H * 0.32 + ri * H * 0.13;
            D.text(ctx, r[0], W * 0.12, y, { color: PL.col("text-dim"), size: 10 });
            for (let ci = 0; ci < 3; ci++) {
              const v = r[ci + 1];
              D.text(ctx, (ri === 1 && v === 0 ? "0" : (v >= 0 ? "" : "−") + Math.abs(v).toFixed(3)), W * 0.30 + ci * W * 0.21, y, {
                color: ri === 2 ? PL.col("accent") : PL.col("text-dim"), size: 12, align: "center", weight: ri === 2 ? "700" : "400"
              });
            }
          });
          /*
           * 平衡濃度用長條畫出來。
           * 三根滑桿（H₂、I₂ 初始濃度與 K）原本只改表格裡的數字，
           * 「反應進行到哪裡、HI 剩多少」只能靠讀數字想像。
           * 把 E 列的三個濃度畫成同尺度的長條，HI 長過 H₂、I₂ 就是反應向右的證據。
           */
          const eqVals = [a - x, b - x, 2 * x];
          const maxC = Math.max(eqVals[0], eqVals[1], eqVals[2], 0.1);
          eqVals.forEach((v, i) => {
            const cxm = W * 0.30 + i * W * 0.21;
            CK.meter(ctx, cxm - 20, H * 0.635, 40, 5, v / maxC, { color: i === 2 ? "#7e57c2" : "#5b8def" });
          });
          D.text(ctx, "K = (2x)² / ((a−x)(b−x)) = " + K.toFixed(1), W / 2, H * 0.76, { color: PL.col("text-faint"), size: 11, align: "center" });
          D.text(ctx, "Q初始 = 0 < K → 反應向右", W / 2, H * 0.83, { color: "#66bb6a", size: 11, align: "center" });
          rX.set(x, 3); rHI.set(2 * x, 3); rK.set(K, 1);
          rEq.set("[H₂]=" + (a - x).toFixed(2) + "  [I₂]=" + (b - x).toFixed(2));
        }
      });
      const aS = PL.ui.slider(ui.L.controls, { label: "H₂ 初始濃度", min: 0.2, max: 2, step: 0.1, value: 1, unit: "M", digits: 1 });
      const bS = PL.ui.slider(ui.L.controls, { label: "I₂ 初始濃度", min: 0.2, max: 2, step: 0.1, value: 1, unit: "M", digits: 1 });
      const kS = PL.ui.slider(ui.L.controls, { label: "平衡常數 K", min: 1, max: 100, step: 1, value: 50, digits: 0 });
      PL.ui.note(ui.L.controls, "ICE 表把「初始、變化、平衡」三列寫清楚：變化量由方程式係數決定，最後一代入 K 解出 x。");
      const rX = PL.ui.readout(ui.L.readouts, { label: "反應進度 x", unit: "M" });
      const rHI = PL.ui.readout(ui.L.readouts, { label: "[HI] 平衡", unit: "M" });
      const rK = PL.ui.readout(ui.L.readouts, { label: "K" });
      const rEq = PL.ui.readout(ui.L.readouts, { label: "平衡濃度" });
      return { stop() { ui.stop(); } };
    }
  });

  function solveIce(a, b, K) {
    const f = x => 4 * x * x / ((a - x) * (b - x)) - K;
    let lo = 0, hi = Math.min(a, b) - 1e-6;
    for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }

  PL.register("haber", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const T = tempS.get() + 273, P = pressS.get(), cat = catChk.get();
          const x = haberExtent(T, P), yieldPct = 2 * x / (4 - 2 * x) * 100;
          const Ea = 120, rateRel = Math.exp(-Ea / 8.314e-3 * (1 / T - 1 / 723));
          const rate = rateRel * (cat ? 1 : 0.15);
          CK.panel(ctx, W * 0.07, H * 0.10, W * 0.86, H * 0.76, "哈伯法反應器");
          const bx = W * 0.12, by = H * 0.22, bw = W * 0.76, bh = H * 0.38;
          D.rect(ctx, bx, by, bw, bh, { fill: "rgba(150,170,190,0.12)", stroke: PL.col("border"), r: 10 });
          /*
           * 反應器裡的綠色粒子代表 NH₃。
           *
           * 溫度與壓力原本只改了旁邊兩行數字；產率從 40% 掉到 5%，
           * 反應器裡的畫面卻一模一樣。讓綠色粒子的數目跟著平衡產率走，
           * 「低溫高壓對產率有利」就有了畫面可以看。
           */
          const nH3 = Math.round(PL.clamp(yieldPct / 100, 0, 1) * 40);
          for (let i = 0; i < 40; i++) {
            const px = bx + 10 + ((i * 47) % (bw - 20));
            const py = by + 10 + ((i * 29) % (bh - 20));
            // NH₃ 畫得比未反應的氣體大一點：顏色之外，大小也是差別，色弱學生同樣看得出來。
            D.disc(ctx, px, py, i < nH3 ? 3.6 : 2.6, { fill: i < nH3 ? "#81c784" : "#90a4ae" });
          }
          D.text(ctx, "N₂ + 3H₂ → 2NH₃", W / 2, H * 0.28, { color: PL.col("text-dim"), size: 14, align: "center" });
          D.text(ctx, "Fe 催化劑床", W / 2, H * 0.38, { color: cat ? "#66bb6a" : PL.col("text-faint"), size: 11, align: "center" });
          D.text(ctx, T + " K　" + P + " atm", W / 2, H * 0.50, { color: PL.col("accent"), size: 15, align: "center", weight: "700" });
          D.text(ctx, "平衡產率 " + yieldPct.toFixed(1) + "%", W * 0.28, H * 0.68, { color: PL.col("accent"), size: 14, align: "center", weight: "700" });
          D.text(ctx, "相對速率 " + rate.toFixed(2) + "×", W * 0.72, H * 0.68, { color: PL.col("accent"), size: 14, align: "center", weight: "700" });
          D.text(ctx, "低溫高壓利於產率，高溫利於速率——工業上取折衷", W / 2, H * 0.80, { color: PL.col("text-faint"), size: 10, align: "center" });
          rYield.set(yieldPct, 1); rRate.set(rate, 2); rK.set(haberKp(T), 4);
          rAdvice.set(yieldPct > 15 ? "高壓低溫，產率佳" : "低壓或高溫，產率偏低");
        }
      });
      const tempS = PL.ui.slider(ui.L.controls, { label: "溫度", min: 300, max: 600, step: 10, value: 450, unit: "°C", digits: 0 });
      const pressS = PL.ui.slider(ui.L.controls, { label: "壓力", min: 50, max: 400, step: 10, value: 200, unit: "atm", digits: 0 });
      const catChk = PL.ui.checkbox(ui.L.controls, { label: "裝填鐵催化劑", checked: true });
      PL.ui.presets(ui.L.controls, {
        label: "工業條件",
        options: [
          { label: "傳統 450°C", apply() { tempS.set(450); pressS.set(200); ui.redraw(); } },
          { label: "低溫 350°C", apply() { tempS.set(350); pressS.set(200); ui.redraw(); } },
          { label: "高壓 400 atm", apply() { tempS.set(450); pressS.set(400); ui.redraw(); } }
        ]
      });
      PL.ui.note(ui.L.controls, "哈伯法不能只追求高產率：低溫雖然平衡有利，但速率太慢。450°C、200 atm 加鐵催化劑，是產率與速率之間的折衷。");
      const chart = ui.chart("產率與速率的拔河", "實線是平衡產率，虛線是相對速率。兩條曲線往相反方向走，交會處附近就是工業條件。");
      const drawChart = () => {
        const P = pressS.get(), cat = catChk.get();
        const yieldAt = Tc => {
          const x = haberExtent(Tc + 273, P);
          return 2 * x / (4 - 2 * x) * 100;
        };
        const rateAt = Tc => Math.exp(-120 / 8.314e-3 * (1 / (Tc + 273) - 1 / 723)) * (cat ? 1 : 0.15);
        CK.plot(chart, {
          x0: 300, x1: 600, y0: 0, y1: 100,
          xlabel: "溫度 (°C)", ylabel: "產率 (%) / 速率指數",
          series: [
            { fn: yieldAt, color: PL.col("accent") },
            { fn: Tc => Math.min(100, rateAt(Tc) * 22), color: "#ff8a65", dash: [6, 4] }
          ],
          marks: [{ vline: 450, color: PL.col("text-faint"), label: "450°C", dash: [3, 4] }]
        });
        D.text(chart.ctx, "平衡產率", 72, 24, { color: PL.col("accent"), size: 9 });
        D.text(chart.ctx, "相對速率", 140, 24, { color: "#ff8a65", size: 9 });
      };
      chart.onResize(drawChart); drawChart();
      root.addEventListener("input", drawChart);
      const rYield = PL.ui.readout(ui.L.readouts, { label: "平衡產率", unit: "%" });
      const rRate = PL.ui.readout(ui.L.readouts, { label: "相對速率", unit: "×" });
      const rK = PL.ui.readout(ui.L.readouts, { label: "Kp" });
      const rAdvice = PL.ui.readout(ui.L.readouts, { label: "條件評語" });
      return { stop() { ui.stop(); } };
    }
  });
})();
