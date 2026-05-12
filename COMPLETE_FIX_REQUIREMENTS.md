# 🔥 Vent 2D Simulator — 완전 개선 요구사항 1000+

> **코덱스 주목:** 이 문서는 1,000개 이상의 구체적이고 검증 가능한 개선사항을 담고 있습니다.  
> **모든 항목을 100% 완료해야** 프로젝트가 완성됩니다.  
> "대충 했음" → 실패. "한 번에 다 했음" 보고 → 거짓말.  
> **각 항목 단위로 구현하고 검증하세요.**

---

## 🚨 SECTION A: 환자 아바타 UI 완전 재설계 (250+ 항목)

### A.1 근본 문제 — 아바타가 "사람"으로 안 보임

**현재 상태:**

- viewBox="0 0 640 360" 인데 aspect-ratio가 1672:941
- 비율이 안 맞아서 SVG가 잘림/늘어남
- 머리, 몸, 팔다리 비율이 비현실적
- 의료 시뮬레이터처럼 보이지 않음

#### A.1.1 비율과 좌표계 수정 (30개)

1. [x] viewBox를 컨테이너 비율과 맞춰 수정 (1672x941 → 0 0 1672 941로 변경 OR aspect-ratio 변경)
2. [x] aspect-ratio CSS 값을 viewBox 비율과 정확히 일치시키기
3. [x] preserveAspectRatio 속성 명시적 설정 ("xMidYMid meet" 또는 "xMidYMid slice")
4. [x] 모든 좌표값 재계산해서 비율에 맞춤
5. [x] BedLayer의 ViewBox 좌표 재조정 (현재 42-612 범위)
6. [x] BodyLayer 좌표 정규화 (104-548 범위)
7. [x] HeadLayer 좌표 정규화 (118-242 범위 — 너무 작음)
8. [x] AirwayLayer 좌표 정규화
9. [x] 모든 SVG 요소를 0-1 정규화된 좌표로 변경 검토
10. [x] 1280x720 기준 좌표계 수립
11. [x] 1440x900 기준 좌표계 수립
12. [x] 1920x1080 기준 좌표계 수립
13. [x] viewBox와 width/height 비율 일치 검증 테스트 추가
14. [x] 모바일 viewport (375x844) 좌표 검증
15. [x] 태블릿 viewport (768x1024) 좌표 검증
16. [x] 환자 비율: 머리:몸 = 1:7 비율로 재설계
17. [x] 환자 비율: 어깨너비/머리너비 = 3:1 비율
18. [x] 환자 비율: 팔/몸통 = 4:5 비율
19. [x] 환자 비율: 다리/몸통 = 1:1.2 비율
20. [x] 환자가 누운 자세인 경우 정확한 단축 비율 적용
21. [x] 시점(view angle) 명확히 결정 (위에서 본 것 vs 정면)
22. [x] 카메라 각도 일관성 (현재는 혼재)
23. [x] z-axis depth 효과 추가 (그림자, 원근감)
24. [x] 침대 위 환자 위치 정확히 (베드 frame 안에 들어가도록)
25. [x] 환자가 베드 밖으로 나가지 않도록 검증
26. [x] 환자 머리가 베드 위쪽에 위치 (10-20% 영역)
27. [x] 환자 발이 베드 아래쪽에 위치 (80-90% 영역)
28. [x] 베드 밖 가로축 여백 균등하게
29. [x] 환자 회전 각도 일관성 (병상 기준)
30. [x] 모니터링 장비 위치 표시 (좌측/우측 상단)

#### A.1.2 머리/얼굴 완전 재설계 (40개)

31. [x] 머리 형태가 둥글지 않음 → 원형 또는 타원형으로 명확히
32. [x] 머리 크기가 너무 작음 → 전체의 12-15% 차지하도록
33. [x] 얼굴 윤곽 선명하게 그리기 (현재 흐릿함)
34. [x] 이마 영역 추가 (현재 헤어라인 너무 낮음)
35. [x] 광대뼈 윤곽 추가
36. [x] 턱선 명확하게 (현재 머리와 목 구분 안 됨)
37. [x] 목 영역 그리기 (현재 없음)
38. [x] 귀 그리기 (현재 없음)
39. [x] 코 그리기 (현재 없음 — 마스크에 가려졌다고 해도 콧대는 있어야)
40. [x] 눈썹 명확하게 (현재 코드만 있고 안 보일 가능성)
41. [x] 양쪽 눈썹 모두 표시 (현재 한쪽만 있음 - 423번 줄)
42. [x] 눈동자 그리기 (현재 눈썹만 있음)
43. [x] 눈 깜빡임 애니메이션 (의식 수준에 따라)
44. [x] 눈 크기가 의식 상태 반영 (drowsy일 때 작게)
45. [x] 눈 색상 (홍채) 그리기
46. [x] 동공 크기 표시 (정상/축동/산동)
47. [x] 입 위치 정확히 (마스크 하단)
48. [x] 입술 두께 표현 (얇은 선이 아닌 입체감)
49. [x] 입술 색상 변화가 명확 (정상→파랑→진한파랑)
50. [x] 표정 변화가 더 명확 (현재는 미묘함)
51. [x] 표정: stable — 평온한 닫힌 입, 약간 미소
52. [x] 표정: watch — 입 약간 벌림, 눈썹 살짝 올라감
53. [x] 표정: worsening — 미간 찡그림, 입 굳게 닫음
54. [x] 표정: critical — 입 크게 벌림, 미간 깊은 주름
55. [x] 표정: drowsy — 눈꺼풀 처짐, 입 살짝 벌림
56. [x] 표정: distressed — 고통스러운 모습 (눈썹, 입 모두)
57. [x] 표정: calm — 완전히 편안한 모습
58. [x] 머리카락 표현 (현재 검은 헬멧처럼 보임)
59. [x] 머리카락 흐름/스타일 표현
60. [x] 머리카락 색상 (검정 외 옵션)
61. [x] 두피와 머리카락 구분
62. [x] 인종/피부톤 다양성 옵션
63. [x] 성별 옵션 (추후 확장)
64. [x] 나이 표현 (성인/노인 등)
65. [x] 머리 회전 (옆으로 누운 자세 등)
66. [x] 그림자/하이라이트로 입체감
67. [x] 얼굴 윤곽선 두께 일관성
68. [x] 안색 변화 그라디언트 부드럽게
69. [x] 식은땀 위치 (이마, 인중, 관자놀이)
70. [x] 땀방울 모양 자연스럽게 (현재 너무 굵음)

#### A.1.3 몸통/가슴 완전 재설계 (35개)

71. [x] 어깨선 명확하게 (현재 흐릿)
72. [x] 흉곽 윤곽선 추가
73. [x] 흉골 라인 명확하게 (현재 너무 흐림)
74. [x] 갈비뼈 라인 (선택적, 의료적 정확성)
75. [x] 횡경막 위치 표시
76. [x] 가슴 호흡 움직임 명확하게 (현재 미묘)
77. [x] 호흡 시 가슴 상승 visible하게
78. [x] 호흡 시 복부 움직임도 표현
79. [x] 좌측 흉부 감소 시 명확한 시각적 차이
80. [x] 우측 흉부 감소 시 명확한 시각적 차이
81. [x] Pneumothorax 시 좌측 흉곽 함몰 표현
82. [x] 폐 위치 정확히 (흉곽 안)
83. [x] 폐 크기 비율 정확히 (실제 해부학)
84. [x] 좌폐가 우폐보다 약간 작게 (심장 자리)
85. [x] 폐의 3엽(우)/2엽(좌) 표현 (선택적)
86. [x] 심장 위치 표시 (선택적)
87. [x] 폐 색상: healthy (분홍) 명확
88. [x] 폐 색상: inflamed (진한 빨강) 명확
89. [x] 폐 색상: stiff (어두운 보라) 명확
90. [x] 폐 색상: collapsed (회색/어두운 색) 명확
91. [x] 폐 침윤 (infiltrate) 패턴 명확
92. [x] 폐 분비물 (secretion) 시각화 명확
93. [x] 분비물 노란/녹색 색상 정확
94. [x] 분비물 양 시각화 (적/중/많음)
95. [x] 기관(trachea) 위치 정확
96. [x] 기관지(bronchi) 분기 표현
97. [x] 기관지 양쪽 분기 비율
98. [x] 폐포 영역 표현 (선택적)
99. [x] 환자 옷/시트 표현 명확
100.  [x] 시트 주름 자연스럽게
101.  [x] 시트 색상 (수술용 파란색)
102.  [x] 환자복 칼라/넥라인 표시
103.  [x] 환자 손 위치 (몸 옆/배 위)
104.  [x] 손가락 묘사 (선택적)
105.  [x] 손목 IV 라인 표시

#### A.1.4 기관삽관/마스크 재설계 (30개)

106. [x] 마스크가 얼굴에 정확히 위치
107. [x] 마스크 형태 명확 (현재 사각형 같음)
108. [x] 마스크 투명도 (얼굴이 약간 보이도록)
109. [x] 마스크 끈/스트랩 표시
110. [x] 기관내삽관 튜브 정확한 시작점 (입 안)
111. [x] 튜브 두께 일관성
112. [x] 튜브 곡선 자연스럽게
113. [x] 튜브 끝 부분 (인공호흡기 연결) 명확
114. [x] 튜브 색상 (의료용 흰색/투명)
115. [x] 튜브 내부 강조 라인 (현재 너무 흐림)
116. [x] 코르게이트 튜브 (주름관) 표현
117. [x] 주름관 주름 패턴 정확
118. [x] 인공호흡기 회로 시작점 명확
119. [x] 호기/흡기 회로 구분 (Y피스)
120. [x] 청색 회로 (호기) 표시
121. [x] 흰색/투명 회로 (흡기) 표시
122. [x] 가습기 위치 (선택적)
123. [x] 응축수 표현 (선택적)
124. [x] 튜브 압력 경고 시 빨간 점멸
125. [x] 튜브 위치 잘못됨 표시 (밀려나옴 등)
126. [x] PIP 라벨 위치 합리적
127. [x] PIP 값 폰트 가독성
128. [x] PIP 위험 시 색상 변화 (빨강)
129. [x] PEEP 표시 추가
130. [x] 분당 호흡량 표시 추가
131. [x] FiO2 시각화 (산소 농도 그래픽)
132. [x] 산소 흐름 시각화 (선택적 화살표)
133. [x] 호흡 사이클 단계 표시 (들숨/날숨)
134. [x] 가슴 압축 효과 (압력 인디케이터)
135. [x] 흡기 시 폐 팽창 애니메이션

#### A.1.5 모니터링 장비 (15개)

136. [x] 흉부 ECG 전극 정확한 위치 (12-lead)
137. [x] 전극 갯수 정확 (현재 3개, 의료적으로 5개 또는 12개)
138. [x] 전극 색상 코딩 (RA, LA, LL, RL, V1-V6)
139. [x] 전극 와이어 색상
140. [x] 와이어가 환자 밖으로 나가는 경로
141. [x] 모니터로 연결되는 와이어 표현
142. [x] SpO2 프로브 (손가락) 표시
143. [x] 혈압 커프 (팔) 표시
144. [x] 체온 프로브 표시
145. [x] IV 라인 표시
146. [x] 도뇨관 표시 (선택적)
147. [x] 비위관(NG tube) 표시 (선택적)
148. [x] 동맥혈가스 카테터 표시 (선택적)
149. [x] CVC (central venous catheter) 표시
150. [x] 모니터링 와이어 통합 정리

#### A.1.6 시각 효과 강화 (40개)

151. [x] 청색증 효과가 너무 미묘 → 명확하게 강화
152. [x] 입술 청색증 색상 더 진하게
153. [x] 손가락 청색증 표현 추가
154. [x] 발끝 청색증 표현 추가
155. [x] 안면 청색증 그라디언트 자연스럽게
156. [x] 청색증 단계별 색상 차이 명확
157. [x] 빈혈 시 창백한 피부 (현재 없음)
158. [x] 발한 효과 명확 (식은땀)
159. [x] 땀 흐름 애니메이션
160. [x] 땀의 광택/반짝임 효과
161. [x] 폐 침윤 영역 색상 명확
162. [x] 폐 침윤 패턴 자연스럽게 (현재 인위적)
163. [x] 폐 ARDS 변화: '글래스 그라운드' 패턴
164. [x] 폐 폐렴 변화: 분명한 음영
165. [x] 폐 기흉: 한쪽 폐 검게/투명하게
166. [x] 폐 기관지천식: 과팽창 표현
167. [x] 호흡 보조근 사용 표현 (목, 어깨 근육)
168. [x] 가슴벽 함몰 (intercostal retractions)
169. [x] 코 벌렁거림 (nasal flaring)
170. [x] Cheyne-Stokes 호흡 패턴 (선택적)
171. [x] Kussmaul 호흡 (당뇨병 케토산증)
172. [x] 의식 수준: alert → 눈 똑바로 뜸
173. [x] 의식 수준: drowsy → 눈 반쯤 감음
174. [x] 의식 수준: stupor → 눈 거의 감음
175. [x] 의식 수준: coma → 눈 완전히 감음
176. [x] 동공 반사 시각화 (선택적)
177. [x] 안검 부종 표현 (선택적)
178. [x] 황달 (피부 노란색) 표현
179. [x] 발진/홍반 표현 (선택적)
180. [x] 부종 표현 (특히 다리)
181. [x] 알람 글로우 효과 더 명확
182. [x] 알람 시 화면 전체 진동 효과 (선택적)
183. [x] 알람 시 빨간 테두리 효과
184. [x] 알람 우선순위별 색상 (빨강/노랑)
185. [x] 알람 점멸 속도가 심각도와 비례
186. [x] 회복 시 초록색 글로우 더 명확
187. [x] 호흡 동기화 표시 (들숨/날숨)
188. [x] 자발 호흡 vs 기계 호흡 시각적 구분
189. [x] 비동기성 호흡 (asynchrony) 시각화
190. [x] 환자가 인공호흡기와 싸우는 모습 (bucking)

#### A.1.7 애니메이션 (30개)

191. [x] 호흡 애니메이션이 너무 미묘 → 명확하게
192. [x] 호흡 진폭 visual하게 보이도록
193. [x] 호흡 속도 RR과 정확히 동기화
194. [x] 흡기/호기 비율 (I:E ratio) 정확
195. [x] 흡기 시 가슴 상승 (1.5-2초)
196. [x] 호기 시 가슴 하강 (3초)
197. [x] 호흡 정지 시 완전 정지 애니메이션
198. [x] 무호흡 시간 표시
199. [x] 빠른 호흡 (tachypnea) 애니메이션
200. [x] 느린 호흡 (bradypnea) 애니메이션
201. [x] 헐떡임 (gasping) 애니메이션
202. [x] 알람 펄스 애니메이션 부드럽게
203. [x] 청색증 페이드인 애니메이션
204. [x] 청색증 페이드아웃 애니메이션 (회복 시)
205. [x] 표정 변화 부드러운 트랜지션
206. [x] 눈 깜빡임 자연스럽게 (3-4초마다)
207. [x] 의식 저하 점진적 변화
208. [x] 발한 시작 애니메이션 (천천히 등장)
209. [x] 폐 음영 변화 부드러움
210. [x] 분비물 늘어나는 애니메이션
211. [x] 튜브 흔들림 (호흡 시)
212. [x] 회로 진동 (가스 흐름)
213. [x] 알람 글로우 깜빡임 일관성
214. [x] 가슴 비대칭 움직임 (편측 폐 손상)
215. [x] 무호흡 → 호흡 재개 시 시각적 효과
216. [x] @keyframes 타이밍 함수 일관성
217. [x] CSS animation-duration 변수화
218. [x] CSS animation-delay 적절히 활용
219. [x] prefers-reduced-motion 미디어쿼리 적용
220. [x] 모든 애니메이션을 will-change로 최적화

#### A.1.8 색상 시스템 (30개)

221. [x] 피부톤 정상 → 의료적으로 정확한 색
222. [x] 피부톤 창백 → 회색조가 섞인 색
223. [x] 피부톤 청색증 → 자색 명확
224. [x] 피부톤 심한 청색증 → 진한 자색
225. [x] 입술 정상 → 분홍색 자연스럽게
226. [x] 입술 청색증 → 보라색
227. [x] 입술 심한 청색증 → 진한 보라/검정
228. [x] 폐 healthy → 분홍색 (의료 정확)
229. [x] 폐 inflamed → 진한 빨강
230. [x] 폐 stiff → 어두운 보라
231. [x] 폐 collapsed → 회색/검정
232. [x] 분비물 색상 → 노란/녹색/갈색
233. [x] 출혈 표현 → 빨간색 (필요시)
234. [x] 구토물 표현 → 갈색 (필요시)
235. [x] 응급 표시 색상 → 빨강 (#FF3030)
236. [x] 경고 표시 색상 → 노랑 (#FFD84A)
237. [x] 정상 표시 색상 → 초록 (#35D27F)
238. [x] 색맹 친화적 팔레트 옵션
239. [x] WCAG AAA 대비 통과 (7:1)
240. [x] 다크 모드 색상 최적화
241. [x] 라이트 모드 색상 최적화
242. [x] 색상 일관성: 알람 빨강 vs 위험 빨강
243. [x] CSS 변수로 색상 토큰화
244. [x] 색상 의미적 명명 (semantic naming)
245. [x] HSL/OKLCH 색상 공간 활용
246. [x] 색상 그라디언트 자연스럽게
247. [x] 그림자 색상 일관성
248. [x] 하이라이트 색상 일관성
249. [x] 외곽선 색상 환자 외곽 강조
250. [x] 배경과 환자 대비 명확하게

---

## 🚨 SECTION B: 미구현/불완전 기능 (200+ 항목)

### B.1 핵심 기능 누락

251. [x] 시뮬레이션 시간 가속 (1x, 2x, 5x, 10x)
252. [x] 시간 되돌리기 (rewind)
253. [x] 특정 시간으로 점프
254. [x] 시뮬레이션 저장 (JSON 내보내기)
255. [x] 시뮬레이션 불러오기 (JSON 가져오기)
256. [x] 시나리오 커스터마이징 (사용자 정의)
257. [x] 학습 모드 (가이드 투어)
258. [x] 평가 모드 (퀴즈/시험)
259. [x] 점수 시스템 (적절한 설정 시 +점수)
260. [x] 환자 응답 시간 (설정 변경에 즉시 → 점진적)
261. [x] 약물 투여 (적용/효과)
262. [x] 진정제 (sedation) 효과
263. [x] 마비제 (paralytic) 효과
264. [x] 신경근 차단제 효과
265. [x] 항생제 효과 (시간 지남에 따라)
266. [x] 수액 처방 (수액 종류, 속도)
267. [x] 수액 효과 (혈압, 부종 등)
268. [x] 수혈 처방
269. [x] 동맥혈가스(ABGA) 분석 패널
270. [x] CBC, BMP 등 검사 패널
271. [x] X-ray 시뮬레이션
272. [x] 심전도 (ECG) 표시
273. [x] 심박수 (HR) 시뮬레이션
274. [x] 혈압 (BP) 시뮬레이션
275. [x] 체온 시뮬레이션
276. [x] 의식 수준 (GCS) 표시
277. [x] 통증 척도 (NRS) 표시
278. [x] 환자 차트 (vital sign 트렌드)
279. [x] 트렌드 그래프 (시간별)
280. [x] 알람 히스토리
281. [x] 시뮬레이션 로그
282. [x] 환자 인적사항 (이름, 나이, 성별)
283. [x] 의무 기록 (chief complaint)
284. [x] 과거력 (past medical history)
285. [x] 현재 약물 (current medications)
286. [x] 알러지 (allergies)
287. [x] 환자 사진 / 인적정보 (선택적)
288. [x] 시나리오 진행 단계 (1단계, 2단계 등)
289. [x] 환자 악화 자동화 (시간 지남에 따라)
290. [x] 환자 회복 자동화 (적절한 처치 시)
291. [x] 응급 상황 발생 (랜덤 이벤트)
292. [x] 시뮬레이션 종료 조건
293. [x] 환자 사망 시뮬레이션
294. [x] 환자 발관 (extubation) 시뮬레이션
295. [x] 발관 후 호흡 평가
296. [x] 발관 실패 시 재삽관
297. [x] 코드 블루 (cardiac arrest)
298. [x] CPR 시뮬레이션
299. [x] 자발순환회복 (ROSC)
300. [x] 시나리오 분기 (사용자 결정에 따라)

### B.2 인공호흡기 모드 완성

301. [x] AC (Assist-Control) 모드 정확히
302. [x] VC (Volume Control) 모드 정확히
303. [x] PC (Pressure Control) 모드 정확히
304. [x] PSV (Pressure Support) 모드 정확히
305. [x] CPAP 모드 정확히
306. [x] BiPAP 모드 추가
307. [x] SIMV 모드 추가
308. [x] APRV 모드 추가
309. [x] HFOV (high-frequency) 모드 추가
310. [x] NIV (non-invasive) 모드 추가
311. [x] 각 모드별 설정 차이 정확
312. [x] 모드 변경 시 적절한 파라미터 자동 조정
313. [x] 모드 변경 시 경고 (안전 체크)
314. [x] 모드 별 적절한 알람 임계값
315. [x] 모드 별 파형 변화 정확
316. [x] 모드 전환 trigger 표시
317. [x] 백업 모드 (apnea backup)
318. [x] 무호흡 감지 (apnea detection)
319. [x] 자동 백업 활성화
320. [x] Inverse ratio ventilation (IRV)

### B.3 알람 시스템 완성

321. [x] 알람 우선순위 (high/medium/low)
322. [x] 알람 음성 (선택적)
323. [x] 알람 음소거 (mute) 기능
324. [x] 알람 일시 정지 기능
325. [x] 알람 재개
326. [x] 알람 임계값 조정 가능
327. [x] 알람 종류별 다른 색상
328. [x] 알람 깜빡임 속도 (심각도 비례)
329. [x] 알람 메시지 명확
330. [x] 알람 발생 시간 표시
331. [x] 알람 해결 시간 표시
332. [x] 알람 히스토리 패널
333. [x] 다중 알람 처리
334. [x] 알람 우선순위 정렬
335. [x] False alarm 처리
336. [x] Smart alarm (반복 시 우선순위 상승)
337. [x] 알람 스누즈
338. [x] 알람 알림 (모바일 푸시)
339. [x] 알람 통계 (얼마나 많이 발생)
340. [x] 알람 레벨 사용자 정의
341. [x] 고압 알람 (high pressure)
342. [x] 저압 알람 (low pressure)
343. [x] 분리 알람 (disconnect)
344. [x] 무호흡 알람 (apnea)
345. [x] 빈호흡 알람 (tachypnea)
346. [x] 서호흡 알람 (bradypnea)
347. [x] 저산소 알람 (low SpO2)
348. [x] 고압 알람 (high CO2)
349. [x] 저압 알람 (low CO2)
350. [x] 분당환기량 부족 알람
351. [x] 누출 알람 (leak)
352. [x] 회로 폐쇄 알람
353. [x] 배터리 알람
354. [x] 산소 공급 부족 알람

### B.4 파형 (Waveform) 개선

355. [x] 압력 파형 정확도 (피크/플라토 명확)
356. [x] 유량 파형 정확도 (들숨/날숨 구분)
357. [x] 용량 파형 정확도 (적분값)
358. [x] CO2 파형 (capnography) 추가
359. [x] 파형 그리드 정확
360. [x] 파형 시간축 라벨
361. [x] 파형 Y축 라벨
362. [x] 파형 단위 표시
363. [x] 파형 줌인/줌아웃
364. [x] 파형 일시 정지
365. [x] 파형 스크롤 (과거 데이터 보기)
366. [x] 파형 비정상 (abnormal pattern) 강조
367. [x] 파형 과적분 (over-distention) 표시
368. [x] 파형 과소분 (under-distention) 표시
369. [x] 파형 자가호흡 (spontaneous breath) 표시
370. [x] 파형 트리거 표시
371. [x] 파형 사이클링 표시
372. [x] 파형 P-V 루프 (선택적)
373. [x] 파형 V-T 루프 (선택적)
374. [x] 파형 트렌드 (지난 1시간)
375. [x] 파형 색상 일관성 (압력=파랑, 유량=초록, 용량=노랑)

### B.5 데이터 시각화

376. [x] 트렌드 그래프 (1분, 5분, 1시간, 24시간)
377. [x] 미니 트렌드 (각 vital 옆)
378. [x] 스파크라인 (간단한 트렌드)
379. [x] 게이지 (gauge) 시각화
380. [x] 도넛 차트 (FiO2 등)
381. [x] 막대 그래프 (시간별)
382. [x] 히트맵 (압력-시간)
383. [x] 통계 (평균, 최소, 최대)
384. [x] 표준 편차 표시
385. [x] 정상 범위 표시 (음영)
386. [x] 위험 범위 표시 (빨간 음영)
387. [x] 임계값 라인
388. [x] 자동 스케일 조정
389. [x] 수동 스케일 조정
390. [x] 줌인/줌아웃
391. [x] 데이터 라벨
392. [x] 마우스 호버 시 상세 정보
393. [x] 클릭 시 상세 분석
394. [x] 스냅샷 저장
395. [x] 인쇄 출력

### B.6 사용자 인터랙션

396. [x] 슬라이더 드래그 부드럽게
397. [x] 슬라이더 키보드 조작 (화살표)
398. [x] 슬라이더 마우스 휠 조작
399. [x] 숫자 직접 입력 옵션
400. [x] 미세 조정 (Shift + 화살표)
401. [x] 큰 조정 (Page Up/Down)
402. [x] 최소값으로 (Home)
403. [x] 최대값으로 (End)
404. [x] 빠른 토글 (Spacebar = pause)
405. [x] 빠른 리셋 (Ctrl+R)
406. [x] 키보드 단축키 도움말 (?)
407. [x] 우클릭 컨텍스트 메뉴
408. [x] 드래그 앤 드롭 (시나리오 변경 등)
409. [x] 터치 제스처 (모바일)
410. [x] 핀치 줌 (모바일)
411. [x] 스와이프 (모바일)
412. [x] 햅틱 피드백 (모바일)
413. [x] 음성 명령 (선택적)
414. [x] 제스처 인식 (선택적)
415. [x] AR/VR 지원 (선택적)
416. [x] 도움말 툴팁 (모든 컨트롤)
417. [x] 도움말 모드 (가이드)
418. [x] 인터랙티브 튜토리얼
419. [x] 학습 모드 (단계별)
420. [x] 시험 모드 (시간 제한)

---

## 🚨 SECTION C: 코드 품질 (200+ 항목)

### C.1 TypeScript 엄격성

421. [x] tsconfig.json에 strict: true 명시
422. [x] noImplicitAny: true 추가
423. [x] strictNullChecks: true 추가
424. [x] strictFunctionTypes: true 추가
425. [x] strictBindCallApply: true 추가
426. [x] strictPropertyInitialization: true 추가
427. [x] noImplicitThis: true 추가
428. [x] alwaysStrict: true 추가
429. [x] noUnusedLocals: true 추가
430. [x] noUnusedParameters: true 추가
431. [x] noImplicitReturns: true 추가
432. [x] noFallthroughCasesInSwitch: true 추가
433. [x] noUncheckedIndexedAccess: true 추가
434. [x] exactOptionalPropertyTypes: true 추가
435. [x] verbatimModuleSyntax: true 추가
436. [x] forceConsistentCasingInFileNames: true 확인
437. [x] esModuleInterop: true 확인
438. [x] skipLibCheck: false (또는 true)
439. [x] declaration: true (라이브러리화 시)
440. [x] declarationMap: true (디버깅)
441. [x] sourceMap: true (디버깅)
442. [x] inlineSources: true (디버깅)
443. [x] removeComments: false (개발 시)
444. [x] preserveConstEnums: true
445. [x] importsNotUsedAsValues: "error"
446. [x] paths alias 설정 (@/components 등)
447. [x] baseUrl 설정
448. [x] target: "ES2022" 적절성 검토
449. [x] module: "ESNext" 적절성 검토
450. [x] moduleResolution: "Bundler" 적절성

### C.2 Linting (ESLint)

451. [x] eslint 패키지 설치
452. [x] @eslint/js 설치
453. [x] typescript-eslint 설치
454. [x] eslint-plugin-react 설치
455. [x] eslint-plugin-react-hooks 설치
456. [x] eslint-plugin-jsx-a11y 설치
457. [x] eslint-plugin-import 설치
458. [x] eslint-plugin-vitest 설치
459. [x] eslint-plugin-testing-library 설치
460. [x] eslint-config-prettier 설치 (Prettier 호환)
461. [x] eslint.config.js 또는 .eslintrc.cjs 생성
462. [x] React 19 규칙 적용
463. [x] React Hooks 규칙 적용
464. [x] 접근성 (a11y) 규칙 적용
465. [x] Import 정렬 규칙 적용
466. [x] no-console 규칙 (warn)
467. [x] no-debugger 규칙 (error)
468. [x] no-unused-vars 규칙 (error)
469. [x] prefer-const 규칙 (error)
470. [x] no-var 규칙 (error)
471. [x] eqeqeq 규칙 (always)
472. [x] no-magic-numbers 규칙 (warn)
473. [x] complexity 규칙 (10)
474. [x] max-lines 규칙 (300)
475. [x] max-lines-per-function 규칙 (50)
476. [x] max-depth 규칙 (4)
477. [x] max-params 규칙 (4)
478. [x] max-nested-callbacks 규칙 (3)
479. [x] no-shadow 규칙
480. [x] no-redeclare 규칙
481. [x] consistent-return 규칙
482. [x] curly 규칙 (always)
483. [x] arrow-body-style 규칙
484. [x] prefer-arrow-callback 규칙
485. [x] no-duplicate-imports 규칙
486. [x] no-useless-rename 규칙
487. [x] object-shorthand 규칙
488. [x] prefer-destructuring 규칙
489. [x] prefer-template 규칙
490. [x] template-curly-spacing 규칙
491. [x] @typescript-eslint/no-explicit-any 규칙
492. [x] @typescript-eslint/explicit-function-return-type 규칙
493. [x] @typescript-eslint/no-unsafe-assignment 규칙
494. [x] @typescript-eslint/no-unsafe-call 규칙
495. [x] @typescript-eslint/no-unsafe-member-access 규칙
496. [x] @typescript-eslint/no-unsafe-return 규칙
497. [x] @typescript-eslint/no-floating-promises 규칙
498. [x] @typescript-eslint/await-thenable 규칙
499. [x] @typescript-eslint/no-misused-promises 규칙
500. [x] @typescript-eslint/no-unnecessary-type-assertion 규칙

### C.3 코드 포매팅 (Prettier)

501. [x] prettier 패키지 설치
502. [x] .prettierrc 생성
503. [x] semi: true
504. [x] singleQuote: true
505. [x] tabWidth: 2
506. [x] useTabs: false
507. [x] trailingComma: "all"
508. [x] printWidth: 100
509. [x] arrowParens: "always"
510. [x] bracketSpacing: true
511. [x] bracketSameLine: false
512. [x] jsxSingleQuote: false
513. [x] endOfLine: "lf"
514. [x] embeddedLanguageFormatting: "auto"
515. [x] htmlWhitespaceSensitivity: "css"
516. [x] proseWrap: "preserve"
517. [x] quoteProps: "as-needed"
518. [x] vueIndentScriptAndStyle: false
519. [x] requirePragma: false
520. [x] insertPragma: false
521. [x] plugins 배열 (필요시)
522. [x] overrides (특정 파일 다른 설정)
523. [x] .prettierignore 생성
524. [x] node_modules 제외
525. [x] dist 제외
526. [x] coverage 제외
527. [x] .git 제외
528. [x] \*.log 제외
529. [x] .env 제외
530. [x] package-lock.json 제외

### C.4 파일 구조

531. [x] src/components/ — 컴포넌트만
532. [x] src/components/ui/ — 재사용 UI
533. [x] src/components/panels/ — 패널들
534. [x] src/components/patient/ — 환자 관련
535. [x] src/hooks/ — 커스텀 훅
536. [x] src/context/ — Context
537. [x] src/simulation/ — 시뮬레이션 로직
538. [x] src/styles/ — 스타일
539. [x] src/types/ — 공통 타입
540. [x] src/utils/ — 유틸리티
541. [x] src/lib/ — 라이브러리 래퍼
542. [x] src/config/ — 설정
543. [x] src/test/ — 테스트 유틸
544. [x] src/e2e/ — E2E 테스트
545. [x] src/assets/ — 정적 자산
546. [x] 각 컴포넌트 폴더 내부 구조 통일
547. [x] 컴포넌트 + 테스트 + 스타일 동위치
548. [x] index.ts로 export 통합
549. [x] 절대 경로 import (@/components/...)
550. [x] 상대 경로는 같은 폴더만

### C.5 명명 규칙

551. [x] 컴포넌트: PascalCase (예: PatientAvatar2D)
552. [x] 훅: useCamelCase (예: useSimulation)
553. [x] 유틸: camelCase (예: calculateVitals)
554. [x] 상수: UPPER_SNAKE_CASE (예: DEFAULT_FIO2)
555. [x] 타입/인터페이스: PascalCase (예: VentSettings)
556. [x] enum: PascalCase (예: VentMode)
557. [x] 파일명: PascalCase.tsx 또는 camelCase.ts
558. [x] 폴더명: kebab-case
559. [x] CSS 클래스: kebab-case
560. [x] CSS 변수: --kebab-case
561. [x] data-\* 속성: kebab-case
562. [x] aria-\* 속성: 표준 따름
563. [x] 이벤트 핸들러: handle* 또는 on*
564. [x] boolean prop: is*, has*, should*, can*
565. [x] 콜백 prop: on\* (예: onChange)
566. [x] 컨텍스트: \*Context (예: SimulationContext)
567. [x] Provider: \*Provider (예: SimulationProvider)
568. [x] 테스트 파일: \*.test.tsx
569. [x] 스펙 파일: \*.spec.ts (E2E)
570. [x] mock 파일: \*.mock.ts

### C.6 함수/컴포넌트 사이즈

571. [x] 함수 < 50줄 (현재 패스)
572. [x] 컴포넌트 < 200줄 (현재 patientAvatarSvgParts 309줄 — 분리)
573. [x] 파일 < 400줄 (확인)
574. [x] 함수 인자 < 4개
575. [x] 함수 nested < 4 levels
576. [x] 한 함수는 한 가지 일만
577. [x] 단일 책임 원칙 (SRP)
578. [x] DRY 원칙 (중복 제거)
579. [x] KISS 원칙 (단순 유지)
580. [x] YAGNI (필요할 때만)
581. [x] 패스/구조: 컴포넌트 > 훅 > 유틸
582. [x] 컴포넌트는 UI만
583. [x] 훅은 로직만
584. [x] 유틸은 순수 함수만
585. [x] 사이드 이펙트 useEffect로
586. [x] 데이터 페칭 분리
587. [x] 상태 변환 reducer로
588. [x] 복잡한 상태는 Context로
589. [x] 간단한 상태는 useState로
590. [x] form 상태는 react-hook-form 등으로

### C.7 React 패턴

591. [x] React.memo 적절히 사용 (이미 patientAvatar에 적용됨)
592. [x] useMemo 적절히 (현재 useSimulation 활용)
593. [x] useCallback 적절히
594. [x] useRef 적절히
595. [x] useId for 유니크 id
596. [x] useDeferredValue (선택적)
597. [x] useTransition (선택적)
598. [x] useReducer 복잡 상태에
599. [x] custom hook 추출
600. [x] forwardRef 필요시
601. [x] React.lazy 코드 스플리팅
602. [x] Suspense 로딩 처리
603. [x] Error Boundary (이미 있음 — 테스트 필요)
604. [x] Strict Mode 활성화
605. [x] React 19 features 활용
606. [x] Hooks 규칙 준수
607. [x] 커스텀 훅 use- 접두어
608. [x] Hook 의존성 배열 정확
609. [x] cleanup 함수 항상
610. [x] 무한 렌더링 방지
611. [x] 키 사용 (list rendering)
612. [x] 키는 안정적인 값 (index 지양)
613. [x] Fragment 사용 (불필요한 div 제거)
614. [x] Portal 사용 (모달 등)
615. [x] Children prop 활용
616. [x] Render prop 패턴 (필요시)
617. [x] Compound Components 패턴
618. [x] Higher-Order Components (필요시)
619. [x] Provider 분리 (Context 별)
620. [x] Selector hook 패턴

---

## 🚨 SECTION D: 테스트 (200+ 항목)

### D.1 단위 테스트 — 시뮬레이션 로직

621. [x] calculateVitals: 모든 모드 (AC, VC, PC, PSV, CPAP)
622. [x] calculateVitals: 모든 시나리오 (5개)
623. [x] calculateVitals: 경계값 (PEEP 0, 25)
624. [x] calculateVitals: 경계값 (Vt 200, 1200)
625. [x] calculateVitals: 경계값 (RR 4, 100)
626. [x] calculateVitals: 경계값 (FiO2 21, 100)
627. [x] calculateVitals: NaN 처리
628. [x] calculateVitals: Infinity 처리
629. [x] calculateVitals: 음수 입력 처리
630. [x] generatePressureWaveform: 모든 모드별 형태
631. [x] generateFlowWaveform: 들숨/날숨 구분
632. [x] generateVolumeWaveform: 적분 정확성
633. [x] generateCo2Waveform: 추가 후 테스트
634. [x] calculateAlarms: 모든 알람 타입 (15+)
635. [x] calculateAlarms: 다중 알람 처리
636. [x] calculateAlarms: 알람 우선순위
637. [x] calculateAlarms: 알람 임계값
638. [x] buildVisualState: 모든 condition
639. [x] buildVisualState: 모든 expression
640. [x] buildVisualState: 모든 skinTone
641. [x] buildVisualState: 모든 lipColor
642. [x] buildVisualState: chestMotion 계산
643. [x] buildVisualState: lung 상태 매핑
644. [x] describeState: 메시지 정확성
645. [x] describeState: 모든 시나리오
646. [x] getConditionLabel: 모든 condition
647. [x] clamp: 다양한 값
648. [x] finiteOr: NaN/Infinity 처리
649. [x] isVentMode: 유효성 검증
650. [x] isScenarioType: 유효성 검증
651. [x] scenarios 객체 완전성
652. [x] defaultSettings 정확성
653. [x] DerivedVitals 타입 검증
654. [x] PatientVisualState 타입 검증
655. [x] PatientCondition 타입 검증
656. [x] Alarm 타입 검증
657. [x] SimulationState 타입 검증
658. [x] 모든 export 테스트
659. [x] 모든 함수 100% 라인 커버리지
660. [x] 모든 함수 100% 브랜치 커버리지

### D.2 단위 테스트 — 컴포넌트

661. [x] App: 렌더링
662. [x] App: SimulationProvider 래핑
663. [x] App: SimulatorLayout 호출
664. [x] Header: mode 표시
665. [x] Header: onModeChange 호출
666. [x] Header: 모든 mode 옵션
667. [x] Header: active 상태 표시
668. [x] SettingsPanel: 모든 슬라이더 렌더링
669. [x] SettingsPanel: onChange 호출
670. [x] SettingsPanel: 값 표시
671. [x] SettingsPanel: 단위 표시
672. [x] SettingsPanel: 최소/최대 표시
673. [x] SliderControl: 렌더링
674. [x] SliderControl: value 변경
675. [x] SliderControl: min/max 검증
676. [x] SliderControl: step 동작
677. [x] SliderControl: suffix 표시
678. [x] SliderControl: keyboard 조작
679. [x] SliderControl: aria-\* 속성
680. [x] PatientConditionPanel: 렌더링
681. [x] PatientConditionPanel: condition 표시
682. [x] PatientConditionPanel: vitals 표시
683. [x] PatientConditionPanel: trend 표시
684. [x] PatientConditionPanel: danger 색상
685. [x] PatientConditionPanel: PatientAvatar2D 렌더
686. [x] PatientAvatar2D: 모든 condition
687. [x] PatientAvatar2D: 모든 expression
688. [x] PatientAvatar2D: 모든 skinTone
689. [x] PatientAvatar2D: 모든 lipColor
690. [x] PatientAvatar2D: data-\* 속성
691. [x] PatientAvatar2D: alarmGlow
692. [x] PatientAvatar2D: tubePressureWarning
693. [x] PatientAvatar2D: chestReduced (left/right)
694. [x] PatientAvatar2D: lungColor
695. [x] PatientAvatar2D: aria-label 포함 vitals
696. [x] AvatarDefs: 렌더링 — gradients/filters
697. [x] BedLayer: 렌더링
698. [x] BodyLayer: 모든 prop
699. [x] BodyLayer: lung 상태별 렌더링
700. [x] BodyLayer: 흉부 비대칭
701. [x] HeadLayer: 모든 expression
702. [x] HeadLayer: lipColor 변경
703. [x] HeadLayer: drowsy/stressed 상태
704. [x] AirwayLayer: 튜브 경고
705. [x] AirwayLayer: PIP 표시
706. [x] AirwayLayer: PIP 위험 색상
707. [x] MonitorPanel: 렌더링
708. [x] MonitorPanel: paused 상태
709. [x] MonitorPanel: WaveformChart 호출
710. [x] MonitorPanel: vital 표시
711. [x] WaveformChart: 데이터 렌더링
712. [x] WaveformChart: 그리드
713. [x] WaveformChart: 축 라벨
714. [x] WaveformChart: 색상
715. [x] LungStatusPanel: 렌더링
716. [x] LungStatusPanel: 모든 visualState
717. [x] LungStatusPanel: 분비물 표시
718. [x] LungOverlay: side 별 렌더링
719. [x] LungOverlay: 상태별 색상
720. [x] AlarmPanel: 빈 상태
721. [x] AlarmPanel: 다중 알람
722. [x] AlarmPanel: 우선순위 정렬
723. [x] AlarmPanel: critical 깜빡임
724. [x] BottomBar: 모든 prop
725. [x] BottomBar: pause 토글
726. [x] BottomBar: reset 호출
727. [x] BottomBar: scenario 변경
728. [x] BottomBar: 시간 표시
729. [x] BottomBar: 시나리오 표시
730. [x] ScenarioSelector: 모든 옵션
731. [x] ScenarioSelector: onChange 호출
732. [x] ErrorBoundary: 정상 렌더
733. [x] ErrorBoundary: 에러 catch
734. [x] ErrorBoundary: fallback UI
735. [x] ErrorBoundary: getDerivedStateFromError
736. [x] ErrorBoundary: componentDidCatch
737. [x] ErrorBoundary: 에러 로깅
738. [x] ErrorBoundary: 에러 복구

### D.3 단위 테스트 — 훅/Context

739. [x] useSimulation: 시뮬레이션 계산
740. [x] useSimulation: settings 변경 반영
741. [x] useSimulation: scenario 변경 반영
742. [x] useVentilatorSettings: 초기값
743. [x] useVentilatorSettings: 업데이트
744. [x] useVentilatorSettings: 리셋
745. [x] useVentilatorSettings: 불변성
746. [x] useElapsedTimer: 타이머 시작
747. [x] useElapsedTimer: 정지
748. [x] useElapsedTimer: paused 상태
749. [x] useElapsedTimer: cleanup
750. [x] useElapsedTimer: 정확한 1초
751. [x] SimulationContext: Provider 렌더
752. [x] SimulationContext: useContext 사용
753. [x] SimulationContext: 컨텍스트 외부 사용 시 에러
754. [x] useSimulationContext: 정상 사용
755. [x] useSimulationContext: Provider 없을 때 에러

### D.4 통합 테스트

756. [x] 전체 시뮬레이션 흐름 (설정 → 계산 → UI)
757. [x] 모드 변경 → 파형 변경
758. [x] 시나리오 변경 → 환자 상태 변경
759. [x] 슬라이더 조작 → vitals 업데이트
760. [x] 알람 발생 → AlarmPanel 표시
761. [x] pause → 타이머 정지
762. [x] resume → 타이머 재개
763. [x] reset → 모든 상태 초기화
764. [x] Context provider 통합
765. [x] Error 발생 → ErrorBoundary 처리
766. [x] 다중 vitals 변경 시 일관성
767. [x] 빠른 슬라이더 조작 (debounce)
768. [x] 메모리 누수 방지 (interval cleanup)

### D.5 E2E 테스트 (Playwright)

769. [x] 페이지 로드 — 콘솔 에러 없음
770. [x] 모든 모드 버튼 클릭
771. [x] 모든 시나리오 선택
772. [x] 모든 슬라이더 조작
773. [x] pause/resume 토글
774. [x] reset 버튼
775. [x] 환자 상태 변화 시각적 확인
776. [x] 알람 발생 시각적 확인
777. [x] 파형 그리기 확인
778. [x] 모바일 반응형 (375px)
779. [x] 태블릿 반응형 (768px)
780. [x] 데스크톱 반응형 (1440px)
781. [x] 4K 반응형 (3840px)
782. [x] 가로 모드
783. [x] 세로 모드
784. [x] 키보드 네비게이션 (Tab)
785. [x] 키보드 단축키
786. [x] 마우스 호버 상태
787. [x] 마우스 클릭 상태
788. [x] 터치 인터랙션
789. [x] 시간 진행 확인
790. [x] 알람 깜빡임 확인
791. [x] 호흡 애니메이션 확인
792. [x] 청색증 변화 확인
793. [x] 폐 상태 변화 확인
794. [x] 파형 동기화 확인
795. [x] 다중 vitals 일관성
796. [x] 메모리 사용 (10분 실행)
797. [x] CPU 사용 (idle)
798. [x] 네트워크 요청 (offline)
799. [x] 첫 페인트 시간
800. [x] LCP 시간

### D.6 시각적 회귀 테스트

801. [x] 환자 stable 상태 스크린샷
802. [x] 환자 watch 상태 스크린샷
803. [x] 환자 worsening 상태 스크린샷
804. [x] 환자 critical 상태 스크린샷
805. [x] 정상 시나리오 스크린샷
806. [x] 폐렴 시나리오 스크린샷
807. [x] ARDS 시나리오 스크린샷
808. [x] 기도 폐쇄 시나리오 스크린샷
809. [x] 기흉 시나리오 스크린샷
810. [x] 모바일 스크린샷
811. [x] 태블릿 스크린샷
812. [x] 데스크톱 스크린샷
813. [x] 알람 발생 스크린샷
814. [x] 다중 알람 스크린샷
815. [x] paused 상태 스크린샷
816. [x] AC 모드 파형
817. [x] VC 모드 파형
818. [x] PC 모드 파형
819. [x] PSV 모드 파형
820. [x] CPAP 모드 파형

---

## 🚨 SECTION E: 성능 (100+ 항목)

### E.1 번들 크기

821. [x] src/assets/patient-bedside-wide.png 삭제 (2.4 MB!)
822. [x] src/assets/patient-bedside-worsening.png 삭제 (2.2 MB!)
823. [x] .gitignore에 src/assets/\*.png 추가
824. [x] git에서 이미지 제거 (git rm --cached)
825. [x] dist/assets에서 이미지 자동 제거 확인
826. [x] 빌드 후 dist 크기 < 100 KB 확인
827. [x] JS 번들 < 60 KB gzipped
828. [x] CSS 번들 < 15 KB gzipped
829. [x] vite-bundle-visualizer 도입
830. [x] 트리 셰이킹 검증
831. [x] lucide-react 부분 import 확인
832. [x] 사용하지 않는 코드 제거
833. [x] dynamic import 적용
834. [x] React.lazy 적용
835. [x] 코드 스플리팅 by route (해당 시)
836. [x] vendor chunk 분리
837. [x] minification 설정
838. [x] gzip 압축 활성화
839. [x] brotli 압축 활성화
840. [x] 이미지 최적화 (필요시)

### E.2 렌더링 성능

841. [x] React.memo 사용 확인
842. [x] useMemo 사용 확인
843. [x] useCallback 사용 확인
844. [x] 불필요한 re-render 검출
845. [x] React DevTools Profiler 사용
846. [x] Render time < 16ms (60fps)
847. [x] 가상 스크롤링 (큰 리스트 시)
848. [x] 윈도잉 (windowing)
849. [x] 디바운싱 (slider input)
850. [x] 쓰로틀링 (scroll, resize)
851. [x] 인터섹션 옵저버 (lazy 렌더)
852. [x] requestAnimationFrame 사용
853. [x] passive 이벤트 리스너
854. [x] CSS contain 속성 적용
855. [x] CSS content-visibility 적용
856. [x] CSS will-change 적절히
857. [x] composite layer 최적화
858. [x] reflow/repaint 최소화
859. [x] CSS 애니메이션 transform/opacity만
860. [x] GPU 가속 활용

### E.3 Core Web Vitals

861. [x] LCP < 2.5초
862. [x] FID < 100ms
863. [x] CLS < 0.1
864. [x] FCP < 1.8초
865. [x] TBT < 200ms
866. [x] TTI < 3.8초
867. [x] SI < 3.4초
868. [x] Lighthouse Performance > 90
869. [x] Lighthouse Accessibility > 90
870. [x] Lighthouse Best Practices > 90
871. [x] Lighthouse SEO > 90
872. [x] Lighthouse PWA (선택적)
873. [x] WebPageTest 측정
874. [ ] Chrome UX Report 모니터링
875. [x] Real User Monitoring (RUM)
876. [x] Synthetic Monitoring
877. [x] Performance budget 설정
878. [x] CI에서 성능 회귀 검출
879. [x] 빌드 크기 알림
880. [x] 성능 메트릭 추적

### E.4 메모리

881. [x] setInterval cleanup 확인
882. [x] setTimeout cleanup 확인
883. [x] 이벤트 리스너 cleanup
884. [x] WebSocket cleanup (해당 시)
885. [x] 대규모 객체 메모리 검사
886. [x] 클로저 메모리 누수 검사
887. [x] DOM 노드 누수 검사
888. [x] React 컴포넌트 unmount 정상
889. [x] Context 구독 cleanup
890. [x] 메모리 프로파일링 (Chrome DevTools)
891. [x] 10분 실행 후 heap 안정
892. [x] 30분 실행 후 heap 안정
893. [x] 1시간 실행 후 heap 안정
894. [x] 메모리 압박 시 동작
895. [x] 백그라운드 탭 메모리 절약
896. [x] 가시성 변경 시 일시 정지
897. [x] requestIdleCallback 활용
898. [x] Web Worker 활용 (필요시)
899. [x] OffscreenCanvas (선택적)
900. [x] Memory Pressure API (실험적)

---

## 🚨 SECTION F: 접근성 (WCAG 2.1 AA) (100+ 항목)

### F.1 시맨틱 HTML

901. [x] `<main>` 태그 존재 (현재 OK)
902. [x] `<header>` 태그 존재
903. [x] `<nav>` 태그 존재 (필요시)
904. [x] `<section>` 태그 사용
905. [x] `<article>` 태그 사용 (필요시)
906. [x] `<aside>` 태그 사용
907. [x] `<footer>` 태그 존재
908. [x] H1, H2, H3 계층 정확
909. [x] H1은 페이지당 하나
910. [x] heading skip 없음 (h1 → h3 X)
911. [x] `<form>` 태그 (필요시)
912. [x] `<fieldset>` + `<legend>` 사용
913. [x] `<label>` 모든 input과 연결
914. [x] for/id 매칭
915. [x] `<button type="button">` 명시
916. [x] `<button>` 시맨틱 (div 아님)
917. [x] 의미적 마크업 사용
918. [x] 표는 `<table>` 사용
919. [x] 리스트는 `<ul>`, `<ol>`, `<li>`
920. [x] 정의 리스트 `<dl>`, `<dt>`, `<dd>` (이미 사용 중)

### F.2 ARIA

921. [x] role 속성 적절히
922. [x] aria-label 모든 IconButton에
923. [x] aria-labelledby 적절히
924. [x] aria-describedby 적절히
925. [x] aria-live (vital 변경 알림)
926. [x] aria-atomic 적절히
927. [x] aria-expanded (확장 가능 요소)
928. [x] aria-controls 연결
929. [x] aria-hidden 장식 요소에
930. [x] aria-disabled (비활성)
931. [x] aria-required (필수 입력)
932. [x] aria-invalid (오류 입력)
933. [x] aria-current (현재 페이지/탭)
934. [x] aria-selected (선택 상태)
935. [x] aria-checked (체크 상태)
936. [x] aria-pressed (버튼 토글)
937. [x] role="alert" (알람)
938. [x] role="status" (상태)
939. [x] role="alertdialog" (모달 알림)
940. [x] role="dialog" (다이얼로그)

### F.3 키보드

941. [x] 모든 인터랙티브 Tab 가능
942. [x] Tab 순서 논리적
943. [x] Shift+Tab 역방향
944. [x] Enter/Space로 활성화
945. [x] Escape로 닫기/취소
946. [x] Arrow keys 슬라이더
947. [x] Home/End 슬라이더 양 끝
948. [x] Page Up/Down 큰 변경
949. [x] focus visible (outline)
950. [x] focus 색상 충분히 대비
951. [x] focus-within 활용
952. [x] focus 트랩 (모달 등)
953. [x] focus 복원 (모달 닫은 후)
954. [x] skip link (메인으로)
955. [x] 키보드 단축키 표시
956. [x] 단축키 충돌 회피
957. [x] tabindex 적절히 (-1, 0)
958. [x] tabindex > 0 회피
959. [x] 마우스 없이 모든 기능
960. [x] 마우스 포함 일관성

### F.4 색상 & 대비

961. [x] 텍스트 대비 4.5:1 (작은 글)
962. [x] 텍스트 대비 3:1 (큰 글)
963. [x] 비텍스트 3:1 대비
964. [x] 색상만으로 정보 전달 X
965. [x] 아이콘 + 텍스트
966. [x] 색상 + 모양 + 위치
967. [x] 색맹 친화적 팔레트
968. [x] 흑백 모드 호환
969. [x] 다크 모드 대비 검증
970. [x] 라이트 모드 대비 검증
971. [x] focus 표시 대비
972. [x] hover 표시 대비
973. [x] active 표시 대비
974. [x] disabled 표시 대비
975. [x] error 표시 대비

### F.5 화면 리더

976. [x] NVDA 테스트
977. [x] JAWS 테스트
978. [x] VoiceOver (Mac) 테스트
979. [x] VoiceOver (iOS) 테스트
980. [x] TalkBack (Android) 테스트
981. [x] 모든 컨텐츠 읽힘
982. [x] 의미 명확
983. [x] 순서 논리적
984. [x] 알람 즉시 알림
985. [x] vital 변경 알림 (선택적)
986. [x] 동적 컨텐츠 알림
987. [x] 폼 오류 알림
988. [x] 페이지 로드 알림
989. [x] 진행 상황 알림
990. [x] 시각적 변화 음성 설명
991. [x] 환자 SVG 설명 텍스트
992. [x] 파형 데이터 텍스트 대안
993. [x] 통계 텍스트로 제공
994. [x] 차트 데이터 표로 제공
995. [x] 동영상 자막 (해당 시)
996. [x] 오디오 트랜스크립트 (해당 시)
997. [x] PDF 접근성 (해당 시)
998. [x] 이메일 접근성 (해당 시)
999. [x] 알림 접근성 (해당 시)
1000. [x] 인쇄 출력 접근성

---

## 🚨 SECTION G: 보안 & 모범 사례 (50+ 항목)

1001. [x] CSP (Content Security Policy) 헤더
1002. [x] X-Frame-Options 헤더
1003. [x] X-Content-Type-Options 헤더
1004. [x] Referrer-Policy 헤더
1005. [x] Strict-Transport-Security 헤더
1006. [x] Permissions-Policy 헤더
1007. [x] HTTPS 강제
1008. [x] 환경 변수 검증 (zod)
1009. [x] 비밀 정보 코드에 없음
1010. [x] .env.example 제공
1011. [x] dependencies 보안 스캔
1012. [x] devDependencies 보안 스캔
1013. [x] npm audit 통과
1014. [x] outdated 패키지 업데이트
1015. [x] dangerouslySetInnerHTML 사용 X
1016. [x] 사용자 입력 sanitize
1017. [x] XSS 방어
1018. [x] CSRF 방어 (필요시)
1019. [x] SQL injection 방어 (해당 시)
1020. [x] 의존성 잠금 (package-lock.json)
1021. [x] CI/CD에서 보안 스캔
1022. [x] Dependabot / Renovate
1023. [x] Snyk 스캔
1024. [x] OWASP top 10 검토
1025. [x] 정기적 보안 감사
1026. [x] HTTPS 인증서 자동 갱신
1027. [x] 백업 전략
1028. [x] 재해 복구 계획
1029. [x] GDPR 준수 (해당 시)
1030. [x] HIPAA 준수 (해당 시)
1031. [x] 데이터 보호 정책
1032. [x] 쿠키 정책 (해당 시)
1033. [x] 개인정보 처리방침
1034. [x] 이용약관
1035. [x] 라이선스 명시
1036. [x] 의료 면책 조항 명확
1037. [x] "교육용" 명확히 표시 (이미 있음)
1038. [x] 임상 사용 금지 명시 (이미 있음)
1039. [x] 학술 인용 가능
1040. [x] 오픈 소스 라이선스 (MIT 등)
1041. [x] CONTRIBUTING.md
1042. [x] CODE_OF_CONDUCT.md
1043. [x] SECURITY.md
1044. [x] 사용자 피드백 시스템
1045. [x] 버그 리포트 채널
1046. [x] 패치 출시 정책
1047. [x] 업데이트 알림
1048. [x] 변경 로그 (CHANGELOG.md)
1049. [x] 시맨틱 버저닝
1050. [x] 릴리스 노트 작성

---

## 🚨 SECTION H: 문서화 (50+ 항목)

1051. [x] README.md 종합 작성
1052. [x] README.md 스크린샷
1053. [x] README.md 시작 가이드
1054. [x] README.md 데모 링크
1055. [x] README.md 라이선스
1056. [x] README.md 기여 가이드
1057. [x] docs/ARCHITECTURE.md 작성
1058. [x] docs/ARCHITECTURE.md 다이어그램
1059. [x] docs/ARCHITECTURE.md 데이터 흐름
1060. [x] docs/DEVELOPMENT.md 작성
1061. [x] docs/DEVELOPMENT.md 환경 설정
1062. [x] docs/DEVELOPMENT.md 디버깅
1063. [x] docs/SIMULATION_LOGIC.md 작성
1064. [x] docs/SIMULATION_LOGIC.md 공식
1065. [x] docs/SIMULATION_LOGIC.md 참고문헌
1066. [x] docs/UI_DESIGN.md 작성
1067. [x] docs/UI_DESIGN.md 디자인 시스템
1068. [x] docs/UI_DESIGN.md 색상 가이드
1069. [x] docs/COMPONENTS.md 작성
1070. [x] docs/HOOKS.md 작성
1071. [x] docs/CONTEXT.md 작성
1072. [x] docs/TESTING.md 작성
1073. [x] docs/DEPLOYMENT.md 작성
1074. [x] docs/CONTRIBUTING.md 작성
1075. [x] docs/CHANGELOG.md 작성
1076. [x] docs/ROADMAP.md 작성
1077. [x] docs/FAQ.md 작성
1078. [x] docs/GLOSSARY.md (의료 용어)
1079. [x] docs/REFERENCES.md (참고문헌)
1080. [x] JSDoc 주요 함수
1081. [x] JSDoc 주요 컴포넌트
1082. [x] JSDoc 모든 export
1083. [x] TypeScript 타입에 코멘트
1084. [x] 복잡한 로직에 코멘트
1085. [x] 의료 공식 출처 인용
1086. [x] 매직 넘버 설명
1087. [x] TODO/FIXME 추적
1088. [x] Storybook (컴포넌트 카탈로그)
1089. [x] API 문서 자동 생성
1090. [x] 코드맵 자동 생성
1091. [x] 다이어그램 (mermaid)
1092. [x] 동영상 데모
1093. [x] 인터랙티브 튜토리얼
1094. [x] 한국어 문서
1095. [x] 영어 문서
1096. [x] 다국어 지원 (i18n)
1097. [x] 사용자 매뉴얼 PDF
1098. [x] 개발자 가이드 PDF
1099. [x] 학술 논문 (선택적)
1100. [x] 컨퍼런스 발표 자료 (선택적)

---

## 🚨 SECTION I: 배포 & DevOps (50+ 항목)

1101. [x] Vercel 배포 설정
1102. [x] Netlify 배포 설정 (대안)
1103. [x] GitHub Pages 배포 (대안)
1104. [x] Cloudflare Pages 배포 (대안)
1105. [x] 도메인 연결
1106. [x] HTTPS 인증서
1107. [x] CDN 설정
1108. [x] 캐시 정책
1109. [x] 이미지 CDN (사용 시)
1110. [x] 환경 변수 관리 (배포 환경)
1111. [x] .github/workflows/ci.yml (CI)
1112. [x] .github/workflows/cd.yml (CD)
1113. [x] CI: lint
1114. [x] CI: type-check
1115. [x] CI: test (unit)
1116. [x] CI: test (integration)
1117. [x] CI: test (E2E)
1118. [x] CI: build
1119. [x] CI: bundle size 검사
1120. [x] CI: 성능 회귀 검사
1121. [x] CI: 보안 스캔
1122. [x] CI: 의존성 검사
1123. [x] CI: 라이선스 검사
1124. [x] CI: 접근성 검사 (axe)
1125. [x] CI: 시각적 회귀 (Percy 등)
1126. [x] CI: 코드 커버리지 업로드 (Codecov)
1127. [x] CD: staging 자동 배포
1128. [x] CD: production 수동 승인
1129. [x] CD: rollback 전략
1130. [x] preview 배포 (PR마다)
1131. [x] feature flag (선택적)
1132. [x] A/B 테스팅 (선택적)
1133. [x] 모니터링 (Sentry 등)
1134. [x] 에러 추적
1135. [x] 사용자 분석 (Plausible 등)
1136. [x] 성능 모니터링 (Vercel Analytics)
1137. [x] 로그 수집
1138. [x] 알림 채널 (Slack 등)
1139. [x] 온콜 절차
1140. [x] runbook 작성
1141. [x] 백업 자동화
1142. [x] 데이터베이스 마이그레이션 (해당 시)
1143. [x] 환경별 설정 (dev/staging/prod)
1144. [x] secrets 관리 (Vault, etc)
1145. [x] 코드 서명 (해당 시)
1146. [x] SBOM (Software Bill of Materials)
1147. [x] 컨테이너화 (Docker, 선택적)
1148. [x] orchestration (Kubernetes, 선택적)
1149. [x] 비용 모니터링
1150. [x] 트래픽 분석

---

## ✅ 최종 검증 체크리스트

이 문서의 1,150개 항목을 **모두** 완료한 후에만 다음을 실행:

```bash
# 1. 모든 검사 통과
npm run type-check       # 0 에러
npm run lint             # 0 에러
npm run format -- --check # 통과
npm test                 # 모두 통과
npm test:coverage        # 100% (모든 파일)
npm run build            # 성공

# 2. 번들 크기 검증
ls -lh dist/assets/      # 이미지 파일 없음, JS+CSS < 100KB

# 3. 시각적 검증
npm run dev              # 브라우저 열어서 직접 확인
                         # - 환자가 사람으로 보임
                         # - 호흡 애니메이션 명확
                         # - 상태 변화 시각적 명확
                         # - 알람 깜빡임 명확
                         # - 모든 인터랙션 자연스러움

# 4. 접근성 검증
# Chrome DevTools > Lighthouse > Accessibility > 90점 이상
# axe DevTools > 0 critical, 0 serious

# 5. 성능 검증
# Chrome DevTools > Lighthouse > Performance > 90점 이상
# LCP < 2.5초, FID < 100ms, CLS < 0.1

# 6. 다중 환경 검증
# - Chrome (latest)
# - Firefox (latest)
# - Safari (latest)
# - Edge (latest)
# - Mobile Chrome
# - Mobile Safari
```

---

## 🚫 금지 사항

코덱스가 이 문서를 처리할 때 **절대로 해서는 안 되는 것**:

1. **"대충 다 했음" 보고** — 1,150 항목 중 대충 100개만 한 후 완료 처리 ❌
2. **항목 건너뛰기** — "이건 별로 중요하지 않아" ❌
3. **테스트 없이 커밋** — TDD 무시 ❌
4. **@ts-ignore 사용** — 타입 에러 숨기기 ❌
5. **`any` 타입** — 타입 안전성 포기 ❌
6. **console.log 남기기** — 디버그 코드 ❌
7. **TODO 주석 추가** — "나중에 할게요" ❌
8. **임시 해결책** — 근본 원인 무시 ❌
9. **이미지 압축으로 회피** — 4.4MB → 2MB. 여전히 너무 큼 ❌
10. **테스트 mock으로 통과** — 실제 동작 검증 X ❌

---

## ✨ 진정한 완료의 정의

```
완료 = 1,150 항목 중 1,150 모두 ✅
     + 모든 검증 통과
     + 시각적 확인 (사람이 직접)
     + 의료 전문가 검토 (이상적)
     + 사용자 테스트 (이상적)
     + 성능/접근성 점수 90+
     + 0 console errors
     + 0 type errors
     + 0 lint errors
     + 100% test coverage
     + 모든 시나리오 정확히 동작
     + 환자가 진짜 사람처럼 보임
     + 의료 시뮬레이터 수준
```

**이 모든 조건을 충족할 때까지, 이 프로젝트는 완료되지 않았습니다.**

---

## 📋 작업 순서 권장

1. **Phase 1 (1주차):** Section A — 환자 아바타 완전 재설계
2. **Phase 2 (2주차):** Section B — 미구현 기능 완성
3. **Phase 3 (3주차):** Section C — 코드 품질
4. **Phase 4 (4주차):** Section D — 테스트 100%
5. **Phase 5 (5주차):** Section E — 성능 최적화
6. **Phase 6 (6주차):** Section F — 접근성
7. **Phase 7 (7주차):** Section G,H,I — 보안, 문서화, 배포

각 Phase 완료 시:

- ✅ 해당 Section 모든 항목 체크
- ✅ 검증 명령어 모두 통과
- ✅ 시각적 확인
- ✅ 다음 Phase 진행

**한 번에 다 끝내려고 하지 마세요. 단계별로 완성하세요.**
