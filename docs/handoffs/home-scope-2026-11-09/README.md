# Home ownership handoff — November 9, 2026

The user approved implementing the Home scope plan after a read-only Notion audit, then explicitly retained **Fake login (dev)** for testing. This handoff records the deliverable and the work separated from it. Notion was not edited; nothing was committed.

## Acceptance checklist

| Home bullet | Implementation and remaining acceptance |
| --- | --- |
| For You / Schedule | Joined/followed-team events, including authorized public/private events; five-event preview. Existing scoped Firebase and demo adapters remain. |
| Discover | Public regional events excluding every joined/followed team, including mixed-team events. Two-event preview follows the user's explicit override. |
| Team labels | Acronyms in outlined badges; full team names and Joined/Followed relationships in the grouped accessible event label. |
| Teams Nearby | Two-card preview, existing foreground/manual location, and per-user Follow/Unfollow without deleting event/team data. Followed teams remain; joined teams are excluded. |
| Team Detail handoff | Live cards navigate to the existing Team Info route using only the canonical document ID, after any pending Follow write finishes. That screen's Follow button is currently a placeholder; displaying the saved state there remains the owner's integration dependency. Demo team IDs cannot enter its live reader. |
| See All | Home controls expose list-specific labels and optional sibling destinations. Default destinations are absent, so controls show **Unavailable** and are disabled. Complete-list behavior is pending the separate tasks; it is not claimed complete. |
| Announcements / bell | Conditional Home announcement preview retained. Live announcement source and placement remain unresolved. Notifications and announcement detail are separate screens; an unknown count is not zero. |
| Home UI / accessibility | Existing supplied assets, segments, selected Home navigation, scrolling, wrapping text, focus and speech behavior retained. Host tests and bundle checks pass; native screen-reader acceptance remains open. |

The user's separate requests for event search, location, animations, and development login remain within their existing behavior. Search is not used as a substitute See All destination. No team-directory search, RSVP, calendar action, See All team filter, nearest-event sorting, Account editor, or new Login flow is included.

## Task boundaries from the live audit

| Task | Owner/status at the audit | Handoff |
| --- | --- | --- |
| [Home Dashboard](https://app.notion.com/p/405197abf07b80e49483f3c4522720f4) | Abir Modak; Sprint 3; In Progress | This deliverable. Its checklist explicitly includes nearby Follow/Unfollow despite an old deferral sentence. |
| [See All Events](https://app.notion.com/p/408197abf07b8030905ee501ef41b8fc) | Unassigned; Sprint 4; Not started | Full list, team filtering, distance sorting and event-card navigation. |
| [See All Nearby Teams](https://app.notion.com/p/405197abf07b80008a44c6032c62e0f5) | Unassigned; Sprint 4; Not started | Full team list and its final selection/ranking requirements. |
| [Login](https://app.notion.com/p/405197abf07b80de8b48e0814dadf6c9) | Ryan Zhao; Verification | Reconcile the preserved native email/password draft with the owner's implementation. |
| [Team Info](https://app.notion.com/p/3fe197abf07b80a4a449d7ac2ac430ae) | Angela Ngo; Done, with unchecked criteria | Read the existing per-user relationship and reflect it on Team Detail; Home does not edit that screen or its service. |
| [Event Detail](https://app.notion.com/p/405197abf07b80a28307d15e90db0a18) | Kasra Sedghi; Verification | Supply an event-ID destination; own RSVP/calendar/detail behavior. |
| [Notifications](https://app.notion.com/p/405197abf07b80d3bf6dc31f47cec598) | Dhanya Desai; Not started | Supply bell/announcement destinations and the approved count/source interface. |
| [Find Team](https://app.notion.com/p/3fe197abf07b80989689d2a5aa6daa19) | Mikhail Saveliev; Verification | Team-directory search remains untouched. |

The former standalone Add Teams Nearby task is deleted. No separate Home event-search task was found among the 26 rows in the current Fall 2026 tracker. Future tracker changes require a fresh read.

## Connecting sibling screens

`src/config/homeDestinations.ts` is the integration point. `HomeDestinations` supports:

- `eventList(section)`, where `section` is `schedule` or `upcoming`; use the same viewer visibility and ascending time/ID order as the Home adapter.
- `nearbyTeamList` and `announcementList` for the separately implemented full lists.
- `team(teamId)`, currently mapped to `/tabs/teams/[teamId]`, with a canonical Firestore team document ID only.
- Existing `event(eventId)`, `announcement(announcementId)`, `notifications`, `teams`, `chats`, and `account` destinations when those screens are confirmed.

Do not point a full-list destination at the compatibility paths `/tabs/home/schedule` or `/tabs/home/nearby-teams`; these only forward to a supplied destination or back to Home and would create a redirect loop. No follow status, event object, credentials, Firestore cursor, or numeric profile identity is serialized into Team Info route parameters.

For real accounts, Home already saves canonical team IDs in `Users/{auth.uid}.followedTeamIds`. That stored value is the relationship handoff, not an additional Team Detail schema. Emulator fixtures use `SandboxViewers/{authUid}.followedTeamIds`; regular fake login uses isolated local preferences. The existing Team Info screen reads live `Teams` documents, so navigation for both fixture modes is disabled while Follow remains available in Home.

## Preserved drafts

These are exact snapshots taken before the cleanup. The `.txt` suffix keeps them out of Expo Router, TypeScript and test discovery. [manifest.json](./manifest.json) records their original source paths and SHA-256 checksums.

- [schedule.tsx.txt](./schedule.tsx.txt): former full event/announcement list.
- [nearby-teams.tsx.txt](./nearby-teams.tsx.txt): former full nearby-team page.
- [useHomeList.ts.txt](./useHomeList.ts.txt): former full-list pagination hook.
- [home.test.cjs.txt](./home.test.cjs.txt): obsolete lifecycle suite tied to that hook. It previously required the absent `react-test-renderer`; it is not counted as passing. The installed-host suites cover current Home behavior.
- [login.patch](./login.patch): exact prior additions to Login and authService. Both active source files now match their Git baseline. The patch passes `git apply --check`; it is for the Login owner's reconciliation, not automatically applied.

DevLoginButton, SandboxControls, sample feeds, preference persistence, Firebase initialization/rules/indexes, QA records, dependencies and unrelated edits were preserved. The Account tab no longer substitutes `/auth/login` for the separately owned Account screen. Native email/password login is a Login integration dependency; the existing real-session Home adapter remains intact. Opt-in cloud checks use the Firebase SDK directly.

## Validation

55 focused tests pass across `home-updated`, `home-preview`, `home-discovery`, `home-search`, `home-refresh`, `home-accessibility`, `discovery-location`, and `sandbox`. The new checks exercise unavailable/connected See All controls, redirect-only old URLs, canonical team IDs, independent Follow actions, demo isolation, and waiting for Follow before navigation. Existing checks retain feed conservation, private/unaffiliated exclusion, membership/account isolation, ordering, preview limits, fake-login release gating, search, location, and accessibility feedback.

Lint, TypeScript and iOS/Android/web export pass. Node 20.20.2 still emits Expo's existing >=22.13.0 version warning. No dependency was changed. Archived bytes and the reapplicable Login patch were checked. No simulator/browser/physical device, emulator/cloud write, deployment, Notion edit, or commit was used for this cleanup. Native screen-reader output, Team Detail's saved-state display, live announcements and complete sibling-list behavior remain open acceptance dependencies.
