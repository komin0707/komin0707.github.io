import type { Scenario } from './scenarios';
import type { DerivedVitals, PatientCondition } from './ventilatorTypes';

export function getConditionLabel(condition: PatientCondition) {
  return {
    stable: '안정',
    watch: '주의',
    worsening: '악화',
    critical: '위중',
  }[condition];
}

export function describeState(vitals: DerivedVitals, scenario: Scenario, condition: PatientCondition) {
  const fragments: string[] = [];

  if (vitals.spo2 < 90) fragments.push('저산소혈증');
  if (vitals.paco2 > 55) fragments.push('고탄산혈증');
  if (vitals.compliance < 25) fragments.push('폐 순응도 감소');
  if (vitals.pip > 32) fragments.push('기도압 상승');
  if (scenario.secretionLevel > 0.5) fragments.push('분비물 증가');
  if (scenario.type === 'pneumothorax') fragments.push('한쪽 흉곽 움직임 감소');

  if (fragments.length === 0) {
    return `${scenario.description} 현재 환자는 비교적 안정적인 상태입니다. 설정 변경에 따른 변화를 관찰하세요.`;
  }

  const advice =
    condition === 'critical'
      ? '즉각적인 환기 전략 재평가와 원인 교정이 필요할 수 있습니다.'
      : 'PEEP, FiO2, 환기량 조정과 분비물 제거를 고려할 수 있습니다.';

  return `${fragments.join(', ')} 상태입니다. ${advice}`;
}
