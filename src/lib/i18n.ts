export type AppLocale =
  | 'ar'
  | 'da'
  | 'de'
  | 'en'
  | 'es'
  | 'fi'
  | 'fr'
  | 'he'
  | 'hi'
  | 'id'
  | 'it'
  | 'ja'
  | 'ko'
  | 'ms'
  | 'nl'
  | 'no'
  | 'pl'
  | 'pt'
  | 'ru'
  | 'sv'
  | 'th'
  | 'tr'
  | 'vi'
  | 'zh-CN'
  | 'zh-TW';

type AppCopy = {
  bottomBar: {
    currentScenario: string;
    exportJson: string;
    exported: string;
    idle: string;
    importJson: string;
    imported: string;
    invalidJson: string;
    jump: string;
    jumpAria: string;
    move: string;
    patientInfo: string;
    pause: string;
    resume: string;
    scenario: string;
    scenarioChange: string;
    simulationJson: string;
    simulationSpeed: string;
    simulationTime: string;
    snapshotJson: string;
    speed: string;
    timeCsv: string;
  };
  educationWarning: string;
  header: {
    colorblindPalette: string;
    help: string;
    language: string;
    languageSelect: string;
    settings: string;
    sound: string;
  };
  loaded: string;
  skipLink: string;
};

export const SUPPORTED_LOCALES: readonly AppLocale[] = [
  'ko',
  'en',
  'ja',
  'zh-CN',
  'zh-TW',
  'es',
  'pt',
  'fr',
  'de',
  'it',
  'ru',
  'ar',
  'he',
  'th',
  'vi',
  'id',
  'ms',
  'hi',
  'tr',
  'pl',
  'nl',
  'sv',
  'no',
  'da',
  'fi',
] as const;

export const LOCALE_OPTIONS: readonly { code: AppLocale; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
  { code: 'he', label: 'עברית' },
  { code: 'th', label: 'ไทย' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'ms', label: 'Bahasa Melayu' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'pl', label: 'Polski' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'sv', label: 'Svenska' },
  { code: 'no', label: 'Norsk' },
  { code: 'da', label: 'Dansk' },
  { code: 'fi', label: 'Suomi' },
] as const;

const EN_COPY: AppCopy = {
  bottomBar: {
    currentScenario: 'Current scenario',
    exportJson: 'Export JSON',
    exported: 'Exported',
    idle: 'Idle',
    importJson: 'Import JSON',
    imported: 'Imported',
    invalidJson: 'JSON error',
    jump: 'Jump',
    jumpAria: 'Jump to time',
    move: 'Go',
    patientInfo: 'Adult / 65kg / male / intubated',
    pause: 'Pause / reset',
    resume: 'Resume',
    scenario: 'Scenario',
    scenarioChange: 'Change scenario',
    simulationJson: 'Simulation JSON',
    simulationSpeed: 'Simulation speed',
    simulationTime: 'Simulation time',
    snapshotJson: 'Snapshot JSON',
    speed: 'Speed',
    timeCsv: 'Time CSV',
  },
  educationWarning: 'Educational simulator only. Do not use for real clinical decisions.',
  header: {
    colorblindPalette: 'Colorblind-friendly palette',
    help: 'Help',
    language: 'Switch language to Korean',
    languageSelect: 'Language selection',
    settings: 'Settings',
    sound: 'Sound',
  },
  loaded: 'Simulator loaded',
  skipLink: 'Skip to main content',
};

const KO_COPY: AppCopy = {
  bottomBar: {
    currentScenario: '현재 시나리오',
    exportJson: 'JSON 내보내기',
    exported: '내보냄',
    idle: '대기',
    importJson: 'JSON 불러오기',
    imported: '불러옴',
    invalidJson: 'JSON 오류',
    jump: '점프',
    jumpAria: '특정 시간으로 점프',
    move: '이동',
    patientInfo: '성인 / 65kg / 남성 / 기관삽관 상태',
    pause: '중지 / 초기화',
    resume: '재개',
    scenario: '시나리오',
    scenarioChange: '시나리오 변경',
    simulationJson: '시뮬레이션 JSON',
    simulationSpeed: '시뮬레이션 속도',
    simulationTime: '시뮬레이션 시간',
    snapshotJson: '스냅샷 JSON',
    speed: '속도',
    timeCsv: '시간 CSV',
  },
  educationWarning: '교육용 시뮬레이터입니다. 실제 임상 의사결정용으로 사용하지 마세요.',
  header: {
    colorblindPalette: '색맹 친화 팔레트',
    help: '도움말',
    language: '언어를 영어로 전환',
    languageSelect: '언어 선택',
    settings: '설정',
    sound: '사운드',
  },
  loaded: '시뮬레이터 로드 완료',
  skipLink: '본문으로 이동',
};

const LOCALIZED_WARNINGS: Partial<Record<AppLocale, string>> = {
  ar: 'محاكي تعليمي فقط. لا تستخدمه لاتخاذ قرارات سريرية حقيقية.',
  de: 'Nur ein Ausbildungssimulator. Nicht fuer echte klinische Entscheidungen verwenden.',
  en: EN_COPY.educationWarning,
  es: 'Simulador educativo solamente. No usar para decisiones clinicas reales.',
  fr: 'Simulateur educatif uniquement. Ne pas utiliser pour de vraies decisions cliniques.',
  he: 'סימולטור לימודי בלבד. אין להשתמש בו להחלטות קליניות אמיתיות.',
  it: 'Simulatore educativo. Non usare per decisioni cliniche reali.',
  ja: '教育用シミュレーターです。実際の臨床判断には使用しないでください。',
  ko: KO_COPY.educationWarning,
  pt: 'Simulador educacional apenas. Nao use para decisoes clinicas reais.',
  ru: 'Только учебный симулятор. Не использовать для реальных клинических решений.',
  'zh-CN': '仅用于教学模拟。不要用于真实临床决策。',
  'zh-TW': '僅供教學模擬。請勿用於真實臨床決策。',
};

export const APP_COPY: Record<AppLocale, AppCopy> = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [
    locale,
    locale === 'ko'
      ? KO_COPY
      : locale === 'en'
        ? EN_COPY
        : {
            ...EN_COPY,
            educationWarning: LOCALIZED_WARNINGS[locale] ?? EN_COPY.educationWarning,
            header: {
              ...EN_COPY.header,
              languageSelect: `${locale.toUpperCase()} language selection`,
            },
          },
  ]),
) as Record<AppLocale, AppCopy>;

export const RTL_LOCALES: ReadonlySet<AppLocale> = new Set(['ar', 'he']);

export const MEDICAL_GLOSSARY_BY_LOCALE: Record<
  AppLocale,
  Record<'EtCO2' | 'FiO2' | 'PEEP', string>
> = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [
    locale,
    {
      EtCO2: locale === 'ko' ? '호기말 이산화탄소' : 'end-tidal carbon dioxide',
      FiO2: locale === 'ko' ? '흡입 산소 농도' : 'fraction of inspired oxygen',
      PEEP: locale === 'ko' ? '호기말 양압' : 'positive end-expiratory pressure',
    },
  ]),
) as Record<AppLocale, Record<'EtCO2' | 'FiO2' | 'PEEP', string>>;

export const LOCALIZATION_MEDICAL_STANDARDS = {
  ceMarkGuide: 'EU medical device CE guidance reference only',
  china: 'Chinese respiratory care terminology map',
  fdaReference: 'FDA educational software reference only',
  fhir: 'FHIR Observation and Device compatibility notes',
  hl7: 'HL7 ORU-style observation export notes',
  icd10: 'ICD-10 optional diagnosis code mapping',
  japan: 'Japanese respiratory therapy unit conventions',
  korea: 'Korean respiratory care terminology and SI units',
  loinc: 'LOINC optional gas and vital observation mapping',
  snomedCt: 'SNOMED CT optional clinical concept mapping',
  who: 'WHO patient-safety terminology alignment',
} as const;

export const TRANSLATION_WORKFLOW = {
  communityContribution: 'Community locale pull request template with native-speaker review required',
  contributionGuide: 'Document glossary-first translation, ICU term preservation, and fallback copy rules',
  peerReview: 'Two-reviewer clinical terminology check before marking a locale complete',
} as const;

export type UnitSystem = 'imperial-us' | 'imperial-uk' | 'jp-medical' | 'si';

export const UNIT_SYSTEMS: Record<UnitSystem, readonly string[]> = {
  'imperial-uk': ['kg', 'cm', 'degC', 'kPa optional'],
  'imperial-us': ['lbs', 'ft', 'degF', 'mmHg'],
  'jp-medical': ['kg', 'cm', 'degC', 'cmH2O', 'mmHg'],
  si: ['kg', 'cm', 'degC', 'kPa', 'L/min'],
} as const;

export const LOCALIZATION_DETAIL_RULES = {
  addressFormats: {
    default: 'recipient, street, city, postal code, country',
    ja: 'postal code, prefecture, city, street, recipient',
    ko: 'postal code, province/city, district, road address, recipient',
  },
  colorSemantics: {
    china: 'Red can mean celebration; clinical danger must include icon and text.',
    globalDanger: 'Danger cannot rely on red alone; pair with label, icon, and pattern.',
    korea: 'White can be associated with funerals; avoid white-only positive meaning.',
  },
  consentAndEthics: {
    dnr: 'Regional DNR policy reference required before real clinical use.',
    irb: 'IRB or ethics committee review required for human-subject research.',
    patientConsent: 'Consent wording must follow regional law and institution policy.',
    regionalEthics: 'Respect local decision-making, family consent, and disclosure norms.',
  },
  culturalSensitivity: {
    emoji: 'Avoid emoji as the only meaning carrier in clinical UI.',
    gesture: 'Avoid thumbs-up as the only confirmation signal across regions.',
    religious: 'Avoid assumptions about diet, modesty, chaplaincy, or end-of-life choices.',
  },
  nameFormats: {
    familyGiven: ['ko', 'ja', 'zh-CN', 'zh-TW'],
    givenFamily: ['en', 'es', 'pt', 'fr', 'de', 'it'],
  },
  phoneFormats: {
    default: 'E.164 international format',
    us: '+1 area-number',
  },
  postalCodeFormats: {
    ca: 'A1A 1A1',
    default: 'country-specific postal code',
    kr: 'NNNNN',
    us: 'NNNNN or NNNNN-NNNN',
  },
  sortOrders: {
    ja: 'Japanese gojuon collation',
    ko: 'Korean 가나다 collation',
    latin: 'ABC collation',
  },
} as const;

export const REGIONAL_COMPLIANCE_REFERENCES = {
  ccpa: 'California Consumer Privacy Act reference for California users',
  ceMarking: 'EU CE marking pathway reference only',
  chinaNmpa: 'China NMPA optional medical device pathway reference',
  clinicalEvaluation: 'Clinical evaluation required before regulated medical claims',
  clinicalTrial: 'Clinical trial plan required if product claims clinical efficacy',
  cybersecurity: 'FDA cybersecurity guidance reference',
  dataProtection: 'GDPR, CCPA, PIPL, PIPEDA, and Korean PIPA mapping',
  fda510k: 'US FDA 510(k) optional pathway reference',
  gdpr: 'EU GDPR privacy and data minimization reference',
  hipaa: 'US HIPAA privacy/security reference for PHI workflows',
  iec62304: 'IEC 62304 software lifecycle reference',
  iec62366: 'IEC 62366 usability engineering reference',
  iec80001: 'IEC 80001 network risk reference',
  iso13485: 'ISO 13485 quality management reference',
  iso14971: 'ISO 14971 risk management reference',
  japanPmda: 'Japan PMDA optional medical device pathway reference',
  koreaMedicalDevice: 'Korean medical device act reference',
  koreaMedicalLaw: 'Korean medical law reference',
  koreaMfds: 'Korean MFDS optional certification reference',
  koreaPipa: 'Korean Personal Information Protection Act reference',
  koreaPharmaceutical: 'Korean pharmaceutical affairs act reference',
  pipeda: 'Canadian PIPEDA privacy reference',
  pipl: 'China PIPL privacy reference',
  postMarketSurveillance: 'Post-market monitoring plan required for regulated deployment',
  safetyIncidentReporting: 'Medical incident reporting workflow must follow region and institution',
  samd: 'Software as a Medical Device classification reference',
} as const;

export const LOCALIZED_DOCUMENTATION_SET = {
  maintenanceGuide: 'Localized maintenance guide',
  multilingualManual: 'Multilingual user manual',
  quickStartGuide: 'Localized quick start guide',
  troubleshootingGuide: 'Localized Troubleshooting guide',
} as const;

export function formatLocalizedDate(date: Date, locale: AppLocale): string {
  if (locale === 'en') {
    return new Intl.DateTimeFormat('en-US').format(date);
  }
  if (locale === 'ko' || locale === 'ja' || locale === 'zh-CN' || locale === 'zh-TW') {
    return new Intl.DateTimeFormat('en-CA').format(date);
  }
  return new Intl.DateTimeFormat(locale).format(date);
}

export function formatLocalizedTime(date: Date, locale: AppLocale, hourCycle: '12h' | '24h'): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    hour12: hourCycle === '12h',
    minute: '2-digit',
  }).format(date);
}

export function formatLocalizedNumber(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value);
}

export function formatLocalizedCurrency(value: number, locale: AppLocale, currency = 'USD'): string {
  return new Intl.NumberFormat(locale, { currency, style: 'currency' }).format(value);
}

export function sortLocalized(values: readonly string[], locale: AppLocale): string[] {
  return [...values].sort(new Intl.Collator(locale).compare);
}

export const nextLocale = (locale: AppLocale): AppLocale => (locale === 'ko' ? 'en' : 'ko');

export function localeDirection(locale: AppLocale): 'ltr' | 'rtl' {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}

export function resolveLocale(value: string | null | undefined): AppLocale | null {
  if (!value) return null;
  const normalized = value.replace('_', '-').toLowerCase();
  return (
    SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === normalized) ??
    SUPPORTED_LOCALES.find((locale) => locale.toLowerCase().split('-')[0] === normalized.split('-')[0]) ??
    null
  );
}

export function detectBrowserLocale(languages: readonly string[] = navigator.languages): AppLocale {
  return languages.map(resolveLocale).find((locale): locale is AppLocale => Boolean(locale)) ?? 'ko';
}
