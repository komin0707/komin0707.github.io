# 2D Ventilator Simulator 구현 지시사항

아래 지시사항은 첨부 이미지와 함께 Codex에 전달하기 위한 개발 요청서입니다.  
핵심 목표는 **이미지와 유사한 의료 시뮬레이터 UI**를 만드는 것이 아니라, **환자 컨디션에 따라 중앙 2D 환자 아바타가 실시간으로 변화하는 벤틸레이터 시뮬레이터**를 구현하는 것입니다.

---

## 1. 전체 목표

첨부한 이미지를 레퍼런스로 사용해서 **2D Ventilator Simulator 화면**을 구현해줘.

중요:

- 이미지를 단순 배경 이미지로 깔거나 정적인 UI로 재현하지 말 것.
- 가장 중요한 기능은 중앙의 **2D 환자 아바타**가 환자 컨디션, 바이탈, ABGA, 폐역학, 벤틸레이터 설정값에 따라 실시간으로 변화하는 것이다.
- 프로젝트가 이미 존재한다면 현재 스택을 유지하고, 비어 있는 프로젝트라면 **React + TypeScript + Vite** 기반으로 구현해줘.
- 가능하면 외부 UI 라이브러리는 최소화하고, **CSS/SVG/Canvas 기반**으로 직접 구현해줘.
- 전체 화면은 **16:9 기반의 데스크톱 시뮬레이터 UI**로 만들고, 최소 `1280x720` 이상에서 보기 좋게 구성해줘.

목표:

의료 교육용 벤틸레이터 시뮬레이션 화면을 만든다.  
사용자가 `FiO2`, `Tidal Volume`, `Respiratory Rate`, `PEEP`, `Flow`, `Trigger` 등을 조정하면 숫자만 바뀌는 것이 아니라 다음 요소가 함께 변해야 한다.

- 환자 상태
- 2D 환자 아바타
- 폐 상태
- 파형
- 알람
- 상태 설명

---

## 2. 기본 UI 레이아웃

전체 스타일은 첨부 이미지처럼 어두운 의료 시뮬레이터 UI, 청색/남색 계열, 네온 느낌의 파형, 카드형 패널 구조로 구성한다.

### 화면 구성

1. 좌측: 벤틸레이터 설정 패널
2. 중앙: 환자 상태 패널과 반응형 2D 환자 아바타
3. 우측: 실시간 모니터링 파형과 바이탈
4. 하단: 폐 상태, 알람, 시뮬레이션 시간, 시나리오 정보, 조작 버튼

---

## 3. 핵심 기능: 상태 기반 2D 환자 아바타

중앙 2D 환자는 고정 일러스트가 아니어야 한다.

환자 상태에 따라 다음 요소가 바뀌어야 한다.

- 얼굴 표정
- 눈 상태
- 입술 색
- 피부색
- 땀 표시
- 호흡곤란 표현
- 흉곽 움직임 속도
- 흉곽 움직임 크기
- 폐 색상
- 폐 침윤/분비물/무기폐/저순응도 표현
- 기관삽관 튜브 색상 또는 압력 강조
- 알람 발생 시 환자 주변 경고 효과

---

## 4. 환자 상태 변화 예시

### 안정 상태

- 표정 편안함
- 피부 정상
- 입술 정상
- 폐 분홍색
- 흉곽 움직임 규칙적

### 저산소증

- 입술 청색증
- 피부 창백/푸른 톤
- `SpO2` 빨간색
- 빠른 호흡
- `Low SpO2` 알람

### 고탄산혈증

- 졸린 표정
- 눈 반쯤 감김
- `CO2` 상승 표시
- pH 저하

### 호흡곤란

- 불안한 표정
- 땀
- 빠른 흉곽 움직임
- 보조근 사용 느낌

### 폐렴 악화

- 폐에 흐린 침윤 표시
- 분비물 점 표시
- compliance 감소
- 산소화 악화

### 튜브 막힘 또는 기도 저항 증가

- `PIP` 상승
- 튜브/기도 쪽 붉은 강조
- `High Peak Pressure` 알람

### PEEP 또는 FiO2 조정으로 호전

- 청색증 감소
- 피부색 회복
- `SpO2` 상승
- 알람 감소
- 환자 상태가 `회복 중` 또는 더 안정적인 상태로 변경

---

## 5. 상단 Header

상단에는 다음 요소를 배치한다.

- 좌측 제목: `VENT SIMULATOR 2D`
- 중앙 또는 상단 모드 탭:
  - `A/C`
  - `V/C`
  - `P/C`
  - `PSV`
  - `CPAP`
- 현재 선택된 모드는 파란색 활성 상태로 표시
- 우측에는 도움말, 사운드, 설정 아이콘 느낌의 버튼 배치

---

## 6. 좌측 설정 패널

패널 제목:

```text
설정 (SETTINGS)
```

아래 값들은 슬라이더와 숫자 표시가 함께 있어야 한다.  
각 슬라이더는 controlled state로 관리한다.

| 항목 | Min | Max | Default | Step |
|---|---:|---:|---:|---:|
| FiO2 (%) | 21 | 100 | 40 | 1 |
| Tidal Volume (mL) | 100 | 1000 | 500 | 10 |
| Respiratory Rate (/min) | 4 | 40 | 16 | 1 |
| PEEP (cmH2O) | 0 | 20 | 5 | 1 |
| Inspiratory Time (sec) | 0.1 | 3.0 | 1.0 | 0.1 |
| Flow (L/min) | 10 | 100 | 50 | 1 |
| Trigger (L/min) | 0.5 | 15.0 | 2.0 | 0.1 |

---

## 7. 중앙 환자 상태 패널

패널 제목:

```text
환자 상태 (PATIENT CONDITION)
```

중앙에 2D 환자 아바타를 배치한다.

요구사항:

- 환자는 침대에 누워 있어야 한다.
- 기관삽관 튜브와 벤틸레이터 회로가 연결되어 있어야 한다.
- 흉부는 보이게 한다.
- 폐 내부가 반투명하게 보이도록 구현한다.
- 환자 아바타는 가능하면 SVG 레이어 또는 div/CSS 레이어로 구성한다.

### 환자 아바타 레이어 구조

아래와 같은 구조로 레이어를 나누어 상태에 따라 개별적으로 바뀌게 한다.

```text
PatientBaseBody
Head
FaceExpression
Eyes
Mouth
LipsCyanosisOverlay
SkinToneOverlay
SweatLayer
ChestMotionLayer
LungLeft
LungRight
LungInfiltrationLayer
SecretionLayer
AirwayTube
TubePressureHighlight
AlarmGlowLayer
```

---

## 8. 환자 상태 카드

상태 카드에는 다음 정보를 표시한다.

- 환자 컨디션: `안정 / 주의 / 악화 / 위중`
- `SpO2`
- `PaO2 / FiO2`
- `CO2` 또는 `PaCO2`
- 순응도 `Compliance`
- 기도저항 `Resistance`

예시:

```text
환자 컨디션: 악화
SpO2: 86% ↓
PaO2/FiO2: 120 ↓
CO2: 58 ↑
순응도: 25 ↓
기도저항: 18 ↑
```

중앙 하단에는 현재 상태 설명을 문장으로 보여준다.

예시:

```text
폐 순응도 감소 및 저산소혈증 악화 상태입니다. PEEP 증가, FiO2 조정, 분비물 제거 및 환기 변화가 필요할 수 있습니다.
```

---

## 9. 우측 실시간 모니터링 패널

패널 제목:

```text
실시간 모니터링
```

### 3개의 파형 카드 구현

1. Pressure waveform
2. Flow waveform
3. Volume waveform

파형은 정적인 이미지가 아니라 `SVG path`, `SVG polyline`, 또는 `canvas`를 이용해서 움직이는 것처럼 구현한다.  
`requestAnimationFrame` 또는 `setInterval`을 사용해서 시간이 흐르는 느낌을 만든다.

파형은 설정값과 환자 상태에 따라 대략적으로 바뀌어야 한다.

### Pressure waveform

- `PIP`가 높으면 peak가 높아짐
- `PEEP`가 높으면 baseline이 올라감
- 기도저항 증가 시 peak가 뾰족해짐

### Flow waveform

- `Flow` 설정이 높으면 inspiratory flow가 커짐
- obstructive 상태에서는 expiratory flow가 길게 늘어짐

### Volume waveform

- `Tidal Volume`이 높으면 곡선 peak가 커짐
- leak 또는 low compliance 상태에서는 `Vte`가 감소

### 우측 추가 모니터링

다음 값을 표시한다.

- `SpO2`
- `HR`
- `EtCO2`
- `RR`

숫자는 정상 범위면 흰색 또는 청색, 위험하면 빨간색으로 표시한다.

---

## 10. 하단 패널

### 10.1 폐 상태 패널

패널 제목:

```text
폐 상태 (LUNG STATUS)
```

포함 요소:

- 작은 폐 아이콘 또는 폐 SVG
- Compliance
- Resistance
- FRC
- 분비물 정도

### 10.2 알람 패널

패널 제목:

```text
알람 (ALARMS)
```

알람 조건에 따라 다음 항목을 표시한다.

- `Low SpO2`
- `High Peak Pressure`
- `High Respiratory Rate`
- `Low Compliance`
- `High CO2`
- `Low Minute Ventilation`

### 10.3 하단 상태바

하단 상태바에는 다음 요소를 배치한다.

- 시뮬레이션 시간
- 현재 시나리오
- 환자 정보
- 환자 상태 버튼
- 알람 설정 버튼
- 시나리오 변경 버튼
- 중지 / 초기화 버튼

---

## 11. 기본 시나리오

기본 시나리오 이름:

```text
폐렴(Pneumonia)_중증
```

환자 정보:

- 성인
- 65kg
- 남성
- 기관삽관 상태
- 폐렴으로 인한 저산소혈증
- 초기 compliance 낮음
- 기도저항 약간 증가
- 분비물 많음

시나리오 선택 기능도 간단히 넣어줘.

최소 5개의 시나리오를 구현한다.

1. Normal
2. Pneumonia
3. ARDS
4. Airway Obstruction
5. Pneumothorax

각 시나리오마다 baseline 값을 다르게 설정한다.

### 시나리오 값 예시

```ts
const scenarios = {
  normal: {
    type: 'normal',
    label: 'Normal',
    severity: 0.1,
    baselineCompliance: 55,
    baselineResistance: 8,
    secretionLevel: 0.1,
    shunt: 0.1,
  },

  pneumonia: {
    type: 'pneumonia',
    label: 'Pneumonia',
    severity: 0.65,
    baselineCompliance: 28,
    baselineResistance: 16,
    secretionLevel: 0.7,
    shunt: 0.55,
  },

  ards: {
    type: 'ards',
    label: 'ARDS',
    severity: 0.85,
    baselineCompliance: 18,
    baselineResistance: 14,
    secretionLevel: 0.4,
    shunt: 0.75,
  },

  airwayObstruction: {
    type: 'airwayObstruction',
    label: 'Airway Obstruction',
    severity: 0.55,
    baselineCompliance: 38,
    baselineResistance: 30,
    secretionLevel: 0.8,
    shunt: 0.35,
  },

  pneumothorax: {
    type: 'pneumothorax',
    label: 'Pneumothorax',
    severity: 0.75,
    baselineCompliance: 20,
    baselineResistance: 18,
    secretionLevel: 0.2,
    shunt: 0.6,
    oneSideChestMotionReduced: true,
  },
};
```

---

## 12. 시뮬레이션 계산 로직

계산 로직은 다음과 같은 파일에 분리해서 작성한다.

```text
src/simulation/ventilatorModel.ts
```

주의:

- UI 컴포넌트 안에 복잡한 계산식을 직접 넣지 말 것.
- 계산 공식은 완전한 의학 모델일 필요는 없지만, 교육용으로 일관성 있게 반응해야 한다.
- 입력값이 바뀌면 `derivedVitals`, `PatientVisualState`, `alarms`, `waveforms`가 모두 다시 계산되어야 한다.

---

## 13. TypeScript 타입 정의

다음 타입들을 활용해줘.

```ts
type VentMode = 'AC' | 'VC' | 'PC' | 'PSV' | 'CPAP';

type VentSettings = {
  fio2: number;
  tidalVolume: number;
  respiratoryRate: number;
  peep: number;
  inspiratoryTime: number;
  flow: number;
  trigger: number;
  mode: VentMode;
};

type ScenarioType =
  | 'normal'
  | 'pneumonia'
  | 'ards'
  | 'airwayObstruction'
  | 'pneumothorax';

type DerivedVitals = {
  spo2: number;
  pao2: number;
  pao2fio2: number;
  paco2: number;
  ph: number;
  pip: number;
  plateau: number;
  vte: number;
  minuteVentilation: number;
  totalRR: number;
  heartRate: number;
  etco2: number;
  compliance: number;
  resistance: number;
  frc: number;
  leak: number;
};

type PatientCondition = 'stable' | 'watch' | 'worsening' | 'critical';

type PatientVisualState = {
  condition: PatientCondition;
  expression: 'calm' | 'strained' | 'drowsy' | 'distressed' | 'critical';
  skinTone: 'normal' | 'pale' | 'cyanotic' | 'severelyCyanotic';
  lipColor: 'normal' | 'blue' | 'deepBlue';
  sweat: boolean;
  chestMotionSpeed: number;
  chestMotionAmplitude: number;
  leftChestReduced: boolean;
  lungColor: 'healthy' | 'inflamed' | 'stiff' | 'collapsed';
  infiltrationOpacity: number;
  secretionOpacity: number;
  tubePressureWarning: boolean;
  alarmGlow: boolean;
};
```

---

## 14. 계산 공식 예시

유틸 함수:

```ts
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
```

계산 방향:

- compliance는 시나리오 `baselineCompliance`에서 시작
- `PEEP` 5~12 사이에서는 recruitment 효과로 산소화와 compliance가 조금 좋아짐
- `PEEP`이 너무 높으면 `PIP` 증가 및 과팽창 위험
- `FiO2`가 높을수록 `SpO2`와 `PaO2`가 증가
- `RR`과 `Tidal Volume`이 높을수록 minute ventilation이 증가
- minute ventilation이 낮으면 `PaCO2` 증가
- resistance가 높으면 `PIP` 증가
- compliance가 낮으면 plateau pressure와 `PIP` 증가
- leak이 있으면 `Vte` 감소

구체적 계산 예시:

```ts
const recruitment = clamp((settings.peep - 5) * 0.08, 0, 0.5);
const overdistension = settings.peep > 14 ? (settings.peep - 14) * 0.08 : 0;

const compliance = clamp(
  scenario.baselineCompliance * (1 + recruitment - overdistension),
  10,
  65
);

const resistance = clamp(
  scenario.baselineResistance + scenario.secretionLevel * 6,
  5,
  40
);

const leak = scenario.type === 'pneumothorax' ? 6 : 2;

const vte =
  settings.tidalVolume *
  (1 - leak / 100) *
  clamp(0.85 + compliance / 200, 0.82, 1.02);

const minuteVentilation =
  (vte * settings.respiratoryRate) / 1000;

const plateau =
  settings.peep + settings.tidalVolume / compliance;

const pip =
  plateau + resistance * (settings.flow / 60) * 0.45;

const oxygenScore =
  78 +
  settings.fio2 * 0.25 +
  settings.peep * 1.8 +
  recruitment * 8 -
  scenario.shunt * 18 -
  overdistension * 8;

const spo2 = clamp(Math.round(oxygenScore), 65, 99);

const pao2 = clamp(Math.round((spo2 - 75) * 4 + 40), 35, 180);

const pao2fio2 = Math.round(pao2 / (settings.fio2 / 100));

const deadspaceFraction = clamp(0.25 + scenario.severity * 0.35, 0.25, 0.7);

const effectiveMinuteVentilation =
  Math.max(1, minuteVentilation * (1 - deadspaceFraction));

const paco2 = clamp(
  Math.round(40 * (4.5 / effectiveMinuteVentilation) + scenario.severity * 8),
  28,
  90
);

const ph = clamp(
  7.4 - Math.max(0, paco2 - 40) * 0.008,
  7.05,
  7.50
);

const totalRR =
  settings.respiratoryRate + (spo2 < 88 ? 8 : spo2 < 92 ? 4 : 0);

const heartRate = Math.round(
  78 + Math.max(0, 92 - spo2) * 2.2 + Math.max(0, paco2 - 45) * 0.8
);

const etco2 = clamp(Math.round(paco2 - 5), 20, 80);
```

---

## 15. PatientCondition 판정

아래 조건으로 환자 상태를 판정한다.

```ts
function getPatientCondition(vitals: DerivedVitals): PatientCondition {
  if (vitals.spo2 < 82 || vitals.ph < 7.20 || vitals.pip > 40) {
    return 'critical';
  }

  if (vitals.spo2 < 90 || vitals.paco2 > 55 || vitals.pip > 32) {
    return 'worsening';
  }

  if (vitals.spo2 < 94 || vitals.paco2 > 48 || vitals.pip > 28) {
    return 'watch';
  }

  return 'stable';
}
```

---

## 16. PatientVisualState 매핑

### Stable

```ts
{
  expression: 'calm',
  skinTone: 'normal',
  lipColor: 'normal',
  sweat: false,
  chestMotionSpeed: 1.0,
  chestMotionAmplitude: 1.0,
  lungColor: 'healthy',
  alarmGlow: false,
}
```

### Watch

```ts
{
  expression: 'strained',
  skinTone: 'pale',
  lipColor: 'normal',
  sweat: false,
  chestMotionSpeed: 1.15,
  chestMotionAmplitude: 1.05,
  alarmGlow: false,
}
```

### Worsening

```ts
{
  expression: 'distressed',
  skinTone: 'cyanotic',
  lipColor: 'blue',
  sweat: true,
  chestMotionSpeed: 1.35,
  chestMotionAmplitude: 1.2,
  alarmGlow: true,
}
```

### Critical

```ts
{
  expression: 'critical',
  skinTone: 'severelyCyanotic',
  lipColor: 'deepBlue',
  sweat: true,
  chestMotionSpeed: 1.5,
  chestMotionAmplitude: 1.35,
  alarmGlow: true,
}
```

추가 규칙:

- `PaCO2 > 55`이면 expression은 `drowsy` 또는 `distressed`로 변경한다.
- `PaCO2 > 55`이면 눈을 반쯤 감은 상태로 표시한다.
- `PaCO2 > 55`이면 `CO2` 수치를 빨간색으로 표시한다.
- `SpO2 < 88`이면 입술 청색증을 표시한다.
- `SpO2 < 88`이면 피부 푸른 오버레이를 증가시킨다.
- `SpO2 < 88`이면 `Low SpO2` 알람을 표시한다.
- `SpO2 < 88`이면 환자 상태 설명에 `저산소혈증`을 포함한다.
- `PIP > 32`이면 튜브 또는 airway 주변에 붉은 강조 표시를 한다.
- `PIP > 32`이면 `High Peak Pressure` 알람을 표시한다.
- `compliance < 25`이면 폐 색을 어둡고 뻣뻣한 느낌으로 표시한다.
- `compliance < 25`이면 `Low Compliance` 알람을 표시한다.
- scenario가 `pneumothorax`이면 한쪽 흉곽 움직임을 줄여서 표시한다.
- scenario가 `pneumothorax`이면 한쪽 폐를 더 어둡게 또는 작게 표시한다.
- scenario가 `pneumothorax`이면 `PIP` 상승 가능성을 표현한다.

---

## 17. 컴포넌트 구조

가능하면 아래 구조로 만들어줘.

```text
src/
  App.tsx
  main.tsx
  styles/
    global.css
    simulator.css
  simulation/
    ventilatorModel.ts
    scenarios.ts
    waveformGenerator.ts
  components/
    Header.tsx
    SettingsPanel.tsx
    SliderControl.tsx
    PatientConditionPanel.tsx
    PatientAvatar2D.tsx
    LungOverlay.tsx
    MonitorPanel.tsx
    WaveformChart.tsx
    LungStatusPanel.tsx
    AlarmPanel.tsx
    BottomBar.tsx
    ScenarioSelector.tsx
```

---

## 18. PatientAvatar2D 구현 방식

SVG를 권장한다.  
div와 CSS `border-radius`를 섞어도 된다.  
외부 이미지에 의존하지 말고 코드 기반으로 구현한다.

환자 몸통, 얼굴, 폐, 튜브, 오버레이는 각각 별도 레이어로 만들어 상태에 따라 `className`이 바뀌게 한다.

예시:

```tsx
<PatientAvatar2D
  visualState={patientVisualState}
  vitals={derivedVitals}
  scenario={scenario}
/>
```

---

## 19. CSS 애니메이션

필수 애니메이션:

- `chest-breathe` 애니메이션을 만들 것
- `chestMotionSpeed`와 `chestMotionAmplitude`에 따라 CSS variable 변경
- 알람 상태에서는 `patient-avatar` 주변에 붉은 glow pulse 표시
- 폐 침윤 opacity는 scenario와 condition에 따라 변경
- 청색증은 lips와 skin overlay opacity로 표현

CSS variable 예시:

```css
.patient-avatar {
  --breath-speed: 1s;
  --breath-scale: 1.04;
  --cyanosis-opacity: 0;
  --sweat-opacity: 0;
  --infiltration-opacity: 0.4;
  --secretion-opacity: 0.5;
}
```

상태에 따라 inline style 또는 `className`으로 위 값을 변경한다.

---

## 20. 파형 생성

파형 생성 로직은 다음 파일에 분리한다.

```text
src/simulation/waveformGenerator.ts
```

각 waveform은 최근 N개의 점을 가지고 `SVG polyline` 또는 `path`로 렌더링한다.

값이 바뀌면 파형의 amplitude와 baseline이 바뀌어야 한다.

### Pressure waveform

- baseline = `PEEP`
- peak = `PIP`
- inspiration 구간에서 상승 후 plateau 느낌
- expiration 구간에서 baseline으로 하강

### Flow waveform

- inspiration은 양수
- expiration은 음수
- obstruction 시 expiration tail이 길어짐

### Volume waveform

- inspiration 동안 상승
- expiration 동안 하강
- `Vte`가 크면 peak 증가

---

## 21. 알람 조건

`alarms` 배열을 계산해서 `AlarmPanel`에 전달한다.

### Low SpO2

```ts
condition: spo2 < 90
severity: spo2 < 82 ? 'critical' : 'warning'
```

### High Peak Pressure

```ts
condition: pip > 32
severity: pip > 40 ? 'critical' : 'warning'
```

### High CO2

```ts
condition: paco2 > 55
```

### Low Compliance

```ts
condition: compliance < 25
```

### High Respiratory Rate

```ts
condition: totalRR > 28
```

### Low Minute Ventilation

```ts
condition: minuteVentilation < 4
```

알람 표시 요구사항:

- 빨간색 아이콘
- 알람명
- 현재값
- 단위
- critical 알람은 깜빡이는 효과

---

## 22. 디자인 요구사항

CSS 변수로 색상을 관리한다.

```css
:root {
  --bg-main: #07111f;
  --panel-bg: #0b1b2d;
  --panel-bg-2: #10263d;
  --panel-border: rgba(80, 160, 220, 0.25);
  --active-blue: #1689ff;
  --danger-red: #ff4545;
  --normal-green: #35d27f;
  --text-main: #eaf3ff;
  --text-muted: #8fa9c4;
  --wave-pressure: #1689ff;
  --wave-flow: #35d27f;
  --wave-volume: #ffd84a;
}
```

디자인 방향:

- 전체 배경: 어두운 남색
- 패널 배경: 어두운 청색 계열
- 카드 border: 은은한 청색 라인
- 활성 버튼: 파란색
- 경고: 빨간색
- 정상: 초록색
- 텍스트: 밝은 청백색
- 보조 텍스트: 흐린 회청색

파형 색상:

- Pressure: 파란색
- Flow: 초록색
- Volume: 노란색

---

## 23. 반응형 요구사항

- 기본은 데스크톱 16:9 화면
- 화면이 좁아지면 좌측/우측 패널은 아래로 내려가도 됨
- 하지만 `1280px` 이상에서는 반드시 첨부 이미지처럼 3열 구조 유지

---

## 24. 상호작용 요구사항

- 슬라이더를 움직이면 즉시 `derivedVitals`가 다시 계산되어야 한다.
- 환자 상태 카드, 2D 환자 아바타, 폐 상태, 알람, 파형이 모두 즉시 반응해야 한다.
- 시나리오 변경 시 baseline 값이 바뀌고 환자 모습도 변경되어야 한다.
- 초기화 버튼을 누르면 기본값으로 복귀한다.
- 중지 버튼은 파형 애니메이션만 pause/resume 해도 된다.

---

## 25. 안전 및 용도 표시

화면 어딘가에 작은 텍스트로 다음 의미의 문구를 표시한다.

```text
교육용 시뮬레이터입니다. 실제 임상 의사결정에 사용하지 마세요.
```

주의:

- UI는 장난감처럼 보이지 않게 전문적인 의료 시뮬레이터 느낌으로 만들 것.
- 코드 안에 TODO만 남기지 말고 실제 동작 가능한 상태로 완성할 것.
- 컴파일 에러가 없어야 한다.
- 타입 에러가 없어야 한다.
- 정적인 목업이 아니라 상태 기반으로 동작하는 인터랙티브 시뮬레이터여야 한다.

---

## 26. 최종 테스트 체크리스트

완성 후에는 반드시 아래 동작을 확인할 수 있어야 한다.

1. `FiO2`를 올리면 `SpO2`가 상승하고 청색증이 줄어든다.
2. `PEEP`를 적절히 올리면 산소화가 좋아지지만 너무 높이면 `PIP`가 상승한다.
3. `Tidal Volume` 또는 `RR`을 낮추면 minute ventilation이 낮아지고 `PaCO2`가 상승한다.
4. `Airway Obstruction` 시나리오에서는 `PIP`와 resistance가 높고 flow waveform의 expiration이 길어진다.
5. `Pneumonia` 또는 `ARDS` 시나리오에서는 폐 침윤이 보이고 compliance가 낮다.
6. `SpO2`가 낮으면 환자 입술이 파랗게 변하고 `Low SpO2` 알람이 뜬다.
7. `PIP`가 높으면 튜브/기도 쪽에 붉은 강조가 나타나고 `High Peak Pressure` 알람이 뜬다.
8. 환자 상태가 `stable`, `watch`, `worsening`, `critical`로 바뀔 때 표정, 피부색, 폐 상태, 알람 glow가 함께 바뀐다.

---

## 27. 실행 방법 안내

완성 후에는 실행 방법도 알려줘.

예시:

```bash
npm install
npm run dev
```

---

## 28. 가장 중요한 평가 기준

가장 중요한 평가지표는 UI가 첨부 이미지와 비슷한지가 아니라, **중앙 2D 환자 아바타가 시뮬레이션 값에 따라 살아있는 것처럼 반응하는지**이다.

환자 이미지는 절대 고정 이미지가 아니어야 한다.

다음 요소가 모두 상태 기반으로 바뀌어야 한다.

- 표정
- 피부색
- 입술색
- 흉곽 움직임
- 폐 상태
- 튜브 경고
- 알람 glow

---

## 29. Codex에 전달할 시작 문장 예시

Codex에 실제로 요청할 때는 아래 문장으로 시작하면 된다.

```text
이 이미지를 참고해서 똑같은 분위기의 UI를 만들어줘.
하지만 핵심은 이미지 재현이 아니라, 환자 컨디션에 따라 중앙 2D 환자가 변하는 벤틸레이터 시뮬레이터야.
아래 상세 구현 지시사항을 반드시 따라줘.
```
