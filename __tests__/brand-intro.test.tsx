import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import * as ui from '@testing-library/react-native';

import { BrandIntro } from '@/components/brand/BrandIntro';
import { motionTokens } from '@/design';

const { act, render } = ui;
const T = motionTokens.intro;

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

const advance = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

test('Reduce Motion fades in and out without movement once the app is ready', async () => {
  const onFinished = jest.fn();
  await render(<BrandIntro variant="still" ready onFinished={onFinished} />);
  expect(ui.screen.getByRole('progressbar')).toBeOnTheScreen();
  await advance(T.reducedFade);
  expect(onFinished).not.toHaveBeenCalled();
  await advance(T.reducedFade);
  expect(onFinished).toHaveBeenCalledTimes(1);
});

test('the short intro waits for boot and only then clears into the app', async () => {
  const onFinished = jest.fn();
  const view = await render(
    <BrandIntro variant="short" ready={false} onFinished={onFinished} />,
  );
  await advance(5000);
  expect(onFinished).not.toHaveBeenCalled();
  expect(ui.screen.getByRole('progressbar').props.accessibilityState).toEqual({
    busy: true,
  });
  await view.rerender(
    <BrandIntro variant="short" ready onFinished={onFinished} />,
  );
  await advance(0); // the exit starts on the next render
  await advance(T.exit + T.exitBackgroundDelay);
  expect(onFinished).toHaveBeenCalledTimes(1);
});

test('a ready app still sees the short choreography finish before the exit', async () => {
  const onFinished = jest.fn();
  await render(<BrandIntro variant="short" ready onFinished={onFinished} />);
  await advance(T.settleDelay + T.rise - 1);
  expect(onFinished).not.toHaveBeenCalled();
  await advance(2000); // choreography ends; the exit is scheduled on that render
  await advance(T.exit + T.exitBackgroundDelay);
  expect(onFinished).toHaveBeenCalledTimes(1);
});
