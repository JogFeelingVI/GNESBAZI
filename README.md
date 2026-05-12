# Celestial Observation & Bazi HUD (Geospatial Observer)

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

A sophisticated web application combining professional celestial mapping with Bazi (Chinese Astrology) profile management. Designed for high-precision analytics and AI-powered astrological reporting.

## 🌟 Features

- **Celestial Map HUD**: Real-time position tracking of stars and planets using a custom-styled Leaflet interface.
- **Bazi Profile Core**: Manage full natal charts (Year, Month, Day, Hour pillars) with integrated target date prediction.
- **AI Fortune Report Generator**: One-click generation of detailed prompts for Gemini/LLMs, combining celestial mechanics with traditional Bazi theory.
- **Marked Sites System**: Bookmark specific coordinates with automatic elevation lookup and one-tap coordinate recall.
- **Geospatial Observer HUD**: Professional-grade telemetry display including Local Epoch, Chronos Alignment, Sun/Moon azimuth, and magnetic declination.
- **Responsive "Glassmorphism" UI**: High-density information display optimized for both desktop analysis and mobile field use.

## 🛠 Tech Stack

- **React 18** (Vite-powered)
- **Tailwind CSS**: Utility-first styling with custom "Cyber-HUD" theme.
- **Motion (Framer Motion)**: Fluid transitions and UI interactions.
- **Leaflet**: High-performance interactive maps.
- **Lunar-JavaScript**: Precise calendar and Bazi calculations.
- **Lucide React**: Vector-perfect iconography.

## 📜 Version History & Updates

### BUILD_REV: 20260507.0716 (Latest)
- **Header Optimization**: Relocated "Local Epoch" and "Chronos Alignment" to the main header for instant visibility.
- **Bazi Styling**: Implemented specialized golden text for Bazi pillars in the HUD.
- **UI Simplification**: Removed redundant coordinate and timezone strings from the header to reduce visual clutter.
- **Modal Refinements**: 
  - Removed visible scrollbars from prompt text areas while maintaining full scroll capability.
  - Implemented background scroll-locking when modals are active.
- **Version Tracking**: Switched from static version numbers to a build-revision timestamp system.

---

## 🚀 Run locally

**Prerequisites:** Node.js

1. **Install dependencies**:
   `npm install`
2. **Environment Setup**:
   Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key.
3. **Start Development**:
   `npm run dev`

## 🌐 View your app
- **Live Deployment**: [gnesbazi.vercel.app](https://gnesbazi.vercel.app/)
