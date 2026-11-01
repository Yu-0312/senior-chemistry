<div align="center">

<img src="icons/icon-192.png" width="88" alt="化學實驗室圖示">

# 化學實驗室 · 台灣中學互動化學

**看得見的化學，可以動手玩的實驗室**

從國中自然的生活化學，銜接到 108 課綱高中必修、選修化學的互動模擬網站

[![實驗](https://img.shields.io/badge/%E4%BA%92%E5%8B%95%E5%AF%A6%E9%A9%97-96%20%E5%80%8B-2563eb?style=flat-square)](#課程模組)
[![模組](https://img.shields.io/badge/%E5%AD%B8%E7%BF%92%E6%A8%A1%E7%B5%84-12%20%E5%80%8B-7c3aed?style=flat-square)](#課程模組)
[![課綱](https://img.shields.io/badge/108%20%E8%AA%B2%E7%B6%B1-%E5%9C%8B%E4%B8%AD%20%E2%86%92%20%E9%AB%98%E4%B8%AD%20%E2%86%92%20%E9%81%B8%E4%BF%AE-db2777?style=flat-square)](#課程模組)
[![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS-%E7%84%A1%E6%A1%86%E6%9E%B6%E3%80%81%E5%85%8D%E5%BB%BA%E7%BD%AE-f7df1e?style=flat-square&logo=javascript&logoColor=black)](#技術架構)
[![PWA](https://img.shields.io/badge/PWA-%E5%8F%AF%E9%9B%A2%E7%B7%9A-5a0fc8?style=flat-square&logo=pwa&logoColor=white)](#技術架構)
[![授權](https://img.shields.io/badge/%E6%8E%88%E6%AC%8A-CC%20BY--NC--SA%204.0-ef9421?style=flat-square&logo=creativecommons&logoColor=white)](#授權)

</div>

全站繁體中文，涵蓋國中自然、高中必修化學與選修化學的加深加廣內容，目前提供 **12 個學習模組、96 個實驗主題、96 個即時 Canvas 互動模擬**。純靜態網站、沒有後端、不需要帳號——打開就能用。

> 這是 [senior-science](https://github.com/Yu-0312/senior-science)（物理版）的化學版復刻：沿用同一套教學鷹架、四種使用模式與 PWA 架構，課程與模擬全部改寫為化學內容。

## 四種使用方式

- **教師演示版**：精簡畫面，打開就能拖、直接投影演示。
- **自學完整版**：保留任務導讀、判讀與逐步引導鷹架，適合學生自己走完一個實驗。
- **關卡挑戰版**（`duo/`）：每個實驗是一關——先預測、把實驗調到目標值、讀數據、解情境題。
- **自訂實驗室**（`lab.html`）：自己調配溶液、觀察酸鹼與沉澱反應的自由沙盒。

## 課程模組

| # | 模組 | 主題 |
|---|---|---|
| 1 | 物質的組成與計量 | 粒子模型、密度、混合物分離、加熱曲線、有效數字、莫耳、莫耳質量、百分組成 |
| 2 | 原子結構與週期表 | 原子模型、次原子粒子、同位素、電子組態、週期趨勢、族與性質、焰色試驗、原子光譜 |
| 3 | 化學鍵與物質性質 | 離子鍵、共價鍵、金屬鍵、路易斯結構、VSEPR、極性、分子間作用力、網狀固體 |
| 4 | 化學反應與計量 | 平衡反應式、反應類型、莫耳比、限量試劑、產率、沉澱、氣體計量、熱化學 |
| 5 | 溶液與濃度 | 溶解、莫耳濃度、稀釋、溶解度、依數性質、導電度、膠體、硬水 |
| 6 | 酸鹼鹽與滴定 | 酸鹼定義、pH、強弱酸、滴定、緩衝、鹽類水解、中和、酸雨 |
| 7 | 氧化還原與電化學 | 氧化數、活性順序、伽凡尼電池、電解、腐蝕、電池、燃料電池、法拉第定律 |
| 8 | 反應速率與化學平衡 | 速率因素、速率定律、碰撞學說、催化劑、平衡、勒沙特列、平衡常數、哈伯法 |
| 9 | 有機化合物 | 烴類、異構物、官能基、醇、羧酸、酯、聚合物、生物分子 |
| 10 | 生活化學與材料 | 肥皂、清潔劑、食品、藥物、綠色化學、奈米材料、水處理、空氣污染 |
| 11 | 選修：物質結構與光譜 | 量子數、軌域、混成、分子軌域、進階 VSEPR、晶體、紅外光譜、核磁共振 |
| 12 | 選修：熱力學與分析 | 焓、熱量測定、熵、自由能、阿瑞尼斯方程、Ksp、進階滴定、層析 |

## 技術架構

- **純靜態**：HTML + CSS + Vanilla JS，沒有框架、沒有打包步驟。
- **模擬引擎**：`js/sim-core.js` 提供畫布、控制項、讀數、圖表與延遲載入；`js/chem-kit.js` 提供燒杯、滴定管、分子模型、能階、光譜等化學繪圖工具。
- **課程資料**：`js/curriculum.js` 是唯一課程來源；`js/experiment-manifest.js` 由 `tools/build-manifest.js` 執行每個實驗檔後自動產生，開啟實驗時才載入對應檔案。
- **靜態頁**：`tools/build-static.js` 產生 `p/<id>.html`、學習單、`experiments.html`、`sitemap.xml` 與 `robots.txt`。
- **PWA**：`sw.js` + `manifest.json`，支援離線與「下載全部實驗」。
- **測試**：`tools/tests/run-all.js`，含 96 個實驗逐一建置的煙霧測試、版面、控制項反應與建置一致性檢查。

## 本機執行

沒有建置步驟，直接用任何靜態伺服器開啟即可：

```bash
python3 -m http.server 8080
# 開啟 http://localhost:8080
```

重新產生實驗對應表與靜態頁：

```bash
node tools/build-manifest.js
node tools/build-static.js
node tools/verify-static.js
```

跑測試：

```bash
node tools/tests/run-all.js
```

## 部署狀態

已上線 GitHub Pages：<https://yu-0312.github.io/senior-chemistry/>（來源：`main` 分支根目錄）。`js/site-config.js` 的 `siteUrl` 就是這個網址，推上 `main` 後會自動重建。專案不使用 Vercel。

## 授權

教學內容與視覺素材採 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hant)；原始程式碼、商標與專案識別保留所有權利。詳見 [LICENSE.md](LICENSE.md) 與 [授權頁](licensing.html)。
