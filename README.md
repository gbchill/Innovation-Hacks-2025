# Innovation-Hacks-2025
Commands to run: 
cd WorkNest then npm install
cd frontend then npm install
cd .. then npm run start

🌿 WorkNest – Your Zen Productivity Hub
WorkNest is a native desktop productivity app that helps you plan, focus, and get things done—without distractions. Built with Electron and React, it combines modern UI design with smart AI features, blocking tools, and embedded browsing to help users stay in deep work mode.

⚙️ Tech Stack

Component	Technology
Desktop Shell	Electron.js
UI Framework	Vite, React.js, TailwindCSS (for fast, modern UI)
AI Engine	Gemini API (or local LLM fallback)
Data Storage	lowdb (light JSON DB) or SQLite (electron-sqlite3)
App Blocking / Focus	node-window-manager, active-win, robotjs, electron-deeplink, site-blocker
Notifications	electron-notification or system tray integration
Browser View	Electron BrowserView (controlled Chrome inside app)
🚀 Features
🧭 Dashboard
Quick overview of:

Today’s tasks

Calendar events

Active focus session status

📆 AI Calendar
Add events manually

Get smart suggestions via AI (e.g., “Study Session at 4 PM?”)

View your schedule in-app

✅ AI To-Do List
Add tasks manually

Automatically prioritize (🔥 urgent → ✅ done)

AI breaks down large tasks into smaller steps

🧘 Deep Work Mode
Activate “No Distractions” Mode

Block desktop apps (e.g., Chrome, Discord, Slack)

Block websites (e.g., YouTube, Reddit)

Pomodoro timer (25min work / 5min break)

🌐 Embedded Browser
Open work tools (e.g., Notion, Google Docs) inside app

Restrict access to distracting sites during Deep Work

🔔 Notifications
Gentle focus reminders ("Break time!")

Optional daily motivational quotes via system tray

🎨 Branding & UI
Theme: Zen Minimalism
Palette: Soft Pastels, Dark Forest Green, Warm Sand
Mood: Calm, focused, and flow-inducing—like Headspace, but for productivity.

👥 Team Roles
👤 George – AI Logic & Smart Features
Gemini API integration / fallback LLM

AI Task Suggestion + Prioritization

AI Event Suggestions & Date Parsing

Connect AI output to React state

👤 Aryan – Frontend & UX
UI Design with React + TailwindCSS

Zen Minimalist Components

Dashboard, Calendar, and Task UI

Visual consistency across all views

👤 Rowanth – Electron Shell & Browser
Electron shell setup

Embedded browser via BrowserView

Window controls, system tray, deeplinks

Electron notifications

👤 Naji – Focus Mode & Persistence
Deep Work Mode (App + Site blocking)

Pomodoro Timer Integration

SQLite / lowdb data persistence

State management for tasks/events


