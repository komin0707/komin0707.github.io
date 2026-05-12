# Codex Quality Assurance Protocol for Vent 2D Simulator

> **For Codex:** This document explains how to properly execute `/goal` commands and quality gates to prevent superficial completion. Read this before marking ANY task as complete.

---

## THE PROBLEM (Why This Document Exists)

When Codex runs `/goal` or Ralph (Ralphinho), it sometimes:
1. ✗ Runs tests and sees green → marks complete
2. ✗ Makes minor UI tweaks → marks complete
3. ✗ Adds a TODO comment → marks complete
4. ✗ Doesn't actually validate the implementation quality
5. ✗ Misses edge cases and regressions
6. ✗ Leaves technical debt behind

**This protocol prevents that.**

---

## THE SOLUTION: Multi-Stage Quality Validation

### Stage 1: Requirements Understanding (Before Implementation)
**Codex MUST do:**
- [ ] Read `CODEX_IMPROVEMENT_CHECKLIST.md` fully (this file)
- [ ] Identify which section(s) apply to the `/goal` task
- [ ] Break down the task into testable sub-goals
- [ ] List acceptance criteria explicitly
- [ ] Identify potential edge cases

**Example - DO THIS:**
```
/goal Add 80% test coverage

REQUIREMENTS ANALYSIS:
- Current coverage: ~10% (144 lines / 1460 lines)
- Target: 80%
- Missing tests:
  - ventilatorModel.ts: 5 tests exist → need 30+ more
  - Components: 0 unit tests → need 40+ tests
  - E2E flows: 0 tests → need 5+ critical paths

ACCEPTANCE CRITERIA:
- npm test runs and passes all tests
- npm run test:coverage shows >= 80%
- Coverage report shows coverage in: src/simulation/, src/components/
- All test files follow AAA pattern
- No @ts-ignore or any in test files
```

**Example - DON'T DO THIS:**
```
/goal Add tests

[Codex runs npm test, sees it passes once, marks complete]
```

### Stage 2: Implementation with Checkpoints
**Codex MUST:**
- [ ] Implement incrementally
- [ ] Add tests FIRST, then implementation (TDD)
- [ ] Run `npm run type-check` after each file edit
- [ ] Run tests after each logical step
- [ ] Never commit unresolved TS errors
- [ ] Never skip a test failure

**Example - CORRECT FLOW:**
```
1. Write failing test for calculateVitals() with AC mode
2. Run: npm test → test fails (RED)
3. Implement minimal code to pass test
4. Run: npm test → test passes (GREEN)
5. Refactor code for readability
6. Run: npm test → test still passes (IMPROVE)
7. Repeat for next test case
```

**Example - WRONG FLOW:**
```
1. npm test
2. See 2 failures
3. Comment out failing tests
4. npm test passes
5. Mark as "fixed"
```

### Stage 3: Validation Before "Complete"

**Codex MUST run all these checks before marking ANYTHING as complete:**

#### 3.1 Type Checking
```bash
npm run type-check
# Must show: ✓ No errors
# Must not show: @ts-ignore, any, or type: any warnings
```

#### 3.2 Linting (After Setup)
```bash
npm run lint
# After eslint is configured, must pass
```

#### 3.3 Testing
```bash
npm test
# Must show:
# - ✓ All tests passing
# - Coverage >= target threshold
# - No .skip() or .todo() left in code
```

#### 3.4 Build Validation
```bash
npm run build
# Must show:
# - ✓ Successful build
# - dist/ directory created
# - No warnings (some warnings OK, but none related to your changes)
```

#### 3.5 Performance Check (Bundle Size)
```bash
# After build, check dist size:
# - dist/assets/index-*.js size
# - Should not increase > 5 kB from previous
# - If it does, investigate why
```

#### 3.6 Code Review
```bash
# For PRs or significant changes:
# - Read your own code once more
# - Look for any FIXME, TODO, XXX comments you added
# - Check for console.log statements
# - Verify no commented-out code blocks
```

---

## SPECIFIC VALIDATION FOR COMMON TASKS

### Task: "Add 80% Test Coverage"
✓ **CORRECT** validation would be:
```bash
1. npm test -- --coverage
2. Look for coverage summary:
   Statements: 80%+
   Branches: 80%+
   Functions: 80%+
   Lines: 80%+
3. Verify coverage/index.html shows coverage map
4. Spot-check: Open coverage HTML and verify:
   - Red lines indicate uncovered code
   - Green lines are covered
   - No untested critical paths
5. Run specific test file: npm test src/simulation/ventilatorModel.test.ts
6. Verify all test names describe behavior, not just "works"
7. Check for @ts-ignore or any in test files (should be none)
```

✗ **INCORRECT** would be:
```bash
npm test
# 2 tests pass
"Done! 80% coverage achieved."
```

### Task: "Reduce Bundle Size from 71 kB to 60 kB"
✓ **CORRECT** validation:
```bash
1. npm run build
2. Check dist/assets/index-*.js file size (gzipped)
3. If > 60 kB, run build analyzer:
   npm run build:analyze
4. Identify largest imports:
   - Is lucide-react fully tree-shaken?
   - Are unused components included?
   - Is React in production mode?
5. For each optimization:
   a. Apply change
   b. npm run build
   c. Measure new size
   d. If it increased, revert
6. Final check: size is < 60 kB gzipped
7. Performance check: npm run build still succeeds
```

✗ **INCORRECT** would be:
```bash
npm run build
# dist/assets/index-*.js is 70 kB
"Close enough, marking as complete"
```

### Task: "Fix Type Safety Issues"
✓ **CORRECT** validation:
```bash
1. npm run type-check
2. Verify output shows:
   No errors detected
   0 errors, 0 warnings
3. Edit tsconfig.json to enable strict options:
   - noImplicitAny: true
   - noUnusedLocals: true
   - noUnusedParameters: true
4. Re-run: npm run type-check
5. Fix all new errors (should be none if code is correct)
6. Spot-check files for any:
   - @ts-ignore comments (bad!)
   - 'any' type (should use unknown + narrowing)
   - Implicit any types (should be explicit)
7. Verify: npm run type-check shows no errors/warnings
```

✗ **INCORRECT** would be:
```bash
1 error: Type 'unknown' is not assignable to type 'string'
"Hmm, let's add @ts-ignore for now"
```

### Task: "Fix All Accessibility Issues"
✓ **CORRECT** validation:
```bash
1. npm run build
2. Open dist/index.html in browser
3. Run axe DevTools scan (Chrome extension)
4. Verify results:
   ✓ 0 Critical issues
   ✓ 0 Serious issues
   ✓ 0 Moderate issues (preferably)
5. Test keyboard navigation:
   a. Tab through all interactive elements
   b. Verify visible focus indicators
   c. Verify logical tab order
6. Test with screen reader (NVDA on Windows, VoiceOver on Mac):
   a. All important content is announced
   b. Button purposes are clear
   c. Alarms are announced when they fire
7. Test color contrast:
   a. Every text/bg combination
   b. Use WebAIM contrast checker
   c. All should be >= 4.5:1 for AA compliance
```

✗ **INCORRECT** would be:
```bash
npm run build
"Looks good, marking complete"
```

---

## RED FLAGS (Things That Mean: "NOT DONE")

If you see ANY of these, the task is **not complete**:

### Code Quality Red Flags
- [ ] `@ts-ignore` anywhere in code
- [ ] `any` type (except unknownWithNarrowing)
- [ ] `console.log` in production code
- [ ] `console.error` without try/catch
- [ ] `// TODO` or `// FIXME` comments you added
- [ ] Commented-out code blocks
- [ ] Functions > 50 lines
- [ ] Files > 800 lines
- [ ] Deep nesting (> 4 levels)
- [ ] Duplicate code (copy/paste)

### Testing Red Flags
- [ ] `.skip()` on any test
- [ ] `.todo()` on any test
- [ ] Test that sometimes passes, sometimes fails (flaky)
- [ ] Test with `setTimeout` (use fake timers)
- [ ] Coverage < target threshold
- [ ] Test file name doesn't match pattern `*.test.ts` or `*.spec.ts`
- [ ] Test descriptions don't describe behavior

### Performance Red Flags
- [ ] Bundle size increased from previous
- [ ] Build time increased significantly (> 5 seconds)
- [ ] TypeScript type-check takes > 10 seconds
- [ ] No performance benchmarks provided
- [ ] Memory profile shows growth over time (memory leak)

### Security Red Flags
- [ ] Hardcoded API keys or secrets
- [ ] User input not validated
- [ ] SQL injection possible (not applicable here, but still check DB calls)
- [ ] XSS vulnerabilities (`dangerouslySetInnerHTML` without sanitization)
- [ ] No CORS headers configured (if API)

### Accessibility Red Flags
- [ ] Axe DevTools shows any issues
- [ ] Tab navigation skips elements
- [ ] No focus visible on interactive elements
- [ ] Color-only feedback (no text alternative)
- [ ] Prefers-reduced-motion not respected
- [ ] Images without alt text (SVG without aria-label)
- [ ] Low contrast text (< 4.5:1)

### Build Red Flags
- [ ] `npm run build` fails
- [ ] `npm test` fails
- [ ] `npm run type-check` shows errors
- [ ] dist/ directory missing files
- [ ] Source maps not generated
- [ ] Unminified code in production

---

## EXHAUSTIVENESS CHECKLIST

Before calling a task "complete," ask yourself:

### Coverage Questions
- [ ] Did I test happy path? (success case)
- [ ] Did I test error cases? (failures)
- [ ] Did I test edge cases? (min/max values, null, undefined)
- [ ] Did I test boundary conditions? (0, -1, MAX_INT)
- [ ] Did I test with multiple scenarios?
- [ ] Did I test different browser environments?
- [ ] Did I test accessibility features?
- [ ] Did I test performance under load?

### Implementation Questions
- [ ] Is the code immutable (no mutations)?
- [ ] Are all inputs validated?
- [ ] Are all errors handled?
- [ ] Is the code readable (good naming)?
- [ ] Are there any security issues?
- [ ] Is it performant (< 16ms render)?
- [ ] Is it accessible (WCAG 2.1 AA)?
- [ ] Is it type-safe (no any)?

### Testing Questions
- [ ] Do test names describe behavior?
- [ ] Is each test < 10 lines?
- [ ] Are tests independent (no ordering)?
- [ ] Do tests follow AAA pattern (Arrange/Act/Assert)?
- [ ] Are mocks used sparingly?
- [ ] Are there integration tests?
- [ ] Are there E2E tests?
- [ ] Is coverage > target?

---

## RUNNING `/goal` CORRECTLY

### Pattern 1: Small, Focused Task
```
/goal Add unit tests for calculateVitals function

Before running:
✓ Read acceptance criteria (80+ lines of meaningful tests)
✓ Plan test cases (all modes, all edge cases)
✓ Write test file first
✓ Watch tests fail (RED)
✓ Implement function to pass tests (GREEN)
✓ Verify npm test passes
✓ Verify npm run type-check passes
✓ Verify coverage increased
✓ Manual code review
```

### Pattern 2: Medium, Architectural Task
```
/goal Extract useSimulation custom hook from App.tsx

Before running:
✓ Plan what state/logic to extract
✓ Write tests for hook behavior first
✓ Implement hook
✓ Update App.tsx to use hook
✓ Verify tests pass
✓ Verify React DevTools shows hook hierarchy
✓ Verify no prop drilling
✓ Performance profile (no regressions)
✓ Manual review
```

### Pattern 3: Large, Multi-File Task
```
/goal Implement Context API for state management

Before running:
✓ Design context shape
✓ Write tests for context (initial state, updates)
✓ Implement provider component
✓ Test all consumers
✓ Verify no circular dependencies
✓ Performance check (context updates)
✓ Accessibility check (no ARIA issues from refactor)
✓ Component tests updated
✓ Integration tests passing
✓ Bundle size check
✓ Type check
✓ Full code review
```

---

## THE FINAL GATE: "DONE" Doesn't Mean "Code Exists"

**"Done" means:**
- ✓ Code is type-safe (npm run type-check: 0 errors)
- ✓ Tests pass (npm test: all passing)
- ✓ Coverage meets target (npm test:coverage: >= 80%)
- ✓ Build succeeds (npm run build: successful)
- ✓ Bundle size is acceptable (no regressions)
- ✓ Performance is good (< 16ms render)
- ✓ Accessibility is verified (axe DevTools: 0 issues)
- ✓ Code is readable (no TODO, no commented code)
- ✓ Documentation is updated (if applicable)
- ✓ Edge cases are handled (not just happy path)
- ✓ Manual testing confirms behavior works
- ✓ Security is verified (no hardcoded secrets)

**"Done" does NOT mean:**
- ✗ Code exists (but might not work)
- ✗ Tests exist (but might be meaningless)
- ✗ Npm test passes (but on only one scenario)
- ✗ Build succeeds (but has warnings)
- ✗ No TypeScript errors (but has @ts-ignore)
- ✗ Visually looks right (but has accessibility issues)
- ✗ Works on my machine (but untested everywhere else)

---

## EXAMPLE: Good vs Bad Completion

### ✗ Bad: "I ran npm test and it passed"
```
Codex: "Tests are passing, marking as complete"
User: "But where are the tests? What do they test?"
Codex: *silence*
Reality: Only 2 tests exist, both are smoke tests
```

### ✓ Good: "Here's what I did"
```
Codex: "Added 45 new unit tests for ventilatorModel.ts
Coverage summary:
- src/simulation/ventilatorModel.ts: 87% (was 12%)
- src/simulation/waveformGenerator.ts: 82% (was 15%)
- src/components/PatientAvatar2D.tsx: 91% (was 0%)

Validation:
✓ npm test: 127 tests passing
✓ npm run type-check: 0 errors
✓ npm run build: successful
✓ Bundle size: 71.2 kB (no regression)
✓ Code review: all red flags addressed

Edge cases tested:
- All ventilation modes (AC, VC, PC, PSV, CPAP)
- All scenarios (normal, pneumonia, ARDS, obstruction, pneumothorax)
- Boundary values (PEEP 0-25, Vt 200-1200, RR 4-100)
- Null/undefined handling
- NaN/Infinity guards

I'm confident this is production-ready."
```

---

## CONCLUSION

**This protocol ensures Codex doesn't fake completion.**

Before marking done:
1. Read the relevant section of CODEX_IMPROVEMENT_CHECKLIST.md
2. Break task into testable sub-goals
3. Implement TDD (test first)
4. Run all validation checks (type-check, test, build, perf)
5. Do manual review
6. Report results explicitly

If any step fails, the task is **NOT DONE**. Fix it and re-run validation.

**No shortcuts. No `/goal` magic. Just solid engineering.**

