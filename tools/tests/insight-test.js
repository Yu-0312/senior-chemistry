/*
 * insight-test.js — 自動關係摘要（探測引擎）
 *
 * 探測引擎會在建置時掃描滑桿，用對數迴歸找出冪次律，
 * 自動寫出「M₂ ∝ 1/V₂」這類結論，再據此生成預測、挑戰與關係摘要。
 * 三個要求：
 *   1. 建置當下就要量得到——讀數若還沒畫出來，鷹架會安靜地消失
 *   2. 結論要和已知化學相符
 *   3. 探測完必須把滑桿還原——否則學生一進場看到的就不是預設值
 */
require("./harness.js");
const { reporter } = require("./_lib.js");
const PL = window.PhysicsLab;
const R = reporter();
document.documentElement.getAttribute = () => "dark";

const insights = {};
let LAST = null;
PL._hooks.onBuilt(c => { LAST = c; if (c.insight) insights[c.id] = c.insight; });

function build(id) {
  LAST = null;
  const root = document.createElement("div");
  root.dataset = { simId: id };
  const api = PL.get(id).build(root);
  return { root, ctx: LAST, api };
}

/*
 * 共用骨架的第一次繪製排在 requestAnimationFrame，但探測掛鉤是同步執行的。
 * 如果探測沒有先畫一次，讀數全是「—」，所有關係會被當成「不確定」跳過，
 * 整個學習鷹架就不會出現——而且不會有任何錯誤訊息。這一節守住回歸。
 */
R.section("建置當下就要有探測結果（不是等第一次動畫）");
["dilution", "molarity", "calorimetry", "faraday"].forEach(id => {
  if (!PL.has(id)) return;
  const b = build(id);
  const ins = insights[id];
  R.ok(!!ins && (ins.relations || []).length > 0,
    id.padEnd(14) + " 建置時就有關係量測",
    ins ? (ins.relations || []).length + " 條" : "沒有任何洞察");
  if (b.api && b.api.stop) b.api.stop();
});

R.section("探測結果要符合已知化學");
[
  ["dilution", "原濃度 M₁", "稀釋後濃度", 1, "M₂ ∝ M₁"],
  ["dilution", "稀釋後體積 V₂", "稀釋後濃度", -1, "M₂ ∝ 1/V₂"],
  ["molarity", "秤取質量", "體積莫耳濃度", 1, "M ∝ 溶質質量"],
  ["molarity", "定容體積", "體積莫耳濃度", -1, "M ∝ 1/V"],
  ["calorimetry", "水的質量", "溫升 ΔT", -1, "ΔT ∝ 1/m"],
  ["calorimetry", "加熱功率", "溫升 ΔT", 1, "ΔT ∝ P"],
  ["faraday", "電流", "沉積質量", 1, "m ∝ I"],
  ["faraday", "通電時間", "沉積質量", 1, "m ∝ t"],
  ["colligative", "重量莫耳濃度", "沸點上升", 1, "ΔTb ∝ m"],
  ["mole", "水質量", "莫耳數", 1, "n ∝ m"],
  ["electrolysis", "電流", "生成／沉積質量", 1, "m ∝ I"]
].forEach(([id, sl, ro, wantExp, desc]) => {
  if (!PL.has(id)) return;
  const b = build(id);
  const ins = insights[id];
  const rel = ins && (ins.relations || [])
    .find(r => r.slider.label === sl && r.readout.label === ro);
  if (!rel) {
    R.ok(false, id + "：" + desc, "找不到「" + sl + " → " + ro + "」這組關係");
  } else {
    const e = rel.exponent;
    R.ok(e != null && Math.abs(e - wantExp) < 0.12, id + "：" + desc,
      "指數 " + (e == null ? "—" : e.toFixed(3)) + "，理論 " + wantExp);
  }
  if (b.api && b.api.stop) b.api.stop();
});

R.section("有洞察的實驗要真的長出教學鷹架");
{
  const b = build("dilution");
  const predict = b.root.querySelectorAll(".sim-predict").length;
  const challenge = b.root.querySelectorAll(".sim-challenge").length;
  const relations = b.root.querySelectorAll(".sim-relations").length;
  const text = b.root.querySelectorAll(".sim-relations").map(n => n.textContent).join(" ");
  R.ok(predict === 1, "dilution 有「動手前先預測」", predict + " 個");
  R.ok(challenge === 1, "dilution 有可驗證的挑戰", challenge + " 個");
  R.ok(relations === 1 && /稀釋後濃度/.test(text), "關係摘要寫出這個實驗自己的讀數",
    text.slice(0, 60));
  if (b.api && b.api.stop) b.api.stop();
}

R.section("探測不可以污染實驗狀態（滑桿必須還原）");
["dilution", "calorimetry", "faraday", "molarity", "titration",
 "heating-curve", "ksp", "solubility", "rate-law"].forEach(id => {
  if (!PL.has(id)) return;
  const b = build(id);
  const bad = [];
  ((b.ctx && b.ctx.sliders) || []).forEach(m => {
    if (Math.abs(m.read() - m.initial) > 1e-9) {
      bad.push(m.label + "=" + m.read() + "≠" + m.initial);
    }
  });
  R.ok(bad.length === 0, id.padEnd(16) + " 滑桿已還原", bad.join("、"));
  if (b.api && b.api.stop) b.api.stop();
});

R.done();
