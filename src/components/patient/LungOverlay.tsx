import type { CSSProperties } from 'react';
import type { Scenario } from '@/simulation/scenarios';
import type { PatientVisualState } from '@/simulation/ventilatorModel';

type LungOverlayProps = {
  side: 'left' | 'right';
  scenario: Scenario;
  visualState: PatientVisualState;
};

/** Renders one lung field with scenario-specific collapse, infiltration, and secretion cues. */
export function LungOverlay({ side, scenario, visualState }: LungOverlayProps) {
  const isCollapsed = scenario.type === 'pneumothorax' && side === 'left';
  return (
    <g
      className={`lung-detail ${side} ${visualState.lungColor} ${isCollapsed ? 'collapsed' : ''}`}
      style={
        {
          '--infiltration-opacity': visualState.infiltrationOpacity,
          '--secretion-opacity': visualState.secretionOpacity,
        } as CSSProperties
      }
    >
      <path
        className="lung-fill"
        d={
          side === 'left'
            ? 'M193 261 C150 283 132 335 140 397 C145 432 176 431 206 406 C234 383 234 335 222 293 C216 274 207 263 193 261Z'
            : 'M287 261 C330 283 348 335 340 397 C335 432 304 431 274 406 C246 383 246 335 258 293 C264 274 273 263 287 261Z'
        }
      />
      <path
        className="bronchi"
        d={
          side === 'left'
            ? 'M235 238 C218 260 207 287 197 321 M199 317 C181 333 168 355 160 383 M205 330 C195 350 193 372 196 397'
            : 'M245 238 C262 260 273 287 283 321 M281 317 C299 333 312 355 320 383 M275 330 C285 350 287 372 284 397'
        }
      />
      <path
        className="infiltrate"
        d={
          side === 'left'
            ? 'M169 311 C187 290 218 307 220 334 C222 362 191 376 169 359 C150 345 151 326 169 311Z'
            : 'M311 311 C293 290 262 307 260 334 C258 362 289 376 311 359 C330 345 329 326 311 311Z'
        }
      />
      {[0, 1, 2, 3, 4].map((item) => (
        <circle
          className="secretion"
          cx={(side === 'left' ? 168 : 312) + item * (side === 'left' ? 10 : -10)}
          cy={318 + (item % 3) * 23}
          key={item}
          r={3 + (item % 2)}
        />
      ))}
    </g>
  );
}
