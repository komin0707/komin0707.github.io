import { describe, expect, it } from 'vitest';
import { validateManualEvidence } from './completion-audit-validators.mjs';

const chromeUxRequirement = {
  id: 'chrome-ux-report',
  itemNumber: 874,
  path: 'artifacts/manual-evidence/chrome-ux-report.json',
};

describe('completion audit validators', () => {
  it('rejects generic Chrome UX Report evidence without field data', () => {
    expect(
      validateManualEvidence(chromeUxRequirement, {
        evidence: 'monitoring configured but blocked',
        result: 'passed',
        verifiedAt: '2026-05-11T00:00:00Z',
        verifier: 'test',
      }),
    ).toBe(
      'Chrome UX Report evidence must include real CrUX/PageSpeed field-data evidence for the production origin.',
    );
  });

  it('accepts Chrome UX Report evidence with real field-data indicators', () => {
    expect(
      validateManualEvidence(chromeUxRequirement, {
        checks: {
          cruxApi: {
            hasRecord: true,
          },
        },
        evidence: 'CrUX API returned a production-origin record',
        result: 'passed',
        verifiedAt: '2026-05-11T00:00:00Z',
        verifier: 'test',
      }),
    ).toBeNull();
  });

  it.each([
    [
      'URL-level CrUX API record',
      {
        checks: {
          cruxApi: {
            urlRecord: {
              hasRecord: true,
            },
          },
        },
      },
    ],
    [
      'PageSpeed page loading experience',
      {
        checks: {
          pageSpeed: {
            hasLoadingExperience: true,
          },
        },
      },
    ],
    [
      'PageSpeed origin loading experience',
      {
        checks: {
          pageSpeed: {
            hasOriginLoadingExperience: true,
          },
        },
      },
    ],
    [
      'public CrUX cache origin',
      {
        checks: {
          cruxCache: {
            foundOrigin: true,
          },
        },
      },
    ],
    [
      'explicit fieldDataEvidence flag',
      {
        fieldDataEvidence: {
          available: true,
        },
      },
    ],
  ])('accepts Chrome UX Report evidence with %s', (_label, fieldData) => {
    expect(
      validateManualEvidence(chromeUxRequirement, {
        ...fieldData,
        evidence: 'CrUX field data found',
        result: 'passed',
        verifiedAt: '2026-05-11T00:00:00Z',
        verifier: 'test',
      }),
    ).toBeNull();
  });

  it('does not apply Chrome UX Report semantics to unrelated evidence', () => {
    expect(validateManualEvidence({ id: 'webpagetest' }, { result: 'passed' })).toBeNull();
  });
});
