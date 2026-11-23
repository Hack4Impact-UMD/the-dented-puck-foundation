import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityOrder, type AccessibilityOrderProps } from './AccessibilityOrder';
import { ScreenReaderOrderContext, type ScreenReaderOrderRegistry, useScreenReaderOrder } from './ScreenReaderOrderContext';

export type ScreenReaderOrderScopeProps = Omit<AccessibilityOrderProps, 'order'>;

type Entry = { nativeID: string; order: number; sequence: number };

/**
 * Collects the `screenReaderOrder` numbers of the components inside it and reads them lowest
 * first on iOS and Android. Wrap a page (or one section of it) in a scope.
 *
 * Inside a scope that has numbered components, give every reading stop a number: as with
 * `AccessibilityOrder`, anything left out is skipped by VoiceOver and TalkBack.
 * A scope can take its own `screenReaderOrder` to sit at that position in an outer scope.
 */
export function ScreenReaderOrderScope({ screenReaderOrder, hideFromScreenReader, nativeID, ...props }: ScreenReaderOrderScopeProps) {
  // Registers this scope with the *outer* scope, so it must run before the provider below.
  const ownID = useScreenReaderOrder(hideFromScreenReader ? undefined : screenReaderOrder, nativeID);
  const [entries, setEntries] = useState<readonly Entry[]>([]);
  const nextSequence = useRef(0);
  // Stops removed in the current commit. A stop whose number changes is removed and registered
  // again in the same commit; it takes its sequence back so it keeps its mount position.
  const released = useRef(new Map<string, number>());

  const registry = useMemo<ScreenReaderOrderRegistry>(
    () => ({
      register(id, order) {
        const sequence = released.current.get(id) ?? nextSequence.current++;
        released.current.delete(id);
        const entry = { nativeID: id, order, sequence };
        setEntries((current) => [...current.filter((e) => e.nativeID !== id), entry]);
        return () => {
          released.current.set(id, sequence);
          setEntries((current) => current.filter((e) => e !== entry));
        };
      },
    }),
    [],
  );

  // Runs after the commit's re-registrations (children's layout effects run first). Every
  // register and removal updates `entries`, so this runs after each one; a stop that is still
  // released by now has unmounted, and one that mounts later counts as new.
  useLayoutEffect(() => {
    released.current.clear();
  });

  // Equal numbers keep the order the components mounted in.
  const order = useMemo(
    () => [...entries].sort((a, b) => a.order - b.order || a.sequence - b.sequence).map((e) => e.nativeID),
    [entries],
  );

  return (
    <ScreenReaderOrderContext.Provider value={registry}>
      <AccessibilityOrder {...props} nativeID={ownID} hideFromScreenReader={hideFromScreenReader} order={order} />
    </ScreenReaderOrderContext.Provider>
  );
}
