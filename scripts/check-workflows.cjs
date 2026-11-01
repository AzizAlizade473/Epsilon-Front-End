const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
function validate(workflow) {
  const errors = [];
  if (workflow.on?.pull_request_target)
    errors.push('Privileged PR execution forbidden');
  if (!workflow.permissions)
    errors.push('Explicit workflow token permissions required');
  for (const [name, job] of Object.entries(workflow.jobs ?? {})) {
    if (!job['timeout-minutes'])
      errors.push(`${name}: finite timeout required`);
    for (const step of job.steps ?? []) {
      if (step.uses && !/^[\w.-]+\/[\w./-]+@[a-f0-9]{40}$/.test(step.uses))
        errors.push(`${name}: action requires immutable commit SHA`);
      if (step.run && /\$\{\{\s*(?:github\.event\.|inputs\.)/.test(step.run))
        errors.push(`${name}: untrusted values must use environment arguments`);
      if (step['continue-on-error'])
        errors.push(`${name}: required steps cannot swallow failure`);
      if (
        step.uses?.startsWith('actions/checkout@') &&
        step.with?.['persist-credentials'] !== false
      )
        errors.push(`${name}: checkout must not persist credentials`);
    }
    if (
      workflow.on?.workflow_run &&
      (job.steps ?? []).some(
        (step) => step.uses?.startsWith('actions/checkout@') || step.run,
      )
    )
      errors.push(
        'Artifact comment workflow must not checkout or execute PR code',
      );
    if (
      workflow.on?.workflow_dispatch &&
      (!job.environment || !job.if?.includes("github.ref == 'refs/heads/main'"))
    )
      errors.push(
        'Manual credential workflows require protected environment and main',
      );
  }
  return errors;
}
module.exports = { validate };
if (require.main === module) {
  const errors = [];
  for (const file of fs
    .readdirSync('.github/workflows')
    .filter((file) => /\.ya?ml$/.test(file))) {
    try {
      errors.push(
        ...validate(
          YAML.parse(
            fs.readFileSync(path.join('.github/workflows', file), 'utf8'),
          ),
        ).map((error) => `${file}: ${error}`),
      );
    } catch {
      errors.push(`${file}: invalid YAML`);
    }
  }
  function checkFlows(directory) {
    for (const file of fs.readdirSync(directory, { withFileTypes: true })) {
      const name = path.join(directory, file.name);
      if (file.isDirectory()) checkFlows(name);
      else if (/\.yaml$/.test(file.name))
        for (const document of YAML.parseAllDocuments(
          fs.readFileSync(name, 'utf8'),
        ))
          if (document.errors.length)
            errors.push(`${name}: invalid Maestro YAML`);
    }
  }
  checkFlows('.maestro');
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else
    console.log(
      'Workflow security invariants and Maestro YAML syntax passed; this does not execute Actions or device flows.',
    );
}
