# 📱 Momentum — Mobile Client (`momentum-mobile`)

This is the mobile application for the Momentum platform. Designed for individual family devices (e.g. tablet in the kitchen, personal phone) with ADHD-focused layouts, the app features point tracking, visual tasks/quests lists, a bento parent dashboard, and a secure PIN keypad.

---

## 🛠️ Tech Stack & Dependencies
*   **Framework:** React Native with Expo (v49+)
*   **Language:** TypeScript
*   **State Management:** React Context API (DataContext, SocketContext, ThemeContext)
*   **Routing:** React Navigation
*   **Styling:** Custom bento visual tokens (Fredoka & Inter premium typography)

---

## ⚙️ Environment Configuration

To point your mobile client to the BFF api gateway, create an `.env` file in the root of this folder (`momentum-mobile/.env`):

```ini
# API Gateway Endpoint (Development IP or production URL)
# Replace with your machine's local IP address if testing on a physical phone via Expo Go
EXPO_PUBLIC_API_URL=http://192.168.1.100:5001/api/v1
EXPO_PUBLIC_WS_URL=http://192.168.1.100:5001
```

---

## 🏃 Local Setup & Development

Run commands from this directory or via the monorepo root:

### From the Service Directory (`momentum-mobile/`):
```bash
# Install local packages
npm install

# Start Expo Developer Tools in terminal
npm run start
```

Once started, Expo will display a QR code. You can run the application on:
*   **Expo Go App (Physical Device):** Download the Expo Go app on your iOS or Android phone, and scan the QR code using your phone's camera or the Expo app. Ensure your phone is on the **same Wi-Fi network** as your development machine.
*   **iOS Simulator:** Press `i` in the terminal to launch the Xcode iOS Simulator (requires macOS).
*   **Android Emulator:** Press `a` in the terminal to launch the Android emulator (requires Android Studio SDK setup).

---

## 📂 Key Directories

*   `src/components/` — Modular elements (PIN entry modals, task items, custom progress wheels, buttons).
*   `src/contexts/` — Global hooks for real-time WebSockets (`SocketContext`), local cache/data operations (`DataContext`), and styling customization themes (`ThemeContext`).
*   `src/screens/` — Mobile screen views organized by dashboard tabs (Bento Dashboard, Wishlists, Routine Tracker, Quests Board).
*   `src/theme/` — Bento UI visual design systems, color tokens, and custom layouts.

---

## 🎨 ADHD-Focused Themes
The system implements a customized palette tailored to prevent cognitive overwhelm. Family Members can personalize their device theme via their profile dashboards, selecting from:
*   **Retro Slate** (Calm and high-contrast)
*   **Cyber Neon** (High engagement)
*   **Ocean Breeze** (Soothing and low stimulus)
*   **Bento Default** (Balanced pastel tokens)

---

## 🧪 Testing & Verification
You can verify TypeScript compilations and run diagnostic bundles via:
```bash
# Compile and check for TS errors
npx tsc --noEmit
```
Refer to the [Bento UI Specification Sheet](file:///c:/Users/antho/OneDrive/Desktop/Momentum/docs/features/BENTO_UI_SYSTEM_SPEC.md) for layout guidelines.
