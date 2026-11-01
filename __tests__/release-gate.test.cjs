const { test, expect } = require('@jest/globals');
const { assess } = require('../scripts/release-gate.cjs');
const evidence = require('../docs/release-evidence.json');
const config = require('../eas.json');
test('external P0 evidence blocks launch while the document/config are structurally valid', () => {
  const result = assess(evidence, config);
  expect(result.errors).toEqual([]);
  expect(result.classification).toBe('NO-GO');
  expect(result.blockers).toContain('ledger');
});
test('cannot erase blockers, downgrade priorities, duplicate rows or assert unproved PASS', () => {
  for (const mutate of [
    (doc) => doc.evidence.pop(),
    (doc) => {
      doc.evidence[0].priority = 'P2';
    },
    (doc) => doc.evidence.push(doc.evidence[0]),
    (doc) => {
      doc.evidence[0].status = 'PASS';
    },
  ]) {
    const document = structuredClone(evidence);
    mutate(document);
    expect(assess(document, config).errors.length).toBeGreaterThan(0);
  }
});
test('rejects public or completed submission defaults and repository credential paths', () => {
  const altered = structuredClone(config);
  altered.submit.production.android = {
    track: 'production',
    releaseStatus: 'completed',
    serviceAccountKeyPath: 'private.json',
  };
  expect(assess(evidence, altered).errors).toHaveLength(2);
});
test('rejects a mock/APK or production-channel staging Play candidate', () => {
  const altered = structuredClone(config);
  altered.build['internal-testing'].env.EXPO_PUBLIC_API_MODE = 'mock';
  altered.build['internal-testing'].android.buildType = 'apk';
  altered.build['internal-testing'].channel = 'production';
  expect(assess(evidence, altered).errors).toContain(
    'Play staging verification requires a live staging AAB isolated from the production environment/channel',
  );
});
test('complete attributed evidence allows only conditional readiness, never automatic public approval', () => {
  const document = structuredClone(evidence);
  document.evidence.forEach((row) =>
    Object.assign(row, {
      status: 'PASS',
      proof: 'Private evidence register reference',
      verifiedBy: 'Release reviewer',
      build: 'Android candidate 42',
      revision: 'a'.repeat(40),
      verifiedAt: '2026-10-01T12:00:00Z',
    }),
  );
  expect(assess(document, config)).toEqual({
    errors: [],
    blockers: [],
    classification: 'CONDITIONAL GO',
  });
});
