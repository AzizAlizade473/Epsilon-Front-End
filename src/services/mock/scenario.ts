/**
 * 03.e — Mock scenario state and controller.
 */

import { ApiError } from '../http/errors';

export type MockScenario =
  | 'success'
  | 'empty'
  | 'network_error'
  | 'unauthorized'
  | 'otp_invalid'
  | 'otp_expired'
  | 'receipt_already_claimed'
  | 'receipt_expired'
  | 'receipt_unsupported'
  | 'receipt_not_found'
  | 'feedback_pending'
  | 'feedback_none'
  | 'feedback_validation'
  | 'feedback_already_submitted';

let _activeScenario: MockScenario = 'success';
let _simulatedLatencyMs = 300;

export function setMockScenario(scenario: MockScenario): void {
  _activeScenario = scenario;
}

export function getMockScenario(): MockScenario {
  return _activeScenario;
}

export function setMockLatency(ms: number): void {
  _simulatedLatencyMs = ms;
}

export async function simulateDelay(): Promise<void> {
  if (_simulatedLatencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, _simulatedLatencyMs));
  }
}

export function checkMockScenario(
  scope?: 'auth' | 'receipt' | 'feedback',
): void {
  if (_activeScenario === 'network_error') {
    throw new ApiError({
      code: 'NETWORK',
      message: 'Simulated network connection failure',
      status: 0,
    });
  }
  if (_activeScenario === 'unauthorized') {
    throw new ApiError({
      code: 'UNAUTHORIZED',
      message: 'Simulated unauthorized session',
      status: 401,
    });
  }
  if (scope === 'auth') {
    if (_activeScenario === 'otp_invalid') {
      throw new ApiError({
        code: 'OTP_INVALID',
        message: 'Daxil edilən OTP kodu yanlışdır',
        status: 400,
      });
    }
    if (_activeScenario === 'otp_expired') {
      throw new ApiError({
        code: 'OTP_EXPIRED',
        message: 'OTP kodunun vaxtı bitmişdir',
        status: 400,
      });
    }
  }
  if (scope === 'receipt') {
    if (
      _activeScenario === 'receipt_unsupported' ||
      _activeScenario === 'receipt_not_found'
    )
      throw new ApiError({
        code:
          _activeScenario === 'receipt_unsupported'
            ? 'RECEIPT_UNSUPPORTED'
            : 'RECEIPT_NOT_FOUND',
        message: 'Simulated receipt error',
        status: 400,
      });
    if (_activeScenario === 'receipt_already_claimed') {
      throw new ApiError({
        code: 'RECEIPT_ALREADY_CLAIMED',
        message: 'Bu qəbz artıq istifadə edilib',
        status: 409,
      });
    }
    if (_activeScenario === 'receipt_expired') {
      throw new ApiError({
        code: 'RECEIPT_EXPIRED',
        message: 'Qəbzin etibarlılıq müddəti bitib',
        status: 410,
      });
    }
  }
  if (scope === 'feedback') {
    if (_activeScenario === 'feedback_validation')
      throw new ApiError({
        code: 'VALIDATION_FAILED',
        message: 'Simulated invalid feedback',
        status: 422,
      });
    if (_activeScenario === 'feedback_already_submitted') {
      throw new ApiError({
        code: 'FEEDBACK_ALREADY_SUBMITTED',
        message: 'Bu məhsul üçün artıq rəy bildirmisiniz',
        status: 409,
      });
    }
  }
}
