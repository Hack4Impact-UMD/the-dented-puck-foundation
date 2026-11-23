# Accessibility UI utilities

Import shared utilities from `@/components/accessibility`.

## Screen-reader reading order

Use `AccessibilityOrder` to specify the sequence in which VoiceOver and TalkBack
visit elements, independently of their visual positions. The `order` prop is a
readonly array of descendant `nativeID` values. Other props such as `style`,
`className`, and `testID` are passed to the wrapping `View`.

```tsx
import { Pressable, Text } from 'react-native';
import { AccessibilityOrder } from '@/components/accessibility';

function SavePanel({ error, onSave }: { error: string | null; onSave: () => void }) {
  return (
    <AccessibilityOrder
      order={['save-title', ...(error ? ['save-error'] : []), 'save-button']}
    >
      <Text nativeID="save-title" accessible accessibilityRole="header">
        Your profile
      </Text>
      {error && (
        <Text nativeID="save-error" accessible accessibilityRole="text">
          {error}
        </Text>
      )}
      <Pressable
        nativeID="save-button"
        accessibilityRole="button"
        accessibilityLabel="Save profile"
        onPress={onSave}
      >
        <Text>Save profile</Text>
      </Pressable>
    </AccessibilityOrder>
  );
}
```

The sequence is heading → error (when present) → Save. Keep IDs unique in the
screen and update the array when conditional content changes. An empty array
uses the platform's default traversal order.

On iOS and Android this uses React Native's
[`experimental_accessibilityOrder`](https://reactnative.dev/docs/accessibility#experimental_accessibilityorder).
That API is experimental; React Native advises against production use. It only
works when React Native's native `enableAccessibilityOrder` feature flag is on.
The flag is off in stable builds; this app turns it on with the Expo config
plugin in `plugins/accessibility-order` (run `npx expo prebuild` and rebuild
after changing it). On iOS the same plugin works around a React Native bug
(0.88.1): when the order changes, React Native builds the VoiceOver list from the
previous order, so a view's first order is ignored and later changes lag one
behind. The plugin builds the list from the current props instead
(`AccessibilityOrderFlag.mm`). The
wrapper does not change visual layout. Its native list is exhaustive: an
accessible descendant omitted from the list is excluded from traversal unless
it belongs to a listed container. Include all intended reading stops, including
errors and actions. Listing an ID does not make its element accessible; use
`accessible`, a suitable role and label where needed.

For a group, list the `nativeID` of a non-accessible container to visit its
descendants in their default order, or nest another `AccessibilityOrder` with
that ID to give the group its own sequence. The wrapper always remains a
non-accessible container, so it does not combine its children into one stop.

On web, the wrapper leaves traversal to the browser. Put JSX in the intended
reading order, as in the example; `order` does not rearrange the DOM. Avoid CSS
reordering or positive `tabIndex` values as a reading-order workaround. Keep
source order aligned with the intended sequence on every platform when possible.

`VerifyEmailContent` demonstrates a complete screen sequence, including its
conditional feedback message.

### Numbering components instead of listing IDs

Every UI-library component takes a `screenReaderOrder` number. Wrap the page in
`ScreenReaderOrderScope` and it builds the `order` list for you, lowest number
first:

```tsx
import { ScreenReaderOrderScope } from '@/components/accessibility';

<ScreenReaderOrderScope className="flex-1">
  <TeamHeader screenReaderOrder={2} onBack={goBack} onCreate={openCreate} />
  <TeamInfoCard screenReaderOrder={1} name={team.name} season={season} />
</ScreenReaderOrderScope>
```

The same rules apply as above: number every stop in the scope, and nothing
changes on web. For your own elements, `useScreenReaderOrder(n)` returns a
`nativeID` to set. The components also take `hideFromScreenReader` and spoken
label, hint, and press-announcement props; the
[UI library README](../src/components/README.md#screen-reader-props) covers all
of them.

## Announcements and focus

Reading order controls navigation through content. It does not speak the entire
sequence automatically, move the current focus, or queue announcements.

Use the existing announcement and focus patterns alongside it:

- For a native status update, use
  `AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: true })`.
  The queue option is iOS-specific; do not assume Android will queue speech.
- For a web status update, keep a mounted `Text` with
  `accessibilityLiveRegion="polite"` and update its text.
- When a screen, step, or modal opens, focus its heading or relevant control
  after it mounts. The create-account flow contains examples of native
  `sendAccessibilityEvent(target, 'focus')` and web `.focus()` handling.
- Avoid announcing the same update through both an alert/live region and an
  explicit native announcement.

## Verification

With VoiceOver on iOS and TalkBack on Android, navigate forward and backward
through every stop, including conditional errors, expanded groups and modal
content. Confirm nothing is skipped and that the visual layout remains usable.
On web, verify screen-reader browse order and keyboard Tab order separately.
Unit tests can check the configured sequence, but do not simulate native
screen-reader traversal.
