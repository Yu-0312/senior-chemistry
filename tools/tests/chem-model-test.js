/*
 * chem-model-test.js — 對照課本公式驗證核心化學實驗
 *
 * 判準是「和課本公式算出來的一致」，不是「有輸出數字」。
 * 這一點很重要：本專案出過一個實驗，殘差與擬合斜率全部是憑空乘係數編的，
 * 畫面也畫得有模有樣，只有拿封閉解對照才會發現。
 *
 * 這裡逐一驗：密度、莫耳、莫耳質量、百分組成、體積莫耳濃度、稀釋、
 * 限量試劑、產率、氣體體積比、中和熱、卡計、法拉第、Ksp、吉布斯、
 * 阿瑞尼斯、平衡 ICE、滴定、弱酸 pH、緩衝、速率律與電解。
 */
require("./harness.js");
const { reporter } = require("./_lib.js");
const PL = window.PhysicsLab;
const R = reporter();
document.documentElement.getAttribute = () => "dark";

/*
 * 掛鉤只能註冊一次：引擎的 onBuilt 沒有取消註冊的方法，
 * 寫在 open() 裡的話每開一個實驗就多一個掛鉤，而且每個都抓著一棵 DOM 樹。
 */
let LAST = null;
PL._hooks.onBuilt(c => { LAST = c; });

function open(id) {
  LAST = null;
  const root = document.createElement("div");
  root.dataset = { simId: id };
  const api = PL.get(id).build(root);
  flushFrames(2);                       // 第一格排在影格佇列，先把它跑掉
  const ctx = LAST;
  if (!ctx) throw new Error("沒有取得建置脈絡：" + id);
  const set = (label, v) => {
    const s = (ctx.sliders || []).find(x => x.label === label);
    if (!s) throw new Error(id + " 找不到滑桿：" + label);
    s.write(v);
    if (api.rerender) api.rerender();
  };
  const get = label => {
    const r = (ctx.readouts || []).find(x => x.label === label);
    return r ? r.number : null;
  };
  const text = label => {
    const r = (ctx.readouts || []).find(x => x.label === label);
    return r ? r.value : null;
  };
  return { ctx, api, root, set, get, text, stop: () => api && api.stop && api.stop() };
}
const close = (a, b, tol) => a != null && b != null && Math.abs(a - b) <= Math.abs(b) * (tol || 0.02) + 1e-9;

R.section("密度：ρ = m / V，且與體積無關");
{
  const s = open("density-lab");
  s.set("金屬體積", 30);
  R.ok(close(s.get("密度 ρ"), s.get("質量 m") / s.get("體積 V")), "30 cm³ 時 ρ = m/V",
    "m=" + s.get("質量 m") + " V=" + s.get("體積 V") + " ρ=" + s.get("密度 ρ"));
  const rho = s.get("密度 ρ");
  s.set("金屬體積", 50);
  R.ok(close(s.get("密度 ρ"), rho, 0.001), "體積改變、密度不變（同一塊金屬）",
    "30 cm³ → " + rho + "，50 cm³ → " + s.get("密度 ρ"));
  R.ok(s.text("比對結果") === "鋁", "ρ ≈ 2.7 比對出鋁", "得到 " + s.text("比對結果"));
  s.stop();
}

R.section("莫耳：n = m/M、N = nNₐ、V(STP) = 22.4n");
{
  const s = open("mole");
  s.set("水質量", 18);
  R.ok(close(s.get("莫耳數"), 1), "18 g 水 = 1 mol", "得到 " + s.get("莫耳數"));
  R.ok(close(s.get("分子數"), 6.02e23, 0.01), "1 mol = 6.02×10²³ 個分子", "得到 " + s.get("分子數"));
  R.ok(close(s.get("氣體體積（STP）"), 22.4), "1 mol 氣體在 STP 佔 22.4 L", "得到 " + s.get("氣體體積（STP）"));
  s.set("水質量", 36);
  R.ok(close(s.get("莫耳數"), 2), "36 g 水 = 2 mol", "得到 " + s.get("莫耳數"));
  R.ok(close(s.get("氣體體積（STP）"), 44.8), "2 mol → 44.8 L", "得到 " + s.get("氣體體積（STP）"));
  s.stop();
}

R.section("莫耳質量：M = m / n");
{
  const s = open("molar-mass");
  s.set("秤取質量", 36);
  const M = s.get("莫耳質量"), n = s.get("莫耳數");
  R.ok(close(M, 18.02, 1e-4), "水的莫耳質量 18.02 g/mol", "得到 " + M);
  R.ok(close(n, 36 / 18.02, 1e-4), "36 g ÷ 18.02 = 1.998 mol", "得到 " + n);
  s.stop();
}

R.section("質量百分組成：各元素百分比相加為 100%");
{
  const s = open("percent-composition");
  const txt = s.text("質量百分組成") || "";
  R.ok(/11\.2/.test(txt) && /88\.8/.test(txt), "H₂O 為 H 11.2% · O 88.8%", "得到 " + txt);
  R.ok(close(s.get("莫耳質量"), 18.02, 1e-3), "由原子量加總得 18.02", "得到 " + s.get("莫耳質量"));
  const m = txt.match(/([\d.]+)%/g) || [];
  const sum = m.reduce((a, x) => a + parseFloat(x), 0);
  R.ok(Math.abs(sum - 100) < 0.2, "百分比總和為 100%", "得到 " + sum.toFixed(1) + "%");
  s.stop();
}

R.section("體積莫耳濃度：M = n / V(L)");
{
  const s = open("molarity");
  s.set("秤取質量", 58);              // 約 1 mol NaCl
  s.set("定容體積", 500);
  const M = s.get("體積莫耳濃度"), n = s.get("溶質莫耳數");
  R.ok(close(n, 58 / 58.44, 0.01), "58 g NaCl ≈ 0.993 mol", "得到 " + n);
  R.ok(close(M, n / 0.5, 1e-6), "0.5 L 時的濃度 = n / 0.5",
    "n=" + n.toFixed(4) + " → M=" + M.toFixed(4));
  s.set("定容體積", 1000);
  R.ok(close(s.get("體積莫耳濃度"), M / 2), "體積加倍 → 濃度減半",
    M.toFixed(4) + " → " + s.get("體積莫耳濃度").toFixed(4));
  s.stop();
}

R.section("稀釋：M₁V₁ = M₂V₂，溶質莫耳數不變");
{
  const s = open("dilution");
  s.set("原濃度 M₁", 2);
  s.set("取用體積 V₁", 25);
  s.set("稀釋後體積 V₂", 250);
  R.ok(close(s.get("稀釋後濃度"), 0.2), "2 M × 25 mL 稀釋到 250 mL → 0.2 M",
    "得到 " + s.get("稀釋後濃度"));
  R.ok(close(s.get("溶質莫耳數"), 0.05), "溶質仍為 0.05 mol", "得到 " + s.get("溶質莫耳數"));
  s.set("取用體積 V₁", 50);
  R.ok(close(s.get("稀釋後濃度"), 0.4), "取用體積加倍 → 濃度加倍", "得到 " + s.get("稀釋後濃度"));
  s.stop();
}

R.section("限量試劑：2A + 3B → C，商最小者先用完");
{
  const s = open("limiting-reagent");
  s.set("A 的莫耳數", 4);
  s.set("B 的莫耳數", 6);
  R.ok(s.text("限量試劑") === "B", "A/2 = 2、B/3 = 2，同分時取 B", "得到 " + s.text("限量試劑"));
  R.ok(close(s.get("生成物 C"), 2), "生成 2 mol C", "得到 " + s.get("生成物 C"));
  R.ok(close(s.get("剩餘 A"), 0) && close(s.get("剩餘 B"), 0), "兩者都恰好用完");
  s.set("B 的莫耳數", 12);
  R.ok(close(s.get("生成物 C"), 2) && s.text("限量試劑") === "A",
    "B 過量後 A 成為限量試劑，產量停在 2 mol",
    "C=" + s.get("生成物 C") + "，限量=" + s.text("限量試劑"));
  R.ok(close(s.get("剩餘 B"), 6), "B 剩 12 − 3×2 = 6 mol", "得到 " + s.get("剩餘 B"));
  s.stop();
}

R.section("百分產率：實際 / 理論 × 100%");
{
  const s = open("yield");
  s.set("實際產量", 7.2);
  s.set("理論產量", 9);
  R.ok(close(s.get("百分產率"), 80, 1e-6), "7.2 / 9 = 80%", "得到 " + s.get("百分產率"));
  s.set("實際產量", 9.9);
  R.ok(s.get("百分產率") > 100, "實際超過理論時產率 > 100%", "得到 " + s.get("百分產率"));
  s.stop();
}

R.section("氣體計量：同溫同壓下體積比 = 係數比");
{
  const s = open("gas-stoich");
  s.set("反應物體積", 3);
  // 預設反應 H₂ + Cl₂ → 2HCl：1 體積 → 2 體積
  R.ok(close(s.get("生成物體積"), 6), "3 L H₂ → 6 L HCl", "得到 " + s.get("生成物體積"));
  R.ok(s.text("體積比") === "2 : 1", "體積比 2 : 1", "得到 " + s.text("體積比"));
  s.stop();
}

R.section("中和熱：q = 57n kJ，ΔT = q / (mc)");
{
  const s = open("neutralization");
  s.set("生成水的莫耳數", 0.2);
  const q = s.get("放熱量"), dT = s.get("水溫上升"), n = s.get("生成水");
  R.ok(close(n, 0.2), "生成 0.2 mol 水", "得到 " + n);
  R.ok(close(q, 57 * 0.2), "q = 57 × 0.2 = 11.4 kJ", "得到 " + q);
  const mass = 100 + 0.2 * 40;
  R.ok(close(dT, q * 1000 / (mass * 4.18), 1e-6), "ΔT = q / (m·c)",
    "理論 " + (q * 1000 / (mass * 4.18)).toFixed(3) + "，得到 " + dT.toFixed(3));
  s.stop();
}

R.section("卡計：q = P·t、ΔT = q / (mc)");
{
  const s = open("calorimetry");
  s.set("水的質量", 250);
  s.set("加熱功率", 100);
  s.set("加熱時間", 60);
  R.ok(close(s.get("吸收熱量"), 6000, 1e-6), "100 W × 60 s = 6000 J", "得到 " + s.get("吸收熱量"));
  R.ok(close(s.get("溫升 ΔT"), 6000 / (250 * 4.18), 1e-6), "ΔT = 6000 / (250×4.18)",
    "得到 " + s.get("溫升 ΔT"));
  s.set("加熱功率", 200);
  R.ok(close(s.get("吸收熱量"), 12000, 1e-6), "功率加倍 → 熱量加倍", "得到 " + s.get("吸收熱量"));
  s.stop();
}

R.section("法拉第定律：m = MIt / nF");
{
  const s = open("faraday");
  s.set("電流", 2);
  s.set("通電時間", 600);
  const Q = 2 * 600;
  const want = 63.55 * Q / (2 * 96500);      // 預設沉積銅
  R.ok(close(s.get("電量"), Q, 1e-6), "Q = It = 1200 C", "得到 " + s.get("電量"));
  R.ok(close(s.get("沉積質量"), want, 1e-4), "銅沉積 m = MIt / 2F",
    "理論 " + want.toFixed(4) + " g，得到 " + s.get("沉積質量").toFixed(4));
  R.ok(close(s.get("沉積莫耳數"), Q / (2 * 96500), 1e-4), "電子莫耳數 / 2 = 銅莫耳數",
    "得到 " + s.get("沉積莫耳數"));
  s.stop();
}

R.section("溶解度積：AgCl 的莫耳溶解度 = √Ksp，且可跨越 Ksp");
{
  const s = open("ksp");
  R.ok(close(s.get("莫耳溶解度"), Math.sqrt(1.8e-10), 0.02), "√(1.8×10⁻¹⁰) ≈ 1.34×10⁻⁵ M",
    "得到 " + s.get("莫耳溶解度"));
  s.set("pC（−log 陽離子濃度）", 3);        // c = 1e-3，Q = 1e-6
  R.ok(close(s.get("陽離子濃度"), 1e-3, 1e-6), "pC 3 → c = 1.0×10⁻³ M", "得到 " + s.get("陽離子濃度"));
  R.ok(s.text("狀態") === "沉澱", "Q = 1×10⁻⁶ > Ksp → 沉澱",
    "Q=" + s.text("離子積 Q") + "，狀態=" + s.text("狀態"));
  s.set("pC（−log 陽離子濃度）", 5);        // c = 1e-5，Q = 1e-10 < Ksp
  R.ok(s.text("狀態") === "未飽和", "Q 低於 Ksp 時仍澄清",
    "Q=" + s.text("離子積 Q") + "，狀態=" + s.text("狀態"));
  s.stop();
}

R.section("溶解度積：CaF₂ 的 Q = [Ca²⁺][F⁻]² = 4c³");
{
  const s = open("ksp");
  const sel = s.root.querySelector("select");
  sel.value = "CaF2"; sel.dispatch("change", {}); s.api.rerender();
  R.ok(close(s.get("莫耳溶解度"), Math.pow(3.9e-11 / 4, 1 / 3), 0.02),
    "CaF₂ 莫耳溶解度 = (Ksp/4)^(1/3)", "得到 " + s.get("莫耳溶解度"));
  s.set("pC（−log 陽離子濃度）", 3);        // Q = 4e-9
  R.ok(s.text("狀態") === "沉澱", "4×(1×10⁻³)³ > Ksp → 沉澱",
    "Q=" + s.text("離子積 Q") + "，狀態=" + s.text("狀態"));
  s.set("pC（−log 陽離子濃度）", 5);        // Q = 4e-15
  R.ok(s.text("狀態") === "未飽和", "4×(1×10⁻⁵)³ < Ksp → 未飽和",
    "Q=" + s.text("離子積 Q") + "，狀態=" + s.text("狀態"));
  s.stop();
}

R.section("吉布斯自由能：ΔG = ΔH − TΔS");
{
  const s = open("gibbs");
  s.set("ΔH", -80);
  s.set("ΔS", 100);
  s.set("溫度", 298);
  R.ok(close(s.get("ΔG"), -80 - 298 * 0.1), "−80 − 298×0.100 = −109.8 kJ", "得到 " + s.get("ΔG"));
  R.ok(close(s.get("轉換溫度"), 800, 1e-6), "T = ΔH/ΔS = 800 K", "得到 " + s.get("轉換溫度"));
  s.set("ΔH", 50);
  R.ok(s.get("ΔG") > 0, "吸熱且熵增不夠大時 ΔG > 0", "得到 " + s.get("ΔG"));
  s.stop();
}

R.section("阿瑞尼斯：ln k = ln A − Ea/RT");
{
  const s = open("arrhenius");
  s.set("活化能 Ea", 80);
  s.set("溫度", 300);
  const Rgas = 8.314;
  const wantLn = Math.log(1e10) - 80000 / (Rgas * 300);
  R.ok(close(s.get("ln k"), wantLn, 1e-4), "300 K、Ea 80 kJ/mol 的 ln k",
    "理論 " + wantLn.toFixed(3) + "，得到 " + s.get("ln k").toFixed(3));
  R.ok(close(s.get("速率常數 k"), Math.exp(wantLn), 1e-4), "k = e^(ln k)",
    "得到 " + s.get("速率常數 k"));
  R.ok(close(s.get("直線斜率"), -80000 / Rgas, 1e-4), "斜率 = −Ea/R", "得到 " + s.get("直線斜率"));
  s.stop();
}

R.section("平衡 ICE：H₂ + I₂ ⇌ 2HI，K = (2x)²/((a−x)(b−x))");
{
  const s = open("equilibrium-constant");
  s.set("H₂ 初始濃度", 1);
  s.set("I₂ 初始濃度", 1);
  s.set("平衡常數 K", 50);
  const x = s.get("反應進度 x"), K = s.get("K");
  const back = Math.pow(2 * x, 2) / Math.pow(1 - x, 2);
  R.ok(close(back, K, 1e-3), "把 x 代回 K 表示式", "K=" + K + "，代回 " + back.toFixed(3));
  R.ok(close(s.get("[HI] 平衡"), 2 * x), "[HI] = 2x", "得到 " + s.get("[HI] 平衡"));
  s.stop();
}

R.section("滴定：強酸 + 強鹼的 pH 曲線");
{
  const s = open("titration");
  [[0, 1], [10, 1.368], [25, 7], [40, 12.36]].forEach(([v, pH]) => {
    s.set("加入鹼體積", v);
    R.ok(close(s.get("pH"), pH, 0.01), "加入 " + v + " mL → pH " + pH,
      "得到 " + s.get("pH").toFixed(3));
  });
  R.ok(close(s.get("當量點體積"), 25, 1e-6), "當量點在 25.00 mL", "得到 " + s.get("當量點體積"));
  s.stop();
}

R.section("弱酸 pH：pH = ½(pKa − log C)");
{
  const s = open("strong-weak");
  s.set("濃度", 0.1);
  const want = 0.5 * (4.76 - Math.log10(0.1));
  R.ok(close(s.get("pH"), want, 2e-3), "0.1 M 醋酸 pH ≈ 2.88",
    "理論 " + want.toFixed(3) + "，得到 " + s.get("pH").toFixed(3));
  R.ok(s.get("pH") > 2 && s.get("pH") < 3, "弱酸 pH 高於同濃度的強酸（1）", "得到 " + s.get("pH"));
  s.stop();
}

R.section("緩衝溶液：pH = pKa + log([A⁻]/[HA])");
{
  const s = open("buffer");
  s.set("共軛鹼 / 弱酸", 1);
  R.ok(close(s.get("pH"), 4.76, 1e-6), "比值 1 時 pH = pKa = 4.76", "得到 " + s.get("pH"));
  s.set("共軛鹼 / 弱酸", 10);
  R.ok(close(s.get("pH"), 4.76 + 1, 1e-6), "比值 10 時 pH = pKa + 1", "得到 " + s.get("pH"));
  s.stop();
}

R.section("速率律：rate = k[A]^m[B]^n");
{
  const s = open("rate-law");
  s.set("A 的級數 m", 2);
  s.set("B 的級數 n", 1);
  s.set("[A]", 2);
  s.set("[B]", 3);
  s.set("速率常數 k", 0.5);
  R.ok(close(s.get("反應速率"), 0.5 * 4 * 3), "0.5 × 2² × 3 = 6", "得到 " + s.get("反應速率"));
  R.ok(close(s.get("總反應級數"), 3), "總級數 2 + 1 = 3", "得到 " + s.get("總反應級數"));
  s.stop();
}

R.section("電解：Q = It，質量依 M/(nF) 換算");
{
  const s = open("electrolysis");
  s.set("電流", 2);
  s.set("通電時間", 300);
  R.ok(close(s.get("通過電量"), 600, 1e-6), "Q = 2 × 300 = 600 C", "得到 " + s.get("通過電量"));
  // 預設銅：m = 63.55 × 600 / (2 × 96500)
  R.ok(close(s.get("生成／沉積質量"), 63.55 * 600 / (2 * 96500), 1e-4),
    "銅沉積質量", "得到 " + s.get("生成／沉積質量"));
  s.stop();
}

R.section("熵：ΔS(宇宙) = ΔS(系統) + ΔS(環境)");
{
  const s = open("entropy");
  s.set("溫度", 273);
  const sys = s.get("ΔS 系統"), surr = s.get("ΔS 環境"), univ = s.get("ΔS 宇宙");
  R.ok(close(univ, sys + surr, 1e-6), "宇宙熵 = 系統 + 環境",
    sys.toFixed(2) + " + " + surr.toFixed(2) + " = " + univ.toFixed(2));
  R.ok(close(surr, -6010 / 273, 0.01), "ΔS(環境) = −ΔH/T", "得到 " + surr.toFixed(2));
  s.stop();
}

R.section("依數性：ΔTb = Kb·m·i、ΔTf = Kf·m·i");
{
  const s = open("colligative");
  s.set("重量莫耳濃度", 1);
  R.ok(close(s.get("沸點上升"), 0.512 * 2), "NaCl i=2：ΔTb = 1.024 °C", "得到 " + s.get("沸點上升"));
  R.ok(close(s.get("凝固點下降"), 1.86 * 2), "NaCl i=2：ΔTf = 3.72 °C", "得到 " + s.get("凝固點下降"));
  s.stop();
}

R.section("酸鹼指示：pH 尺度與 [H⁺]");
{
  const s = open("ph-scale");
  s.set("pH", 3);
  R.ok(s.text("[H⁺] 濃度") === "1.00e-3", "pH 3 → [H⁺] = 1.00×10⁻³ M", "得到 " + s.text("[H⁺] 濃度"));
  R.ok(s.text("酸鹼性") === "酸性", "pH 3 判為酸性", "得到 " + s.text("酸鹼性"));
  s.set("pH", 11);
  R.ok(s.text("[OH⁻] 濃度") === "1.00e-3", "pH 11 → [OH⁻] = 1.00×10⁻³ M", "得到 " + s.text("[OH⁻] 濃度"));
  s.stop();
}

R.done();
