# Manual Verification Evidence

`npm run check:completion-audit` verifies local build, test, and artifact evidence automatically. The remaining external checks must be supplied as JSON files under `artifacts/manual-evidence/`.

Each file must include these non-empty fields:

```json
{
  "verifiedAt": "2026-05-10T00:00:00.000Z",
  "verifier": "name or account that performed the check",
  "result": "pass",
  "evidence": "URL, report path, screenshot path, or concise measurement summary"
}
```

Required files:

- `react-devtools-profiler.json` for item 845
- `webpagetest.json` for item 873
- `chrome-ux-report.json` for item 874
- `nvda.json` for item 976
- `jaws.json` for item 977
- `voiceover-mac.json` for item 978
- `voiceover-ios.json` for item 979
- `talkback-android.json` for item 980
- `domain-connection.json` for item 1105

Chrome UX Report evidence is stricter than the generic manual-evidence shape. `artifacts/manual-evidence/chrome-ux-report.json` is accepted only when it has `result: "passed"` and includes real field-data indicators from the CrUX API, PageSpeed field data, or the public CrUX cache. Monitoring-only artifacts belong in `chrome-ux-report-monitoring.json` and must not be renamed into the canonical evidence file.

These files are evidence only. The matching `COMPLETE_FIX_REQUIREMENTS.md` checklist rows still need to be checked after the evidence is reviewed.
