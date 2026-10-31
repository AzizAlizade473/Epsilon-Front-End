import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable } from 'react-native';

import { Header } from '@/components/ui/Header';

test('Header exposes a wrapping heading and a caller-owned navigation action', async () => {
  const onBack = jest.fn();
  await render(
    <Header
      title="A long title that must remain readable at larger font sizes"
      leading={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
        />
      }
    />,
  );
  expect(screen.getByRole('header')).toHaveTextContent(
    'A long title that must remain readable at larger font sizes',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(onBack).toHaveBeenCalledTimes(1);
});

test('Header can reserve title space while a large screen title is visible', async () => {
  await render(<Header title="Title" titleVisible={false} />);
  expect(screen.queryByRole('header')).toBeNull();
});
