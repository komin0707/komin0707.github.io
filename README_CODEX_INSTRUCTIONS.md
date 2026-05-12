# How to Use These Documents with Codex

> **For the user:** This explains how to properly direct Codex to improve the Vent 2D Simulator using the three quality documents.

---

## The Three Documents You Have

### 1. CODEX_IMPROVEMENT_CHECKLIST.md (500+ items)
**What it is:** A comprehensive list of 500+ specific improvements organized by category.

**When to use:** When you want Codex to improve quality across the entire project.

**How to use with Codex:**
```
/goal Use CODEX_IMPROVEMENT_CHECKLIST.md to improve test coverage to 80%

The checklist has a "TEST COVERAGE" section with 100+ specific test requirements.
Add unit tests for all functions and components listed.
Run npm test:coverage and verify >= 80%.
```

**Example output you should see:**
```
Codex: "I've added 150 new tests across:
- ventilatorModel.ts: 5 → 45 tests
- Components: 0 → 40 tests  
- Waveform: 6 → 20 tests

Coverage report:
Lines: 87%
Functions: 89%
Branches: 82%

All validation checks passed:
✓ npm test: 195 tests passing
✓ npm run type-check: 0 errors
✓ npm run build: successful"
```

### 2. CODEX_QUALITY_PROTOCOL.md (Process & Validation)
**What it is:** Instructions on HOW to validate work properly and prevent fake completions.

**When to use:** When you want to establish quality gates and ensure Codex doesn't cut corners.

**How to use with Codex:**
```
/goal Follow CODEX_QUALITY_PROTOCOL.md for adding TypeScript strict mode

This file explains the multi-stage validation process.
Don't just make changes - follow: Requirements → Implementation → Validation.
Use the three gate checks (type-check, test, build) before marking complete.
Report results explicitly.
```

**Red flags to watch for (signs Codex is cutting corners):**
- ✗ "Tests pass, so I'm done" (didn't check coverage)
- ✗ "@ts-ignore for now" (hiding type errors)
- ✗ "Looks good" (didn't measure performance)
- ✗ "I'll add tests later" (tests first, always)

### 3. CODEX_QUICK_REFERENCE.md (Tactical Checklists)
**What it is:** Quick checklists for 10+ common tasks (add tests, fix types, etc.)

**When to use:** For specific, focused improvements.

**How to use with Codex:**
```
/goal Use CODEX_QUICK_REFERENCE.md to fix all TypeScript errors

The "Fix TypeScript Errors" section has exact steps.
Run the commands listed, don't use @ts-ignore, fix the actual issue.
```

---

## Example: Directing Codex Properly

### ✗ WRONG WAY (What causes fake completions):
```
/goal Improve code quality
```
(Codex has no idea what to do, runs tests randomly, marks complete)

### ✓ RIGHT WAY (What ensures real improvements):
```
/goal Use CODEX_IMPROVEMENT_CHECKLIST.md Section 3 to add unit tests

Specific goal:
- Current test coverage: 10% (144 lines)
- Target: 80% 
- Missing: Unit tests for ventilatorModel.ts (353 lines)

Acceptance criteria:
✓ npm test:coverage shows >= 80%
✓ All 353 lines in ventilatorModel.ts are covered by tests
✓ No @ts-ignore or any type used
✓ Bundle size doesn't increase
✓ All tests follow AAA pattern (Arrange/Act/Assert)

Validation:
Before marking complete, Codex must show:
1. Coverage report (80%+ confirmed)
2. npm test output (all tests passing)
3. npm run type-check output (0 errors)
4. npm run build output (successful)
5. Manual review of test quality (not just smoke tests)
```

---

## How to Structure Your Goals for Codex

### Format 1: "Improve X"
```
/goal Improve test coverage using CODEX_IMPROVEMENT_CHECKLIST.md

Section: PART 3: TEST COVERAGE & QUALITY
Target: 80% coverage
Current: ~10%

Read CODEX_QUALITY_PROTOCOL.md Stage 1 for requirements analysis.
Implement tests following the pattern in CODEX_QUICK_REFERENCE.md.
Validate using the checklist provided.
```

### Format 2: "Fix X"
```
/goal Fix TypeScript errors using CODEX_QUALITY_PROTOCOL.md

Reference: CODEX_QUICK_REFERENCE.md section "Fix TypeScript Errors"
Target: npm run type-check shows 0 errors
Current: ? (check this first)

Do NOT use @ts-ignore.
Do NOT use any type.
Fix the actual issue.

Validation:
npm run type-check → must show 0 errors
npm test → must still pass
npm run build → must succeed
```

### Format 3: "Implement X"
```
/goal Implement component tests using CODEX_IMPROVEMENT_CHECKLIST.md

Section: Component Unit Tests
Files to test:
- Header.tsx
- SettingsPanel.tsx
- SliderControl.tsx
- MonitorPanel.tsx
- PatientConditionPanel.tsx
- AlarmPanel.tsx
- LungStatusPanel.tsx
- WaveformChart.tsx
- PatientAvatar2D.tsx

Reference: CODEX_QUICK_REFERENCE.md "Add Component Tests"
Each component needs:
- Render test
- Props test
- User interaction tests
- Edge case tests

Validation: npm test:coverage >= 80%
```

---

## The Three-Step Process

Always tell Codex:

### Step 1: Understand Requirements
```
Before implementing, read these docs:
- CODEX_IMPROVEMENT_CHECKLIST.md Section X
- CODEX_QUALITY_PROTOCOL.md Stage 1
- Identify acceptance criteria
- List edge cases
```

### Step 2: Implement with Validation Gates
```
Implement incrementally.
After each change:
- npm run type-check (must pass)
- npm test (must pass)
- npm run build (must succeed)
If any fail, fix before continuing.
```

### Step 3: Final Validation
```
Before marking complete, run ALL checks:
- npm run type-check
- npm test
- npm test:coverage (check threshold)
- npm run build
- Code review (read your own code)
- Manual testing (if UI changes)
```

---

## Examples of Goals That Work

### Example 1: Add Tests
```
/goal Add unit tests for calculateVitals function

Use CODEX_QUICK_REFERENCE.md for test patterns.
Target: 87% coverage for src/simulation/ventilatorModel.ts
Current: 12%

Test cases needed (from CODEX_IMPROVEMENT_CHECKLIST.md Part 3.2):
- All ventilation modes (AC, VC, PC, PSV, CPAP)
- All scenarios (normal, pneumonia, ARDS, obstruction, pneumothorax)
- Boundary values (PEEP 0-25, Vt 200-1200, RR 4-100)
- Edge cases (null values, extreme settings)
- Alarm generation (all alarm types)

Validation:
✓ npm test:coverage shows >= 87% for ventilatorModel.ts
✓ No .skip() or .todo() in tests
✓ All test names describe behavior
✓ All tests follow AAA pattern
```

### Example 2: Fix TypeScript
```
/goal Fix TypeScript strict mode errors

Use CODEX_QUALITY_PROTOCOL.md validation stage.
Target: 0 errors with strict mode enabled
Current: ? (check npm run type-check)

Steps:
1. Enable strict mode options in tsconfig.json:
   - noImplicitAny: true
   - noUnusedLocals: true
   - noUnusedParameters: true
2. Run npm run type-check
3. Fix EVERY error (no @ts-ignore)
4. Verify npm test still passes
5. Verify npm run build succeeds

Use CODEX_QUICK_REFERENCE.md for common fixes.
```

### Example 3: Improve Performance
```
/goal Reduce bundle size to < 60 kB gzipped

Current: 71.49 kB (from latest build)
Target: < 60 kB (11 kB reduction needed)

Use CODEX_IMPROVEMENT_CHECKLIST.md Part 5: Performance.
Use CODEX_QUICK_REFERENCE.md "Optimize Bundle Size".

Optimization steps:
1. Run npm run build:analyze (if configured)
2. Identify large chunks
3. Check tree-shaking (lucide-react)
4. Test each optimization
5. Measure after each change

Validation:
npm run build
Check dist/assets/index-*.js is < 60 kB gzipped
Verify npm test still passes
No performance regressions
```

---

## What NOT to Do

### ✗ Vague Goals
```
/goal improve code quality
/goal make it better
/goal test it
```
(Codex will guess, make mistakes, fake completion)

### ✗ Ignoring Validation
```
/goal add tests
"Tests pass, done!"
(No coverage check, no edge cases, no thoroughness)
```

### ✗ Skipping Quality Gates
```
/goal fix errors
"Added @ts-ignore, errors gone!"
(Hides problems instead of fixing them)
```

### ✗ Large Vague Tasks
```
/goal refactor everything
(Codex will touch too many files, lose consistency)
```

---

## The Secret Sauce

The three documents work together:

1. **CODEX_IMPROVEMENT_CHECKLIST.md** = WHAT to improve (500+ items)
2. **CODEX_QUALITY_PROTOCOL.md** = HOW to validate (process & gates)
3. **CODEX_QUICK_REFERENCE.md** = HOW to execute (tactical checklists)

When you give Codex a goal, reference the appropriate sections:
- "Use section X from CODEX_IMPROVEMENT_CHECKLIST"
- "Follow CODEX_QUALITY_PROTOCOL stages 1-3"
- "Reference CODEX_QUICK_REFERENCE for patterns"

Then Codex has:
✓ Clear requirements (checklist)
✓ Clear process (protocol)
✓ Clear tactics (quick reference)
✓ Clear success metrics (validation gates)

No room for cutting corners. No way to fake completion.

---

## If Codex Still Cuts Corners

If Codex says "Done!" but you're not confident:

**Ask to see:**
```
Before I accept this as complete, show me:

1. Full npm test output (all tests passing, count)
2. Full npm test:coverage output (coverage % for each file)
3. Full npm run type-check output (0 errors)
4. Full npm run build output (successful, no warnings)
5. List of all code changes made
6. Before/after metrics (coverage, bundle size, performance)
7. Manual testing results (if UI changed)
```

If Codex can't show all of these with numbers, it's not done.

---

## Checklist: Setting Up for Success

Before your first `/goal` with Codex:

- [ ] Copy all three documents to the project directory
- [ ] Read them yourself once (10-15 min total)
- [ ] When giving Codex a goal, reference the right section
- [ ] Include acceptance criteria explicitly
- [ ] Ask for validation results before accepting

That's it. You now have a quality assurance system for Codex.

---

## Final Thought

These documents exist because:
1. Codex is powerful but can cut corners
2. Quality requires process, not just code
3. "Done" needs a clear definition
4. Validation needs to be explicit

Use them consistently, and your Vent 2D Simulator will be:
- ✓ Well-tested (80%+ coverage)
- ✓ Type-safe (0 TypeScript errors)
- ✓ Performant (< 60 kB, < 16ms renders)
- ✓ Accessible (WCAG 2.1 AA)
- ✓ Well-documented (architecture, code, deployment)
- ✓ Production-ready

Good luck! 🚀

