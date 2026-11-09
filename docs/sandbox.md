# Fake login in Expo Go and the local Firebase sandbox

## One-tap preview in the regular app

Start the app normally with `npx expo start` and open the project in Expo Go. On the signed-out Home screen, tap **Fake login (dev)** directly below the sign-in prompt. The same button is available on the signed-out event list. It loads the sample account and events in place, without navigating to an auth page or opening a website. No sandbox environment flag or running Firebase emulators are needed.

The regular development preview uses the same fixture generator as the Firestore seed: Abir, joined Baltimore Blades, followed Dented Crew, 8 scheduled events, 26 Discover events, and a fake unread count of 3. It previews five Schedule events and two Discover events, with full-list paging. **Dev sign out** exits the demo and returns to Home; it does not sign out or change a real Firebase account. The preview session resets when the app reloads; local follow choices persist until reset. The preview is unavailable in release builds.

Tap the Home **Search team, event, or city** field and type directly. Results replace the dashboard lists in place and cover the complete visible sample feeds, rather than only the Home previews. Try **RCR**, **Ellicott City**, **Frederick**, or **Season kickoff** (an event beyond the first full-list page). **Clear** resets the query and restores the selected dashboard view. Teams, Schedule, and Discover events are grouped with result counts; team results support the same local Follow/Unfollow preference. Search respects the chosen discovery location and shows joined/followed teams as well. It works with normal fake login and the optional emulator source. Production search still requires an approved backend contract.

The November 8 native check used the existing normal Expo server on port 8081 in an isolated iPhone simulator: the button appeared under the sign-in prompt, loaded the sample Schedule directly, opened the full list, and returned to that same prompt on dev sign-out. Screenshots: [inline fake login](./sandbox/2026-11-08/ios-home-fake-login.png) and [sample full list](./sandbox/2026-11-08/ios-preview-list.png). Eleven dashboard tests, three preview tests, eight sandbox tests, lint, typecheck, and both native bundle exports pass. This does not establish Android-device or screen-reader approval.

## Optional Firestore emulator preview

Run from the repository root:

```sh
npm run sandbox
```

The command starts Firebase Authentication and Cloud Firestore emulators, seeds the dev account and events, then starts Expo in **LAN mode** with the sandbox flag. It prints the Expo Go address and, in an interactive terminal, a QR code. It does not automatically open a browser, simulator, or app. It uses the installed Firebase CLI and Expo packages; it does not install project dependencies or read `.env`.

When you are ready, scan the QR code in an SDK 58 compatible Expo Go installation on your phone and tap **Fake login (dev)** on the Home sign-in prompt. This launcher uses the seeded Auth account and Firestore data through the same in-app button. The phone and computer must share a network. Web remains available at **http://localhost:8082** if you open it manually.

The Firestore data browser is **http://localhost:4000/firestore/default/data**. Auth accounts are at **http://localhost:4000/auth**. A normal Expo server on port 8081 can remain running; the sandbox uses port 8082.

## Dev account and scenarios

- Email: `dev@dentedpuck.test`
- Password: `DentedPuckPreview123!` (public fixture credentials, only for the local Auth emulator)
- Display name: Abir
- Joined team: Baltimore Blades (BB)
- Followed team: Dented Crew (DC)
- For You: 8 upcoming events, including a multi-team game; five are shown in the preview.
- Discover: 26 regional public events from unaffiliated teams; two are shown in the preview, with 20 + 6 in the full-list pager.
- The seed also includes a past practice to exercise the date query. Out-of-region, private unaffiliated, and unknown-team fixtures are excluded from the visible feeds.
- Unread count: 3, deliberately fake. Notification detail, event detail, and other sibling features retain their existing unavailable destinations. Home search works within the visible sample catalog. Inline announcements remain empty to match the current For You frame.

The bottom sandbox bar identifies fake data and provides **Dev sign out**, returning to the Home prompt. In emulator mode, the Auth SDK persists the sandbox session separately from the normal Firebase app. Restarting the emulators creates a fresh sandbox; use the dev button again if a previous account token is no longer valid.

## Phones and simulators

```sh
npm run sandbox
```

Use an SDK 58 compatible Expo Go installation or a compatible development build. Scan Expo's QR code with the phone on the same trusted network as the computer. The launcher prefers a physical LAN interface over VPN and virtual adapters. The app derives the emulator host from Expo's LAN host. Web uses its current hostname; Android's local simulator falls back to `10.0.2.2`, and iOS's simulator to `127.0.0.1` when no LAN host is supplied.

If automatic addressing picks the wrong interface:

```sh
EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=192.168.1.42 npm run sandbox
```

Supply your computer's LAN IP, with no scheme or port. This one override sets both Metro's advertised host and the Firebase emulator host. Emulators bind to all interfaces for phone access. Do not use Expo's tunnel for this sandbox: it does not tunnel Firestore/Auth ports. A firewall must allow the phone to reach ports 8080, 8082, and 9099.

## Refresh and stop

With the sandbox running, reseed the known fixture IDs with dates relative to today:

```sh
npm run sandbox:seed
```

Then pull to refresh the dashboard or reload the browser. Reseeding reuses the dev account and overwrites known fixture documents; it does not accumulate duplicate events or remove manual additions. Edit the pure fixtures in `sandbox/fixtures.mjs` to change the default scenarios. Stop with **Ctrl+C** in the sandbox terminal; its Firebase and Expo processes stop together. Data is intentionally ephemeral and no emulator export is saved.

## Isolation and local schema

### Nearby teams and location — November 9

Discover previews **two events**, followed by nearby team panels. **See all** is currently marked **Unavailable** pending the separate list tasks; old list URLs return to the relevant Home view. The full-list drafts are preserved in [the scope handoff](./handoffs/home-scope-2026-11-09/README.md). Follow keeps the team card visible with **Unfollow** and moves its events into Schedule. Team/event records are preserved. Joined teams are excluded from nearby suggestions; followed teams remain. The default Baltimore list includes Dented Crew, Rockets, Capital Ice, and Foxes. Original fixture counts (8 Schedule / 26 Discover) apply before additional follows.

Following all nearby sample teams can empty Discover events because they now appear in For You; it no longer empties the nearby team list. **Reset fake follows** in the bottom fake-data bar restores only the current fake account's default follows and refreshes all three lists, without leaving the preview or changing location. In normal fake login it clears the account's local preference; in emulator login it resets only that viewer's `followedTeamIds` field. It never deletes event data or changes real membership/another account's follows. Fake-login sources also update during Fast Refresh, so captured fixtures from older code no longer persist inside the session's React state.

Fake login starts at **Baltimore, MD (demo location)**. **Use my location** requests foreground location permission and reads the phone's coordinates through `expo-location`; it does not run automatically. **Change location** selects one of the fixture area's cities if permission is denied or you prefer a manual location. Events and teams must be within 100 km; teams sort by calculated distance, events by date. The fake teams are around Baltimore/DC/Frederick, so a real phone elsewhere may correctly find no nearby sample results. Choose Baltimore manually to inspect the fixture cards. Location selection is kept in memory. Normal fake login has no Firebase Auth account and uses per-fake-UID AsyncStorage keys for follows. Emulator login persists follows in `SandboxViewers/{authUid}.followedTeamIds` through atomic array updates and ignores its older device-local follow preferences.

The emulator adapter merges its existing authorized Schedule and Upcoming streams to reflect Follow changes without rewriting event records. Run `npm run sandbox:seed` when using an older emulator dataset without fixture coordinates. There are no production schema changes; `homeBackendContract` remains unset.

November 9 checks: 26 focused tests plus three real-emulator/native-Auth tests pass; lint/typecheck and iOS/Android/web export pass. Historical native iPhone evidence (before the scope cleanup) for scrolling, Follow, full nearby list, permission denial/manual fallback, and location-driven team order is under [`docs/sandbox/2026-11-09`](./sandbox/2026-11-09/). The isolated simulator's Frederick coordinates were read by the real native location module. This does not constitute physical-phone GPS, Android rendering, or screen-reader verification.

The project ID is fixed to `demo-dented-puck`. Firebase [demo projects have no live resources](https://firebase.google.com/docs/emulator-suite/connect_firestore#choose_a_firebase_project). The seed uses hard-coded loopback endpoints and refuses a project ID without the `demo-` prefix. No Firebase login, service-account key, cloud project creation, deployment, or production write is needed.

`EXPO_PUBLIC_FIREBASE_SANDBOX=1` enables the adapter only in development; requesting it in a release build throws instead of silently connecting elsewhere. `npm run start` keeps the normal Firebase configuration. The existing production `homeBackendContract` stays null until its mappings are approved.

The emulator-only read model is:

```text
Users/{authUid}                         Existing profile shape, fake values
SandboxViewers/{authUid}                Team IDs, region and fake unread count
SandboxViewers/{authUid}/schedule/{id}  Pre-scoped joined/followed events
SandboxViewers/{authUid}/upcoming/{id}  Pre-scoped regional discovery events
```

Event documents contain timestamps and normalized team display metadata. The seed materializes these feeds for this dev viewer; it is not a proposed production membership, event, or public-visibility schema. Queries use `startTime >= now`, ascending `startTime` and document ID, and the dashboard's existing bounded pagination. Rules allow authenticated users to read their own feeds and update only their existing viewer's `followedTeamIds` field with known, non-joined fixture IDs. Event writes/deletes, viewer creates/deletes, other viewer fields, profile changes, and other-user writes remain denied. The local seed uses the emulator's admin REST credential. `firebase.sandbox.json` is explicitly a local emulator config; do not deploy its rules as a production contract.

## Validation and prerequisites

The current machine already has Firebase CLI 14.1.0 and Java 24. Other machines need a Firebase CLI and a Java version compatible with their Firestore emulator. Prefer Node >=22.13.0 for the installed Expo SDK 58; this machine's Node 20.20.2 still produces Expo's unsupported-version warning. The launcher reports occupied ports instead of stopping other services. Firebase may download emulator binaries on its first run.

With the sandbox running:

```sh
npm run sandbox:test
node --test tests/home-updated.test.cjs
npx --no-install expo lint
npx --no-install tsc --noEmit
```

The sandbox tests exercise the real Firebase SDK against local Auth/Firestore, including reseeding, visibility, the five-event preview, 20 + 6 pagination, atomic Follow/Unfollow, Reset, immutable event/team metadata, and denied event deletion/other-user writes. The React Native Auth branches additionally verify Follow after restoring a session on both mocked platform hosts. These are not native device tests. `SANDBOX_TEST_AUTH_PORT` and `SANDBOX_TEST_FIRESTORE_PORT` can target separate local emulator instances for these integration files; endpoints remain fixed to loopback. Unit coverage checks development gating, emulator addresses, fixture selection, and retention of all 34 events/team cards after following every nearby team.

November 9 Follow-fix validation: 45 focused tests and three isolated emulator/React Native Auth integration tests pass, as do lint/typecheck and iOS/Android/web exports. This includes the separate search-page work completed concurrently; the earlier inline-input assertion was updated by that work and the final full suite passes. No simulator, browser, or physical device was used for this fix; the earlier native screenshots below are historical evidence.

On November 5, all 5 sandbox tests and 10 updated dashboard tests passed. An isolated browser session verified both previews, segment switching, full lists, load-more, dev sign-out/re-entry, session persistence after reload, and a 320px viewport without horizontal overflow. The iOS/Android/web export passed. Interactive Ctrl+C cleanly stopped the sandbox without affecting the existing port-8081 server.

### Mobile follow-up

The mobile follow-up supersedes the earlier lint/typecheck failures: the unused top-level hook was removed from the invite scaffold because it generated a native error banner over the bottom navigation. Auth input refs now use the SDK 58 / React Native 0.88 instance type, including the password field. Invite functionality remains a placeholder. **Lint and typecheck pass.** Placeholder routes can still emit missing-screen-export warnings.

The sandbox suite now has **8 passing tests**, including iOS/Android branches using the installed React Native Auth entry point, emulator sign-in, persisted-session restoration, sign-out, and LAN selection with a VPN present. Those persistence tests model the AsyncStorage bridge with a memory store; they are not Android device tests. All 10 dashboard tests also pass, and iOS/Android Hermes exports pass.

A separate, headless iPhone 16e simulator (iOS 26.2, Expo Go 58.0.7) loaded the app over the LAN address and verified the dev login, joined/followed Schedule, regional Discover, segment switching, the full event list, scrolling, and native AsyncStorage session storage. Native sign-out returned to login and removed the stored sandbox session. At the largest accessibility text setting, the login button remained reachable by scrolling, labels wrapped, and dev sign-out remained operable. This visual check does not constitute a screen-reader review. No browser or Simulator window was opened during this follow-up, and the user's existing simulator and physical devices were not operated. The disposable simulator was shut down and deleted after testing.

Native verification captures: [For You](./sandbox/2026-11-05/ios-for-you.png), [full event list](./sandbox/2026-11-05/ios-event-list.png), and [largest-text login button](./sandbox/2026-11-05/ios-largest-text-login.png). These show the sandbox, not new Figma targets.

An Android runtime is not installed here, so Android device rendering and TalkBack remain unverified. VoiceOver and a physical phone's Wi-Fi/firewall behavior still require a device check; simulator execution and a successful native bundle do not establish those results.
