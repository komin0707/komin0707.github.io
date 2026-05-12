import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const scriptPath = resolve('scripts/assert-completion-audit.mjs');

describe('completion audit command integration', () => {
  it('runs Snyk through non-interactive npx and does not report a Snyk blocker when it passes', async () => {
    const workspace = await createCompleteWorkspace();

    const result = spawnSync(process.execPath, [scriptPath, '--json'], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        COMPLETION_CLAIMED_CHECKLIST_ROWS: '0',
        PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(readFileSync(join(workspace, 'npx-args.txt'), 'utf8')).toBe('--yes snyk test\n');
    expect(readFileSync(join(workspace, 'npm-args.txt'), 'utf8')).toBe(
      ['audit --audit-level=moderate', 'run check:licenses', 'run check:sbom', ''].join('\n'),
    );

    const audit = readJson(join(workspace, 'artifacts/completion-audit.json'));
    expect(audit.status).toBe('complete');
    expect(audit.blockers).toEqual([]);
    expect(audit.commands.npmAudit).toMatchObject({ exitCode: 0 });
    expect(audit.commands.licensePolicy).toMatchObject({ exitCode: 0 });
    expect(audit.commands.sbom).toMatchObject({ exitCode: 0 });
    expect(audit.commands.snyk).toMatchObject({
      exitCode: 0,
      stderr: '',
      stdout: 'snyk ok\n',
    });
    expect(audit.sbom).toMatchObject({
      applicationName: 'vent 2d',
      componentCount: 1,
      path: 'artifacts/sbom.json',
      valid: true,
    });
  });

  it('rejects completion when the objective claims more checklist rows than the file contains', async () => {
    const workspace = await createCompleteWorkspace();

    const result = spawnSync(process.execPath, [scriptPath, '--json'], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        COMPLETION_CLAIMED_CHECKLIST_ROWS: '1167',
        PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/completion-audit.json'));
    expect(audit.status).toBe('incomplete');
    expect(audit.blockers).toEqual([
      {
        detail: 'Objective checklist row claim mismatch: claimed 1167, actual 1105, delta -62',
        id: 'objective-row-claim',
      },
      {
        detail:
          'Objective phase checklist claim mismatch: phase claims 1200, actual 1105, actual-phase delta -95, phase-total delta 33',
        id: 'objective-phase-claim',
      },
    ]);
    expect(audit.objectiveRowClaim).toEqual({
      actualChecklistRowsObserved: 1105,
      claimedChecklistRows: 1167,
      checklistRowDeltaFromClaim: -62,
      enabled: true,
      satisfied: false,
      status: 'mismatch',
    });
    expect(audit.objectivePhaseClaim).toEqual({
      actualChecklistRowsObserved: 1105,
      checklistRowDeltaFromPhaseClaims: -95,
      enabled: true,
      phaseClaimedChecklistRowsTotal: 1200,
      phaseClaimsDeltaFromClaimedTotal: 33,
      satisfied: false,
      status: 'mismatch',
    });
  });

  it('rejects completion when actual rows match the total claim but phase claims do not reconcile', async () => {
    const workspace = await createCompleteWorkspace();
    writeFileSync(join(workspace, 'COMPLETE_FIX_REQUIREMENTS.md'), buildCheckedRequirements(1167));

    const result = spawnSync(process.execPath, [scriptPath, '--json'], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        COMPLETION_CLAIMED_CHECKLIST_ROWS: '1167',
        PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      },
    });

    expect(result.stderr).toBe('');
    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/completion-audit.json'));
    expect(audit.objectiveRowClaim).toMatchObject({
      actualChecklistRowsObserved: 1167,
      claimedChecklistRows: 1167,
      checklistRowDeltaFromClaim: 0,
      satisfied: true,
      status: 'matched',
    });
    expect(audit.objectivePhaseClaim).toEqual({
      actualChecklistRowsObserved: 1167,
      checklistRowDeltaFromPhaseClaims: -33,
      enabled: true,
      phaseClaimedChecklistRowsTotal: 1200,
      phaseClaimsDeltaFromClaimedTotal: 33,
      satisfied: false,
      status: 'mismatch',
    });
    expect(audit.blockers).toContainEqual({
      detail:
        'Objective phase checklist claim mismatch: phase claims 1200, actual 1167, actual-phase delta -33, phase-total delta 33',
      id: 'objective-phase-claim',
    });
    expect(audit.status).toBe('incomplete');
  });

  it('rejects malformed checkbox rows that are not numbered checklist items', async () => {
    const workspace = await createCompleteWorkspace();
    writeFileSync(
      join(workspace, 'COMPLETE_FIX_REQUIREMENTS.md'),
      `${buildCheckedRequirements(1105)}- [x] unnumbered checklist row\n`,
    );

    const result = spawnSync(process.execPath, [scriptPath, '--json'], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        COMPLETION_CLAIMED_CHECKLIST_ROWS: '0',
        PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      },
    });

    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/completion-audit.json'));
    expect(audit.status).toBe('incomplete');
    expect(audit.checklist.malformedChecklistRows).toEqual([
      { line: 1106, text: '- [x] unnumbered checklist row' },
    ]);
    expect(audit.blockers).toContainEqual({
      detail: 'Malformed checklist rows at lines 1106',
      id: 'checklist-malformed-row',
    });
  });

  it('rejects a checked Chrome UX Report item when canonical field-data evidence is missing', async () => {
    const workspace = await createCompleteWorkspace();
    rmSync(join(workspace, 'artifacts/manual-evidence/chrome-ux-report.json'));

    const result = spawnSync(process.execPath, [scriptPath, '--json'], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        COMPLETION_CLAIMED_CHECKLIST_ROWS: '0',
        PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      },
    });

    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/completion-audit.json'));
    expect(audit.status).toBe('incomplete');
    expect(audit.checklist.unchecked).toBe(0);
    expect(audit.manualEvidence.find((evidence) => evidence.id === 'chrome-ux-report')).toMatchObject({
      exists: false,
      itemNumber: 874,
      valid: false,
    });
    expect(audit.blockers).toContainEqual({
      detail: '874. Missing valid manual evidence at artifacts/manual-evidence/chrome-ux-report.json',
      id: 'chrome-ux-report',
    });
  });

  it('rejects completion when dist build output is missing', async () => {
    const workspace = await createCompleteWorkspace();
    rmSync(join(workspace, 'dist'), { recursive: true, force: true });

    const result = spawnSync(process.execPath, [scriptPath, '--json'], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        COMPLETION_CLAIMED_CHECKLIST_ROWS: '0',
        PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      },
    });

    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/completion-audit.json'));
    expect(audit.status).toBe('incomplete');
    expect(audit.dist).toMatchObject({
      exists: false,
      fileCount: 0,
      hasBuildOutput: false,
      primaryJsCssBytes: 0,
      primaryJsCssFiles: [],
      totalBytes: 0,
    });
    expect(audit.blockers).toContainEqual({
      detail: 'Missing dist build output. Run npm run build before auditing completion.',
      id: 'dist-build-output',
    });
  });

  it('rejects completion when dist has no primary JavaScript or CSS assets', async () => {
    const workspace = await createCompleteWorkspace();
    rmSync(join(workspace, 'dist/assets/index.js'));

    const result = spawnSync(process.execPath, [scriptPath, '--json'], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        COMPLETION_CLAIMED_CHECKLIST_ROWS: '0',
        PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      },
    });

    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/completion-audit.json'));
    expect(audit.status).toBe('incomplete');
    expect(audit.dist).toMatchObject({
      exists: true,
      fileCount: 1,
      hasBuildOutput: false,
      primaryJsCssBytes: 0,
      primaryJsCssFiles: [],
    });
    expect(audit.blockers).toContainEqual({
      detail:
        'dist build output has no primary JS/CSS assets under dist/assets. Run npm run build before auditing completion.',
      id: 'dist-build-output',
    });
  });

  it('rejects a checked Chrome UX Report item when evidence lacks real field data', async () => {
    const workspace = await createCompleteWorkspace();
    writeJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report.json'), {
      evidence: 'API probe completed but returned no field data.',
      result: 'passed',
      verifiedAt: '2026-05-11T00:00:00.000Z',
      verifier: 'test',
      fieldDataAvailable: false,
    });

    const result = spawnSync(process.execPath, [scriptPath, '--json'], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        COMPLETION_CLAIMED_CHECKLIST_ROWS: '0',
        PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      },
    });

    expect(result.status).toBe(1);

    const audit = readJson(join(workspace, 'artifacts/completion-audit.json'));
    expect(audit.status).toBe('incomplete');
    expect(audit.manualEvidence.find((evidence) => evidence.id === 'chrome-ux-report')).toMatchObject({
      exists: true,
      itemNumber: 874,
      semanticError:
        'Chrome UX Report evidence must include real CrUX/PageSpeed field-data evidence for the production origin.',
      valid: false,
    });
    expect(audit.blockers).toContainEqual({
      detail:
        '874. Chrome UX Report evidence must include real CrUX/PageSpeed field-data evidence for the production origin.',
      id: 'chrome-ux-report',
    });
  });

  it('records checklist counts by top-level requirements section', async () => {
    const workspace = await createCompleteWorkspace();
    writeFileSync(
      join(workspace, 'COMPLETE_FIX_REQUIREMENTS.md'),
      [
        '## SECTION A',
        '1. [x] Item 1',
        '2. [x] Item 2',
        '## SECTION B',
        '3. [x] Item 3',
        '4. [x] Item 4',
      ].join('\n'),
    );

    const result = spawnSync(process.execPath, [scriptPath, '--json'], {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        COMPLETION_CLAIMED_CHECKLIST_ROWS: '0',
        PATH: `${join(workspace, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
      },
    });

    expect(result.status).toBe(0);

    const audit = readJson(join(workspace, 'artifacts/completion-audit.json'));
    expect(audit.checklist.sections).toEqual([
      {
        checked: 2,
        firstItem: 1,
        lastItem: 2,
        title: 'SECTION A',
        total: 2,
        unchecked: 0,
      },
      {
        checked: 2,
        firstItem: 3,
        lastItem: 4,
        title: 'SECTION B',
        total: 2,
        unchecked: 0,
      },
    ]);
  });
});

async function createCompleteWorkspace() {
  const workspace = await mkdtemp(join(tmpdir(), 'completion-audit-'));
  mkdirSync(join(workspace, 'artifacts/manual-evidence'), { recursive: true });
  mkdirSync(join(workspace, 'bin'), { recursive: true });
  mkdirSync(join(workspace, 'dist/assets'), { recursive: true });
  mkdirSync(join(workspace, 'scripts'), { recursive: true });

  writeFileSync(join(workspace, 'COMPLETE_FIX_REQUIREMENTS.md'), buildCheckedRequirements(1105));
  writeFileSync(
    join(workspace, 'scripts/assert-forbidden-patterns.mjs'),
    'process.stdout.write("pass\\n");\n',
  );
  writeFileSync(join(workspace, 'scripts/assert-test-realism.mjs'), 'process.stdout.write("pass\\n");\n');
  writeFileSync(join(workspace, 'dist/index.html'), '<div id="root"></div>\n');
  writeFileSync(join(workspace, 'dist/assets/index.js'), 'export {};\n');
  writeFileSync(join(workspace, 'artifacts/patient-avatar-current.png'), tinyPng());
  writeFileSync(join(workspace, 'artifacts/simulator-current.png'), tinyPng());
  writeManualEvidence(workspace);
  writeVisualReviewEvidence(workspace);
  writeExecutable(join(workspace, 'bin/git'), '#!/bin/sh\nprintf "true\\n"\n');
  writeExecutable(
    join(workspace, 'bin/npm'),
    `#!/bin/sh
printf "%s\\n" "$*" >> npm-args.txt
if [ "$1" = "run" ] && [ "$2" = "check:sbom" ]; then
  cat > artifacts/sbom.json <<'JSON'
{"bomFormat":"CycloneDX","specVersion":"1.5","metadata":{"component":{"name":"vent 2d"}},"components":[{"name":"preact"}]}
JSON
fi
printf "npm ok\\n"
`,
  );
  writeExecutable(
    join(workspace, 'bin/npx'),
    `#!/bin/sh
printf "%s\\n" "$*" > npx-args.txt
printf "snyk ok\\n"
`,
  );

  return workspace;
}

function buildCheckedRequirements(count) {
  return Array.from({ length: count }, (_, index) => `${String(index + 1)}. [x] Item ${String(index + 1)}`)
    .join('\n')
    .concat('\n');
}

function writeManualEvidence(workspace) {
  const base = {
    evidence: 'verified',
    result: 'passed',
    verifiedAt: '2026-05-11T00:00:00.000Z',
    verifier: 'test',
  };
  const paths = [
    'react-devtools-profiler.json',
    'webpagetest.json',
    'nvda.json',
    'jaws.json',
    'voiceover-mac.json',
    'voiceover-ios.json',
    'talkback-android.json',
    'domain-connection.json',
  ];

  for (const path of paths) {
    writeJson(join(workspace, 'artifacts/manual-evidence', path), base);
  }

  writeJson(join(workspace, 'artifacts/manual-evidence/chrome-ux-report.json'), {
    ...base,
    checks: {
      pageSpeed: {
        hasLoadingExperience: true,
      },
    },
    fieldDataAvailable: true,
  });
}

function writeVisualReviewEvidence(workspace) {
  writeJson(join(workspace, 'artifacts/manual-evidence/visual-screenshot-review.json'), {
    verifiedAt: '2026-05-11T00:00:00.000Z',
    verifier: 'test',
    result: 'passed',
    evidence: 'Manual visual screenshot review fixture.',
    screenshots: [
      pngReview('artifacts/patient-avatar-current.png', tinyPng()),
      pngReview('artifacts/simulator-current.png', tinyPng()),
    ],
    observedClinicalFeatures: ['patient avatar visible'],
  });
}

function pngReview(path, content) {
  return {
    path,
    sha256: createHash('sha256').update(content).digest('hex'),
    width: content.readUInt32BE(16),
    height: content.readUInt32BE(20),
    observed: ['fixture screenshot visible'],
  };
}

function tinyPng() {
  return Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
    'hex',
  );
}

function writeExecutable(path, content) {
  writeFileSync(path, content);
  chmodSync(path, 0o755);
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
