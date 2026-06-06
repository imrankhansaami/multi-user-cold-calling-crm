# Multi-User Cold Calling CRM

A rapid, mobile-optimized CRM and gamified sprint dashboard designed for small sales teams of 2-5 callers. This workspace enables callers to log outbound actions, trigger instant SIM routing, map lead outcomes, sync to live worksheets, and monitor long-term pacing goals.

Created with 💡 and precision by **Imran Khan**.

---

## 🚀 Key Features

*   🎯 **Sprint Goal Center**: Track and configure live **Daily, Weekly, Monthly, and Yearly outbound KPI targets** for each representative with highly responsive concentric pacing ring visualizations.
*   📞 **Dynamic Dialer & Outcome Loggers**: Select leads and trigger quick-action dialing routes. Quickly record call outcomes with custom disposition tags (`No Answer`, `Left Voicemail`, `Gatekeeper`, `Busy`, `Not Interested`, `Callback`, or `Closed`).
*   📊 **Dashboard Analytics & Charting**: Get instant visual breakdowns of lead pipeline demographics and disposition ratios using premium responsive data layouts.
*   👥 **Unified Team Console**: Toggle between caller profiles to review active states, custom goals, and individual team leaderboard streaks.
*   🔌 **Google Sheets Sync**: Real-time background replication of dialing sequences directly into any cloud-hosted workspace spreadsheet.
*   ✨ **Milestone Celebrations**: Interactive physics-based canvas effects celebrating closed pipelines and milestone goal completions.

---

## 🛠️ Tech Stack & Architecture

- **Frontend Core**: [React (TypeScript)](https://react.dev/) + [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for fluid responsive styling
- **Animations**: [Motion](https://motion.dev/) (`motion/react`) for smooth physical layout transitions
- **Icons**: [Lucide React](https://lucide.dev/) for high-contrast, scalable vector iconography
- **Charts**: [Recharts](https://recharts.org/) and custom SVG rings for rich canvas statistics
- **State Management**: Highly optimized client-side state engines with synchronized local persistence

---

## 📦 Local Quickstart Instructions

Follow these straightforward steps to set up and execute the application in your local development environment:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) and `npm` installed.

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/cold-calling-crm.git
   cd cold-calling-crm
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory (using `.env.example` as a template):
   ```env
   # Example environment variables (if applicable)
   VITE_FIREBASE_API_KEY=your_firebase_api_key_here
   ```

4. **Launch Development Server**
   ```bash
   npm run dev
   ```
   The application will be served at `http://localhost:3000`.

5. **Production Build**
   To build the static application for production:
   ```bash
   npm run build
   ```
   The compiled optimized production files will be outputted to the `dist/` directory.

---

## 🌟 Author Profile

Developed and designed with modern design guidelines and architectural precision by **Imran Khan**. Feel free to star this repository or submit feedback issues if you are deploying this CRM for your sales pipelines!
