# The Dented Puck Foundation

A cross-platform mobile application built with **React Native**, **Expo**, **TypeScript**, **Tailwind CSS (NativeWind)**, and **Firebase**.

---

## Tech Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 57) + [React Native](https://reactnative.dev/) (0.86)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/) via [NativeWind v4](https://www.nativewind.dev/)
- **Backend / Database**: [Firebase JS SDK v12](https://firebase.google.com/docs/web/setup) (Authentication, Cloud Firestore, Storage) with `@react-native-async-storage/async-storage` session persistence

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/)
- **To test on desktop (Zero setup)**: Any standard web browser (Chrome, Safari, Edge)
- **To test on mobile (Zero Xcode/Android Studio)**: The free **Expo Go** app from the [Apple App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd the-dented-puck-foundation
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Set Up Environment Variables
Copy the `.env.example` file to create your local `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in your Firebase project credentials from the [Firebase Console](https://console.firebase.google.com/):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

> **Note:** Variables must be prefixed with `EXPO_PUBLIC_` so Expo makes them accessible to client-side code. The `.env` file is excluded from git via `.gitignore`.

---

## Running the App

Start the development server with a fresh cache:

```bash
npx expo start -c
```

### Option A: In a Web Browser (Instant Testing on your Computer)
You do not need a phone or simulator to test the app. You can run it instantly in your desktop browser:

```bash
npx expo start --web
```
*(Or run `npx expo start -c` and press `w` in the terminal).*

This boots the app directly in Safari or Chrome with full hot-reloading and Tailwind CSS styling!

### Option B: On a Mobile Device (Expo Go)
1. Ensure your phone and computer are on the **same Wi-Fi network**.
2. Run:
   ```bash
   npx expo start -c
   ```
3. Scan the QR code:
   - **iOS**: Open the native **Camera** app and tap the Expo Go banner.
   - **Android**: Open the **Expo Go** app and tap **Scan QR code**.

---

## Project Structure

```
the-dented-puck-foundation/
├── .env.example          # Template for required environment variables
├── app.json              # Expo application configuration and bundle settings
├── babel.config.js       # Babel preset configuration for Expo and NativeWind
├── metro.config.js       # Metro bundler config wrapped with withNativeWind
├── tailwind.config.js    # Tailwind CSS paths, presets, and theme overrides
├── postcss.config.js     # PostCSS configuration for Tailwind CSS
├── tsconfig.json         # TypeScript configuration with @/* path aliases
├── nativewind-env.d.ts   # Ambient type definitions for NativeWind & CSS modules
├── global.css            # Root Tailwind directives (@tailwind base, etc.)
└── src/
    ├── app/              # Expo Router file-based screens
    │   ├── _layout.tsx   # Root navigation layout 
    │   └── index.tsx     # Starter home screen with Tailwind styling
    ├── assets/           # App icons, splash screens, and images
    ├── firebase/
    │   └── index.ts      # Firebase app, auth, db, and storage exports
    └── types/
        └── index.ts      # Shared domain models (User, Team, Event, Role, etc.)
```

---

## Useful Commands

| Command | Description |
| :--- | :--- |
| `npx expo start -c` | Start the development server and clear the bundler cache |
| `npx expo start --web` | Launch the app directly in your desktop browser |
| `npx tsc --noEmit` | Run TypeScript type checks across the codebase |
| `npx expo lint` | Run ESLint checks |

---

## Styling with Tailwind (NativeWind)

You can write standard Tailwind CSS `className` utilities directly on React Native components:

```tsx
import { View, Text } from 'react-native';

export default function MyComponent() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-900 p-6">
      <Text className="text-2xl font-bold text-white">The Dented Puck</Text>
      <Text className="text-sm text-sky-400 mt-2">Styled with Tailwind CSS</Text>
    </View>
  );
}
```

