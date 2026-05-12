# DEEP Audit External Evidence Runbook

Generated for the current incomplete `DEEP_AUDIT_REQUIREMENTS_V2.md` audit.

This runbook must not be used as completion evidence by itself. It lists the external evidence that must be produced by real reviewers, real users, real environments, or real CrUX/PageSpeed field data before `npm run check:deep-audit-completion` can pass.

## Current Blockers

1. `previous-complete-fix-requirements`
   - Root blocker: Chrome UX Report field data is unavailable for the production origin.
   - Required evidence: `artifacts/manual-evidence/chrome-ux-report.json`
   - Accepted only when the artifact contains real CrUX/PageSpeed field-data indicators for the production origin.
   - Commands:
     - `npm run check:crux-credentials`
     - `npm run check:crux-live-probes`
     - `npm run check:crux-monitoring`
     - `npm run refresh:crux-blocker-evidence`

2. `human-like-patient-visual-review`
   - Review packet: `artifacts/manual-evidence/patient-visual-review-packet.json`
   - Rubric: `artifacts/manual-evidence/patient-visual-review-rubric.md`
   - Template: `artifacts/manual-evidence/patient-visual-review-results.template.json`
   - Required completed artifact: `artifacts/manual-evidence/patient-visual-review-results.json`
   - Minimum pass condition: one named reviewer with real role, attestation, review date on or after the visual review packet `checkedAt`, all 5 named scenario capture reviews (`normal`, `pneumonia`, `ards`, `airwayObstruction`, `pneumothorax`), real reviewer notes for each capture, and no unresolved critical issues.

3. `multi-environment-verification`
   - Current artifact: `artifacts/manual-evidence/multi-environment-verification.json`
   - Current status: 8 of 12 environments passed.
   - Remaining environments: Firefox desktop, Edge desktop, Linux Chromium, iOS Safari.
   - Template: `artifacts/manual-evidence/external-multi-environment-results.template.json`
   - Required completed artifact: `artifacts/manual-evidence/external-multi-environment-results.json`
   - Minimum pass condition: each remaining environment includes browser name, platform, checked date, visible simulator heading, visible patient avatar, screenshot path, positive width/height, and matching SHA-256.
   - Command after adding evidence: `npm run record:multi-environment-evidence`

4. `medical-expert-review`
   - Review packet: `artifacts/manual-evidence/medical-expert-review-packet.json`
   - Rubric: `artifacts/manual-evidence/medical-expert-review-rubric.md`
   - Template: `artifacts/manual-evidence/medical-expert-review-results.template.json`
   - Required completed artifact: `artifacts/manual-evidence/medical-expert-review-results.json`
   - Minimum pass condition: 5 named role-qualified reviewers covering critical care/intensivist, respiratory therapy/ventilation specialist, emergency medicine/anesthesiology, ICU nurse educator, and medical simulation educator. Each reviewer must include credentials, review date on or after the medical review packet `generatedAt`, attestation, 5 required passed domain reviews with real reviewer notes, and no unresolved critical safety issues.

5. `user-testing`
   - Test packet: `artifacts/manual-evidence/user-testing-packet.json`
   - Rubric: `artifacts/manual-evidence/user-testing-rubric.md`
   - Template: `artifacts/manual-evidence/user-testing-results.template.json`
   - Required completed artifact: `artifacts/manual-evidence/user-testing-results.json`
   - Minimum pass condition: 10 participants covering Medical students, Respiratory therapy learners, ICU/ER nursing learners, and Clinical instructors; `testedAt` on or after the user-testing packet `generatedAt`; all 5 named task completion rates (`scenarioIdentification`, `modeChange`, `alarmRecognition`, `debriefRead`, `assistiveNavigation`) at or above 0.8; favorable feedback at or above 0.8; qualitative summary; and no unresolved critical usability issues.

## Final Verification Order

After real evidence has been added:

```sh
npm run record:multi-environment-evidence
npm run check:deep-audit-handoff
npm run check:deep-audit-completion
npm run write:final-blocker-summary
npm run check:completion-consistency
```

The goal is still incomplete unless `npm run check:deep-audit-completion` exits 0 and `artifacts/manual-evidence/deep-audit-completion-audit.json` has `"status": "complete"`.
