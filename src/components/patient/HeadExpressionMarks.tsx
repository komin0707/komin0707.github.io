import type { PatientVisualState } from '@/simulation/ventilatorModel';
import { PATIENT_AVATAR_PALETTE } from './patientAvatarPalette';

type HeadExpressionMarksProps = {
  ageLineOpacity: number;
  critical: boolean;
  droolOpacity: number;
  drowsy: boolean;
  feverFlushOpacity: number;
  foreheadWrinkleOpacity: number;
  jawWidth: number;
  lipColor: string;
  mouthOpeningOpacity: number;
  mouthOpeningPath: string;
  mouthPath: string;
  nasalFlareOpacity: number;
  reducedConsciousness: boolean;
  strained: boolean;
  stressed: boolean;
  tongueOpacity: number;
  visualState: PatientVisualState;
};

export function HeadExpressionMarks({
  ageLineOpacity,
  critical,
  droolOpacity,
  drowsy,
  feverFlushOpacity,
  foreheadWrinkleOpacity,
  jawWidth,
  lipColor,
  mouthOpeningOpacity,
  mouthOpeningPath,
  mouthPath,
  nasalFlareOpacity,
  reducedConsciousness,
  strained,
  stressed,
  tongueOpacity,
  visualState,
}: HeadExpressionMarksProps) {
  const gumColor = critical ? '#7860a3' : '#b97873';
  const tongueColor = critical ? '#7447a1' : '#c7787c';

  // prettier-ignore
  return (
    <>
      <path className="fever-nasal-flush" d="M181 140 C187 137 200 137 206 141" fill="none" opacity={feverFlushOpacity} stroke="#e66b5d" strokeLinecap="round" strokeWidth="2.2" />
      <path className="brow left-brow" d={critical ? 'M144 113 C157 103 175 104 190 113' : stressed ? 'M144 112 C157 104 174 104 189 111' : strained ? 'M144 111 C157 106 175 106 190 112' : drowsy ? 'M145 116 C159 119 174 119 188 116' : 'M145 111 C160 107 176 107 190 111'} fill="none" stroke="#241713" strokeLinecap="round" strokeWidth={critical ? 3.4 : 3} />
      <path className="brow right-brow" d={critical || stressed ? 'M202 113 C211 106 221 108 228 116' : strained ? 'M202 112 C211 107 221 108 228 114' : 'M202 111 C211 108 221 108 229 112'} fill="none" stroke="#241713" strokeLinecap="round" strokeWidth="2.8" opacity={reducedConsciousness ? 0.38 : 1} />
      <path className="brow-head-tail left" d="M145 111 C150 109 154 108 159 108 M181 109 C185 110 188 111 190 112" fill="none" stroke="#2d1b16" strokeLinecap="round" strokeOpacity="0.58" strokeWidth="0.8" />
      <path className="brow-head-tail right" d="M202 111 C206 109 209 109 213 109 M224 110 C227 111 229 112 230 113" fill="none" stroke="#2d1b16" strokeLinecap="round" strokeOpacity="0.48" strokeWidth="0.75" />
      <path className="forehead-wrinkle" d="M156 101 C171 97 194 98 211 102" fill="none" opacity={foreheadWrinkleOpacity} stroke="#6f4037" strokeLinecap="round" strokeWidth="1.4" />
      <path className="age-line" d="M148 92 C162 88 178 88 193 91 M202 91 C216 89 229 92 239 99" fill="none" opacity={ageLineOpacity} stroke="#6f4037" strokeLinecap="round" strokeWidth="1.1" />
      <path className="glabellar-crease" d="M188 108 C190 114 190 119 188 125 M196 108 C194 114 194 119 196 125" fill="none" opacity={foreheadWrinkleOpacity} stroke="#5c342f" strokeLinecap="round" strokeWidth="1.4" />
      <path className="nose-bridge" d="M190 116 C196 127 196 138 188 147" fill="none" stroke="#925b50" strokeLinecap="round" strokeWidth="1.7" />
      <path className="nose-ridge-highlight" d="M194 118 C198 128 198 138 193 145" fill="none" stroke="#ffd0bd" strokeLinecap="round" strokeOpacity="0.34" strokeWidth="1" />
      <ellipse className="nose-tip" cx="194" cy="146" rx="8.8" ry="5.5" fill="#c98773" opacity="0.34" stroke="#8c5449" strokeOpacity="0.26" strokeWidth="0.7" />
      <path className="nostril-line" d="M181 146 C187 149 199 149 206 145" fill="none" stroke="#8c5449" strokeLinecap="round" strokeOpacity="0.42" strokeWidth="1.5" />
      <ellipse className="nostril left" cx="185" cy="147.6" rx="2.5" ry="1.15" fill="#51302a" opacity="0.52" />
      <ellipse className="nostril right" cx="202" cy="147.2" rx="2.3" ry="1.05" fill="#51302a" opacity="0.48" />
      <path className="philtrum-shadow" d="M190 148 C190 152 189 155 186 158 M197 148 C197 152 199 155 202 158" fill="none" stroke="#8c5449" strokeLinecap="round" strokeOpacity="0.34" strokeWidth="1.1" />
      <path className="philtrum-groove" d="M194 149 C194 153 194 156 194 159" fill="none" stroke="#6f4037" strokeLinecap="round" strokeOpacity="0.22" strokeWidth="0.8" />
      <path className="nasal-flare left" d="M178 142 C174 144 172 148 174 151" fill="none" opacity={nasalFlareOpacity} stroke="#5c342f" strokeLinecap="round" strokeWidth="1.7" />
      <path className="nasal-flare right" d="M205 142 C210 144 212 148 209 151" fill="none" opacity={nasalFlareOpacity} stroke="#5c342f" strokeLinecap="round" strokeWidth="1.7" />
      <path className="mouth-opening" d={mouthOpeningPath} fill="#27120f" opacity={mouthOpeningOpacity} stroke="#4a2620" strokeOpacity="0.32" strokeWidth="0.8" />
      <path className="oral-mucosa" d="M172 158 C185 164 204 164 216 158 C204 169 185 170 172 158Z" fill="#7f2e35" opacity={mouthOpeningOpacity * 0.58} stroke="none" />
      <path className="gum-line" d="M178 157 C188 160 202 160 213 157" fill="none" opacity={mouthOpeningOpacity * 0.72} stroke={gumColor} strokeLinecap="round" strokeWidth="1.1" />
      <rect className="intubation-tooth tooth-left" x="184" y="155" width="4.2" height="3.6" rx="0.8" fill="#f5efe2" opacity={mouthOpeningOpacity * 0.86} stroke="#a87e69" strokeOpacity="0.34" strokeWidth="0.3" />
      <rect className="intubation-tooth tooth-mid" x="190" y="155.4" width="4.4" height="3.4" rx="0.8" fill="#f6f0e5" opacity={mouthOpeningOpacity * 0.9} stroke="#a87e69" strokeOpacity="0.34" strokeWidth="0.3" />
      <rect className="intubation-tooth tooth-right" x="196.2" y="155.2" width="4.1" height="3.5" rx="0.8" fill="#f5efe2" opacity={mouthOpeningOpacity * 0.84} stroke="#a87e69" strokeOpacity="0.34" strokeWidth="0.3" />
      <path className="tongue-edge" d="M181 164 C190 168 204 168 212 162" fill="none" opacity={tongueOpacity} stroke={tongueColor} strokeLinecap="round" strokeWidth="2.1" />
      <path className="upper-lip-volume" d="M166 155 C178 149 188 152 193 156 C200 151 209 152 219 158" fill="none" stroke="#8e4e4b" strokeLinecap="round" strokeOpacity="0.56" strokeWidth="2" />
      <path className="mouth-line" d={mouthPath} fill="none" stroke={lipColor} strokeLinecap="round" strokeWidth={critical ? 5.6 : 5} />
      <path className="lower-lip-volume" d="M170 160 C184 166 204 166 218 159" fill="none" stroke={lipColor} strokeLinecap="round" strokeOpacity="0.46" strokeWidth="2.4" />
      <path className="cupid-bow" d="M182 153 C187 150 191 151 194 155 C198 151 203 151 207 154" fill="none" stroke="#6c3938" strokeLinecap="round" strokeOpacity="0.44" strokeWidth="0.9" />
      <path className="drool-line" d="M215 162 C220 172 218 181 212 189" fill="none" opacity={droolOpacity} stroke="#b8e8ff" strokeLinecap="round" strokeWidth="1.4" />
      <path className="facial-state-marker" d="M139 149 C148 157 158 160 171 160 M224 151 C217 159 207 163 194 162" fill="none" stroke={critical ? PATIENT_AVATAR_PALETTE.skin.facialDistressCritical : PATIENT_AVATAR_PALETTE.skin.facialDistress} strokeLinecap="round" strokeOpacity={visualState.condition === 'stable' ? 0.12 : 0.42} strokeWidth={jawWidth} />
      <g className="sweat">
        <path className="sweat-drop-shape drop-a" d="M137 105 C145 116 145 124 138 130 C130 124 131 115 137 105Z" fill="#98d8ff" stroke="#d8f2ff" strokeWidth="0.8" />
        <path className="sweat-shine" d="M137 111 C140 116 140 121 137 124" fill="none" stroke="#f8fcff" strokeLinecap="round" strokeOpacity="0.72" strokeWidth="0.7" />
        <path className="sweat-drop-shape drop-b" d="M231 103 C239 114 239 122 232 128 C224 122 225 113 231 103Z" fill="#98d8ff" stroke="#d8f2ff" strokeWidth="0.8" />
        <path className="sweat-shine" d="M231 109 C234 114 234 119 231 122" fill="none" stroke="#f8fcff" strokeLinecap="round" strokeOpacity="0.72" strokeWidth="0.7" />
        <path className="sweat-drop-shape drop-c" d="M191 97 C197 107 196 114 190 119 C184 113 185 105 191 97Z" fill="#98d8ff" stroke="#d8f2ff" strokeWidth="0.7" />
        <path className="sweat-flow-line temple" d="M236 117 C239 130 237 143 231 154" fill="none" stroke="#b8e8ff" strokeLinecap="round" strokeOpacity="0.42" strokeWidth="0.9" />
        <path className="sweat-flow-line philtrum" d="M193 151 C191 159 190 165 186 171" fill="none" stroke="#b8e8ff" strokeLinecap="round" strokeOpacity="0.34" strokeWidth="0.85" />
      </g>
    </>
  );
}
