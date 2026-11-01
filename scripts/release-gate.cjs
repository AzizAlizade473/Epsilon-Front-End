const fs = require('node:fs');
const path = require('node:path');
// Removing a required row from the evidence file must not turn NO-GO into GO.
const required = {
  backend: 'P0',
  auth: 'P0',
  ledger: 'P0',
  deletion: 'P0',
  legal: 'P0',
  store: 'P0',
  android: 'P0',
  performance: 'P0',
  operations: 'P0',
  monitoring: 'P0',
  push: 'P1',
  ota: 'P1',
  ios: 'P2',
};
function assess(document, config) {
  const errors = [];
  const blockers = [];
  const statuses = ['PASS', 'FAIL', 'NOT TESTED', 'BLOCKED'];
  if (document.version !== 1 || !Array.isArray(document.evidence))
    return {
      errors: ['Invalid evidence document'],
      blockers,
      classification: 'NO-GO',
    };
  const seen = new Set();
  for (const row of document.evidence) {
    if (!row || !Object.hasOwn(required, row.id) || seen.has(row.id)) {
      errors.push('Unknown or duplicate evidence row');
      continue;
    }
    seen.add(row.id);
    if (row.priority !== required[row.id] || !statuses.includes(row.status))
      errors.push(`Invalid priority/status: ${row.id}`);
    if (row.status === 'PASS') {
      if (
        !['proof', 'verifiedBy', 'build'].every(
          (key) => typeof row[key] === 'string' && row[key].trim().length >= 8,
        ) ||
        !/^[a-f0-9]{40}$/.test(row.revision ?? '') ||
        !/^\d{4}-\d{2}-\d{2}T/.test(row.verifiedAt ?? '') ||
        !Number.isFinite(Date.parse(row.verifiedAt)) ||
        Date.parse(row.verifiedAt) > Date.now()
      )
        errors.push(
          `PASS lacks dated, attributed build/revision evidence: ${row.id}`,
        );
    } else if (required[row.id] === 'P0') blockers.push(row.id);
  }
  for (const id of Object.keys(required))
    if (!seen.has(id)) errors.push(`Missing evidence: ${id}`);
  const production = config?.build?.production;
  const submit = config?.submit?.production?.android;
  if (
    production?.android?.buildType !== 'app-bundle' ||
    production?.autoIncrement !== true ||
    config?.cli?.appVersionSource !== 'remote' ||
    submit?.track !== 'internal' ||
    submit?.releaseStatus !== 'draft'
  )
    errors.push(
      'Production must prepare a remotely versioned AAB for draft internal submission',
    );
  if (submit?.serviceAccountKeyPath)
    errors.push(
      'Assign the private submission key on EAS; do not reference a repository key',
    );
  return {
    errors,
    blockers,
    classification:
      errors.length || blockers.length ? 'NO-GO' : 'CONDITIONAL GO',
  };
}
module.exports = { assess };
if (require.main === module) {
  const root = path.join(__dirname, '..');
  const result = assess(
    JSON.parse(
      fs.readFileSync(path.join(root, 'docs/release-evidence.json'), 'utf8'),
    ),
    JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8')),
  );
  console.log(JSON.stringify(result, null, 2));
  // Structure checks belong to CI. Strict launch gating deliberately remains red
  // until actual external evidence exists; it performs no publishing operation.
  if (
    result.errors.length ||
    (process.argv.includes('--strict') && result.blockers.length)
  )
    process.exitCode = 1;
}
