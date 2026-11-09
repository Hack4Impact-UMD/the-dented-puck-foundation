This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Repository structure on `main`

The application is The Dented Puck Foundation. The inspected `main` uses Expo SDK 58, React Native 0.88, React 19.3, TypeScript, NativeWind v4 / Tailwind CSS v3, and the Firebase JS SDK. Treat `package.json` and the lockfile as the source for dependency versions; the README's version and structure summaries are older than the current code.

```text
src/
  app/
    _layout.tsx             # Root Stack, font loading, global CSS import
    index.tsx               # Current home: Firebase status and development links
    auth/
      _layout.tsx           # Authentication Stack
      index.ts              # Empty placeholder
      login.tsx             # Google sign-in screen (currently web only)
      signup.tsx            # Account creation screen
      verify-email.tsx      # Email verification screen
    invite/
      [token].tsx           # Invite token scaffold; no screen component yet
    tabs/
      teams/
        _layout.tsx         # Teams Stack
        [teamId].tsx        # Team detail screen
        index.tsx           # Comment-only placeholder
        create.tsx          # Empty placeholder
        find.tsx            # Comment-only placeholder
        request-sent.tsx    # Empty placeholder
  components/
    auth/                   # Shared auth fields, buttons, headers, verification UI
    team/                   # Shared team buttons, header, icon, and info card
  firebase/
    index.ts                # Firebase app, auth, Firestore, and Storage exports
  services/
    authService.ts          # Authentication and user profile operations
    teamService.ts          # Team lookup and season label helper
    inviteService.ts        # Empty service placeholder
  types/
    index.ts                # Shared user, team, event, conversation, message models
  utils/
    validation.ts           # Email and password validation
  assets/                   # App icons, splash images, and auth icons
scripts/
  seed.ts                   # Firestore seed script
```

- The `@/*` import alias maps to `src/*` in `tsconfig.json`.
- Styling tokens and font families live in `tailwind.config.js`; Tailwind directives live in `global.css`. The root layout loads Atkinson Hyperlegible regular and bold fonts.
- `app.json` holds Expo configuration. `babel.config.js`, `metro.config.js`, and `postcss.config.js` configure the Expo / NativeWind toolchain.
- `.env.example` lists the required `EXPO_PUBLIC_FIREBASE_*` settings used by `src/firebase/index.ts`.
- A directory named `tabs` exists, but `main` has no `src/app/tabs/_layout.tsx` or shared bottom tab navigator. Several route files are placeholders; their presence does not mean the feature is implemented.

## Figma design reference

Read [figma.md](./figma.md) before working on either home view. It records the supplied Figma page, direct links to the updated **For You** and **Discover** screens, their accessibility annotations, and the gap between the designs and `main`.

Keep Figma observations and home page design notes in `figma.md`. Recheck the live frames before implementing changes, since the design can change independently of this repository.

Use original Figma assets for the dashboard. Exact SVG exports are under `src/assets/home/svg/`, preserving their paths, full canvas, and transparency with `contentsOnly: true` and `useAbsoluteBounds: true`. The six icons are vectors; the wordmark is a cropped bitmap in Figma. `HomeWordmark` uses its original 1200 × 480 image under `src/assets/home/originals/` with the exact crop matrix from the SVG export. Do not trace the logo, upscale an existing PNG, or substitute screenshots. Native SVG icon rendering awaits authorization to install `react-native-svg` and `react-native-svg-transformer` under the dependency restriction below; the icons currently retain the Figma-exported PNG density variants. [figma-assets.json](./src/assets/home/figma-assets.json) records permanent links, node IDs, geometry, and checksums; see [figma.md](./figma.md#image-asset-quality--november-5-2026) for the source details.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

`main` currently tracks `package-lock.json` and uses npm / `npx`.

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
