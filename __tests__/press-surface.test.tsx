import { expect, jest, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';

import { PressSurface } from '@/components/ui/PressSurface';
import { Text } from '@/components/ui/Text';

test.each([{ disabled: true }, { loading: true }])(
  'blocked surface never calls an action: %j',
  async (state) => {
    const onPress = jest.fn();
    await render(
      <PressSurface {...state} accessibilityLabel="Submit" onPress={onPress}>
        <Text>Submit</Text>
      </PressSurface>,
    );
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toBeDisabled();
    await userEvent.setup().press(button);
    expect(onPress).not.toHaveBeenCalled();
  },
);
