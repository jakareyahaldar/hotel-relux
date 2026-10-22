# 🏨 Hotel Relax — Boutique Hotel Website

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Node](https://img.shields.io/badge/Node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

A modern, single-page React website for a **13-room boutique hotel** — complete with
room search & availability, a guided booking flow, WhatsApp/call confirmation, gallery,
amenities, testimonials, FAQ and contact sections. Built with React 18 + Vite and
styled with a custom design system (no UI framework).

> **Live repo:** https://github.com/jakareyahaldar/hotel-relux

---

## ✨ Features

- **Hero & booking bar** — pick check-in, check-out, guests and room type in one place.
- **Smart room search** — filters 13 rooms by availability, capacity and type
  (classic / deluxe / suite).
- **Guided booking modal** — validate guest details, pick extras, see a live price
  breakdown (room + extras + tax).
- **WhatsApp & phone confirmation** — one tap opens WhatsApp with a pre-filled
  booking message, or dials the front desk. No room number is ever leaked to the
  guest; the front desk allocates the physical room at check-in.
- **No accidental close** — the booking modal can't be dismissed by clicking
  outside; use the close button or `Esc`.
- **Gallery, amenities, testimonials, FAQ & contact** sections with scroll reveals.
- **Responsive** layout with a custom CSS design system.
- **Local persistence** via `localStorage` (no backend required).
- **Unit + render tests** covering the booking engine, pricing, availability and
  the full booking flow.

## 🧱 Tech stack

| Layer | Choice |
|---|---|
| UI | React 18 (functional components + hooks) |
| Build | Vite 6 |
| Styling | Plain CSS (custom design tokens in `src/styles/global.css`) |
| State | React state + `localStorage` |
| Tests | Node built-in test runner (`node:test`) + render script |
| Language | JavaScript (ES modules) |

## 🚀 Getting started

### Prerequisites

- [Node.js](https://nodejs.org) **18+**
- npm (ships with Node)

### Install & run

```bash
git clone https://github.com/jakareyahaldar/hotel-relux.git
cd hotel-relux
npm install
npm run dev
```

Then open the URL printed by Vite (usually http://localhost:5173).

### Production build

```bash
npm run build      # outputs to dist/
npm run preview    # serves the built app
```

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build |
| `npm test` | Run unit tests for the booking engine |
| `npm run test:render` | Run the headless render smoke test |
| `npm run test:all` | Run both unit and render tests |

## 📁 Project structure

```
hotel/
├── index.html
├── package.json
├── vite.config.js
├── scripts/
│   └── render-test.mjs
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── components/
│   ├── data/
│   ├── styles/
│   └── utils/
└── dist/
```

## 🛏️ Booking flow

1. Guest selects dates, guests and room type → **Search**.
2. Available rooms are shown; click **Book** to open the booking modal.
3. Fill guest details, pick extras, review the price breakdown.
4. Submit → booking is persisted and a confirmation screen appears.
5. Confirm via **WhatsApp** (pre-filled message) or **call** the front desk.

The exact room number is never shown online — the front desk allocates the best
available room of the chosen category at check-in.

## 🧪 Testing

```bash
npm test
npm run test:render
```

## 🤝 Contributing

1. Fork the repo and create a feature branch.
2. Make your changes with clear commits.
3. Run `npm run test:all` and `npm run build` before opening a PR.

## 📄 License

Released under the [MIT License](LICENSE).

---

Made with ❤️ for Hotel Relax.