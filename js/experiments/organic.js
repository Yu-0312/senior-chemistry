/* 模組九 · 有機化合物 */
(function () {
  "use strict";
  const PL = window.PhysicsLab, CK = window.ChemLab, D = PL.draw;

  /* 依系列與碳數產生碳骨架座標（省略 C–H 的骨架式）。 */
  function skeleton(series, n) {
    const atoms = [], bonds = [];
    for (let i = 0; i < n; i++) {
      atoms.push({ el: "C", x: (i - (n - 1) / 2) * 0.78, y: (i % 2 ? -0.26 : 0.26), r: 0.30 });
      if (i) bonds.push([i - 1, i, i === 1 ? (series === "alkene" ? 2 : series === "alkyne" ? 3 : 1) : 1]);
    }
    return { atoms, bonds };
  }

  const BP = {
    alkane: [-161.5, -88.6, -42.1, -0.5, 36.1, 68.7],
    alkene: [null, -103.7, -47.6, -6.3, 30.0, 63.5],
    alkyne: [null, -84.0, -23.2, 8.1, 40.2, 71.3]
  };

  PL.register("hydrocarbons", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const series = seriesSel.get(), nRaw = nS.get(), n = Math.max(series === "alkane" ? 1 : 2, nRaw);
          const ok = series === "alkane" || nRaw >= 2;
          const sk = skeleton(series, n);
          CK.panel(ctx, W * 0.07, H * 0.09, W * 0.86, H * 0.44, "碳骨架（省略 C–H）");
          if (ok) {
            CK.molecule(ctx, W / 2, H * 0.30, sk.atoms, sk.bonds, Math.min(78, W * 0.14), 0);
            const f = series === "alkane" ? "C" + n + "H" + (2 * n + 2)
              : series === "alkene" ? "C" + n + "H" + (2 * n)
                : "C" + n + "H" + (2 * n - 2);
            D.text(ctx, f, W / 2, H * 0.47, { color: PL.col("accent"), size: 20, align: "center", weight: "700" });
          } else {
            D.text(ctx, "碳數 " + nRaw + " 無法形成雙鍵／三鍵", W / 2, H * 0.32, { color: "#ff8a65", size: 14, align: "center" });
          }          CK.panel(ctx, W * 0.07, H * 0.58, W * 0.86, H * 0.28, "系列比較");
          const info = series === "alkane" ? ["烷類 CnH₂ₙ₊₂", "全部單鍵，飽和烴", "安定、不易加成"]
            : series === "alkene" ? ["烯類 CnH₂ₙ", "含一個 C=C 雙鍵", "可進行加成反應"]
              : ["炔類 CnH₂ₙ₋₂", "含一個 C≡C 三鍵", "活性大，可加成"];
          D.text(ctx, info[0], W * 0.32, H * 0.68, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, info[1], W * 0.32, H * 0.76, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, info[2], W * 0.32, H * 0.84, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, "沸點", W * 0.68, H * 0.66, { color: PL.col("text-faint"), size: 10, align: "center" });
          const bp = ok ? BP[series][n - 1] : null;
          D.text(ctx, bp == null ? "—" : bp + " °C", W * 0.68, H * 0.76, { color: PL.col("accent"), size: 22, align: "center", weight: "700" });
          D.text(ctx, "碳數增加，分子間力增大", W * 0.68, H * 0.85, { color: PL.col("text-faint"), size: 9, align: "center" });
          rFormula.set(ok ? (series === "alkane" ? "C" + n + "H" + (2 * n + 2) : series === "alkene" ? "C" + n + "H" + (2 * n) : "C" + n + "H" + (2 * n - 2)) : "—");
          rBp.set(bp == null ? "—" : bp, bp == null ? 0 : 1);
          rBonds.set(series === "alkane" ? "單鍵" : series === "alkene" ? "1 個雙鍵" : "1 個三鍵");
          rSeries.set(series === "alkane" ? "烷類（同系物差 CH₂）" : series === "alkene" ? "烯類（同系物差 CH₂）" : "炔類（同系物差 CH₂）");
        }
      });
      const seriesSel = PL.ui.select(ui.L.controls, { label: "系列", value: "alkane", options: [{ value: "alkane", label: "烷類 CnH₂ₙ₊₂" }, { value: "alkene", label: "烯類 CnH₂ₙ" }, { value: "alkyne", label: "炔類 CnH₂ₙ₋₂" }] });
      const nS = PL.ui.slider(ui.L.controls, { label: "碳數 n", min: 1, max: 6, step: 1, value: 4, digits: 0 });
      PL.ui.note(ui.L.controls, "把碳數往上拉，注意沸點如何上升；切到烯或炔，骨架中間會多出雙鍵或三鍵。");
      const rFormula = PL.ui.readout(ui.L.readouts, { label: "分子式" });
      const rBp = PL.ui.readout(ui.L.readouts, { label: "沸點", unit: "°C" });
      const rBonds = PL.ui.readout(ui.L.readouts, { label: "不飽和鍵" });
      const rSeries = PL.ui.readout(ui.L.readouts, { label: "同系物" });
      return { stop() { ui.stop(); } };
    }
  });

  const ISOMERS = {
    C4H10: [
      { name: "正丁烷", bp: -0.5, atoms: [[-1.17, 0.26], [-0.39, -0.26], [0.39, 0.26], [1.17, -0.26]], bonds: [[0, 1], [1, 2], [2, 3]] },
      { name: "異丁烷（2-甲基丙烷）", bp: -11.7, atoms: [[-0.8, 0.22], [0, -0.10], [0.8, 0.22], [0, -0.85]], bonds: [[0, 1], [1, 2], [1, 3]] }
    ],
    C5H12: [
      { name: "正戊烷", bp: 36.1, atoms: [[-1.56, 0.26], [-0.78, -0.26], [0, 0.26], [0.78, -0.26], [1.56, 0.26]], bonds: [[0, 1], [1, 2], [2, 3], [3, 4]] },
      { name: "異戊烷（2-甲基丁烷）", bp: 27.8, atoms: [[-1.0, 0.22], [-0.2, -0.14], [0.6, 0.22], [1.4, -0.14], [-0.2, -0.88]], bonds: [[0, 1], [1, 2], [2, 3], [1, 4]] },
      { name: "新戊烷（2,2-二甲基丙烷）", bp: 9.5, atoms: [[0, 0.35], [-0.85, -0.2], [0.85, -0.2], [0, -0.85]], bonds: [[0, 1], [0, 2], [0, 3]] }
    ],
    C6H14: [
      { name: "正己烷", bp: 68.7, atoms: [[-1.95, 0.26], [-1.17, -0.26], [-0.39, 0.26], [0.39, -0.26], [1.17, 0.26], [1.95, -0.26]], bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] },
      { name: "2-甲基戊烷", bp: 60.3, atoms: [[-1.3, 0.22], [-0.5, -0.14], [0.3, 0.22], [1.1, -0.14], [1.9, 0.22], [-0.5, -0.88]], bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5]] },
      { name: "3-甲基戊烷", bp: 63.3, atoms: [[-1.3, 0.22], [-0.5, -0.14], [0.3, 0.22], [1.1, -0.14], [1.9, 0.22], [0.3, -0.75]], bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]] },
      { name: "2,2-二甲基丁烷", bp: 49.7, atoms: [[-0.9, 0.2], [-0.1, -0.16], [0.7, 0.2], [1.5, -0.16], [-0.1, -0.9], [-0.7, -0.6]], bonds: [[0, 1], [1, 2], [2, 3], [1, 4], [1, 5]] }
    ]
  };

  PL.register("isomers", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const formula = formulaSel.get(), group = ISOMERS[formula];
          const idx = Math.min(group.length - 1, Math.max(0, +isoSel.get() || 0));
          const iso = group[idx];
          const atoms = iso.atoms.map(a => ({ el: "C", x: a[0], y: a[1], r: 0.30 }));
          CK.panel(ctx, W * 0.07, H * 0.09, W * 0.86, H * 0.48, formula + " 的結構異構物");
          CK.molecule(ctx, W / 2, H * 0.30, atoms, iso.bonds, Math.min(60, W * 0.11), 0);
          D.text(ctx, iso.name, W / 2, H * 0.47, { color: PL.col("accent"), size: 15, align: "center", weight: "700" });
          CK.panel(ctx, W * 0.07, H * 0.62, W * 0.86, H * 0.26, "異構物比較");
          group.forEach((g, i) => {
            const y = H * 0.71 + i * H * 0.055;
            D.text(ctx, g.name, W * 0.10, y, { color: i === idx ? PL.col("accent") : PL.col("text-dim"), size: 9 });
            D.text(ctx, g.bp + " °C", W * 0.90, y, { color: i === idx ? PL.col("accent") : PL.col("text-faint"), size: 9, align: "right" });
          });
          rCount.set(group.length, 0); rBp.set(iso.bp, 1); rName.set(iso.name);
          rBranch.set(group.length === 1 ? "直鏈" : iso.name.indexOf("甲基") >= 0 ? "有支鏈" : "直鏈");
        }
      });
      const formulaSel = PL.ui.select(ui.L.controls, { label: "分子式", value: "C4H10", options: Object.keys(ISOMERS).map(k => ({ value: k, label: k })) });
      const isoSel = PL.ui.select(ui.L.controls, { label: "異構物", value: "0", options: ISOMERS.C4H10.map((g, i) => ({ value: i, label: g.name })) });
      formulaSel.el.addEventListener("change", () => {
        const group = ISOMERS[formulaSel.get()];
        isoSel.el.innerHTML = "";
        group.forEach((g, i) => { const o = document.createElement("option"); o.value = String(i); o.textContent = g.name; isoSel.el.appendChild(o); });
        ui.redraw();
      });
      PL.ui.note(ui.L.controls, "同一個分子式可以排出不同的連接方式。支鏈越多，分子越接近球形、接觸面積越小，沸點通常越低。");
      const rCount = PL.ui.readout(ui.L.readouts, { label: "異構物數目" });
      const rBp = PL.ui.readout(ui.L.readouts, { label: "沸點", unit: "°C" });
      const rName = PL.ui.readout(ui.L.readouts, { label: "選定結構" });
      const rBranch = PL.ui.readout(ui.L.readouts, { label: "鏈狀" });
      return { stop() { ui.stop(); } };
    }
  });

  const GROUPS = {
    ethanol: {
      name: "乙醇", group: "羥基 −OH", cls: "醇", bp: 78.4, prop: "可形成氫鍵，與水互溶",
      atoms: [{ el: "C", x: -0.85, y: 0.1, r: 0.3 }, { el: "C", x: 0, y: -0.15, r: 0.3 }, { el: "O", x: 0.75, y: 0.18, r: 0.34 }, { el: "H", x: 1.1, y: 0.55, r: 0.2 }],
      bonds: [[0, 1], [1, 2], [2, 3]], hi: [2, 3]
    },
    aldehyde: {
      name: "乙醛", group: "醛基 −CHO", cls: "醛", bp: 20.2, prop: "可被氧化成羧酸",
      atoms: [{ el: "C", x: -0.8, y: 0.1, r: 0.3 }, { el: "C", x: 0, y: 0.1, r: 0.3 }, { el: "O", x: 0.55, y: -0.45, r: 0.34 }],
      bonds: [[0, 1], [1, 2, 2]], hi: [1, 2]
    },
    ketone: {
      name: "丙酮", group: "羰基 −CO−", cls: "酮", bp: 56.1, prop: "常見溶劑，不易被氧化",
      atoms: [{ el: "C", x: -0.95, y: 0.1, r: 0.3 }, { el: "C", x: 0, y: 0.1, r: 0.3 }, { el: "C", x: 0.95, y: 0.1, r: 0.3 }, { el: "O", x: 0, y: -0.55, r: 0.34 }],
      bonds: [[0, 1], [1, 2], [1, 3, 2]], hi: [1, 3]
    },
    acid: {
      name: "乙酸", group: "羧基 −COOH", cls: "羧酸", bp: 118.1, prop: "弱酸，與醇生成酯",
      atoms: [{ el: "C", x: -0.9, y: 0.1, r: 0.3 }, { el: "C", x: 0, y: 0.1, r: 0.3 }, { el: "O", x: 0.5, y: -0.5, r: 0.34 }, { el: "O", x: 0.75, y: 0.35, r: 0.34 }, { el: "H", x: 1.12, y: 0.15, r: 0.2 }],
      bonds: [[0, 1], [1, 2, 2], [1, 3], [3, 4]], hi: [1, 2, 3, 4]
    },
    ester: {
      name: "乙酸乙酯", group: "酯基 −COO−", cls: "酯", bp: 77.1, prop: "有水果香味，難溶於水",
      atoms: [{ el: "C", x: -1.5, y: 0.12, r: 0.3 }, { el: "C", x: -0.7, y: 0.12, r: 0.3 }, { el: "O", x: -0.15, y: -0.48, r: 0.34 }, { el: "O", x: 0, y: 0.4, r: 0.34 }, { el: "C", x: 0.75, y: 0.12, r: 0.3 }, { el: "C", x: 1.5, y: 0.4, r: 0.3 }],
      bonds: [[0, 1], [1, 2, 2], [1, 3], [3, 4], [4, 5]], hi: [1, 2, 3]
    },
    amine: {
      name: "甲胺", group: "胺基 −NH₂", cls: "胺", bp: -6.3, prop: "鹼性，可與酸成鹽",
      atoms: [{ el: "C", x: -0.5, y: 0.1, r: 0.3 }, { el: "N", x: 0.35, y: -0.05, r: 0.34 }],
      bonds: [[0, 1]], hi: [1]
    },
    ether: {
      name: "二甲醚", group: "醚基 −O−", cls: "醚", bp: -24.8, prop: "無氫鍵，沸點低，易揮發",
      atoms: [{ el: "C", x: -0.9, y: 0.12, r: 0.3 }, { el: "O", x: 0, y: -0.05, r: 0.34 }, { el: "C", x: 0.9, y: 0.12, r: 0.3 }],
      bonds: [[0, 1], [1, 2]], hi: [1]
    }
  };

  PL.register("functional-groups", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = groupSel.get(), g = GROUPS[key];
          CK.panel(ctx, W * 0.07, H * 0.09, W * 0.86, H * 0.50, g.name + "（" + g.cls + "）");
          const P = CK.molecule(ctx, W / 2, H * 0.28, g.atoms, g.bonds, Math.min(68, W * 0.13), 0);
          const hx = g.hi.map(i => P[i]);
          const minX = Math.min.apply(null, hx.map(p => p.x)), maxX = Math.max.apply(null, hx.map(p => p.x));
          const minY = Math.min.apply(null, hx.map(p => p.y)), maxY = Math.max.apply(null, hx.map(p => p.y));
          ctx.save(); ctx.setLineDash([5, 4]);
          D.rect(ctx, minX - 18, minY - 16, Math.max(30, maxX - minX + 36), maxY - minY + 32, { stroke: PL.col("accent"), width: 1.6, r: 10 });
          ctx.restore();
          D.text(ctx, g.group, W / 2, H * 0.48, { color: PL.col("accent"), size: 16, align: "center", weight: "700" });
          CK.panel(ctx, W * 0.07, H * 0.64, W * 0.86, H * 0.24, "性質");
          D.text(ctx, g.prop, W / 2, H * 0.73, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "沸點 " + g.bp + " °C", W / 2, H * 0.81, { color: PL.col("text-faint"), size: 11, align: "center" });
          rGroup.set(g.group); rClass.set(g.cls); rBp.set(g.bp, 1); rProp.set(g.prop);
        }
      });
      const groupSel = PL.ui.select(ui.L.controls, { label: "化合物", value: "ethanol", options: Object.keys(GROUPS).map(k => ({ value: k, label: GROUPS[k].name + "（" + GROUPS[k].cls + "）" })) });
      PL.ui.note(ui.L.controls, "官能基是有機分子的「性格」。同樣是 C₂，乙醇是醇、二甲醚是醚，沸點相差超過 100°C。");
      const rGroup = PL.ui.readout(ui.L.readouts, { label: "官能基" });
      const rClass = PL.ui.readout(ui.L.readouts, { label: "類別" });
      const rBp = PL.ui.readout(ui.L.readouts, { label: "沸點", unit: "°C" });
      const rProp = PL.ui.readout(ui.L.readouts, { label: "特性" });
      return { stop() { ui.stop(); } };
    }
  });

  const ALCOHOLS = {
    primary: {
      name: "乙醇（一級醇）", bp: 78.4, steps: ["乙醇", "乙醛", "乙酸"],
      note: "一級醇先氧化成醛，再氧化成羧酸", color: "#81c784"
    },
    secondary: {
      name: "丙-2-醇（二級醇）", bp: 82.6, steps: ["丙-2-醇", "丙酮", "不再氧化"],
      note: "二級醇氧化成酮，酮不易再氧化", color: "#64b5f6"
    },
    tertiary: {
      name: "2-甲基丙-2-醇（三級醇）", bp: 82.3, steps: ["三級醇", "不易氧化", "—"],
      note: "三級醇沒有 α-氫，常溫下不易氧化", color: "#ff8a65"
    }
  };

  PL.register("alcohol", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const a = ALCOHOLS[typeSel.get()], step = Math.min(2, oxS.get());
          /*
           * 氧化到哪一步，產物上的氧原子就畫出幾個。
           *
           * 以前滑桿只換了節點顏色與一行字；改成在產物旁邊長出氧原子後，
           * 「醇 → 醛 → 羧酸」的氧原子數變化就是看得見的證據。
           * 三級醇沒有 α-氫，氧化推不動：節點不亮，箭頭上畫叉。
           */
          const oxidizable = typeSel.get() !== "tertiary";
          const reach = !oxidizable ? 0 : typeSel.get() === "secondary" ? Math.min(1, step) : step;
          const oCount = typeSel.get() === "primary" ? reach : typeSel.get() === "secondary" ? Math.min(1, reach) : 0;
          CK.panel(ctx, W * 0.07, H * 0.09, W * 0.86, H * 0.72, a.name);
          const by = H * 0.30;
          ["醇", "氧化", "產物"].forEach((label, i) => {
            const x = W * (0.20 + i * 0.30);
            D.disc(ctx, x, by, 34, { fill: i <= reach ? a.color : PL.theme.shade(0.6), stroke: PL.col("border") });
            D.text(ctx, String(i + 1), x, by + 5, { color: i <= reach ? "#12202a" : PL.col("text-faint"), size: 16, align: "center", weight: "700" });
            D.text(ctx, label, x, by + 52, { color: i <= reach ? PL.col("text-dim") : PL.col("text-faint"), size: 10, align: "center" });
          });
          for (let k = 0; k < oCount; k++) {
            const ang = -Math.PI / 2 + (k - (oCount - 1) / 2) * 0.9;
            const ox = W * 0.80 + Math.cos(ang) * 46, oy = by + Math.sin(ang) * 46;
            D.disc(ctx, ox, oy, 8, { fill: "#e57373" });
            D.text(ctx, "O", ox, oy + 3, { color: "#fff", size: 8, align: "center", weight: "700" });
          }
          D.line(ctx, W * 0.26, by, W * 0.44, by, reach >= 1 ? a.color : PL.col("border"), 2);
          D.line(ctx, W * 0.56, by, W * 0.74, by, reach >= 2 ? a.color : PL.col("border"), 2);
          if (!oxidizable && step > 0) {
            D.line(ctx, W * 0.30, by - 12, W * 0.40, by + 12, "#ff5252", 2.4);
          }
          D.text(ctx, a.steps[0], W * 0.20, by + 78, { color: PL.col("accent"), size: 14, align: "center", weight: "700" });
          D.text(ctx, "→", W * 0.35, by + 78, { color: PL.col("text-faint"), size: 13, align: "center" });
          D.text(ctx, a.steps[1], W * 0.50, by + 78, { color: step >= 1 ? PL.col("accent") : PL.col("text-faint"), size: 14, align: "center", weight: step >= 1 ? "700" : "400" });
          D.text(ctx, "→", W * 0.65, by + 78, { color: PL.col("text-faint"), size: 13, align: "center" });
          D.text(ctx, a.steps[2], W * 0.80, by + 78, { color: step >= 2 ? PL.col("accent") : PL.col("text-faint"), size: 14, align: "center", weight: step >= 2 ? "700" : "400" });
          D.text(ctx, a.note, W / 2, H * 0.62, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "[O] 代表氧化劑（如重鉻酸鉀酸性溶液）", W / 2, H * 0.72, { color: PL.col("text-faint"), size: 10, align: "center" });
          rType.set(typeSel.get() === "primary" ? "一級醇" : typeSel.get() === "secondary" ? "二級醇" : "三級醇");
          rProduct.set(a.steps[step]);
          rBp.set(a.bp, 1);
          rHbond.set("可形成氫鍵，沸點高於同碳數烷類");
        }
      });
      const typeSel = PL.ui.select(ui.L.controls, { label: "醇的種類", value: "primary", options: [{ value: "primary", label: "一級醇（乙醇）" }, { value: "secondary", label: "二級醇（丙-2-醇）" }, { value: "tertiary", label: "三級醇（2-甲基丙-2-醇）" }] });
      const oxS = PL.ui.slider(ui.L.controls, { label: "氧化程度", min: 0, max: 2, step: 1, value: 0, digits: 0 });
      PL.ui.note(ui.L.controls, "把氧化程度往上推：一級醇會一路變成羧酸，二級醇停在酮，三級醇則幾乎不反應。");
      const rType = PL.ui.readout(ui.L.readouts, { label: "醇的級數" });
      const rProduct = PL.ui.readout(ui.L.readouts, { label: "目前產物" });
      const rBp = PL.ui.readout(ui.L.readouts, { label: "沸點", unit: "°C" });
      const rHbond = PL.ui.readout(ui.L.readouts, { label: "分子間力" });
      return { stop() { ui.stop(); } };
    }
  });

  const ACIDS = {
    formic: { name: "甲酸", Ka: 1.8e-4, color: "#a5d6a7" },
    acetic: { name: "乙酸", Ka: 1.8e-5, color: "#81c784" },
    propionic: { name: "丙酸", Ka: 1.3e-5, color: "#66bb6a" },
    butyric: { name: "丁酸", Ka: 1.5e-5, color: "#4caf50" }
  };

  PL.register("carboxylic", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const a = ACIDS[acidSel.get()], c = concS.get();
          const Hp = Math.sqrt(a.Ka * c), pH = -Math.log10(Hp);
          CK.panel(ctx, W * 0.07, H * 0.09, W * 0.86, H * 0.42, a.name + " 的解離");
          D.text(ctx, "RCOOH ⇌ RCOO⁻ + H⁺", W / 2, H * 0.22, { color: PL.col("text-dim"), size: 15, align: "center" });
          const barW = W * 0.70, bx = W * 0.15;
          D.rect(ctx, bx, H * 0.32, barW, 14, { fill: PL.theme.shade(0.55), stroke: PL.col("border"), width: 1, r: 7 });
          D.rect(ctx, bx, H * 0.32, barW * PL.clamp((pH - 1) / 6, 0, 1), 14, { fill: CK.phColor(pH), r: 7 });
          D.text(ctx, "pH = " + pH.toFixed(2), W / 2, H * 0.45, { color: PL.col("accent"), size: 20, align: "center", weight: "700" });
          CK.panel(ctx, W * 0.07, H * 0.56, W * 0.86, H * 0.32, "羧酸的兩個招牌反應");
          D.text(ctx, "1. 與鹼中和：RCOOH + NaOH → RCOONa + H₂O", W / 2, H * 0.65, { color: PL.col("text-dim"), size: 10, align: "center" });
          D.text(ctx, "2. 與醇酯化：RCOOH + R'OH ⇌ RCOOR' + H₂O", W / 2, H * 0.72, { color: PL.col("text-dim"), size: 10, align: "center" });
          D.text(ctx, a.Ka < 2e-5 ? "酸性較弱，pH 較高" : "酸性較強，pH 較低", W / 2, H * 0.83, { color: PL.col("text-faint"), size: 10, align: "center" });
          rKa.set(a.Ka.toExponential(1)); rPH.set(pH, 2); rH.set(Hp * 1000, 3);
          rStrength.set(a.Ka > 5e-5 ? "較強（在羧酸中）" : "弱酸");
        }
      });
      const acidSel = PL.ui.select(ui.L.controls, { label: "羧酸", value: "acetic", options: Object.keys(ACIDS).map(k => ({ value: k, label: ACIDS[k].name })) });
      const concS = PL.ui.slider(ui.L.controls, { label: "濃度", min: 0.01, max: 1, step: 0.01, value: 0.1, unit: "M", digits: 2 });
      PL.ui.note(ui.L.controls, "羧酸是弱酸，只部分解離。把濃度稀釋十倍，pH 大約上升 0.5，而不是 1，因為稀釋會促使更多分子解離。");
      const rKa = PL.ui.readout(ui.L.readouts, { label: "Ka" });
      const rPH = PL.ui.readout(ui.L.readouts, { label: "pH" });
      const rH = PL.ui.readout(ui.L.readouts, { label: "[H⁺]", unit: "mM" });
      const rStrength = PL.ui.readout(ui.L.readouts, { label: "酸性強弱" });
      return { stop() { ui.stop(); } };
    }
  });

  const ESTERS = {
    "formic+methanol": { name: "甲酸甲酯", smell: "醚香", },
    "formic+ethanol": { name: "甲酸乙酯", smell: "果香" },
    "acetic+methanol": { name: "乙酸甲酯", smell: "甜香" },
    "acetic+ethanol": { name: "乙酸乙酯", smell: "水果香" },
    "acetic+propanol": { name: "乙酸丙酯", smell: "梨香" },
    "benzoic+methanol": { name: "苯甲酸甲酯", smell: "花香" },
    "benzoic+ethanol": { name: "苯甲酸乙酯", smell: "果香" }
  };

  PL.register("ester", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = acidSel.get() + "+" + alcoSel.get(), e = ESTERS[key];
          const x = PL.clamp(solveEster(concS.get()), 0, 0.999);
          const yieldPct = x / concS.get() * 100;
          CK.panel(ctx, W * 0.07, H * 0.09, W * 0.86, H * 0.42, "酯化反應");
          D.text(ctx, "RCOOH + R'OH ⇌ RCOOR' + H₂O", W / 2, H * 0.20, { color: PL.col("text-dim"), size: 14, align: "center" });
          D.text(ctx, "濃硫酸催化、加熱", W / 2, H * 0.28, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, e.name, W / 2, H * 0.39, { color: PL.col("accent"), size: 24, align: "center", weight: "700" });
          D.text(ctx, "氣味：" + e.smell, W / 2, H * 0.47, { color: PL.col("text-dim"), size: 12, align: "center" });
          CK.panel(ctx, W * 0.07, H * 0.56, W * 0.86, H * 0.32, "平衡與操作");
          D.text(ctx, "轉化率 " + yieldPct.toFixed(1) + "%", W / 2, H * 0.645, { color: PL.col("accent"), size: 16, align: "center", weight: "700" });
          /*
           * 轉化率是一條會伸縮的長條。
           * 酯化是可逆反應，濃度提高時平衡也跟著移動；只有數字改變的話，
           * 學生感受不到「多放一些反應物，酯也變多了」。
           */
          CK.meter(ctx, W * 0.30, H * 0.678, W * 0.40, 8, yieldPct / 100, { color: "#7e57c2" });
          D.text(ctx, "移除生成的水，可讓平衡再往右", W / 2, H * 0.745, { color: PL.col("text-dim"), size: 10, align: "center" });
          D.text(ctx, "皂化：酯 + NaOH → 羧酸鈉 + 醇", W / 2, H * 0.815, { color: PL.col("text-faint"), size: 10, align: "center" });
          rName.set(e.name); rSmell.set(e.smell); rYield.set(yieldPct, 1); rX.set(x, 2);
        }
      });
      const acidSel = PL.ui.select(ui.L.controls, { label: "羧酸", value: "acetic", options: [{ value: "formic", label: "甲酸" }, { value: "acetic", label: "乙酸" }, { value: "benzoic", label: "苯甲酸" }] });
      const alcoSel = PL.ui.select(ui.L.controls, { label: "醇", value: "ethanol", options: [{ value: "methanol", label: "甲醇" }, { value: "ethanol", label: "乙醇" }, { value: "propanol", label: "丙醇" }] });
      const concS = PL.ui.slider(ui.L.controls, { label: "初始濃度（1:1）", min: 0.2, max: 2, step: 0.1, value: 1, unit: "M", digits: 1 });
      PL.ui.note(ui.L.controls, "酯化是可逆反應。濃硫酸既是催化劑也是吸水劑；把水移除，平衡就往酯的方向移動。");
      const rName = PL.ui.readout(ui.L.readouts, { label: "酯的名稱" });
      const rSmell = PL.ui.readout(ui.L.readouts, { label: "氣味" });
      const rYield = PL.ui.readout(ui.L.readouts, { label: "酯化轉化率", unit: "%" });
      const rX = PL.ui.readout(ui.L.readouts, { label: "生成量", unit: "M" });
      return { stop() { ui.stop(); } };
    }
  });

  function solveEster(c) {
    // K ≈ 4：x²/((c−x)²) = 4 → x/(c−x) = 2
    return c * 2 / 3;
  }

  const POLYMERS = {
    PE: { name: "聚乙烯 PE", monomer: "CH₂=CH₂", type: "加成聚合", code: "2 HDPE / 4 LDPE", prop: "柔韌、耐化學品，常見於購物袋與瓶罐", color: "#90a4ae", unit: 2 },
    PP: { name: "聚丙烯 PP", monomer: "CH₂=CH−CH₃", type: "加成聚合", code: "5", prop: "耐熱、可微波，常見於餐盒與瓶蓋", color: "#b0bec5", unit: 3 },
    PVC: { name: "聚氯乙烯 PVC", monomer: "CH₂=CHCl", type: "加成聚合", code: "3", prop: "硬質管材與電線絕緣，燃燒產生 HCl", color: "#a1887f", unit: 3 },
    PS: { name: "聚苯乙烯 PS", monomer: "C₆H₅CH=CH₂", type: "加成聚合", code: "6", prop: "透明硬脆，發泡後是保麗龍", color: "#ce93d8", unit: 3 },
    PET: { name: "聚對苯二甲酸乙二酯 PET", monomer: "乙二醇 + 對苯二甲酸", type: "縮合聚合", code: "1", prop: "寶特瓶與聚酯纖維，可回收再製", color: "#4dd0e1", unit: 3 },
    nylon: { name: "耐綸（尼龍）", monomer: "己二胺 + 己二酸", type: "縮合聚合", code: "7", prop: "強韌耐磨，用於衣物與齒輪", color: "#7986cb", unit: 3 }
  };

  PL.register("polymer", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const p = POLYMERS[typeSel.get()], n = chainS.get();
          CK.panel(ctx, W * 0.07, H * 0.09, W * 0.86, H * 0.50, p.name);
          D.text(ctx, "單體：" + p.monomer, W / 2, H * 0.20, { color: PL.col("text-dim"), size: 12, align: "center" });
          const x0 = W * 0.12, x1 = W * 0.88, y = H * 0.32;
          D.line(ctx, x0, y, x1, y, PL.col("border"), 3);
          const step = (x1 - x0) / (n + 1);
          for (let i = 1; i <= n; i++) {
            D.disc(ctx, x0 + i * step, y, 7, { fill: p.color, stroke: "rgba(0,0,0,0.2)" });
            if (i < n) D.line(ctx, x0 + i * step, y, x0 + (i + 1) * step, y, PL.col("text-dim"), 1.6);
          }
          D.text(ctx, "重複單元 × n", W / 2, H * 0.44, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, p.type, W / 2, H * 0.52, { color: PL.col("accent"), size: 14, align: "center", weight: "700" });
          CK.panel(ctx, W * 0.07, H * 0.64, W * 0.86, H * 0.24, "性質與用途");
          D.text(ctx, p.prop, W / 2, H * 0.73, { color: PL.col("text-dim"), size: 10, align: "center" });
          D.text(ctx, "回收分類碼 " + p.code, W / 2, H * 0.81, { color: PL.col("text-faint"), size: 10, align: "center" });
          rMonomer.set(p.monomer); rPtype.set(p.type); rProp.set(p.prop); rCode.set(p.code);
        }
      });
      const typeSel = PL.ui.select(ui.L.controls, { label: "聚合物", value: "PE", options: Object.keys(POLYMERS).map(k => ({ value: k, label: POLYMERS[k].name })) });
      const chainS = PL.ui.slider(ui.L.controls, { label: "重複單元數 n", min: 3, max: 16, step: 1, value: 8, digits: 0 });
      PL.ui.note(ui.L.controls, "加成聚合打開雙鍵、單體直接相連；縮合聚合每接一次就脫去一個小分子（通常是水）。");
      const rMonomer = PL.ui.readout(ui.L.readouts, { label: "單體" });
      const rPtype = PL.ui.readout(ui.L.readouts, { label: "聚合方式" });
      const rProp = PL.ui.readout(ui.L.readouts, { label: "性質" });
      const rCode = PL.ui.readout(ui.L.readouts, { label: "回收碼" });
      return { stop() { ui.stop(); } };
    }
  });

  const BIO = {
    carb: {
      name: "醣類", unit: "單醣（葡萄糖）", bond: "醣苷鍵", result: "多醣（澱粉、纖維素）",
      note: "葡萄糖脫水縮合成澱粉或纖維素；水解則回到單醣。", color: "#ffb74d", count: 6
    },
    protein: {
      name: "蛋白質", unit: "胺基酸", bond: "胜肽鍵", result: "多肽 → 蛋白質",
      note: "胺基酸的羧基與胺基脫水形成胜肽鍵；水解斷開胜肽鍵。", color: "#4db6ac", count: 5
    },
    lipid: {
      name: "油脂", unit: "甘油 + 脂肪酸", bond: "酯鍵", result: "三酸甘油酯",
      note: "甘油的三個羥基與脂肪酸形成三個酯鍵；皂化就是鹼性水解。", color: "#e57373", count: 3
    }
  };

  PL.register("biomolecules", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const b = BIO[typeSel.get()], n = b.count;
          CK.panel(ctx, W * 0.07, H * 0.09, W * 0.86, H * 0.50, b.name);
          const total = n + 2, x0 = W * 0.14, x1 = W * 0.86, y = H * 0.28;
          const step = (x1 - x0) / total;
          for (let i = 0; i < total; i++) {
            const cx = x0 + step * (i + 0.5);
            D.disc(ctx, cx, y, 11, { fill: b.color, stroke: "rgba(0,0,0,0.18)" });
            D.text(ctx, "M", cx, y + 3.5, { color: "#fff", size: 8, align: "center", weight: "700" });
            if (i < total - 1) D.line(ctx, cx + 11, y, cx + step - 11, y, PL.col("text-dim"), 2);
          }
          D.text(ctx, b.unit, W / 2, H * 0.41, { color: PL.col("accent"), size: 13, align: "center", weight: "700" });
          D.text(ctx, "—" + b.bond + "—", W / 2, H * 0.48, { color: PL.col("text-faint"), size: 10, align: "center" });
          CK.panel(ctx, W * 0.07, H * 0.64, W * 0.86, H * 0.24, "形成與分解");
          D.text(ctx, "形成：" + b.result, W / 2, H * 0.73, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, b.note, W / 2, H * 0.81, { color: PL.col("text-faint"), size: 9, align: "center" });
          rUnit.set(b.unit); rBond.set(b.bond); rResult.set(b.result); rNote.set(b.note);
        }
      });
      const typeSel = PL.ui.select(ui.L.controls, { label: "生物大分子", value: "carb", options: Object.keys(BIO).map(k => ({ value: k, label: BIO[k].name })) });
      PL.ui.note(ui.L.controls, "三類生物大分子都是「脫水縮合」接起來的：醣類用醣苷鍵、蛋白質用胜肽鍵、油脂用酯鍵。");
      const rUnit = PL.ui.readout(ui.L.readouts, { label: "組成單元" });
      const rBond = PL.ui.readout(ui.L.readouts, { label: "連結方式" });
      const rResult = PL.ui.readout(ui.L.readouts, { label: "形成" });
      const rNote = PL.ui.readout(ui.L.readouts, { label: "水解" });
      return { stop() { ui.stop(); } };
    }
  });
})();
