/* 模組四 · 化學反應與計量 */
(function () {
  "use strict";
  const PL = window.PhysicsLab, CK = window.ChemLab, D = PL.draw;

  PL.register("balancing", {
    build(root) {
      const EQS = {
        water: { a: "H2", b: "O2", c: "H2O", answer: [2, 1, 2], name: "氫燃燒" },
        ammonia: { a: "N2", b: "H2", c: "NH3", answer: [1, 3, 2], name: "氨合成" },
        rust: { a: "Fe", b: "O2", c: "Fe2O3", answer: [4, 3, 2], name: "鐵生鏽" },
        alumina: { a: "Al", b: "O2", c: "Al2O3", answer: [4, 3, 2], name: "鋁氧化" },
        so3: { a: "SO2", b: "O2", c: "SO3", answer: [2, 1, 2], name: "三氧化硫" },
        hcl: { a: "H2", b: "Cl2", c: "HCl", answer: [1, 1, 2], name: "氯化氫合成" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = eqSel.get(), eq = EQS[key];
          const a = aS.get(), b = bS.get(), c = cS.get();
          /*
           * 係數 1 不寫、下標要真的小一號。
           * 「1 H2 + 1 O2 → 1 H2O」是程式陣列的長相，不是化學式；
           * 係數 1 省略、數字改下標，學生抄進筆記時才不會把 1 也抄進去。
           */
          const coef = n => n === 1 ? "" : n + " ";
          D.text(ctx, coef(a) + pretty(eq.a) + "  +  " + coef(b) + pretty(eq.b) + "  →  " + coef(c) + pretty(eq.c), W / 2, H * 0.20,
            { color: PL.col("text"), size: Math.min(22, W / 26), align: "center", weight: "700" });
          const left = countAtoms(eq.a, a), right = countAtoms(eq.c, c);
          addAtoms(left, countAtoms(eq.b, b));
          const els = [...new Set(Object.keys(left).concat(Object.keys(right)))];
          CK.panel(ctx, W * 0.10, H * 0.32, W * 0.80, H * 0.40, "原子數守恆檢查");
          D.text(ctx, "元素", W * 0.22, H * 0.40, { color: PL.col("text-faint"), size: 11, align: "center" });
          D.text(ctx, "反應物", W * 0.50, H * 0.40, { color: PL.col("text-faint"), size: 11, align: "center" });
          D.text(ctx, "生成物", W * 0.74, H * 0.40, { color: PL.col("text-faint"), size: 11, align: "center" });
          let ok = true;
          els.forEach((el, i) => {
            const y = H * 0.47 + i * 22, l = left[el] || 0, r = right[el] || 0;
            if (l !== r) ok = false;
            D.text(ctx, el, W * 0.22, y, { color: PL.col("text-dim"), size: 12, align: "center" });
            D.text(ctx, String(l), W * 0.50, y, { color: l === r ? PL.col("accent") : "#ff8a80", size: 13, align: "center", weight: "700" });
            D.text(ctx, String(r), W * 0.74, y, { color: l === r ? PL.col("accent") : "#ff8a80", size: 13, align: "center", weight: "700" });
            /*
             * 原子數用點畫出來，不是只有數字。
             *
             * 調整係數 a、b、c 時，畫面原本只換了幾個阿拉伯數字；
             * 改成點數後，「左邊 4 顆、右邊 3 顆」一眼就看得出還沒平衡，
             * 也看得出多加了幾顆——這正是平衡係數要教的事。
             */
            const nL = Math.min(12, Math.round(l)), nR = Math.min(12, Math.round(r));
            for (let k = 0; k < nL; k++) D.disc(ctx, W * 0.50 - (nL - 1) * 3.5 + k * 7, y + 9, 2.4, { fill: l === r ? PL.col("accent") : "#ff8a80" });
            for (let k = 0; k < nR; k++) D.disc(ctx, W * 0.74 - (nR - 1) * 3.5 + k * 7, y + 9, 2.4, { fill: l === r ? PL.col("accent") : "#ff8a80" });
          });
          if (!els.length) D.text(ctx, "—", W / 2, H * 0.50, { color: PL.col("text-faint"), size: 12, align: "center" });
          verdict.set(ok ? "已平衡：兩側原子數相等" : "尚未平衡：調整係數，不要改下標", ok ? "ok" : "warn");
          rCount.set(els.map(el => el + " " + (left[el] || 0) + ":" + (right[el] || 0)).join(" · "));
          rState.set(ok ? "平衡" : "未平衡");
        }
      });
      const eqSel = PL.ui.select(ui.L.controls, { label: "反應", value: "water", options: Object.keys(EQS).map(k => ({ value: k, label: EQS[k].name + "：" + pretty(EQS[k].a) + " + " + pretty(EQS[k].b) + " → " + pretty(EQS[k].c) })) });
      const aS = PL.ui.slider(ui.L.controls, { label: "係數 a", min: 1, max: 6, step: 1, value: 1, digits: 0 });
      const bS = PL.ui.slider(ui.L.controls, { label: "係數 b", min: 1, max: 6, step: 1, value: 1, digits: 0 });
      const cS = PL.ui.slider(ui.L.controls, { label: "係數 c", min: 1, max: 6, step: 1, value: 1, digits: 0 });
      const verdict = PL.ui.verdict(ui.L.controls, { label: "開始調整係數", tone: "info" });
      PL.ui.note(ui.L.controls, "先讓最複雜的分子係數為 1，再平衡其他元素。係數只能放在化學式前面，不能改動下標，否則物質就變了。");
      const rCount = PL.ui.readout(ui.L.readouts, { label: "原子數（左:右）" });
      const rState = PL.ui.readout(ui.L.readouts, { label: "平衡狀態" });
      return { stop() { ui.stop(); } };
    }
  });

  // 顯示用：把化學式裡的數字換成下標（Fe2O3 → Fe₂O₃），解析仍用原本的 ASCII。
  function pretty(formula) {
    return String(formula).replace(/\d/g, d => "₀₁₂₃₄₅₆₇₈₉"[+d]);
  }

  function countAtoms(formula, coefficient) {
    const out = {};
    const re = /([A-Z][a-z]?)(\d*)/g;
    let m;
    while ((m = re.exec(formula))) {
      const n = m[2] ? parseInt(m[2], 10) : 1;
      out[m[1]] = (out[m[1]] || 0) + n * coefficient;
    }
    return out;
  }
  function addAtoms(target, src) { Object.keys(src).forEach(k => target[k] = (target[k] || 0) + src[k]); }

  PL.register("reaction-types", {
    build(root) {
      const TYPES = {
        combine: {
          name: "化合反應", eq: "A + B → AB", example: "2H₂ + O₂ → 2H₂O", energy: "通常放熱",
          left: ["H₂", "O₂"], right: ["H₂O"], note: "兩種以上物質結合成一種新物質"
        },
        decompose: {
          name: "分解反應", eq: "AB → A + B", example: "2H₂O₂ → 2H₂O + O₂", energy: "通常吸熱或需催化",
          left: ["H₂O₂"], right: ["H₂O", "O₂"], note: "一種物質分解成兩種以上物質"
        },
        single: {
          name: "單取代反應", eq: "A + BC → AC + B", example: "Zn + CuSO₄ → ZnSO₄ + Cu", energy: "由活性決定",
          left: ["Zn", "CuSO₄"], right: ["ZnSO₄", "Cu"], note: "活性大的元素把活性小的元素置換出來"
        },
        double: {
          name: "雙取代反應", eq: "AB + CD → AD + CB", example: "AgNO₃ + NaCl → AgCl↓ + NaNO₃", energy: "常有沉澱或氣體",
          left: ["AgNO₃", "NaCl"], right: ["AgCl↓", "NaNO₃"], note: "兩種化合物交換成分，常生成沉澱"
        }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = typeSel.get(), t = TYPES[key];
          CK.panel(ctx, W * 0.06, H * 0.10, W * 0.88, H * 0.76, t.name);
          D.text(ctx, t.eq, W / 2, H * 0.26, { color: PL.col("accent"), size: 18, align: "center", weight: "700" });
          const drawGroup = (items, x0, tint) => {
            items.forEach((item, i) => {
              const x = x0 + i * W * 0.14;
              D.disc(ctx, x, H * 0.46, 26, { fill: tint, stroke: "rgba(0,0,0,0.2)" });
              D.text(ctx, item, x, H * 0.46 + 4, { color: "#18202b", size: 10, align: "center", weight: "700" });
            });
          };
          drawGroup(t.left, W * 0.20, "#8fd0ff");
          D.arrow(ctx, W * 0.42, H * 0.46, W * 0.56, H * 0.46, { color: PL.col("accent"), width: 2.4 });
          drawGroup(t.right, W * 0.68, "#a5d6a7");
          D.text(ctx, t.example, W / 2, H * 0.64, { color: PL.col("text-dim"), size: 13, align: "center" });
          D.text(ctx, t.note, W / 2, H * 0.73, { color: PL.col("text-faint"), size: 11, align: "center" });
          D.text(ctx, t.energy, W / 2, H * 0.82, { color: PL.col("accent-2"), size: 12, align: "center" });
          rType.set(t.name); rEx.set(t.example); rEnergy.set(t.energy); rNote.set(t.note);
        }
      });
      const typeSel = PL.ui.select(ui.L.controls, { label: "反應類型", value: "combine", options: Object.keys(TYPES).map(k => ({ value: k, label: TYPES[k].name })) });
      PL.ui.note(ui.L.controls, "分類的目的是預測產物。看到「A + BC」先想單取代；看到兩種溶液混合，先檢查是否生成沉澱。");
      const rType = PL.ui.readout(ui.L.readouts, { label: "類型" });
      const rEx = PL.ui.readout(ui.L.readouts, { label: "例子" });
      const rEnergy = PL.ui.readout(ui.L.readouts, { label: "能量" });
      const rNote = PL.ui.readout(ui.L.readouts, { label: "辨識重點" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("mole-ratio", {
    build(root) {
      const RXNS = {
        water: { name: "2H₂ + O₂ → 2H₂O", coefA: 2, coefB: 1, a: "H₂", b: "H₂O", Ma: 2.02, Mb: 18.02 },
        ammonia: { name: "N₂ + 3H₂ → 2NH₃", coefA: 1, coefB: 2, a: "N₂", b: "NH₃", Ma: 28.02, Mb: 17.03 },
        rust: { name: "4Fe + 3O₂ → 2Fe₂O₃", coefA: 4, coefB: 2, a: "Fe", b: "Fe₂O₃", Ma: 55.85, Mb: 159.69 }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = rxnSel.get(), r = RXNS[key], nA = molS.get();
          const nB = nA * r.coefB / r.coefA;
          const mB = nB * r.Mb;
          CK.panel(ctx, W * 0.08, H * 0.12, W * 0.84, H * 0.30, r.name);
          D.text(ctx, r.a + "  " + nA.toFixed(2) + " mol", W * 0.30, H * 0.28, { color: PL.col("text-dim"), size: 14, align: "center" });
          D.text(ctx, "× " + r.coefB + "/" + r.coefA, W / 2, H * 0.28, { color: PL.col("accent"), size: 14, align: "center", weight: "700" });
          D.text(ctx, r.b + "  " + nB.toFixed(2) + " mol", W * 0.72, H * 0.28, { color: PL.col("accent-2"), size: 14, align: "center" });
          CK.panel(ctx, W * 0.08, H * 0.50, W * 0.84, H * 0.34, "質量換算");
          CK.balance(ctx, W * 0.30, H * 0.80, mB.toFixed(2), "g");
          D.text(ctx, "m = n × M", W * 0.68, H * 0.62, { color: PL.col("text-dim"), size: 13, align: "center" });
          D.text(ctx, nB.toFixed(2) + " mol × " + r.Mb + " g/mol", W * 0.68, H * 0.70, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "= " + mB.toFixed(2) + " g", W * 0.68, H * 0.78, { color: PL.col("accent"), size: 18, align: "center", weight: "700" });
          rNA.set(nA, 2); rNB.set(nB, 2); rMass.set(mB, 2); rRatio.set(r.coefB + " / " + r.coefA);
        }
      });
      const rxnSel = PL.ui.select(ui.L.controls, { label: "反應", value: "water", options: Object.keys(RXNS).map(k => ({ value: k, label: RXNS[k].name })) });
      const molS = PL.ui.slider(ui.L.controls, { label: "反應物莫耳數", min: 0.1, max: 5, step: 0.1, value: 1, unit: "mol", digits: 1 });
      PL.ui.note(ui.L.controls, "係數比就是莫耳比。把莫耳數乘上係數比得到生成物莫耳數，再乘莫耳質量就是可以秤到的質量。");
      const rNA = PL.ui.readout(ui.L.readouts, { label: "反應物莫耳數", unit: "mol" });
      const rNB = PL.ui.readout(ui.L.readouts, { label: "生成物莫耳數", unit: "mol" });
      const rMass = PL.ui.readout(ui.L.readouts, { label: "生成物質量", unit: "g" });
      const rRatio = PL.ui.readout(ui.L.readouts, { label: "莫耳比" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("limiting-reagent", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const nA = aS.get(), nB = bS.get();
          const ratioA = nA / 2, ratioB = nB / 3;
          const lim = ratioA < ratioB ? "A" : "B";
          const product = Math.min(ratioA, ratioB);
          const leftoverA = Math.max(0, nA - product * 2), leftoverB = Math.max(0, nB - product * 3);
          CK.panel(ctx, W * 0.06, H * 0.10, W * 0.88, H * 0.78, "2A + 3B → C");
          // 反應物條
          const bar = (label, value, max, y, color) => {
            D.text(ctx, label, W * 0.16, y + 5, { color: PL.col("text-dim"), size: 12, align: "right" });
            D.rect(ctx, W * 0.18, y - 8, W * 0.62, 18, { fill: "rgba(140,160,180,0.12)", r: 4 });
            D.rect(ctx, W * 0.18, y - 8, W * 0.62 * PL.clamp(value / max, 0, 1), 18, { fill: color, r: 4 });
            D.text(ctx, value.toFixed(2), W * 0.83, y + 5, { color: PL.col("text-dim"), size: 11 });
          };
          bar("A（mol）", nA, 10, H * 0.25, lim === "A" ? "#ff8a80" : "#7aa5d9");
          bar("B（mol）", nB, 15, H * 0.34, lim === "B" ? "#ff8a80" : "#7aa5d9");
          D.text(ctx, "限量試劑：" + (lim === "A" ? "A" : "B"), W / 2, H * 0.48, { color: "#ff8a80", size: 17, align: "center", weight: "700" });
          D.text(ctx, "生成物 C：" + product.toFixed(2) + " mol", W / 2, H * 0.57, { color: PL.col("accent"), size: 15, align: "center" });
          D.text(ctx, "剩餘 A " + leftoverA.toFixed(2) + " mol　剩餘 B " + leftoverB.toFixed(2) + " mol", W / 2, H * 0.66, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "先換成莫耳，再除以係數，商最小者為限量試劑。", W / 2, H * 0.82, { color: PL.col("text-faint"), size: 11, align: "center" });
          rLim.set(lim === "A" ? "A" : "B"); rProd.set(product, 2); rLeftA.set(leftoverA, 2); rLeftB.set(leftoverB, 2);
        }
      });
      const aS = PL.ui.slider(ui.L.controls, { label: "A 的莫耳數", min: 0, max: 10, step: 0.1, value: 4, unit: "mol", digits: 1 });
      const bS = PL.ui.slider(ui.L.controls, { label: "B 的莫耳數", min: 0, max: 15, step: 0.1, value: 6, unit: "mol", digits: 1 });
      PL.ui.note(ui.L.controls, "把 A 固定在 4 mol，慢慢增加 B：一開始 B 是限量試劑，產量隨 B 增加；B 超過 6 mol 後，A 用完，產量不再上升。");
      const rLim = PL.ui.readout(ui.L.readouts, { label: "限量試劑" });
      const rProd = PL.ui.readout(ui.L.readouts, { label: "生成物 C", unit: "mol" });
      const rLeftA = PL.ui.readout(ui.L.readouts, { label: "剩餘 A", unit: "mol" });
      const rLeftB = PL.ui.readout(ui.L.readouts, { label: "剩餘 B", unit: "mol" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("yield", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const actual = actualS.get(), theoVal = theo.get();
          const pct = Math.min(140, actual / theoVal * 100);
          CK.panel(ctx, W * 0.08, H * 0.12, W * 0.84, H * 0.70, "百分產率");
          const cx = W / 2, cy = H * 0.40, R = Math.min(W, H) * 0.22;
          D.disc(ctx, cx, cy, R, { stroke: PL.col("border"), width: 12 });
          ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.min(1, pct / 100) * PL.TAU);
          ctx.strokeStyle = pct > 100 ? "#ff8a80" : pct > 80 ? "#66bb6a" : "#ffb74d"; ctx.lineWidth = 12; ctx.stroke(); ctx.restore();
          D.text(ctx, pct.toFixed(1) + "%", cx, cy + 8, { color: PL.col("accent"), size: 26, align: "center", weight: "700" });
          D.text(ctx, "實際 " + actual.toFixed(1) + " g / 理論 " + theoVal.toFixed(1) + " g", W / 2, H * 0.68, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, pct > 100 ? "超過 100%：可能含雜質或秤重誤差" : pct > 80 ? "產率良好" : "產率偏低：檢查損失與反應不完全", W / 2, H * 0.78,
            { color: pct > 100 ? "#ff8a80" : PL.col("text-faint"), size: 11, align: "center" });
          rPct.set(pct, 1); rActual.set(actual, 1); rTheo.set(theoVal, 1); rNote.set(pct > 100 ? "檢查純度" : pct > 80 ? "良好" : "偏低");
        }
      });
      const actualS = PL.ui.slider(ui.L.controls, { label: "實際產量", min: 0, max: 20, step: 0.1, value: 7.2, unit: "g", digits: 1 });
      const theoS = PL.ui.slider(ui.L.controls, { label: "理論產量", min: 1, max: 20, step: 0.1, value: 9.0, unit: "g", digits: 1 });
      const theo = { get: () => theoS.get() };
      PL.ui.note(ui.L.controls, "理論產量由限量試劑算出，是上限。實際產量通常較低，因為有轉移損失、副反應或反應未完全。");
      const rPct = PL.ui.readout(ui.L.readouts, { label: "百分產率", unit: "%" });
      const rActual = PL.ui.readout(ui.L.readouts, { label: "實際產量", unit: "g" });
      const rTheo = PL.ui.readout(ui.L.readouts, { label: "理論產量", unit: "g" });
      const rNote = PL.ui.readout(ui.L.readouts, { label: "判讀" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("precipitation", {
    build(root) {
      const PAIRS = {
        agcl: { a: "AgNO₃", b: "NaCl", p: "AgCl", color: "#eef4f9", ion: "Ag⁺ + Cl⁻ → AgCl↓", note: "白色沉澱，遇光變黑" },
        baso4: { a: "BaCl₂", b: "Na₂SO₄", p: "BaSO₄", color: "#eef4f9", ion: "Ba²⁺ + SO₄²⁻ → BaSO₄↓", note: "白色沉澱，不溶於酸" },
        pbi2: { a: "Pb(NO₃)₂", b: "KI", p: "PbI₂", color: "#fdd835", ion: "Pb²⁺ + 2I⁻ → PbI₂↓", note: "黃色沉澱" },
        caco3: { a: "CaCl₂", b: "Na₂CO₃", p: "CaCO₃", color: "#eef4f9", ion: "Ca²⁺ + CO₃²⁻ → CaCO₃↓", note: "白色沉澱，遇酸冒泡" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = pairSel.get(), p = PAIRS[key], drops = dropS.get();
          const cx = W * 0.40, base = H * 0.74;
          CK.beaker(ctx, cx, base, 150, 150, 0.60, "#8fc6e8");
          CK.burette(ctx, cx, H * 0.08, H * 0.46, 1 - drops / 100, "#cfe8ff");
          if (drops > 0) for (let i = 0; i < 18; i++) {
            const x = cx - 50 + (i * 37 % 100), y = base - 30 - (i * 29 % 70);
            D.disc(ctx, x, y, 2 + drops / 40, { fill: p.color, glow: p.color, glowSize: 3 });
          }
          D.text(ctx, p.a + " + " + p.b, W * 0.72, H * 0.28, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.arrow(ctx, W * 0.72, H * 0.33, W * 0.72, H * 0.40, { color: PL.col("accent"), width: 2 });
          D.text(ctx, p.p + "↓", W * 0.72, H * 0.47, { color: PL.col("accent"), size: 18, align: "center", weight: "700" });
          D.text(ctx, p.ion, W * 0.72, H * 0.56, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, p.note, W * 0.72, H * 0.63, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, "滴入 " + drops + "%", W * 0.72, H * 0.73, { color: PL.col("text-dim"), size: 12, align: "center" });
          rPrecip.set(p.p); rIon.set(p.ion); rNote.set(p.note);
        }
      });
      const pairSel = PL.ui.select(ui.L.controls, { label: "反應組合", value: "agcl", options: Object.keys(PAIRS).map(k => ({ value: k, label: PAIRS[k].a + " + " + PAIRS[k].b })) });
      const dropS = PL.ui.slider(ui.L.controls, { label: "滴入量", min: 0, max: 100, step: 5, value: 50, unit: "%", digits: 0 });
      PL.ui.note(ui.L.controls, "沉澱反應的淨離子式只寫實際參與的離子。Na⁺、NO₃⁻ 這類旁觀離子留在溶液中，不寫進去。");
      const rPrecip = PL.ui.readout(ui.L.readouts, { label: "沉澱" });
      const rIon = PL.ui.readout(ui.L.readouts, { label: "淨離子式" });
      const rNote = PL.ui.readout(ui.L.readouts, { label: "外觀" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("gas-stoich", {
    build(root) {
      const RXNS = {
        hcl: { name: "H₂ + Cl₂ → 2HCl", coefA: 1, coefB: 2, a: "H₂", b: "HCl" },
        nh3: { name: "N₂ + 3H₂ → 2NH₃", coefA: 1, coefB: 2, a: "N₂", b: "NH₃" },
        water: { name: "2H₂ + O₂ → 2H₂O", coefA: 2, coefB: 2, a: "H₂", b: "H₂O" },
        co2: { name: "CH₄ + 2O₂ → CO₂ + 2H₂O", coefA: 1, coefB: 1, a: "CH₄", b: "CO₂" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = rxnSel.get(), r = RXNS[key], VA = volS.get();
          const VB = VA * r.coefB / r.coefA;
          CK.panel(ctx, W * 0.08, H * 0.12, W * 0.84, H * 0.32, r.name);
          D.text(ctx, "同溫同壓下，體積比 = 莫耳比", W / 2, H * 0.30, { color: PL.col("text-dim"), size: 12, align: "center" });
          const drawGas = (x, y, label, vol, color) => {
            D.rect(ctx, x - 38, y - 30, 76, 60, { fill: "rgba(120,180,220,0.12)", stroke: "rgba(160,210,240,0.5)", r: 6 });
            for (let i = 0; i < Math.min(18, Math.round(vol * 2)); i++) D.disc(ctx, x - 26 + (i * 13 % 52), y - 20 + (i * 17 % 40), 2.6, { fill: color });
            D.text(ctx, label, x, y + 44, { color: PL.col("text-dim"), size: 12, align: "center" });
            D.text(ctx, vol.toFixed(1) + " L", x, y + 60, { color: PL.col("accent"), size: 12, align: "center", weight: "700" });
          };
          drawGas(W * 0.28, H * 0.50, r.a, VA, "#8fd0ff");
          D.text(ctx, "→", W / 2, H * 0.50, { color: PL.col("text-dim"), size: 22, align: "center" });
          drawGas(W * 0.72, H * 0.50, r.b, VB, "#a5d6a7");
          rVA.set(VA, 1); rVB.set(VB, 1); rRatio.set(r.coefB + " : " + r.coefA);
        }
      });
      const rxnSel = PL.ui.select(ui.L.controls, { label: "氣體反應", value: "hcl", options: Object.keys(RXNS).map(k => ({ value: k, label: RXNS[k].name })) });
      const volS = PL.ui.slider(ui.L.controls, { label: "反應物體積", min: 1, max: 10, step: 0.5, value: 2, unit: "L", digits: 1 });
      PL.ui.note(ui.L.controls, "同溫同壓下，氣體體積與莫耳數成正比，所以可以直接用係數比換算體積。若溫度或壓力改變，體積也會跟著變。");
      const rVA = PL.ui.readout(ui.L.readouts, { label: "反應物體積", unit: "L" });
      const rVB = PL.ui.readout(ui.L.readouts, { label: "生成物體積", unit: "L" });
      const rRatio = PL.ui.readout(ui.L.readouts, { label: "體積比" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("thermochemical", {
    build(root) {
      const RXNS = {
        combustion: { name: "甲烷燃燒", eq: "CH₄ + 2O₂ → CO₂ + 2H₂O", dh: -890, note: "放熱，生成物能量較低" },
        neutral: { name: "強酸強鹼中和", eq: "H⁺ + OH⁻ → H₂O", dh: -57, note: "放熱，主要來自水的生成" },
        dissolve: { name: "硝酸銨溶解", eq: "NH₄NO₃(s) → NH₄⁺(aq) + NO₃⁻(aq)", dh: 25, note: "吸熱，溶液變冷" },
        photosynthesis: { name: "光合作用", eq: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", dh: 2803, note: "吸熱，需要光能" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.56,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = rxnSel.get(), r = RXNS[key], endo = r.dh > 0;
          const dhN = Math.max(-0.42, Math.min(0.42, r.dh / 3000));
          CK.panel(ctx, W * 0.06, H * 0.10, W * 0.88, H * 0.74, r.name);
          CK.energyProfile(ctx, { x: W * 0.18, y: H * 0.24, w: W * 0.64, h: H * 0.48 }, {
            dh: dhN, ea: 0.40, reactLabel: "反應物", prodLabel: "生成物", color: endo ? "#ffb74d" : "#66bb6a",
            dhLabel: false   // 下方已有大字 ΔH，圖上不再重複
          });
          D.text(ctx, "ΔH = " + (endo ? "+" : "") + r.dh + " kJ/mol", W / 2, H * 0.82, { color: endo ? "#ffb74d" : "#66bb6a", size: 17, align: "center", weight: "700" });
          D.text(ctx, r.note, W / 2, H * 0.90, { color: PL.col("text-dim"), size: 11, align: "center" });
          rDH.set(r.dh, 0); rType.set(endo ? "吸熱" : "放熱"); rEq.set(r.eq);
        }
      });
      const rxnSel = PL.ui.select(ui.L.controls, { label: "反應", value: "combustion", options: Object.keys(RXNS).map(k => ({ value: k, label: RXNS[k].name })) });
      PL.ui.note(ui.L.controls, "能量圖只看初末高度差。放熱反應的生成物在較低能量，差值以熱的形式放出；吸熱則相反。");
      const rDH = PL.ui.readout(ui.L.readouts, { label: "ΔH", unit: "kJ/mol" });
      const rType = PL.ui.readout(ui.L.readouts, { label: "反應類型" });
      const rEq = PL.ui.readout(ui.L.readouts, { label: "反應式" });
      return { stop() { ui.stop(); } };
    }
  });
})();
