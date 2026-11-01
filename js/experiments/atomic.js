/* 模組二 · 原子結構與週期表 */
(function () {
  "use strict";
  const PL = window.PhysicsLab, CK = window.ChemLab, D = PL.draw;

  PL.register("atomic-models", {
    build(root) {
      const MODELS = {
        dalton: { name: "道耳頓實心球", year: "1803", draw: "ball", evidence: "定比定律、質量守恆", limit: "無法解釋電子與放射性" },
        thomson: { name: "湯姆森西瓜模型", year: "1904", draw: "plum", evidence: "陰極射線發現電子", limit: "無法解釋金箔散射" },
        rutherford: { name: "拉塞福核式模型", year: "1911", draw: "nucleus", evidence: "α 粒子大角度散射", limit: "電子繞核會輻射而墜落" },
        bohr: { name: "波耳能階模型", year: "1913", draw: "bohr", evidence: "氫原子線光譜", limit: "無法解釋多電子原子" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.58,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = modelSel.get(), m = MODELS[key];
          CK.panel(ctx, W * 0.08, H * 0.10, W * 0.84, H * 0.72, m.name + "（" + m.year + "）");
          const cx = W / 2, cy = H * 0.43, R = Math.min(W, H) * 0.23;
          if (m.draw === "ball") {
            D.disc(ctx, cx, cy, R * 0.8, { fill: "#7c9cff", stroke: "rgba(0,0,0,0.25)" });
            D.text(ctx, "不可分割的實心球", cx, cy + R + 18, { color: PL.col("text-dim"), size: 12, align: "center" });
          } else if (m.draw === "plum") {
            D.disc(ctx, cx, cy, R * 0.82, { fill: "rgba(240,120,120,0.28)", stroke: "#f07878" });
            for (let i = 0; i < 14; i++) {
              const a = i / 14 * PL.TAU, rr = R * 0.62 * Math.sqrt((i * 37 % 100) / 100);
              D.disc(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 5, { fill: "#8fd0ff" });
            }
            D.text(ctx, "正電球體中嵌著電子", cx, cy + R + 18, { color: PL.col("text-dim"), size: 12, align: "center" });
          } else if (m.draw === "nucleus") {
            D.disc(ctx, cx, cy, R * 0.14, { fill: "#e25555" });
            D.disc(ctx, cx + R * 0.5, cy - R * 0.35, 3.2, { fill: "#8fd0ff" });
            D.line(ctx, cx, cy, cx + R * 0.5, cy - R * 0.35, "rgba(140,180,220,0.4)", 1, [4, 4]);
            for (let i = 0; i < 22; i++) {
              const a = i / 22 * PL.TAU, rr = R * (0.45 + (i % 3) * 0.16);
              D.disc(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 2.6, { fill: "#8fd0ff" });
            }
            D.text(ctx, "電子在核外空間中", cx, cy + R + 18, { color: PL.col("text-dim"), size: 12, align: "center" });
          } else {
            D.disc(ctx, cx, cy, R * 0.13, { fill: "#e25555" });
            for (let s = 0; s < 3; s++) {
              const rr = R * (0.36 + s * 0.22);
              D.disc(ctx, cx, cy, rr, { stroke: "rgba(140,180,220,0.35)", width: 1 });
              for (let k = 0; k < [2, 8, 1][s]; k++) {
                const a = -Math.PI / 2 + k / [2, 8, 1][s] * PL.TAU;
                D.disc(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 2.8, { fill: "#8fd0ff" });
              }
            }
            D.text(ctx, "電子只能在特定能階", cx, cy + R + 18, { color: PL.col("text-dim"), size: 12, align: "center" });
          }
          rEvidence.set(m.evidence); rLimit.set(m.limit); rYear.set(m.year);
        }
      });
      const modelSel = PL.ui.select(ui.L.controls, { label: "原子模型", value: "dalton", options: Object.keys(MODELS).map(k => ({ value: k, label: MODELS[k].name })) });
      PL.ui.note(ui.L.controls, "模型不是真理，而是「目前最能解釋證據的圖像」。新實驗出現時，舊模型會被修正，而不是被硬撐著。");
      PL.ui.procedure(ui.L.controls, {
        title: "用證據選模型",
        steps: [
          "先問：這個模型能解釋哪一個實驗證據？",
          "再問：哪個現象它解釋不了？",
          "換到下一個模型，確認它保留了舊模型說得通的部分。"
        ],
        rule: "考試問的不是年份，而是「哪個證據推翻了哪個模型」——α 粒子大角度散射推翻湯姆森模型，就是最常考的一組。"
      });
      const rEvidence = PL.ui.readout(ui.L.readouts, { label: "關鍵證據" });
      const rLimit = PL.ui.readout(ui.L.readouts, { label: "遇到的困難" });
      const rYear = PL.ui.readout(ui.L.readouts, { label: "提出年分" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("subatomic", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const p = protonS.get(), n = neutronS.get(), e = electronS.get();
          const charge = p - e;
          shellsOf(p + n);
          const shells = fillShells(e);
          CK.atomDiagram(ctx, W * 0.42, H * 0.44, Math.min(W, H) * 0.30, shells, {
            label: "質子 " + p + " · 中子 " + n + " · 電子 " + e,
            nucleons: [p, n]
          });
          CK.panel(ctx, W * 0.70, H * 0.16, W * 0.25, H * 0.40, "粒子電荷");
          D.text(ctx, "質子 +1  × " + p, W * 0.825, H * 0.26, { color: "#ff8a80", size: 12, align: "center" });
          D.text(ctx, "電子 −1  × " + e, W * 0.825, H * 0.33, { color: "#8fd0ff", size: 12, align: "center" });
          D.text(ctx, "中子  0  × " + n, W * 0.825, H * 0.40, { color: PL.col("text-dim"), size: 12, align: "center" });
          const ion = charge === 0 ? "中性原子" : charge > 0 ? "陽離子（少 " + charge + " 個電子）" : "陰離子（多 " + (-charge) + " 個電子）";
          D.text(ctx, ion, W / 2, H * 0.84, { color: charge === 0 ? PL.col("accent") : charge > 0 ? "#ff8a80" : "#8fd0ff", size: 16, align: "center", weight: "700" });
          D.text(ctx, "質量數 A = " + (p + n) + "　原子序 Z = " + p, W / 2, H * 0.91, { color: PL.col("text-dim"), size: 12, align: "center" });
          rZ.set(p); rA.set(p + n); rCharge.set(charge > 0 ? "+" + charge : String(charge)); rIon.set(ion);
        }
      });
      const protonS = PL.ui.slider(ui.L.controls, { label: "質子數", min: 1, max: 20, step: 1, value: 11, digits: 0 });
      const neutronS = PL.ui.slider(ui.L.controls, { label: "中子數", min: 0, max: 24, step: 1, value: 12, digits: 0 });
      const electronS = PL.ui.slider(ui.L.controls, { label: "電子數", min: 0, max: 20, step: 1, value: 11, digits: 0 });
      PL.ui.note(ui.L.controls, "先固定質子數，只改電子數：質子數決定元素，電子數決定它是不是離子。再把電子數調回與質子相同，觀察電荷歸零。");
      const rZ = PL.ui.readout(ui.L.readouts, { label: "原子序 Z" });
      const rA = PL.ui.readout(ui.L.readouts, { label: "質量數 A" });
      const rCharge = PL.ui.readout(ui.L.readouts, { label: "淨電荷" });
      const rIon = PL.ui.readout(ui.L.readouts, { label: "粒子種類" });
      return { stop() { ui.stop(); } };

      function fillShells(count) {
        const caps = [2, 8, 8, 2], out = [];
        let left = count;
        for (let i = 0; i < caps.length && left > 0; i++) { const k = Math.min(caps[i], left); out.push(k); left -= k; }
        return out.length ? out : [0];
      }
      function shellsOf() { return null; }
    }
  });

  PL.register("isotopes", {
    build(root) {
      const ELEMENTS = {
        H: { name: "氫", isotopes: [{ a: 1, m: 1.008, f: 99.985 }, { a: 2, m: 2.014, f: 0.015 }] },
        C: { name: "碳", isotopes: [{ a: 12, m: 12.000, f: 98.93 }, { a: 13, m: 13.003, f: 1.07 }] },
        Cl: { name: "氯", isotopes: [{ a: 35, m: 34.969, f: 75.76 }, { a: 37, m: 36.966, f: 24.24 }] },
        Cu: { name: "銅", isotopes: [{ a: 63, m: 62.930, f: 69.15 }, { a: 65, m: 64.928, f: 30.85 }] }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const el = elSel.get(), data = ELEMENTS[el];
          const f1 = isotopeS.get(), f2 = 100 - f1;
          const iso = data.isotopes;
          const avg = (iso[0].m * f1 + iso[1].m * f2) / 100;
          CK.panel(ctx, W * 0.06, H * 0.10, W * 0.88, H * 0.76, data.name + " 的同位素豐度");
          // 質譜柱
          const x0 = W * 0.15, x1 = W * 0.88, base = H * 0.66;
          D.line(ctx, x0, base, x1, base, PL.col("text-dim"), 1.5);
          const xs = [W * 0.32, W * 0.64];
          const hs = [f1 / 100, f2 / 100];
          for (let i = 0; i < 2; i++) {
            D.rect(ctx, xs[i] - 26, base - hs[i] * H * 0.42, 52, hs[i] * H * 0.42, { fill: i ? "#7c9cff" : "#4dd0e1", r: 3 });
            D.text(ctx, iso[i].a + " 號", xs[i], base + 20, { color: PL.col("text-dim"), size: 12, align: "center" });
            D.text(ctx, hs[i] * 100 + "%", xs[i], base - hs[i] * H * 0.42 - 10, { color: PL.col("text-dim"), size: 12, align: "center" });
          }
          D.text(ctx, "平均原子量 = " + avg.toFixed(3), W / 2, H * 0.80, { color: PL.col("accent"), size: 18, align: "center", weight: "700" });
          D.text(ctx, "同位素：質子數相同、中子數不同", W / 2, H * 0.87, { color: PL.col("text-faint"), size: 11, align: "center" });
          rAvg.set(avg, 3); rF1.set(f1 + " / " + f2); rIso.set(iso[0].a + " 與 " + iso[1].a);
        }
      });
      const elSel = PL.ui.select(ui.L.controls, { label: "元素", value: "Cl", options: Object.keys(ELEMENTS).map(k => ({ value: k, label: ELEMENTS[k].name + "（" + k + "）" })) });
      const isotopeS = PL.ui.slider(ui.L.controls, { label: "較輕同位素豐度", min: 0, max: 100, step: 1, value: 75, unit: "%", digits: 0 });
      PL.ui.note(ui.L.controls, "拖動豐度：平均原子量會落在兩個同位素質量之間，且靠近豐度高的那一邊。週期表上的原子量就是這個加權平均。");
      const rAvg = PL.ui.readout(ui.L.readouts, { label: "平均原子量", unit: "u" });
      const rF1 = PL.ui.readout(ui.L.readouts, { label: "豐度（輕 / 重）", unit: "%" });
      const rIso = PL.ui.readout(ui.L.readouts, { label: "同位素質量數" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("electron-config", {
    build(root) {
      const ELEMENTS = {
        H: { name: "氫", z: 1, cfg: "1s¹", valence: 1, period: 1, group: "IA" },
        He: { name: "氦", z: 2, cfg: "1s²", valence: 2, period: 1, group: "VIIIA" },
        Li: { name: "鋰", z: 3, cfg: "[He] 2s¹", valence: 1, period: 2, group: "IA" },
        C: { name: "碳", z: 6, cfg: "1s² 2s² 2p²", valence: 4, period: 2, group: "IVA" },
        N: { name: "氮", z: 7, cfg: "1s² 2s² 2p³", valence: 5, period: 2, group: "VA" },
        O: { name: "氧", z: 8, cfg: "1s² 2s² 2p⁴", valence: 6, period: 2, group: "VIA" },
        Ne: { name: "氖", z: 10, cfg: "1s² 2s² 2p⁶", valence: 8, period: 2, group: "VIIIA" },
        Na: { name: "鈉", z: 11, cfg: "[Ne] 3s¹", valence: 1, period: 3, group: "IA" },
        Mg: { name: "鎂", z: 12, cfg: "[Ne] 3s²", valence: 2, period: 3, group: "IIA" },
        Al: { name: "鋁", z: 13, cfg: "[Ne] 3s² 3p¹", valence: 3, period: 3, group: "IIIA" },
        Cl: { name: "氯", z: 17, cfg: "[Ne] 3s² 3p⁵", valence: 7, period: 3, group: "VIIA" },
        Ar: { name: "氬", z: 18, cfg: "[Ne] 3s² 3p⁶", valence: 8, period: 3, group: "VIIIA" },
        K: { name: "鉀", z: 19, cfg: "[Ar] 4s¹", valence: 1, period: 4, group: "IA" },
        Ca: { name: "鈣", z: 20, cfg: "[Ar] 4s²", valence: 2, period: 4, group: "IIA" },
        Fe: { name: "鐵", z: 26, cfg: "[Ar] 4s² 3d⁶", valence: 8, period: 4, group: "VIIIB" }
      };
      const ORBITALS = [["1s", 2], ["2s", 2], ["2p", 6], ["3s", 2], ["3p", 6], ["4s", 2], ["3d", 10], ["4p", 6]];
      const ui = CK.scaffold(root, {
        aspect: 0.58,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const el = elSel.get(), e = ELEMENTS[el];
          CK.panel(ctx, W * 0.05, H * 0.10, W * 0.90, H * 0.78, e.name + "（Z = " + e.z + "）電子組態");
          // 軌域格
          let left = e.z, x = W * 0.08, y = H * 0.28, rowH = 42;
          ORBITALS.forEach(([name, cap]) => {
            if (left <= 0) return;
            const n = Math.min(cap, left); left -= n;
            D.text(ctx, name, x - 26, y + 6, { color: PL.col("text-dim"), size: 11, align: "right" });
            const boxes = name.endsWith("p") ? 3 : name.endsWith("d") ? 5 : 1;
            const per = name.endsWith("p") ? 2 : name.endsWith("d") ? 2 : 2;
            for (let b = 0; b < boxes; b++) {
              const bx = x + b * 30;
              D.rect(ctx, bx, y - 12, 24, 24, { stroke: PL.col("border"), r: 3 });
              for (let k = 0; k < per; k++) {
                if (b * per + k < n) {
                  const up = k === 0;
                  D.text(ctx, up ? "↑" : "↓", bx + 12, y + 4, { color: up ? PL.col("accent") : PL.col("accent-2"), size: 13, align: "center", weight: "700" });
                }
              }
            }
            y += rowH;
            if (y > H * 0.72) { y = H * 0.28; x += W * 0.46; }
          });
          D.text(ctx, e.cfg, W / 2, H * 0.50, { color: PL.col("accent"), size: 15, align: "center", weight: "700" });
          D.text(ctx, "週期 " + e.period + " · 族 " + e.group + " · 價電子 " + e.valence, W / 2, H * 0.83, { color: PL.col("text-dim"), size: 12, align: "center" });
          rCfg.set(e.cfg); rPeriod.set(String(e.period)); rGroup.set(e.group); rValence.set(e.valence + " 個");
        }
      });
      const elSel = PL.ui.select(ui.L.controls, { label: "元素", value: "O", options: Object.keys(ELEMENTS).map(k => ({ value: k, label: ELEMENTS[k].name + "（" + k + "）" })) });
      PL.ui.note(ui.L.controls, "電子依 1s → 2s → 2p → 3s → 3p → 4s → 3d 的能階順序填入。注意 4s 比 3d 先填，這是過渡金屬組態的常見考點。");
      const rCfg = PL.ui.readout(ui.L.readouts, { label: "電子組態" });
      const rPeriod = PL.ui.readout(ui.L.readouts, { label: "週期" });
      const rGroup = PL.ui.readout(ui.L.readouts, { label: "族" });
      const rValence = PL.ui.readout(ui.L.readouts, { label: "價電子數" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("periodic-trends", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const kind = trendSel.get();
          const hi = kind === "radius" ? { Li: 1, Na: 1, K: 1, F: 1, Cl: 1, Br: 1 } : kind === "ie" ? { He: 1, Ne: 1, Ar: 1, Li: 1, Na: 1, K: 1 } : { F: 1, O: 1, N: 1, Cl: 1, S: 1 };
          CK.periodicMap(ctx, { x: W * 0.10, y: H * 0.18, w: W * 0.80, h: H * 0.34 }, { highlight: hi, dim: Object.fromEntries(Object.keys({ H: 1, He: 1, B: 1, C: 1, N: 1, O: 1, F: 1, Ne: 1, Mg: 1, Al: 1, Si: 1, P: 1, S: 1, Cl: 1, Ar: 1, Ca: 1, Fe: 1, Cu: 1, Zn: 1, Br: 1, Kr: 1 }).map(k => [k, 1])) });
          const arrows = {
            radius: [["原子半徑", "同週期由左至右變小；同族由上至下變大", "→ 核電荷增加，拉得更緊　↓ 電子層增加"]],
            ie: [["游離能", "同週期由左至右變大；同族由上至下變小", "→ 價電子更難移除　↓ 外層電子更遠、更易移除"]],
            en: [["電負度", "同週期由左至右變大；同族由上至下變小", "→ 更容易吸引共用電子"]]
          }[kind];
          CK.panel(ctx, W * 0.08, H * 0.60, W * 0.84, H * 0.26, arrows[0][0] + "趨勢");
          D.text(ctx, arrows[0][1], W / 2, H * 0.70, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, arrows[0][2], W / 2, H * 0.78, { color: PL.col("text-faint"), size: 11, align: "center" });
          rTrend.set(arrows[0][0]); rDir.set(arrows[0][1]);
        }
      });
      const trendSel = PL.ui.select(ui.L.controls, { label: "性質", value: "radius", options: [
        { value: "radius", label: "原子半徑" }, { value: "ie", label: "第一游離能" }, { value: "en", label: "電負度" }
      ] });
      PL.ui.note(ui.L.controls, "看週期表時，先分「橫向」與「縱向」。橫向主要受核電荷影響，縱向主要受電子層數影響；兩股力量方向相反。");
      const rTrend = PL.ui.readout(ui.L.readouts, { label: "性質" });
      const rDir = PL.ui.readout(ui.L.readouts, { label: "變化方向" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("periodic-groups", {
    build(root) {
      const GROUPS = {
        IA: { name: "鹼金屬", members: "Li、Na、K", valence: 1, property: "易失去 1 個電子，活性大，遇水生成氫氣與鹼", color: "#ff8a65" },
        IIA: { name: "鹼土金屬", members: "Be、Mg、Ca", valence: 2, property: "易失去 2 個電子，活性次於鹼金屬", color: "#ffb74d" },
        VIIA: { name: "鹵素", members: "F、Cl、Br、I", valence: 7, property: "易得 1 個電子，形成 −1 價離子，活性由上往下遞減", color: "#81c784" },
        VIIIA: { name: "貴氣體", members: "He、Ne、Ar", valence: 8, property: "電子層已滿，化學性質穩定，不易反應", color: "#64b5f6" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = groupSel.get(), g = GROUPS[key];
          const cols = key === "IA" ? ["Li", "Na", "K"] : key === "IIA" ? ["Be", "Mg", "Ca"] : key === "VIIA" ? ["F", "Cl", "Br"] : ["He", "Ne", "Ar"];
          CK.periodicMap(ctx, { x: W * 0.10, y: H * 0.18, w: W * 0.80, h: H * 0.34 }, { highlight: Object.fromEntries(cols.map(c => [c, 1])) });
          CK.panel(ctx, W * 0.08, H * 0.60, W * 0.84, H * 0.28, g.name + "（" + key + "）");
          D.text(ctx, g.members, W / 2, H * 0.70, { color: g.color, size: 16, align: "center", weight: "700" });
          D.text(ctx, g.property, W / 2, H * 0.79, { color: PL.col("text-dim"), size: 11, align: "center" });
          rValence.set(g.valence + " 個"); rMembers.set(g.members); rProperty.set(g.property);
        }
      });
      const groupSel = PL.ui.select(ui.L.controls, { label: "族", value: "IA", options: Object.keys(GROUPS).map(k => ({ value: k, label: k + " " + GROUPS[k].name })) });
      PL.ui.note(ui.L.controls, "同一族的價電子數相同，所以化學性質相似；但原子半徑往下增加，活性仍會出現規律變化。");
      const rValence = PL.ui.readout(ui.L.readouts, { label: "價電子數" });
      const rMembers = PL.ui.readout(ui.L.readouts, { label: "代表元素" });
      const rProperty = PL.ui.readout(ui.L.readouts, { label: "主要性質" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("flame-test", {
    build(root) {
      const METALS = {
        Li: { name: "鋰", color: "#e040fb", wave: 670, note: "紫紅" },
        Na: { name: "鈉", color: "#ffd54f", wave: 589, note: "黃" },
        K: { name: "鉀", color: "#b39ddb", wave: 766, note: "紫（需鈷玻璃）" },
        Ca: { name: "鈣", color: "#ff8a65", wave: 622, note: "橙紅" },
        Sr: { name: "鍶", color: "#ef5350", wave: 606, note: "紅" },
        Ba: { name: "鋇", color: "#aed581", wave: 524, note: "黃綠" },
        Cu: { name: "銅", color: "#4dd0e1", wave: 515, note: "綠" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.58,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = metalSel.get(), m = METALS[key];
          // 酒精燈
          const cx = W * 0.32, base = H * 0.80;
          D.rect(ctx, cx - 34, base - 18, 68, 18, { fill: "#8fa6bf", r: 4 });
          D.rect(ctx, cx - 14, base - 54, 28, 38, { fill: "#c7d6e5", r: 3 });
          // 火焰
          const flick = 1 + Math.sin(Date.now() / 220) * 0.04;
          ctx.save();
          ctx.globalAlpha = 0.85;
          for (let i = 0; i < 3; i++) {
            const fw = (34 - i * 9) * flick, fh = (86 - i * 18) * flick;
            D.disc(ctx, cx, base - 54 - fh * 0.5, fw * 0.6, { fill: m.color, glow: m.color, glowSize: 10 });
            ctx.beginPath(); ctx.moveTo(cx - fw / 2, base - 54); ctx.quadraticCurveTo(cx, base - 54 - fh, cx + fw / 2, base - 54); ctx.closePath();
            ctx.fillStyle = m.color + (i === 2 ? "cc" : "99"); ctx.fill();
          }
          ctx.restore();
          // 金屬棒
          D.line(ctx, cx + 18, base - 42, W * 0.64, H * 0.28, "#9aa8b8", 4);
          D.text(ctx, key + " 鹽", W * 0.66, H * 0.25, { color: m.color, size: 16, align: "center", weight: "700" });
          // 光譜
          CK.spectrum(ctx, { x: W * 0.48, y: H * 0.16, w: W * 0.44, h: H * 0.12 }, [{ x: (m.wave - 380) / 380, color: m.color, h: 0.9, label: m.wave + " nm" }], { rainbow: true, xlabel: "可見光光譜（380–760 nm）" });
          CK.panel(ctx, W * 0.08, H * 0.58, W * 0.36, H * 0.22, "焰色");
          D.text(ctx, m.note, W * 0.26, H * 0.68, { color: m.color, size: 16, align: "center", weight: "700" });
          D.text(ctx, "波長約 " + m.wave + " nm", W * 0.26, H * 0.75, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "受熱激發 → 電子躍遷回低能階 → 放出特徵光", W / 2, H * 0.90, { color: PL.col("text-faint"), size: 11, align: "center" });
          rColor.set(m.note); rWave.set(m.wave, 0); rElement.set(key);
        }
      });
      const metalSel = PL.ui.select(ui.L.controls, { label: "金屬鹽", value: "Na", options: Object.keys(METALS).map(k => ({ value: k, label: METALS[k].name + "（" + k + "）" })) });
      PL.ui.note(ui.L.controls, "焰色是原子光譜的巨觀版本：每種金屬的能階差固定，所以火焰顏色固定。鉀的紫色容易被鈉的黃光蓋住，實驗上會透過鈷玻璃濾掉黃光。");
      const rColor = PL.ui.readout(ui.L.readouts, { label: "焰色" });
      const rWave = PL.ui.readout(ui.L.readouts, { label: "特徵波長", unit: "nm" });
      const rElement = PL.ui.readout(ui.L.readouts, { label: "金屬元素" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("emission-spectrum", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.58,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const n1 = seriesSel.get() === "lyman" ? 1 : seriesSel.get() === "balmer" ? 2 : 3;
          const n2 = nhS.get();
          const nHi = Math.max(n2, n1 + 1);
          const R = 1.097e7;
          const inv = R * (1 / (n1 * n1) - 1 / (nHi * nHi));
          const lam = 1e9 / inv; // nm
          const dE = 13.6 * (1 / (n1 * n1) - 1 / (nHi * nHi)); // eV
          const col = lam < 430 ? "#8e7dff" : lam < 490 ? "#4fa3ff" : lam < 560 ? "#4dd0e1" : lam < 590 ? "#9ccc65" : lam < 650 ? "#ffb74d" : "#ef5350";
          const levels = [];
          for (let n = 1; n <= 6; n++) levels.push({ label: "n=" + n, y: (n === 1 ? 0.10 : 0.10 + (1 - 1 / (n * n)) / 0.986 * 0.82), n, color: n === n1 || n === nHi ? PL.col("accent") : PL.col("border"), width: n === n1 || n === nHi ? 2.4 : 1 });
          CK.energyLevels(ctx, { x: W * 0.12, y: H * 0.16, w: W * 0.30, h: H * 0.62 }, levels, { transition: { from: nHi - 1, to: n1 - 1, color: col, x: 0.42 } });
          D.text(ctx, "能階躍遷", W * 0.29, H * 0.11, { color: PL.col("text-dim"), size: 11, align: "center" });
          // 光譜
          CK.spectrum(ctx, { x: W * 0.56, y: H * 0.20, w: W * 0.36, h: H * 0.36 }, [{ x: (lam - 380) / 380, color: col, h: 0.9, label: lam.toFixed(0) + " nm" }], { rainbow: true, xlabel: "波長 (nm)" });
          CK.panel(ctx, W * 0.50, H * 0.60, W * 0.44, H * 0.24, "躍遷結果");
          D.text(ctx, nHi + " → " + n1, W * 0.72, H * 0.68, { color: PL.col("accent"), size: 16, align: "center", weight: "700" });
          D.text(ctx, "ΔE = " + dE.toFixed(2) + " eV", W * 0.72, H * 0.75, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "λ = " + lam.toFixed(1) + " nm", W * 0.72, H * 0.81, { color: col, size: 14, align: "center", weight: "700" });
          rLam.set(lam, 1); rDE.set(dE, 2); rSeries.set(seriesSel.get() === "lyman" ? "來曼系（UV）" : seriesSel.get() === "balmer" ? "巴耳末系（可見光）" : "帕申系（IR）");
        }
      });
      const seriesSel = PL.ui.select(ui.L.controls, { label: "終點能階", value: "balmer", options: [
        { value: "lyman", label: "來曼系 n₁ = 1" }, { value: "balmer", label: "巴耳末系 n₁ = 2" }, { value: "paschen", label: "帕申系 n₁ = 3" }
      ] });
      const nhS = PL.ui.slider(ui.L.controls, { label: "起始能階 n₂", min: 2, max: 6, step: 1, value: 3, digits: 0 });
      PL.ui.note(ui.L.controls, "先選巴耳末系（n₁=2），把 n₂ 從 3 拉到 6：波長越來越短，譜線從紅光往藍紫移動。能量差越大，光子頻率越高。");
      const rLam = PL.ui.readout(ui.L.readouts, { label: "波長", unit: "nm" });
      const rDE = PL.ui.readout(ui.L.readouts, { label: "能量差", unit: "eV" });
      const rSeries = PL.ui.readout(ui.L.readouts, { label: "光譜系列" });
      return { stop() { ui.stop(); } };
    }
  });
})();
