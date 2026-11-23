# UI_AGENTS.md — adding Figma components to the UI library

Instructions for coding agents that add or update components in the Dented Puck UI library.
It has three parts. Follow them in order:

1. [Find new components in Figma](#1-find-new-components-in-figma) (Figma MCP)
2. [Add them to the component library](#2-add-a-component-to-the-library)
3. [Give every component the required accessibility features](#3-required-accessibility-features)

Read these first: [`src/components/README.md`](src/components/README.md), the library reference
(the component table, "Screen-reader props", "Foundations", "Building the Figma screens"), and
[`docs/accessibility.md`](docs/accessibility.md). The README is the only reference. **Don't add
a gallery, showcase, or demo route to the app.** The user removed one on purpose.

---

## 1. Find new components in Figma

### Connect to the Figma MCP

The `figma` MCP server is the Figma desktop app's Dev Mode server at `http://127.0.0.1:3845/mcp`.
Its tools are deferred, so load them before calling any of them:

```
ToolSearch "select:mcp__figma__get_metadata,mcp__figma__get_screenshot,mcp__figma__get_design_context,mcp__figma__get_variable_defs"
```

If it doesn't connect:

- **`ECONNREFUSED`**: Figma.app isn't running. Run `open -a Figma` and wait about 15 seconds.
- **"only available if your active tab is a design or FigJam file"**: open the design file with
  `open -a Figma "https://www.figma.com/design/qYrhB6rbv9R8NcdFj7JKTP/Dented-Puck"`, then reconnect.
- **Empty sections or "No node could be found"**: the desktop app only loads the open page.
  Switch to it first with `open -a Figma "https://www.figma.com/design/qYrhB6rbv9R8NcdFj7JKTP/Dented-Puck?node-id=<page-id>"`
  (use a hyphen in the URL, for example `456-15`).

Don't edit the Figma file.

### Where to look

File key `qYrhB6rbv9R8NcdFj7JKTP`:

| Page | Node | What it's for |
| :-- | :-- | :-- |
| Hi-Fi Screens | `456:15` | **Source of truth for layout, sizes, and colors.** Screens are numbered (1100 Welcome … 8171 Edit location). |
| Hi-Fi Screens - Annotated | `641:291` | The designer's reading-order pins and accessibility callouts for each screen. |
| Components | `456:14` | The designer's component set. New components often appear here first. |
| Style Guide | `244:13` | Color, type scale, and spacing. Where it disagrees with the screens, follow the screens. |

### How to find what's new

1. **List the frames.** Run `get_metadata` on the Hi-Fi Screens page (`456:15`) and the Components
   page (`456:14`). Look up frames by screen number and name, not by saved node IDs: the designer
   sometimes rebuilds frames, and their old IDs stop working.
2. **Compare with the library.** The README's [Building the Figma screens](src/components/README.md#building-the-figma-screens)
   table maps every screen number to the components that build it. Look at screen numbers that
   aren't in that table, frames that changed since the last pass, and Components-page entries with
   no match in the README's component table.
3. **Look at each candidate.** For each one, call:
   - `get_screenshot`: what it looks like. Keep it so you can compare against your version.
   - `get_design_context`: exact sizes, padding, radii, colors, fonts, and text. It returns
     React + Tailwind **web** code. Use it as a spec and rewrite it in React Native + NativeWind.
     Don't paste it. (It asks for `skill://figma/...` guidance, which this server doesn't provide.
     Ignore that.)
   - `get_variable_defs`: the Figma color and type variables, to match them to our tokens.
   - The same frame on **Hi-Fi Screens - Annotated** (`641:291`): reading order, labels, and
     announcements the designer asked for.
4. **Decide: new component, or a new option on an existing one?** If an existing component
   already does most of it, add a `variant`, `size`, or optional prop. Examples: `AppButton size="compact"`,
   `SectionHeader size="muted"`, `AuthTextField readOnly`. Create a new component only if it has a
   different job or structure. Search the README before you decide.
5. **Write down what you found** before you build: screen numbers, node IDs, which component
   (new or extended), and any place where Figma breaks the rules below.

### When Figma and the library disagree

- **Hi-Fi Screens win over the Style Guide**: 4 px corner radius (`rounded`), 60 px headers with
  a rule.
- **The library's accessibility minimums win over Figma**: text at least 16.5 px (`text-small`),
  touch targets at least 48 px, placeholders `#BDBDBD`, and Atkinson Hyperlegible everywhere (not
  Source Sans Pro). Use the nearest step of the type scale.
- Note every intentional difference under **Notes** in the README. If you can't tell whether a
  difference is intentional, ask the user. Don't guess.

---

## 2. Add a component to the library

### Where it goes

- App-wide building blocks go in `src/components/ui/`. Feature components go in their folder:
  `auth/`, `team/`, `teams/`, `events/`, `invite/`, `home/`, `notifications/`, `chat/`.
- Use a **named export** (`export function TeamCard`). Some older components are default exports;
  leave them as they are.
- Don't move existing components between folders. Teammates import them, and the move hasn't
  been agreed. Event, team, and invite components came from teammates' branches, so keep changes
  to them small.

### Styling

- **Colors**: only use the NativeWind tokens in [`tailwind.config.js`](tailwind.config.js)
  (`bg-surface-card`, `text-ink-soft`, `border-line-faint`, …). No hex values in class names.
  - If Figma uses a color we don't have, add a token to `tailwind.config.js`, with a comment naming
    the Figma color (for example `// color/grey/17`). Add it to the README's color-token table too.
  - Props that take a color value instead of a class (SVG `color`, `placeholderTextColor`) use
    `colors` from [`src/components/ui/tokens.ts`](src/components/ui/tokens.ts). Keep that file in
    sync with `tailwind.config.js`.
- **Type**: use the type-scale classes (`text-display`, `text-h1`–`text-h3`, `text-body-lg`,
  `text-body`, `text-label`, `text-caption`, `text-small`) with `font-sans` or `font-sans-bold`, or
  use `AppText`. Nothing below `text-small` (16.5 px).
- **Icons**: check `src/assets/icons/` first. To add one, export the SVG from Figma, then:
  - Name the file in kebab-case (`bell-off.svg`).
  - Rebuild it into a full 24 or 32 px box (`width`, `height`, and `viewBox` all match).
  - Use `stroke="currentColor"` / `fill="currentColor"` instead of a fixed color.
  - Import it as a component (`import BellIcon from '@/assets/icons/bell.svg'`) and pass
    `color={colors.white}`.

  Brand art goes in `src/assets/images/brand/`.
- **Size**: Figma frames are 412 px wide. Page padding is 16 px (20 px on chat screens).

### Write the component

Start from the skeleton in [§3](#component-skeletons) that matches its screen-reader stops. Add a
JSDoc comment naming the Figma component and screens, and say the reading order if it has more
than one stop, for example `/** Figma "Tag": … Reading order: heading, link. */`. Document every
prop with a short `/** … */`, and note which Figma screen uses each `variant` or `size`.

### Test it

Add a case to [`src/components/screenReaderProps.test.tsx`](src/components/screenReaderProps.test.tsx).
Every library component must be in it:

| Component | Add |
| :-- | :-- |
| One non-interactive stop | `stopCase('Name', (p) => <Name … {...p} />)` |
| Decorative, hidden by default | `stopCase('Name', (p) => <Name … {...p} />, true)` |
| One control | `controlCase('Name', (p) => <Name … onPress={noop} {...p} />)` |
| Several stops | An object case with `render` and `custom: { element, labels, hints, presses }`, with `screenReaderParts` filled in. See `AuthTextField` and `PasswordField`. |
| Rendered in a `Modal` | A separate `describe` block, like `ActionSheet` |

Put behavior tests (state changes, callbacks) in a `Name.test.tsx` next to the component.

### Check it

```bash
npx tsc --noEmit
npx jest --runInBand
npx expo lint
```

`CreateAccountForm.test.tsx` already fails ("AsyncStorage is null"), and lint already warns twice
in `src/services/teamService.ts`. Neither is caused by your change. Everything else must pass.

**Visual check:** compare your version with the `get_screenshot` image at 412 px wide.

1. Add a temporary route under `src/app/` that renders the component.
2. Open it on the web build at `http://localhost:8081/<route>` with the Claude-in-Chrome
   extension. If the extension isn't connected, use Playwright's headless shell:
   `~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-arm64/chrome-headless-shell --hide-scrollbars --window-size=412,2000 --virtual-time-budget=30000 --screenshot=<out.png> <url>`
3. **Delete the temporary route when you're done.**

### Document it

Update [`src/components/README.md`](src/components/README.md):

1. **Components table**: one row with the exact import line and a short purpose.
2. **A section under the right category** (Actions, Inputs, Navigation, Teams, Events, Invitations,
   Feedback, Lists, Home and notifications, Chat, Overlays, Layout and accessibility). Include:
   - a screenshot, 430 px wide @2x, in `docs/images/components/` (if you can't render one, say so
     under Notes)
   - a props table
   - its default screen-reader behavior
   - a short example
   - a `**Source:**` link
3. **Screen-reader props → One stop or several**: add it to the table. For several stops, list its
   `screenReaderParts` keys, with † on controls and \* on text inputs.
4. **Building the Figma screens**: add it to the rows of the screens that use it.
5. **Notes**: any intentional difference from Figma.

Then add a dated line under **Done** in [`CLAUDE.md`](CLAUDE.md), and add anything left (device
checks, designer questions) under **To do** or **Open questions**.

Don't commit unless the user asks. Never commit `.env`.

---

## 3. Required accessibility features

Every component in the library must do everything on this list. Reviews check it, and the shared
test checks items 1–5.

### Checklist

1. **Takes the shared screen-reader props**, typed with the helpers from `@/components/accessibility`:

   | Component | Props type | Props it gets |
   | :-- | :-- | :-- |
   | One non-interactive stop (badge, tag, message) | `ScreenReaderStopProps` | `screenReaderLabel`, `hideFromScreenReader`, `screenReaderOrder` |
   | One control (button, row, card, chip, switch) | `ScreenReaderControlProps` | the above, plus `screenReaderHint` and `screenReaderPressAnnouncement` |
   | Several stops (header with buttons, field with error) | `ScreenReaderProps` plus `screenReaderParts?: NameScreenReaderParts` | one key per stop: `ScreenReaderControlText` for controls, `ScreenReaderFieldText` for text inputs, `ScreenReaderStopText` for other stops |
   | Layout only (no stop of its own) | `ScreenReaderProps` | `hideFromScreenReader`, `screenReaderOrder` |

   Export the parts type from the component's file (`export type SectionHeaderScreenReaderParts = …`).

2. **Outer element spreads `useScreenReaderProps({ hideFromScreenReader, screenReaderOrder })`.**
   This hides the whole component when asked and registers it with `ScreenReaderOrderScope`. If
   the outer element already has a `nativeID`, pass it as the second argument.

3. **Every control**:
   - spreads `skipFocusProps(hideFromScreenReader)`. A hidden control also leaves the web Tab
     order. This applies to `TextInput`s too.
   - wraps its handler: `onPress={withPressAnnouncement(onPress, screenReaderPressAnnouncement)}`.
   - sets `accessibilityHint={screenReaderHint}`.

4. **Every stop has a role and a name.** Default the label to the visible text and let the prop
   replace it: `accessibilityLabel={screenReaderLabel ?? label}`. Keep the visible words in the
   label, and don't put the role in it ("Follow Baltimore Blades", not "Follow button"). Repeated
   actions get context in their default label: "See all, Schedule", not just "See all".

5. **Decorative pieces are hidden.** An icon, avatar, or date tile that repeats nearby text
   defaults to `hideFromScreenReader = true` (like `TeamIcon`, `Avatar`, `DateTile`). Inside a
   component, hide decorative children with `screenReaderHiddenProps(true)`. That includes icons
   in a labeled button, dividers, sheet handles, and backdrops.

6. **Use the right role and state.** Never show state with color alone; set it in
   `accessibilityState` too.

   | Looks like | `accessibilityRole` | State or value |
   | :-- | :-- | :-- |
   | Button, text link, card that opens something | `button` | `disabled` |
   | On/off switch or toggle card | `switch` | `checked` |
   | One choice of several | `radio`, inside a `radiogroup` with a label | `checked`, `selected` |
   | Tabs | `tab`, inside a `tablist` | `selected` |
   | Multi-select row | `checkbox` | `checked` |
   | Dropdown or disclosure | `button` | `expanded` |
   | Slider | `adjustable` | `accessibilityValue={{ min, max, now }}`, plus `increment`/`decrement` in `accessibilityActions` and `onAccessibilityAction` |
   | Step or progress bar | `progressbar` | `accessibilityValue={{ min, max, now }}` |
   | Screen or section title | `header` (`AppText` doesn't add it; set it yourself) | — |
   | Error or banner that appears | `alert` | — |
   | Logo or badge that means something | `image`, with a label | — |
   | Several text pieces read together | `accessible` plus `text` | — |

7. **Group text into sentences.** A card or row that is one control is one stop. Its label
   includes everything a sighted user sees on it: title, date, team, status. Example: "Practice
   Session, Saturday, November 7, 10 AM to 12 PM, Baltimore Blades, Joined". Use the `spoken`
   strings from `events/eventFormat.ts` for dates, times, and places. Don't read abbreviations
   ("Nov", "BB") or symbols ("·") aloud.

8. **Reading order is right without extra setup.** Write the JSX in reading order: browsers
   always follow source order, and screen readers do too unless told otherwise. If Figma's reading
   order (Hi-Fi Screens - Annotated, `641:291`) can't match the layout, order the inner stops with
   `AccessibilityOrder`. Never use `screenReaderOrder` inside a library component; that prop is for
   the screen that uses it.

9. **Touch targets are at least 48 × 48 px.** Use padding or `hitSlop`. Text is at least 16.5 px.
   Placeholders use `PLACEHOLDER_COLOR`. Text and icons must stand out against their background
   (4.5:1 for text, 3:1 for icons and borders). If Figma's colors don't, say so in the README.

10. **Announcements are deliberate.**
    - Don't announce anything when the component appears.
    - For status changes that don't come from a press, call `announceForScreenReader(message)`.
    - Don't announce the same thing twice. An `alert` role or a live region already speaks, so
      don't also call an announcement for it.
    - Press announcements are off by default (only Follow has one). Callers turn them on with
      `screenReaderPressAnnouncement`.

11. **Overlays trap focus.** Sheets and dialogs render in a `Modal` and set
    `accessibilityViewIsModal` on the panel. They close with `onRequestClose`, and with
    `onAccessibilityEscape` for the VoiceOver escape gesture. When they open, they move focus to
    their heading. The backdrop is hidden from screen readers.

12. **Motion respects Reduce Motion.** Animated components take a `reduceMotion` prop (the screen
    passes `useReducedMotion()` from `@/hooks/useReducedMotion`) and skip or shorten the animation
    when it's on. `SlidingPages` is the example.

13. **Checked on a device before it counts as done.** The unit tests check props; they don't run a
    screen reader. Ask the user to go through the component with VoiceOver (iOS) or TalkBack
    (Android), forward and backward, in a **development build**. `screenReaderOrder` doesn't work
    in Expo Go. If that hasn't happened yet, add it to **To do** in `CLAUDE.md`.

### Component skeletons

**One non-interactive stop:**

```tsx
import { Text, View } from 'react-native';
import { useScreenReaderProps, type ScreenReaderStopProps } from '@/components/accessibility';

type Props = ScreenReaderStopProps & {
  label: string;
};

/** Figma "Tag": bold yellow text in a thin yellow outline, for example "BB" or "Coach". */
export function Tag({ label, screenReaderLabel, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View
      {...screenReaderProps}
      accessible
      accessibilityRole="text"
      accessibilityLabel={screenReaderLabel ?? label}
      className="self-start rounded border border-brand bg-brand-soft-dark px-3 py-[5px]"
    >
      <Text className="font-sans-bold text-label text-brand">{label}</Text>
    </View>
  );
}
```

**One control:**

```tsx
import { Pressable, Text } from 'react-native';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlProps,
} from '@/components/accessibility';

type Props = ScreenReaderControlProps & {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * Small outlined button above a list (Figma: Filter, Sort, Unread, Read).
 * It is 35 px tall, so a hit slop brings the touch target to 48 px; `min-w-12` keeps it 48 px wide.
 */
export function FilterChip({
  label,
  selected,
  onPress,
  screenReaderLabel,
  screenReaderHint,
  screenReaderPressAnnouncement,
  hideFromScreenReader,
  screenReaderOrder,
}: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <Pressable
      {...screenReaderProps}
      {...skipFocusProps(hideFromScreenReader)}
      onPress={withPressAnnouncement(onPress, screenReaderPressAnnouncement)}
      accessibilityRole="button"
      accessibilityLabel={screenReaderLabel ?? label}
      accessibilityHint={screenReaderHint}
      accessibilityState={{ selected }}
      hitSlop={{ top: 7, bottom: 7 }}
      className={`min-w-12 self-start items-center rounded border border-brand px-3 py-[5px] active:opacity-70 ${selected ? 'bg-brand' : 'bg-brand-soft-dark'}`}
    >
      <Text className={`font-sans-bold text-label ${selected ? 'text-on-brand' : 'text-brand'}`}>{label}</Text>
    </Pressable>
  );
}
```

**Several stops:**

```tsx
import { Pressable, Text, View } from 'react-native';
import {
  skipFocusProps,
  useScreenReaderProps,
  withPressAnnouncement,
  type ScreenReaderControlText,
  type ScreenReaderProps,
  type ScreenReaderStopText,
} from '@/components/accessibility';

export type SectionHeaderScreenReaderParts = { title?: ScreenReaderStopText; action?: ScreenReaderControlText };

type Props = ScreenReaderProps & {
  title: string;
  action?: { label: string; onPress: () => void };
  screenReaderParts?: SectionHeaderScreenReaderParts;
};

/** A section heading with an optional "See all" link. Reading order: heading, link. */
export function SectionHeader({ title, action, screenReaderParts, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View {...screenReaderProps} className="flex-row items-center justify-between gap-4">
      <Text accessibilityRole="header" accessibilityLabel={screenReaderParts?.title?.label} className="font-sans-bold text-h2 text-white">
        {title}
      </Text>
      {action ? (
        <Pressable
          {...skipFocusProps(hideFromScreenReader)}
          onPress={withPressAnnouncement(action.onPress, screenReaderParts?.action?.pressAnnouncement)}
          accessibilityRole="button"
          // "See all, Schedule": a link's default label says what it belongs to.
          accessibilityLabel={screenReaderParts?.action?.label ?? `${action.label}, ${title}`}
          accessibilityHint={screenReaderParts?.action?.hint}
          className="min-h-12 justify-center active:opacity-70"
        >
          <Text className="font-sans-bold text-body text-white underline">{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
```

### Before you finish

- [ ] Found in Figma, with node IDs and a screenshot; annotated reading order checked
- [ ] Extends an existing component if it can; otherwise a new named export in the right folder
- [ ] Only tokens: no hex in classes, no text below `text-small`, icons use `currentColor`
- [ ] Right screen-reader props type; outer element spreads `useScreenReaderProps`
- [ ] Every control: `skipFocusProps`, `withPressAnnouncement`, hint, role, label, state
- [ ] Decorative pieces hidden; card and row labels read as one sentence
- [ ] JSX in reading order; targets ≥ 48 px; state not shown by color alone
- [ ] Case added to `screenReaderProps.test.tsx`; `tsc`, `jest`, and `lint` pass (apart from the known failures)
- [ ] Compared with the Figma screenshot at 412 px; temporary route deleted
- [ ] README updated: table row, section, screen-reader table, Figma screen map, notes
- [ ] `CLAUDE.md` updated; device check with VoiceOver/TalkBack done or listed under To do
