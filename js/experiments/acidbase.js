/* 模組六 · 酸鹼鹽與滴定 */
(function () {
  "use strict";
  const PL = window.PhysicsLab, CK = window.ChemLab, D = PL.draw;

  PL.register("acid-base", {
    build(root) {
      const SUBS = {
        HCl: { name: "鹽酸", ph: 1.0, type: "強酸", litmus: "紅", phen: "無色" },
        lemon: { name: "檸檬汁", ph: 2.4, type: "弱酸", litmus: "紅", phen: "無色" },
        vinegar: { name: "醋酸", ph: 3.0, type: "弱酸", litmus: "紅", phen: "無色" },
        water: { name: "純水", ph: 7.0, type: "中性", litmus: "不變", phen: "無色" },
        NaCl: { name: "食鹽水", ph: 7.0, type: "中性", litmus: "不變", phen: "無色" },
        NaOH: { name: "氫氧化鈉", ph: 13.0, type: "強鹼", litmus: "藍", phen: "粉紅" },
        NH3: { name: "氨水", ph: 11.0, type: "弱鹼", litmus: "藍", phen: "粉紅" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = subSel.get(), s = SUBS[key], col = CK.phColor(s.ph);
          CK.beaker(ctx, W * 0.28, H * 0.72, 140, 140, 0.62, col);
          D.text(ctx, s.name, W * 0.28, H * 0.79, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "pH " + s.ph.toFixed(1), W * 0.28, H * 0.86, { color: col, size: 17, align: "center", weight: "700" });
          // 廣用試紙
          CK.panel(ctx, W * 0.52, H * 0.16, W * 0.40, H * 0.50, "指示劑");
          D.rect(ctx, W * 0.56, H * 0.26, W * 0.32, 14, { fill: col, r: 4 });
          D.text(ctx, s.type, W * 0.72, H * 0.36, { color: PL.col("accent"), size: 14, align: "center", weight: "700" });
          D.text(ctx, "石蕊：" + s.litmus, W * 0.72, H * 0.44, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "酚酞：" + s.phen, W * 0.72, H * 0.51, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "廣用指示劑顏色", W * 0.72, H * 0.59, { color: PL.col("text-faint"), size: 10, align: "center" });
          rPH.set(s.ph, 1); rType.set(s.type); rLitmus.set(s.litmus); rPhen.set(s.phen);
        }
      });
      const subSel = PL.ui.select(ui.L.controls, { label: "溶液", value: "lemon", options: Object.keys(SUBS).map(k => ({ value: k, label: SUBS[k].name })) });
      PL.ui.note(ui.L.controls, "指示劑只告訴你「酸、鹼或中性」，不能直接告訴你 pH。要精確知道酸鹼強弱，還是得用 pH 計或滴定。");
      const rPH = PL.ui.readout(ui.L.readouts, { label: "pH" });
      const rType = PL.ui.readout(ui.L.readouts, { label: "酸鹼性" });
      const rLitmus = PL.ui.readout(ui.L.readouts, { label: "石蕊" });
      const rPhen = PL.ui.readout(ui.L.readouts, { label: "酚酞" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("ph-scale", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const ph = phS.get();
          const h = Math.pow(10, -ph), oh = 1e-14 / h;
          CK.panel(ctx, W * 0.08, H * 0.12, W * 0.84, H * 0.30, "pH 色尺");
          const x0 = W * 0.12, x1 = W * 0.88, y = H * 0.25;
          for (let i = 0; i < 140; i++) {
            const p = i / 10;
            D.rect(ctx, x0 + (x1 - x0) * i / 140, y, (x1 - x0) / 140 + 1, 26, { fill: CK.phColor(p) });
            if (i % 10 === 0) D.text(ctx, String(p), x0 + (x1 - x0) * i / 140, y + 44, { color: PL.col("text-dim"), size: 10, align: "center" });
          }
          const mx = x0 + (x1 - x0) * ph / 14;
          D.line(ctx, mx, y - 8, mx, y + 34, PL.col("text"), 3);
          D.text(ctx, "pH " + ph.toFixed(1), mx, y - 16, { color: PL.col("accent"), size: 14, align: "center", weight: "700" });
          CK.panel(ctx, W * 0.08, H * 0.50, W * 0.84, H * 0.34, "濃度換算");
          D.text(ctx, "[H⁺] = " + h.toExponential(2) + " M", W / 2, H * 0.60, { color: PL.col("text-dim"), size: 14, align: "center" });
          D.text(ctx, "[OH⁻] = " + oh.toExponential(2) + " M", W / 2, H * 0.68, { color: PL.col("text-dim"), size: 14, align: "center" });
          D.text(ctx, ph < 6.9 ? "酸性" : ph > 7.1 ? "鹼性" : "中性", W / 2, H * 0.78, { color: CK.phColor(ph), size: 20, align: "center", weight: "700" });
          rH.set(h.toExponential(2)); rOH.set(oh.toExponential(2)); rState.set(ph < 6.9 ? "酸性" : ph > 7.1 ? "鹼性" : "中性");
        }
      });
      const phS = PL.ui.slider(ui.L.controls, { label: "pH", min: 0, max: 14, step: 0.1, value: 7, digits: 1 });
      PL.ui.note(ui.L.controls, "pH 是對數尺度：pH 從 3 變到 4，[H⁺] 不是少 1，而是變成原本的 1/10。pH 差 2 就是 100 倍。");
      const rH = PL.ui.readout(ui.L.readouts, { label: "[H⁺] 濃度", unit: "M" });
      const rOH = PL.ui.readout(ui.L.readouts, { label: "[OH⁻] 濃度", unit: "M" });
      const rState = PL.ui.readout(ui.L.readouts, { label: "酸鹼性" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("strong-weak", {
    build(root) {
      const ACIDS = {
        HCl: { name: "鹽酸", strong: true, Ka: 1e6, M: 36.46 },
        HNO3: { name: "硝酸", strong: true, Ka: 20, M: 63.01 },
        acetic: { name: "醋酸", strong: false, Ka: 1.8e-5, M: 60.05 },
        carbonic: { name: "碳酸", strong: false, Ka: 4.3e-7, M: 62.03 }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const a = ACIDS[acidSel.get()], C = concS.get();
          let h, alpha;
          if (a.strong) { h = C; alpha = 1; }
          else {
            h = (-a.Ka + Math.sqrt(a.Ka * a.Ka + 4 * a.Ka * C)) / 2;
            alpha = h / C;
          }
          const ph = -Math.log10(Math.max(h, 1e-14));
          CK.beaker(ctx, W * 0.28, H * 0.72, 140, 140, 0.62, CK.phColor(ph));
          D.text(ctx, a.name + " " + C.toFixed(2) + " M", W * 0.28, H * 0.80, { color: PL.col("text-dim"), size: 11, align: "center" });
          CK.panel(ctx, W * 0.52, H * 0.14, W * 0.40, H * 0.54, "解離程度");
          D.text(ctx, a.strong ? "強酸：幾乎完全解離" : "弱酸：部分解離", W * 0.72, H * 0.25, { color: a.strong ? "#ff8a65" : "#64b5f6", size: 12, align: "center", weight: "700" });
          const bw = W * 0.28, bx = W * 0.58, by = H * 0.36;
          D.rect(ctx, bx, by, bw, 18, { fill: "rgba(140,160,180,0.15)", r: 4 });
          D.rect(ctx, bx, by, bw * PL.clamp(alpha, 0, 1), 18, { fill: PL.col("accent"), r: 4 });
          D.text(ctx, "解離度 " + (alpha * 100).toFixed(1) + "%", W * 0.72, by + 38, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "Ka = " + (a.strong ? "≫1" : a.Ka.toExponential(1)), W * 0.72, H * 0.40, { color: PL.col("text-faint"), size: 11, align: "center" });
          D.text(ctx, "[H⁺] = " + h.toExponential(2) + " M", W * 0.72, H * 0.49, { color: PL.col("accent"), size: 13, align: "center" });
          D.text(ctx, "pH = " + ph.toFixed(2), W * 0.72, H * 0.57, { color: PL.col("accent"), size: 19, align: "center", weight: "700" });
          rPH.set(ph, 2); rAlpha.set(alpha * 100, 1); rKa.set(a.strong ? "≫1" : a.Ka.toExponential(1)); rH.set(h.toExponential(2));
        }
      });
      const acidSel = PL.ui.select(ui.L.controls, { label: "酸", value: "acetic", options: Object.keys(ACIDS).map(k => ({ value: k, label: ACIDS[k].name })) });
      const concS = PL.ui.slider(ui.L.controls, { label: "濃度", min: 0.01, max: 1, step: 0.01, value: 0.1, unit: "M", digits: 2 });
      PL.ui.note(ui.L.controls, "同濃度的鹽酸與醋酸，pH 差很多。稀釋弱酸時，解離度會上升，但 [H⁺] 仍然下降，pH 還是變大。");
      const rPH = PL.ui.readout(ui.L.readouts, { label: "pH" });
      const rAlpha = PL.ui.readout(ui.L.readouts, { label: "解離度", unit: "%" });
      const rKa = PL.ui.readout(ui.L.readouts, { label: "Ka" });
      const rH = PL.ui.readout(ui.L.readouts, { label: "[H⁺]", unit: "M" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("titration", {
    build(root) {
      const SYSTEMS = {
        strong: { name: "強酸 + 強鹼", pKa: null, type: "strong" },
        weak: { name: "弱酸 + 強鹼", pKa: 4.76, type: "weak" },
        weakbase: { name: "強酸 + 弱鹼", pKa: 9.25, type: "weakbase" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const sys = SYSTEMS[sysSel.get()], Vb = volS.get();
          const Ca = 0.1, Va = 25, Cb = 0.1;
          /*
           * 濃度是 mol/L、體積是 mL，莫耳數一定要除以 1000。
           * 原本直接乘成「毫莫耳」卻當成莫耳代入 [H⁺] = n / V(L)，
           * 起點 pH 會算成 −2，整條強酸曲線在當量點前全部貼在 pH 0。
           */
          const nA = Ca * Va / 1000, nB = Cb * Vb / 1000;
          const totalV = (Va + Vb) / 1000;
          let ph;
          if (sys.type === "strong") {
            const excess = (nA - nB) / totalV;
            ph = excess > 0 ? -Math.log10(excess) : excess < 0 ? 14 + Math.log10(-excess) : 7;
          } else if (sys.type === "weak") {
            if (nB < nA * 0.999) {
              const nHA = nA - nB, nAminus = nB;
              ph = sys.pKa + Math.log10(Math.max(nAminus, 1e-9) / Math.max(nHA, 1e-9));
            } else if (Math.abs(nB - nA) < 1e-6) {
              ph = 7 + 0.5 * (sys.pKa + Math.log10(nA / totalV));
            } else {
              const excessOH = (nB - nA) / totalV;
              ph = 14 + Math.log10(excessOH);
            }
          } else {
            if (nA < nB * 0.999) {
              const nBOH = nB - nA, nBH = nA;
              const pOH = (14 - sys.pKa) + Math.log10(Math.max(nBOH, 1e-9) / Math.max(nBH, 1e-9));
              ph = 14 - pOH;
            } else if (Math.abs(nA - nB) < 1e-6) {
              ph = 7 - 0.5 * (sys.pKa - Math.log10(nB / totalV));
            } else {
              ph = -Math.log10((nA - nB) / totalV);
            }
          }
          const eqV = nA / Cb * 1000;      // L → mL，讓讀數與滴定管刻度同一單位
          // 裝置
          CK.burette(ctx, W * 0.24, H * 0.08, H * 0.48, 1 - Vb / 50, "#cfe8ff");
          CK.flask(ctx, W * 0.24, H * 0.76, 120, 130, 0.55, CK.phColor(ph));
          D.text(ctx, "滴定管 " + Vb.toFixed(1) + " mL", W * 0.24, H * 0.80, { color: PL.col("text-dim"), size: 10, align: "center" });
          // 曲線
          const cw = W * 0.54, ch = H * 0.58, gx = W * 0.42, gy = H * 0.16;
          const g = PL.graph(ui.cv, { x: gx, y: gy, w: cw, h: ch }, { x0: 0, x1: 50, y0: 0, y1: 14 });
          g.frame({ xlabel: "加入鹼體積 (mL)", ylabel: "pH" });
          g.grid(4, 4);
          const pts = [];
          for (let v = 0; v <= 50; v += 0.5) {
            const nb = Cb * v / 1000, tv = (Va + v) / 1000;
            let y;
            if (sys.type === "strong") {
              const ex = (nA - nb) / tv;
              y = ex > 0 ? -Math.log10(ex) : ex < 0 ? 14 + Math.log10(-ex) : 7;
            } else if (sys.type === "weak") {
              if (nb < nA * 0.999) y = sys.pKa + Math.log10(Math.max(nb, 1e-9) / Math.max(nA - nb, 1e-9));
              else if (Math.abs(nb - nA) < 1e-6) y = 7 + 0.5 * (sys.pKa + Math.log10(nA / tv));
              else y = 14 + Math.log10((nb - nA) / tv);
            } else {
              if (nA < nb * 0.999) y = 14 - ((14 - sys.pKa) + Math.log10(Math.max(nb - nA, 1e-9) / Math.max(nA, 1e-9)));
              else if (Math.abs(nA - nb) < 1e-6) y = 7 - 0.5 * (sys.pKa - Math.log10(nb / tv));
              else y = -Math.log10((nA - nb) / tv);
            }
            if (isFinite(y)) pts.push([v, PL.clamp(y, 0, 14)]);
          }
          g.curve(pts, { color: PL.col("accent"), width: 2.4 });
          g.vline(eqV, { color: PL.col("accent-2"), dash: [4, 4], label: "當量點" });
          g.dot(Vb, PL.clamp(ph, 0, 14), { color: PL.col("accent-2"), r: 4 });
          D.text(ctx, "當量點 " + eqV.toFixed(1) + " mL", gx + cw / 2, gy + ch + 30, { color: PL.col("text-dim"), size: 11, align: "center" });
          rV.set(Vb, 1); rPH.set(ph, 2); rEq.set(eqV, 1); rInd.set(ph < 6 ? "甲基橙（紅→黃）" : ph < 8 ? "溴瑞香草酚藍" : "酚酞（無色→粉紅）");
        }
      });
      const sysSel = PL.ui.select(ui.L.controls, { label: "滴定系統", value: "strong", options: Object.keys(SYSTEMS).map(k => ({ value: k, label: SYSTEMS[k].name })) });
      const volS = PL.ui.slider(ui.L.controls, { label: "加入鹼體積", min: 0, max: 50, step: 0.5, value: 0, unit: "mL", digits: 1 });
      PL.ui.note(ui.L.controls, "注意弱酸曲線在當量點前有平緩的緩衝區，當量點 pH 也大於 7。指示劑要選在曲線陡峭段變色，才不會提前或延後判定。");
      const rV = PL.ui.readout(ui.L.readouts, { label: "滴定體積", unit: "mL" });
      const rPH = PL.ui.readout(ui.L.readouts, { label: "pH" });
      const rEq = PL.ui.readout(ui.L.readouts, { label: "當量點體積", unit: "mL" });
      const rInd = PL.ui.readout(ui.L.readouts, { label: "建議指示劑" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("buffer", {
    build(root) {
      const BUFFERS = {
        acetate: { name: "醋酸／醋酸根", pKa: 4.76 },
        ammonia: { name: "氨／銨根", pKa: 9.25 },
        carbonate: { name: "碳酸／碳酸氫根", pKa: 6.35 },
        blood: { name: "血液（碳酸系統）", pKa: 6.10 }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const b = BUFFERS[bufSel.get()], ratio = ratioS.get();
          const ph = b.pKa + Math.log10(ratio);
          CK.beaker(ctx, W * 0.26, H * 0.72, 130, 130, 0.62, CK.phColor(ph));
          D.text(ctx, b.name, W * 0.26, H * 0.80, { color: PL.col("text-dim"), size: 11, align: "center" });
          CK.panel(ctx, W * 0.50, H * 0.14, W * 0.42, H * 0.54, "緩衝比例");
          D.text(ctx, "[A⁻] / [HA] = " + ratio.toFixed(2), W * 0.71, H * 0.245, { color: PL.col("text-dim"), size: 12, align: "center" });
          /*
           * 弱酸與共軛鹼的相對量，用一條雙色長條表示。
           *
           * 以前只有一行「[A⁻]/[HA] = x」的數字，杯裡的顏色差異又很細微；
           * 比例拉到 0.1 或 10 時，畫面幾乎沒感覺。長條一翻，
           * 「誰多誰少」立刻看得出來，也才解釋得通緩衝能力為什麼在中間最強。
           */
          const fA = ratio / (1 + ratio), barX = W * 0.56, barW = W * 0.30, barY = H * 0.27;
          D.rect(ctx, barX, barY, barW * (1 - fA), 12, { fill: "#5b8def" });
          D.rect(ctx, barX + barW * (1 - fA), barY, barW * fA, 12, { fill: "#7cb342" });
          D.rect(ctx, barX, barY, barW, 12, { stroke: PL.col("border"), width: 1 });
          D.text(ctx, "HA", barX, barY + 24, { color: "#5b8def", size: 9, align: "left" });
          D.text(ctx, "A⁻", barX + barW, barY + 24, { color: "#7cb342", size: 9, align: "right" });
          D.text(ctx, "pH = pKa + log(ratio)", W * 0.71, H * 0.38, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, "pH = " + ph.toFixed(2), W * 0.71, H * 0.48, { color: PL.col("accent"), size: 22, align: "center", weight: "700" });
          D.text(ctx, "pKa = " + b.pKa, W * 0.71, H * 0.57, { color: PL.col("text-dim"), size: 12, align: "center" });
          // 緩衝能力
          const cap = PL.clamp(1 - Math.abs(Math.log10(ratio)) / 1.5, 0, 1);
          D.text(ctx, "緩衝能力：" + (cap > 0.7 ? "強" : cap > 0.3 ? "中" : "弱"), W * 0.71, H * 0.645, { color: cap > 0.7 ? "#66bb6a" : "#ffb74d", size: 12, align: "center", weight: "700" });
          D.text(ctx, "比例偏離 1:1 太遠，緩衝能力就下降。", W / 2, H * 0.90, { color: PL.col("text-faint"), size: 11, align: "center" });
          rPH.set(ph, 2); rRatio.set(ratio, 2); rCap.set(cap > 0.7 ? "強" : cap > 0.3 ? "中" : "弱");
        }
      });
      const bufSel = PL.ui.select(ui.L.controls, { label: "緩衝系統", value: "acetate", options: Object.keys(BUFFERS).map(k => ({ value: k, label: BUFFERS[k].name })) });
      const ratioS = PL.ui.slider(ui.L.controls, { label: "共軛鹼 / 弱酸", min: 0.1, max: 10, step: 0.1, value: 1, digits: 1 });
      PL.ui.note(ui.L.controls, "緩衝液在 pKa 附近最有效。把比例從 1:1 拉開，pH 會變，但還能抵抗少量酸鹼；拉得太遠就失去緩衝能力。");
      const rPH = PL.ui.readout(ui.L.readouts, { label: "pH" });
      const rRatio = PL.ui.readout(ui.L.readouts, { label: "濃度比" });
      const rCap = PL.ui.readout(ui.L.readouts, { label: "緩衝能力" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("salt-hydrolysis", {
    build(root) {
      const SALTS = {
        NaCl: { name: "氯化鈉", ph: 7.0, type: "中性", eq: "強酸 + 強鹼 → 中性", ions: ["Na⁺", "Cl⁻"] },
        NaOAc: { name: "醋酸鈉", ph: 8.9, type: "鹼性", eq: "CH₃COO⁻ + H₂O ⇌ CH₃COOH + OH⁻", ions: ["Na⁺", "CH₃COO⁻"] },
        NH4Cl: { name: "氯化銨", ph: 5.1, type: "酸性", eq: "NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺", ions: ["NH₄⁺", "Cl⁻"] },
        Na2CO3: { name: "碳酸鈉", ph: 11.6, type: "鹼性", eq: "CO₃²⁻ + H₂O ⇌ HCO₃⁻ + OH⁻", ions: ["Na⁺", "CO₃²⁻"] },
        NH4OAc: { name: "醋酸銨", ph: 7.0, type: "近中性", eq: "弱酸 + 弱鹼 → 近中性", ions: ["NH₄⁺", "CH₃COO⁻"] }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const s = SALTS[saltSel.get()], col = CK.phColor(s.ph);
          CK.beaker(ctx, W * 0.27, H * 0.72, 140, 140, 0.62, col);
          // 離子
          for (let i = 0; i < 10; i++) {
            const a = i / 10 * PL.TAU, r = 20 + (i * 13 % 40);
            D.disc(ctx, W * 0.27 + Math.cos(a) * r, H * 0.62 + Math.sin(a) * r * 0.5, 5, { fill: i % 2 ? CK.ionColor(s.ions[1]) : CK.ionColor(s.ions[0]) });
          }
          D.text(ctx, s.name, W * 0.27, H * 0.80, { color: PL.col("text-dim"), size: 11, align: "center" });
          CK.panel(ctx, W * 0.52, H * 0.16, W * 0.40, H * 0.50, "水解判斷");
          D.text(ctx, s.type, W * 0.72, H * 0.27, { color: col, size: 17, align: "center", weight: "700" });
          D.text(ctx, "pH ≈ " + s.ph.toFixed(1), W * 0.72, H * 0.38, { color: PL.col("text-dim"), size: 13, align: "center" });
          D.text(ctx, s.eq, W * 0.72, H * 0.52, { color: PL.col("text-dim"), size: 10, align: "center" });
          D.text(ctx, "看鹽的來源：強酸強鹼 → 中性；強酸弱鹼 → 酸性；弱酸強鹼 → 鹼性。", W / 2, H * 0.86, { color: PL.col("text-faint"), size: 10, align: "center" });
          rPH.set(s.ph, 1); rType.set(s.type); rEq.set(s.eq);
        }
      });
      const saltSel = PL.ui.select(ui.L.controls, { label: "鹽類", value: "NaOAc", options: Object.keys(SALTS).map(k => ({ value: k, label: SALTS[k].name })) });
      PL.ui.note(ui.L.controls, "不是所有鹽都中性。弱酸根或弱鹼根會與水反應，改變溶液 pH；這就是鹽類水解。");
      const rPH = PL.ui.readout(ui.L.readouts, { label: "pH" });
      const rType = PL.ui.readout(ui.L.readouts, { label: "酸鹼性" });
      const rEq = PL.ui.readout(ui.L.readouts, { label: "水解反應" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("neutralization", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const n = molS.get();
          const heat = 57 * n;
          const mass = 100 + n * 40;
          const dT = heat * 1000 / (mass * 4.18);
          CK.calorimeter(ctx, W * 0.30, H * 0.74, 140, 160, 25 + dT, { label: "中和反應" });
          D.text(ctx, "H⁺ + OH⁻ → H₂O", W * 0.30, H * 0.84, { color: PL.col("text-dim"), size: 11, align: "center" });
          CK.panel(ctx, W * 0.52, H * 0.16, W * 0.40, H * 0.50, "熱量");
          D.text(ctx, n.toFixed(2) + " mol H₂O 生成", W * 0.72, H * 0.27, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "q = " + heat.toFixed(1) + " kJ", W * 0.72, H * 0.36, { color: PL.col("accent"), size: 18, align: "center", weight: "700" });
          D.text(ctx, "ΔT = " + dT.toFixed(2) + " °C", W * 0.72, H * 0.46, { color: "#ff8a65", size: 16, align: "center", weight: "700" });
          D.text(ctx, "q = m c ΔT", W * 0.72, H * 0.55, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, "強酸強鹼稀溶液的中和熱約 −57 kJ/mol。", W / 2, H * 0.90, { color: PL.col("text-faint"), size: 10, align: "center" });
          rQ.set(heat, 1); rDT.set(dT, 2); rN.set(n, 2);
        }
      });
      const molS = PL.ui.slider(ui.L.controls, { label: "生成水的莫耳數", min: 0.01, max: 0.5, step: 0.01, value: 0.1, unit: "mol", digits: 2 });
      PL.ui.note(ui.L.controls, "中和熱主要來自 H⁺ 與 OH⁻ 結合生成水。若使用弱酸，部分能量會用來解離，放出的熱會少一些。");
      const rQ = PL.ui.readout(ui.L.readouts, { label: "放熱量", unit: "kJ" });
      const rDT = PL.ui.readout(ui.L.readouts, { label: "水溫上升", unit: "°C" });
      const rN = PL.ui.readout(ui.L.readouts, { label: "生成水", unit: "mol" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("acid-rain", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const emission = emisS.get();
          const ph = 5.6 - Math.min(3.0, emission / 100 * 3.0);
          // 天空與雨
          D.rect(ctx, W * 0.06, H * 0.10, W * 0.88, H * 0.34, { fill: "rgba(90,120,150,0.25)", r: 8 });
          for (let i = 0; i < 26; i++) {
            const x = W * 0.10 + (i * 53 % 100) / 100 * W * 0.80;
            const y = H * 0.12 + (i * 29 % 100) / 100 * H * 0.28;
            D.line(ctx, x, y, x - 4, y + 10, ph < 5.6 ? "rgba(255,140,140,0.7)" : "rgba(160,210,240,0.7)", 1.4);
          }
          // 湖與樹
          D.rect(ctx, W * 0.06, H * 0.56, W * 0.88, H * 0.12, { fill: ph < 5 ? "rgba(120,150,90,0.7)" : "rgba(90,170,220,0.55)", r: 6 });
          for (let i = 0; i < 4; i++) {
            const x = W * 0.16 + i * W * 0.20, base = H * 0.56;
            D.line(ctx, x, base, x, base - 34, "#8a6a4c", 4);
            D.disc(ctx, x, base - 44, 18, { fill: ph < 5 ? "#8b7d4a" : "#66bb6a" });
          }
          CK.panel(ctx, W * 0.06, H * 0.72, W * 0.88, H * 0.16, "雨水 pH");
          /*
           * 0–14 的 pH 色尺加上一支游標。
           * 排放量滑桿原本只改了雨滴與湖水的顏色深淺，差異小到看不出來；
           * 游標沿著色尺往左移，就是「雨水越來越酸」最直接的證據。
           */
          const sx = W * 0.14, sw = W * 0.72, sy = H * 0.775;
          for (let i = 0; i < 14; i++) D.rect(ctx, sx + i / 14 * sw, sy, sw / 14 + 0.5, 6, { fill: CK.phColor(i + 0.5) });
          const mx = sx + PL.clamp(ph / 14, 0, 1) * sw;
          D.disc(ctx, mx, sy - 8, 4.5, { fill: "#fff", stroke: "#1b2530", width: 1.4 });
          D.text(ctx, "pH " + ph.toFixed(2) + (ph < 5.6 ? "　酸雨" : "　正常雨水"), W / 2, H * 0.845, { color: ph < 5.6 ? "#ff8a65" : "#66bb6a", size: 16, align: "center", weight: "700" });
          rPH.set(ph, 2); rEmission.set(emission, 0); rState.set(ph < 5.6 ? "酸雨" : "正常");
        }
      });
      const emisS = PL.ui.slider(ui.L.controls, { label: "硫氧化物排放", min: 0, max: 100, step: 5, value: 40, unit: "%", digits: 0 });
      PL.ui.note(ui.L.controls, "正常雨水因溶入 CO₂ 已略呈酸性（pH 約 5.6）。當 SO₂、NOₓ 排放增加，雨水 pH 會降到 5 以下，侵蝕大理石與酸化湖泊。");
      const rPH = PL.ui.readout(ui.L.readouts, { label: "雨水 pH" });
      const rEmission = PL.ui.readout(ui.L.readouts, { label: "汙染物排放", unit: "%" });
      const rState = PL.ui.readout(ui.L.readouts, { label: "判定" });
      return { stop() { ui.stop(); } };
    }
  });
})();
