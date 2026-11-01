/*
 * transport-test.js — 傳輸列必須真的能驅動實驗
 *
 * 使用者回報「有些實驗會有兩個播放」。查下去發現不只是重複：
 * 有些實驗在自己的迴圈回呼裡維護 running 旗標，
 * 傳輸列讓迴圈開始跑，回呼卻因為 running 為 false 而什麼都不做——
 * 結果是兩個開關必須同時打開，而學生看不出來要按哪一個。
 *
 * 化學版有靜態（拉滑桿即時重算）與動態（粒子、火焰、平衡）兩類實驗，
 * 所以除了「有動畫就要推得動」，也要確認靜態實驗的傳輸列正確收起播放鍵。
 */
require("./harness.js");
const fs = require("fs");
const { reporter } = require("./_lib.js");
const PL = window.PhysicsLab;
const R = reporter();
document.documentElement.getAttribute = () => "dark";

let LAST = null;
PL._hooks.onBuilt(c => { LAST = c; });

R.section("實驗不可以自己做播放／暫停按鈕");
{
  const bad = [];
  fs.readdirSync("js/experiments").filter(f => f.endsWith(".js")).forEach(f => {
    const src = fs.readFileSync("js/experiments/" + f, "utf8");
    const re = /PL\.ui\.button\([^,]*,\s*"(暫停|播放|繼續)"/g;
    let m;
    while ((m = re.exec(src))) {
      const line = src.slice(0, m.index).split("\n").length;
      bad.push(f + ":" + line + " → 「" + m[1] + "」");
    }
  });
  R.ok(bad.length === 0, "沒有重複的播放／暫停按鈕", bad.slice(0, 12).join("\n      "));
}

R.section("不可以用自己的旗標把傳輸列擋住");
{
  /*
   * 具體的反模式：迴圈回呼一開頭就用一個布林旗標決定要不要前進。
   * 傳輸列讓迴圈跑起來，回呼卻因為旗標是 false 而什麼都不做，
   * 於是「兩個開關要同時打開」。這是實際回報過的問題。
   */
  const bad = [];
  fs.readdirSync("js/experiments").filter(f => f.endsWith(".js")).forEach(f => {
    const src = fs.readFileSync("js/experiments/" + f, "utf8");
    const re = /PL\.loop\(\s*(?:function\s*)?\(?\s*dt[^)]*\)?\s*=>?\s*\{([^\n]*\n){0,3}/g;
    let m;
    while ((m = re.exec(src))) {
      const body = m[0];
      const g = /if\s*\(\s*dt\s*&&\s*([A-Za-z_$][\w$]*)\s*\)|if\s*\(\s*!\s*([A-Za-z_$][\w$]*)\s*\|\|\s*!\s*dt\s*\)/.exec(body);
      if (!g) continue;
      const flag = g[1] || g[2];
      /* 只有「開關式」旗標才是問題；單向觸發是實驗內容的一部分。 */
      if (!new RegExp(flag + "\\s*=\\s*!\\s*" + flag).test(src)) continue;
      const line = src.slice(0, m.index).split("\n").length;
      bad.push(f + ":" + line + " → 迴圈被開關式旗標 " + flag + " 擋住");
    }
  });
  R.ok(bad.length === 0, "沒有實驗用開關式旗標擋住傳輸列", bad.slice(0, 10).join("\n      "));
}

R.section("動態實驗：傳輸列的單步真的推得動時間軸");
{
  LAST = null;
  const root = document.createElement("div");
  root.dataset = { simId: "mole" };
  const api = PL.get("mole").build(root);
  const ctx = LAST;
  const loop = (ctx.loops || [])[0];
  R.ok(!!loop, "mole 有動畫迴圈（粒子雲）");
  const before = loop ? loop.t : 0;
  for (let i = 0; i < 120; i++) if (loop) loop.stepOnce(1 / 60);
  const after = loop ? loop.t : 0;
  R.ok(after > before + 1.5, "跑 2 秒，模擬時間跟著前進",
    "t " + before.toFixed(2) + " → " + after.toFixed(2));
  const trans = root._labTransport;
  R.ok(!!trans && trans.playBtn.hidden !== true, "動態實驗保留播放鍵");
  R.ok(!!trans && (!trans.playHint || trans.playHint.hidden === true), "有播放鍵時不顯示調整提示");
  if (api && api.stop) api.stop();
}

R.section("動態實驗清單：每個都有迴圈");
{
  /*
   * 不是每個化學實驗都需要動畫（密度、濃度、滴定曲線都是拉了就算）。
   * 但只要有標 animate: true，就必須真的建立迴圈，否則播放鍵會是空的。
   */
  const ANIMATED = ["particle-model", "heating-curve", "mole", "soap", "rate-factors", "equilibrium", "metallic-bond"];
  const bad = [];
  ANIMATED.forEach(id => {
    if (!PL.has(id)) { bad.push(id + "（不存在）"); return; }
    const r = document.createElement("div");
    r.dataset = { simId: id };
    let a = null, ctx = null;
    LAST = null;
    try { a = PL.get(id).build(r); ctx = LAST; } catch (e) { bad.push(id + "（建置失敗：" + e.message + "）"); return; }
    if (!ctx || !(ctx.loops || []).length) bad.push(id + "（沒有迴圈）");
    try { if (a && a.stop) a.stop(); } catch (e) {}
  });
  R.ok(bad.length === 0, "七個動態實驗都建立得起來且都有迴圈", bad.join("、"));
}

R.section("靜態實驗：收起播放／單步／速度，提示改成調整參數");
{
  const root = document.createElement("div");
  root.dataset = { simId: "measurement" };
  const api = PL.get("measurement").build(root);
  const trans = root._labTransport;
  R.ok(!!trans && trans.playBtn.hidden === true, "靜態實驗隱藏播放鍵");
  R.ok(!!trans && trans.stepBtnT.hidden === true, "靜態實驗隱藏單步");
  const speedWrap = root.querySelector(".sim-speed");
  R.ok(!!speedWrap && speedWrap.hidden === true, "靜態實驗隱藏速度列");
  R.ok(!!trans && trans.timeLabel.hidden === true, "靜態實驗隱藏模擬時間");
  R.ok(!!trans && trans.playHint && trans.playHint.hidden === false, "顯示調整參數提示");
  R.ok(!!trans && /調整參數/.test(trans.playHint.textContent),
    "提示文案：" + (trans.playHint ? trans.playHint.textContent : ""));
  if (api && api.stop) api.stop();
}

R.section("穩態動畫進場就播放；靜態實驗不假裝在跑");
{
  window.PhysicsLabNoAutoplay = false;
  const state = id => {
    const r = document.createElement("div");
    r.dataset = { simId: id };
    const a = PL.get(id).build(r);
    const ctx = LAST;
    const loop = ctx && (ctx.loops || [])[0];
    const t = r._labTransport;
    const playing = !!t && /暫停/.test(t.playBtn.textContent);
    const out = { playing, running: !!(loop && loop.running) };
    try { if (a && a.stop) a.stop(); } catch (e) {}
    return out;
  };
  const mole = state("mole");
  R.ok(mole.playing === true && mole.running === true, "mole（粒子在動）進場就播放");
  const measure = state("measurement");
  R.ok(measure.playing === false && measure.running === false, "measurement 沒有播放狀態");
  window.PhysicsLabNoAutoplay = true;
}

R.done();
