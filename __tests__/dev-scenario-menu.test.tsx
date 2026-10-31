/**
 * 03.f — Dev scenario menu unit tests.
 */

import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { DevScenarioMenu } from '@/components/dev/dev-scenario-menu';
import { getMockScenario, setMockScenario } from '@/services/mock/scenario';
import { initializeI18n } from '@/lib/i18n';

describe('DevScenarioMenu', () => {
  beforeEach(async () => {
    await initializeI18n();
    setMockScenario('success');
  });

  it('renders nothing when visible is false', async () => {
    await render(<DevScenarioMenu onClose={jest.fn()} visible={false} />);
    expect(screen.queryByTestId('dev-scenario-menu')).toBeNull();
  });

  it('renders available scenarios when visible', async () => {
    await render(<DevScenarioMenu onClose={jest.fn()} visible={true} />);

    expect(screen.getByTestId('dev-scenario-menu')).toBeTruthy();
    expect(screen.getByText(/Uğurlu/)).toBeTruthy();
    expect(screen.getByText(/Boş siyahı/)).toBeTruthy();
    expect(screen.getByText(/Şəbəkə xətası/)).toBeTruthy();
  });

  it('changes active scenario and triggers callbacks on selection', async () => {
    const onClose = jest.fn();
    const onSelectScenario = jest.fn();

    await render(
      <DevScenarioMenu
        onClose={onClose}
        onSelectScenario={onSelectScenario}
        visible={true}
      />,
    );

    const emptyOption = screen.getByTestId('scenario-item-empty');
    fireEvent.press(emptyOption);

    expect(getMockScenario()).toBe('empty');
    expect(onSelectScenario).toHaveBeenCalledWith('empty');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when close button is pressed', async () => {
    const onClose = jest.fn();
    await render(<DevScenarioMenu onClose={onClose} visible={true} />);

    fireEvent.press(screen.getByTestId('dev-scenario-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
