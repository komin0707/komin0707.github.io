# Vent 2D Simulator — Comprehensive Improvement & Quality Assurance Checklist

> **WARNING TO CODEX:** This document details 500+ specific quality issues, improvement opportunities, and validation criteria. **DO NOT mark items as complete without actually implementing and testing them.** The `/goal` command should use this checklist to ensure comprehensive improvements, not just cosmetic changes.

---

## PART 1: CRITICAL BUILD & DEPLOYMENT ISSUES

### 1.1 Build Configuration & Optimization
- [ ] **Vite Config**: Current `vite.config.ts` is bare. Add configuration for:
  - [ ] Asset compression (image optimization, PNG/SVG minification)
  - [ ] Code splitting strategy for chunks > 100KB
  - [ ] Environment-specific builds (dev/staging/prod)
  - [ ] Source map generation for production debugging
  - [ ] CSS extraction and minification settings
  - [ ] Rollup output options for chunk sizing
  - [ ] Tree-shaking verification and dead code elimination
  - [ ] Banner comments on built files
  - [ ] Hash-based asset names for cache busting

### 1.2 TypeScript Configuration
- [ ] **tsconfig.json** missing critical options:
  - [ ] Add `declarationMap: true` for source map debugging
  - [ ] Add `declarationDir: "./dist"` for type definitions
  - [ ] Add `outDir: "./dist"` explicitly
  - [ ] Add `baseUrl: "."` for absolute imports
  - [ ] Add `paths` configuration for module aliases (e.g., `@/*`)
  - [ ] Add `noUnusedLocals: true` to catch dead code
  - [ ] Add `noUnusedParameters: true`
  - [ ] Add `noImplicitReturns: true`
  - [ ] Add `noFallthroughCasesInSwitch: true`
  - [ ] Add `exactOptionalPropertyTypes: true` (TypeScript 4.4+)
  - [ ] Set `moduleResolution: "bundler"` explicitly verified
  - [ ] Add `verbatimModuleSyntax: true` for ESM compatibility

### 1.3 Package.json & Dependencies
- [ ] **Script Gaps**:
  - [ ] Add `lint` script (ESLint)
  - [ ] Add `type-check` script for CI/CD
  - [ ] Add `test:watch` for development
  - [ ] Add `test:coverage` for coverage reports
  - [ ] Add `format` script (Prettier)
  - [ ] Add `format:check` for CI
  - [ ] Add `build:analyze` for bundle analysis
  - [ ] Add `preview` doesn't have `--port` specified
  - [ ] Add `clean` script to remove dist/
  - [ ] Add `prebuild` hook to clean old artifacts

- [ ] **Dev Dependency Gaps**:
  - [ ] No ESLint (@eslint/js, eslint-plugin-react, etc.)
  - [ ] No Prettier (code formatter)
  - [ ] No @testing-library/react (component testing)
  - [ ] No @testing-library/user-event (user interaction testing)
  - [ ] No @vitest/ui (test UI dashboard)
  - [ ] No vitest-canvas-mock (Canvas testing for charts)
  - [ ] No @vitest/coverage-v8 or @vitest/coverage-c8
  - [ ] No @types/node (for build scripts)
  - [ ] No bundle-analyzer (for build size analysis)
  - [ ] No dotenv (environment variable loading)
  - [ ] No zod (schema validation)

- [ ] **Production Dependencies**:
  - [ ] No error boundary library (React 18 compatible)
  - [ ] No logging library (production logs)
  - [ ] No state management (Zustand, Jotai, or Context proper setup)
  - [ ] No HTTP client (fetch wrapper, SWR, TanStack Query)
  - [ ] No accessibility checking library

### 1.4 Environment & Configuration
- [ ] **Missing .env files**:
  - [ ] No `.env` (local development)
  - [ ] No `.env.example` (documentation)
  - [ ] No `.env.production` (production config)
  - [ ] No environment variable loading in `src/main.tsx`
  - [ ] No validation that required env vars exist at startup

- [ ] **Missing Config Files**:
  - [ ] No `.eslintrc.json` or `.eslintrc.cjs`
  - [ ] No `.prettierrc` or `prettier.config.js`
  - [ ] No `.prettierignore`
  - [ ] No `vitest.config.ts` (test runner config)
  - [ ] No `playwright.config.ts` (E2E config)
  - [ ] No `.editorconfig`
  - [ ] No `.nvmrc` (Node version pinning)

---

## PART 2: TYPE SAFETY & STRICTNESS ISSUES

### 2.1 Type Definitions
- [ ] **Component Props Missing Explicit Types**:
  - [ ] `Header.tsx`: Verify all props typed
  - [ ] `SettingsPanel.tsx`: Check `onChange` callback signature is strict
  - [ ] `MonitorPanel.tsx`: Ensure all props have explicit types
  - [ ] `PatientConditionPanel.tsx`: Verify vitals passed with full type
  - [ ] `SliderControl.tsx`: Ensure value type is `number` strictly
  - [ ] `WaveformChart.tsx`: Check array types for waveform data
  - [ ] `AlarmPanel.tsx`: Verify Alarm[] is properly typed
  - [ ] All component props should have `Readonly<>` modifier

- [ ] **Simulation Logic Type Safety**:
  - [ ] `ventilatorModel.ts`: Add explicit return types to all exported functions
  - [ ] Add parameter type validation in `calculateVitals`
  - [ ] Add return type to `clamp` function (should be `number`)
  - [ ] Check `calculateSimulation` handles all scenario types
  - [ ] Add type guards for VentMode string literals
  - [ ] Add type guards for ScenarioType string literals
  - [ ] Verify all array indexing is bounds-checked
  - [ ] Add strict null checks for optional scenario properties

- [ ] **Waveform Generator Types**:
  - [ ] `waveformGenerator.ts`: Verify all functions have explicit types
  - [ ] Check array return types are typed with generics
  - [ ] Ensure time/frequency parameters are typed as `number`
  - [ ] Verify phase calculations have type guards

### 2.2 Type Inference Issues
- [ ] **Any Types Detection**:
  - [ ] Grep codebase for explicit `any` types (should be zero)
  - [ ] Replace any `any` with `unknown` + type narrowing
  - [ ] Add `noImplicitAny: true` to tsconfig and verify passes

- [ ] **Union Type Handling**:
  - [ ] Ensure all `PatientCondition` type switches are exhaustive
  - [ ] Ensure all `VentMode` type switches are exhaustive
  - [ ] Ensure all `ScenarioType` type switches are exhaustive
  - [ ] Add TypeScript exhaustiveness checks with `never` type

---

## PART 3: TEST COVERAGE & QUALITY

### 3.1 Current Test Status
- [ ] **Existing Tests Analysis**:
  - [ ] `ventilatorModel.test.ts`: 73 lines — verify all assertions are meaningful
  - [ ] `waveformGenerator.test.ts`: 61 lines — check coverage
  - [ ] `BottomBar.test.ts`: 10 lines — **CRITICALLY INCOMPLETE**
  - [ ] Total: 144 lines of test code for 1460 lines of source code
  - [ ] **Test coverage is ~10%** — Target is 80%

### 3.2 Unit Tests Required (80% Coverage Target)
- [ ] **ventilatorModel.ts** (353 lines):
  - [ ] `calculateVitals()`: Test all ventilation modes (AC, VC, PC, PSV, CPAP)
  - [ ] Test compliance calculations with edge cases:
    - [ ] recruitment = 0, overdistension = 0
    - [ ] recruitment max at peep=15
    - [ ] overdistension max at peep=20+
  - [ ] Test resistance changes with secretion levels
  - [ ] Test PaO2/PaCO2 calculations for all scenarios
  - [ ] Test pH calculations with edge cases
  - [ ] Test ETco2 with different minute ventilation rates
  - [ ] Test alarm generation for all alarm types (10+ alarm conditions)
  - [ ] Test patient condition determination (stable/watch/worsening/critical)
  - [ ] Test visual state calculations (expression, skin tone, chest motion)
  - [ ] Test edge cases: extreme PEEP, extreme Vt, negative trigger
  - [ ] Test boundary conditions: vte out of physiologic range
  - [ ] Test secretion effects on resistance
  - [ ] Test pneumothorax leak simulation
  - [ ] Test airway obstruction pressure response
  - [ ] Test ARDS shunt effects
  - [ ] Test normal scenario baseline

- [ ] **waveformGenerator.ts** (86 lines):
  - [ ] `generatePressureWaveform()`: Various VentModes
  - [ ] `generateFlowWaveform()`: Peak flow detection
  - [ ] `generateVolumeWaveform()`: Integral accuracy
  - [ ] Test with extreme settings (high RR, low RR, high Vt)
  - [ ] Test time array generation accuracy
  - [ ] Test sine wave amplitude and frequency

- [ ] **scenarios.ts** (108 lines):
  - [ ] All 5 scenario definitions have correct baseline values
  - [ ] Scenario compliance ranges are physiologically realistic
  - [ ] Scenario descriptions are accurate

- [ ] **App.tsx** (92 lines):
  - [ ] Settings state updates correctly
  - [ ] Scenario changes reset settings appropriately
  - [ ] Pause/resume timer works correctly
  - [ ] Elapsed time increments every second
  - [ ] Reset button clears all state

- [ ] **Components Unit Tests**:
  - [ ] `Header.tsx`: Mode change callback fires correctly
  - [ ] `SettingsPanel.tsx`: Slider changes update state
  - [ ] `SliderControl.tsx`: Min/max bounds are enforced
  - [ ] `MonitorPanel.tsx`: Paused state hides waveforms correctly
  - [ ] `WaveformChart.tsx`: Canvas renders correctly, axes labeled
  - [ ] `PatientAvatar2D.tsx`: SVG renders based on visual state
  - [ ] `AlarmPanel.tsx`: Alarms display with correct severity colors
  - [ ] `LungStatusPanel.tsx`: Status reflects vitals correctly
  - [ ] `PatientConditionPanel.tsx`: Description updates with condition

### 3.3 Integration Tests
- [ ] **Simulation Flow**:
  - [ ] Changing ventilator settings updates all derived vitals
  - [ ] Changing mode recalculates pressure curves
  - [ ] Changing scenario resets patient state
  - [ ] Visual feedback updates when vitals cross thresholds
  - [ ] Alarms fire before critical conditions occur
  - [ ] Patient expression changes with SpO2 levels

- [ ] **State Management**:
  - [ ] Settings changes don't mutate original state
  - [ ] Scenario changes don't affect other scenarios
  - [ ] Multiple rapid updates are batched correctly
  - [ ] State is immutable (no in-place mutations)

### 3.4 E2E Tests (Playwright)
- [ ] **Critical User Flows**:
  - [ ] User can select different ventilation modes
  - [ ] User can adjust sliders and see waveforms update
  - [ ] User can change scenarios and see patient avatar change
  - [ ] User can pause/resume simulation
  - [ ] User can reset to default settings
  - [ ] Alarms appear when vitals go critical
  - [ ] Patient avatar expression changes with patient condition
  - [ ] Waveforms are visible and updating in real-time
  - [ ] No TypeErrors in console during interaction
  - [ ] No memory leaks from setInterval handlers

### 3.5 Test Infrastructure
- [ ] **Vitest Configuration**:
  - [ ] Add `vitest.config.ts` with proper settings
  - [ ] Configure jsdom environment for DOM testing
  - [ ] Add coverage thresholds (80% min)
  - [ ] Add test timeout configuration
  - [ ] Enable watch mode for development

- [ ] **Test Utilities**:
  - [ ] Create `src/test/setup.ts` for global test configuration
  - [ ] Create `src/test/mocks.ts` for common mocks
  - [ ] Create `src/test/render.tsx` for custom React render
  - [ ] Add `src/test/querySelectors.ts` for data-testid helpers

---

## PART 4: COMPONENT ARCHITECTURE & ORGANIZATION

### 4.1 Component Structure Review
- [ ] **Top-Level Components**:
  - [ ] App.tsx is becoming too large (92 lines) — extract simulation logic
  - [ ] Extract `useSimulation` custom hook to `src/hooks/useSimulation.ts`
  - [ ] Extract `useVentilatorSettings` to `src/hooks/useVentilatorSettings.ts`

- [ ] **Missing Component Abstractions**:
  - [ ] `SliderControl.tsx` (44 lines) could be reused for all 7 sliders
  - [ ] `PatientConditionPanel.tsx` mixes display logic with data
  - [ ] Extract vitals display to separate component
  - [ ] Extract scenario description to separate component

- [ ] **Component File Organization**:
  - [ ] Create `src/components/panels/` subdirectory:
    - [ ] `SettingsPanel/`
    - [ ] `MonitorPanel/`
    - [ ] `AlarmPanel/`
    - [ ] `LungStatusPanel/`
  - [ ] Create `src/components/ui/` for reusable elements:
    - [ ] `SliderControl.tsx`
    - [ ] `Button.tsx` (if not using lucide)
    - [ ] `Label.tsx`
    - [ ] `Badge.tsx` (for alarm severity)
  - [ ] Create `src/components/patient/`:
    - [ ] `PatientAvatar2D.tsx`
    - [ ] `PatientConditionPanel.tsx`

### 4.2 Component Prop Drilling
- [ ] **Reduce Prop Drilling**:
  - [ ] Current vitals passed to: PatientConditionPanel, MonitorPanel, LungStatusPanel
  - [ ] Use Context API to provide vitals globally instead
  - [ ] Create `src/context/SimulationContext.tsx` for:
    - [ ] vitals
    - [ ] settings
    - [ ] condition
    - [ ] visualState
    - [ ] alarms
  - [ ] Remove 15+ manual prop passages

- [ ] **Callback Handlers**:
  - [ ] `updateSetting` callback passed through multiple levels
  - [ ] Move to context or custom hook

### 4.3 Component Size Optimization
- [ ] **PatientAvatar2D.tsx** (173 lines) is too large:
  - [ ] Extract SVG head to `PatientHead.tsx`
  - [ ] Extract SVG body to `PatientBody.tsx`
  - [ ] Extract SVG lungs to `PatientLungs.tsx`
  - [ ] Extract SVG breathing animation to `BreathingAnimation.tsx`
  - [ ] Extract tube/circuit to `IntubationTube.tsx`
  - [ ] Reduce to ~50 lines after extraction

- [ ] **ventilatorModel.ts** (353 lines) is too large:
  - [ ] Extract vitals calculations to `calculateVitals.ts`
  - [ ] Extract alarm logic to `generateAlarms.ts`
  - [ ] Extract patient condition logic to `evaluateCondition.ts`
  - [ ] Extract visual state logic to `calculateVisualState.ts`

---

## PART 5: PERFORMANCE & OPTIMIZATION

### 5.1 Bundle Size Analysis
- [ ] **Current Bundle**: 71.49 kB gzipped
  - [ ] Target: < 60 kB gzipped for simulator app
  - [ ] Identify largest chunks: run `vite build --analyze`
  - [ ] Check if lucide-react is tree-shaking properly
  - [ ] Check if React DevTools in production
  - [ ] Minify SVG in PatientAvatar2D

### 5.2 Rendering Performance
- [ ] **Prevent Unnecessary Re-renders**:
  - [ ] Wrap expensive components in `React.memo()`:
    - [ ] `PatientAvatar2D` (updates only on visualState change)
    - [ ] `WaveformChart` (updates only on vitals change)
    - [ ] `PatientConditionPanel` (expensive SVG render)
  - [ ] Move SVG rendering to `useMemo`
  - [ ] Move waveform calculations to `useMemo` with dependencies

- [ ] **Timer & Interval Optimization**:
  - [ ] `setInterval` in App.tsx runs every 1000ms — verify no memory leaks
  - [ ] Check DevTools Memory tab for increasing heap size over time
  - [ ] Use `useCallback` for memoized handlers
  - [ ] Consider throttling rapid slider updates

- [ ] **Canvas Rendering (WaveformChart)**:
  - [ ] Check if canvas redraws on every render (likely yes)
  - [ ] Move canvas setup to `useEffect`
  - [ ] Use `useRef` to store canvas context
  - [ ] Implement double-buffering or requestAnimationFrame

### 5.3 Simulation Calculation Performance
- [ ] **calculateSimulation Call Frequency**:
  - [ ] Called every time settings/scenario change
  - [ ] Called in useMemo with [settings, scenario] deps
  - [ ] Verify it's not running on every keystroke
  - [ ] Add performance profiling in dev build

- [ ] **Optimize ventilatorModel Calculations**:
  - [ ] Pre-compute mode ventilation factors as constants
  - [ ] Cache scenario objects (immutable)
  - [ ] Avoid recalculating same values
  - [ ] Consider moving heavy calculations to Web Worker (if > 16ms)

---

## PART 6: STATE MANAGEMENT & DATA FLOW

### 6.1 Current State Issues
- [ ] **App.tsx Manages Too Much**:
  - [ ] settings (VentSettings)
  - [ ] scenarioType (ScenarioType)
  - [ ] paused (boolean)
  - [ ] elapsedSeconds (number)
  - [ ] Consider extracting to Zustand or Context

- [ ] **Immutability Violations**:
  - [ ] Check if any component mutates props directly
  - [ ] Verify `updateSetting` creates new objects:
    ```typescript
    // CORRECT:
    { ...current, [key]: value }
    // Don't:
    current[key] = value
    ```

### 6.2 Context API Restructure
- [ ] **Create SimulationContext**:
  ```typescript
  interface SimulationContextValue {
    settings: VentSettings
    scenario: Scenario
    simulation: SimulationState
    vitals: DerivedVitals
    paused: boolean
    elapsedSeconds: number
    updateSetting: <K extends keyof VentSettings>(key: K, value: VentSettings[K]) => void
    updateScenario: (type: ScenarioType) => void
    togglePause: () => void
    reset: () => void
  }
  ```
  - [ ] Create `src/context/SimulationContext.tsx`
  - [ ] Create `src/hooks/useSimulation.ts`
  - [ ] Wrap App in Provider
  - [ ] Consume in child components

### 6.3 Data Flow Documentation
- [ ] **Missing Data Flow Diagrams**:
  - [ ] Document: User input → Settings → Simulation → UI
  - [ ] Document: Scenario selection → Reset → Visualization
  - [ ] Create `docs/DATA_FLOW.md`

---

## PART 7: SIMULATION LOGIC VALIDATION

### 7.1 Physiologic Accuracy Review
- [ ] **SpO2 Calculation**:
  - [ ] Is SaO2 curve physiologically accurate?
  - [ ] Does SpO2 respond to FiO2 changes correctly?
  - [ ] Does SpO2 worsen with reduced compliance?
  - [ ] Test: increasing PEEP should improve SpO2 in ARDS
  - [ ] Test: decreasing FiO2 should lower SpO2
  - [ ] Add comments explaining the P50/sigmoid curve

- [ ] **PaO2 Calculation**:
  - [ ] Verify Alveolar-arterial gradient is calculated
  - [ ] Check A-a gradient increases with ARDS
  - [ ] Verify PaO2/FiO2 ratio is meaningful
  - [ ] Normal range: PaO2 80-100 mmHg at FiO2 21%

- [ ] **PaCO2 Calculation**:
  - [ ] Verify minute ventilation drives CO2 clearance
  - [ ] Check that lower RR increases PaCO2
  - [ ] Check that higher Vt decreases PaCO2
  - [ ] Normal range: 35-45 mmHg

- [ ] **pH Calculation**:
  - [ ] Verify Henderson-Hasselbalch relationship
  - [ ] Test: High PaCO2 should lower pH (respiratory acidosis)
  - [ ] Test: Low PaCO2 should raise pH (respiratory alkalosis)
  - [ ] Normal range: 7.35-7.45

- [ ] **Compliance & Resistance**:
  - [ ] Are baseline values realistic?
  - [ ] Normal compliance: 50-100 mL/cmH2O
  - [ ] ARDS compliance: 15-30 mL/cmH2O
  - [ ] Normal resistance: 3-8 cmH2O/L/s
  - [ ] Obstructed: 15-40 cmH2O/L/s

- [ ] **Plateau Pressure**:
  - [ ] Correct formula: Pplat = PEEP + (Vt / compliance)
  - [ ] Normal: < 30 cmH2O
  - [ ] High: > 30 cmH2O indicates barotrauma risk
  - [ ] Should be calculated correctly in tests

- [ ] **Peak Inspiratory Pressure (PIP)**:
  - [ ] Accounts for resistance and compliance
  - [ ] Should increase with airway obstruction
  - [ ] Should increase with pneumothorax

### 7.2 Waveform Accuracy
- [ ] **Pressure Waveform**:
  - [ ] Should show rise during inspiration, plateau, fall during expiration
  - [ ] Pressure curve shape should vary with ventilation mode:
    - [ ] AC: Square (controlled)
    - [ ] PC: Decelerating (pressure-controlled)
    - [ ] PSV: Decelerating + spontaneous dips
    - [ ] CPAP: Minimal pressure variation
  - [ ] Verify current implementation matches expected shapes

- [ ] **Flow Waveform**:
  - [ ] Should be sine-like for AC/VC
  - [ ] Should be decelerating for PC
  - [ ] Peak flow during inspiration, zero during expiration
  - [ ] Negative flow during expiration (exhalation)

- [ ] **Volume Waveform**:
  - [ ] Integral of flow (should increase then plateau during inspiration)
  - [ ] Linearly decrease during expiration
  - [ ] Cycle time = 60 / RR

---

## PART 8: ACCESSIBILITY & UX ISSUES

### 8.1 ARIA & Semantic HTML
- [ ] **Missing ARIA Labels**:
  - [ ] All `<button>` elements need aria-label or text
  - [ ] All `<input>` sliders need aria-label
  - [ ] SVG patient avatar has `aria-label` — verify it's descriptive
  - [ ] Canvas waveform needs `role="img"` and `aria-label`
  - [ ] All icons need `aria-hidden="true"` if decorative

- [ ] **Semantic HTML**:
  - [ ] Header should use `<header>`
  - [ ] Footer should use `<footer>`
  - [ ] Panels should be `<section>` with `aria-labelledby`
  - [ ] Settings form should use `<fieldset>` and `<legend>`
  - [ ] Monitor display should use `<dl>` for term/definition pairs

- [ ] **Focus Management**:
  - [ ] Tab order should be logical
  - [ ] Focus visible on all interactive elements
  - [ ] Modal-like panels (if any) should trap focus

### 8.2 Keyboard Navigation
- [ ] **Slider Controls**:
  - [ ] Arrow keys should adjust slider value
  - [ ] Home/End should jump to min/max
  - [ ] Step size should be configurable

- [ ] **Button Navigation**:
  - [ ] All buttons accessible via Tab
  - [ ] Enter/Space triggers buttons
  - [ ] Escape closes dialogs (if any)

### 8.3 Color Contrast & Visual Accessibility
- [ ] **Current Colors** (from global.css):
  - [ ] Check contrast ratios:
    - [ ] `--text-main: #eaf3ff` on `--bg-main: #07111f` → good
    - [ ] `--text-muted: #8fa9c4` on backgrounds → verify > 4.5:1
    - [ ] `--warning-yellow: #ffd84a` on dark bg → verify contrast
    - [ ] `--danger-red: #ff4545` on dark bg → verify contrast
  - [ ] Run WebAIM Contrast Checker on every color combination
  - [ ] Use axe DevTools to scan for color contrast violations

- [ ] **Reduced Motion**:
  - [ ] Add `@media (prefers-reduced-motion: reduce)` for:
    - [ ] Breathing animation (disable or slow down)
    - [ ] Waveform updates (slower refresh rate)
    - [ ] Alarm glow (disable animation)
  - [ ] Test with DevTools `Rendering > Emulate CSS media feature prefers-reduced-motion`

### 8.4 Screen Reader Testing
- [ ] **Test with**: NVDA (Windows), JAWS (Windows), VoiceOver (Mac/iOS)
- [ ] Patient avatar should be announced with condition/status
- [ ] Vitals should be announced when they change
- [ ] Alarms should be announced when they fire
- [ ] No unlabeled icons or decorative elements

---

## PART 9: ERROR HANDLING & EDGE CASES

### 9.1 Input Validation
- [ ] **Slider Inputs**:
  - [ ] Enforce min/max bounds
  - [ ] Prevent non-numeric input
  - [ ] Validate settings don't conflict (e.g., Vt > 10, RR > 100)
  - [ ] Warn on dangerous combinations (PEEP = 0, FiO2 = 100)

- [ ] **Scenario Selection**:
  - [ ] Verify scenario exists in scenarios object
  - [ ] Handle invalid scenario gracefully
  - [ ] Default to 'normal' on error

### 9.2 Boundary Conditions
- [ ] **Test Extreme Values**:
  - [ ] FiO2: 21% (room air) to 100%
  - [ ] Vt: 200 mL to 1200 mL
  - [ ] RR: 4 to 100 bpm
  - [ ] PEEP: 0 to 25 cmH2O
  - [ ] Inspiratory time: 0.3s to 2s
  - [ ] Flow: 10 to 100 L/min
  - [ ] Trigger: 0.5 to 15 cmH2O
  - [ ] Test all combinations — do calculations still work?

- [ ] **NaN & Infinity Checks**:
  - [ ] Add guards in vitals calculations:
    ```typescript
    if (!isFinite(spo2) || isNaN(spo2)) spo2 = 0
    ```
  - [ ] Check compliance calculation doesn't divide by zero
  - [ ] Check logarithm calculations handle zero/negative

### 9.3 Runtime Errors
- [ ] **No console.error Statements**:
  - [ ] Scan for any unhandled Promise rejections
  - [ ] Add error boundaries (ErrorBoundary component)
  - [ ] Graceful degradation if simulation fails
  - [ ] User-friendly error messages

- [ ] **Memory Leaks**:
  - [ ] `setInterval` cleanup verified in useEffect
  - [ ] No uncleared timeouts
  - [ ] Event listeners properly removed
  - [ ] Context subscriptions cleaned up

---

## PART 10: DOCUMENTATION & CODE COMMENTS

### 10.1 Missing Documentation Files
- [ ] **docs/ARCHITECTURE.md**:
  - [ ] Component hierarchy diagram
  - [ ] Data flow diagram
  - [ ] Simulation loop explanation
  - [ ] State management structure

- [ ] **docs/SIMULATION_LOGIC.md**:
  - [ ] Explain each vital calculation
  - [ ] Explain alarm thresholds
  - [ ] Explain patient condition rules
  - [ ] Explain visual state logic
  - [ ] References to physiology principles

- [ ] **docs/DEVELOPMENT.md**:
  - [ ] How to run locally
  - [ ] How to add new scenarios
  - [ ] How to modify waveforms
  - [ ] How to add new components
  - [ ] Testing guidelines

- [ ] **docs/DEPLOYMENT.md**:
  - [ ] Build process
  - [ ] Environment variables
  - [ ] Performance benchmarks
  - [ ] Browser support matrix

### 10.2 Inline Code Comments
- [ ] **Functions Missing Comments**:
  - [ ] `calculateVitals`: Add comment explaining each vital and its formula
  - [ ] `calculateSimulation`: Add comment explaining simulation flow
  - [ ] `generatePressureWaveform`: Add comment explaining pressure curve shape
  - [ ] Waveform functions: Add comments explaining sine wave generation

- [ ] **Complex Logic**:
  - [ ] SVG calculations in PatientAvatar2D need comments
  - [ ] Breathing animation timing logic needs comments
  - [ ] Compliance/resistance calculations need comments

### 10.3 Type Documentation
- [ ] **Add JSDoc comments to types**:
  ```typescript
  /**
   * Derived vitals calculated from ventilator settings and patient physiology.
   * All values in standard medical units (mmHg, mL, L/min, cmH2O, etc.)
   */
  export type DerivedVitals = { ... }
  ```

---

## PART 11: UI/UX POLISH & REFINEMENT

### 11.1 Visual Feedback
- [ ] **Slider Interactions**:
  - [ ] Hover state (opacity/color change)
  - [ ] Active state (distinct styling)
  - [ ] Disabled state (grayed out)
  - [ ] Value tooltip showing current value

- [ ] **Button Feedback**:
  - [ ] Hover effect
  - [ ] Active/pressed state
  - [ ] Disabled state
  - [ ] Loading state (if async)

- [ ] **Patient Avatar Changes**:
  - [ ] Smooth transitions between states
  - [ ] Gradient animations for skin tone
  - [ ] Pulsing effects for critical alarms
  - [ ] Sweat droplet animation
  - [ ] Eyes blinking (expression change)

### 11.2 Information Display
- [ ] **Vitals Display**:
  - [ ] All 20+ vitals visible at once (scrollable if needed)
  - [ ] Unit labels for every value
  - [ ] Color coding for abnormal ranges:
    - [ ] Green: Normal
    - [ ] Yellow: Warning
    - [ ] Red: Critical
  - [ ] Trend indicators (↑ ↓ or sparkline)

- [ ] **Waveform Display**:
  - [ ] Grid/graph paper background for readability
  - [ ] Axis labels (time, pressure/flow/volume)
  - [ ] Legends showing what each color represents
  - [ ] Responsive sizing to container

### 11.3 Responsive Design
- [ ] **Mobile Layouts** (if supporting mobile):
  - [ ] Stack panels vertically on small screens
  - [ ] Patient avatar remains prominent
  - [ ] Controls collapsible into drawers
  - [ ] Waveform resizes properly

- [ ] **Tested Resolutions**:
  - [ ] 1280 x 720 (minimum)
  - [ ] 1440 x 900 (typical laptop)
  - [ ] 1920 x 1080 (desktop)
  - [ ] 2560 x 1440 (4K)
  - [ ] Test for overflow and wrapping

---

## PART 12: BUILD & DEPLOYMENT VALIDATION

### 12.1 CI/CD Pipeline
- [ ] **No .github/workflows/**:
  - [ ] Create `build-and-test.yml`:
    - [ ] Run linting
    - [ ] Run type checking
    - [ ] Run tests with coverage
    - [ ] Build production bundle
    - [ ] Upload coverage reports
    - [ ] Warn on bundle size increase
  - [ ] Create `deploy.yml` (if deploying)

### 12.2 Browser Support
- [ ] **Test in**:
  - [ ] Chrome/Edge latest
  - [ ] Firefox latest
  - [ ] Safari latest
  - [ ] Mobile Safari (iOS)
  - [ ] Chrome (Android)

- [ ] **Feature Support**:
  - [ ] Canvas API (for waveforms)
  - [ ] SVG support
  - [ ] CSS custom properties
  - [ ] Flexbox/Grid
  - [ ] requestAnimationFrame

### 12.3 Production Checks
- [ ] **Before Shipping**:
  - [ ] All console errors cleared
  - [ ] All console warnings cleared
  - [ ] No `console.log` in code
  - [ ] No `debugger` statements
  - [ ] No development-only packages in production build
  - [ ] Source maps generated for debugging
  - [ ] Service worker (if PWA features desired)
  - [ ] Manifest.json (if installable)

---

## PART 13: SPECIFIC FILE-BY-FILE IMPROVEMENTS

### 13.1 App.tsx (92 lines)
- [ ] Extract `useSimulation` hook
- [ ] Extract `useVentilatorSettings` hook
- [ ] Remove direct state management
- [ ] Wrap with SimulationProvider
- [ ] Add error boundary
- [ ] Memoize expensive components
- [ ] Add loading state
- [ ] Add error state

### 13.2 ventilatorModel.ts (353 lines)
- [ ] Split into modular files
- [ ] Add comprehensive JSDoc
- [ ] Add type guards for all inputs
- [ ] Add NaN/Infinity checks
- [ ] Add performance profiling
- [ ] Document each formula
- [ ] Add unit tests (73 lines exist — expand to 300+)
- [ ] Verify all ranges and calculations

### 13.3 PatientAvatar2D.tsx (173 lines)
- [ ] Extract SVG parts into subcomponents
- [ ] Reduce to < 80 lines
- [ ] Add prop memoization
- [ ] Optimize gradient definitions
- [ ] Move static SVG to constants
- [ ] Add comprehensive unit tests
- [ ] Test all 20+ visual states

### 13.4 styles/simulator.css & styles/global.css
- [ ] Organize CSS with comments
- [ ] Extract color tokens to CSS variables ✓ (done)
- [ ] Extract spacing tokens
- [ ] Extract animation definitions
- [ ] Extract media query breakpoints
- [ ] Add CSS linting (stylelint)
- [ ] Remove unused classes
- [ ] Add :focus-visible to all interactive elements
- [ ] Add @media (prefers-reduced-motion)
- [ ] Verify no magic numbers in properties

### 13.5 Components (11 files)
- [ ] All components need TypeScript strict mode compliance
- [ ] All need unit tests
- [ ] All need accessibility audit
- [ ] All need performance optimization
- [ ] All need prop type safety

---

## PART 14: TESTING INFRASTRUCTURE SETUP

### 14.1 Vitest Configuration
- [ ] Create `vitest.config.ts`:
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
        exclude: ['node_modules/'],
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  })
  ```

### 14.2 Test Utilities
- [ ] Create `src/test/setup.ts`
- [ ] Create `src/test/mocks.ts`
- [ ] Create `src/test/render.tsx` (custom render with providers)
- [ ] Create `src/test/factories.ts` (test data builders)
- [ ] Add testing-library utilities

### 14.3 E2E Test Scaffold
- [ ] Create `playwright.config.ts`
- [ ] Create `e2e/` directory
- [ ] Create `e2e/user-flows.spec.ts`
- [ ] Add E2E tests for critical paths

---

## PART 15: PERFORMANCE BENCHMARKING

### 15.1 Metrics to Track
- [ ] **Bundle Size**:
  - [ ] Target: < 60 kB gzipped
  - [ ] Current: 71.49 kB gzipped
  - [ ] Delta: **-11 kB needed**

- [ ] **Core Web Vitals**:
  - [ ] LCP (Largest Contentful Paint): < 2.5s
  - [ ] FID (First Input Delay): < 100ms
  - [ ] CLS (Cumulative Layout Shift): < 0.1
  - [ ] TTFB (Time to First Byte): baseline

- [ ] **Runtime Performance**:
  - [ ] Simulation calculation time: < 5ms
  - [ ] Render time: < 16ms (60fps)
  - [ ] Slider drag responsiveness: < 16ms
  - [ ] Waveform update: < 16ms

### 15.2 Profiling Tools
- [ ] Use Chrome DevTools Performance tab
- [ ] Use React Profiler API
- [ ] Use Lighthouse CI
- [ ] Use `performance.now()` for custom benchmarks
- [ ] Add performance monitoring to CI/CD

---

## PART 16: SECURITY & COMPLIANCE

### 16.1 Security Checklist
- [ ] No hardcoded secrets (API keys, tokens)
- [ ] No console output of sensitive data
- [ ] HTML escaping (React does this by default)
- [ ] No `dangerouslySetInnerHTML` usage
- [ ] Input validation for all user inputs
- [ ] Rate limiting (if backend exists)
- [ ] HTTPS enforcement (if deployed)
- [ ] CORS headers configured (if API calls)
- [ ] CSP headers (Content-Security-Policy)

### 16.2 Privacy
- [ ] No tracking/analytics (unless explicitly desired)
- [ ] No local storage of PII
- [ ] Privacy policy (if collecting data)
- [ ] Terms of use (educational/simulation only)
- [ ] Disclaimer on every page about educational use

### 16.3 Compliance
- [ ] Disclaimer: "For educational use only"
- [ ] Not intended for clinical decision-making
- [ ] No patient data stored
- [ ] No HIPAA compliance needed (no real data)
- [ ] Accessibility compliance: WCAG 2.1 AA

---

## PART 17: DEPLOYMENT & HOSTING

### 17.1 Deployment Platform (None configured)
- [ ] Choose platform:
  - [ ] Vercel (recommended for React/Vite)
  - [ ] Netlify
  - [ ] GitHub Pages
  - [ ] Self-hosted (Docker)

- [ ] **Vercel Setup**:
  - [ ] Create `vercel.json`
  - [ ] Configure environment variables
  - [ ] Set build command
  - [ ] Set output directory: `dist`

### 17.2 Environment Configuration
- [ ] `.env` for local development
- [ ] `.env.production` for production
- [ ] Process env variable validation at startup

### 17.3 Monitoring & Analytics (Optional)
- [ ] Error tracking (Sentry, etc.)
- [ ] Performance monitoring (if desired)
- [ ] Usage analytics (if desired)
- [ ] Uptime monitoring

---

## PART 18: FINAL VALIDATION CHECKLIST

### Before Marking Complete:
- [ ] All 500+ items reviewed manually
- [ ] 80% test coverage achieved (not mocked)
- [ ] Bundle size < 60 kB gzipped
- [ ] All TypeScript errors eliminated
- [ ] All accessibility issues fixed
- [ ] All performance benchmarks met
- [ ] All components memoized where beneficial
- [ ] No console errors in production build
- [ ] E2E tests passing
- [ ] Lighthouse score > 90
- [ ] Cross-browser testing completed
- [ ] Documentation complete and accurate
- [ ] Code review passed
- [ ] Performance profiling completed
- [ ] Security audit passed
- [ ] Build process validated
- [ ] Deployment validated (if applicable)

---

## CONCLUSION

**DO NOT mark this task as complete by running `/goal` alone.** This checklist represents 500+ distinct improvements across:
- Build/Deploy (20+ items)
- Type Safety (15+ items)
- Testing (100+ items)
- Architecture (30+ items)
- Performance (25+ items)
- State Management (15+ items)
- Simulation Logic (40+ items)
- Accessibility (20+ items)
- Error Handling (20+ items)
- Documentation (20+ items)
- UI/UX Polish (30+ items)
- Specific Files (50+ items)
- Infrastructure (25+ items)
- Security (20+ items)
- Deployment (15+ items)

**Codex must validate each category systematically, not just run tests and call it done.**

