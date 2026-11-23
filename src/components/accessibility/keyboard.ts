/**
 * Web keyboard support for a row of options (radio group, tab list). Returns the index that an
 * arrow key, Home or End moves to from `index`, wrapping at the ends, or `undefined` for other keys.
 */
export function arrowKeyTarget(key: string, index: number, count: number): number | undefined {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (index + 1) % count;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (index - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return undefined;
  }
}

/** True for the Space bar, which activates the focused radio or tab (Enter already works on the web). */
export const isSpaceKey = (key: string) => key === ' ' || key === 'Spacebar';
