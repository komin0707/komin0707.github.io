# Simulation Logic

## Inputs

The model combines ventilator settings with one selected scenario from `src/simulation/scenarios.ts`.
Settings are clamped and checked for finite numeric values before calculations in `src/simulation/vitals.ts`.

## Outputs

`calculateSimulation` returns:

- `vitals`: oxygenation, ventilation, pressure, compliance, resistance, and volume values.
- `condition`: `stable`, `watch`, `worsening`, or `critical`.
- `visualState`: patient avatar state such as skin tone, expression, lung color, and tube warning.
- `alarms`: generated alarm rows.
- `description`: Korean clinical status summary.

## Module Boundaries

- `vitals.ts`: numeric physiology model.
- `visualState.ts`: condition thresholds and patient visualization mapping.
- `alarms.ts`: alarm generation.
- `conditionMessages.ts`: labels and human-readable summaries.
- `ventilatorModel.ts`: compatibility facade that assembles the modules.

## Educational Formulas

The formulas are intentionally simplified for training feedback, not diagnosis:

- Minute ventilation: `tidalVolume * respiratoryRate / 1000`.
- Oxygenation trend: scenario severity, FiO2, PEEP, and shunt burden determine SpO2 and PaO2/FiO2 direction.
- Pressure trend: tidal volume, compliance, resistance, PEEP, and flow determine PIP and plateau pressure.
- Ventilation trend: minute ventilation and dead-space burden determine PaCO2, EtCO2, and pH direction.

## Formula Sources And Constants

| Model area | Source basis | Implementation notes |
| --- | --- | --- |
| ARDS severity and PaO2/FiO2 direction | Berlin Definition and mechanical ventilation teaching references | The simulator maps severity and shunt to broad PaO2/FiO2 bands rather than diagnostic criteria. |
| Compliance, resistance, and pressure | Tobin, Principles and Practice of Mechanical Ventilation | Constants in `src/simulation/vitals.ts` keep values in bedside-teaching ranges. |
| Alarm thresholds | AARC ventilator monitoring and alarm-safety guidance | Defaults in `src/simulation/alarmDefinitions.ts` are educational warning thresholds, not device settings. |
| Perfusion and shock context | Surviving Sepsis Campaign guidance | Heart rate and perfusion labels are qualitative context for scenario feedback. |

Magic-number ranges are centralized in scenario presets, alarm thresholds, and `calculateVitals` clamps. They intentionally bound the teaching model to plausible adult ICU values and should be changed only with a matching reference update.

## References

- ARDS Definition Task Force. Acute respiratory distress syndrome: the Berlin Definition. JAMA. 2012.
- Tobin MJ. Principles and Practice of Mechanical Ventilation. McGraw-Hill.
- AARC Clinical Practice Guidelines for ventilator monitoring and alarm safety.
- Surviving Sepsis Campaign guidelines for general shock and perfusion context.
