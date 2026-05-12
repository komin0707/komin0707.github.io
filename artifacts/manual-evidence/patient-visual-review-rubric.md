# Patient Visual Review Rubric

Generated: 2026-05-12T01:55:44.253Z

This packet is for external human review. A reviewer must inspect each screenshot and record pass/fail notes; automated capture alone does not satisfy the final human visual/clinical confirmation requirement.

## Rubric

- [ ] Human morphology: face, head, torso, arms, hands, and body proportions read as a patient rather than a symbolic diagram.
- [ ] Bedside context: pillow, bed surface, gown, lines, circuit, and airway equipment are visible and clinically coherent.
- [ ] Respiratory state: chest movement, breath source, breath pattern, and oxygenation cues match the selected scenario.
- [ ] Clinical pathology: scenario-specific color, perfusion, lung, secretion, or distress cues are visible without hiding anatomy.
- [ ] Readability: overlays and labels support clinical interpretation without visual clutter or occlusion.

## Screenshots

### Normal baseline

- Scenario: `normal`
- Screenshot: `artifacts/manual-evidence/patient-visual-review/normal.png`
- State: condition=`stable`, breathPattern=`regular`, breathSource=`mechanical`, expression=`calm`, alarmLevel=`none`

Reviewer notes:

- Human morphology:
- Clinical coherence:
- Respiratory/pathology cues:
- Required changes:

### Pneumonia

- Scenario: `pneumonia`
- Screenshot: `artifacts/manual-evidence/patient-visual-review/pneumonia.png`
- State: condition=`worsening`, breathPattern=`tachypnea`, breathSource=`mechanical`, expression=`drowsy`, alarmLevel=`critical`

Reviewer notes:

- Human morphology:
- Clinical coherence:
- Respiratory/pathology cues:
- Required changes:

### ARDS

- Scenario: `ards`
- Screenshot: `artifacts/manual-evidence/patient-visual-review/ards.png`
- State: condition=`critical`, breathPattern=`gasping`, breathSource=`mechanical`, expression=`critical`, alarmLevel=`critical`

Reviewer notes:

- Human morphology:
- Clinical coherence:
- Respiratory/pathology cues:
- Required changes:

### Airway obstruction

- Scenario: `airwayObstruction`
- Screenshot: `artifacts/manual-evidence/patient-visual-review/airwayObstruction.png`
- State: condition=`worsening`, breathPattern=`regular`, breathSource=`mechanical`, expression=`distressed`, alarmLevel=`critical`

Reviewer notes:

- Human morphology:
- Clinical coherence:
- Respiratory/pathology cues:
- Required changes:

### Pneumothorax

- Scenario: `pneumothorax`
- Screenshot: `artifacts/manual-evidence/patient-visual-review/pneumothorax.png`
- State: condition=`worsening`, breathPattern=`tachypnea`, breathSource=`mechanical`, expression=`drowsy`, alarmLevel=`critical`

Reviewer notes:

- Human morphology:
- Clinical coherence:
- Respiratory/pathology cues:
- Required changes:

