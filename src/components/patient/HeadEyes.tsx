type HeadEyesProps = {
  cheekColor: string;
  cheekOpacity: number;
  critical: boolean;
  drowsy: boolean;
  eyeHeight: number;
  eyelidEdemaOpacity: number;
  pupilRadius: number;
  pupilReflexOpacity: number;
  underEyeColor: string;
};

export function HeadEyes({
  cheekColor,
  cheekOpacity,
  critical,
  drowsy,
  eyeHeight,
  eyelidEdemaOpacity,
  pupilRadius,
  pupilReflexOpacity,
  underEyeColor,
}: HeadEyesProps) {
  const rightPupilRadius = critical ? Math.max(1.8, pupilRadius - 0.7) : pupilRadius;
  const socketOpacity = critical || drowsy ? 0.48 : 0.2;
  const proptosisOpacity = critical ? 0.34 : 0.08;
  const hemorrhageOpacity = critical ? 0.62 : 0.04;

  // prettier-ignore
  return (
    <>
      <ellipse className="cheek left-cheek" cx="155" cy="137" rx="13" ry="8" fill={cheekColor} opacity={cheekOpacity} stroke="none" />
      <ellipse className="cheek right-cheek" cx="220" cy="138" rx="12" ry="7" fill={cheekColor} opacity={cheekOpacity} stroke="none" />
      <path className="eye-socket-shadow left" d="M145 114 C155 105 179 106 190 116 C179 112 157 112 145 114Z" fill="#6d463f" opacity={socketOpacity} stroke="none" />
      <path className="eye-socket-shadow right" d="M201 115 C210 108 226 109 234 118 C225 114 211 114 201 115Z" fill="#6d463f" opacity={socketOpacity * 0.88} stroke="none" />
      <path className="sunken-eye-shadow left" d="M150 127 C160 137 177 137 187 126" fill="none" opacity={critical || drowsy ? 0.5 : 0.12} stroke={underEyeColor} strokeLinecap="round" strokeWidth="2.2" />
      <path className="sunken-eye-shadow right" d="M204 127 C213 136 226 136 232 127" fill="none" opacity={critical || drowsy ? 0.44 : 0.1} stroke={underEyeColor} strokeLinecap="round" strokeWidth="1.9" />
      <path className="under-eye-shadow left" d="M150 128 C160 133 174 133 184 128" fill="none" stroke={underEyeColor} strokeLinecap="round" strokeOpacity={critical || drowsy ? 0.52 : 0.24} strokeWidth="1.5" />
      <path className="under-eye-shadow right" d="M204 128 C212 132 223 132 230 128" fill="none" stroke={underEyeColor} strokeLinecap="round" strokeOpacity={critical || drowsy ? 0.48 : 0.22} strokeWidth="1.4" />
      <path className="eyelid-edema left" d="M149 116 C160 111 176 112 187 117" fill="none" opacity={eyelidEdemaOpacity} stroke="#d7b0a1" strokeLinecap="round" strokeWidth="3.2" />
      <path className="eyelid-edema right" d="M204 116 C212 112 224 113 232 118" fill="none" opacity={eyelidEdemaOpacity} stroke="#d7b0a1" strokeLinecap="round" strokeWidth="3" />
      <ellipse className="proptosis-highlight left" cx="164" cy="121" rx="14.2" ry={eyeHeight + 1.4} fill="none" opacity={proptosisOpacity} stroke="#f6efe8" strokeWidth="0.9" />
      <ellipse className="proptosis-highlight right" cx="215" cy="121" rx="12.2" ry={eyeHeight * 0.86 + 1.2} fill="none" opacity={proptosisOpacity * 0.8} stroke="#f6efe8" strokeWidth="0.8" />
      <ellipse className="eye-white left-eye" cx="164" cy="121" rx="12.5" ry={eyeHeight} fill="#f4e9df" stroke="#3b241d" strokeOpacity="0.52" strokeWidth="1.2" />
      <ellipse className="eye-white right-eye" cx="215" cy="121" rx="10.8" ry={eyeHeight * 0.86} fill="#f4e9df" stroke="#3b241d" strokeOpacity="0.5" strokeWidth="1.1" />
      <path className="subconjunctival-hemorrhage left" d="M171 119 C176 119 178 123 176 126 C173 124 171 122 171 119Z" fill="#b81f2d" opacity={hemorrhageOpacity} stroke="none" />
      <path className="subconjunctival-hemorrhage right" d="M220 120 C224 120 226 123 225 126 C222 124 220 122 220 120Z" fill="#b81f2d" opacity={hemorrhageOpacity * 0.55} stroke="none" />
      <circle className="iris left" cx="165" cy="121" r="3.7" fill="#4d3428" stroke="#1d120e" strokeWidth="0.8" />
      <circle className="iris right" cx="216" cy="121" r="3.4" fill="#4d3428" stroke="#1d120e" strokeWidth="0.8" />
      <circle className="pupil left" cx="165" cy="121" r={pupilRadius} fill="#0e0907" stroke="#0e0907" strokeWidth="0.4" />
      <circle className="pupil right anisocoria-reference" cx="216" cy="121" r={rightPupilRadius} fill="#0e0907" stroke="#0e0907" strokeWidth="0.4" />
      <circle className="pupil-reflex-ring left" cx="165" cy="121" r={critical ? 6.5 : 5.4} fill="none" opacity={pupilReflexOpacity} stroke="#78d9ff" strokeWidth="0.9" />
      <circle className="pupil-reflex-ring right" cx="216" cy="121" r={critical ? 6.1 : 5} fill="none" opacity={pupilReflexOpacity} stroke="#78d9ff" strokeWidth="0.9" />
      <circle className="eye-catchlight left" cx="163.5" cy="119.5" r="1.1" fill="#ffffff" stroke="#ffffff" strokeWidth="0.2" />
      <circle className="eye-catchlight right" cx="214.8" cy="119.7" r="1" fill="#ffffff" stroke="#ffffff" strokeWidth="0.2" />
      <path className="eyelid-thickness left" d="M151 116 C160 111 175 112 186 117" fill="none" stroke="#5b352e" strokeLinecap="round" strokeOpacity="0.36" strokeWidth="0.9" />
      <path className="eyelid-thickness right" d="M205 116 C213 112 224 113 231 118" fill="none" stroke="#5b352e" strokeLinecap="round" strokeOpacity="0.32" strokeWidth="0.8" />
      <path className="eyelashes left" d="M153 115 L150 111 M160 113 L158 109 M170 113 L171 109 M180 115 L183 111" fill="none" stroke="#241713" strokeLinecap="round" strokeOpacity="0.44" strokeWidth="0.8" />
      <path className="eyelashes right" d="M207 115 L205 112 M215 113 L215 110 M224 114 L226 111" fill="none" stroke="#241713" strokeLinecap="round" strokeOpacity="0.38" strokeWidth="0.75" />
      <path className="blink-lid left" d="M151 116 C160 111 175 112 186 117 C177 123 160 124 151 116Z" fill="#c1816c" stroke="#7b463e" strokeOpacity="0.28" strokeWidth="0.8" />
      <path className="blink-lid right" d="M205 116 C213 112 224 113 231 118 C224 123 212 123 205 116Z" fill="#c1816c" stroke="#7b463e" strokeOpacity="0.24" strokeWidth="0.8" />
    </>
  );
}
