# 2D Ventilator Simulator — Codex Final Implementation Instructions

> 첨부한 레퍼런스 이미지를 참고해서 **2D Ventilator Simulator**를 구현한다.  
> 핵심은 이미지를 그대로 베끼는 것이 아니라, **환자 컨디션에 따라 중앙 2D 환자 아바타가 실시간으로 변화하는 의료 교육용 시뮬레이터**를 만드는 것이다.

---

## 0. 가장 중요한 목표

이 프로젝트의 가장 중요한 평가지표는 다음이다.

```text
중앙 2D 환자 아바타가 환자 상태, 바이탈, ABGA, 폐역학, 벤틸레이터 설정값에 따라 살아있는 것처럼 반응하는가?
```

따라서 다음은 절대 금지한다.

```text
- 환자 이미지를 PNG/JPG 한 장으로 고정해서 넣는 것
- 레퍼런스 이미지를 단순 배경 이미지로 깔아두는 것
- 숫자와 슬라이더만 바뀌고 환자 모습은 바뀌지 않는 정적 목업
- TODO만 남기고 실제 상태 변화 로직을 구현하지 않는 것
- 랜덤 이미지 검색 결과에서 저작권이 불명확한 의료 이미지를 사용하는 것
```

중앙 환자는 반드시 **상태 기반 레이어형 SVG 또는 코드 기반 SVG/HTML/CSS 레이어**로 구성해야 한다.

---

## 1. 기술 스택

프로젝트가 이미 존재한다면 현재 스택을 유지한다.

비어 있는 프로젝트라면 다음 스택으로 구현한다.

```text
React + TypeScript + Vite
```

권장 사항:

```text
- TypeScript 사용 필수
- 복잡한 계산 로직은 UI 컴포넌트에서 분리
- SVG, CSS, Canvas 기반 직접 구현 선호
- 외부 UI 프레임워크는 최소화
- 아이콘은 lucide-react 또는 Tabler/Heroicons 사용 가능
```

설치 예시:

```bash
npm create vite@latest vent-simulator-2d -- --template react-ts
cd vent-simulator-2d
npm install
npm install lucide-react
npm run dev
```

---

## 2. 전체 화면 방향

전체 UI는 16:9 기반의 데스크톱 의료 시뮬레이터 화면으로 구현한다.

기본 해상도 기준:

```text
최소 1280 x 720 이상에서 보기 좋게 구성
권장 1440 x 900 또는 1920 x 1080 대응
```

레이아웃:

```text
상단: Header / Vent mode tabs / utility buttons
좌측: Ventilator settings panel
중앙: Patient condition panel + 2D patient avatar
우측: Real-time monitoring waveform panel
하단: Lung status / Alarm panel / Bottom status bar
```

1280px 이상에서는 반드시 3열 구조를 유지한다.

```text
좌측 설정 패널 | 중앙 환자 아바타 | 우측 모니터링 패널
```

좁은 화면에서는 패널이 아래로 내려가도 되지만, 중앙 환자 아바타는 항상 가장 중요한 영역으로 유지한다.

---

## 3. 디자인 톤

레퍼런스 이미지처럼 전문적인 의료 시뮬레이터 느낌으로 만든다.

스타일 방향:

```text
- 어두운 남색/청색 계열 배경
- 카드형 패널
- 얇은 네온 라인
- 실시간 모니터링 장비 느낌
- 장난감 UI처럼 보이지 않게 전문적인 의료 교육용 느낌
```

권장 CSS 변수:

```css
:root {
  --bg-main: #07111f;
  --bg-panel: #0b1b2d;
  --bg-panel-soft: #10263d;
  --border-blue: rgba(80, 160, 220, 0.25);
  --active-blue: #1689ff;
  --warning-red: #ff4545;
  --critical-red: #ff2020;
  --normal-green: #35d27f;
  --wave-pressure: #1689ff;
  --wave-flow: #35d27f;
  --wave-volume: #ffd23f;
  --text-main: #eaf3ff;
  --text-muted: #8fa9c4;
  --panel-radius: 10px;
}
```

---

## 4. 상단 Header

상단 Header에는 다음 요소를 배치한다.

```text
좌측: VENT SIMULATOR 2D
중앙: Vent mode tabs
우측: Help / Sound / Settings icon buttons
```

Vent mode tabs:

```text
A/C
V/C
P/C
PSV
CPAP
```

현재 선택된 모드는 파란색 활성 상태로 표시한다.

TypeScript 타입:

```ts
type VentMode = 'AC' | 'VC' | 'PC' | 'PSV' | 'CPAP';
```

---

## 5. 좌측 Ventilator Settings Panel

패널 제목:

```text
설정 (SETTINGS)
```

모든 설정은 controlled state로 관리한다. 슬라이더를 움직이면 즉시 계산값, 환자 상태, 환자 아바타, 파형, 알람이 바뀌어야 한다.

### 5.1 설정 항목

| 항목 | min | max | default | step | 단위 |
|---|---:|---:|---:|---:|---|
| FiO2 | 21 | 100 | 40 | 1 | % |
| Tidal Volume | 100 | 1000 | 500 | 10 | mL |
| Respiratory Rate | 4 | 40 | 16 | 1 | /min |
| PEEP | 0 | 20 | 5 | 1 | cmH2O |
| Inspiratory Time | 0.1 | 3.0 | 1.0 | 0.1 | sec |
| Flow | 10 | 100 | 50 | 1 | L/min |
| Trigger | 0.5 | 15.0 | 2.0 | 0.1 | L/min |

### 5.2 컴포넌트 예시

```tsx
<SliderControl
  label="FiO₂"
  unit="%"
  min={21}
  max={100}
  step={1}
  value={settings.fio2}
  onChange={(fio2) => setSettings((prev) => ({ ...prev, fio2 }))}
/>
```

---

## 6. 중앙 Patient Condition Panel

패널 제목:

```text
환자 상태 (PATIENT CONDITION)
```

중앙에는 침대에 누워 있는 기관삽관 환자 아바타를 배치한다. 흉부는 보이게 하고, 폐 내부가 반투명하게 보이도록 구현한다.

중앙 환자는 정적인 이미지가 아니라, 상태에 따라 다음 요소가 바뀌어야 한다.

```text
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
- 알람 발생 시 환자 주변 경고 glow
```

---

## 7. 2D Patient Avatar 구현 방식

환자 아바타는 가능하면 SVG로 구현한다.

외부 이미지 한 장을 사용하는 것이 아니라, 다음과 같은 레이어로 구성한다.

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

권장 props:

```tsx
<PatientAvatar2D
  visualState={patientVisualState}
  vitals={derivedVitals}
  scenario={scenario}
  isPaused={isPaused}
/>
```

환자 아바타 내부에서는 `visualState`를 기반으로 className 또는 CSS variable을 변경한다.

---

## 8. Patient Visual State 타입

```ts
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
  rightChestReduced: boolean;
  lungColor: 'healthy' | 'inflamed' | 'stiff' | 'collapsed';
  infiltrationOpacity: number;
  secretionOpacity: number;
  tubePressureWarning: boolean;
  alarmGlow: boolean;
};
```

---

## 9. 환자 상태별 시각 변화

### 9.1 안정 상태

```text
condition: stable
expression: calm
skinTone: normal
lipColor: normal
sweat: false
chestMotionSpeed: 1.0
chestMotionAmplitude: 1.0
lungColor: healthy 또는 scenario에 따라 inflamed
alarmGlow: false
```

표현:

```text
- 편안한 표정
- 정상 피부색
- 정상 입술색
- 규칙적인 흉곽 움직임
- 폐 색상 비교적 밝음
```

### 9.2 주의 상태

```text
condition: watch
expression: strained
skinTone: pale
lipColor: normal
sweat: false
chestMotionSpeed: 1.15
chestMotionAmplitude: 1.05
alarmGlow: false
```

표현:

```text
- 약간 찡그린 표정
- 피부가 약간 창백
- 일부 수치 노란색 또는 주의 색상
```

### 9.3 악화 상태

```text
condition: worsening
expression: distressed
skinTone: cyanotic
lipColor: blue
sweat: true
chestMotionSpeed: 1.35
chestMotionAmplitude: 1.2
alarmGlow: true
```

표현:

```text
- 호흡곤란 표정
- 입술 청색증
- 피부 푸른 오버레이
- 땀 표시
- 빠른 흉곽 움직임
- 알람 표시
```

### 9.4 위중 상태

```text
condition: critical
expression: critical
skinTone: severelyCyanotic
lipColor: deepBlue
sweat: true
chestMotionSpeed: 1.5
chestMotionAmplitude: 1.35
alarmGlow: true
```

표현:

```text
- 심한 청색증
- 강한 붉은 알람 glow
- 매우 빠르거나 불안정한 호흡 움직임
- 폐 색상 어둡게 표현
```

---

## 10. 특정 임상 상황별 시각 반응

### 10.1 저산소증

조건:

```text
SpO2 < 88
```

시각 반응:

```text
- 입술 청색증 표시
- 피부 푸른 오버레이 증가
- SpO2 숫자 빨간색
- Low SpO2 알람 표시
- 환자 상태 설명에 “저산소혈증” 포함
```

### 10.2 고탄산혈증

조건:

```text
PaCO2 > 55
```

시각 반응:

```text
- 졸린 표정 또는 눈 반쯤 감김
- CO2 또는 PaCO2 숫자 빨간색
- pH 저하 표시
- High CO2 알람 표시
```

### 10.3 호흡곤란

조건 예시:

```text
SpO2 < 90 또는 totalRR > 28
```

시각 반응:

```text
- 불안한 표정
- 땀 표시
- 흉곽 움직임 속도 증가
- 흉곽 움직임 크기 증가
```

### 10.4 폐렴/ARDS 악화

조건:

```text
scenario: pneumonia 또는 ards
compliance 감소
shunt 증가
```

시각 반응:

```text
- 폐에 흐린 침윤 표시
- 분비물 점 또는 흐림 표시
- compliance 감소 표시
- 산소화 악화 표시
```

### 10.5 튜브 막힘 또는 기도 저항 증가

조건:

```text
PIP > 32 또는 resistance 증가
```

시각 반응:

```text
- 튜브/기도 주변 붉은 강조
- High Peak Pressure 알람 표시
- Flow waveform에서 호기 흐름 지연
```

### 10.6 기흉

조건:

```text
scenario: pneumothorax
```

시각 반응:

```text
- 한쪽 흉곽 움직임 감소
- 한쪽 폐를 더 어둡게 또는 작게 표시
- PIP 상승 가능성 표현
- 상태 설명에 “한쪽 흉곽 움직임 감소” 포함
```

### 10.7 호전

조건 예시:

```text
PEEP 또는 FiO2 조정 후 SpO2 상승
PIP 안정
PaCO2 개선
```

시각 반응:

```text
- 청색증 감소
- 피부색 회복
- 호흡 움직임 안정화
- 알람 감소
- 환자 상태: 회복 중 또는 안정
```

---

## 11. CSS 애니메이션 요구사항

환자 흉곽은 호흡처럼 움직여야 한다.

CSS variable 예시:

```css
.patient-avatar {
  --breath-speed: 1s;
  --breath-scale: 1.04;
  --cyanosis-opacity: 0;
  --sweat-opacity: 0;
  --infiltration-opacity: 0.4;
  --secretion-opacity: 0.5;
  --alarm-glow-opacity: 0;
}

.chest-motion-layer {
  transform-origin: center center;
  animation: chest-breathe var(--breath-speed) ease-in-out infinite;
}

@keyframes chest-breathe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(var(--breath-scale));
  }
}

.patient-avatar.alarm-glow {
  animation: alarm-pulse 0.8s ease-in-out infinite;
}

@keyframes alarm-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 0 rgba(255, 69, 69, 0));
  }
  50% {
    filter: drop-shadow(0 0 18px rgba(255, 69, 69, 0.85));
  }
}
```

상태에 따라 위 CSS variable을 변경한다.

---

## 12. 중앙 상태 카드

중앙 환자 패널 안에는 환자 상태 카드를 표시한다.

표시 항목:

```text
환자 컨디션: 안정 / 주의 / 악화 / 위중
SpO2
PaO2 / FiO2
CO2 또는 PaCO2
순응도 Compliance
기도저항 Resistance
```

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

## 13. 우측 Real-time Monitoring Panel

패널 제목:

```text
실시간 모니터링
```

3개의 waveform 카드를 구현한다.

```text
1. Pressure waveform
2. Flow waveform
3. Volume waveform
```

파형은 정적인 이미지가 아니어야 한다. SVG path, SVG polyline 또는 Canvas를 이용해서 움직이는 것처럼 구현한다.

권장 구현:

```text
- requestAnimationFrame 또는 setInterval 사용
- 최근 N개의 점을 유지
- settings와 vitals 변경 시 amplitude/baseline/shape 변경
- pause 상태에서는 animation 정지
```

---

## 14. Waveform 반응 로직

### 14.1 Pressure waveform

반응 규칙:

```text
- baseline = PEEP
- peak = PIP
- PIP가 높으면 peak가 높아짐
- PEEP가 높으면 baseline이 올라감
- 기도저항 증가 시 peak가 더 뾰족해짐
```

### 14.2 Flow waveform

반응 규칙:

```text
- inspiration은 양수
- expiration은 음수
- Flow 설정이 높으면 inspiratory flow가 커짐
- airway obstruction 상태에서는 expiratory flow tail이 길어짐
```

### 14.3 Volume waveform

반응 규칙:

```text
- inspiration 동안 상승
- expiration 동안 하강
- Tidal Volume 또는 Vte가 높으면 peak 증가
- leak 또는 low compliance 상태에서는 Vte 감소
```

---

## 15. 우측 추가 모니터링

추가 모니터링 카드에는 다음을 표시한다.

```text
SpO2 (%)
HR (/min)
EtCO2 (mmHg)
RR (/min)
```

색상 규칙:

```text
정상 범위: 흰색 또는 청색
주의 범위: 노란색 또는 주황색
위험 범위: 빨간색
```

---

## 16. 하단 Lung Status Panel

패널 제목:

```text
폐 상태 (LUNG STATUS)
```

표시 항목:

```text
작은 폐 SVG 또는 폐 아이콘
Compliance
Resistance
FRC
분비물 정도
```

분비물 정도는 점 또는 bar 형태로 시각화한다.

예시:

```text
분비물: 많음 ●●●●○
```

---

## 17. 하단 Alarm Panel

패널 제목:

```text
알람 (ALARMS)
```

알람은 계산된 배열로 관리한다.

```ts
type AlarmSeverity = 'warning' | 'critical';

type AlarmItem = {
  id: string;
  label: string;
  value: number | string;
  unit: string;
  severity: AlarmSeverity;
};
```

알람 조건:

| 알람 | 조건 | critical 조건 |
|---|---|---|
| Low SpO2 | spo2 < 90 | spo2 < 82 |
| High Peak Pressure | pip > 32 | pip > 40 |
| High CO2 | paco2 > 55 | paco2 > 65 |
| Low Compliance | compliance < 25 | compliance < 18 |
| High Respiratory Rate | totalRR > 28 | totalRR > 34 |
| Low Minute Ventilation | minuteVentilation < 4 | minuteVentilation < 3 |

알람 UI:

```text
- 빨간색 경고 아이콘
- 알람명
- 현재값
- 단위
- critical 알람은 깜빡임 효과
```

---

## 18. 하단 Status Bar

하단 상태바에는 다음을 표시한다.

```text
시뮬레이션 시간
현재 시나리오
환자 정보
환자 상태 버튼
알람 설정 버튼
시나리오 변경 버튼
중지 / 초기화 버튼
```

환자 정보 예시:

```text
성인 / 65kg / 남성 / 기관삽관 상태
```

작은 텍스트로 다음 문구를 표시한다.

```text
교육용 시뮬레이터입니다. 실제 임상 의사결정용으로 사용하지 마세요.
```

---

## 19. 시나리오

시나리오 선택 기능을 구현한다.

최소 5개 시나리오:

```text
1. Normal
2. Pneumonia
3. ARDS
4. Airway Obstruction
5. Pneumothorax
```

TypeScript 타입:

```ts
type ScenarioType =
  | 'normal'
  | 'pneumonia'
  | 'ards'
  | 'airwayObstruction'
  | 'pneumothorax';

type Scenario = {
  type: ScenarioType;
  label: string;
  severity: number;
  baselineCompliance: number;
  baselineResistance: number;
  secretionLevel: number;
  shunt: number;
  frc: number;
  oneSideChestMotionReduced?: boolean;
  description: string;
};
```

시나리오 baseline 예시:

```ts
export const scenarios: Record<ScenarioType, Scenario> = {
  normal: {
    type: 'normal',
    label: 'Normal',
    severity: 0.1,
    baselineCompliance: 55,
    baselineResistance: 8,
    secretionLevel: 0.1,
    shunt: 0.1,
    frc: 2400,
    description: '정상 폐역학에 가까운 안정 시나리오입니다.',
  },
  pneumonia: {
    type: 'pneumonia',
    label: 'Pneumonia',
    severity: 0.65,
    baselineCompliance: 28,
    baselineResistance: 16,
    secretionLevel: 0.7,
    shunt: 0.55,
    frc: 1200,
    description: '폐렴으로 인한 저산소혈증과 분비물 증가 시나리오입니다.',
  },
  ards: {
    type: 'ards',
    label: 'ARDS',
    severity: 0.85,
    baselineCompliance: 18,
    baselineResistance: 14,
    secretionLevel: 0.4,
    shunt: 0.75,
    frc: 900,
    description: '중증 저순응도와 심한 션트를 보이는 ARDS 시나리오입니다.',
  },
  airwayObstruction: {
    type: 'airwayObstruction',
    label: 'Airway Obstruction',
    severity: 0.55,
    baselineCompliance: 38,
    baselineResistance: 30,
    secretionLevel: 0.8,
    shunt: 0.35,
    frc: 1800,
    description: '기도저항 증가와 호기 지연을 보이는 폐쇄성 시나리오입니다.',
  },
  pneumothorax: {
    type: 'pneumothorax',
    label: 'Pneumothorax',
    severity: 0.75,
    baselineCompliance: 20,
    baselineResistance: 18,
    secretionLevel: 0.2,
    shunt: 0.6,
    frc: 1000,
    oneSideChestMotionReduced: true,
    description: '한쪽 흉곽 움직임 감소와 폐허탈을 표현하는 기흉 시나리오입니다.',
  },
};
```

---

## 20. Ventilator Settings 타입

```ts
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
```

초기값:

```ts
export const defaultVentSettings: VentSettings = {
  fio2: 40,
  tidalVolume: 500,
  respiratoryRate: 16,
  peep: 5,
  inspiratoryTime: 1.0,
  flow: 50,
  trigger: 2.0,
  mode: 'AC',
};
```

---

## 21. Derived Vitals 타입

```ts
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
```

---

## 22. 시뮬레이션 계산 로직

계산 로직은 다음 파일에 분리한다.

```text
src/simulation/ventilatorModel.ts
```

UI 컴포넌트 안에 복잡한 계산식을 직접 넣지 않는다.

유틸 함수:

```ts
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
```

교육용 단순 모델로 다음 로직을 구현한다. 실제 임상 모델처럼 완벽할 필요는 없지만, 사용자가 설정을 바꿨을 때 일관성 있게 반응해야 한다.

```ts
export function calculateDerivedVitals(
  settings: VentSettings,
  scenario: Scenario
): DerivedVitals {
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

  const minuteVentilation = (vte * settings.respiratoryRate) / 1000;

  const plateau = settings.peep + settings.tidalVolume / compliance;

  const pip = plateau + resistance * (settings.flow / 60) * 0.45;

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

  const effectiveMinuteVentilation = Math.max(
    1,
    minuteVentilation * (1 - deadspaceFraction)
  );

  const paco2 = clamp(
    Math.round(40 * (4.5 / effectiveMinuteVentilation) + scenario.severity * 8),
    28,
    90
  );

  const ph = clamp(7.4 - Math.max(0, paco2 - 40) * 0.008, 7.05, 7.5);

  const totalRR =
    settings.respiratoryRate + (spo2 < 88 ? 8 : spo2 < 92 ? 4 : 0);

  const heartRate = Math.round(
    78 + Math.max(0, 92 - spo2) * 2.2 + Math.max(0, paco2 - 45) * 0.8
  );

  const etco2 = clamp(Math.round(paco2 - 5), 20, 80);

  return {
    spo2,
    pao2,
    pao2fio2,
    paco2,
    ph: Number(ph.toFixed(2)),
    pip: Number(pip.toFixed(1)),
    plateau: Number(plateau.toFixed(1)),
    vte: Math.round(vte),
    minuteVentilation: Number(minuteVentilation.toFixed(1)),
    totalRR,
    heartRate,
    etco2,
    compliance: Number(compliance.toFixed(1)),
    resistance: Number(resistance.toFixed(1)),
    frc: scenario.frc,
    leak,
  };
}
```

---

## 23. Patient Condition 판정

```ts
export function getPatientCondition(vitals: DerivedVitals): PatientCondition {
  if (vitals.spo2 < 82 || vitals.ph < 7.2 || vitals.pip > 40) {
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

## 24. Patient Visual State 매핑

```ts
export function mapVitalsToVisualState(
  vitals: DerivedVitals,
  scenario: Scenario
): PatientVisualState {
  const condition = getPatientCondition(vitals);

  const baseByCondition: Record<PatientCondition, PatientVisualState> = {
    stable: {
      condition: 'stable',
      expression: 'calm',
      skinTone: 'normal',
      lipColor: 'normal',
      sweat: false,
      chestMotionSpeed: 1.0,
      chestMotionAmplitude: 1.0,
      leftChestReduced: false,
      rightChestReduced: false,
      lungColor: scenario.type === 'normal' ? 'healthy' : 'inflamed',
      infiltrationOpacity: scenario.shunt * 0.5,
      secretionOpacity: scenario.secretionLevel * 0.6,
      tubePressureWarning: false,
      alarmGlow: false,
    },
    watch: {
      condition: 'watch',
      expression: 'strained',
      skinTone: 'pale',
      lipColor: 'normal',
      sweat: false,
      chestMotionSpeed: 1.15,
      chestMotionAmplitude: 1.05,
      leftChestReduced: false,
      rightChestReduced: false,
      lungColor: scenario.type === 'normal' ? 'healthy' : 'inflamed',
      infiltrationOpacity: scenario.shunt * 0.7,
      secretionOpacity: scenario.secretionLevel * 0.7,
      tubePressureWarning: vitals.pip > 28,
      alarmGlow: false,
    },
    worsening: {
      condition: 'worsening',
      expression: 'distressed',
      skinTone: 'cyanotic',
      lipColor: 'blue',
      sweat: true,
      chestMotionSpeed: 1.35,
      chestMotionAmplitude: 1.2,
      leftChestReduced: false,
      rightChestReduced: false,
      lungColor: vitals.compliance < 25 ? 'stiff' : 'inflamed',
      infiltrationOpacity: Math.min(1, scenario.shunt * 0.95),
      secretionOpacity: Math.min(1, scenario.secretionLevel),
      tubePressureWarning: vitals.pip > 32,
      alarmGlow: true,
    },
    critical: {
      condition: 'critical',
      expression: 'critical',
      skinTone: 'severelyCyanotic',
      lipColor: 'deepBlue',
      sweat: true,
      chestMotionSpeed: 1.5,
      chestMotionAmplitude: 1.35,
      leftChestReduced: false,
      rightChestReduced: false,
      lungColor: vitals.compliance < 20 ? 'collapsed' : 'stiff',
      infiltrationOpacity: 1,
      secretionOpacity: Math.min(1, scenario.secretionLevel + 0.2),
      tubePressureWarning: vitals.pip > 32,
      alarmGlow: true,
    },
  };

  const visual = { ...baseByCondition[condition] };

  if (vitals.paco2 > 55) {
    visual.expression = condition === 'critical' ? 'critical' : 'drowsy';
  }

  if (vitals.spo2 < 88) {
    visual.skinTone = vitals.spo2 < 82 ? 'severelyCyanotic' : 'cyanotic';
    visual.lipColor = vitals.spo2 < 82 ? 'deepBlue' : 'blue';
  }

  if (vitals.pip > 32) {
    visual.tubePressureWarning = true;
  }

  if (scenario.type === 'pneumothorax') {
    visual.leftChestReduced = true;
    visual.lungColor = 'collapsed';
  }

  return visual;
}
```

---

## 25. 알람 생성 로직

```ts
export function calculateAlarms(vitals: DerivedVitals): AlarmItem[] {
  const alarms: AlarmItem[] = [];

  if (vitals.spo2 < 90) {
    alarms.push({
      id: 'low-spo2',
      label: 'Low SpO₂',
      value: vitals.spo2,
      unit: '%',
      severity: vitals.spo2 < 82 ? 'critical' : 'warning',
    });
  }

  if (vitals.pip > 32) {
    alarms.push({
      id: 'high-pip',
      label: 'High Peak Pressure',
      value: vitals.pip,
      unit: 'cmH₂O',
      severity: vitals.pip > 40 ? 'critical' : 'warning',
    });
  }

  if (vitals.paco2 > 55) {
    alarms.push({
      id: 'high-co2',
      label: 'High CO₂',
      value: vitals.paco2,
      unit: 'mmHg',
      severity: vitals.paco2 > 65 ? 'critical' : 'warning',
    });
  }

  if (vitals.compliance < 25) {
    alarms.push({
      id: 'low-compliance',
      label: 'Low Compliance',
      value: vitals.compliance,
      unit: 'mL/cmH₂O',
      severity: vitals.compliance < 18 ? 'critical' : 'warning',
    });
  }

  if (vitals.totalRR > 28) {
    alarms.push({
      id: 'high-rr',
      label: 'High Respiratory Rate',
      value: vitals.totalRR,
      unit: '/min',
      severity: vitals.totalRR > 34 ? 'critical' : 'warning',
    });
  }

  if (vitals.minuteVentilation < 4) {
    alarms.push({
      id: 'low-minute-ventilation',
      label: 'Low Minute Ventilation',
      value: vitals.minuteVentilation,
      unit: 'L/min',
      severity: vitals.minuteVentilation < 3 ? 'critical' : 'warning',
    });
  }

  return alarms;
}
```

---

## 26. 상태 설명 문구 생성

`src/simulation/ventilatorModel.ts` 또는 별도 파일에 상태 설명 함수를 만든다.

```ts
export function getConditionMessage(
  vitals: DerivedVitals,
  scenario: Scenario
): string {
  const messages: string[] = [];

  if (vitals.spo2 < 90) {
    messages.push('저산소혈증이 관찰됩니다');
  }

  if (vitals.paco2 > 55) {
    messages.push('CO₂ 상승으로 환기 부족 가능성이 있습니다');
  }

  if (vitals.compliance < 25) {
    messages.push('폐 순응도 감소가 두드러집니다');
  }

  if (vitals.pip > 32) {
    messages.push('기도압 상승으로 튜브 막힘 또는 저순응도 상태를 의심할 수 있습니다');
  }

  if (scenario.type === 'pneumothorax') {
    messages.push('한쪽 흉곽 움직임 감소가 표현됩니다');
  }

  if (messages.length === 0) {
    return '현재 환자는 비교적 안정적인 상태입니다. 설정 변경에 따른 변화를 관찰하세요.';
  }

  return `${messages.join(', ')}. FiO₂, PEEP, 환기량, 분비물 제거 등 처치에 따른 반응을 확인하세요.`;
}
```

---

## 27. Waveform Generator

파형 생성 로직은 다음 파일에 분리한다.

```text
src/simulation/waveformGenerator.ts
```

필요 함수 예시:

```ts
type WavePoint = {
  x: number;
  y: number;
};

export function generatePressureWaveform(
  phase: number,
  vitals: DerivedVitals,
  settings: VentSettings
): number {
  // phase: 0~1 one respiratory cycle
  const inspirationRatio = Math.min(0.6, settings.inspiratoryTime / (60 / settings.respiratoryRate));

  if (phase < inspirationRatio * 0.35) {
    return settings.peep + (vitals.pip - settings.peep) * (phase / (inspirationRatio * 0.35));
  }

  if (phase < inspirationRatio) {
    return vitals.plateau;
  }

  const expPhase = (phase - inspirationRatio) / (1 - inspirationRatio);
  return settings.peep + (vitals.plateau - settings.peep) * Math.exp(-expPhase * 5);
}

export function generateFlowWaveform(
  phase: number,
  settings: VentSettings,
  scenario: Scenario
): number {
  const inspirationRatio = Math.min(0.6, settings.inspiratoryTime / (60 / settings.respiratoryRate));

  if (phase < inspirationRatio) {
    return settings.flow;
  }

  const expPhase = (phase - inspirationRatio) / (1 - inspirationRatio);
  const obstructionFactor = scenario.type === 'airwayObstruction' ? 1.8 : 1;
  return -settings.flow * 0.8 * Math.exp(-expPhase * (3 / obstructionFactor));
}

export function generateVolumeWaveform(
  phase: number,
  vitals: DerivedVitals,
  settings: VentSettings
): number {
  const inspirationRatio = Math.min(0.6, settings.inspiratoryTime / (60 / settings.respiratoryRate));

  if (phase < inspirationRatio) {
    return vitals.vte * (phase / inspirationRatio);
  }

  const expPhase = (phase - inspirationRatio) / (1 - inspirationRatio);
  return vitals.vte * Math.exp(-expPhase * 3.5);
}
```

`WaveformChart`는 위 함수를 이용해 SVG path 또는 polyline을 그린다.

---

## 28. 컴포넌트 구조

가능하면 아래 구조로 구현한다.

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
  assets/
    patient/
    anatomy/
    equipment/
    icons/
  ASSET_CREDITS.md
```

---

## 29. Asset Strategy

이 프로젝트는 에셋 전략이 매우 중요하다.

핵심 원칙:

```text
완성된 환자 그림을 찾는 것이 목표가 아니다.
상태 변화에 반응할 수 있는 SVG 레이어 재료를 확보하는 것이 목표다.
```

우선순위:

```text
1순위: 중앙 환자 아바타는 코드/SVG로 직접 제작
2순위: 폐, 기도, 의료 아이콘만 오픈소스 SVG에서 가져오기
3순위: 배경 장비/침대/튜브는 단순 SVG 또는 CSS로 직접 제작
4순위: 완성된 환자 이미지는 참고용으로만 사용
```

절대 금지:

```text
- 환자 PNG 한 장으로 중앙 아바타 구현
- 저작권 불명확한 구글 이미지 사용
- 유료 스톡 이미지를 라이선스 확인 없이 사용
- 라이선스 표기 없이 Servier/Wikimedia 자료 사용
```

---

## 30. Asset Folder Structure

에셋 폴더는 다음 구조를 따른다.

```text
src/assets/
  patient/
    body.svg
    head.svg
    eyes-normal.svg
    eyes-drowsy.svg
    eyes-distressed.svg
    mouth-normal.svg
    mouth-distressed.svg
    lips-overlay.svg
    skin-cyanosis-overlay.svg
    sweat-overlay.svg
    chest-overlay.svg

  anatomy/
    lungs-base.svg
    lung-left.svg
    lung-right.svg
    airway.svg
    infiltration-overlay.svg
    secretion-overlay.svg

  equipment/
    endotracheal-tube.svg
    ventilator-circuit.svg
    hospital-bed.svg

  icons/
    alarm.svg
    oxygen.svg
    settings.svg
    reset.svg
    help.svg
    pause.svg
```

외부 에셋을 사용하지 않고 코드 기반 SVG로 구현한다면 파일을 만들지 않아도 되지만, 그래도 레이어 구조는 유지해야 한다.

---

## 31. 추천 에셋 소스

사용 가능한 에셋 소스 후보:

### 31.1 Health Icons

용도:

```text
- 의료 UI 아이콘
- 산소 아이콘
- 환자 아이콘
- 경고/알람 아이콘
- 병원/의료 관련 작은 아이콘
```

라이선스:

```text
CC0로 알려져 있으나, 사용 시 공식 페이지와 저장소에서 최신 라이선스를 확인할 것.
```

공식 페이지:

```text
https://healthicons.org/
https://github.com/resolvetosavelives/healthicons
```

### 31.2 Servier Medical Art

용도:

```text
- 폐 구조 참고
- 기도 구조 참고
- 해부학 참고
- 교육용 의료 일러스트 참고
```

라이선스:

```text
CC BY 4.0 기반으로 알려져 있으며, 저작자 표기가 필요하다.
실제 사용 시 공식 페이지의 최신 라이선스와 attribution 가이드를 확인할 것.
```

공식 페이지:

```text
https://smart.servier.com/
https://smart.servier.com/how-to-cite-servier-medical-art/
```

### 31.3 Wikimedia Commons

용도:

```text
- 폐 SVG 참고
- 호흡기계 구조 참고
- public domain 또는 CC 라이선스 자료 참고
```

주의:

```text
Wikimedia Commons는 파일마다 라이선스가 다르다.
반드시 개별 파일 설명 페이지에서 License / Permission / Author / Attribution requirement를 확인해야 한다.
```

공식 페이지:

```text
https://commons.wikimedia.org/
https://commons.wikimedia.org/wiki/Commons:Licensing
```

### 31.4 Lucide Icons

용도:

```text
- 설정 아이콘
- 도움말 아이콘
- 사운드 아이콘
- 리셋 아이콘
- 재생/정지 아이콘
- 차트 아이콘
- 슬라이더 아이콘
```

라이선스:

```text
ISC License로 알려져 있으나, 사용 시 공식 페이지에서 최신 라이선스를 확인할 것.
```

공식 페이지:

```text
https://lucide.dev/
https://lucide.dev/license
```

설치 예시:

```bash
npm install lucide-react
```

### 31.5 Heroicons

용도:

```text
- 일반 UI 아이콘
- 설정/도움말/알림/버튼 아이콘
```

라이선스:

```text
MIT License로 알려져 있으나, 사용 시 공식 페이지 또는 GitHub license를 확인할 것.
```

공식 페이지:

```text
https://heroicons.com/
https://github.com/tailwindlabs/heroicons
```

### 31.6 Tabler Icons

용도:

```text
- 일반 UI 아이콘
- 의료 시뮬레이터 UI 보조 아이콘
```

라이선스:

```text
MIT License로 알려져 있으나, 사용 시 공식 페이지 또는 GitHub license를 확인할 것.
```

공식 페이지:

```text
https://tabler.io/icons
https://github.com/tabler/tabler-icons
```

---

## 32. Asset Credits 파일 필수

외부 에셋을 하나라도 사용하면 반드시 다음 파일을 만든다.

```text
ASSET_CREDITS.md
```

예시:

```md
# Asset Credits

## Health Icons
- Source: Health Icons
- URL: https://healthicons.org/
- License: CC0
- Usage: medical UI icons, oxygen icon, warning icon
- Notes: License checked on YYYY-MM-DD

## Servier Medical Art
- Source: Servier Medical Art by Les Laboratoires Servier
- URL: https://smart.servier.com/
- License: CC BY 4.0
- Usage: anatomy reference / adapted lung illustration
- Attribution: Servier Medical Art by Servier, licensed under CC BY 4.0
- Notes: Attribution required. License checked on YYYY-MM-DD

## Wikimedia Commons
- Source: Wikimedia Commons
- URL: [exact file URL]
- File name: [file name]
- Author: [author]
- License: [file-specific license]
- Usage: lung shape reference or adapted SVG
- Notes: Check each file page. License checked on YYYY-MM-DD

## Lucide Icons
- Source: Lucide Icons
- URL: https://lucide.dev/
- License: ISC License
- Usage: general UI icons
- Notes: License checked on YYYY-MM-DD

## Custom SVG Assets
- Created for this project
- Usage: patient avatar, skin overlays, tube warning, chest motion, lung overlays
```

---

## 33. 에셋 검색 키워드

에셋을 직접 찾을 때는 다음 검색어를 사용한다.

### 33.1 환자 참고용

```text
supine patient vector SVG
intubated patient vector illustration
ICU patient ventilator vector
patient on hospital bed SVG
medical patient avatar SVG
```

주의:

```text
환자 이미지는 참고용으로만 사용한다.
중앙 환자 아바타는 직접 만든 레이어형 SVG로 구현한다.
```

### 33.2 폐/기도 참고용

```text
human lungs SVG public domain
respiratory system SVG
trachea bronchi lungs SVG
lung anatomy vector SVG
alveoli SVG medical illustration
```

### 33.3 벤틸레이터/ICU 참고용

```text
ventilator icon SVG
medical monitor SVG
ICU monitor icon SVG
oxygen mask SVG
endotracheal tube illustration
hospital bed SVG
```

### 33.4 UI 아이콘

```text
settings svg icon
sliders svg icon
bell alarm svg icon
activity waveform svg icon
heart rate svg icon
pause reset svg icon
```

---

## 34. 구현 중 반드시 지킬 점

```text
- 환자 아바타는 state-driven이어야 한다.
- 슬라이더 변경 즉시 derivedVitals가 갱신되어야 한다.
- derivedVitals 변경 즉시 patientVisualState가 갱신되어야 한다.
- patientVisualState 변경 즉시 2D 환자 아바타가 바뀌어야 한다.
- 파형은 설정값과 환자 상태에 따라 shape가 달라져야 한다.
- 알람은 조건에 따라 자동으로 추가/제거되어야 한다.
- 시나리오 변경 시 baseline 값과 환자 외형이 바뀌어야 한다.
- 중지 버튼은 파형 애니메이션을 pause/resume해야 한다.
- 초기화 버튼은 기본 설정값과 기본 시나리오로 복귀해야 한다.
```

---

## 35. Acceptance Tests

완성 후 다음 테스트를 직접 확인한다.

### Test 1. FiO2 반응

```text
FiO2를 올리면 SpO2가 상승한다.
SpO2가 좋아지면 청색증이 줄어든다.
Low SpO2 알람이 조건에 따라 사라진다.
```

### Test 2. PEEP 반응

```text
PEEP를 적절히 올리면 산소화가 좋아진다.
PEEP를 너무 높이면 PIP가 상승한다.
PIP가 높으면 High Peak Pressure 알람과 튜브 강조가 나타난다.
```

### Test 3. 환기량 반응

```text
Tidal Volume 또는 RR을 낮추면 minute ventilation이 낮아진다.
minute ventilation이 낮아지면 PaCO2가 상승한다.
PaCO2가 높으면 환자 표정이 drowsy 또는 distressed로 변한다.
```

### Test 4. Airway Obstruction

```text
Airway Obstruction 시나리오에서는 resistance가 높다.
PIP가 높다.
Flow waveform의 expiration tail이 길어진다.
튜브 또는 airway 쪽 경고 강조가 나타난다.
```

### Test 5. Pneumonia / ARDS

```text
Pneumonia 또는 ARDS 시나리오에서는 폐 침윤이 보인다.
Compliance가 낮다.
산소화가 나쁘다.
환자 상태가 watch/worsening/critical로 갈 수 있다.
```

### Test 6. 저산소증 시각화

```text
SpO2가 낮으면 환자 입술이 파랗게 변한다.
피부에 푸른 오버레이가 생긴다.
Low SpO2 알람이 뜬다.
```

### Test 7. 고압 알람

```text
PIP가 높으면 튜브/기도 쪽에 붉은 강조가 나타난다.
High Peak Pressure 알람이 뜬다.
Pressure waveform peak가 높아진다.
```

### Test 8. 상태 단계 변화

```text
stable, watch, worsening, critical 단계가 바뀔 때
표정, 피부색, 입술색, 폐 상태, 흉곽 움직임, 알람 glow가 함께 바뀐다.
```

### Test 9. Pneumothorax

```text
Pneumothorax 시나리오에서는 한쪽 흉곽 움직임이 줄어든다.
한쪽 폐가 어둡거나 작게 표현된다.
상태 설명에 기흉 관련 표현이 나타난다.
```

---

## 36. 최종 제출 전 체크리스트

```text
[ ] npm install 성공
[ ] npm run dev 성공
[ ] TypeScript 에러 없음
[ ] 브라우저 콘솔 에러 없음
[ ] 1280px 이상에서 3열 레이아웃 유지
[ ] 중앙 환자 아바타가 고정 이미지가 아님
[ ] 환자 표정이 상태에 따라 바뀜
[ ] 입술 청색증이 SpO2에 따라 바뀜
[ ] 피부색 overlay가 상태에 따라 바뀜
[ ] 땀 표시가 악화 상태에서 나타남
[ ] 흉곽 움직임이 RR/상태에 따라 바뀜
[ ] 폐 침윤/분비물 overlay가 시나리오에 따라 바뀜
[ ] 튜브 압력 경고가 PIP에 따라 바뀜
[ ] Pressure/Flow/Volume 파형이 움직임
[ ] 알람이 조건에 따라 자동 생성/제거됨
[ ] 시나리오 변경 기능 있음
[ ] 초기화 버튼 있음
[ ] 중지/재생 버튼 있음
[ ] ASSET_CREDITS.md 있음
[ ] 교육용 시뮬레이터 고지 문구 있음
```

---

## 37. Codex에게 주는 최종 강조 문장

```text
첨부 이미지를 참고해서 같은 분위기의 UI를 구현하되, 핵심은 이미지 재현이 아니라 환자 컨디션에 따라 중앙 2D 환자가 변하는 벤틸레이터 시뮬레이터입니다.

중앙 환자는 절대 고정 이미지가 아니어야 합니다.
환자 몸통, 얼굴, 눈, 입술, 피부색, 땀, 흉곽 움직임, 폐 상태, 튜브 경고, 알람 glow를 모두 상태 기반 레이어로 구현하세요.

사용자가 FiO2, Tidal Volume, RR, PEEP, Flow, Trigger 또는 시나리오를 바꾸면 숫자뿐 아니라 환자 모습, 폐 상태, 파형, 알람, 상태 설명이 즉시 바뀌어야 합니다.

완성된 정적 목업이 아니라 실제로 동작하는 인터랙티브 교육용 시뮬레이터로 만들어주세요.
```

---

## 38. 실행 방법 안내 형식

완성 후 README 또는 응답에 다음 형식으로 실행 방법을 알려준다.

```bash
npm install
npm run dev
```

그리고 다음을 함께 안내한다.

```text
브라우저에서 표시되는 로컬 주소로 접속하세요.
좌측 설정 슬라이더와 하단 시나리오 선택을 조작하면 중앙 환자 아바타와 파형, 알람이 실시간으로 반응합니다.
```
