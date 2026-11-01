/* 模組十 · 生活化學與材料 */
(function () {
  "use strict";
  const PL = window.PhysicsLab, CK = window.ChemLab, D = PL.draw;

  PL.register("soap", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        animate: true,
        draw(dt, t) {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const hard = waterSel.get() === "hard", soap = soapS.get(), oil = oilS.get();
          const effective = soap * (hard ? 0.55 : 1);
          const enough = effective >= 6;
          CK.beaker(ctx, W * 0.30, H * 0.78, 200, 170, 0.60, hard ? "#bed3d8" : "#8fc6e8");
          const cx = W * 0.30, cy = H * 0.56, r = 18 + oil * 5;
          D.disc(ctx, cx, cy, r, { fill: "#d9a441", stroke: "#a97c25", width: 2 });
          D.text(ctx, "油", cx, cy + 4, { color: "#5b3c0a", size: 11, align: "center", weight: "700" });
          if (enough) {
            const count = Math.min(18, Math.round(effective));
            for (let i = 0; i < count; i++) {
              const a = i / count * Math.PI * 2 + t * 0.1;
              const hx = cx + Math.cos(a) * (r + 12), hy = cy + Math.sin(a) * (r + 12);
              D.line(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, hx, hy, "#4a7a9a", 2);
              D.disc(ctx, hx, hy, 3.6, { fill: "#4dd0e1" });
            }
            D.text(ctx, "微胞形成，油污被包住", cx, H * 0.84, { color: PL.col("accent"), size: 11, align: "center" });
          } else {
            for (let i = 0; i < 9; i++) {
              const a = i / 9 * Math.PI * 2 + t * 0.08;
              D.disc(ctx, cx + Math.cos(a) * (r + 10), cy + Math.sin(a) * (r + 10), 2.4, { fill: "#4dd0e1" });
            }
            D.text(ctx, hard ? "肥皂不足，油污散不開" : "界面活性劑不足", cx, H * 0.84, { color: "#ff8a65", size: 11, align: "center" });
          }
          if (hard) {
            for (let i = 0; i < 8; i++) {
              D.disc(ctx, W * 0.14 + (i * 37 % 90), H * 0.66 + (i * 23 % 45), 3, { fill: "#c8c8c8" });
            }
            D.text(ctx, "Ca²⁺／Mg²⁺ 形成皂垢", W * 0.30, H * 0.90, { color: "#b0bec5", size: 10, align: "center" });
          }
          CK.panel(ctx, W * 0.56, H * 0.12, W * 0.38, H * 0.62, "界面活性劑");
          const hx0 = W * 0.60, hy0 = H * 0.24;
          D.disc(ctx, hx0, hy0, 9, { fill: "#4dd0e1" });
          D.text(ctx, "親水頭", hx0, hy0 - 16, { color: PL.col("text-dim"), size: 10, align: "center" });
          for (let i = 0; i < 6; i++) D.line(ctx, hx0, hy0 + 9 + i * 7, hx0 + Math.sin(i) * 3, hy0 + 15 + i * 7, "#4a7a9a", 2);
          D.text(ctx, "親油尾", hx0, hy0 + 74, { color: PL.col("text-dim"), size: 10, align: "center" });
          D.text(ctx, "頭溶於水、尾溶於油", W * 0.77, H * 0.32, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, "有效肥皂 " + effective.toFixed(1), W * 0.77, H * 0.48, { color: PL.col("accent"), size: 15, align: "center", weight: "700" });
          D.text(ctx, hard ? "硬水消耗約 45% 肥皂" : "純水，肥皂效率高", W * 0.77, H * 0.58, { color: PL.col("text-dim"), size: 10, align: "center" });
          rState.set(enough ? "形成微胞，可帶走油污" : "界面活性劑不足，清潔力差");
          rEff.set(effective, 1); rHard.set(hard ? "硬水（含 Ca²⁺、Mg²⁺）" : "軟水");
          rUse.set(hard ? "部分肥皂變成皂垢" : "全部用於清潔");
        }
      });
      const waterSel = PL.ui.select(ui.L.controls, { label: "水質", value: "soft", options: [{ value: "soft", label: "軟水" }, { value: "hard", label: "硬水" }] });
      const soapS = PL.ui.slider(ui.L.controls, { label: "肥皂用量", min: 1, max: 12, step: 1, value: 8, digits: 0 });
      const oilS = PL.ui.slider(ui.L.controls, { label: "油污量", min: 1, max: 5, step: 1, value: 3, digits: 0 });
      PL.ui.note(ui.L.controls, "肥皂分子的親油尾插入油滴、親水頭留在水中，把油污包成微胞。硬水中的鈣鎂離子會先和肥皂結合，形成皂垢。");
      const rState = PL.ui.readout(ui.L.readouts, { label: "清潔狀態" });
      const rEff = PL.ui.readout(ui.L.readouts, { label: "有效肥皂" });
      const rHard = PL.ui.readout(ui.L.readouts, { label: "水質" });
      const rUse = PL.ui.readout(ui.L.readouts, { label: "肥皂去向" });
      return { stop() { ui.stop(); } };
    }
  });

  const DETERGENTS = {
    anionic: { name: "陰離子型（LAS）", foam: 0.85, hard: 0.6, bio: 0.75, note: "最常見的洗潔精成分，去油力強" },
    cationic: { name: "陽離子型（四級銨鹽）", foam: 0.35, hard: 0.9, bio: 0.45, note: "具殺菌性，常作衣物柔軟劑" },
    nonionic: { name: "非離子型（乙氧基化物）", foam: 0.5, hard: 0.98, bio: 0.8, note: "耐硬水，低泡沫，適合洗衣機" },
    phosphate: { name: "含磷助劑（磷酸鹽）", foam: 0.7, hard: 0.95, bio: 0.2, note: "助洗效果好，但會造成水體優養化" }
  };

  PL.register("detergent", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const d = DETERGENTS[typeSel.get()];
          CK.panel(ctx, W * 0.07, H * 0.09, W * 0.86, H * 0.74, d.name);
          const tx = W * 0.24, ty = H * 0.18, tw = 56, th = H * 0.46;
          D.rect(ctx, tx, ty, tw, th, { fill: "rgba(160,210,235,0.25)", stroke: PL.col("border"), r: 6 });
          D.rect(ctx, tx + 4, ty + th * 0.42, tw - 8, th * 0.58 - 4, { fill: "rgba(120,196,226,0.55)", r: 4 });
          const foamH = th * 0.40 * d.foam;
          for (let i = 0; i < 22; i++) {
            D.disc(ctx, tx + 8 + (i * 17 % (tw - 16)), ty + th * 0.42 - (i * 13 % Math.max(8, foamH)), 3 + (i % 3), { fill: "rgba(245,252,255,0.9)" });
          }
          D.text(ctx, "起泡", tx + tw / 2, ty + th + 16, { color: PL.col("text-faint"), size: 9, align: "center" });
          const bars = [
            ["起泡力", d.foam, "#64b5f6"],
            ["耐硬水", d.hard, "#66bb6a"],
            ["生物分解", d.bio, "#ffb74d"]
          ];
          bars.forEach((b, i) => {
            const y = H * 0.24 + i * H * 0.15;
            D.text(ctx, b[0], W * 0.48, y, { color: PL.col("text-dim"), size: 10 });
            D.rect(ctx, W * 0.48, y + 7, W * 0.36, 8, { fill: PL.theme.shade(0.55), stroke: PL.col("border"), width: 1, r: 4 });
            D.rect(ctx, W * 0.48, y + 7, W * 0.36 * b[1], 8, { fill: b[2], r: 4 });
            D.text(ctx, Math.round(b[1] * 100) + "%", W * 0.87, y + 15, { color: PL.col("text-dim"), size: 9, align: "right" });
          });
          D.text(ctx, d.note, W / 2, H * 0.74, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, typeSel.get() === "phosphate" ? "含磷配方已多被無磷配方取代" : "依電荷分類，用途不同", W / 2, H * 0.81, { color: typeSel.get() === "phosphate" ? "#ff8a65" : PL.col("accent"), size: 10, align: "center" });
          rType.set(d.name); rFoam.set(d.foam * 100, 0); rHard.set(d.hard * 100, 0); rBio.set(d.bio * 100, 0);
          rNote.set(d.note);
        }
      });
      const typeSel = PL.ui.select(ui.L.controls, { label: "清潔劑類型", value: "anionic", options: Object.keys(DETERGENTS).map(k => ({ value: k, label: DETERGENTS[k].name })) });
      PL.ui.note(ui.L.controls, "合成清潔劑的親水頭可依需要設計，耐硬水性通常優於肥皂。含磷助劑雖好用，卻會讓湖泊優養化。");
      const rType = PL.ui.readout(ui.L.readouts, { label: "類型" });
      const rFoam = PL.ui.readout(ui.L.readouts, { label: "起泡力", unit: "%" });
      const rHard = PL.ui.readout(ui.L.readouts, { label: "耐硬水", unit: "%" });
      const rBio = PL.ui.readout(ui.L.readouts, { label: "生物分解", unit: "%" });
      const rNote = PL.ui.readout(ui.L.readouts, { label: "用途" });
      return { stop() { ui.stop(); } };
    }
  });

  const METHODS = {
    room: { name: "室溫放置", days: 2, mech: "微生物快速繁殖、酵素作用", color: "#ff8a65" },
    fridge: { name: "冷藏 4°C", days: 7, mech: "低溫減緩微生物生長", color: "#64b5f6" },
    freeze: { name: "冷凍 −18°C", days: 180, mech: "低溫停止微生物活動", color: "#7986cb" },
    dry: { name: "脫水乾燥", days: 365, mech: "降低水活性，微生物無法生長", color: "#ffb74d" },
    salt: { name: "鹽漬", days: 90, mech: "高滲透壓使微生物脫水死亡", color: "#b0bec5" },
    acid: { name: "酸化醃漬", days: 30, mech: "低 pH 抑制微生物", color: "#a5d6a7" },
    antioxidant: { name: "添加抗氧化劑", days: 120, mech: "延緩油脂氧化酸敗", color: "#ce93d8" }
  };

  PL.register("food", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const m = METHODS[methodSel.get()], days = dayS.get();
          const ratio = days / m.days;
          const spoiled = ratio >= 1;
          CK.panel(ctx, W * 0.07, H * 0.09, W * 0.52, H * 0.74, m.name);
          const cx = W * 0.33, cy = H * 0.38;
          D.disc(ctx, cx, cy, 44, { fill: "#e8c26a", stroke: "#b58f33", width: 2 });
          D.disc(ctx, cx - 14, cy - 10, 15, { fill: "#f0d38a" });
          for (let i = 0; i < Math.min(18, Math.round(ratio * 12)); i++) {
            const a = i * 2.4, rr = 12 + (i * 13 % 30);
            D.disc(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 3 + (i % 2), { fill: "#6b7f4a" });
          }
          D.text(ctx, spoiled ? "已腐敗" : ratio > 0.65 ? "開始變質" : "仍可食用", cx, H * 0.64, {
            color: spoiled ? "#ff8a65" : ratio > 0.65 ? "#ffb74d" : "#66bb6a", size: 14, align: "center", weight: "700"
          });
          D.text(ctx, "已存放 " + days + " 天", cx, H * 0.71, { color: PL.col("text-dim"), size: 10, align: "center" });
          CK.panel(ctx, W * 0.63, H * 0.09, W * 0.31, H * 0.74, "保存原理");
          D.text(ctx, "預估期限", W * 0.785, H * 0.22, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, m.days + " 天", W * 0.785, H * 0.31, { color: PL.col("accent"), size: 24, align: "center", weight: "700" });
          D.text(ctx, m.mech, W * 0.785, H * 0.47, { color: PL.col("text-dim"), size: 10, align: "center" });
          D.text(ctx, "低溫、脫水、鹽漬、酸化", W * 0.785, H * 0.60, { color: PL.col("text-faint"), size: 9, align: "center" });
          D.text(ctx, "都在對付微生物與氧化", W * 0.785, H * 0.66, { color: PL.col("text-faint"), size: 9, align: "center" });
          D.text(ctx, "冷藏不是殺菌，只是減速", W * 0.785, H * 0.76, { color: "#ffb74d", size: 9, align: "center" });
          rShelf.set(m.days, 0); rMech.set(m.mech); rState.set(spoiled ? "腐敗" : ratio > 0.65 ? "變質中" : "新鮮");
          rRatio.set(ratio * 100, 0);
        }
      });
      const methodSel = PL.ui.select(ui.L.controls, { label: "保存方式", value: "fridge", options: Object.keys(METHODS).map(k => ({ value: k, label: METHODS[k].name })) });
      const dayS = PL.ui.slider(ui.L.controls, { label: "存放天數", min: 0, max: 180, step: 1, value: 3, unit: "天", digits: 0 });
      PL.ui.note(ui.L.controls, "冷藏只能減慢微生物生長，不能殺菌。脫水與鹽漬則是讓微生物缺水，從根本抑制繁殖。");
      const rShelf = PL.ui.readout(ui.L.readouts, { label: "預估保存期限", unit: "天" });
      const rMech = PL.ui.readout(ui.L.readouts, { label: "作用機制" });
      const rState = PL.ui.readout(ui.L.readouts, { label: "目前狀態" });
      const rRatio = PL.ui.readout(ui.L.readouts, { label: "期限消耗", unit: "%" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("medicine", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const mSA = saS.get(), mAA = aaS.get();
          const nSA = mSA / 138.12, nAA = mAA / 102.09;
          const limiting = nSA < nAA ? "水楊酸" : "醋酸酐";
          const nAsp = Math.min(nSA, nAA), theo = nAsp * 180.16, actual = theo * 0.85;
          CK.panel(ctx, W * 0.07, H * 0.09, W * 0.86, H * 0.40, "阿斯匹靈合成");
          D.text(ctx, "C₇H₆O₃ + C₄H₆O₃ → C₉H₈O₄ + C₂H₄O₂", W / 2, H * 0.19, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "水楊酸 + 醋酸酐 → 阿斯匹靈 + 醋酸", W / 2, H * 0.26, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, "限量試劑：" + limiting, W * 0.30, H * 0.39, { color: "#ff8a65", size: 13, align: "center", weight: "700" });
          D.text(ctx, "理論產量 " + theo.toFixed(2) + " g", W * 0.68, H * 0.39, { color: PL.col("accent"), size: 15, align: "center", weight: "700" });
          CK.panel(ctx, W * 0.07, H * 0.54, W * 0.86, H * 0.34, "純化與檢驗");
          /*
           * 兩種反應物各自一條長條，產物一條。
           *
           * 限量試劑的觀念是「最短的那根決定產量」；以前畫面上只有理論產量與
           * 固定的 85% 產率長條，不管滑桿怎麼拉都一樣長。
           * 現在兩條反應物長條誰先見底，一眼就看得出來。
           */
          const barX = W * 0.26, barW = W * 0.52;
          const rowBar = (y, label, frac, color) => {
            D.text(ctx, label, W * 0.12, y + 3, { color: PL.col("text-dim"), size: 9 });
            CK.meter(ctx, barX, y, barW, 7, frac, { color });
          };
          rowBar(H * 0.612, "水楊酸", mSA / 10, "#5b8def");
          rowBar(H * 0.650, "醋酸酐", mAA / 10, "#8e6fd8");
          rowBar(H * 0.694, "阿斯匹靈", PL.clamp(actual / 15, 0, 1), "#66bb6a");
          D.text(ctx, "實際產量（產率 85%）" + actual.toFixed(2) + " g", W / 2, H * 0.762, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "再結晶純化，熔點 135°C 可作初步鑑定", W / 2, H * 0.825, { color: PL.col("text-faint"), size: 9, align: "center" });
          rLimit.set(limiting); rTheo.set(theo, 2); rActual.set(actual, 2); rYield.set(85, 0);
        }
      });
      const saS = PL.ui.slider(ui.L.controls, { label: "水楊酸質量", min: 1, max: 10, step: 0.1, value: 5, unit: "g", digits: 1 });
      const aaS = PL.ui.slider(ui.L.controls, { label: "醋酸酐質量", min: 1, max: 10, step: 0.1, value: 5, unit: "g", digits: 1 });
      PL.ui.note(ui.L.controls, "先算兩種反應物的莫耳數，量少的那個決定產量。實際產量通常低於理論值，因為有損失與副反應。");
      const rLimit = PL.ui.readout(ui.L.readouts, { label: "限量試劑" });
      const rTheo = PL.ui.readout(ui.L.readouts, { label: "理論產量", unit: "g" });
      const rActual = PL.ui.readout(ui.L.readouts, { label: "實際產量", unit: "g" });
      const rYield = PL.ui.readout(ui.L.readouts, { label: "產率", unit: "%" });
      return { stop() { ui.stop(); } };
    }
  });

  const ROUTES = {
    ethylene: {
      name: "環氧乙烷製程",
      old: { label: "氯醇法", economy: 25, waste: 4.2, solvent: "水與石灰乳", note: "副產大量氯化鈣廢水" },
      neu: { label: "銀催化直接氧化", economy: 100, waste: 0.1, solvent: "無", note: "C₂H₄ + ½O₂ → C₂H₄O，原子全進產物" }
    },
    ibuprofen: {
      name: "布洛芬合成",
      old: { label: "傳統六步法", economy: 40, waste: 6.5, solvent: "多種有機溶劑", note: "步驟多、廢棄物多" },
      neu: { label: "BHC 三步法", economy: 77, waste: 1.2, solvent: "較少", note: "步驟減半，原子經濟大幅提升" }
    }
  };

  PL.register("green-chemistry", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const r = ROUTES[routeSel.get()], route = modeSel.get() === "old" ? r.old : r.neu;
          CK.panel(ctx, W * 0.07, H * 0.09, W * 0.86, H * 0.74, r.name + " · " + route.label);
          const bx = W * 0.14, by = H * 0.22, bw = W * 0.72, bh = 18;
          D.text(ctx, "原子經濟", bx, by - 8, { color: PL.col("text-dim"), size: 11 });
          D.rect(ctx, bx, by, bw, bh, { fill: PL.theme.shade(0.55), stroke: PL.col("border"), width: 1, r: 9 });
          D.rect(ctx, bx, by, bw * route.economy / 100, bh, { fill: route.economy > 70 ? "#66bb6a" : route.economy > 40 ? "#ffb74d" : "#ff8a65", r: 9 });
          D.text(ctx, route.economy + "%", W * 0.90, by + 14, { color: PL.col("accent"), size: 15, align: "right", weight: "700" });
          D.text(ctx, "每公斤產品廢棄物", bx, H * 0.41, { color: PL.col("text-dim"), size: 11 });
          D.text(ctx, route.waste + " kg", W * 0.86, H * 0.41, { color: route.waste > 2 ? "#ff8a65" : "#66bb6a", size: 18, align: "right", weight: "700" });
          D.text(ctx, "溶劑：" + route.solvent, W * 0.14, H * 0.51, { color: PL.col("text-dim"), size: 11 });
          D.text(ctx, route.note, W / 2, H * 0.62, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, route.economy > 70 ? "原子經濟高，接近零廢棄" : "原子經濟低，副產物多", W / 2, H * 0.70, { color: route.economy > 70 ? "#66bb6a" : "#ff8a65", size: 12, align: "center", weight: "700" });
          D.text(ctx, "原子經濟 = 產物莫耳質量 ÷ 反應物莫耳質量總和", W / 2, H * 0.79, { color: PL.col("text-faint"), size: 9, align: "center" });
          rEcon.set(route.economy, 0); rWaste.set(route.waste, 1); rSolvent.set(route.solvent); rNote.set(route.note);
        }
      });
      const routeSel = PL.ui.select(ui.L.controls, { label: "製程", value: "ethylene", options: Object.keys(ROUTES).map(k => ({ value: k, label: ROUTES[k].name })) });
      const modeSel = PL.ui.select(ui.L.controls, { label: "路線", value: "old", options: [{ value: "old", label: "舊製程" }, { value: "neu", label: "綠色製程" }] });
      PL.ui.note(ui.L.controls, "綠色化學不是「少做一點」，而是從反應設計就減少廢棄物。原子經濟把「原子有沒有進到產物」量化出來。");
      const rEcon = PL.ui.readout(ui.L.readouts, { label: "原子經濟", unit: "%" });
      const rWaste = PL.ui.readout(ui.L.readouts, { label: "廢棄物", unit: "kg/kg" });
      const rSolvent = PL.ui.readout(ui.L.readouts, { label: "溶劑" });
      const rNote = PL.ui.readout(ui.L.readouts, { label: "評語" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("nanomaterials", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const r = sizeS.get();
          const frac = PL.clamp(1 - Math.pow(Math.max(0, 1 - 0.3 / r), 3), 0.02, 0.95);
          CK.panel(ctx, W * 0.07, H * 0.09, W * 0.44, H * 0.74, "奈米粒子");
          const cx = W * 0.29, cy = H * 0.40, R = 46;
          D.disc(ctx, cx, cy, R, { fill: "#7e9bb5", stroke: "#4f6a82", width: 1.5 });
          const n = 90;
          for (let i = 0; i < n; i++) {
            const a = i * 2.399, rr = R * Math.sqrt((i + 1) / n);
            const surface = rr > R * (1 - 0.3 / r * 2.2);
            D.disc(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, surface ? 3.2 : 2.3, { fill: surface ? "#ffd54f" : "#c7d6e2" });
          }
          D.text(ctx, "黃色＝表面原子", cx, H * 0.62, { color: PL.col("text-faint"), size: 9, align: "center" });
          D.text(ctx, r + " nm", cx, H * 0.70, { color: PL.col("accent"), size: 20, align: "center", weight: "700" });
          CK.panel(ctx, W * 0.55, H * 0.09, W * 0.38, H * 0.74, "尺寸效應");
          D.text(ctx, "表面原子比例", W * 0.74, H * 0.21, { color: PL.col("text-faint"), size: 9, align: "center" });
          D.text(ctx, (frac * 100).toFixed(0) + "%", W * 0.74, H * 0.30, { color: PL.col("accent"), size: 24, align: "center", weight: "700" });
          D.text(ctx, "比表面積", W * 0.74, H * 0.42, { color: PL.col("text-faint"), size: 9, align: "center" });
          D.text(ctx, (3 / r).toFixed(2) + " nm⁻¹", W * 0.74, H * 0.50, { color: PL.col("text-dim"), size: 14, align: "center", weight: "700" });
          D.text(ctx, r < 10 ? "表面效應主導" : r < 100 ? "過渡區" : "接近塊材", W * 0.74, H * 0.64, { color: PL.col("accent"), size: 11, align: "center" });
          D.text(ctx, r < 10 ? "催化活性高、熔點下降" : "性質逐漸回到塊材", W * 0.74, H * 0.72, { color: PL.col("text-faint"), size: 9, align: "center" });
          rSize.set(r, 0); rFrac.set(frac * 100, 0); rArea.set(3 / r, 2);
          rEffect.set(r < 10 ? "表面效應顯著" : r < 100 ? "尺寸效應明顯" : "接近塊材性質");
        }
      });
      const sizeS = PL.ui.slider(ui.L.controls, { label: "粒徑", min: 1, max: 200, step: 1, value: 10, unit: "nm", digits: 0 });
      PL.ui.note(ui.L.controls, "把粒徑縮小十倍，表面原子比例與比表面積都大幅上升。這就是奈米金為何不是金色、奈米觸媒為何特別活躍。");
      const chart = ui.chart("表面原子比例", "粒徑越小，表面原子占比越高；1 nm 時超過一半的原子都在表面。");
      const drawChart = () => {
        const f = x => PL.clamp(1 - Math.pow(Math.max(0, 1 - 0.3 / x), 3), 0, 1) * 100;
        CK.plot(chart, {
          x0: 1, x1: 200, y0: 0, y1: 100, xlabel: "粒徑 (nm)", ylabel: "表面原子 (%)",
          series: [{ fn: f, color: PL.col("accent") }],
          marks: [{ dot: [sizeS.get(), f(sizeS.get())], color: PL.col("accent-2"), label: "目前" }]
        });
      };
      chart.onResize(drawChart); drawChart();
      root.addEventListener("input", drawChart);
      const rSize = PL.ui.readout(ui.L.readouts, { label: "粒徑", unit: "nm" });
      const rFrac = PL.ui.readout(ui.L.readouts, { label: "表面原子比例", unit: "%" });
      const rArea = PL.ui.readout(ui.L.readouts, { label: "比表面積", unit: "nm⁻¹" });
      const rEffect = PL.ui.readout(ui.L.readouts, { label: "性質" });
      return { stop() { ui.stop(); } };
    }
  });

  const STAGES = [
    { name: "原水", turb: 0, germ: 0, note: "含懸浮物、膠體與微生物" },
    { name: "混凝", turb: 0.55, germ: 0.10, note: "加明礬或氯化鐵，使細小膠體聚集" },
    { name: "沉澱", turb: 0.80, germ: 0.30, note: "絮狀物下沉，清水從上層引出" },
    { name: "過濾", turb: 0.96, germ: 0.70, note: "砂濾移除細小懸浮固體" },
    { name: "消毒", turb: 0.97, germ: 0.9999, note: "加氯或臭氧殺菌，維持餘氯" }
  ];

  PL.register("water-treatment", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const idx = stageS.get(), st = STAGES[idx], raw = rawS.get();
          const turb = raw * (1 - st.turb);
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.88, H * 0.30, "淨水流程");
          STAGES.forEach((s, i) => {
            const x = W * (0.12 + i * 0.18);
            D.rect(ctx, x - 26, H * 0.20, 52, 30, {
              fill: i === idx ? PL.col("accent") : PL.theme.shade(0.55),
              stroke: i === idx ? PL.col("accent") : PL.col("border"), r: 6
            });
            D.text(ctx, s.name, x, H * 0.29, { color: i === idx ? "#10202a" : PL.col("text-dim"), size: 10, align: "center", weight: i === idx ? "700" : "400" });
            if (i < STAGES.length - 1) CK.arrow(ctx, x + 28, H * 0.25, x + 45, H * 0.25, PL.col("border"));
          });
          CK.panel(ctx, W * 0.06, H * 0.44, W * 0.88, H * 0.42, st.name + "：" + st.note);
          const barW = W * 0.66, bx = W * 0.17;
          D.text(ctx, "濁度", bx, H * 0.55, { color: PL.col("text-dim"), size: 10 });
          D.rect(ctx, bx, H * 0.57, barW, 12, { fill: PL.theme.shade(0.55), stroke: PL.col("border"), width: 1, r: 6 });
          D.rect(ctx, bx, H * 0.57, barW * PL.clamp(turb / 100, 0, 1), 12, { fill: turb > 10 ? "#ff8a65" : "#66bb6a", r: 6 });
          D.text(ctx, turb.toFixed(1) + " NTU", W * 0.86, H * 0.68, { color: PL.col("accent"), size: 14, align: "right", weight: "700" });
          D.text(ctx, "微生物去除 " + (st.germ * 100).toFixed(st.germ > 0.99 ? 2 : 0) + "%", bx, H * 0.77, { color: PL.col("text-dim"), size: 10 });
          D.text(ctx, idx === STAGES.length - 1 ? "出廠水需維持 0.2–1.0 mg/L 餘氯" : "下一階段繼續處理", bx, H * 0.83, { color: PL.col("text-faint"), size: 9 });
          rTurb.set(turb, 1); rGerm.set(st.germ * 100, st.germ > 0.99 ? 2 : 0); rStage.set(st.name);
          rChlor.set(idx === STAGES.length - 1 ? "有，需維持餘氯" : "尚未加氯");
        }
      });
      const stageS = PL.ui.slider(ui.L.controls, { label: "處理階段", min: 0, max: 4, step: 1, value: 4, digits: 0 });
      const rawS = PL.ui.slider(ui.L.controls, { label: "原水濁度", min: 5, max: 100, step: 5, value: 40, unit: "NTU", digits: 0 });
      PL.ui.note(ui.L.controls, "混凝不是把髒東西變不見，而是讓細小膠體聚成較大的絮狀物，之後才能沉澱與過濾。消毒放在最後，避免管線再汙染。");
      const rTurb = PL.ui.readout(ui.L.readouts, { label: "出水濁度", unit: "NTU" });
      const rGerm = PL.ui.readout(ui.L.readouts, { label: "微生物去除", unit: "%" });
      const rStage = PL.ui.readout(ui.L.readouts, { label: "目前階段" });
      const rChlor = PL.ui.readout(ui.L.readouts, { label: "餘氯" });
      return { stop() { ui.stop(); } };
    }
  });

  const POLLUTANTS = {
    pm25: { name: "PM2.5", base: 120, source: "燃煤、交通、工地揚塵", effect: "深入肺泡與血液，增加心血管風險", color: "#a1887f" },
    so2: { name: "SO₂", base: 80, source: "燃煤與石化燃料", effect: "刺激呼吸道，形成酸雨", color: "#ffb74d" },
    nox: { name: "NOₓ", base: 90, source: "汽機車高溫燃燒", effect: "形成光化學煙霧與硝酸", color: "#ba68c8" },
    ozone: { name: "O₃", base: 100, source: "NOₓ 與 VOCs 經日照生成", effect: "刺激眼睛與肺，屬二次汙染物", color: "#4db6ac" }
  };

  PL.register("air-pollution", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const p = POLLUTANTS[polSel.get()], wind = windS.get();
          const cut = (trafficChk.get() ? 0.25 : 0) + (desulfChk.get() ? 0.20 : 0) + (greenChk.get() ? 0.10 : 0) + (dustChk.get() ? 0.10 : 0);
          const aqi = Math.round(p.base * (1 - Math.min(0.55, cut)) * (1.15 - 0.5 * wind));
          const level = aqi < 50 ? "良好" : aqi < 100 ? "普通" : aqi < 150 ? "敏感族群不良" : aqi < 200 ? "不良" : "非常不良";
          const col = aqi < 50 ? "#66bb6a" : aqi < 100 ? "#ffd54f" : aqi < 150 ? "#ffb74d" : aqi < 200 ? "#ff8a65" : "#e57373";
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.54, H * 0.74, "空氣品質");
          const cx = W * 0.33, cy = H * 0.46, R = 64;
          D.disc(ctx, cx, cy, R, { fill: PL.theme.shade(0.55), stroke: PL.col("border") });
          ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R - 6, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * PL.clamp(aqi / 300, 0, 1)); ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.lineCap = "round"; ctx.stroke(); ctx.restore();
          D.text(ctx, String(aqi), cx, cy + 6, { color: col, size: 34, align: "center", weight: "700" });
          D.text(ctx, "AQI", cx, cy + 26, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, level, cx, cy + 54, { color: col, size: 13, align: "center", weight: "700" });
          D.text(ctx, p.name, cx, H * 0.68, { color: PL.col("accent"), size: 18, align: "center", weight: "700" });
          D.text(ctx, "主要來源：" + p.source, cx, H * 0.76, { color: PL.col("text-dim"), size: 9, align: "center" });
          CK.panel(ctx, W * 0.64, H * 0.09, W * 0.30, H * 0.74, "健康與防治");
          D.text(ctx, "健康影響", W * 0.79, H * 0.20, { color: PL.col("text-faint"), size: 9, align: "center" });
          const words = p.effect.split("，");
          words.forEach((w, i) => D.text(ctx, w, W * 0.79, H * 0.28 + i * H * 0.055, { color: PL.col("text-dim"), size: 9, align: "center" }));
          D.text(ctx, "減量措施", W * 0.79, H * 0.47, { color: PL.col("text-faint"), size: 9, align: "center" });
          D.text(ctx, cut > 0 ? "已減量 " + Math.round(Math.min(0.55, cut) * 100) + "%" : "尚未採取措施", W * 0.79, H * 0.56, { color: cut > 0 ? "#66bb6a" : "#ff8a65", size: 11, align: "center", weight: "700" });
          D.text(ctx, "風速 " + wind.toFixed(1), W * 0.79, H * 0.66, { color: PL.col("text-dim"), size: 10, align: "center" });
          D.text(ctx, wind > 0.6 ? "擴散條件較好" : "風弱，汙染物易累積", W * 0.79, H * 0.73, { color: PL.col("text-faint"), size: 9, align: "center" });
          rAQI.set(aqi, 0); rLevel.set(level); rSource.set(p.source); rEffect.set(p.effect); rCut.set(Math.min(0.55, cut) * 100, 0);
        }
      });
      const polSel = PL.ui.select(ui.L.controls, { label: "汙染物", value: "pm25", options: Object.keys(POLLUTANTS).map(k => ({ value: k, label: POLLUTANTS[k].name })) });
      const windS = PL.ui.slider(ui.L.controls, { label: "風速", min: 0, max: 1, step: 0.1, value: 0.3, digits: 1 });
      const trafficChk = PL.ui.checkbox(ui.L.controls, { label: "提升大眾運輸", checked: false });
      const desulfChk = PL.ui.checkbox(ui.L.controls, { label: "電廠脫硫", checked: false });
      const greenChk = PL.ui.checkbox(ui.L.controls, { label: "增加綠地", checked: false });
      const dustChk = PL.ui.checkbox(ui.L.controls, { label: "工地灑水", checked: false });
      PL.ui.note(ui.L.controls, "AQI 是綜合指標，不是單一濃度。臭氧是二次汙染物，必須從 NOₓ 與 VOCs 的源頭減量才有效。");
      const rAQI = PL.ui.readout(ui.L.readouts, { label: "空氣品質指標 AQI" });
      const rLevel = PL.ui.readout(ui.L.readouts, { label: "等級" });
      const rSource = PL.ui.readout(ui.L.readouts, { label: "主要來源" });
      const rEffect = PL.ui.readout(ui.L.readouts, { label: "健康影響" });
      const rCut = PL.ui.readout(ui.L.readouts, { label: "減量幅度", unit: "%" });
      return { stop() { ui.stop(); } };
    }
  });
})();
