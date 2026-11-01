/* 模組十一 · 選修：物質結構與光譜 */
(function () {
  "use strict";
  const PL = window.PhysicsLab, CK = window.ChemLab, D = PL.draw;
  const SUB = ["s", "p", "d", "f"];

  PL.register("quantum-numbers", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const n = +nSel.get(), l = Math.min(+lSel.get() || 0, n - 1);
          const mReq = mS.get(), m = PL.clamp(mReq, -l, l);
          // |m| 不能超過 l；滑到範圍外時要說出來，不能默默裁切掉。
          const mValid = Math.abs(mReq) <= l;
          const valid = +lSel.get() <= n - 1;
          const label = n + SUB[l];
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.46, H * 0.74, "電子殼層");
          const shells = [];
          for (let i = 1; i <= 4; i++) shells.push(Math.min(2 * i * i, [2, 8, 18, 32][i - 1]));
          CK.atomDiagram(ctx, W * 0.29, H * 0.36, 62, shells.slice(0, n), { highlightShell: n - 1, label: "n = " + n, nucleus: "核" });
          CK.panel(ctx, W * 0.56, H * 0.09, W * 0.38, H * 0.74, "量子數");
          D.text(ctx, "n = " + n, W * 0.75, H * 0.20, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "l = " + l + "（" + SUB[l] + "）", W * 0.75, H * 0.275, { color: PL.col("accent"), size: 15, align: "center", weight: "700" });
          // m = 0 就寫 0；「+0」看起來像打錯。
          D.text(ctx, "m = " + (mReq > 0 ? "+" : "") + mReq + (mValid ? "" : "（|m| > l，無效）"),
            W * 0.75, H * 0.35, { color: mValid ? PL.col("text-dim") : "#ff8a65", size: 12, align: "center" });
          D.text(ctx, "自旋 " + (spinSel.get() === "up" ? "+½" : "−½"), W * 0.75, H * 0.42, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "軌域 " + label, W * 0.75, H * 0.525, { color: PL.col("accent"), size: 20, align: "center", weight: "700" });
          D.text(ctx, "容量 " + 2 * (2 * l + 1) + " 個電子", W * 0.75, H * 0.615, { color: PL.col("text-faint"), size: 10, align: "center" });
          D.text(ctx, "角節面 " + l + " 個", W * 0.75, H * 0.675, { color: PL.col("text-faint"), size: 10, align: "center" });
          if (!valid) D.text(ctx, "l 必須小於 n", W * 0.75, H * 0.812, { color: "#ff8a65", size: 10, align: "center" });
          /*
           * m 的可能值排成一列，游標停在目前選的那一格。
           *
           * 磁量子數 m 是最抽象的一個：它決定軌域在空間中的方向，
           * 但畫面上原本只有一行「m = +1（|m| > l，無效）」的字。
           * 把 −l…+l 的格子畫出來，游標移動就是看得見的變化，
           * 也順便說明為什麼 l 只有 0 時 m 只能取 0。
           */
          const slots = 2 * l + 1, sw2 = 18, gap2 = 6;
          let sx2 = W * 0.75 - (slots * (sw2 + gap2) - gap2) / 2;
          /*
           * 「m 的可能值」要跟格子分開：標籤放在上方，游標三角就在格子頂端，
           * 兩者只差 10 px 時三角會壓在「能」字上。
           */
          D.text(ctx, "m 的可能值", W * 0.75, H * 0.715, { color: PL.col("text-faint"), size: 9, align: "center" });
          const slotY = H * 0.752;
          for (let i = 0; i < slots; i++) {
            const mv = i - l, on = mv === m && mValid;
            D.rect(ctx, sx2, slotY, sw2, 16, { fill: on ? PL.col("accent") : PL.theme.shade(0.5), stroke: PL.col("border"), r: 3 });
            // 游標另外畫一個三角，位置會跟著 m 移動；只換填色的話，學生看不出選了哪一格
            if (on) {
              D.line(ctx, sx2 + sw2 / 2 - 4, slotY - 5, sx2 + sw2 / 2 + 4, slotY - 5, PL.col("accent"), 2);
              D.line(ctx, sx2 + sw2 / 2 - 4, slotY - 5, sx2 + sw2 / 2, slotY + 0.5, PL.col("accent"), 2);
              D.line(ctx, sx2 + sw2 / 2 + 4, slotY - 5, sx2 + sw2 / 2, slotY + 0.5, PL.col("accent"), 2);
            }
            D.text(ctx, (mv > 0 ? "+" : "") + mv, sx2 + sw2 / 2, slotY + 12, { color: on ? "#fff" : PL.col("text-dim"), size: 9, align: "center", weight: on ? "700" : "400" });
            sx2 += sw2 + gap2;
          }
          rOrb.set(label); rCap.set(2 * (2 * l + 1), 0); rM.set(2 * l + 1, 0);
          rValid.set(valid ? "合法組合" : "不合法：l ≥ n");
          rTotal.set(2 * n * n, 0);
        }
      });
      const nSel = PL.ui.select(ui.L.controls, { label: "主量子數 n", value: "3", options: [1, 2, 3, 4].map(v => ({ value: String(v), label: "n = " + v })) });
      const lSel = PL.ui.select(ui.L.controls, { label: "角量子數 l", value: "0", options: [{ value: "0", label: "l = 0（s）" }, { value: "1", label: "l = 1（p）" }, { value: "2", label: "l = 2（d）" }, { value: "3", label: "l = 3（f）" }] });
      const mS = PL.ui.slider(ui.L.controls, { label: "磁量子數 m", min: -3, max: 3, step: 1, value: 0, digits: 0 });
      const spinSel = PL.ui.select(ui.L.controls, { label: "自旋", value: "up", options: [{ value: "up", label: "↑ +½" }, { value: "down", label: "↓ −½" }] });
      PL.ui.note(ui.L.controls, "四個量子數唯一決定一個電子的狀態。包立不相容原理說：同一原子中，沒有兩個電子的四個量子數完全相同。");
      const rOrb = PL.ui.readout(ui.L.readouts, { label: "軌域" });
      const rCap = PL.ui.readout(ui.L.readouts, { label: "此副殼層容量" });
      const rM = PL.ui.readout(ui.L.readouts, { label: "m 的可能數" });
      const rValid = PL.ui.readout(ui.L.readouts, { label: "組合檢查" });
      const rTotal = PL.ui.readout(ui.L.readouts, { label: "第 n 層總容量" });
      return { stop() { ui.stop(); } };
    }
  });

  PL.register("orbitals", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const shape = shapeSel.get(), showNode = nodeChk.get();
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.88, H * 0.76, shapeName(shape) + " 軌域");
          const cx = W / 2, cy = H * 0.40;
          ctx.save();
          if (shape === "s") {
            const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 90);
            g.addColorStop(0, "rgba(126,200,255,0.85)");
            g.addColorStop(0.6, "rgba(126,200,255,0.35)");
            g.addColorStop(1, "rgba(126,200,255,0.02)");
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 90, 0, Math.PI * 2); ctx.fill();
          } else if (shape === "px" || shape === "py" || shape === "pz") {
            const ang = shape === "px" ? 0 : shape === "py" ? Math.PI / 2 : Math.PI / 4;
            ctx.translate(cx, cy); ctx.rotate(ang);
            ["#7fc8ff", "#4db6ac"].forEach((c, i) => {
              const dir = i ? 1 : -1;
              ctx.beginPath(); ctx.ellipse(dir * 54, 0, 52, 30, 0, 0, Math.PI * 2);
              ctx.fillStyle = i ? "rgba(77,182,172,0.35)" : "rgba(126,200,255,0.45)"; ctx.fill();
            });
            if (showNode) { ctx.setLineDash([6, 5]); D.line(ctx, 0, -60, 0, 60, "rgba(255,255,255,0.5)", 1.2); ctx.setLineDash([]); }
          } else if (shape === "dxy") {
            ctx.translate(cx, cy); ctx.rotate(Math.PI / 4);
            [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([sx, sy], i) => {
              ctx.beginPath(); ctx.ellipse(sx * 46, sy * 46, 40, 24, sx * sy > 0 ? Math.PI / 4 : -Math.PI / 4, 0, Math.PI * 2);
              ctx.fillStyle = i % 2 ? "rgba(255,183,77,0.38)" : "rgba(126,200,255,0.38)"; ctx.fill();
            });
            if (showNode) {
              ctx.setLineDash([6, 5]);
              D.line(ctx, -90, 0, 90, 0, "rgba(255,255,255,0.45)", 1.2);
              D.line(ctx, 0, -90, 0, 90, "rgba(255,255,255,0.45)", 1.2);
              ctx.setLineDash([]);
            }
          } else {
            ctx.translate(cx, cy);
            ctx.beginPath(); ctx.ellipse(0, -48, 34, 48, 0, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(126,200,255,0.42)"; ctx.fill();
            ctx.beginPath(); ctx.ellipse(0, 48, 34, 48, 0, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(77,182,172,0.42)"; ctx.fill();
            ctx.beginPath(); ctx.arc(0, 0, 56, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255,183,77,0.75)"; ctx.lineWidth = 12; ctx.stroke();
          }
          ctx.restore();
          D.disc(ctx, cx, cy, 3, { fill: PL.col("text-faint") });
          D.text(ctx, shapeInfo(shape)[0], W / 2, H * 0.75, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, shapeInfo(shape)[1], W / 2, H * 0.82, { color: PL.col("text-faint"), size: 10, align: "center" });
          rShape.set(shapeName(shape)); rNode.set(shape.startsWith("d") ? "2" : shape === "s" ? "0" : "1");
          rElectrons.set("最多 2 個"); rDir.set(shape === "s" ? "1" : shape.startsWith("d") ? "5（整組 d）" : "3（p 整組）");
        }
      });
      const shapeSel = PL.ui.select(ui.L.controls, { label: "軌域", value: "pz", options: [{ value: "s", label: "s" }, { value: "px", label: "pₓ" }, { value: "py", label: "p_y" }, { value: "pz", label: "p_z" }, { value: "dxy", label: "dₓᵧ" }, { value: "dz2", label: "d_z²" }] });
      const nodeChk = PL.ui.checkbox(ui.L.controls, { label: "顯示節面", checked: false });
      PL.ui.note(ui.L.controls, "軌域不是電子的固定軌道，而是電子出現機率最高的區域。節面是電子出現機率為零的地方。");
      const rShape = PL.ui.readout(ui.L.readouts, { label: "軌域形狀" });
      const rNode = PL.ui.readout(ui.L.readouts, { label: "角節面數" });
      const rElectrons = PL.ui.readout(ui.L.readouts, { label: "電子容量" });
      const rDir = PL.ui.readout(ui.L.readouts, { label: "方向數" });
      return { stop() { ui.stop(); } };
    }
  });

  function shapeName(s) {
    return { s: "s", px: "pₓ", py: "p_y", pz: "p_z", dxy: "dₓᵧ", dz2: "d_z²" }[s] || s;
  }
  function shapeInfo(s) {
    if (s === "s") return ["球形對稱，電子機率只隨距離改變", "角節面 0，整組 s 只有 1 個軌域"];
    if (s.startsWith("p")) return ["啞鈴形，沿一個軸分布", "1 個角節面；整組 p 有 3 個方向"];
    return ["四瓣或雙瓣加環，形狀較複雜", "2 個角節面；整組 d 有 5 個軌域"];
  }

  PL.register("hybridization", {
    build(root) {
      const HYB = {
        sp: { name: "sp 混成", angle: "180°", geo: "直線形", example: "BeCl₂、乙炔 C₂H₂", lobes: 2, color: "#4db6ac" },
        sp2: { name: "sp² 混成", angle: "120°", geo: "平面三角形", example: "BF₃、乙烯 C₂H₄", lobes: 3, color: "#64b5f6" },
        sp3: { name: "sp³ 混成", angle: "109.5°", geo: "四面體", example: "CH₄、乙烷 C₂H₆", lobes: 4, color: "#ffb74d" }
      };
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const h = HYB[hybSel.get()];
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.88, H * 0.76, h.name);
          const cx = W / 2, cy = H * 0.40;
          const angles = h.lobes === 2 ? [-Math.PI / 2, Math.PI / 2] : h.lobes === 3 ? [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6] : [-Math.PI * 3 / 4, -Math.PI / 4, Math.PI / 4, Math.PI * 3 / 4];
          angles.forEach(a => {
            const x = cx + Math.cos(a) * 50, y = cy + Math.sin(a) * 50;
            ctx.beginPath(); ctx.ellipse(x, y, 34, 16, a, 0, Math.PI * 2);
            ctx.fillStyle = h.color + "66"; ctx.fill();
            ctx.strokeStyle = h.color; ctx.lineWidth = 1.4; ctx.stroke();
          });
          D.disc(ctx, cx, cy, 8, { fill: PL.col("accent") });
          D.text(ctx, "中心原子", cx, cy + 24, { color: "#10202a", size: 8, align: "center" });
          D.text(ctx, "鍵角 " + h.angle, W / 2, H * 0.64, { color: PL.col("accent"), size: 20, align: "center", weight: "700" });
          D.text(ctx, h.geo + "　·　" + h.example, W / 2, H * 0.73, { color: PL.col("text-dim"), size: 12, align: "center" });
          D.text(ctx, "混成軌域數 = σ 鍵結數 + 孤對數", W / 2, H * 0.81, { color: PL.col("text-faint"), size: 9, align: "center" });
          rHyb.set(h.name); rAngle.set(h.angle); rGeo.set(h.geo); rExample.set(h.example);
        }
      });
      const hybSel = PL.ui.select(ui.L.controls, { label: "混成", value: "sp3", options: Object.keys(HYB).map(k => ({ value: k, label: HYB[k].name })) });
      PL.ui.note(ui.L.controls, "混成是「先混合、再鍵結」的模型：一個 s 與不同數量的 p 軌域混合，得到數目相同、能量相同的混成軌域。");
      const rHyb = PL.ui.readout(ui.L.readouts, { label: "混成型態" });
      const rAngle = PL.ui.readout(ui.L.readouts, { label: "鍵角" });
      const rGeo = PL.ui.readout(ui.L.readouts, { label: "幾何形狀" });
      const rExample = PL.ui.readout(ui.L.readouts, { label: "例子" });
      return { stop() { ui.stop(); } };
    }
  });

  const MO = {
    H2: {
      name: "H₂", order: ["σ1s", "σ*1s"], fill: { "σ1s": 2, "σ*1s": 0 },
      bond: 1, unpaired: 0, note: "σ1s 填滿，鍵級 1，反磁性"
    },
    He2: {
      name: "He₂", order: ["σ1s", "σ*1s"], fill: { "σ1s": 2, "σ*1s": 2 },
      bond: 0, unpaired: 0, note: "成鍵與反鍵抵銷，鍵級 0，不穩定"
    },
    N2: {
      name: "N₂", order: ["σ2s", "σ*2s", "π2p", "σ2p", "π*2p", "σ*2p"],
      fill: { "σ2s": 2, "σ*2s": 2, "π2p": 4, "σ2p": 2, "π*2p": 0, "σ*2p": 0 },
      bond: 3, unpaired: 0, note: "鍵級 3，三鍵使 N₂ 非常安定"
    },
    O2: {
      name: "O₂", order: ["σ2s", "σ*2s", "σ2p", "π2p", "π*2p", "σ*2p"],
      fill: { "σ2s": 2, "σ*2s": 2, "σ2p": 2, "π2p": 4, "π*2p": 2, "σ*2p": 0 },
      bond: 2, unpaired: 2, note: "π*2p 有兩個未成對電子，O₂ 具順磁性"
    },
    F2: {
      name: "F₂", order: ["σ2s", "σ*2s", "σ2p", "π2p", "π*2p", "σ*2p"],
      fill: { "σ2s": 2, "σ*2s": 2, "σ2p": 2, "π2p": 4, "π*2p": 4, "σ*2p": 0 },
      bond: 1, unpaired: 0, note: "π* 填滿，鍵級 1，反磁性"
    }
  };

  PL.register("mo-theory", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const m = MO[molSel.get()], levels = m.order;
          CK.panel(ctx, W * 0.05, H * 0.08, W * 0.90, H * 0.78, m.name + " 的分子軌域");
          const x = W * 0.36, w = W * 0.28;
          const gap = (H * 0.62) / Math.max(1, levels.length - 1);
          levels.forEach((lv, i) => {
            const y = H * 0.20 + i * gap;
            const anti = lv.indexOf("*") >= 0;
            D.line(ctx, x, y, x + w, y, anti ? "#cf8b8b" : "#8bc9a8", 2.4);
            D.text(ctx, lv, x + w + 10, y + 4, { color: anti ? "#cf8b8b" : "#8bc9a8", size: 10 });
            const count = m.fill[lv] || 0;
            drawElectrons(ctx, x + w / 2, y, count, m.fill[lv] > 2);
          });
          D.text(ctx, "成鍵", W * 0.19, H * 0.86, { color: "#8bc9a8", size: 10, align: "center" });
          D.text(ctx, "反鍵", W * 0.79, H * 0.86, { color: "#cf8b8b", size: 10, align: "center" });
          D.text(ctx, "鍵級 " + m.bond, W / 2, H * 0.90, { color: PL.col("accent"), size: 16, align: "center", weight: "700" });
          rBond.set(m.bond, 0); rUnpaired.set(m.unpaired, 0);
          rMag.set(m.unpaired > 0 ? "順磁性" : "反磁性"); rNote.set(m.note);
        }
      });
      const molSel = PL.ui.select(ui.L.controls, { label: "分子", value: "N2", options: Object.keys(MO).map(k => ({ value: k, label: MO[k].name })) });
      PL.ui.note(ui.L.controls, "分子軌域由原子軌域相加減得到：相加是成鍵，相減是反鍵。鍵級 =（成鍵電子 − 反鍵電子）÷ 2。");
      const rBond = PL.ui.readout(ui.L.readouts, { label: "鍵級" });
      const rUnpaired = PL.ui.readout(ui.L.readouts, { label: "未成對電子" });
      const rMag = PL.ui.readout(ui.L.readouts, { label: "磁性" });
      const rNote = PL.ui.readout(ui.L.readouts, { label: "結論" });
      return { stop() { ui.stop(); } };
    }
  });

  function drawElectrons(ctx, cx, y, count) {
    if (!count) return;
    const pair = (x, n) => {
      D.text(ctx, "↑", x - 5, y - 4, { color: PL.col("text"), size: 11, align: "center" });
      if (n > 1) D.text(ctx, "↓", x + 5, y - 4, { color: PL.col("text"), size: 11, align: "center" });
    };
    if (count <= 2) pair(cx, count);
    else if (count === 3) { pair(cx - 16, 2); pair(cx + 16, 1); }
    else { pair(cx - 16, 2); pair(cx + 16, 2); }
  }

  const VSEPR = {
    CH4: { name: "CH₄", ax: "AX₄", pairs: 4, lone: 0, ideal: "109.5°", real: "109.5°", shape: "四面體", atoms: 4 },
    NH3: { name: "NH₃", ax: "AX₃E", pairs: 4, lone: 1, ideal: "109.5°", real: "107°", shape: "三角錐", atoms: 3 },
    H2O: { name: "H₂O", ax: "AX₂E₂", pairs: 4, lone: 2, ideal: "109.5°", real: "104.5°", shape: "彎曲形", atoms: 2 },
    CO2: { name: "CO₂", ax: "AX₂", pairs: 2, lone: 0, ideal: "180°", real: "180°", shape: "直線形", atoms: 2 },
    BF3: { name: "BF₃", ax: "AX₃", pairs: 3, lone: 0, ideal: "120°", real: "120°", shape: "平面三角形", atoms: 3 },
    SF4: { name: "SF₄", ax: "AX₄E", pairs: 5, lone: 1, ideal: "90°/120°", real: "≈89°/117°", shape: "蹺蹺板形", atoms: 4 }
  };

  PL.register("vsepr-advanced", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const v = VSEPR[molSel.get()];
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.88, H * 0.56, v.name + "　" + v.ax);
          const cx = W / 2, cy = H * 0.34;
          const baseAngles = v.atoms === 2 ? (v.lone === 0 ? [0, Math.PI] : [-Math.PI * 0.78, -Math.PI * 0.22])
            : v.atoms === 3 ? (v.lone === 0 ? [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6] : [-Math.PI / 2, Math.PI * 0.78, Math.PI * 0.22])
              : v.atoms === 4 ? (v.lone === 0 ? [-Math.PI * 3 / 4, -Math.PI / 4, Math.PI / 4, Math.PI * 3 / 4] : [-Math.PI * 0.68, -Math.PI * 0.32, Math.PI * 0.68, Math.PI * 0.32])
                : [-Math.PI / 2, Math.PI / 2];
          baseAngles.forEach((a, i) => {
            const x = cx + Math.cos(a) * 66, y = cy + Math.sin(a) * 66;
            D.line(ctx, cx, cy, x, y, PL.col("text-dim"), 2);
            D.disc(ctx, x, y, 13, { fill: i === 0 ? CK.elementColor("O") : CK.elementColor("H") });
            D.text(ctx, "H", x, y + 4, { color: "#12202a", size: 9, align: "center", weight: "700" });
          });
          if (v.lone) {
            for (let i = 0; i < v.lone; i++) {
              const a = -Math.PI * 0.5 + (i - (v.lone - 1) / 2) * 0.7;
              D.disc(ctx, cx + Math.cos(a) * 46, cy + Math.sin(a) * 46, 5, { fill: "#ff8a65" });
            }
            D.text(ctx, "橙點＝孤對電子", W / 2, H * 0.58, { color: PL.col("text-faint"), size: 9, align: "center" });
          }
          CK.panel(ctx, W * 0.06, H * 0.68, W * 0.88, H * 0.20, "鍵角被壓縮");
          D.text(ctx, v.shape + "　理想 " + v.ideal + " → 實際 " + v.real, W / 2, H * 0.77, { color: PL.col("accent"), size: 13, align: "center", weight: "700" });
          D.text(ctx, "孤對電子排斥大於鍵結電子對，孤對越多鍵角越小", W / 2, H * 0.85, { color: PL.col("text-faint"), size: 9, align: "center" });
          rPairs.set(v.pairs, 0); rLone.set(v.lone, 0); rAngle.set(v.real); rShape.set(v.shape);
        }
      });
      const molSel = PL.ui.select(ui.L.controls, { label: "分子", value: "H2O", options: Object.keys(VSEPR).map(k => ({ value: k, label: VSEPR[k].name })) });
      PL.ui.note(ui.L.controls, "先數中心原子的電子對（鍵結＋孤對），再依排斥大小調整角度。孤對電子體積較大，會把鍵角壓小。");
      const rPairs = PL.ui.readout(ui.L.readouts, { label: "電子對數" });
      const rLone = PL.ui.readout(ui.L.readouts, { label: "孤對數" });
      const rAngle = PL.ui.readout(ui.L.readouts, { label: "實際鍵角" });
      const rShape = PL.ui.readout(ui.L.readouts, { label: "分子形狀" });
      return { stop() { ui.stop(); } };
    }
  });

  const CRYSTAL = {
    sc: { name: "簡單立方", atoms: 1, coord: 6, apf: 0.52, ex: "釙（少見）", type: "sc" },
    bcc: { name: "體心立方 BCC", atoms: 2, coord: 8, apf: 0.68, ex: "鐵、鉻、鎢", type: "bcc" },
    fcc: { name: "面心立方 FCC", atoms: 4, coord: 12, apf: 0.74, ex: "銅、鋁、金", type: "fcc" },
    hcp: { name: "六方最密堆積 HCP", atoms: 6, coord: 12, apf: 0.74, ex: "鎂、鋅、鈦", type: "hcp" }
  };

  PL.register("crystal", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.54,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const c = CRYSTAL[typeSel.get()];
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.88, H * 0.56, c.name);
          const s = Math.min(W * 0.24, H * 0.30), cx = W / 2, cy = H * 0.31, dx = -s * 0.45, dy = -s * 0.34;
          if (c.type === "hcp") {
            for (let layer = 0; layer < 3; layer++) {
              for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                  const px = cx + (col - 1) * 34 + (row % 2) * 17 + (layer - 1) * 9 + (layer % 2) * 8;
                  const py = cy + (row - 1) * 30 + (layer - 1) * 16;
                  D.disc(ctx, px, py, 11, { fill: "#9fb6c9", stroke: "rgba(0,0,0,0.2)" });
                }
              }
            }
          } else {
            const pts = [];
            [0, 1].forEach(x => [0, 1].forEach(y => [0, 1].forEach(z => pts.push([x, y, z]))));
            const proj = (x, y, z) => [cx + (x - 0.5) * s + (z - 0.5) * dx, cy + (y - 0.5) * s + (z - 0.5) * dy];
            const edges = [];
            pts.forEach((p, i) => pts.forEach((q, j) => {
              if (j <= i) return;
              const d = Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]);
              if (d === 1) edges.push([p, q]);
            }));
            edges.forEach(([p, q]) => {
              const a = proj(p[0], p[1], p[2]), b = proj(q[0], q[1], q[2]);
              D.line(ctx, a[0], a[1], b[0], b[1], "rgba(150,175,195,0.55)", 1.2);
            });
            pts.forEach(p => {
              const [px, py] = proj(p[0], p[1], p[2]);
              D.disc(ctx, px, py, 11, { fill: "#9fb6c9", stroke: "rgba(0,0,0,0.25)" });
            });
            if (c.type === "bcc") {
              const [px, py] = proj(0.5, 0.5, 0.5); D.disc(ctx, px, py, 11, { fill: "#ffb74d", stroke: "rgba(0,0,0,0.25)" });
            }
            if (c.type === "fcc") {
              [[0.5, 0.5, 0], [0.5, 0.5, 1], [0.5, 0, 0.5], [0.5, 1, 0.5], [0, 0.5, 0.5], [1, 0.5, 0.5]].forEach(f => {
                const [px, py] = proj(f[0], f[1], f[2]); D.disc(ctx, px, py, 11, { fill: "#ffb74d", stroke: "rgba(0,0,0,0.25)" });
              });
            }
          }
          CK.panel(ctx, W * 0.06, H * 0.68, W * 0.88, H * 0.20, "晶體數據");
          D.text(ctx, "每單位晶格 " + c.atoms + " 個原子　配位數 " + c.coord, W / 2, H * 0.76, { color: PL.col("text-dim"), size: 11, align: "center" });
          D.text(ctx, "堆積效率 " + (c.apf * 100).toFixed(0) + "%　例：" + c.ex, W / 2, H * 0.84, { color: PL.col("text-faint"), size: 10, align: "center" });
          rAtoms.set(c.atoms, 0); rCoord.set(c.coord, 0); rApf.set(c.apf * 100, 0); rEx.set(c.ex);
        }
      });
      const typeSel = PL.ui.select(ui.L.controls, { label: "晶體結構", value: "fcc", options: Object.keys(CRYSTAL).map(k => ({ value: k, label: CRYSTAL[k].name })) });
      PL.ui.note(ui.L.controls, "面心立方與六方最密堆積都是 74% 堆積效率，配位數 12；體心立方較鬆散，配位數 8。");
      const rAtoms = PL.ui.readout(ui.L.readouts, { label: "原子數／晶格" });
      const rCoord = PL.ui.readout(ui.L.readouts, { label: "配位數" });
      const rApf = PL.ui.readout(ui.L.readouts, { label: "堆積效率", unit: "%" });
      const rEx = PL.ui.readout(ui.L.readouts, { label: "例子" });
      return { stop() { ui.stop(); } };
    }
  });

  const IR = {
    ethanol: {
      name: "乙醇", formula: "CH₃CH₂OH", peaks: [
        [3350, 0.60, "O–H 伸縮（寬）"], [2970, 0.35, "C–H 伸縮"], [1450, 0.28, "C–H 彎曲"], [1050, 0.45, "C–O 伸縮"]
      ]
    },
    acetic: {
      name: "乙酸", formula: "CH₃COOH", peaks: [
        [3000, 0.70, "O–H 羧酸（很寬）"], [1710, 0.85, "C=O 伸縮"], [1290, 0.40, "C–O 伸縮"], [930, 0.30, "O–H 彎曲"]
      ]
    },
    acetone: {
      name: "丙酮", formula: "CH₃COCH₃", peaks: [
        [1715, 0.90, "C=O 伸縮"], [1360, 0.35, "C–H 彎曲"], [1220, 0.30, "C–C 伸縮"]
      ]
    },
    ester: {
      name: "乙酸乙酯", formula: "CH₃COOCH₂CH₃", peaks: [
        [1740, 0.85, "C=O 酯"], [1240, 0.55, "C–O–C 伸縮"], [1050, 0.40, "C–O 伸縮"], [2980, 0.30, "C–H 伸縮"]
      ]
    }
  };

  PL.register("ir-spectroscopy", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const m = IR[molSel.get()];
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.88, H * 0.74, m.name + "（" + m.formula + "）的紅外光譜");
          const bx = W * 0.12, by = H * 0.22, bw = W * 0.76, bh = H * 0.42;
          D.text(ctx, "穿透率", bx - 4, by - 8, { color: PL.col("text-faint"), size: 9 });
          D.rect(ctx, bx, by, bw, bh, { fill: PL.theme.shade(0.6), stroke: PL.col("border"), r: 4 });
          const trans = wn => {
            let t = 95;
            m.peaks.forEach(p => { t -= p[1] * 70 * Math.exp(-Math.pow((wn - p[0]) / 90, 2)); });
            return PL.clamp(t, 5, 100);
          };
          ctx.save(); ctx.beginPath();
          for (let i = 0; i <= 240; i++) {
            const wn = 4000 - i / 240 * 3500;
            const x = bx + i / 240 * bw, y = by + bh * (1 - trans(wn) / 100);
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.strokeStyle = PL.col("accent"); ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
          m.peaks.forEach(p => {
            const x = bx + (4000 - p[0]) / 3500 * bw;
            const y = by + bh * (1 - trans(p[0]) / 100);
            D.line(ctx, x, y, x, by + bh, "rgba(255,183,77,0.35)", 1, [3, 3]);
            D.text(ctx, String(p[0]), x, by + bh + 13, { color: PL.col("text-faint"), size: 8, align: "center" });
          });
          D.text(ctx, "波數 (cm⁻¹)　4000 → 500", W / 2, H * 0.73, { color: PL.col("text-faint"), size: 9, align: "center" });
          D.text(ctx, "特徵峰：" + m.peaks[0][2], W / 2, H * 0.80, { color: PL.col("text-dim"), size: 11, align: "center" });
          rPeaks.set(m.peaks.map(p => p[0] + " cm⁻¹").join("、"));
          rGroup.set(m.peaks[0][2]); rFormula.set(m.formula);
          rCount.set(m.peaks.length, 0);
        }
      });
      const molSel = PL.ui.select(ui.L.controls, { label: "分子", value: "ethanol", options: Object.keys(IR).map(k => ({ value: k, label: IR[k].name })) });
      PL.ui.note(ui.L.controls, "紅外光譜看的是「鍵的振動」。C=O 大約固定在 1700 cm⁻¹，O–H 則是又寬又大的吸收，這兩點最容易辨認。");
      const rPeaks = PL.ui.readout(ui.L.readouts, { label: "主要吸收峰" });
      const rGroup = PL.ui.readout(ui.L.readouts, { label: "最明顯官能基" });
      const rFormula = PL.ui.readout(ui.L.readouts, { label: "分子式" });
      const rCount = PL.ui.readout(ui.L.readouts, { label: "吸收峰數" });
      return { stop() { ui.stop(); } };
    }
  });

  const NMR = {
    ethanol: {
      name: "乙醇 CH₃CH₂OH", peaks: [
        [1.22, 3, "三峰", "CH₃"], [3.70, 2, "四峰", "CH₂"], [2.60, 1, "寬單峰", "OH"]
      ]
    },
    ethylAcetate: {
      name: "乙酸乙酯 CH₃COOCH₂CH₃", peaks: [
        [1.26, 3, "三峰", "CH₃（乙基）"], [2.04, 3, "單峰", "CH₃CO"], [4.12, 2, "四峰", "OCH₂"]
      ]
    },
    toluene: {
      name: "甲苯 C₆H₅CH₃", peaks: [
        [2.32, 3, "單峰", "Ar–CH₃"], [7.20, 5, "多重峰", "苯環 H"]
      ]
    },
    acetic: {
      name: "乙酸 CH₃COOH", peaks: [
        [2.08, 3, "單峰", "CH₃"], [11.5, 1, "寬單峰", "COOH"]
      ]
    }
  };

  PL.register("nmr", {
    build(root) {
      const ui = CK.scaffold(root, {
        aspect: 0.52,
        draw() {
          const { ctx, W, H } = ui.cv; CK.bench(ui.cv);
          const m = NMR[molSel.get()];
          CK.panel(ctx, W * 0.06, H * 0.09, W * 0.88, H * 0.74, m.name + " 的 ¹H NMR");
          const bx = W * 0.12, by = H * 0.22, bw = W * 0.76, bh = H * 0.36;
          D.rect(ctx, bx, by, bw, bh, { fill: PL.theme.shade(0.6), stroke: PL.col("border"), r: 4 });
          const maxH = Math.max.apply(null, m.peaks.map(p => p[1]));
          m.peaks.forEach(p => {
            const x = bx + (12 - p[0]) / 12 * bw;
            const h = bh * 0.72 * p[1] / maxH;
            D.line(ctx, x, by + bh - 8, x, by + bh - 8 - h, PL.col("accent"), 3);
            D.text(ctx, p[3], x, by + bh - 8 - h - 8, { color: PL.col("text-dim"), size: 9, align: "center" });
            D.text(ctx, p[0] + " ppm", x, by + bh + 14, { color: PL.col("text-faint"), size: 8, align: "center" });
            D.text(ctx, p[1] + "H", x, by + bh - 2, { color: PL.col("text-faint"), size: 8, align: "center" });
          });
          D.text(ctx, "化學位移 (ppm)　12 → 0（TMS）", W / 2, H * 0.70, { color: PL.col("text-faint"), size: 9, align: "center" });
          CK.panel(ctx, W * 0.06, H * 0.76, W * 0.88, H * 0.12, "訊號解讀");
          D.text(ctx, m.peaks.map(p => p[0] + " ppm " + p[2] + "／" + p[3]).join("　"), W / 2, H * 0.84, { color: PL.col("text-dim"), size: 9, align: "center" });
          rCount.set(m.peaks.length, 0);
          rIntegral.set(m.peaks.map(p => p[1]).join(" : "));
          rSplit.set(m.peaks.map(p => p[2]).join("、"));
          rGuess.set(m.peaks[0][3] + " 等環境");
        }
      });
      const molSel = PL.ui.select(ui.L.controls, { label: "化合物", value: "ethanol", options: Object.keys(NMR).map(k => ({ value: k, label: NMR[k].name })) });
      PL.ui.note(ui.L.controls, "NMR 告訴你「有幾種氫、比例多少、隔壁有幾個氫」。積分面積比就是氫原子數比，分裂數則是鄰近氫數加一。");
      const rCount = PL.ui.readout(ui.L.readouts, { label: "訊號數" });
      const rIntegral = PL.ui.readout(ui.L.readouts, { label: "積分比" });
      const rSplit = PL.ui.readout(ui.L.readouts, { label: "分裂型態" });
      const rGuess = PL.ui.readout(ui.L.readouts, { label: "推論" });
      return { stop() { ui.stop(); } };
    }
  });
})();
