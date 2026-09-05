# CareerNova – Premium Job Portal

A full-featured, AI-powered job portal built with React + Vite.

## 🌐 Option A — Just open the site (no install needed)

Inside this ZIP you'll find a folder called **CareerNova_Site**.
Open `CareerNova_Site/index.html` in your browser. Done!

## 💻 Option B — Run in development mode

1. Install **Node.js 18+** from https://nodejs.org
2. Open a terminal in this folder (cn_source2)
3. Run: `npm install`
4. **Start the OTP server** (required for email verification on sign-up):
   - Open a **second** terminal
   - Run: `node src/server.js`
   - It will start on http://localhost:4000
   - *Note:* update the Gmail App Password in `src/server.js` if needed
5. Back in the first terminal run: `npm run dev`
6. Visit: http://localhost:5173

> **Email OTP verification** — when creating a new account (Job Seeker **or**
> Employer), a 6-digit OTP is emailed to you. You must enter it before the
> account is created. The OTP server (`src/server.js`) handles sending and
> verifying these codes, so keep it running alongside `npm run dev`.

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
