/*
 * metrology-test.js — 量具讀數實驗
 *
 * 這一個實驗的正確性標準跟其他實驗不同：它教的是「讀數規則」本身，
 * 所以規則錯了就是教錯，比數值算差幾個百分比嚴重得多。
 * 因此這裡逐條斷言讀數規則，而不只是檢查有沒有畫出東西。
 *
 * 化學版的三種量具與課本慣例：
 *   10 mL 量筒   最小刻度 1 mL   → 估到 0.1 mL，不確定度 ±0.5 mL
 *   滴定管       最小刻度 0.1 mL → 估到 0.01 mL，不確定度 ±0.05 mL
 *   電子天平     最小刻度 0.001 g → 估到 0.0001 g，不確定度 ±0.0005 g
 */
require("./harness.js");
const PL = window.PhysicsLab;

let pass = 0, fail = 0;
const ok = (c, n, d) => { c ? pass++ : fail++; console.log((c ? "  ✓ " : "  ✗ ") + n + (d ? "  " + d : "")); };

let ctx = null;
PL._hooks.onBuilt(c => { if (c.id === "measurement") ctx = c; });

function build() {
  ctx = null;
  const root = document.createElement("div");
  root.dataset = { simId: "measurement" };
  const api = PL.get("measurement").build(root);
  flushFrames(2);
  return { api, root, ctx };
}
function readOut(c, label) {
  const r = (c.readouts || []).find(x => x.label === label);
  return r ? r.value : null;
}
function readNum(c, label) {
  const r = (c.readouts || []).find(x => x.label === label);
  return r ? r.number : null;
}
function readUnit(c, label) {
  const r = (c.readouts || []).find(x => x.label === label);
  return r ? r.unit : null;
}
function slider(c, label) { return (c.sliders || []).find(x => x.label === label); }
function switchTool(B, value) {
  const sel = B.root.querySelector("select");
  if (!sel) return false;
  sel.value = value;
  sel.dispatch("change", {});
  if (B.api.rerender) B.api.rerender();
  return true;
}

console.log("=== 建置 ===");
let B = build();
ok(!!B.ctx, "取得建置脈絡");
ok((B.ctx.readouts || []).length === 3, "三個讀數欄位",
  (B.ctx.readouts || []).map(r => r.label).join(" / "));

const sRead = slider(B.ctx, "微調讀數");
ok(!!sRead, "找到微調滑桿");

console.log("\n=== 10 mL 量筒：最小刻度 1 mL、估到 0.1 mL ===");
ok(readOut(B.ctx, "讀值") === "28.0", "40 → 24.0 + 4.0 = 28.0", "得到 " + readOut(B.ctx, "讀值"));
ok(readOut(B.ctx, "不確定度") === "±0.5", "不確定度 ±0.5 mL", "得到 " + readOut(B.ctx, "不確定度"));
ok(readOut(B.ctx, "有效位數") === "1 位", "記到小數 1 位", "得到 " + readOut(B.ctx, "有效位數"));
ok(readUnit(B.ctx, "讀值") === "mL", "單位 mL", "得到 " + readUnit(B.ctx, "讀值"));

console.log("\n  讀值 = 24.0 + k×0.1，且固定一位小數（99 個位置）");
let bad = [];
for (let k = 0; k <= 99; k++) {
  sRead.write(k);
  if (B.api.rerender) B.api.rerender();
  const want = (24.0 + k * 0.1).toFixed(1);
  if (readOut(B.ctx, "讀值") !== want) bad.push("k=" + k + " → " + readOut(B.ctx, "讀值") + "，應為 " + want);
}
ok(bad.length === 0, "99 個位置全部符合 0.1 mL 刻度", bad.slice(0, 2).join(" ; "));

console.log("\n=== 滴定管：最小刻度 0.1 mL、估到 0.01 mL ===");
sRead.write(40); if (B.api.rerender) B.api.rerender();   // 回到 k = 40 再切換
ok(switchTool(B, "burette"), "切換到滴定管");
ok(readOut(B.ctx, "讀值") === "12.80", "40 → 12.40 + 0.40 = 12.80", "得到 " + readOut(B.ctx, "讀值"));
ok(readOut(B.ctx, "不確定度") === "±0.05", "不確定度 ±0.05 mL", "得到 " + readOut(B.ctx, "不確定度"));
ok(readOut(B.ctx, "有效位數") === "2 位", "記到小數 2 位", "得到 " + readOut(B.ctx, "有效位數"));
ok(readUnit(B.ctx, "讀值") === "mL", "單位 mL", "得到 " + readUnit(B.ctx, "讀值"));

bad = [];
for (let k = 0; k <= 99; k++) {
  sRead.write(k);
  if (B.api.rerender) B.api.rerender();
  const want = (12.40 + k * 0.01).toFixed(2);
  if (readOut(B.ctx, "讀值") !== want) bad.push("k=" + k + " → " + readOut(B.ctx, "讀值") + "，應為 " + want);
}
ok(bad.length === 0, "99 個位置全部符合 0.01 mL 刻度", bad.slice(0, 2).join(" ; "));

console.log("\n=== 電子天平：最小刻度 0.001 g、估到 0.0001 g ===");
sRead.write(40); if (B.api.rerender) B.api.rerender();
ok(switchTool(B, "balance"), "切換到電子天平");
ok(readOut(B.ctx, "讀值") === "1.2740", "40 → 1.234 + 0.040 = 1.2740", "得到 " + readOut(B.ctx, "讀值"));
ok(readOut(B.ctx, "不確定度") === "±0.0005", "不確定度 ±0.0005 g", "得到 " + readOut(B.ctx, "不確定度"));
ok(readOut(B.ctx, "有效位數") === "4 位", "記到小數 4 位", "得到 " + readOut(B.ctx, "有效位數"));
ok(readUnit(B.ctx, "讀值") === "g", "單位是 g，不是 mL", "得到 " + readUnit(B.ctx, "讀值"));
ok(readUnit(B.ctx, "不確定度") === "g", "不確定度單位也跟著換成 g", "得到 " + readUnit(B.ctx, "不確定度"));

bad = [];
for (let k = 0; k <= 99; k++) {
  sRead.write(k);
  if (B.api.rerender) B.api.rerender();
  const want = (1.234 + k * 0.001).toFixed(4);
  if (readOut(B.ctx, "讀值") !== want) bad.push("k=" + k + " → " + readOut(B.ctx, "讀值") + "，應為 " + want);
}
ok(bad.length === 0, "99 個位置全部符合 0.001 g 刻度", bad.slice(0, 2).join(" ; "));

console.log("\n=== 不確定度一律是最小刻度的一半 ===");
[["cylinder", 1, "mL"], ["burette", 0.1, "mL"], ["balance", 0.001, "g"]].forEach(([tool, res, unit]) => {
  switchTool(B, tool);
  const got = readOut(B.ctx, "不確定度");
  ok(got === "±" + (res / 2), tool + " → ±" + (res / 2) + " " + unit, "得到 " + got);
});

console.log("\n=== 教學鷹架：讀量具的三步 ===");
function countClass(node, cls) {
  let n = 0;
  (function walk(x) { if (x.classList && x.classList.contains(cls)) n++; (x.children || []).forEach(walk); })(node);
  return n;
}
[["sim-procedure-card", "步驟教學"], ["sim-rule", "鐵律警示"]]
  .forEach(([cls, name]) => ok(countClass(B.root, cls) > 0, name + " 已使用"));

if (B.api && B.api.stop) B.api.stop();
console.log("\n通過 " + pass + " 項，失敗 " + fail + " 項");
process.exit(fail ? 1 : 0);
