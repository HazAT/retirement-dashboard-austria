# Project Context & Development Guide

This document serves as a knowledge base for future agents and developers working on the **Austrian Retirement Dashboard**. It outlines the project structure, architectural decisions, and development processes.

## 🎯 Project Overview
A personal finance dashboard designed for the Austrian market to calculate early retirement scenarios.
- **Core Problem**: Visualizing the "Gap Years" between early retirement and the start of the Austrian State Pension (age 65).
- **Key Features**: Asset tracking, monthly income (rental), safe withdrawal rate calculation, and net worth projection up to age 100.
- **Privacy**: 100% local. Data is persisted in `localStorage`.

## 🛠 Tech Stack
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Framework**: Vanilla JavaScript (No React/Vue/Angular to keep it lightweight and simple).
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (using `@tailwindcss/postcss`).
- **Deployment**: GitHub Pages via GitHub Actions.

## 📂 Project Structure

```
├── .github/workflows/deploy.yml  # GitHub Pages deployment workflow
├── public/                       # Static assets (favicon.svg)
├── src/
│   ├── calculator.js             # Pure functions for financial logic (SWR, Gap, Projection)
│   ├── i18n.js                   # Translation dictionary (EN/DE)
│   ├── main.js                   # UI Rendering, Event Listeners, DOM Manipulation
│   ├── store.js                  # State Management & localStorage persistence
│   └── style.css                 # Tailwind CSS imports and custom styles
├── index.html                    # Entry point
├── postcss.config.js             # PostCSS config for Tailwind v4
└── vite.config.js                # Vite config (base URL for GitHub Pages)
```

## 🏗 Architecture & Patterns

### 1. State Management (`src/store.js`)
- **Reactive-ish**: The store emits a custom `store-updated` event whenever data changes.
- **Persistence**: Auto-saves to `localStorage`.
- **Schema Evolution**: Uses a **deep merge** strategy when loading data. This ensures that if we add new settings (like `investmentReturnRate`) in the code, they are correctly merged into the user's existing `localStorage` data without overwriting their values or causing `NaN` errors.

### 2. Financial Logic (`src/calculator.js`)
- **Pure Functions**: All calculations are pure functions taking `assets`, `incomes`, and `settings` as inputs.
- **Gap Logic**: Explicitly calculates two monthly budgets:
    1.  **Gap Phase**: SWR from Assets + Monthly Income.
    2.  **Pension Phase**: SWR from Assets + Monthly Income + State Pension.
- **Projection**: Iterative year-by-year calculation. **Important**: Withdrawals are inflation-adjusted (real terms), so we subtract `withdrawal` from the portfolio *before* or *after* growth depending on the model. Currently: `Start + Growth - Withdrawal + Income = End`.

### 3. Internationalization (`src/i18n.js`)
- **Dictionary**: Simple object with `en` and `de` keys.
- **Default**: German (`de`).
- **Usage**: `t('key')` helper in `main.js`.
- **Process**: When adding new UI text, always add keys to both `en` and `de` in `i18n.js`.

### 4. Styling (`src/style.css`)
- **Tailwind v4**: Uses the new `@theme` directive for custom colors (`--color-primary`, etc.).
- **Dark Mode**: The design is "dark/premium" by default.

## 🚀 Workflows

### Development
```bash
npm install
npm run dev
```

### Deployment
- **Automatic**: Pushing to the `main` branch triggers the `.github/workflows/deploy.yml` workflow.
- **Target**: Deploys to the `gh-pages` environment.
- **Configuration**: `vite.config.js` sets the `base` path to the repository name for correct asset linking on GitHub Pages.

### Adding Features
1.  **Data**: If new data is needed, update `defaultData` in `src/store.js`.
2.  **Logic**: Implement calculation logic in `src/calculator.js`.
3.  **UI**:
    - Add translations to `src/i18n.js`.
    - Update `render()` in `src/main.js`.
    - Add event listeners in `src/main.js` (delegate where possible or attach to static elements).

## 📝 Conventions
- **Currency**: Format using `de-AT` locale (`€ 1.234`).
- **Language**: Default to German.
- **Icons**: Use inline SVGs (Heroicons style) for simplicity.
- **Tooltips**: Use the `Tooltip(text)` helper in `main.js` for complex financial inputs.
