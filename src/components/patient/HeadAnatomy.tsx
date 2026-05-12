import { PATIENT_AVATAR_PALETTE } from './patientAvatarPalette';
import type { PatientAvatarProfile } from './patientAvatarGeometry';

type HeadAnatomyProps = {
  feverFlushOpacity: number;
  hairFill: string;
  hairHighlightFill: string;
  jaundiceOpacity: number;
  pallorOpacity: number;
  profile: PatientAvatarProfile;
};

export function HeadAnatomy({
  feverFlushOpacity,
  hairFill,
  hairHighlightFill,
  jaundiceOpacity,
  pallorOpacity,
  profile,
}: HeadAnatomyProps) {
  const grayStrandOpacity = profile.hairColor === 'gray' || profile.ageGroup === 'olderAdult' ? 0.64 : 0.18;
  const recessionOpacity =
    profile.sexPresentation === 'male' || profile.ageGroup === 'olderAdult' ? 0.72 : 0.28;

  // prettier-ignore
  return (
    <>
      <path className="neck-column" d="M179 162 C190 168 211 168 223 161 L226 203 C211 217 184 215 173 200Z" fill="url(#skinClinical)" stroke="#7b463e" strokeOpacity="0.24" strokeWidth="1.6" />
      <path className="skin-overlay" d="M179 162 C190 168 211 168 223 161 L226 203 C211 217 184 215 173 200Z" fill={PATIENT_AVATAR_PALETTE.skin.cyanosisOverlay} stroke="none" />
      <path className="neck-muscle left-sternocleidomastoid" d="M181 166 C174 181 173 193 178 205" fill="none" stroke="#8c554c" strokeLinecap="round" strokeOpacity="0.32" strokeWidth="1.4" />
      <path className="neck-muscle right-sternocleidomastoid" d="M219 166 C225 180 225 192 220 204" fill="none" stroke="#8c554c" strokeLinecap="round" strokeOpacity="0.28" strokeWidth="1.3" />
      <path className="adam-apple" d="M198 177 C202 181 202 187 198 191 C194 187 194 181 198 177Z" fill="#a96d5d" opacity="0.28" stroke="#7b463e" strokeOpacity="0.22" strokeWidth="0.7" />
      <ellipse className="head-ear left-ear" cx="124" cy="118" rx="12" ry="20" fill="#bd7a67" stroke="#7b463e" strokeOpacity="0.24" strokeWidth="1.2" />
      <ellipse className="head-ear right-ear" cx="242" cy="121" rx="10" ry="18" fill="#bd7a67" stroke="#7b463e" strokeOpacity="0.18" strokeWidth="1.1" />
      <path className="ear-helix left" d="M122 101 C112 110 113 128 123 139 C132 131 132 111 122 101Z" fill="none" stroke="#7f4b40" strokeLinecap="round" strokeOpacity="0.46" strokeWidth="1.4" />
      <path className="ear-helix right" d="M244 105 C251 115 250 130 242 138 C236 130 237 114 244 105Z" fill="none" stroke="#7f4b40" strokeLinecap="round" strokeOpacity="0.36" strokeWidth="1.2" />
      <ellipse className="ear-lobe left" cx="124" cy="136" rx="4.2" ry="5.2" fill="#b97664" stroke="#7b463e" strokeOpacity="0.22" strokeWidth="0.7" />
      <ellipse className="ear-lobe right" cx="242" cy="136" rx="3.6" ry="4.5" fill="#b97664" stroke="#7b463e" strokeOpacity="0.2" strokeWidth="0.7" />
      <path className="ear-fold left" d="M121 111 C128 118 128 126 121 132" fill="none" stroke="#875145" strokeLinecap="round" strokeOpacity="0.38" strokeWidth="1.3" />
      <path className="ear-fold right" d="M244 114 C239 121 239 127 244 132" fill="none" stroke="#875145" strokeLinecap="round" strokeOpacity="0.25" strokeWidth="1.2" />
      <path className="face-oval" d="M126 88 C132 53 163 34 195 38 C226 42 247 67 248 101 C251 136 232 164 204 176 C171 188 139 170 126 139 C119 122 119 103 126 88Z" fill="url(#skinClinical)" stroke="#6f3e38" strokeOpacity="0.24" strokeWidth="1.8" />
      <path className="face-asymmetry-contour left" d="M130 94 C123 112 126 136 139 154 C151 171 169 181 190 181" fill="none" stroke="#7f4c43" strokeLinecap="round" strokeOpacity="0.26" strokeWidth="1.1" />
      <path className="face-asymmetry-contour right" d="M247 96 C253 119 246 146 228 163 C216 174 203 180 191 181" fill="none" stroke="#7f4c43" strokeLinecap="round" strokeOpacity="0.18" strokeWidth="0.9" />
      <path className="cheekbone-shadow left" d="M144 135 C156 130 170 130 184 137" fill="none" stroke="#8d574d" strokeLinecap="round" strokeOpacity="0.22" strokeWidth="2" />
      <path className="cheekbone-shadow right" d="M206 137 C216 132 227 133 237 141" fill="none" stroke="#8d574d" strokeLinecap="round" strokeOpacity="0.18" strokeWidth="1.8" />
      <path className="chin-shadow" d="M171 168 C184 178 204 179 219 166" fill="none" stroke="#7e4b43" strokeLinecap="round" strokeOpacity="0.28" strokeWidth="2" />
      <path className="skin-overlay face-overlay" d="M126 88 C132 53 163 34 195 38 C226 42 247 67 248 101 C251 136 232 164 204 176 C171 188 139 170 126 139 C119 122 119 103 126 88Z" fill={PATIENT_AVATAR_PALETTE.skin.cyanosisOverlay} stroke="none" />
      <path className="pallor-wash face" d="M126 88 C132 53 163 34 195 38 C226 42 247 67 248 101 C251 136 232 164 204 176 C171 188 139 170 126 139 C119 122 119 103 126 88Z" fill="rgba(238, 241, 220, 0.42)" opacity={pallorOpacity} stroke="none" />
      <path className="jaundice-wash face" d="M126 88 C132 53 163 34 195 38 C226 42 247 67 248 101 C251 136 232 164 204 176 C171 188 139 170 126 139 C119 122 119 103 126 88Z" fill={PATIENT_AVATAR_PALETTE.skin.jaundiceOverlay} opacity={jaundiceOpacity} stroke="none" />
      <path className="fever-flush-wash face" d="M139 126 C151 116 172 116 185 130 C174 145 151 146 139 126Z M207 129 C218 119 234 121 240 137 C229 148 213 146 207 129Z" fill="#e66b5d" opacity={feverFlushOpacity} stroke="none" />
      <path className="forehead-flush" d="M151 86 C171 78 204 79 228 92 C212 103 171 102 151 86Z" fill="#e66b5d" opacity={feverFlushOpacity * 0.46} stroke="none" />
      <path className="face-highlight" d="M139 84 C150 65 171 55 194 57 C218 59 236 75 242 99" fill="none" stroke="#ffd4c3" strokeLinecap="round" strokeOpacity="0.34" strokeWidth="3" />
      <path className="hair-mass" d="M120 93 C126 51 162 28 203 36 C235 42 256 69 253 106 C234 83 204 71 168 75 C146 77 131 84 120 93Z" fill={hairFill} stroke="#15120d" strokeOpacity="0.38" strokeWidth="1" />
      <path className="hairline-shape" d="M126 94 C139 78 158 70 177 70 C186 64 200 64 212 71 C229 74 242 86 251 105" fill="none" stroke="#1d1711" strokeLinecap="round" strokeOpacity="0.52" strokeWidth="2" />
      <path className="m-recession" d="M150 73 C162 61 175 62 184 72 M204 72 C216 63 229 67 238 83" fill="none" opacity={recessionOpacity} stroke="#211a13" strokeLinecap="round" strokeWidth="1.5" />
      <path className="hair-highlight" d="M136 82 C160 64 200 62 232 85 C213 60 171 52 142 68 C132 74 126 83 121 95Z" fill={hairHighlightFill} stroke="#15120d" strokeOpacity="0.26" strokeWidth="1" />
      <path className="hair-strand" d="M139 81 C158 65 184 58 210 62" fill="none" stroke="#5b4938" strokeLinecap="round" strokeOpacity="0.5" strokeWidth="1.6" />
      <path className="hair-strand" d="M154 67 C176 57 206 58 230 78" fill="none" stroke="#5b4938" strokeLinecap="round" strokeOpacity="0.46" strokeWidth="1.4" />
      <path className="hair-strand" d="M125 92 C141 78 160 72 183 73" fill="none" stroke="#5b4938" strokeLinecap="round" strokeOpacity="0.44" strokeWidth="1.4" />
      <path className="hair-strand" d="M208 61 C227 69 240 84 248 105" fill="none" stroke="#5b4938" strokeLinecap="round" strokeOpacity="0.42" strokeWidth="1.4" />
      <path className="hair-flow-lock" d="M132 88 C148 80 154 76 163 68" fill="none" stroke={hairHighlightFill} strokeLinecap="round" strokeOpacity="0.5" strokeWidth="1.2" />
      <path className="hair-flow-lock" d="M177 64 C188 55 204 55 219 66" fill="none" stroke={hairHighlightFill} strokeLinecap="round" strokeOpacity="0.44" strokeWidth="1.2" />
      <path className="hair-flow-lock" d="M231 81 C240 89 246 98 250 110" fill="none" stroke={hairHighlightFill} strokeLinecap="round" strokeOpacity="0.38" strokeWidth="1.1" />
      <path className="hair-disarray flyaway-left" d="M139 66 C129 57 125 49 126 39" fill="none" stroke={hairHighlightFill} strokeLinecap="round" strokeOpacity="0.42" strokeWidth="0.9" />
      <path className="hair-disarray flyaway-right" d="M229 70 C242 62 249 55 251 45" fill="none" stroke={hairHighlightFill} strokeLinecap="round" strokeOpacity="0.36" strokeWidth="0.85" />
      <path className="short-hair-length" d="M122 92 C134 73 154 65 176 66 M215 67 C233 73 247 88 253 106" fill="none" stroke="#18130f" strokeLinecap="round" strokeOpacity="0.42" strokeWidth="1.1" />
      <path className="gray-hair-strand" d="M143 79 C157 69 175 64 192 64" fill="none" opacity={grayStrandOpacity} stroke="#d3d7d8" strokeLinecap="round" strokeWidth="0.9" />
      <path className="gray-hair-strand" d="M203 62 C216 67 226 75 235 88" fill="none" opacity={grayStrandOpacity} stroke="#d3d7d8" strokeLinecap="round" strokeWidth="0.85" />
      <path className="scalp-shadow" d="M162 72 C179 68 204 70 223 80" fill="none" stroke="#5e4637" strokeLinecap="round" strokeOpacity="0.28" strokeWidth="1" />
    </>
  );
}
