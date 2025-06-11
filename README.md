# Pomodoro Timer App

Maximize your productivity with the Pomodoro technique! This app helps you focus, track your work sessions, and analyze your progress with beautiful analytics and customizable settings.

---

## 🚀 Features

- **Pomodoro Timer**: Focus, short break, and long break cycles with customizable durations.
- **Task Management**: Add, track, and complete tasks with Pomodoro estimates.
- **Achievements**: Unlock productivity achievements as you progress.
- **Ambient Sounds**: Optional background sounds (rain, forest, ocean, café, white noise).
- **Statistics Dashboard**: Visualize your productivity, mood, and session history.
- **Daily Goals**: Set and track your daily Pomodoro targets.
- **Responsive Design**: Works great on desktop and mobile.
- **Dark/Light Theme**: Auto and manual theme switching.
- **Persistent Storage**: All data is saved locally in your browser.

---

## 🖥️ Demo

> pomodoro-app-weld-chi.vercel.app

---

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <repo-folder>
   ```
2. **Install dependencies:**
   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```
3. **Run the development server:**
   ```bash
   pnpm dev
   # or
   npm run dev
   # or
   yarn dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗂️ Project Structure

```
├── app/
│   ├── layout.tsx         # Global layout and theme provider
│   ├── page.tsx           # Main Pomodoro timer page
│   └── dashboard/
│       └── page.tsx       # Analytics dashboard
├── components/
│   ├── pomodoro-timer.tsx # Main timer logic and UI
│   ├── stats-dashboard.tsx# Analytics and charts
│   ├── progress-circle.tsx# Circular progress indicator
│   ├── theme-provider.tsx # Theme context provider
│   └── ui/                # Reusable UI components (buttons, cards, forms, etc.)
├── hooks/
│   ├── use-toast.ts       # Toast notification system
│   └── use-mobile.tsx     # Responsive/mobile detection
├── lib/
│   └── utils.ts           # Utility functions
├── public/                # Static assets (images, icons)
├── styles/                # Global styles (Tailwind CSS)
├── tailwind.config.ts     # Tailwind CSS configuration
├── package.json           # Project metadata and dependencies
└── ...
```

---

## 🧩 Main Components

### `PomodoroTimer`
- Handles timer logic, session switching, task management, achievements, and settings.
- Supports ambient sounds, auto-start, and notifications.
- Data is persisted in localStorage.

### `StatsDashboard`
- Visualizes session history, mood, productivity, and task progress using charts (Recharts).
- Filterable by day, week, or month.

### `ProgressCircle`
- Animated circular progress indicator for timer.

### `ThemeProvider`
- Integrates with `next-themes` for dark/light/system theme support.

### `useToast`
- Custom hook for toast notifications.

---

## ⚙️ Customization

- **Timer Settings**: Change focus/break durations, enable/disable sounds, set daily goals, and more in the app UI.
- **Themes**: Switch between light, dark, or system themes.
- **Ambient Sounds**: Choose from several background sounds or none.

---

## 🛠️ Technologies Used

- [Next.js](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) (for analytics)
- [Radix UI](https://www.radix-ui.com/) (for accessible UI primitives)
- [Zod](https://zod.dev/) (for schema validation)
- [date-fns](https://date-fns.org/) (date utilities)
- [Lucide React](https://lucide.dev/) (icons)
- [next-themes](https://github.com/pacocoursey/next-themes) (theme switching)

---

## 📋 Scripts

- `pnpm dev` / `npm run dev` — Start development server
- `pnpm build` / `npm run build` — Build for production
- `pnpm start` / `npm start` — Start production server
- `pnpm lint` / `npm run lint` — Lint code

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- Inspired by the Pomodoro Technique and various productivity tools.
- Built with [v0.dev](https://v0.dev/) and modern React ecosystem. 
