import { View } from 'react-native';
import { useScreenReaderProps, type ScreenReaderProps } from '@/components/accessibility';
import { ListRow, type ListRowProps } from './ListRow';

type Props = ScreenReaderProps & {
  /** Each row takes the `ListRow` props; the screen-reader props go on the row itself. */
  rows: (Omit<ListRowProps, 'inset' | 'divider' | 'hideFromScreenReader' | 'screenReaderOrder'> & { key: string })[];
};

/**
 * Rows in a rounded grey card with rules between them (Figma 7310 channel info: "Notify me
 * about", "Mute this channel"). Each row is its own reading stop.
 */
export function ListGroup({ rows, hideFromScreenReader, screenReaderOrder }: Props) {
  const screenReaderProps = useScreenReaderProps({ hideFromScreenReader, screenReaderOrder });

  return (
    <View {...screenReaderProps} className="overflow-hidden rounded-lg border border-line-faint bg-surface-card">
      {rows.map(({ key, ...row }, index) => (
        <View key={key} className={index < rows.length - 1 ? 'border-b border-white' : ''}>
          <ListRow {...row} inset size="large" hideFromScreenReader={hideFromScreenReader} />
        </View>
      ))}
    </View>
  );
}
