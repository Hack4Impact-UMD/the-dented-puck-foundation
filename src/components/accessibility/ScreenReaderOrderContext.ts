import { createContext, useContext, useId, useLayoutEffect } from 'react';

export type ScreenReaderOrderRegistry = {
  /** Adds a reading stop to the scope's order. Returns a function that removes it. */
  register(nativeID: string, order: number): () => void;
};

export const ScreenReaderOrderContext = createContext<ScreenReaderOrderRegistry | null>(null);

/**
 * Puts an element at position `order` in the nearest `ScreenReaderOrderScope`.
 * Returns the `nativeID` to set on that element: `nativeID` if you pass one, otherwise a generated
 * ID. Without an `order` it registers nothing and returns `nativeID` unchanged.
 */
export function useScreenReaderOrder(order: number | undefined, nativeID?: string): string | undefined {
  const registry = useContext(ScreenReaderOrderContext);
  const generatedID = `screen-reader-order${useId()}`;
  const id = nativeID ?? generatedID;

  useLayoutEffect(() => {
    if (order === undefined) return;
    if (!registry) {
      if (__DEV__) {
        console.warn(
          `screenReaderOrder={${order}} has no effect outside a <ScreenReaderOrderScope>. Wrap the page in one.`,
        );
      }
      return;
    }
    return registry.register(id, order);
  }, [registry, id, order]);

  return order === undefined ? nativeID : id;
}
