/*
 * lab-test.js — 自訂實驗室的化學對照
 *
 * 自訂實驗室讓學生自己倒溶液，引擎算錯的話沒有人會發現——學生只會以為「原來是這樣」。
 * 所以每一種混合組合都要和課本公式對一次：強酸強鹼中和、弱酸緩衝、
 * 指示劑變色、沉澱（限量試劑）、碳酸鹽放氣、中和放熱。
 *
 * 這裡不碰 DOM：lab.js 把配方 → 結果的計算抽成純函式 computeFor(portions, indicator)，
 * 測試直接餵配方，不必模擬點擊或滑桿。
 */
"use strict";
const fs = require("fs");
const path = require("path");
require("./harness.js");
const { reporter } = require("./_lib.js");
const R = reporter();

const root = path.resolve(__dirname, "..", "..");
const code = fs.readFileSync(path.join(root, "js/lab/lab.js"), "utf8");
new Function(code)();                       // 在 harness 的 window/document 上載入
const Mixer = window.ChemLabMixer;
if (!Mixer) {
  console.error("lab.js 沒有匯出 ChemLabMixer（載入階段就失敗了？）");
  process.exit(1);
}
const { computeFor, REAGENTS, phColor, phBand } = Mixer;

const P = (rid, volume, conc) => ({ rid, volume, conc });
const conc = r => r.conc == null ? 0.1 : r.conc;
const near = (a, b, tol) => Math.abs(a - b) <= Math.abs(b) * (tol || 0.02) + 1e-9;
const hasObs = (r, s) => r.obs.some(o => o.indexOf(s) >= 0);
const precip = (r, id) => r.precipitates.find(p => p.id === id) || null;

R.section("試劑表：濃度與標示一致");
{
  ["hcl", "naoh", "acetic", "ammonia", "agno3", "nacl", "na2co3", "cuso4", "cacl2"].forEach(k => {
    R.ok(!!REAGENTS[k] && REAGENTS[k].conc > 0, "有試劑 " + k + "（" + (REAGENTS[k] && REAGENTS[k].name) + "）");
  });
  R.ok(REAGENTS.agno3.conc === 0.05 && REAGENTS.cuso4.conc === 0.05,
    "硝酸銀與硫酸銅是 0.05 M，其餘 0.1 M");
}

R.section("強酸 + 強鹼：等莫耳混合 pH = 7，並放熱");
{
  const r = computeFor([P("hcl", 25, conc(REAGENTS.hcl)), P("naoh", 25, conc(REAGENTS.naoh))]);
  R.ok(near(r.pH, 7, 1e-9), "0.1 M × 25 mL 各一半 → pH 7", "得到 " + r.pH);
  R.ok(near(r.heat, 0.0025), "中和 0.0025 mol → heat = 0.0025", "得到 " + r.heat);
  R.ok(r.temp > 25, "放熱使溫度上升", "25 → " + r.temp.toFixed(2) + " °C");
  R.ok(hasObs(r, "中和放熱"), "觀察紀錄有「中和放熱」", r.obs.join("、"));
}

R.section("強酸過量：pH 由剩下的 H⁺ 決定");
{
  const r = computeFor([P("hcl", 25, 0.1), P("naoh", 10, 0.1)]);
  // (0.0025 − 0.0010) / 0.035 L = 0.04286 M → pH 1.368
  R.ok(near(r.pH, -Math.log10(0.0015 / 0.035), 1e-3), "pH = −log([H⁺]剩)",
    "得到 " + r.pH.toFixed(3));
  R.ok(r.strong.acid > 0 && r.strong.base === 0, "鹼已用盡、酸有剩餘");
}

R.section("弱酸 + 半量強鹼：形成緩衝，pH = pKa");
{
  const r = computeFor([P("acetic", 25, 0.1), P("naoh", 12.5, 0.1)]);
  R.ok(near(r.pH, 4.76, 1e-6), "半當量點 pH = pKa = 4.76", "得到 " + r.pH);
  R.ok(near(r.heat, 0.00125 * 0.95), "弱酸中和熱略小於強酸（0.95 倍）", "得到 " + r.heat);
}

R.section("弱酸 + 等量強鹼：只看鹽類水解，pH > 7");
{
  const r = computeFor([P("acetic", 25, 0.1), P("naoh", 25, 0.1)]);
  const want = 14 - 0.5 * ((14 - 4.76) - Math.log10(0.0025 / 0.05));
  R.ok(near(r.pH, want, 1e-6), "醋酸鈉水解 pH ≈ 8.72", "得到 " + r.pH.toFixed(3));
  R.ok(r.pH > 7, "當量點不在 pH 7");
}

R.section("酚酞：pH ≥ 8.2 才變粉紅");
{
  const acid = computeFor([P("hcl", 25, 0.1), P("naoh", 25, 0.1)], "phenolphthalein");
  R.ok(hasObs(acid, "酚酞無色"), "pH 7 時酚酞無色", acid.obs.join("、"));
  const base = computeFor([P("naoh", 25, 0.1)], "phenolphthalein");
  R.ok(base.pH > 8.2 && hasObs(base, "酚酞呈粉紅"), "鹼性時酚酞呈粉紅",
    "pH " + base.pH.toFixed(2) + "，" + base.obs.join("、"));
  R.ok(base.liquid === "#e06a9a", "液體顏色同步變粉紅", "得到 " + base.liquid);
}

R.section("廣用指示劑：顏色與 pH 帶一致");
{
  const r = computeFor([P("hcl", 25, 0.1)], "universal");
  R.ok(r.pH < 3 && hasObs(r, "強酸性"), "pH < 3 記為強酸性", "pH " + r.pH.toFixed(2) + "，" + r.obs.join("、"));
  R.ok(r.liquid === phColor(r.pH), "液體顏色 = phColor(pH)");
  R.ok(phBand(7) === "中性" && phBand(4) === "弱酸性" && phBand(10) === "弱鹼性",
    "pH 帶：7 中性、4 弱酸性、10 弱鹼性");
}

R.section("沉澱：Ag⁺ + Cl⁻ → AgCl，限量試劑決定數量");
{
  const r = computeFor([P("agno3", 10, 0.05), P("nacl", 10, 0.1)]);
  const p = precip(r, "agcl");
  R.ok(!!p, "產生 AgCl 沉澱", r.obs.join("、"));
  R.ok(p && near(p.n, 0.0005, 1e-6), "Ag⁺ 只有 0.0005 mol，AgCl 也是 0.0005 mol",
    "得到 " + (p ? p.n : "—"));
  R.ok(r.moles.Cl > 0, "Cl⁻ 過量，溶液中仍有 Cl⁻", "剩 " + r.moles.Cl.toFixed(4) + " mol");
  R.ok(r.pH === 7, "不影響酸鹼（pH 7）", "得到 " + r.pH);
}

R.section("碳酸鹽遇酸：放出 CO₂，莫耳數由限量試劑決定");
{
  const r = computeFor([P("na2co3", 10, 0.1), P("hcl", 20, 0.1)]);
  R.ok(near(r.co2, 0.001, 1e-6), "0.001 mol CO₃²⁻ → 0.001 mol CO₂",
    "得到 " + r.co2);
  R.ok(hasObs(r, "CO₂"), "觀察紀錄有氣泡", r.obs.join("、"));
  R.ok(!hasObs(r, "沉澱"), "沒有沉澱");
}

R.section("Cu(OH)₂：需要足量 OH⁻ 才沉澱");
{
  const full = computeFor([P("cuso4", 10, 0.05), P("naoh", 20, 0.1)]);
  const p = precip(full, "cuoh2");
  R.ok(!!p && near(p.n, 0.0005, 1e-6), "0.0005 mol Cu²⁺ 全部沉澱", "得到 " + (p ? p.n : "—"));
  const none = computeFor([P("cuso4", 10, 0.05)]);
  R.ok(!precip(none, "cuoh2"), "只有 Cu²⁺、沒有 OH⁻ 時不沉澱");
  const little = computeFor([P("cuso4", 10, 0.05), P("naoh", 2, 0.1)]);
  const lp = precip(little, "cuoh2");
  R.ok(lp && near(lp.n, 0.0001, 1e-6) && little.moles.Cu > 0,
    "OH⁻ 不足時只沉澱 0.0001 mol，Cu²⁺ 仍有剩餘",
    "沉澱 " + (lp ? lp.n : "—") + "、剩餘 Cu²⁺ " + little.moles.Cu.toFixed(4));
}

R.section("同離子效應：多加 Cl⁻ 不會讓 AgCl 溶解");
{
  const a = computeFor([P("agno3", 10, 0.05), P("nacl", 10, 0.1)]);
  const b = computeFor([P("agno3", 10, 0.05), P("nacl", 50, 0.1)]);
  const pa = precip(a, "agcl"), pb = precip(b, "agcl");
  R.ok(pa && pb && near(pa.n, pb.n, 1e-9), "沉澱量只由 Ag⁺ 決定，不受 Cl⁻ 過量影響",
    (pa ? pa.n : "—") + " vs " + (pb ? pb.n : "—"));
}

R.section("空燒杯：pH 7、沒有觀察事件");
{
  const r = computeFor([], null);
  R.ok(r.pH === 7 && r.V === 0, "空溶液 pH 7、體積 0", "pH " + r.pH + "、V " + r.V);
  R.ok(r.obs.length === 0, "沒有觀察事件", JSON.stringify(r.obs));
}

R.done();
