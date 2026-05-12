export function AirwayProximal() {
  // prettier-ignore
  return (
    <g className="proximal-airway" transform="translate(96 14) scale(0.72)">
      <path className="ng-tube" d="M181 145 C160 155 150 181 156 214 C164 257 158 301 139 347" fill="none" stroke="#d7c08a" strokeLinecap="round" strokeWidth="3" />
      <circle className="ng-tube-anchor" cx="181" cy="145" r="3.2" fill="#f3e5b6" stroke="#8f7443" strokeWidth="0.8" />
      <g className="ng-tube-label">
        <rect x="128" y="211" width="24" height="13" rx="4" fill="#1f3140" stroke="#d7c08a" strokeOpacity="0.76" strokeWidth="1" />
        <text aria-hidden="true" fill="#f8e8ad" x="134" y="221">NG</text>
      </g>
      <path className="airway-mask-shell" d="M165 134 C183 126 214 128 229 140 L217 162 C198 169 174 165 161 154Z" fill="url(#maskShell)" stroke="#c1ced8" strokeWidth="1.5" opacity="0.97" />
      <path className="airway-mask-highlight" d="M174 143 C190 150 211 151 224 144" stroke="#adbfcb" strokeWidth="2.2" fill="none" opacity="0.76" />
      <path className="mask-strap left" d="M166 136 C149 135 136 131 125 125" fill="none" stroke="#ecf3f7" strokeWidth="5.2" strokeLinecap="round" opacity="0.86" />
      <path className="mask-strap right" d="M229 140 C244 139 257 134 267 127" fill="none" stroke="#ecf3f7" strokeWidth="5.2" strokeLinecap="round" opacity="0.86" />
      <path className="mask-strap upper" d="M162 133 C180 118 210 120 231 136" fill="none" stroke="#ecf3f7" strokeLinecap="round" strokeOpacity="0.58" strokeWidth="2.6" />
      <path className="mask-strap lower" d="M160 155 C181 170 201 173 220 164" fill="none" stroke="#ecf3f7" strokeLinecap="round" strokeOpacity="0.5" strokeWidth="2.4" />
      <rect className="ett-mouth-seal" x="191" y="139" width="30" height="38" rx="10" fill="#86acc6" stroke="#edf7ff" strokeWidth="2.2" />
      <rect className="mask-connector-shadow" x="181" y="149" width="50" height="8" rx="6" fill="#5f7c90" opacity="0.26" stroke="#d6e4ec" strokeOpacity="0.2" />
      <path className="ett-tube" d="M206 162 L232 224" fill="none" stroke="#c78b72" strokeWidth="11" strokeLinecap="round" opacity="0.42" />
      <path className="ett-inner-highlight" d="M207 164 L231 222" fill="none" stroke="#fff7ed" strokeLinecap="round" strokeOpacity="0.42" strokeWidth="2" />
      <path className="ett-depth-mark" d="M213 176 L222 172" fill="none" stroke="#5f3a2f" strokeLinecap="round" strokeOpacity="0.62" strokeWidth="1.2" />
      <path className="ett-depth-mark" d="M218 190 L227 186" fill="none" stroke="#5f3a2f" strokeLinecap="round" strokeOpacity="0.62" strokeWidth="1.2" />
      <path className="ett-depth-mark" d="M224 204 L232 201" fill="none" stroke="#5f3a2f" strokeLinecap="round" strokeOpacity="0.62" strokeWidth="1.2" />
    </g>
  );
}
