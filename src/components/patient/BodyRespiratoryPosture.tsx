type BodyRespiratoryPostureProps = {
  decompensationPostureOpacity: number;
  recoveryPostureOpacity: number;
  respiratoryEffortOpacity: number;
};

export function BodyRespiratoryPosture({
  decompensationPostureOpacity,
  recoveryPostureOpacity,
  respiratoryEffortOpacity,
}: BodyRespiratoryPostureProps) {
  // prettier-ignore
  return (
    <>
      <path d="M146 210 C191 181 275 184 335 220 C316 259 269 280 213 270 C174 263 150 240 146 210Z" fill="url(#torsoGlass)" stroke="#f5c7b8" strokeOpacity="0.26" strokeWidth="1.5" />
      <path className="shoulder-anatomy-contour left" d="M126 219 C145 197 170 187 202 190" fill="none" stroke="#6f4037" strokeLinecap="round" strokeOpacity="0.32" strokeWidth="2" />
      <path className="shoulder-anatomy-contour right" d="M286 190 C320 198 351 221 381 254" fill="none" stroke="#6f4037" strokeLinecap="round" strokeOpacity="0.28" strokeWidth="2" />
      <path className="clavicle-line" d="M151 212 C194 232 273 236 333 219" fill="none" stroke="rgba(116, 57, 50, 0.34)" strokeLinecap="round" strokeWidth="2.2" />
      <path className="clavicle-detail left" d="M154 211 C178 204 199 206 221 216" fill="none" stroke="#74453e" strokeLinecap="round" strokeOpacity="0.42" strokeWidth="1.4" />
      <path className="clavicle-detail right" d="M243 216 C273 207 303 209 331 221" fill="none" stroke="#74453e" strokeLinecap="round" strokeOpacity="0.36" strokeWidth="1.3" />
      <path className="suprasternal-retraction" d="M211 202 C225 197 245 199 258 206" fill="none" opacity={respiratoryEffortOpacity} stroke="#5c342f" strokeLinecap="round" strokeWidth="2.2" />
      <path className="neck-muscle-tension left" d="M184 173 C177 188 173 200 171 214" fill="none" opacity={respiratoryEffortOpacity} stroke="#5c342f" strokeLinecap="round" strokeWidth="1.5" />
      <path className="neck-muscle-tension right" d="M253 172 C262 188 269 202 274 217" fill="none" opacity={respiratoryEffortOpacity} stroke="#5c342f" strokeLinecap="round" strokeWidth="1.5" />
      <path className="accessory-muscle left" d="M187 174 C173 188 163 202 156 220" fill="none" opacity={respiratoryEffortOpacity} stroke="#7b463e" strokeLinecap="round" strokeWidth="2.4" />
      <path className="accessory-muscle right" d="M248 173 C270 188 286 205 297 225" fill="none" opacity={respiratoryEffortOpacity} stroke="#7b463e" strokeLinecap="round" strokeWidth="2.4" />
      <g className="chest-hair" opacity="0.34">
        <path className="chest-hair-strand" d="M211 223 L216 229 M226 220 L223 228 M241 224 L246 231 M232 239 L237 246 M252 241 L248 249" fill="none" stroke="#3a2a1d" strokeLinecap="round" strokeOpacity="0.58" strokeWidth="0.8" />
      </g>
      <path className="gown-neckline" d="M165 205 C192 226 274 229 318 207 C303 238 270 255 228 252 C196 249 176 232 165 205Z" fill="rgba(239, 250, 255, 0.22)" stroke="#9ed7e8" strokeLinecap="round" strokeOpacity="0.45" strokeWidth="2.2" />
      <path className="gown-center-seam" d="M236 219 C235 259 240 311 250 358" fill="none" stroke="#9ed7e8" strokeDasharray="5 7" strokeLinecap="round" strokeOpacity="0.32" strokeWidth="1.6" />
      <path className="sternum-line" d="M239 214 C237 252 242 294 253 339" fill="none" stroke="rgba(116, 57, 50, 0.34)" strokeLinecap="round" strokeWidth="3" />
      <path className="pectus-excavatum-shadow" d="M218 235 C234 227 258 230 272 242 C259 252 232 251 218 235Z" fill="rgba(60, 32, 30, 0.12)" stroke="#5c342f" strokeOpacity="0.16" strokeWidth="0.8" />
      <path className="pectus-carinatum-highlight" d="M231 221 C241 214 255 216 263 225" fill="none" stroke="#f5c7b8" strokeLinecap="round" strokeOpacity="0.18" strokeWidth="1.3" />
      <path className="sternotomy-scar" d="M241 218 C240 249 243 284 250 322" fill="none" stroke="#9b4a46" strokeDasharray="4 5" strokeLinecap="round" strokeOpacity="0.32" strokeWidth="1.2" />
      <path className="cabg-scar" d="M177 238 C203 225 255 228 285 244" fill="none" stroke="#9b4a46" strokeDasharray="3 5" strokeLinecap="round" strokeOpacity="0.18" strokeWidth="1" />
      <ellipse className="nipple left" cx="194" cy="244" rx="3.4" ry="2.4" fill="#a76558" stroke="#6f4037" strokeOpacity="0.28" strokeWidth="0.6" />
      <ellipse className="nipple right" cx="297" cy="251" rx="3.2" ry="2.2" fill="#a76558" stroke="#6f4037" strokeOpacity="0.24" strokeWidth="0.6" />
      <path className="rib-line" d="M151 248 C198 231 286 237 337 257" fill="none" stroke="rgba(116, 57, 50, 0.34)" strokeLinecap="round" strokeWidth="1.4" />
      <path className="skinny-rib-contour upper" d="M158 260 C203 244 289 251 333 270" fill="none" stroke="#75463f" strokeLinecap="round" strokeOpacity="0.24" strokeWidth="1" />
      <path className="intercostal-retraction upper" d="M166 241 C193 225 295 233 322 249" fill="none" opacity={respiratoryEffortOpacity} stroke="#6e4039" strokeLinecap="round" strokeWidth="2.1" />
      <path className="rib-line" d="M144 285 C199 263 300 276 356 304" fill="none" stroke="rgba(116, 57, 50, 0.34)" strokeLinecap="round" strokeWidth="1.4" />
      <path className="skinny-rib-contour lower" d="M150 295 C202 274 301 284 352 309" fill="none" stroke="#75463f" strokeLinecap="round" strokeOpacity="0.22" strokeWidth="1" />
      <path className="intercostal-retraction lower" d="M157 281 C202 257 303 271 342 294" fill="none" opacity={respiratoryEffortOpacity} stroke="#6e4039" strokeLinecap="round" strokeWidth="2" />
      <path className="diaphragm-line" d="M153 315 C198 342 293 346 345 321" fill="none" stroke="rgba(116, 57, 50, 0.34)" strokeLinecap="round" strokeWidth="2.2" />
      <path className="abdomen-contour" d="M150 314 C203 343 309 346 371 322 C349 356 183 361 150 314Z" fill="rgba(255, 218, 202, 0.05)" stroke="#75463f" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.25" strokeWidth="1.4" />
      <path className="abdominal-breathing" d="M171 327 C219 349 302 351 350 330" fill="none" opacity={respiratoryEffortOpacity * 0.72} stroke="#4d62bc" strokeLinecap="round" strokeWidth="1.8" />
      <path className="abdominal-paradox" d="M185 340 C226 323 286 326 330 345" fill="none" opacity={decompensationPostureOpacity * 0.48} stroke="#ff6b6b" strokeLinecap="round" strokeWidth="1.5" />
      <ellipse className="umbilicus" cx="250" cy="330" rx="4" ry="2.7" fill="#75463f" stroke="#3e231f" strokeOpacity="0.25" strokeWidth="0.6" />
      <path className="obese-abdomen-option" d="M132 306 C198 351 328 357 390 316" fill="none" stroke="#f5c7b8" strokeLinecap="round" strokeOpacity="0.12" strokeWidth="3" />
      <path className="abdominal-surgery-scar" d="M210 324 C226 337 250 342 274 337" fill="none" stroke="#9b4a46" strokeDasharray="3 5" strokeLinecap="round" strokeOpacity="0.2" strokeWidth="1" />
      <g className="stable-posture-markers" opacity={recoveryPostureOpacity}>
        <path className="relaxed-shoulder-line left" d="M143 221 C162 232 184 237 206 235" fill="none" stroke="#78d9ff" strokeLinecap="round" strokeOpacity="0.7" strokeWidth="2" />
        <path className="relaxed-shoulder-line right" d="M283 235 C310 236 335 244 358 260" fill="none" stroke="#78d9ff" strokeLinecap="round" strokeOpacity="0.62" strokeWidth="2" />
      </g>
      <g className="clinical-decompensation-posture" opacity={decompensationPostureOpacity}>
        <path className="raised-shoulder-line left" d="M132 218 C154 198 181 190 207 194" fill="none" stroke="#5c342f" strokeLinecap="round" strokeWidth="3" />
        <path className="raised-shoulder-line right" d="M286 197 C317 205 345 225 370 252" fill="none" stroke="#5c342f" strokeLinecap="round" strokeWidth="3" />
        <path className="sternal-tug" d="M224 213 C232 230 236 248 237 269" fill="none" stroke="#4d62bc" strokeLinecap="round" strokeOpacity="0.74" strokeWidth="2.6" />
        <path className="critical-abdominal-tension" d="M154 312 C205 288 303 295 357 324" fill="none" stroke="#4d62bc" strokeLinecap="round" strokeOpacity="0.54" strokeWidth="2.4" />
      </g>
    </>
  );
}
