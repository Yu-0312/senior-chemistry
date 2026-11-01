/* 模組七 · 氧化還原與電化學 */
(function () {
  "use strict";
  const PL = window.PhysicsLab, CK = window.ChemLab, D = PL.draw;

  PL.register("oxidation-numbers", {
    build(root) {
      const COMPS = {
        H2O: { name: "水", states: [["H", "+1"], ["O", "−2"]], ox: "O 被還原（0 → −2）", red: "H 被氧化（0 → +1）" },
        CO2: { name: "二氧化碳", states: [["C", "+4"], ["O", "−2"]], ox: "C 被氧化（0 → +4）", red: "O 被還原（0 → −2）" },
        KMnO4: { name: "過錳酸鉀", states: [["K", "+1"], ["Mn", "+7"], ["O", "−2"]], ox: "Mn 被還原（+7 → +2）", red: "O 被氧化（−2 → 0）" },
        H2SO4: { name: "硫酸", states: [["H", "+1"], ["S", "+6"], ["O", "−2"]], ox: "S 被還原（+6 → +4）", red: "O 被氧化（−2 → 0）" },
        Fe2O3: { name: "氧化鐵", states: [["Fe", "+3"], ["O", "−2"]], ox: "Fe 被氧化（0 → +3）", red: "O 被還原（0 → −2）" },
        NaClO: { name: "次氯酸鈉", states: [["Na", "+1"], ["Cl", "+1"], ["O", "−2"]], ox: "Cl 被還原（+1 → −1）", red: "O 被氧化（−2 → 0）" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = compSel.get(), c = COMPS[key];
          CK.panel(ctx, W * 0.08, H * 0.12, W * 0.84, H * 0.28, c.name + "（" + key + "）的氧化數");
          c.states.forEach(([el, num], i) => {
            const x = W * 0.22 + i * W * 0.22;
            D.disc(ctx, x, H * 0.28, 21, { fill: CK.elementColor(el), stroke: "rgba(0,0,0,0.25)" });
            D.text(ctx, el, x, H * 0.28 + 4, { color: el === "C" ? "#fff" : "#18202b", size: 12, align: "center", weight: "700" });
            D.text(ctx, num, x, H * 0.28 + 38, { color: PL.col("accent"), size: 15, align: "center", weight: "700" });
          });
          CK.panel(ctx, W * 0.08, H * 0.48, W * 0.84, H * 0.34, "電子轉移");
          D.text(ctx, "氧化：" + c.ox, W / 2, H * 0.58, { color: "#ff8a65", size: 12, align: "center" });
          D.text(ctx, "還原：" + c.red, W / 2, H * 0.67, { color: "#64b5f6", size: 12, align: "center" });
          D.text(ctx, "氧化數上升 = 氧化；下降 = 還原", W / 2, H * 0.78, { color: PL.col("text-faint"), size: 11, align: "center" });
          rStates.set(c.states.map(s => s[0] + " " + s[1]).join(" · ")); rOx.set(c.ox); rRed.set(c.red);
        }
      });
      const compSel = PL.ui.select(ui.L.controls, { label: "化合物", value: "H2O", options: Object.keys(COMPS).map(k => ({ value: k, label: COMPS[k].name + "（" + k + "）" })) });
      PL.ui.note(ui.L.controls, "氧化數是「假設電子完全偏向電負度大者」的記帳工具。氧通常 −2、氫通常 +1，整段化合物氧化數和等於電荷。");
      const rStates = PL.ui.readout(ui.L.readouts, { label: "各元素氧化數" });
      const rOx = PL.ui.readout(ui.L.readouts, { label: "氧化半反應" });
      const rRed = PL.ui.readout(ui.L.readouts, { label: "還原半反應" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("activity-series", {
    build(root) {
      const SERIES = { K: 0, Na: 1, Ca: 2, Mg: 3, Al: 4, Zn: 5, Fe: 6, Cu: 7, Ag: 8, Au: 9 };
      const METALS = { Mg: { name: "鎂", color: "#b8c2cc" }, Zn: { name: "鋅", color: "#9aa8b8" }, Fe: { name: "鐵", color: "#8b8f96" }, Cu: { name: "銅", color: "#c07a45" }, Ag: { name: "銀", color: "#c0c7d1" } };
      const SOLS = { CuSO4: { name: "硫酸銅", ion: "Cu²⁺", color: "#2e86de", charge: 2 }, AgNO3: { name: "硝酸銀", ion: "Ag⁺", color: "#aab4c0", charge: 1 }, ZnSO4: { name: "硫酸鋅", ion: "Zn²⁺", color: "#8e9aa8", charge: 2 }, HCl: { name: "鹽酸", ion: "H⁺", color: "#e25555", charge: 1 } };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const mk = metalSel.get(), sk = solSel.get(), m = METALS[mk], s = SOLS[sk];
          const reacts = SERIES[mk] < (sk === "HCl" ? 6.5 : sk === "AgNO3" ? 8 : sk === "CuSO4" ? 7 : 5);
          CK.beaker(ctx, W * 0.30, H * 0.74, 150, 150, 0.62, s.color);
          D.rect(ctx, W * 0.27, H * 0.24, 18, H * 0.44, { fill: m.color, stroke: "rgba(0,0,0,0.2)", r: 3 });
          if (reacts) {
            for (let i = 0; i < 16; i++) {
              const x = W * 0.24 + (i * 31 % 70), y = H * 0.48 + (i * 17 % 50);
              D.disc(ctx, x, y, 2.4, { fill: sk === "HCl" ? "#eef4f9" : s.color });
            }
            D.text(ctx, sk === "HCl" ? "表面冒氣泡" : "表面析出金屬", W * 0.30, H * 0.80, { color: PL.col("accent"), size: 11, align: "center" });
          } else {
            D.text(ctx, "沒有明顯反應", W * 0.30, H * 0.80, { color: PL.col("text-faint"), size: 11, align: "center" });
          }
          CK.panel(ctx, W * 0.56, H * 0.16, W * 0.36, H * 0.46, "活性順序");
          D.text(ctx, "K > Na > Ca > Mg > Al > Zn > Fe > Cu > Ag > Au", W * 0.74, H * 0.25, { color: PL.col("text-dim"), size: 9, align: "center" });
          D.text(ctx, m.name + "  vs  " + s.ion, W * 0.74, H * 0.36, { color: PL.col("accent"), size: 13, align: "center", weight: "700" });
          D.text(ctx, reacts ? "活性較大 → 可置換" : "活性不足 → 不反應", W * 0.74, H * 0.45, { color: reacts ? "#66bb6a" : "#ff8a65", size: 12, align: "center", weight: "700" });
          const eq = reacts ? mk + " + " + s.ion + " → " + mk + (s.charge === 2 ? "²⁺" : "+") + " + " + (sk === "HCl" ? "H₂" : s.ion.replace("²⁺", "").replace("⁺", "")) : "—";
          D.text(ctx, eq, W * 0.74, H * 0.57, { color: PL.col("text-dim"), size: 10, align: "center" });
          rReact.set(reacts ? "是" : "否"); rEq.set(eq); rWhy.set(reacts ? "金屬活性大於溶液中的金屬離子" : "金屬活性小於溶液中的金屬離子");
        }
      });
      const metalSel = PL.ui.select(ui.L.controls, { label: "金屬", value: "Zn", options: Object.keys(METALS).map(k => ({ value: k, label: METALS[k].name })) });
      const solSel = PL.ui.select(ui.L.controls, { label: "溶液", value: "CuSO4", options: Object.keys(SOLS).map(k => ({ value: k, label: SOLS[k].name })) });
      PL.ui.note(ui.L.controls, "把銅放進硫酸鋅不反應，把鋅放進硫酸銅則會析出銅。活性順序就是置換反應的判準。");
      const rReact = PL.ui.readout(ui.L.readouts, { label: "是否反應" });
      const rEq = PL.ui.readout(ui.L.readouts, { label: "反應式" });
      const rWhy = PL.ui.readout(ui.L.readouts, { label: "原因" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("galvanic", {
    build(root) {
      const ELECTRODES = { Zn: { name: "鋅", E: -0.76, color: "#9aa8b8" }, Mg: { name: "鎂", E: -2.37, color: "#b8c2cc" }, Fe: { name: "鐵", E: -0.44, color: "#8b8f96" }, Cu: { name: "銅", E: 0.34, color: "#c07a45" }, Ag: { name: "銀", E: 0.80, color: "#c0c7d1" } };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const l = ELECTRODES[leftSel.get()], r = ELECTRODES[rightSel.get()];
          const anode = l.E < r.E ? l : r, cathode = l.E < r.E ? r : l;
          const E = Math.abs(r.E - l.E);
          CK.electroCell(ctx, { x: W * 0.08, y: H * 0.10, w: W * 0.84, h: H * 0.74 }, {
            leftLabel: l.name + " 電極", rightLabel: r.name + " 電極",
            leftColor: l.color, rightColor: r.color,
            leftTint: "#8fc6e8", rightTint: "#b7d9ee", voltage: E.toFixed(2)
          });
          D.text(ctx, "陽極（氧化）：" + anode.name + "　陰極（還原）：" + cathode.name, W / 2, H * 0.86, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "電子由 " + anode.name + " → " + cathode.name + "（外電路）", W / 2, H * 0.92, { color: PL.col("text-faint"), size: 10, align: "center" });
          rE.set(E, 2); rAnode.set(anode.name); rCathode.set(cathode.name); rFlow.set(anode.name + " → " + cathode.name);
        }
      });
      const leftSel = PL.ui.select(ui.L.controls, { label: "左電極", value: "Zn", options: Object.keys(ELECTRODES).map(k => ({ value: k, label: ELECTRODES[k].name })) });
      const rightSel = PL.ui.select(ui.L.controls, { label: "右電極", value: "Cu", options: Object.keys(ELECTRODES).map(k => ({ value: k, label: ELECTRODES[k].name })) });
      PL.ui.note(ui.L.controls, "Ecell = 陰極電位 − 陽極電位。活性大的金屬當陽極，失去電子；電位差越大，電池電壓越高。");
      const rE = PL.ui.readout(ui.L.readouts, { label: "電池電位", unit: "V" });
      const rAnode = PL.ui.readout(ui.L.readouts, { label: "陽極" });
      const rCathode = PL.ui.readout(ui.L.readouts, { label: "陰極" });
      const rFlow = PL.ui.readout(ui.L.readouts, { label: "電子流向" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("electrolysis", {
    build(root) {
      const ELECTROLYTES = {
        CuSO4: { name: "硫酸銅溶液", cathode: "Cu 析出", anode: "O₂ 生成", M: 63.55, n: 2, color: "#2e86de", metal: "#c07a45", deposit: true },
        NaCl: { name: "食鹽水", cathode: "H₂ 生成", anode: "Cl₂ 生成", M: 58.44, n: 1, color: "#8fc6e8" },
        water: { name: "水（加少量電解質）", cathode: "H₂ 生成", anode: "O₂ 生成", M: 18.02, n: 2, color: "#b7d9ee" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const e = ELECTROLYTES[elSel.get()], I = currentS.get(), t = timeS.get();
          const Q = I * t, molE = Q / 96500;
          const mass = molE * e.M / e.n;
          CK.beaker(ctx, W * 0.34, H * 0.74, 170, 140, 0.62, e.color);
          CK.electrode(ctx, W * 0.27, H * 0.30, H * 0.62, "#c0c7d1", "陰極");
          CK.electrode(ctx, W * 0.41, H * 0.30, H * 0.62, "#c0c7d1", "陽極");
          /*
           * 沉積層與氣泡。
           *
           * 電流、通電時間原本只改了面板上的「沉積 0.397 g」。
           * 把陰極上長出的金屬層畫粗，陽極冒出的氣泡畫多，
           * 學生才能把「電量越多 → 產物越多」連到畫面上。
           */
          const dep = PL.clamp(mass / 1.0, 0, 1);
          if (e.deposit) {
            const dw = 2 + dep * 7;
            D.rect(ctx, W * 0.27 - 7 - dw, H * 0.30, dw, H * 0.32, { fill: e.metal });
            D.rect(ctx, W * 0.27 + 7, H * 0.30, dw, H * 0.32, { fill: e.metal });
          }
          const bubbles = Math.round(PL.clamp(Q / 3000, 0.03, 1) * 14);
          for (let i = 0; i < bubbles; i++) {
            const by = H * 0.60 - (i * 13 % 60);
            const bx = e.deposit ? W * 0.41 : W * 0.27;
            D.disc(ctx, bx + Math.sin(i * 2.1) * 7, by, 2.5 + (i % 3) * 0.8, { stroke: "rgba(235,250,255,0.9)", width: 1 });
          }
          D.rect(ctx, W * 0.59, H * 0.24, 46, 24, { fill: "#1b2530", stroke: "#7f8fa1", r: 4 });
          D.text(ctx, "DC", W * 0.615, H * 0.40, { color: PL.col("text-dim"), size: 11, align: "center" });
          CK.wire(ctx, [[W * 0.27, H * 0.30], [W * 0.27, H * 0.18], [W * 0.56, H * 0.18], [W * 0.59, H * 0.24]], "#d07a4a", 2);
          CK.wire(ctx, [[W * 0.41, H * 0.30], [W * 0.41, H * 0.22], [W * 0.62, H * 0.22], [W * 0.62, H * 0.24]], "#d07a4a", 2);
          D.text(ctx, "陰極：" + e.cathode, W * 0.34, H * 0.82, { color: PL.col("text-dim"), size: 10, align: "center" });
          D.text(ctx, "陽極：" + e.anode, W * 0.34, H * 0.88, { color: PL.col("text-dim"), size: 10, align: "center" });
          CK.panel(ctx, W * 0.58, H * 0.46, W * 0.34, H * 0.30, "電解量");
          D.text(ctx, "Q = " + Q.toFixed(0) + " C", W * 0.75, H * 0.55, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "沉積／生成 " + mass.toFixed(3) + " g", W * 0.75, H * 0.63, { color: PL.col("accent"), size: 12, align: "center", weight: "700" });
          rMass.set(mass, 4); rQ.set(Q, 0); rCathode.set(e.cathode); rAnode.set(e.anode);
        }
      });
      const elSel = PL.ui.select(ui.L.controls, { label: "電解液", value: "CuSO4", options: Object.keys(ELECTROLYTES).map(k => ({ value: k, label: ELECTROLYTES[k].name })) });
      const currentS = PL.ui.slider(ui.L.controls, { label: "電流", min: 0.1, max: 5, step: 0.1, value: 1, unit: "A", digits: 1 });
      const timeS = PL.ui.slider(ui.L.controls, { label: "通電時間", min: 10, max: 600, step: 10, value: 120, unit: "s", digits: 0 });
      PL.ui.note(ui.L.controls, "電解是外加電壓迫使非自發反應發生。陰極發生還原，陽極發生氧化；電量 Q = It 決定生成物量。");
      const rMass = PL.ui.readout(ui.L.readouts, { label: "生成／沉積質量", unit: "g" });
      const rQ = PL.ui.readout(ui.L.readouts, { label: "通過電量", unit: "C" });
      const rCathode = PL.ui.readout(ui.L.readouts, { label: "陰極產物" });
      const rAnode = PL.ui.readout(ui.L.readouts, { label: "陽極產物" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("corrosion", {
    build(root) {
      const ENVS = {
        dry: { name: "乾燥空氣", rate: 0.02, note: "缺水，幾乎不生鏽" },
        humid: { name: "潮濕空氣", rate: 0.45, note: "水與氧氣同時存在，開始生鏽" },
        salt: { name: "鹽水", rate: 0.85, note: "鹽分增加導電度，加速腐蝕" },
        acid: { name: "酸性雨水", rate: 1.0, note: "H⁺ 加速鐵溶解" },
        zinc: { name: "鍍鋅", rate: 0.05, note: "鋅為犧牲陽極，保護鐵" },
        paint: { name: "塗漆", rate: 0.08, note: "隔絕水與氧氣" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const e = ENVS[envSel.get()];
          CK.panel(ctx, W * 0.08, H * 0.10, W * 0.84, H * 0.74, e.name);
          const cx = W / 2, top = H * 0.20, bottom = H * 0.66;
          D.rect(ctx, cx - 8, top, 16, bottom - top, { fill: "#8b8f96", r: 3 });
          D.disc(ctx, cx, top, 16, { fill: "#8b8f96" });
          if (e.name === "鍍鋅") D.rect(ctx, cx - 10, top, 20, bottom - top, { stroke: "#9aa8b8", width: 4, r: 3 });
          if (e.name === "塗漆") D.rect(ctx, cx - 10, top, 20, bottom - top, { stroke: "#64b5f6", width: 4, r: 3 });
          const rust = Math.round(e.rate * 26);
          for (let i = 0; i < rust; i++) {
            const y = top + 20 + (i * 37 % (bottom - top - 30));
            D.disc(ctx, cx - 14 + (i * 23 % 28), y, 5 + (i % 3) * 2, { fill: "#b4552d" });
          }
          D.text(ctx, e.note, W / 2, H * 0.76, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "腐蝕速率指標 " + (e.rate * 100).toFixed(0) + "%", W / 2, H * 0.85, { color: e.rate > 0.5 ? "#ff8a65" : "#66bb6a", size: 15, align: "center", weight: "700" });
          rRate.set(e.rate * 100, 0); rNote.set(e.note); rMethod.set(e.name);
        }
      });
      const envSel = PL.ui.select(ui.L.controls, { label: "環境／防護", value: "humid", options: Object.keys(ENVS).map(k => ({ value: k, label: ENVS[k].name })) });
      PL.ui.note(ui.L.controls, "鐵生鏽需要水與氧氣。鹽分會加速，塗漆與鍍鋅能減緩；鍍鋅即使刮傷，鋅仍會優先氧化保護鐵。");
      const rRate = PL.ui.readout(ui.L.readouts, { label: "腐蝕速率", unit: "%" });
      const rNote = PL.ui.readout(ui.L.readouts, { label: "機制" });
      const rMethod = PL.ui.readout(ui.L.readouts, { label: "環境" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("batteries", {
    build(root) {
      const TYPES = {
        lead: { name: "鉛蓄電池", V: 2.0, cycles: "500–800", note: "汽車啟動電池，重但可靠" },
        liion: { name: "鋰離子電池", V: 3.7, cycles: "500–1500", note: "手機與電動車，能量密度高" },
        alkaline: { name: "鹼性電池", V: 1.5, cycles: "一次電池", note: "不可充電，用完即丟" },
        nimh: { name: "鎳氫電池", V: 1.2, cycles: "500–1000", note: "可充電，記憶效應較小" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const b = TYPES[typeSel.get()], charge = chargeS.get(), discharging = modeSel.get() === "discharge";
          CK.panel(ctx, W * 0.08, H * 0.10, W * 0.84, H * 0.76, b.name);
          const bw = W * 0.44, bh = H * 0.26, bx = W / 2 - bw / 2, by = H * 0.24;
          D.rect(ctx, bx, by, bw, bh, { fill: PL.theme.shade(0.5), stroke: PL.col("border"), r: 8 });
          D.rect(ctx, bx + bw - 8, by + bh * 0.3, 10, bh * 0.4, { fill: "#b8c4d0", r: 2 });
          D.rect(ctx, bx + 10, by + 10, (bw - 20) * charge / 100, bh - 20, { fill: discharging ? "#66bb6a" : "#64b5f6", r: 4 });
          D.text(ctx, charge + "%", W / 2, by + bh / 2 + 6, { color: "#fff", size: 20, align: "center", weight: "700" });
          D.text(ctx, discharging ? "放電：化學能 → 電能" : "充電：電能 → 化學能", W / 2, H * 0.60, { color: discharging ? "#66bb6a" : "#64b5f6", size: 14, align: "center", weight: "700" });
          D.text(ctx, "標稱電壓 " + b.V + " V　循環 " + b.cycles, W / 2, H * 0.68, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, b.note, W / 2, H * 0.76, { color: PL.col("text-faint"), size: 11, align: "center" });
          rV.set(b.V, 1); rMode.set(discharging ? "放電" : "充電"); rCharge.set(charge, 0);
        }
      });
      const typeSel = PL.ui.select(ui.L.controls, { label: "電池", value: "liion", options: Object.keys(TYPES).map(k => ({ value: k, label: TYPES[k].name })) });
      const modeSel = PL.ui.select(ui.L.controls, { label: "模式", value: "discharge", options: [{ value: "discharge", label: "放電" }, { value: "charge", label: "充電" }] });
      const chargeS = PL.ui.slider(ui.L.controls, { label: "電量", min: 0, max: 100, step: 5, value: 70, unit: "%", digits: 0 });
      PL.ui.note(ui.L.controls, "二次電池放電時是自發的伽凡尼電池，充電時外加電壓逆轉反應。過充或過放都會縮短壽命。");
      const rV = PL.ui.readout(ui.L.readouts, { label: "標稱電壓", unit: "V" });
      const rMode = PL.ui.readout(ui.L.readouts, { label: "目前模式" });
      const rCharge = PL.ui.readout(ui.L.readouts, { label: "電量", unit: "%" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("fuel-cell", {
    build(root) {
      const FUELS = {
        H2: { name: "氫氧燃料電池", anode: "H₂ → 2H⁺ + 2e⁻", cathode: "O₂ + 4H⁺ + 4e⁻ → 2H₂O", product: "水", eff: 60, V: 1.23 },
        methanol: { name: "甲醇燃料電池", anode: "CH₃OH + H₂O → CO₂ + 6H⁺ + 6e⁻", cathode: "O₂ + 4H⁺ + 4e⁻ → 2H₂O", product: "水與 CO₂", eff: 45, V: 1.21 },
        methane: { name: "甲烷燃料電池", anode: "CH₄ + 2H₂O → CO₂ + 8H⁺ + 8e⁻", cathode: "O₂ + 4H⁺ + 4e⁻ → 2H₂O", product: "水與 CO₂", eff: 50, V: 1.06 }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const f = FUELS[fuelSel.get()];
          CK.electroCell(ctx, { x: W * 0.08, y: H * 0.10, w: W * 0.84, h: H * 0.72 }, {
            leftLabel: "陽極", rightLabel: "陰極", leftColor: "#9aa8b8", rightColor: "#c0c7d1", voltage: f.V.toFixed(2)
          });
          CK.panel(ctx, W * 0.08, H * 0.68, W * 0.84, H * 0.22, "電池反應");
          D.text(ctx, "陽極：" + f.anode, W / 2, H * 0.76, { color: PL.col("text-dim"), size: 10, align: "center" });
          D.text(ctx, "陰極：" + f.cathode, W / 2, H * 0.82, { color: PL.col("text-dim"), size: 10, align: "center" });
          D.text(ctx, "產物 " + f.product + " · 效率約 " + f.eff + "%", W / 2, H * 0.89, { color: PL.col("accent"), size: 11, align: "center" });
          rV.set(f.V, 2); rEff.set(f.eff, 0); rProduct.set(f.product); rAnode.set(f.anode);
        }
      });
      const fuelSel = PL.ui.select(ui.L.controls, { label: "燃料", value: "H2", options: Object.keys(FUELS).map(k => ({ value: k, label: FUELS[k].name })) });
      PL.ui.note(ui.L.controls, "燃料電池不靠充電，而是持續輸入燃料與氧化劑。氫氧燃料電池的產物只有水，是它最大的優勢。");
      const rV = PL.ui.readout(ui.L.readouts, { label: "理論電壓", unit: "V" });
      const rEff = PL.ui.readout(ui.L.readouts, { label: "效率", unit: "%" });
      const rProduct = PL.ui.readout(ui.L.readouts, { label: "主要產物" });
      const rAnode = PL.ui.readout(ui.L.readouts, { label: "陽極反應" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("faraday", {
    build(root) {
      const METALS = {
        Ag: { name: "銀", M: 107.87, n: 1 },
        Cu: { name: "銅", M: 63.55, n: 2 },
        Zn: { name: "鋅", M: 65.38, n: 2 },
        Al: { name: "鋁", M: 26.98, n: 3 },
        Ni: { name: "鎳", M: 58.69, n: 2 }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const m = METALS[metalSel.get()], I = currentS.get(), t = timeS.get();
          const Q = I * t, molE = Q / 96500, molM = molE / m.n, mass = molM * m.M;
          CK.beaker(ctx, W * 0.30, H * 0.74, 160, 140, 0.62, "#8fc6e8");
          CK.electrode(ctx, W * 0.24, H * 0.30, H * 0.62, m.name === "銅" ? "#c07a45" : m.name === "銀" ? "#c0c7d1" : "#9aa8b8", "陰極");
          CK.electrode(ctx, W * 0.38, H * 0.30, H * 0.62, "#7f8fa1", "陽極");
          // 沉積量：陰極上長出的金屬層與金屬顆粒，隨電量增加而變厚、變多。
          const dep = PL.clamp(mass / 20, 0, 1);
          D.rect(ctx, W * 0.24 - 8 - dep * 6, H * 0.30, 2 + dep * 6, H * 0.32, { fill: m.name === "銅" ? "#c07a45" : m.name === "銀" ? "#b9c2cc" : "#9aa8b8" });
          D.rect(ctx, W * 0.24 + 8, H * 0.30, 2 + dep * 6, H * 0.32, { fill: m.name === "銅" ? "#c07a45" : m.name === "銀" ? "#b9c2cc" : "#9aa8b8" });
          const grains = Math.round(PL.clamp(mass / 20, 0.02, 1) * 12);
          for (let i = 0; i < grains; i++) D.disc(ctx, W * 0.24 + (i * 7 % 14) - 7, H * 0.50 + (i % 6) * 5, 3.2, { fill: "#c0c7d1" });
          CK.panel(ctx, W * 0.54, H * 0.14, W * 0.38, H * 0.54, "法拉第定律");
          D.text(ctx, "m = MIt / nF", W * 0.73, H * 0.24, { color: PL.col("text-faint"), size: 11, align: "center" });
          D.text(ctx, "Q = " + Q.toFixed(0) + " C", W * 0.73, H * 0.34, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "電子 " + molE.toFixed(4) + " mol", W * 0.73, H * 0.43, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, mass.toFixed(3) + " g", W * 0.73, H * 0.55, { color: PL.col("accent"), size: 24, align: "center", weight: "700" });
          D.text(ctx, m.name + " 沉積", W * 0.73, H * 0.64, { color: PL.col("text-dim"), size: 11, align: "center" });
          rMass.set(mass, 4); rQ.set(Q, 0); rMol.set(molM, 5); rMetal.set(m.name);
        }
      });
      const metalSel = PL.ui.select(ui.L.controls, { label: "沉積金屬", value: "Cu", options: Object.keys(METALS).map(k => ({ value: k, label: METALS[k].name })) });
      const currentS = PL.ui.slider(ui.L.controls, { label: "電流", min: 0.1, max: 5, step: 0.1, value: 1, unit: "A", digits: 1 });
      const timeS = PL.ui.slider(ui.L.controls, { label: "通電時間", min: 60, max: 3600, step: 60, value: 600, unit: "s", digits: 0 });
      PL.ui.note(ui.L.controls, "1 莫耳電子帶 96500 C。相同電量下，價數越高的金屬，沉積的莫耳數越少，但質量要看莫耳質量。");
      const rMass = PL.ui.readout(ui.L.readouts, { label: "沉積質量", unit: "g" });
      const rQ = PL.ui.readout(ui.L.readouts, { label: "電量", unit: "C" });
      const rMol = PL.ui.readout(ui.L.readouts, { label: "沉積莫耳數", unit: "mol" });
      const rMetal = PL.ui.readout(ui.L.readouts, { label: "金屬" });
      return { stop() { ui.stop(); } };
    }
  });
})();
