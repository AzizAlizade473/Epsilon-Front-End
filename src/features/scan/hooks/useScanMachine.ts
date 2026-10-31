import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authOperation } from '@/lib/auth-lifecycle';
import { safeIdSchema } from '@/lib/deep-link';
import { services, type Receipt } from '@/services';
import { ApiError, isApiError } from '@/services/http/errors';
import { generateIdempotencyKey } from '@/services/http/idempotency';
import { queryKeys } from '@/services/query';
import {
  candidate,
  scanTransition,
  type ScanEvent,
  type ScanState,
} from '../machine';

export function useScanMachine() {
  const client = useQueryClient();
  const [state, setState] = useState<ScanState>('permission-unknown');
  const stateRef = useRef<ScanState>('permission-unknown');
  const [error, setError] = useState('UNKNOWN');
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const attempt = useRef<{
    value: string;
    kind: 'qr' | 'code';
    key: string;
  } | null>(null);
  const event = useCallback((action: ScanEvent) => {
    stateRef.current = scanTransition(stateRef.current, action);
    setState(stateRef.current);
  }, []);
  const cancel = useCallback(() => {
    generation.current += 1;
    controller.current?.abort();
    attempt.current = null;
    if (stateRef.current === 'resolving' || stateRef.current === 'success') {
      stateRef.current = 'scanning';
      setState('scanning');
    }
  }, []);
  useEffect(
    () => () => {
      generation.current += 1;
      controller.current?.abort();
      attempt.current = null;
    },
    [],
  );
  const resolve = async (
    kind: 'qr' | 'code',
    value: string,
  ): Promise<Receipt | null> => {
    if (stateRef.current !== 'scanning' && stateRef.current !== 'manual-entry')
      return null;
    event('detect');
    const parsed = candidate(kind, value);
    if (!parsed.success) {
      setError('RECEIPT_UNSUPPORTED');
      event('failed');
      return null;
    }
    if (attempt.current?.value !== value || attempt.current?.kind !== kind)
      attempt.current = {
        value,
        kind,
        key: generateIdempotencyKey('receipt-resolve'),
      };
    const key = attempt.current.key;
    const version = generation.current;
    const epoch = authOperation.epoch();
    const request = new AbortController();
    controller.current = request;
    try {
      const receipt = await services.receipt.resolve(parsed.data, {
        idempotencyKey: key,
        signal: request.signal,
      });
      if (version !== generation.current || !authOperation.current(epoch))
        return null;
      if (!safeIdSchema.safeParse(receipt.id).success)
        throw new ApiError({
          code: 'BAD_RESPONSE',
          message: 'Invalid receipt identifier',
          status: 0,
        });
      client.setQueryData(queryKeys.receipt.detail(receipt.id), receipt);
      event('resolved');
      return receipt;
    } catch (cause) {
      if (version === generation.current && authOperation.current(epoch)) {
        setError(isApiError(cause) ? cause.code : 'UNKNOWN');
        event('failed');
      }
      return null;
    }
  };
  return { state, error, event, resolve, cancel };
}
