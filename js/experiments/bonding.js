/* 模組三 · 化學鍵與物質性質 */
(function () {
  "use strict";
  const PL = window.PhysicsLab, CK = window.ChemLab, D = PL.draw;

  PL.register("ionic-bond", {
    build(root) {
      const PAIRS = {
        NaCl: { a: "Na", b: "Cl", ca: "+1", cb: "−1", mp: 801, lattice: 787, color: "#b07cf0" },
        MgO: { a: "Mg", b: "O", ca: "+2", cb: "−2", mp: 2852, lattice: 3795, color: "#7fbf6a" },
        CaO: { a: "Ca", b: "O", ca: "+2", cb: "−2", mp: 2572, lattice: 3414, color: "#ffb36b" },
        KBr: { a: "K", b: "Br", ca: "+1", cb: "−1", mp: 734, lattice: 682, color: "#c471ed" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.58,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = pairSel.get(), p = PAIRS[key];
          CK.panel(ctx, W * 0.06, H * 0.10, W * 0.88, H * 0.30, "電子轉移");
          const ax = W * 0.28, bx = W * 0.72, cy = H * 0.25;
          D.disc(ctx, ax, cy, 28, { fill: CK.elementColor(p.a), stroke: "rgba(0,0,0,0.25)" });
          D.text(ctx, p.a, ax, cy + 5, { color: "#18202b", size: 14, align: "center", weight: "700" });
          D.disc(ctx, bx, cy, 28, { fill: CK.elementColor(p.b), stroke: "rgba(0,0,0,0.25)" });
          D.text(ctx, p.b, bx, cy + 5, { color: "#18202b", size: 14, align: "center", weight: "700" });
          D.arrow(ctx, ax + 38, cy - 10, bx - 38, cy - 10, { color: PL.col("accent"), width: 2.2, label: "電子" });
          D.text(ctx, p.a + p.ca, ax, cy + 46, { color: "#ff8a80", size: 14, align: "center", weight: "700" });
          D.text(ctx, p.b + p.cb, bx, cy + 46, { color: "#8fd0ff", size: 14, align: "center", weight: "700" });
          // 晶格
          CK.panel(ctx, W * 0.06, H * 0.46, W * 0.88, H * 0.40, "離子晶格");
          const cols = 6, rows = 4, gx = W * 0.18, gy = H * 0.58, step = Math.min(W * 0.10, H * 0.08);
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const x = gx + c * step, y = gy + r * step, pos = (r + c) % 2 === 0;
            D.disc(ctx, x, y, step * 0.30, { fill: pos ? p.color : "#7aa5d9", stroke: "rgba(0,0,0,0.2)" });
            D.text(ctx, pos ? p.ca : p.cb, x, y + 3.5, { color: "#fff", size: 9, align: "center", weight: "700" });
            if (c < cols - 1) D.line(ctx, x + step * 0.3, y, x + step - step * 0.3, y, "rgba(160,190,210,0.25)", 1, [3, 4]);
            if (r < rows - 1) D.line(ctx, x, y + step * 0.3, x, y + step - step * 0.3, "rgba(160,190,210,0.25)", 1, [3, 4]);
          }
          D.text(ctx, "熔點 " + p.mp + " °C　晶格能約 " + p.lattice + " kJ/mol", W / 2, H * 0.91, { color: PL.col("text-dim"), size: 12, align: "center" });
          rCharge.set(p.ca + " / " + p.cb); rMp.set(p.mp, 0); rLattice.set(p.lattice, 0);
          rWhy.set("靜電引力強、離子緊密堆積；固態離子不能移動，故不導電。");
        }
      });
      const pairSel = PL.ui.select(ui.L.controls, { label: "離子化合物", value: "NaCl", options: Object.keys(PAIRS).map(k => ({ value: k, label: k })) });
      PL.ui.note(ui.L.controls, "把 MgO 和 NaCl 相比：電荷從 ±1 變成 ±2，靜電引力大增，熔點與晶格能也跟著升高。");
      const rCharge = PL.ui.readout(ui.L.readouts, { label: "離子電荷" });
      const rMp = PL.ui.readout(ui.L.readouts, { label: "熔點", unit: "°C" });
      const rLattice = PL.ui.readout(ui.L.readouts, { label: "晶格能", unit: "kJ/mol" });
      const rWhy = PL.ui.readout(ui.L.readouts, { label: "性質原因" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("covalent-bond", {
    build(root) {
      const MOLS = {
        H2: { name: "氫", order: 1, length: 74, energy: 436, atoms: "H—H" },
        O2: { name: "氧", order: 2, length: 121, energy: 498, atoms: "O=O" },
        N2: { name: "氮", order: 3, length: 110, energy: 946, atoms: "N≡N" },
        HCl: { name: "氯化氫", order: 1, length: 127, energy: 431, atoms: "H—Cl" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = molSel.get(), m = MOLS[key];
          CK.panel(ctx, W * 0.08, H * 0.12, W * 0.84, H * 0.38, m.name + "分子");
          CK.moleculeByName(ctx, W / 2, H * 0.30, key, Math.min(W, H) * 0.38, 0);
          D.text(ctx, m.atoms, W / 2, H * 0.44, { color: PL.col("accent"), size: 18, align: "center", weight: "700" });
          // 鍵級
          CK.panel(ctx, W * 0.08, H * 0.56, W * 0.84, H * 0.28, "鍵的性質");
          const labels = ["鍵級", "鍵長 (pm)", "鍵能 (kJ/mol)"];
          const vals = [m.order, m.length, m.energy];
          labels.forEach((lab, i) => {
            D.text(ctx, lab, W * 0.24, H * 0.65 + i * 22, { color: PL.col("text-dim"), size: 12 });
            D.text(ctx, String(vals[i]), W * 0.75, H * 0.65 + i * 22, { color: PL.col("accent"), size: 13, align: "right", weight: "700" });
          });
          D.text(ctx, "鍵級越高 → 鍵長越短、鍵能越大", W / 2, H * 0.90, { color: PL.col("text-faint"), size: 11, align: "center" });
          rOrder.set(m.order + " 級"); rLen.set(m.length, 0); rEnergy.set(m.energy, 0);
        }
      });
      const molSel = PL.ui.select(ui.L.controls, { label: "分子", value: "N2", options: Object.keys(MOLS).map(k => ({ value: k, label: k + "（" + MOLS[k].name + "）" })) });
      PL.ui.note(ui.L.controls, "依序比較 H₂、O₂、N₂：鍵級 1 → 2 → 3，鍵長變短、鍵能變大。氮氣很難打斷，正是它在大氣中穩定的原因。");
      const rOrder = PL.ui.readout(ui.L.readouts, { label: "鍵級" });
      const rLen = PL.ui.readout(ui.L.readouts, { label: "鍵長", unit: "pm" });
      const rEnergy = PL.ui.readout(ui.L.readouts, { label: "鍵能", unit: "kJ/mol" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("metallic-bond", {
    build(root) {
      const METALS = {
        Na: { name: "鈉", mp: 98, conduct: "良", malleable: "良", color: "#c0c7d1" },
        Mg: { name: "鎂", mp: 650, conduct: "良", malleable: "中", color: "#b8c2cc" },
        Al: { name: "鋁", mp: 660, conduct: "良", malleable: "優", color: "#aeb9c6" },
        Fe: { name: "鐵", mp: 1538, conduct: "中", malleable: "中", color: "#8b8f96" },
        Cu: { name: "銅", mp: 1085, conduct: "優", malleable: "優", color: "#c07a45" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.56, animate: true,
        draw(dt, t) {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = metalSel.get(), m = METALS[key];
          CK.panel(ctx, W * 0.08, H * 0.12, W * 0.84, H * 0.62, m.name + " 的金屬鍵");
          const cols = 5, rows = 4, cx = W * 0.24, cy = H * 0.30, step = Math.min(W * 0.09, H * 0.10);
          // 電子海
          for (let i = 0; i < 26; i++) {
            const x = W * 0.12 + (i * 47 % 100) / 100 * W * 0.62;
            const y = H * 0.20 + (i * 71 % 100) / 100 * H * 0.44;
            D.disc(ctx, x + Math.sin(t * 1.6 + i) * 8, y + Math.cos(t * 1.3 + i * 1.7) * 6, 3, { fill: "#8fd0ff", glow: "#8fd0ff", glowSize: 5 });
          }
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const x = cx + c * step, y = cy + r * step;
            D.disc(ctx, x, y, step * 0.30, { fill: m.color, stroke: "rgba(0,0,0,0.25)" });
            D.text(ctx, key + (key === "Na" ? "⁺" : "²⁺"), x, y + 3.5, { color: "#18202b", size: 8, align: "center", weight: "700" });
          }
          D.text(ctx, "正離子晶格浸在自由電子海中", W / 2, H * 0.82, { color: PL.col("text-dim"), size: 12, align: "center" });
          rMp.set(m.mp, 0); rConduct.set(m.conduct); rMalle.set(m.malleable); rElectron.set("自由電子可移動");
        }
      });
      const metalSel = PL.ui.select(ui.L.controls, { label: "金屬", value: "Cu", options: Object.keys(METALS).map(k => ({ value: k, label: METALS[k].name + "（" + k + "）" })) });
      PL.ui.note(ui.L.controls, "按播放看自由電子流動。金屬能導電、導熱與延展，都來自這群不受特定原子束縛的價電子。");
      const rMp = PL.ui.readout(ui.L.readouts, { label: "熔點", unit: "°C" });
      const rConduct = PL.ui.readout(ui.L.readouts, { label: "導電性" });
      const rMalle = PL.ui.readout(ui.L.readouts, { label: "延展性" });
      const rElectron = PL.ui.readout(ui.L.readouts, { label: "載流子" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("lewis", {
    build(root) {
      const MOLS = {
        H2O: { name: "水", center: "O", outer: ["H", "H"], lone: 2, total: 8, note: "中心 O 有 2 對孤對電子，鍵角約 104.5°" },
        CO2: { name: "二氧化碳", center: "C", outer: ["O", "O"], lone: 4, total: 16, note: "兩個 C=O 雙鍵，無孤對電子在 C 上，直線形" },
        NH3: { name: "氨", center: "N", outer: ["H", "H", "H"], lone: 1, total: 8, note: "N 上 1 對孤對電子，三角錐形" },
        CH4: { name: "甲烷", center: "C", outer: ["H", "H", "H", "H"], lone: 0, total: 8, note: "四個 C—H 單鍵，正四面體" },
        SO2: { name: "二氧化硫", center: "S", outer: ["O", "O"], lone: 1, total: 18, note: "一個雙鍵、一個單鍵，有共振結構" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = molSel.get(), m = MOLS[key];
          CK.panel(ctx, W * 0.08, H * 0.12, W * 0.84, H * 0.48, m.name + " 的路易斯結構");
          const cx = W / 2, cy = H * 0.34, R = Math.min(W, H) * 0.22;
          D.disc(ctx, cx, cy, 22, { fill: CK.elementColor(m.center), stroke: "rgba(0,0,0,0.25)" });
          D.text(ctx, m.center, cx, cy + 5, { color: "#18202b", size: 14, align: "center", weight: "700" });
          const n = m.outer.length;
          for (let i = 0; i < n; i++) {
            const a = -Math.PI / 2 + i / n * PL.TAU;
            const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
            D.line(ctx, cx + Math.cos(a) * 26, cy + Math.sin(a) * 26, x - Math.cos(a) * 20, y - Math.sin(a) * 20, PL.col("text-dim"), 2.4);
            D.disc(ctx, x, y, 18, { fill: CK.elementColor(m.outer[i]), stroke: "rgba(0,0,0,0.25)" });
            D.text(ctx, m.outer[i], x, y + 4, { color: "#18202b", size: 11, align: "center", weight: "700" });
            // 外側孤對
            for (let k = 0; k < 2; k++) {
              const aa = a + (k ? 0.45 : -0.45);
              D.disc(ctx, x + Math.cos(aa) * 24, y + Math.sin(aa) * 24, 2.2, { fill: PL.col("accent-2") });
            }
          }
          // 中心孤對
          for (let k = 0; k < m.lone; k++) {
            const a = Math.PI / 2 + (k - (m.lone - 1) / 2) * 0.55;
            D.disc(ctx, cx + Math.cos(a) * 32, cy + Math.sin(a) * 32, 2.6, { fill: PL.col("accent") });
          }
          D.text(ctx, m.note, W / 2, H * 0.66, { color: PL.col("text-dim"), size: 11, align: "center" });
          rTotal.set(m.total); rLone.set(m.lone + " 對"); rOctet.set("中心原子：" + (m.total >= 8 ? "符合八隅體" : "例外"));
        }
      });
      const molSel = PL.ui.select(ui.L.controls, { label: "分子", value: "H2O", options: Object.keys(MOLS).map(k => ({ value: k, label: k + "（" + MOLS[k].name + "）" })) });
      PL.ui.note(ui.L.controls, "路易斯結構先算總價電子數，再把電子對分配給鍵結與孤對。注意：總價電子數相同不代表結構相同。");
      const rTotal = PL.ui.readout(ui.L.readouts, { label: "總價電子數" });
      const rLone = PL.ui.readout(ui.L.readouts, { label: "中心孤對" });
      const rOctet = PL.ui.readout(ui.L.readouts, { label: "八隅體" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("vsepr", {
    build(root) {
      const MOLS = {
        CO2: { name: "二氧化碳", shape: "直線形", angle: 180, m: 2, lone: 0, geo: "linear" },
        CH4: { name: "甲烷", shape: "正四面體", angle: 109.5, m: 4, lone: 0, geo: "tetra" },
        NH3: { name: "氨", shape: "三角錐", angle: 107, m: 3, lone: 1, geo: "pyramid" },
        H2O: { name: "水", shape: "彎曲形", angle: 104.5, m: 2, lone: 2, geo: "bent" },
        BF3: { name: "三氟化硼", shape: "平面三角形", angle: 120, m: 3, lone: 0, geo: "trigonal" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.58,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = molSel.get(), m = MOLS[key];
          CK.panel(ctx, W * 0.08, H * 0.12, W * 0.84, H * 0.54, m.name + " 的分子形狀");
          const cx = W / 2, cy = H * 0.36, R = Math.min(W, H) * 0.24;
          const dirs = {
            linear: [[-1, 0], [1, 0]],
            tetra: [[-0.8, 0.8], [0.8, 0.8], [-0.8, -0.8], [0.8, -0.8]],
            pyramid: [[-1, 0.55], [1, 0.55], [0, -1]],
            bent: [[-1, 0.45], [1, 0.45]],
            trigonal: [[-1, 0.55], [1, 0.55], [0, -1]]
          }[m.geo];
          dirs.forEach(d => {
            const x = cx + d[0] * R, y = cy + d[1] * R;
            D.line(ctx, cx, cy, x, y, PL.col("text-dim"), 2.2);
            D.disc(ctx, x, y, 15, { fill: CK.elementColor(key === "H2O" || key === "NH3" ? "H" : key === "CO2" ? "O" : "F"), stroke: "rgba(0,0,0,0.2)" });
            D.text(ctx, key === "CO2" ? "O" : key === "BF3" ? "F" : "H", x, y + 4, { color: "#18202b", size: 10, align: "center", weight: "700" });
          });
          D.disc(ctx, cx, cy, 20, { fill: CK.elementColor(key === "H2O" ? "O" : key === "NH3" ? "N" : key === "CH4" ? "C" : key === "CO2" ? "C" : "B"), stroke: "rgba(0,0,0,0.2)" });
          D.text(ctx, key === "H2O" ? "O" : key === "NH3" ? "N" : key === "CH4" ? "C" : key === "CO2" ? "C" : "B", cx, cy + 5, { color: "#18202b", size: 13, align: "center", weight: "700" });
          for (let k = 0; k < m.lone; k++) {
            const a = Math.PI / 2 + (k - (m.lone - 1) / 2) * 0.7;
            D.disc(ctx, cx + Math.cos(a) * 34, cy + Math.sin(a) * 34, 3, { fill: PL.col("accent") });
          }
          D.text(ctx, "AX" + m.m + (m.lone ? "E" + m.lone : "") + " → " + m.shape, W / 2, H * 0.72, { color: PL.col("accent"), size: 16, align: "center", weight: "700" });
          D.text(ctx, "鍵角約 " + m.angle + "°", W / 2, H * 0.80, { color: PL.col("text-dim"), size: 13, align: "center" });
          rShape.set(m.shape); rAngle.set(m.angle, 1); rAX.set("AX" + m.m + (m.lone ? "E" + m.lone : ""));
        }
      });
      const molSel = PL.ui.select(ui.L.controls, { label: "分子", value: "H2O", options: Object.keys(MOLS).map(k => ({ value: k, label: k + "（" + MOLS[k].name + "）" })) });
      PL.ui.note(ui.L.controls, "先數中心原子的鍵結數 m 與孤對數 n。孤對電子佔空間，會把鍵角壓小：CH₄ 109.5° → NH₃ 107° → H₂O 104.5°。");
      const rShape = PL.ui.readout(ui.L.readouts, { label: "分子形狀" });
      const rAngle = PL.ui.readout(ui.L.readouts, { label: "鍵角", unit: "°" });
      const rAX = PL.ui.readout(ui.L.readouts, { label: "VSEPR 類型" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("polarity", {
    build(root) {
      const MOLS = {
        CO2: { name: "二氧化碳", a: "O", b: "C", diff: 1.0, polar: false, reason: "兩個 C=O 偶極方向相反，互相抵消" },
        H2O: { name: "水", a: "O", b: "H", diff: 1.4, polar: true, reason: "彎曲形，兩個 O—H 偶極不抵消" },
        NH3: { name: "氨", a: "N", b: "H", diff: 0.9, polar: true, reason: "三角錐，鍵偶極與孤對電子共同造成淨偶極" },
        CH4: { name: "甲烷", a: "C", b: "H", diff: 0.4, polar: false, reason: "正四面體高度對稱，偶極抵消" },
        HCl: { name: "氯化氫", a: "H", b: "Cl", diff: 0.9, polar: true, reason: "直線但兩端不同，電負度差造成淨偶極" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = molSel.get(), m = MOLS[key];
          CK.panel(ctx, W * 0.08, H * 0.12, W * 0.84, H * 0.52, m.name + " 的鍵極性");
          const cx = W / 2, cy = H * 0.36, R = Math.min(W, H) * 0.22;
          if (key === "H2O") {
            const pts = [[-1, 0.5], [1, 0.5]];
            pts.forEach(p => {
              const x = cx + p[0] * R, y = cy + p[1] * R;
              D.line(ctx, cx, cy, x, y, PL.col("text-dim"), 2.4);
              D.arrow(ctx, x - p[0] * 20, y - p[1] * 20, x - p[0] * 44, y - p[1] * 44, { color: "#ff8a65", width: 2 });
              D.disc(ctx, x, y, 16, { fill: CK.elementColor("H"), stroke: "rgba(0,0,0,0.2)" });
              D.text(ctx, "H", x, y + 4, { color: "#18202b", size: 11, align: "center", weight: "700" });
            });
            D.disc(ctx, cx, cy, 22, { fill: CK.elementColor("O") }); D.text(ctx, "O", cx, cy + 5, { color: "#fff", size: 13, align: "center", weight: "700" });
            D.arrow(ctx, cx, cy + 30, cx, cy + 62, { color: PL.col("accent"), width: 2.4, label: "淨偶極" });
          } else if (key === "CO2") {
            [[-1, 0], [1, 0]].forEach(p => {
              const x = cx + p[0] * R, y = cy;
              D.line(ctx, cx, cy, x, y, PL.col("text-dim"), 2.4);
              D.arrow(ctx, cx + p[0] * 26, y, cx + p[0] * 56, y, { color: "#ff8a65", width: 2 });
              D.disc(ctx, x, y, 17, { fill: CK.elementColor("O"), stroke: "rgba(0,0,0,0.2)" });
              D.text(ctx, "O", x, y + 4, { color: "#fff", size: 11, align: "center", weight: "700" });
            });
            D.disc(ctx, cx, cy, 22, { fill: CK.elementColor("C") }); D.text(ctx, "C", cx, cy + 5, { color: "#fff", size: 13, align: "center", weight: "700" });
            D.text(ctx, "偶極抵消 → 淨偶極 = 0", cx, cy + 54, { color: PL.col("accent"), size: 12, align: "center" });
          } else if (key === "HCl") {
            D.disc(ctx, cx - R * 0.5, cy, 15, { fill: CK.elementColor("H") }); D.text(ctx, "H", cx - R * 0.5, cy + 4, { color: "#18202b", size: 10, align: "center" });
            D.disc(ctx, cx + R * 0.5, cy, 22, { fill: CK.elementColor("Cl") }); D.text(ctx, "Cl", cx + R * 0.5, cy + 5, { color: "#18202b", size: 11, align: "center" });
            D.line(ctx, cx - R * 0.5 + 15, cy, cx + R * 0.5 - 22, cy, PL.col("text-dim"), 2.4);
            D.arrow(ctx, cx - 5, cy - 26, cx + 55, cy - 26, { color: PL.col("accent"), width: 2.4, label: "淨偶極" });
          } else {
            const n = key === "CH4" ? 4 : 3, isCH4 = key === "CH4";
            for (let i = 0; i < n; i++) {
              const a = -Math.PI / 2 + i / n * PL.TAU + (isCH4 ? Math.PI / 4 : 0);
              const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
              D.line(ctx, cx, cy, x, y, PL.col("text-dim"), 2.2);
              D.disc(ctx, x, y, 14, { fill: CK.elementColor("H") });
              D.text(ctx, "H", x, y + 4, { color: "#18202b", size: 10, align: "center" });
            }
            D.disc(ctx, cx, cy, 22, { fill: CK.elementColor(isCH4 ? "C" : "N") });
            D.text(ctx, isCH4 ? "C" : "N", cx, cy + 5, { color: isCH4 ? "#fff" : "#18202b", size: 13, align: "center", weight: "700" });
            if (!isCH4) D.arrow(ctx, cx, cy + 26, cx, cy + 60, { color: PL.col("accent"), width: 2.2, label: "淨偶極" });
            else D.text(ctx, "對稱排列 → 抵消", cx, cy + 50, { color: PL.col("accent"), size: 11, align: "center" });
          }
          D.text(ctx, m.reason, W / 2, H * 0.72, { color: PL.col("text-dim"), size: 11, align: "center" });
          rEN.set(m.diff, 1); rPolar.set(m.polar ? "極性分子" : "非極性分子");
        }
      });
      const molSel = PL.ui.select(ui.L.controls, { label: "分子", value: "H2O", options: Object.keys(MOLS).map(k => ({ value: k, label: k + "（" + MOLS[k].name + "）" })) });
      PL.ui.note(ui.L.controls, "有極性鍵不代表分子有極性。要看整體的鍵偶極是否抵消：CO₂ 有極性鍵卻是非極性分子，H₂O 則是極性分子。");
      const rEN = PL.ui.readout(ui.L.readouts, { label: "電負度差" });
      const rPolar = PL.ui.readout(ui.L.readouts, { label: "分子極性" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("imf", {
    build(root) {
      const SUBS = {
        CH4: { name: "甲烷", bp: -162, imf: "分散力", polar: false },
        HCl: { name: "氯化氫", bp: -85, imf: "偶極—偶極力", polar: true },
        H2O: { name: "水", bp: 100, imf: "氫鍵", polar: true },
        NH3: { name: "氨", bp: -33, imf: "氫鍵", polar: true },
        CO2: { name: "二氧化碳", bp: -78.5, imf: "分散力", polar: false },
        C6H14: { name: "己烷", bp: 69, imf: "分散力（較強）", polar: false }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = subSel.get(), s = SUBS[key], T = tempS.get();
          CK.panel(ctx, W * 0.08, H * 0.12, W * 0.84, H * 0.44, s.name + " 的分子間作用力");
          /*
           * 分子之間的距離與連線要隨溫度改變。
           *
           * 以前六個分子永遠排在同一個格點、虛線永遠連著，
           * 溫度滑桿只改了一行「液態或固態／氣態」的字——
           * 學生看不到「加熱讓分子掙脫彼此」這件事。
           * 現在：越接近沸點，分子晃動越大、氫鍵／偶極線越淡；
           * 超過沸點，分子散開、連線全部消失，就是氣態。
           */
          const hot = PL.clamp((T - (s.bp - 120)) / 220, 0, 1);
          const gas = T >= s.bp;
          /*
           * 圓圈上要寫完整的化學式。
           * 舊版把數字全部刪掉，H₂O 變成「HO」、C₆H₁₄ 變成「CH」——
           * 那不是水也不是己烷，學生會記錯式子。改成真正的下標數字，
           * 字太長（己烷）時縮一級字。
           */
          const formula = key.replace(/\d/g, d => "₀₁₂₃₄₅₆₇₈₉"[+d]);
          const fSize = formula.length > 4 ? 7 : 8;
          for (let i = 0; i < 6; i++) {
            const jx = Math.sin(i * 2.1) * 26 * hot, jy = Math.cos(i * 1.7) * 18 * hot;
            const x = W * 0.22 + (i % 3) * W * 0.22 + jx;
            const y = H * 0.26 + Math.floor(i / 3) * H * 0.14 + jy - hot * H * 0.03;
            D.disc(ctx, x, y, 16, { fill: CK.elementColor(key[0] === "C" ? "C" : key[0]), stroke: "rgba(0,0,0,0.2)" });
            D.text(ctx, formula, x, y + 3, { color: "#fff", size: fSize, align: "center", weight: "700" });
            if (i < 5 && !gas) {
              D.line(ctx, x + 16, y, x + W * 0.22 + jx - 16, y, s.imf === "氫鍵" ? "#4dd0e1" : PL.col("text-faint"), 1.4, [3, 4]);
            }
          }
          // 分子間距的量尺：越熱越長（留在第一個面板裡，不能壓在邊框上）
          CK.meter(ctx, W * 0.20, H * 0.505, W * 0.60, 7, hot, { color: hot > 0.6 ? "#ff8a65" : "#4dd0e1", label: "分子平均間距" });
          const state = T < s.bp ? "液態或固態" : "氣態";
          CK.panel(ctx, W * 0.08, H * 0.60, W * 0.84, H * 0.28, "溫度與狀態");
          D.text(ctx, "目前 " + T + " °C　沸點 " + s.bp + " °C", W / 2, H * 0.69, { color: PL.col("text-dim"), size: 13, align: "center" });
          // 狀態色要用主題色：淺色主題的亮青 #4dd0e1 放在淡藍面板上幾乎看不見。
          D.text(ctx, state, W / 2, H * 0.78, { color: T < s.bp ? PL.col("accent") : PL.col("warn"), size: 18, align: "center", weight: "700" });
          D.text(ctx, "主要作用力：" + s.imf, W / 2, H * 0.845, { color: PL.col("accent"), size: 12, align: "center" });
          rBp.set(s.bp, 1); rImf.set(s.imf); rState.set(state);
        }
      });
      const subSel = PL.ui.select(ui.L.controls, { label: "物質", value: "H2O", options: Object.keys(SUBS).map(k => ({ value: k, label: SUBS[k].name + "（" + k + "）" })) });
      const tempS = PL.ui.slider(ui.L.controls, { label: "溫度", min: -180, max: 120, step: 5, value: 25, unit: "°C", digits: 0 });
      PL.ui.note(ui.L.controls, "把溫度拉到沸點以上，分子才能脫離彼此。比較甲烷與水：水有氫鍵，沸點高出一大截。");
      const rBp = PL.ui.readout(ui.L.readouts, { label: "沸點", unit: "°C" });
      const rImf = PL.ui.readout(ui.L.readouts, { label: "主要作用力" });
      const rState = PL.ui.readout(ui.L.readouts, { label: "常溫狀態" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("network", {
    build(root) {
      const SOLIDS = {
        diamond: { name: "鑽石", type: "網狀固體", mp: ">3500", hard: "極高", conduct: "不導電", color: "#cfe8ff" },
        graphite: { name: "石墨", type: "網狀固體（層狀）", mp: ">3500", hard: "低（層間滑動）", conduct: "導電（層內）", color: "#6f7883" },
        quartz: { name: "石英", type: "網狀固體", mp: "1710", hard: "高", conduct: "不導電", color: "#c7d6e5" },
        dryice: { name: "乾冰", type: "分子固體", mp: "-78.5", hard: "低", conduct: "不導電", color: "#eef4f9" },
        iodine: { name: "碘", type: "分子固體", mp: "114", hard: "低", conduct: "不導電", color: "#6e3fa3" },
        NaCl: { name: "食鹽", type: "離子晶體", mp: "801", hard: "中", conduct: "固態不導電、熔融導電", color: "#b07cf0" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = solidSel.get(), s = SOLIDS[key];
          CK.panel(ctx, W * 0.08, H * 0.12, W * 0.84, H * 0.42, s.name + " 的結構");
          const cx = W / 2, cy = H * 0.31;
          if (key === "diamond" || key === "quartz") {
            for (let i = 0; i < 14; i++) {
              const a = i / 14 * PL.TAU, r = Math.min(W, H) * (0.10 + (i % 3) * 0.055);
              D.disc(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 5, { fill: s.color, stroke: "rgba(0,0,0,0.2)" });
              if (i > 0) D.line(ctx, cx + Math.cos(a - 0.45) * r * 0.7, cy + Math.sin(a - 0.45) * r * 0.7, cx + Math.cos(a) * r, cy + Math.sin(a) * r, PL.col("text-faint"), 1.2);
            }
          } else if (key === "graphite") {
            for (let row = 0; row < 3; row++) {
              for (let c = 0; c < 7; c++) {
                const x = cx - W * 0.18 + c * W * 0.06 + (row % 2) * W * 0.03, y = cy - H * 0.09 + row * H * 0.09;
                D.disc(ctx, x, y, 5, { fill: s.color, stroke: "rgba(0,0,0,0.2)" });
                if (c < 6) D.line(ctx, x + 5, y, x + W * 0.06 - 5, y, PL.col("text-faint"), 1.2);
              }
            }
          } else {
            for (let i = 0; i < 16; i++) {
              const x = cx - W * 0.18 + (i % 4) * W * 0.12, y = cy - H * 0.10 + Math.floor(i / 4) * H * 0.08;
              D.disc(ctx, x, y, 10, { fill: key === "NaCl" ? (i % 2 ? "#7aa5d9" : s.color) : s.color, stroke: "rgba(0,0,0,0.2)" });
            }
          }
          CK.panel(ctx, W * 0.08, H * 0.58, W * 0.84, H * 0.28, "性質比較");
          D.text(ctx, "類型：" + s.type, W * 0.28, H * 0.67, { color: PL.col("text-dim"), size: 12 });
          D.text(ctx, "熔點：" + s.mp + " °C", W * 0.72, H * 0.67, { color: PL.col("text-dim"), size: 12, align: "right" });
          D.text(ctx, "硬度：" + s.hard, W * 0.28, H * 0.75, { color: PL.col("text-dim"), size: 12 });
          D.text(ctx, "導電：" + s.conduct, W * 0.72, H * 0.75, { color: PL.col("text-dim"), size: 12, align: "right" });
          rType.set(s.type); rMp.set(s.mp); rHard.set(s.hard); rConduct.set(s.conduct);
        }
      });
      const solidSel = PL.ui.select(ui.L.controls, { label: "固體", value: "diamond", options: Object.keys(SOLIDS).map(k => ({ value: k, label: SOLIDS[k].name })) });
      PL.ui.note(ui.L.controls, "網狀固體的共價鍵延伸到整個晶體，所以熔點極高；分子固體只有分子內是共價鍵，分子間靠微弱作用力，熔點低。");
      const rType = PL.ui.readout(ui.L.readouts, { label: "晶體類型" });
      const rMp = PL.ui.readout(ui.L.readouts, { label: "熔點", unit: "°C" });
      const rHard = PL.ui.readout(ui.L.readouts, { label: "硬度" });
      const rConduct = PL.ui.readout(ui.L.readouts, { label: "導電性" });
      return { stop() { ui.stop(); } };
    }
  });
})();
