import { useId } from 'react';
import { APP_COPY, type AppLocale } from '@/lib';
import { SCENARIOS, type ScenarioType } from '@/simulation/scenarios';
import { isScenarioType } from '@/simulation/typeGuards';

type ScenarioSelectorProps = {
  locale?: AppLocale;
  onChange: (scenario: ScenarioType) => void;
  value: ScenarioType;
};

export function ScenarioSelector({ locale = 'ko', onChange, value }: ScenarioSelectorProps) {
  const selectId = useId();
  const label = APP_COPY[locale].bottomBar.scenario;
  const handleChange = (nextValue: string) => {
    if (isScenarioType(nextValue)) onChange(nextValue);
  };

  return (
    <label className="scenario-select" htmlFor={selectId}>
      <span>{label}</span>
      <select id={selectId} value={value} onChange={(event) => handleChange(event.target.value)}>
        {Object.values(SCENARIOS).map((scenario) => (
          <option key={scenario.type} value={scenario.type}>
            {locale === 'ko' ? scenario.koreanLabel : scenario.label}
          </option>
        ))}
      </select>
    </label>
  );
}
