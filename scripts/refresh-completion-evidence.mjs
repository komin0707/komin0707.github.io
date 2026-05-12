import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';

const audit = run('node', ['scripts/assert-completion-audit.mjs', '--json']);
const auditSummary = parseJson(audit.stdout);

if (!auditSummary || (auditSummary.status !== 'complete' && auditSummary.status !== 'incomplete')) {
  process.stderr.write('Completion audit did not emit a valid status summary.\n');
  process.exit(audit.status ?? 1);
}

const update = run('node', ['scripts/update-completion-evidence-manifests.mjs']);

if (update.status !== 0) {
  process.exit(update.status ?? 1);
}

const latestRemoteCrux = run('node', ['scripts/check-latest-remote-crux-run.mjs']);

if (latestRemoteCrux.status !== 0) {
  process.exit(latestRemoteCrux.status ?? 1);
}

const updateAfterLatestRemoteCrux = run('node', ['scripts/update-completion-evidence-manifests.mjs']);

if (updateAfterLatestRemoteCrux.status !== 0) {
  process.exit(updateAfterLatestRemoteCrux.status ?? 1);
}

const summary = run('node', ['scripts/write-final-blocker-summary.mjs']);

if (summary.status !== 0) {
  process.exit(summary.status ?? 1);
}

const consistency = run('node', ['scripts/assert-completion-consistency.mjs']);

if (consistency.status !== 0) {
  process.exit(consistency.status ?? 1);
}

const objectiveStatus = readObjectiveStatus();
process.stdout.write(`${JSON.stringify({ objectiveStatus }, null, 2)}\n`);
process.exit(auditSummary.status === 'complete' && objectiveStatus === 'achieved' ? 0 : 1);

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  return result;
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function readObjectiveStatus() {
  const index = parseJson(readFileSync('artifacts/completion-evidence-index.json', 'utf8'));
  return index?.objective?.status ?? 'unknown';
}
