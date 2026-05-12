export function manualEvidenceFailureDetail(evidence) {
  if (evidence.semanticError) return evidence.semanticError;
  return `Missing valid manual evidence at ${evidence.path}`;
}

export function validateManualEvidence(requirement, value) {
  if (requirement.id !== 'chrome-ux-report') return null;
  if (!isObject(value)) return 'Chrome UX Report evidence must be a JSON object.';
  if (value.result !== 'passed') return 'Chrome UX Report evidence must have result "passed".';
  if (!hasChromeUxReportFieldData(value)) {
    return 'Chrome UX Report evidence must include real CrUX/PageSpeed field-data evidence for the production origin.';
  }
  return null;
}

function hasChromeUxReportFieldData(value) {
  const checks = isObject(value.checks) ? value.checks : {};
  const cruxApi = isObject(checks.cruxApi) ? checks.cruxApi : {};
  const pageSpeed = isObject(checks.pageSpeed) ? checks.pageSpeed : {};
  const cruxCache = isObject(checks.cruxCache) ? checks.cruxCache : {};
  const fieldDataEvidence = isObject(value.fieldDataEvidence) ? value.fieldDataEvidence : {};
  return Boolean(
    value.fieldDataAvailable === true ||
    fieldDataEvidence.available === true ||
    cruxApi.hasRecord === true ||
    cruxApi.urlRecord?.hasRecord === true ||
    pageSpeed.hasLoadingExperience === true ||
    pageSpeed.hasOriginLoadingExperience === true ||
    cruxCache.foundOrigin === true,
  );
}

function isObject(value) {
  return typeof value === 'object' && value !== null;
}
