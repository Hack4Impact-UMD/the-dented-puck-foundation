# Live Firebase Home checks — November 9, 2026

The user authorized real cloud account/event checks and simulator use, then explicitly approved live Home wiring, `Users/{uid}.followedTeamIds`, optional coordinates on labeled QA fixtures, and deployment of the tested profile-role rule fix. Nothing is committed. Existing user/event/team documents were not migrated or replaced.

## Current scope after the ownership review

Home retains its approved live Firebase source, per-user Follow writes, deployed rules/indexes, and all QA records. The email/password Login UI and its auth-service additions were separated from Home into [a handoff patch](./handoffs/home-scope-2026-11-09/login.patch); Login remains its owner's task. The native Login behavior/screenshots below describe the earlier integration check. **Fake login (dev)** remains available in the app for local/emulator testing. The opt-in cloud tests authenticate directly with the Firebase SDK and do not depend on a Home-owned Login implementation. No cloud tests or writes were run for this scope cleanup.

See All destinations are unavailable pending the separate tasks; the former full-list routes only redirect. Home event search remains the user's authorized extension. Team Info navigation passes the canonical team ID, but that screen's Follow display is still an owner handoff.

## Cloud environment and test data

- Project: **denton-puck**, read from the existing `.env` and verified through the authenticated Firebase CLI.
- QA account: **qa.home.20261109.13858c@dentedpuck.test**, role **player**. Its test email was marked verified through the administrative API; no verification email was sent.
- Its password and UID are in ignored **`.sandbox/firebase-qa.env`** (mode 0600). These credentials are not `EXPO_PUBLIC_*` values or application source. These cloud credentials require the separately owned Login integration or the opt-in SDK test; Fake login uses different sample sessions.
- QA region: numeric **9901109**. Four new `[QA]` teams, 34 `[QA]` events, and one UID membership were created with new IDs. All new document paths are recorded in ignored `.sandbox/firebase-qa-manifest.json`.
- Only the dedicated QA user's profile was updated for the QA region and initial followed team. Existing profiles, teams, memberships, and events were preserved. QA event notes explicitly state that they are integration fixtures, not community events.
- Baseline: 8 Schedule events (5 in Home), 26 Discover events (2 in Home). The regional QA data is separate from existing users' regions.

## Live mapping

`firebaseHomeService.ts` is now the normal Home provider's source. Local fake login and emulator mode retain their separate sources.

| Concern | Mapping |
| --- | --- |
| Identity | `Users/{Firebase Auth UID}`; no email-based identity guessing or numeric-user impersonation. |
| Name and region | `username`, or existing `firstName` + `lastName`; numeric `regionId`, with the observed legacy `reigonId` spelling supported. Missing name/region requires profile completion. |
| Membership | `UserToTeam.userId == auth.uid`, `status == active`; observed numeric `teamId` or a team document ID maps to the active team catalog. Legacy numeric user memberships are not attributed to an Auth account. |
| Team identity | Team document ID is the app identity; the team's numeric `teamId` is used in event queries. |
| Follows | Canonical team document IDs in `Users/{uid}.followedTeamIds`; absent means none. `arrayUnion`/`arrayRemove` update only this field. Joined teams cannot be followed through Home. |
| Schedule | Joined/followed numeric team IDs in `Events.teamIds`; future `startTime`, then document ID. Cross-region and multi-team events remain included when affiliated. |
| Discover | Numeric `Events.regionId` plus `isTeamSpecific == false`, future `startTime`, then document ID; affiliated and unknown-team rows are excluded. This maps the existing boolean to regional discovery; it does not introduce a new `isPublic` field. |
| Geography | Optional `{latitude, longitude}` coordinates. No coordinates are inferred for existing records. Discovery initially uses region; after choosing a location, the existing 100 km radius applies. Nearby teams require coordinates and a selected location. Schedule stays independent of distance. |
| Announcements/count | No stored announcement/count contract was found. Announcements remain empty and notification status stays **unknown**, rather than claiming zero. |
| Account | The existing Account control opens the login/session screen, including real sign-out. |

The active public team catalog is bounded at 200 records and UID memberships at 200. Larger catalogs fail explicitly. Event streams retain bounded reads, merge/deduplication, snapshot cursors, and account checks before/after reads. Search uses the same scoped queries, up to 100 matching events per feed; larger feeds show an explicit search-limit error. It does not query all events or make a database query on every keystroke.

Two additive composite indexes are recorded in `firestore.indexes.json`: `teamIds CONTAINS + startTime ASC` and `regionId ASC + isTeamSpecific ASC + startTime ASC`, each with ascending document-ID ties. Existing indexes were not deleted.

The deployed event rules still permit players to read events broadly. UI/feed filtering is not an additional security policy; tightening event privacy requires a separate backend policy decision. Existing accounts without a UID-keyed role/profile/region or UID membership still need their onboarding data completed. Google native sign-in, Apple sign-in, notifications, event details, and sibling team pages remain outside this Home check.

## Profile-role security fix

The unchanged deployed rules were copied to a local emulator. A new account could create its own profile with `role: global-admin`, then read a different user's protected profile. This was reproduced **only locally**.

The reviewed fix adds one condition to self-profile creation: the role must be `player` or `contact`; an omitted role remains allowed for existing onboarding flows. Existing admin/staff assignments and other rules remain unchanged. Local regression checks passed before the user approved deployment. The patch was deployed using `firebase.live.json` and `--only firestore:rules`, after verifying that the cloud rules still matched the inspected baseline. A separate temporary cloud account verified that all three elevated role creations are denied, then deleted its Auth account without creating a profile.

## Reproduce

Read-only tooling and local emulator checks do not install dependencies:

```sh
npx --no-install expo lint
npx --no-install tsc --noEmit
FIREBASE_HOME_EMULATOR_TEST=1 FIREBASE_RULES_TEST=1 firebase emulators:exec \
  --only auth,firestore --project demo-dented-puck --config firebase.tests.json \
  'node --test --test-concurrency=1 tests/firebase-home.test.cjs tests/firebase-rules.test.mjs'
```

Cloud checks are opt-in and pinned to `denton-puck`:

```sh
FIREBASE_LIVE_TEST=1 node --test tests/firebase-live.test.cjs
FIREBASE_LIVE_RULES_TEST=1 node --test tests/firebase-live-rules.test.cjs
```

The first uses the dedicated QA account, tests Follow/Unfollow, and restores its initial follow preferences. It checks that all 34 cloud event records retain the same IDs and field values as decoded by the SDK. The second creates/deletes a temporary Auth account to check denied privileged-profile creation. Neither is part of an ordinary unflagged test run. Sandbox emulator tests remain separate because they deliberately exercise different local rules.

## Validation notes

Both cloud indexes reached **READY**. **45 focused tests, five emulator integration tests, and two opt-in cloud tests passed**, along with lint, TypeScript, `git diff --check`, and iOS/Android/web export. The older renderer-dependent lifecycle suite is not included in that result.

The cloud checks verified real password login, wrong-password rejection, the QA profile, five/two previews, 8 Schedule / 26 Discover events, 20 + 6 paging without duplicate IDs, complete search candidates, atomic Follow/Unfollow from stale viewer objects, cross-account guards, denied signed-out reads, and retention of all 34 event IDs/field values. The QA account's original follows were restored. The separate cloud security check denied all three elevated roles.

An isolated **iPhone 16e / iOS 26.2 / Expo Go 58.0.7** verified real cloud login and restoration after force-quitting, Schedule scrolling through event 8, native Discover Load more through event 26, and search finding that last event. The actual OS location permission prompt was accepted; setting only this test simulator to Frederick made Foxes first at under 1 km. Manual Baltimore selection worked. Native Follow changed Rockets to Unfollow, moved its events to Schedule (21 total), and remained saved after another app restart. Native Unfollow restored the original preferences. Wrong-password feedback, subsequent successful login, and sign-out were checked as well.

Native taps/swipes exercised navigation, buttons, scrolling, and location permission. The test debugger supplied login/search text through the components' change callbacks and inspected the real native SDK/context; it did not replace Firebase with mocks. These are not keyboard-typing or screen-reader acceptance tests. No browser/Simulator window or existing user simulator/physical device was operated.

Native proof is under [firebase/2026-11-09](./firebase/2026-11-09/), including [Schedule](./firebase/2026-11-09/ios-live-schedule.png), [last Discover page](./firebase/2026-11-09/ios-live-discover-last-page.png), [search](./firebase/2026-11-09/ios-live-search-last-event.png), [device location](./firebase/2026-11-09/ios-live-device-location-teams.png), and [Follow](./firebase/2026-11-09/ios-live-followed.png).

After sign-out and another app restart, the real native Auth UID remained null and Home showed the signed-out prompt with no prior feed. The disposable simulator was shut down/deleted and the temporary port-8093 server stopped. The existing user simulator and original port-8081 server were preserved. A final scan found no QA email/password in any iOS/Android/web export file. The primary cloud QA account and fixtures remain available for manual review; its follows were restored to the initial Dented Crew preference.

The installed Node 20.20.2 is below Expo's required 22.13.0. `expo install --check` reports ten recommended package updates; no dependency upgrades were authorized or performed. Placeholder sibling route warnings remain. Native Android rendering, physical-device networking, and screen-reader validation are not established by an iOS simulator or bundle export.
