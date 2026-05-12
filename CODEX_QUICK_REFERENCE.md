# Codex Quick Reference: Common Tasks & Validation Steps

> **TL;DR version** of CODEX_QUALITY_PROTOCOL.md — Use this when running specific goals.

---

## Before ANY Goal: Sanity Check
```bash
# Run these 3 commands. If ANY fail, the goal is not ready:
npm run type-check    # Must show: 0 errors
npm test              # Must show: all tests passing
npm run build         # Must show: successful build
```

---

## Task: Add Unit Tests

### Quick Checklist
- [ ] Test file follows naming: `*.test.ts` or `*.spec.ts`
- [ ] Each test has descriptive name: `test('should return X when Y')`
- [ ] Tests follow AAA pattern:
  ```typescript
  test('calculates vitals correctly', () => {
    // Arrange: set up test data
    const settings = { ... }
    
    // Act: call the function
    const vitals = calculateVitals(settings, scenario)
    
    // Assert: verify result
    expect(vitals.spo2).toBe(98)
  })
  ```
- [ ] No `.skip()` or `.todo()` left in code
- [ ] Test coverage increases from previous (check `npm test:coverage`)

### Validation
```bash
npm test -- --coverage
# Must show: Lines >= 80%, Branches >= 80%, Functions >= 80%
```

### Red Flags
- ✗ Using `setTimeout` without `vi.useFakeTimers()`
- ✗ Tests that sometimes pass, sometimes fail (flaky)
- ✗ Test with hardcoded magic numbers (use constants/factories)
- ✗ Mocking everything (mock sparingly, test reality)

---

## Task: Fix TypeScript Errors

### Quick Checklist
- [ ] Run `npm run type-check` and read EVERY error
- [ ] Don't use `@ts-ignore` (fix the actual issue)
- [ ] Don't use `any` type (use `unknown` + type narrowing)
- [ ] Add explicit return types to functions
- [ ] Add explicit parameter types

### Common Fixes
```typescript
// ✗ WRONG
function getValue(x: any): any { ... }

// ✓ CORRECT
function getValue(x: VentSettings): DerivedVitals { ... }

// ✗ WRONG
const data: any = await fetch(...)

// ✓ CORRECT
const data: unknown = await fetch(...)
if (typeof data === 'object' && data !== null && 'vitals' in data) {
  // Now it's type-safe
}
```

### Validation
```bash
npm run type-check
# Must show: 0 errors, 0 warnings
# Grep for @ts-ignore (should be zero)
grep -r "@ts-ignore" src/
```

---

## Task: Optimize Bundle Size

### Quick Checklist
- [ ] Identify what's in bundle: `npm run build:analyze`
- [ ] Check for duplicate dependencies
- [ ] Verify tree-shaking (only imported code included)
- [ ] Check React is in production mode
- [ ] Remove unused imports
- [ ] Lazy load heavy components (if needed)

### Validation
```bash
npm run build
# Check dist/assets/index-*.js size
# Current: 71.49 kB gzipped
# Target: < 60 kB gzipped
# Delta per change: < 5 kB

# If over budget, identify what changed:
git diff dist/  # (if in git)
# Or just check what got added/modified
```

### Red Flags
- ✗ Bundle increased > 5 kB from previous
- ✗ Same code included twice
- ✗ Minification didn't work
- ✗ Source maps in production build

---

## Task: Improve Performance

### Quick Checklist
- [ ] Wrap expensive components in `React.memo()`
- [ ] Move calculations to `useMemo()`
- [ ] Move callbacks to `useCallback()`
- [ ] Verify no render on every keystroke
- [ ] Check DevTools Profiler for slow renders

### Validation
```bash
# Open dist/index.html in browser
# DevTools > Performance > Record > Interact > Stop
# Look for:
# - Green (good) rendering < 16ms
# - Red (bad) rendering > 16ms
# Target: 60 FPS (16.67ms per frame)

# Also check:
# - Memory tab: heap size stable over time (no leaks)
# - Network tab: only loads once (caching works)
```

### Red Flags
- ✗ Rendering takes > 50ms
- ✗ Memory grows over time (memory leak)
- ✗ Many small re-renders instead of batched
- ✗ useEffect dependency array is empty `[]` but reads state

---

## Task: Fix Accessibility Issues

### Quick Checklist
- [ ] Install axe DevTools Chrome extension
- [ ] Open app in browser
- [ ] Run axe DevTools scan
- [ ] Fix all "Critical" and "Serious" issues
- [ ] Test keyboard navigation (Tab through interface)
- [ ] Test color contrast (WebAIM checker)

### Common Fixes
```typescript
// ✗ WRONG (no label for slider)
<input type="range" min="0" max="100" />

// ✓ CORRECT
<label htmlFor="fio2-slider">FiO2</label>
<input id="fio2-slider" type="range" aria-label="FiO2 percentage" />

// ✗ WRONG (icon with no text)
<button><PauseIcon /></button>

// ✓ CORRECT
<button aria-label="Pause simulation">
  <PauseIcon aria-hidden="true" />
</button>

// ✗ WRONG (color only feedback)
<div style={{ color: vitals.spo2 < 90 ? 'red' : 'green' }}>Critical</div>

// ✓ CORRECT
<div style={{ color: vitals.spo2 < 90 ? 'red' : 'green' }}>
  {vitals.spo2 < 90 ? '🔴 Critical' : '🟢 Normal'} SpO2
</div>
```

### Validation
```bash
npm run build
# Open dist/index.html in browser
# Chrome > DevTools > Extensions > axe DevTools
# Click "Scan this page"
# Should show: 0 Critical, 0 Serious issues

# Test keyboard:
# Tab through all buttons/sliders
# All should have visible focus
# Logical tab order
```

### Red Flags
- ✗ Axe DevTools shows Critical/Serious issues
- ✗ Focus outline missing (add outline: 2px solid #1689ff)
- ✗ Contrast < 4.5:1 (AA standard)
- ✗ SVG/Canvas without aria-label

---

## Task: Add Component Tests

### Quick Checklist
- [ ] Test renders without crashing
- [ ] Test props cause expected output
- [ ] Test user interactions (click, drag slider)
- [ ] Test callbacks are called correctly
- [ ] Test edge cases (props are null, undefined, extreme values)

### Example Component Test
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SliderControl } from './SliderControl'

describe('SliderControl', () => {
  it('renders with label and current value', () => {
    render(<SliderControl label="FiO2" min={21} max={100} value={40} onChange={() => {}} />)
    
    expect(screen.getByText('FiO2')).toBeInTheDocument()
    expect(screen.getByDisplayValue('40')).toBeInTheDocument()
  })

  it('calls onChange when slider changes', async () => {
    const onChange = vi.fn()
    render(<SliderControl label="FiO2" min={21} max={100} value={40} onChange={onChange} />)
    
    const slider = screen.getByRole('slider')
    await userEvent.type(slider, '{ArrowRight}')
    
    expect(onChange).toHaveBeenCalled()
  })

  it('enforces min/max bounds', async () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <SliderControl label="FiO2" min={21} max={100} value={21} onChange={onChange} />
    )
    
    const slider = screen.getByRole('slider')
    await userEvent.type(slider, '{ArrowLeft}{ArrowLeft}{ArrowLeft}')
    
    // Should not go below 21
    expect(onChange).toHaveBeenCalledWith(expect.any(Number))
    expect(onChange.mock.calls[0][0]).toBeGreaterThanOrEqual(21)
  })
})
```

### Validation
```bash
npm test -- SliderControl.test.ts
# Should pass all tests

# Check coverage:
npm test -- --coverage SliderControl.test.ts
# Lines coverage should be >= 80%
```

---

## Task: Reduce Component Size

### Quick Checklist
- [ ] Files > 300 lines should be split
- [ ] Functions > 50 lines should be extracted
- [ ] Nesting > 4 levels should be flattened
- [ ] Extract sub-components
- [ ] Extract helper functions

### Example: Split PatientAvatar2D
```typescript
// BEFORE: 173 lines all in one component
export function PatientAvatar2D({ ... }) {
  return <svg>...</svg>
}

// AFTER: Split into sub-components
export function PatientAvatar2D({ ... }) {
  return (
    <div className="patient-avatar">
      <PatientHead visualState={visualState} />
      <PatientBody visualState={visualState} vitals={vitals} />
      <PatientLungs visualState={visualState} />
      <IntubationTube visualState={visualState} />
    </div>
  )
}

// New files:
// - PatientHead.tsx (40 lines)
// - PatientBody.tsx (50 lines)
// - PatientLungs.tsx (45 lines)
// - IntubationTube.tsx (30 lines)
// Main: 25 lines
```

### Validation
```bash
# Check line counts
find src/components -name "*.tsx" | xargs wc -l
# Should see: most files < 100 lines

# Check function sizes
grep -E "^(export )?function " src/**/*.tsx | ...
# Should see: most functions < 50 lines
```

---

## Task: Create Test Infrastructure

### Quick Checklist
- [ ] Create `vitest.config.ts`
- [ ] Create `src/test/setup.ts`
- [ ] Create `src/test/render.tsx` (custom React render)
- [ ] Create `src/test/factories.ts` (test data builders)
- [ ] Add to package.json scripts:
  ```json
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
  ```

### vitest.config.ts Template
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
})
```

### Validation
```bash
npm test
# Should run vitest

npm test:coverage
# Should generate coverage report
# Open coverage/index.html in browser
```

---

## Task: Fix Build Warnings

### Quick Checklist
- [ ] Run `npm run build` and read warnings
- [ ] Fix all warnings (not just errors)
- [ ] Check for unused imports
- [ ] Check for deprecated APIs
- [ ] Verify no console warnings in output

### Common Warnings & Fixes
```typescript
// ✗ Warning: React.FC is deprecated
export const MyComponent: React.FC<Props> = ({ ... }) => { ... }

// ✓ Fixed
interface MyComponentProps { ... }
export function MyComponent({ ... }: MyComponentProps) { ... }

// ✗ Warning: Unused import
import { useState } from 'react'
// ... (useState not used)

// ✓ Fixed
// Remove the import

// ✗ Warning: Missing dependency
useEffect(() => {
  setData(props.value)
}, [])  // ← props.value missing!

// ✓ Fixed
useEffect(() => {
  setData(props.value)
}, [props.value])
```

### Validation
```bash
npm run build
# Should show: ✓ built in X.XXs
# No warnings about your changed files
```

---

## Task: Update Documentation

### Quick Checklist
- [ ] Docs files are in `docs/` or `docs/superpowers/`
- [ ] Markdown is well-formatted
- [ ] Code examples are accurate
- [ ] Links are working
- [ ] Table of contents is updated

### Validation
```bash
# Check for broken links (if you have a link checker)
# Read the docs yourself: does it make sense?
# Try following the steps: do they work?
```

---

## Emergency Debugging

### "Tests are failing, I don't know why"
```bash
# 1. Run single test file in verbose mode
npm test -- src/simulation/ventilatorModel.test.ts --reporter=verbose

# 2. Check if it's a type issue
npm run type-check

# 3. Look at the actual test output for detailed error message
# 4. Add console.log to understand what's happening (remove after)

# 5. Run with debugging
npm test -- --inspect
# Then open chrome://inspect
```

### "Build is failing"
```bash
# 1. Check TypeScript
npm run type-check

# 2. Check for console.error
npm run build

# 3. Check for missing dependencies
npm install
npm run build

# 4. Check for syntax errors
npm run build 2>&1 | head -30  # First 30 lines of error

# 5. Nuclear option
rm -rf node_modules dist
npm install
npm run build
```

### "Performance is bad"
```bash
# 1. Open DevTools Performance tab
# 2. Record user interaction
# 3. Look for red (slow) renders
# 4. Click on slow frame
# 5. Check which component took time
# 6. Add React.memo() or useMemo()
# 7. Repeat
```

---

## Final Reminder

**Before marking any task complete:**

```bash
npm run type-check && npm test && npm run build
```

All three must pass. If any one fails, keep working.

No exceptions. No shortcuts. That's the rule.

