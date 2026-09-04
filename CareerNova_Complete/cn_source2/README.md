# CareerNova – Premium Job Portal

A full-featured, AI-powered job portal built with React + Vite.

## 🌐 Option A — Just open the site (no install needed)

Inside this ZIP you'll find a folder called **CareerNova_Site**.
Open `CareerNova_Site/index.html` in your browser. Done!

## 💻 Option B — Run in development mode

1. Install **Node.js 18+** from https://nodejs.org
2. Open a terminal in this folder (cn_source2)
3. Run: `npm install`
4. Run: `npm run dev`
5. Visit: http://localhost:5173

## 🏗️ Option C — Rebuild for production

npm run build      # outputs to dist/
npm run preview    # preview the production build locally

## 📁 File Structure

cn_source2/
├── index.html            ← Entry HTML
├── vite.config.js        ← Build config
├── package.json          ← Dependencies
├── src/
│   ├── main.jsx          ← React entry point
│   ├── App.jsx           ← Entire CareerNova app (all components)
│   └── index.css         ← Base reset
├── public/               ← Static assets (favicon etc.)
└── CareerNova_Site/      ← Pre-built site — open index.html here!
    ├── index.html
    └── assets/
        ├── index-*.js    ← Bundled JavaScript
        └── index-*.css   ← Bundled CSS
