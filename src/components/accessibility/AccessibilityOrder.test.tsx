import { Platform, Pressable, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { AccessibilityOrder } from './AccessibilityOrder';

const originalOS = Platform.OS;

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalOS });
});

it.each(['ios', 'android'])('sets traversal order without grouping controls on %s', async os => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
  const onPress = jest.fn();
  const order = ['title', 'save'] as const;
  const screen = await render(
    <AccessibilityOrder order={order} testID="order" style={{ padding: 12 }}>
      <Text nativeID="title" accessible accessibilityRole="header">Profile</Text>
      <Pressable nativeID="save" accessibilityRole="button" accessibilityLabel="Save" onPress={onPress}>
        <Text>Save</Text>
      </Pressable>
    </AccessibilityOrder>,
  );

  const root = screen.getByTestId('order');
  expect(root.props.experimental_accessibilityOrder).toEqual(['title', 'save']);
  expect(root.props.accessible).toBe(false);
  expect(root.props.collapsable).toBe(false);
  expect(root.props.style).toEqual({ padding: 12 });
  expect(screen.getByRole('header', { name: 'Profile' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('leaves web traversal to source order without emitting the native prop', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  const screen = await render(
    <AccessibilityOrder order={['title']} testID="order">
      <Text nativeID="title">Profile</Text>
    </AccessibilityOrder>,
  );

  expect(screen.getByTestId('order').props.experimental_accessibilityOrder).toBeUndefined();
  expect(screen.getByText('Profile')).toBeTruthy();
});

it('falls back to default traversal for an empty order', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  const screen = await render(
    <AccessibilityOrder order={[]} testID="order"><Text>Still readable</Text></AccessibilityOrder>,
  );

  expect(screen.getByTestId('order').props.experimental_accessibilityOrder).toBeUndefined();
});
