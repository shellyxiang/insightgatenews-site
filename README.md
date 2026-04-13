# Insight Gate

> **Give civilization to time, not time to civilization.**
> *— Liu Cixin, The Three-Body Problem*

> **给岁月以文明，而不是给文明以岁月。**
> *—— 刘慈欣《三体》*

---

## About / 关于

**EN:** Insight Gate is a free educational website dedicated to making economics and finance accessible to everyone. No paywalls, no jargon walls — just honest knowledge for curious minds. Built by an economics researcher who believes understanding how the world works is something every ordinary person deserves.

**中文：** Insight Gate 是一个免费的经济金融科普网站。我们相信，理解世界运作的方式，是每一个普通人都值得拥有的能力。没有付费墙，没有门槛，只是把经济和金融的世界，用普通人能读懂的方式讲出来。

🌐 **Live site:** [insightgatenews.com](https://www.insightgatenews.com)

---

## Features / 功能特色

| Feature | 功能 |
|---|---|
| 🗺️ Interactive world economic role map | 全球经济角色互动地图 |
| 🌐 Full bilingual switching (EN / 中文) | 中英文全站切换 |
| 📱 Mobile responsive with slide-up panel | 手机端适配，底部抽屉面板 |
| 🌙 Dark theme, easy on the eyes | 深色主题 |
| 📖 Per-country bilingual articles | 每个国家配有中英文文章 |

Click any country on the map to explore its structural role in the global economy — trade relationships, economic model, key industries, and more.

点击地图上任意国家，了解其在全球经济体系中的结构性角色——贸易关系、经济模式、主要产业等。

---

## Tech Stack / 技术栈

- **Pure HTML / CSS / JavaScript** — no framework, no build step
- **[D3.js v7](https://d3js.org/)** — SVG world map rendering with NaturalEarth projection
- **[marked.js](https://marked.js.org/)** — Markdown article rendering for country pages
- **Google Analytics** — traffic tracking
- **GitHub Pages** — static site hosting

---

## Project Structure / 项目结构

```
insightgatenews-site/
├── index.html          # World map homepage / 地图首页
├── contact.html        # About page / 关于页
├── login.html          # Join Us page / 加入我们
├── country.html        # Country article viewer / 国家文章页
├── privacy.html        # Privacy policy / 隐私政策
├── terms.html          # Terms of service / 服务条款
├── styles.css          # Shared styles
├── data/
│   ├── world.geojson           # World map geodata / 世界地图数据
│   └── countries-core.json     # Country economic role data / 国家经济角色数据
└── articles/
    ├── USA.en.md       # Country articles, bilingual
    ├── USA.zh.md       # 国家文章，中英双语
    └── ...
```

---

## Deployment / 部署

This is a fully static site hosted on GitHub Pages with a custom domain.

这是一个纯静态网站，通过 GitHub Pages 托管，绑定自定义域名。

No server, no database, no build process required. Just push and it's live.

无需服务器、数据库或构建工具，推送即上线。

---

## Contact / 联系

Email: support@insightgatenews.com

---

## Disclaimer / 免责声明

**EN:** All content on Insight Gate is for informational and educational purposes only. It does not constitute financial, investment, or legal advice. We are not a licensed financial service provider.

**中文：** Insight Gate 提供的所有内容仅用于教育与信息目的，不构成投资、交易或法律建议。我们不是持牌金融服务提供者。

---

## License / 许可

Content is free to read for personal and educational use. Please do not reproduce for commercial purposes without permission.

内容免费供个人及教育用途阅读。未经许可，请勿用于商业目的。

© Insight Gate. All rights reserved.
