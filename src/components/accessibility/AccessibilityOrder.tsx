import { Platform, View, type ViewProps } from 'react-native';
import { useScreenReaderProps, useSkipSubtreeFocusProps, type ScreenReaderProps } from './screenReader';

export type AccessibilityOrderProps = Omit<ViewProps, 'accessible' | 'experimental_accessibilityOrder'> &
  ScreenReaderProps & {
    /** Descendant nativeIDs in screen-reader traversal order. Include every reading stop. */
    order: readonly string[];
  };

/**
 * Native traversal order without changing visual layout. On web, reading order
 * follows the rendered source, so children must already be in reading order.
 */
export function AccessibilityOrder({
  order,
  hideFromScreenReader,
  screenReaderOrder,
  ...props
}: AccessibilityOrderProps) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder }, props.nativeID);
  const subtreeFocusProps = useSkipSubtreeFocusProps(hideFromScreenReader);
  // An empty native order hides every descendant; use the default order instead.
  const nativeOrder = Platform.OS !== 'web' && order.length > 0
    ? { experimental_accessibilityOrder: [...order] }
    : {};

  return <View {...props} {...screenReaderProps} {...subtreeFocusProps} {...nativeOrder} accessible={false} collapsable={false} />;
}
