/* 模組一 · 物質的組成與計量 */
(function () {
  "use strict";
  const PL = window.PhysicsLab, CK = window.ChemLab, D = PL.draw;

  /* 粒子模型與三態 */
  PL.register("particle-model", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.64, animate: true,
        draw(dt, t) {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const state = selState.get();
          const temp = tempS.get();
          const stateName = state === "solid" ? "固態" : state === "liquid" ? "液態" : "氣態";
          const melt = state === "solid" ? 0 : 1;
          CK.panel(ctx, W * 0.10, H * 0.12, W * 0.80, H * 0.70, "同一群粒子的三種排列");
          CK.particleBox(ctx, { x: W * 0.13, y: H * 0.20, w: W * 0.74, h: H * 0.52 }, {
            state, temp: temp / 100, count: 54, seed: 11, time: t,
            color: state === "gas" ? "#8fd0ff" : state === "liquid" ? "#5eb8f0" : "#4a9fd8"
          });
          D.text(ctx, stateName + " · " + temp + " °C", W / 2, H * 0.86, { color: CK.phColor(7), size: 18, align: "center", weight: "700" });
          /*
           * 狀態是手動選的，溫度是獨立的滑桿，兩者可能互相矛盾。
           * 「液態 · 130 °C」在 1 atm 下不存在；不講清楚，學生會把
           * 「把溫度拉到 130 °C，水還是液態」當成正確結論。
           * 保留手動切換（比較三態排列要用），但矛盾時直接說明。
           */
          const mismatch = (state === "liquid" && temp >= 100)
            || (state === "solid" && temp > 0)
            || (state === "gas" && temp < 100);
          const hint = mismatch
            ? "1 atm 下水 0 °C 熔化、100 °C 沸騰；這裡固定排列方便比較"
            : state === "solid" ? "粒子只在固定位置振動" : state === "liquid" ? "粒子可滑動但仍彼此靠近" : "粒子間距大、自由快速移動";
          D.text(ctx, hint, W / 2, H * 0.93, { color: mismatch ? PL.col("warn") : PL.col("text-dim"), size: 12, align: "center" });
          rState.set(stateName);
          rMove.set(state === "solid" ? "振動" : state === "liquid" ? "滑動" : "自由移動");
          rSpace.set(state === "solid" ? "最小" : state === "liquid" ? "中等" : "最大");
          rTemp.set(temp, 0);
        }
      });
      const tempS = PL.ui.slider(ui.L.controls, { label: "溫度", min: -20, max: 150, step: 5, value: 25, unit: "°C", digits: 0 });
      const selState = PL.ui.select(ui.L.controls, {
        label: "狀態", value: "liquid",
        options: [{ value: "solid", label: "固態（冰）" }, { value: "liquid", label: "液態（水）" }, { value: "gas", label: "氣態（水蒸氣）" }]
      });
      PL.ui.note(ui.L.controls, "先切到固態，慢慢升溫：粒子沒有消失，只是振動變大、排列鬆開。再切到氣態，比較粒子間距與運動速度。");
      const rState = PL.ui.readout(ui.L.readouts, { label: "狀態" });
      const rMove = PL.ui.readout(ui.L.readouts, { label: "粒子運動" });
      const rSpace = PL.ui.readout(ui.L.readouts, { label: "粒子間距" });
      const rTemp = PL.ui.readout(ui.L.readouts, { label: "溫度", unit: "°C" });
      PL.ui.presets(ui.L.controls, { label: "情境", options: [
        { label: "冰", apply: () => { selState.set("solid"); tempS.set(-10); } },
        { label: "水", apply: () => { selState.set("liquid"); tempS.set(25); } },
        { label: "水蒸氣", apply: () => { selState.set("gas"); tempS.set(120); } }
      ] });
      return { stop() { ui.stop(); } };
    }
  });

  /* 密度與物質鑑定 */
  PL.register("density-lab", {
    build(root) {
      const METALS = {
        aluminum: { name: "鋁", rho: 2.70, color: "#b8c2cc" },
        iron: { name: "鐵", rho: 7.87, color: "#8b8f96" },
        copper: { name: "銅", rho: 8.96, color: "#c07a45" },
        lead: { name: "鉛", rho: 11.34, color: "#6f7883" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.60,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = metalSel.get(), metal = METALS[key];
          const v = volS.get(), rho = metal.rho, m = rho * v;
          // 電子天平
          CK.balance(ctx, W * 0.28, H * 0.76, m.toFixed(2), "g");
          // 量筒
          const cx = W * 0.66, top = H * 0.20, bot = H * 0.70, w = 74;
          D.rect(ctx, cx - w / 2, top, w, bot - top, { fill: "rgba(180,220,240,0.10)", stroke: "rgba(180,220,240,0.6)", r: 4 });
          const waterH = 55 + v * 0.9;
          D.rect(ctx, cx - w / 2 + 3, bot - waterH, w - 6, waterH, { fill: "rgba(90,170,220,0.45)" });
          D.line(ctx, cx - w / 2 + 3, bot - waterH, cx + w / 2 - 3, bot - waterH, "rgba(220,244,255,0.8)", 2);
          // 金屬塊
          D.rect(ctx, cx - 26, bot - waterH + 6, 52, 34, { fill: metal.color, stroke: "rgba(0,0,0,0.3)", r: 3 });
          D.text(ctx, key === "aluminum" ? "Al" : key === "iron" ? "Fe" : key === "copper" ? "Cu" : "Pb", cx, bot - waterH + 28, { color: "#1b222b", size: 13, align: "center", weight: "700" });
          // 刻度
          for (let i = 0; i <= 10; i++) {
            const y = bot - (bot - top) * i / 10;
            D.line(ctx, cx + w / 2 + 2, y, cx + w / 2 + (i % 5 === 0 ? 14 : 8), y, PL.col("text-faint"), 1);
            if (i % 5 === 0) D.text(ctx, String(i * 10), cx + w / 2 + 18, y + 4, { color: PL.col("text-faint"), size: 9 });
          }
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.36, H * 0.26, "排水法");
          D.text(ctx, "V物 = V後 − V前", W * 0.24, H * 0.22, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "V前 = 50 mL", W * 0.24, H * 0.28, { color: PL.col("text-faint"), size: 11, align: "center" });
          rM.set(m, 1); rV.set(v, 0); rRho.set(rho, 2);
          rGuess.set(metal.name);
          rSlope.set(m.toFixed(1) + " / " + v);
        }
      });
      const metalSel = PL.ui.select(ui.L.controls, { label: "金屬", value: "aluminum", options: [
        { value: "aluminum", label: "鋁" }, { value: "iron", label: "鐵" }, { value: "copper", label: "銅" }, { value: "lead", label: "鉛" }
      ] });
      const volS = PL.ui.slider(ui.L.controls, { label: "金屬體積", min: 10, max: 80, step: 5, value: 30, unit: "cm³", digits: 0 });
      PL.ui.note(ui.L.controls, "量筒先裝 50 mL 水，放入金屬塊後水位上升。上升的體積就是金屬塊體積；質量除以體積得到密度。");
      PL.ui.procedure(ui.L.controls, {
        title: "排水法步驟",
        steps: [
          "量筒先裝 50 mL 水，讀出 <b>V前</b>。",
          "放入金屬塊，確認完全沒入，讀出 <b>V後</b>。",
          "以天平量質量 <b>m</b>，算出 <b>V物 = V後 − V前</b>。",
          "代入 <b>ρ = m / V物</b>，和密度表比對金屬種類。"
        ],
        rule: "金屬塊要完全沒入且不能濺出水；表面附著氣泡會讓 V後 偏大，算出的密度偏小。"
      });
      const rM = PL.ui.readout(ui.L.readouts, { label: "質量 m", unit: "g" });
      const rV = PL.ui.readout(ui.L.readouts, { label: "體積 V", unit: "cm³" });
      const rRho = PL.ui.readout(ui.L.readouts, { label: "密度 ρ", unit: "g/cm³" });
      const rGuess = PL.ui.readout(ui.L.readouts, { label: "比對結果" });
      const rSlope = PL.ui.readout(ui.L.readouts, { label: "m / V" });
      const chart = ui.chart("質量與體積", "同一種金屬的 m–V 圖是一條過原點的直線，斜率就是密度。換金屬後斜率改變，但仍是直線。");
      const drawChart = () => {
        const key = metalSel.get();
        CK.plot(chart, {
          x0: 0, x1: 80, y0: 0, y1: 12 * 90,
          xlabel: "V (cm³)", ylabel: "m (g)",
          series: [{ fn: x => METALS[key].rho * x, color: PL.col("accent") }],
          marks: [{ dot: [volS.get(), METALS[key].rho * volS.get()], color: PL.col("accent-2"), label: "目前" }]
        });
      };
      chart.onResize(drawChart);
      drawChart();
      root.addEventListener("input", drawChart);
      return { stop() { ui.stop(); } };
    }
  });

  /* 混合物與分離方法 */
  PL.register("mixtures", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.60,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const method = methodSel.get();
          const cx = W * 0.5, base = H * 0.72;
          // 原混合物：水＋砂＋鹽
          CK.flask(ctx, W * 0.24, base, 120, 150, 0.68, "#7fb6d9");
          for (let i = 0; i < 20; i++) {
            const x = W * 0.24 - 48 + (i * 37 % 96), y = base - 24 - (i * 53 % 70);
            D.disc(ctx, x, y, 3.2, { fill: "#b08a5a" });
          }
          D.text(ctx, "水＋砂＋食鹽", W * 0.24, base + 20, { color: PL.col("text-dim"), size: 11, align: "center" });
          // 方法裝置
          if (method === "filter") {
            // 漏斗
            D.rect(ctx, W * 0.47, H * 0.30, 150, 8, { fill: "#c9d6e2", r: 3 });
            D.line(ctx, W * 0.50, H * 0.31, W * 0.545, H * 0.48, PL.col("text-dim"), 2);
            D.line(ctx, W * 0.59, H * 0.31, W * 0.545, H * 0.48, PL.col("text-dim"), 2);
            D.line(ctx, W * 0.545, H * 0.48, W * 0.545, H * 0.56, PL.col("text-dim"), 2);
            CK.testTube(ctx, W * 0.545, H * 0.78, 54, 150, 0.45, "#8fc6e8");
            D.text(ctx, "濾液（食鹽水）", W * 0.545, H * 0.82, { color: PL.col("text-dim"), size: 11, align: "center" });
            D.text(ctx, "濾紙上留下砂", W * 0.545, H * 0.27, { color: PL.col("text-dim"), size: 11, align: "center" });
            D.text(ctx, "砂不溶於水，被濾紙截留；食鹽溶於水，隨濾液通過。", W * 0.5, H * 0.93, { color: PL.col("text-faint"), size: 11, align: "center" });
          } else if (method === "distill") {
            // 蒸餾瓶＋冷凝管
            CK.flask(ctx, W * 0.42, base, 110, 130, 0.55, "#8fc6e8");
            CK.burner(ctx, W * 0.42, base + 6, 1);
            D.line(ctx, W * 0.47, H * 0.44, W * 0.66, H * 0.40, PL.col("text-dim"), 5);
            D.line(ctx, W * 0.66, H * 0.40, W * 0.74, H * 0.56, PL.col("text-dim"), 5);
            CK.testTube(ctx, W * 0.76, H * 0.78, 52, 130, 0.5, "#9fd3ef");
            D.text(ctx, "冷凝收集的水", W * 0.76, H * 0.82, { color: PL.col("text-dim"), size: 11, align: "center" });
            D.text(ctx, "加熱使水汽化，再冷凝收集；砂與鹽留在瓶底。", W * 0.5, H * 0.93, { color: PL.col("text-faint"), size: 11, align: "center" });
          } else {
            // 結晶：蒸發皿
            D.rect(ctx, W * 0.42, H * 0.56, 150, 18, { fill: "#b7c4d1", r: 5 });
            D.rect(ctx, W * 0.44, H * 0.50, 134, 8, { fill: "#d7e2ec", r: 3 });
            CK.burner(ctx, W * 0.50, H * 0.78, 1);
            for (let i = 0; i < 12; i++) {
              const x = W * 0.45 + (i * 29 % 120), y = H * 0.52 - (i % 3) * 3;
              D.rect(ctx, x, y, 5, 5, { fill: "#eef4f9", stroke: "#9fb2c4", angle: i });
            }
            D.text(ctx, "加熱蒸發水分，食鹽結晶析出", W * 0.50, H * 0.93, { color: PL.col("text-faint"), size: 11, align: "center" });
          }
          rMethod.set(method === "filter" ? "過濾" : method === "distill" ? "蒸餾" : "結晶");
          rSep.set(method === "filter" ? "砂 / 食鹽水" : method === "distill" ? "水 / 溶質" : "食鹽 / 水");
          rWhy.set(method === "filter" ? "溶解度差異（不溶 vs 可溶）" : method === "distill" ? "沸點差異" : "溶解度隨溫度變化");
        }
      });
      const methodSel = PL.ui.select(ui.L.controls, { label: "分離方法", value: "filter", options: [
        { value: "filter", label: "過濾" }, { value: "distill", label: "蒸餾" }, { value: "crystal", label: "結晶" }
      ] });
      PL.ui.note(ui.L.controls, "三種方法都只利用物理性質，不改變物質本身。依混合物中顆粒大小、沸點或溶解度差異選擇。");
      PL.ui.procedure(ui.L.controls, {
        title: "選分離方法",
        steps: [
          "先判斷混合物裡有哪些成分、各是什麼狀態。",
          "不溶於液的固體 → <b>過濾</b>；互溶但沸點差很大 → <b>蒸餾</b>。",
          "溶解度隨溫度明顯變化 → <b>結晶</b>。",
          "確認分離前後物質本身沒有變成新物質。"
        ],
        rule: "過濾時濾紙邊緣要低於漏斗口、漏斗頸緊貼燒杯內壁；蒸餾冷凝水要下進上出，否則冷凝管會充滿氣泡。"
      });
      const rMethod = PL.ui.readout(ui.L.readouts, { label: "方法" });
      const rSep = PL.ui.readout(ui.L.readouts, { label: "分離出" });
      const rWhy = PL.ui.readout(ui.L.readouts, { label: "利用的性質" });
      return { stop() { ui.stop(); } };
    }
  });

  /* 加熱曲線 */
  PL.register("heating-curve", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.56, animate: true,
        draw(dt) {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const mass = massS.get(), power = powerS.get();
          const meltT = 0, boilT = 100, c = 4.18, Lf = 334, Lv = 2260;
          // 以「已加入的熱量」推進狀態
          if (heat.running) heat.Q += power * dt / 1000 * 5; // 5 倍教學時間
          const Q = heat.Q;
          const q1 = mass * c * 100, q2 = mass * Lv / 1000 * 100;
          let T, phase;
          if (Q < q1) { T = Q / (mass * c / 100); phase = "液態升溫"; }
          else if (Q < q1 + q2) { T = 100; phase = "沸騰（溫度不變）"; }
          else { T = 100 + Math.min(40, (Q - q1 - q2) / (mass * c / 100)); phase = "蒸氣升溫"; }
          T = Math.min(T, 140);
          // 燒杯與加熱板
          const cx = W * 0.25, base = H * 0.74;
          CK.hotplate(ctx, cx, base + 12, 150, power / 800);
          /*
           * 液面高度代表水量。
           *
           * 加熱還沒開始時，改變水質量只會改變「之後」的曲線，
           * 當下畫面與讀數完全不動。讓液面隨質量升降，
           * 學生至少看得到自己倒進了多少水；再配上右邊的功率條，
           * 兩根滑桿就都有看得見的後果。
           */
          const waterLevel = 0.26 + mass / 300 * 0.50;
          CK.beaker(ctx, cx, base, 130, 130, waterLevel, T > 90 ? "#f0a080" : "#7fc8ff");
          CK.burner(ctx, cx, base + 12, 0);
          /*
           * 功率條放在燒杯正上方，不要壓在加熱板與「150 g 水」的說明上。
           * 曲線的斜率其實與功率無關（橫軸已換算成時間），要讓功率滑桿有看得見的後果，
           * 靠的就是這根長條與加熱板的亮度。
           */
          CK.meter(ctx, cx - 58, base - 152, 116, 7, power / 800, { color: "#ff8a65", label: "加熱功率" });
          D.text(ctx, T.toFixed(1) + " °C", cx, base - 74, { color: PL.col("accent"), size: 20, align: "center", weight: "700" });
          /*
           * 質量要畫出來。
           *
           * 加熱尚未開始（Q = 0）時，改變水質量只會改變「之後」的曲線，
           * 當下畫面與讀數完全不動——學生會以為滑桿壞了。
           * 把目前的水質量寫在燒杯旁，至少讓他知道自己改了什麼，
           * 也才能和「加熱同樣時間、質量越大升溫越慢」對照。
           */
          D.text(ctx, massS.get() + " g 水", cx, base + 24, { color: PL.col("text-dim"), size: 12, align: "center" });
          // 溫度計
          PL.apparatus.thermometer(ctx, cx + 99, H * 0.28, base + 4, 9, (T + 20) / 160);
          // 曲線
          // 圖往右縮一點，左邊留給燒杯，刻度數字才不會疊在玻璃上
          const cw = W * 0.48, ch = H * 0.55, gx = W * 0.46, gy = H * 0.16;
          const g = PL.graph(ui.cv, { x: gx, y: gy, w: cw, h: ch }, { x0: 0, x1: 900, y0: -10, y1: 140 });
          /*
           * 刻度標在 0、50、100 °C，而不是 27.5、65、102.5 這種等分值：
           * 這張圖要讀的是熔點 0 °C 與沸點 100 °C，刻度必須落在這兩個溫度上，
           * 學生才能直接把水平段對到「100 °C」。
           */
          const yTicks = [0, 50, 100];
          g.frame({ xlabel: "加熱時間 (s)", ylabel: "溫度 (°C)", yticks: yTicks });
          g.grid(4, yTicks);
          const pts = [];
          const scale = q1 / 420;
          for (let q = 0; q <= Math.min(Q, 900 * scale); q += 9) {
            let tt;
            if (q < q1) tt = q / (mass * c / 100);
            else if (q < q1 + q2) tt = 100;
            else tt = Math.min(140, 100 + (q - q1 - q2) / (mass * c / 100));
            pts.push([q / scale, tt]);
          }
          g.curve(pts, { color: PL.col("accent"), width: 2.6 });
          if (pts.length) g.dot(pts[pts.length - 1][0], pts[pts.length - 1][1], { color: PL.col("accent-2"), r: 4 });
          D.text(ctx, phase, gx + cw / 2, gy - 8, { color: PL.col("text-dim"), size: 12, align: "center", weight: "700" });
          rT.set(T, 1); rPhase.set(phase); rQ.set(Q / 1000, 2); rRate.set(power, 0);
        }
      });
      const heat = { Q: 0, running: true };
      ui.anim && (ui.anim.start = ui.anim.start);
      const powerS = PL.ui.slider(ui.L.controls, { label: "加熱功率", min: 100, max: 800, step: 50, value: 400, unit: "W", digits: 0 });
      const massS = PL.ui.slider(ui.L.controls, { label: "水質量", min: 50, max: 300, step: 25, value: 150, unit: "g", digits: 0 });
      PL.ui.note(ui.L.controls, "曲線的水平段就是沸騰：熱一直加，溫度卻不上升，能量用於把液體變成氣體。功率越大，斜線越陡、平台越早出現。");
      PL.ui.procedure(ui.L.controls, {
        title: "讀加熱曲線",
        steps: [
          "先找斜線段：溫度上升，代表吸收的熱用於升溫（<b>Q = mcΔT</b>）。",
          "再找水平段：溫度不變，代表正在發生相變（沸騰）。",
          "比較不同功率：斜率變陡，但水平段的溫度不變。",
          "比較不同質量：質量越大，升溫越慢、平台越晚到。"
        ],
        rule: "水平段不是「溫度計壞了」或「加熱停了」；熱仍持續加入，只是全部用於汽化熱。"
      });
      const rT = PL.ui.readout(ui.L.readouts, { label: "溫度", unit: "°C" });
      const rPhase = PL.ui.readout(ui.L.readouts, { label: "狀態" });
      const rQ = PL.ui.readout(ui.L.readouts, { label: "累積吸熱", unit: "kJ" });
      const rRate = PL.ui.readout(ui.L.readouts, { label: "加熱功率", unit: "W" });
      root.addEventListener("input", () => { heat.Q = 0; });
      return { stop() { ui.stop(); } };
    }
  });

  /* 有效數字與不確定度 */
  PL.register("measurement", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const kind = instr.get();
          let value, unit, res, digits, label;
          if (kind === "cylinder") { value = 24.0 + readS.get() * 0.1; unit = "mL"; res = 1; digits = 1; label = "10 mL 量筒"; }
          else if (kind === "burette") { value = 12.40 + readS.get() * 0.01; unit = "mL"; res = 0.1; digits = 2; label = "滴定管"; }
          else { value = 1.234 + readS.get() * 0.001; unit = "g"; res = 0.001; digits = 4; label = "電子天平"; }
          // 器材
          if (kind === "cylinder") {
            const cx = W * 0.34, top = H * 0.16, bot = H * 0.72, w = 90;
            D.rect(ctx, cx - w / 2, top, w, bot - top, { fill: "rgba(180,220,240,0.10)", stroke: "rgba(180,220,240,0.6)", r: 4 });
            const h = (bot - top) * value / 50;
            D.rect(ctx, cx - w / 2 + 3, bot - h, w - 6, h, { fill: "rgba(90,170,220,0.4)" });
            D.line(ctx, cx - w / 2 + 3, bot - h, cx + w / 2 - 3, bot - h, "rgba(220,244,255,0.85)", 2);
            for (let i = 0; i <= 50; i += 5) {
              const y = bot - (bot - top) * i / 50;
              D.line(ctx, cx + w / 2, y, cx + w / 2 + (i % 10 === 0 ? 12 : 7), y, PL.col("text-faint"), 1);
              if (i % 10 === 0) D.text(ctx, String(i), cx + w / 2 + 16, y + 4, { color: PL.col("text-faint"), size: 9 });
            }
            D.text(ctx, label, cx, bot + 18, { color: PL.col("text-dim"), size: 11, align: "center" });
          } else if (kind === "burette") {
            CK.burette(ctx, W * 0.34, H * 0.10, H * 0.80, 1 - readS.get() / 100, "#cfe8ff");
            D.text(ctx, label, W * 0.34, H * 0.86, { color: PL.col("text-dim"), size: 11, align: "center" });
          } else {
            CK.balance(ctx, W * 0.34, H * 0.66, value.toFixed(3), "g");
            D.text(ctx, label, W * 0.34, H * 0.76, { color: PL.col("text-dim"), size: 11, align: "center" });
          }
          CK.panel(ctx, W * 0.58, H * 0.18, W * 0.34, H * 0.48, "讀值規則");
          D.text(ctx, "最小刻度  " + (kind === "balance" ? "0.001 g" : res + " mL"), W * 0.75, H * 0.30, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "估計一位  " + (kind === "burette" ? "0.01 mL" : kind === "cylinder" ? "0.1 mL" : "0.0001 g"), W * 0.75, H * 0.38, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "不確定度 ±" + (res / 2) + " " + unit, W * 0.75, H * 0.46, { color: PL.col("accent"), size: 14, align: "center", weight: "700" });
          D.text(ctx, "記錄  " + value.toFixed(digits) + " " + unit, W * 0.75, H * 0.56, { color: PL.col("text-dim"), size: 13, align: "center" });
          // 切換器材時單位也要跟著換（量筒 mL、滴定管 mL、電子天平 g）。
          rRead.set(value.toFixed(digits)); rRead.setUnit(unit);
          rRes.set("±" + (res / 2)); rRes.setUnit(unit);
          rDigits.set(digits + " 位");
        }
      });
      const instr = PL.ui.select(ui.L.controls, { label: "量測工具", value: "cylinder", options: [
        { value: "cylinder", label: "10 mL 量筒" }, { value: "burette", label: "滴定管" }, { value: "balance", label: "電子天平" }
      ] });
      const readS = PL.ui.slider(ui.L.controls, { label: "微調讀數", min: 0, max: 99, step: 1, value: 40, digits: 0 });
      PL.ui.note(ui.L.controls, "同一杯液體用不同工具量，能寫出的有效位數不同。工具的最小刻度決定最後一位可以信任到哪裡。");
      PL.ui.procedure(ui.L.controls, {
        title: "讀量具的三步",
        steps: [
          "先看工具的最小刻度（量筒 1 mL、滴定管 0.1 mL、天平 0.001 g）。",
          "讀到最小刻度，再往下一格估一位。",
          "記錄時寫出數值、單位與不確定度，例如 <b>24.0 ± 0.5 mL</b>。"
        ],
        rule: "量筒估到 0.1 mL、滴定管估到 0.01 mL、電子天平估到 0.0001 g；多寫一位不是更精確，是假精度。"
      });
      const rRead = PL.ui.readout(ui.L.readouts, { label: "讀值" });
      const rRes = PL.ui.readout(ui.L.readouts, { label: "不確定度" });
      const rDigits = PL.ui.readout(ui.L.readouts, { label: "有效位數" });
      return { stop() { ui.stop(); } };
    }
  });

  /* 莫耳 */
  PL.register("mole", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.58, animate: true,
        draw(dt, t) {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const n = massS.get() / 18;
          const N = n * 6.02e23;
          const V = n * 22.4;
          // 天平
          CK.balance(ctx, W * 0.28, H * 0.72, massS.get().toFixed(1), "g");
          // 粒子雲
          CK.panel(ctx, W * 0.48, H * 0.13, W * 0.44, H * 0.56, "1 莫耳＝6.02×10²³ 個粒子");
          const box = { x: W * 0.51, y: H * 0.21, w: W * 0.38, h: H * 0.40 };
          const count = Math.max(6, Math.min(60, Math.round(n * 10)));
          CK.particleBox(ctx, box, { state: "gas", temp: 0.6, count, seed: 23, time: t, color: "#7fc8ff", radius: 4.5 });
          D.text(ctx, "水分子 H₂O", W * 0.70, H * 0.66, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, PL.fmt(N, 3) + " 個分子", W / 2, H * 0.82, { color: PL.col("accent"), size: 19, align: "center", weight: "700" });
          D.text(ctx, n.toFixed(3) + " mol", W / 2, H * 0.89, { color: PL.col("text-dim"), size: 13, align: "center" });
          rMol.set(n, 3); rParticles.set(N, 2); rVol.set(V, 2); rMass.set(massS.get(), 0);
        }
      });
      const massS = PL.ui.slider(ui.L.controls, { label: "水質量", min: 1.8, max: 180, step: 1.8, value: 18, unit: "g", digits: 1 });
      PL.ui.note(ui.L.controls, "1 莫耳的水是 18 g，約 6.02×10²³ 個水分子。質量加倍，莫耳數與粒子數也加倍；常溫常壓下 1 mol 氣體約 24.5 L。");
      PL.ui.procedure(ui.L.controls, {
        title: "質量 ↔ 莫耳 ↔ 粒子數",
        steps: [
          "由質量與莫耳質量算出 <b>n = m / M</b>。",
          "粒子數 <b>N = n × 6.02×10²³</b>。",
          "氣體在標準狀況下的體積 <b>V = n × 22.4 L</b>。",
          "把質量加倍，確認 n、N、V 是否都跟著加倍。"
        ],
        rule: "6.02×10²³ 是每莫耳的粒子數，和物質種類無關；22.4 L 只適用於標準狀況（0 °C、1 atm）的氣體。"
      });
      const rMol = PL.ui.readout(ui.L.readouts, { label: "莫耳數", unit: "mol" });
      const rParticles = PL.ui.readout(ui.L.readouts, { label: "分子數" });
      const rVol = PL.ui.readout(ui.L.readouts, { label: "氣體體積（STP）", unit: "L" });
      const rMass = PL.ui.readout(ui.L.readouts, { label: "質量", unit: "g" });
      return { stop() { ui.stop(); } };
    }
  });

  /* 莫耳質量 */
  PL.register("molar-mass", {
    build(root) {
      const COMPOUNDS = {
        H2O: { name: "水", M: 18.02, atoms: [["H", 2], ["O", 1]] },
        CO2: { name: "二氧化碳", M: 44.01, atoms: [["C", 1], ["O", 2]] },
        NaCl: { name: "食鹽", M: 58.44, atoms: [["Na", 1], ["Cl", 1]] },
        C6H12O6: { name: "葡萄糖", M: 180.16, atoms: [["C", 6], ["H", 12], ["O", 6]] },
        CaCO3: { name: "碳酸鈣", M: 100.09, atoms: [["Ca", 1], ["C", 1], ["O", 3]] },
        CuSO4: { name: "硫酸銅(II)", M: 159.61, atoms: [["Cu", 1], ["S", 1], ["O", 4]] }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = compSel.get(), c = COMPOUNDS[key], mass = massS.get();
          const n = mass / c.M;
          // 分子模型
          CK.panel(ctx, W * 0.08, H * 0.12, W * 0.42, H * 0.58, c.name + "　" + key);
          const atoms = c.atoms.map(a => ({ el: a[0], x: 0, y: 0, r: 0.4 }));
          const cx = W * 0.29, cy = H * 0.40;
          if (key === "H2O") CK.moleculeByName(ctx, cx, cy, "H2O", 44, -0.3);
          else if (key === "CO2") CK.moleculeByName(ctx, cx, cy, "CO2", 40, 0);
          else if (key === "NaCl") CK.moleculeByName(ctx, cx, cy, "NaCl", 42, 0.2);
          else {
            const list = [];
            const total = c.atoms.reduce((s, a) => s + a[1], 0);
            let idx = 0;
            c.atoms.forEach(a => {
              for (let k = 0; k < a[1]; k++) {
                const ang = idx / total * PL.TAU;
                list.push({ el: a[0], x: Math.cos(ang) * 0.75, y: Math.sin(ang) * 0.75, r: 0.26 });
                idx++;
              }
            });
            CK.molecule(ctx, cx, cy, list, [], 52, 0);
          }
          D.text(ctx, "M = " + c.M.toFixed(2) + " g/mol", W * 0.29, H * 0.62, { color: PL.col("accent"), size: 16, align: "center", weight: "700" });
          // 天平與換算
          CK.balance(ctx, W * 0.73, H * 0.68, mass.toFixed(1), "g");
          D.text(ctx, "n = m / M", W * 0.73, H * 0.30, { color: PL.col("text-dim"), size: 15, align: "center" });
          D.text(ctx, n.toFixed(4) + " mol", W * 0.73, H * 0.84, { color: PL.col("accent-2"), size: 20, align: "center", weight: "700" });
          rM.set(c.M, 2); rN.set(n, 4); rFormula.set(key); rMass.set(mass, 0);
        }
      });
      const compSel = PL.ui.select(ui.L.controls, { label: "物質", value: "H2O", options: Object.keys(COMPOUNDS).map(k => ({ value: k, label: COMPOUNDS[k].name + "（" + k + "）" })) });
      const massS = PL.ui.slider(ui.L.controls, { label: "秤取質量", min: 5, max: 200, step: 5, value: 36, unit: "g", digits: 0 });
      PL.ui.note(ui.L.controls, "莫耳質量是 1 莫耳物質的質量。把秤上的質量除以莫耳質量，就得到莫耳數；再乘上 6.02×10²³ 就是粒子數。");
      PL.ui.procedure(ui.L.controls, {
        title: "由化學式算莫耳質量",
        steps: [
          "查出化學式中每個元素的原子量。",
          "原子量 × 原子數，逐項相加得到 <b>M</b>。",
          "用 <b>n = m / M</b> 把秤到的質量換成莫耳數。"
        ],
        rule: "括號和結晶水要整組乘：Ca(OH)₂ 有兩組 OH，CuSO₄·5H₂O 的水也要算進莫耳質量。"
      });
      const rM = PL.ui.readout(ui.L.readouts, { label: "莫耳質量", unit: "g/mol" });
      const rN = PL.ui.readout(ui.L.readouts, { label: "莫耳數", unit: "mol" });
      const rFormula = PL.ui.readout(ui.L.readouts, { label: "化學式" });
      const rMass = PL.ui.readout(ui.L.readouts, { label: "質量", unit: "g" });
      return { stop() { ui.stop(); } };
    }
  });

  /* 質量百分組成 */
  PL.register("percent-composition", {
    build(root) {
      const COMPOUNDS = {
        H2O: { name: "水", atoms: [["H", 2, 1.008], ["O", 1, 16.00]] },
        CO2: { name: "二氧化碳", atoms: [["C", 1, 12.01], ["O", 2, 16.00]] },
        C6H12O6: { name: "葡萄糖", atoms: [["C", 6, 12.01], ["H", 12, 1.008], ["O", 6, 16.00]] },
        NH4NO3: { name: "硝酸銨", atoms: [["N", 2, 14.01], ["H", 4, 1.008], ["O", 3, 16.00]] }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.50,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const key = compSel.get(), c = COMPOUNDS[key], sample = sampleS.get();
          const total = c.atoms.reduce((s, a) => s + a[1] * a[2], 0);
          const parts = c.atoms.map(a => ({ el: a[0], m: a[1] * a[2], pct: a[1] * a[2] / total * 100 }));
          // 長條圖
          const x0 = W * 0.16, y0 = H * 0.22, w = W * 0.68, h = 44;
          pctVals = parts.map(p => p.pct);
          let acc = 0;
          parts.forEach((p, i) => {
            const seg = w * p.pct / 100;
            D.rect(ctx, x0 + acc, y0, seg, h, { fill: CK.elementColor(p.el), stroke: "rgba(0,0,0,0.15)" });
            if (p.pct > 8) D.text(ctx, p.el + " " + p.pct.toFixed(1) + "%", x0 + acc + seg / 2, y0 + 27, { color: p.el === "C" ? "#fff" : "#18202b", size: 11, align: "center", weight: "700" });
            acc += seg;
          });
          D.text(ctx, c.name + "（" + key + "）的質量百分組成", W / 2, y0 - 12, { color: PL.col("text-dim"), size: 13, align: "center", weight: "700" });
          // 樣品與元素質量
          CK.balance(ctx, W * 0.28, H * 0.78, sample.toFixed(1), "g");
          parts.forEach((p, i) => {
            const y = H * 0.52 + i * 24;
            D.disc(ctx, W * 0.58, y - 4, 6, { fill: CK.elementColor(p.el) });
            D.text(ctx, p.el + "：" + (sample * p.pct / 100).toFixed(2) + " g", W * 0.61, y, { color: PL.col("text-dim"), size: 12 });
          });
          // 莫耳比
          const moles = parts.map(p => ({ el: p.el, n: p.m / parts.find(x => x.el === p.el).m * 0 }));
          const ratio = c.atoms.map(a => a[1]);
          const g = ratio.reduce((a, b) => gcd(a, b));
          D.text(ctx, "莫耳比 " + ratio.map((r, i) => c.atoms[i][0] + ":" + (r / g)).join("  "), W * 0.63, H * 0.84,
            { color: PL.col("accent"), size: 13, align: "center", weight: "700" });
          rTotal.set(total, 2); rPct.set(parts.map(p => p.el + " " + p.pct.toFixed(1) + "%").join(" · "));
          rRatio.set(ratio.map((r, i) => c.atoms[i][0] + (r / g)).join(""));
        }
      });
      let pctVals = [];
      const compSel = PL.ui.select(ui.L.controls, { label: "化合物", value: "H2O", options: Object.keys(COMPOUNDS).map(k => ({ value: k, label: COMPOUNDS[k].name + "（" + k + "）" })) });
      const sampleS = PL.ui.slider(ui.L.controls, { label: "樣品質量", min: 10, max: 200, step: 10, value: 100, unit: "g", digits: 0 });
      PL.ui.note(ui.L.controls, "質量百分組成只看化學式，與樣品大小無關。把各元素質量除以原子量得到莫耳比，化簡就是實驗式。");
      PL.ui.procedure(ui.L.controls, {
        title: "算質量百分組成",
        steps: [
          "由化學式算出莫耳質量 <b>M</b>。",
          "各元素質量 = 原子量 × 原子數。",
          "百分組成 = 元素質量 ÷ <b>M</b> × 100%。",
          "把各元素百分比相加，檢查是否為 100%。"
        ],
        rule: "總和差 0.1% 是四捨五入；差很多代表漏算原子或把下標看成係數。"
      });
      const rTotal = PL.ui.readout(ui.L.readouts, { label: "莫耳質量", unit: "g/mol" });
      const rPct = PL.ui.readout(ui.L.readouts, { label: "質量百分組成" });
      const rRatio = PL.ui.readout(ui.L.readouts, { label: "實驗式" });
      return { stop() { ui.stop(); } };
    }
  });

  function gcd(a, b) { while (b) { const t = a % b; a = b; b = t; } return a || 1; }
})();
