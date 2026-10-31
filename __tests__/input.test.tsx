import { expect, jest, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';

import { Input } from '@/components/ui/Input';

function Form({ error }: { error?: string }) {
  const [value, setValue] = useState('');
  return (
    <Input label="Name" value={value} onChangeText={setValue} error={error} />
  );
}

test('an input keeps its draft when an accessible validation error appears', async () => {
  const view = await render(<Form />);
  await userEvent.setup().type(screen.getByLabelText('Name'), 'Draft');
  await view.rerender(<Form error="Check the name" />);
  expect(screen.getByLabelText('Name')).toHaveDisplayValue('Draft');
  expect(screen.getByRole('alert')).toHaveTextContent('Check the name');
  expect(screen.getByLabelText('Name')).toHaveProp(
    'accessibilityHint',
    'Check the name',
  );
});

test('a non-editable input rejects typing', async () => {
  const change = jest.fn();
  await render(
    <Input
      label="Account"
      value="Read only"
      editable={false}
      onChangeText={change}
    />,
  );
  const input = screen.getByLabelText('Account');
  expect(input).toBeDisabled();
  await userEvent.setup().type(input, 'Other');
  expect(change).not.toHaveBeenCalled();
});
