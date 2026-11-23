import { useMemo, useRef, useState } from 'react';
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

  const registry = useMemo<ScreenReaderOrderRegistry>(
    () => ({
      register(id, order) {
        const entry = { nativeID: id, order, sequence: nextSequence.current++ };
        setEntries((current) => [...current.filter((e) => e.nativeID !== id), entry]);
        return () => setEntries((current) => current.filter((e) => e !== entry));
      },
    }),
    [],
  );

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
