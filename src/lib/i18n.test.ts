import { describe, expect, it } from 'vitest';
import {
  APP_COPY,
  LOCALE_OPTIONS,
  LOCALIZATION_DETAIL_RULES,
  LOCALIZATION_MEDICAL_STANDARDS,
  LOCALIZED_DOCUMENTATION_SET,
  MEDICAL_GLOSSARY_BY_LOCALE,
  REGIONAL_COMPLIANCE_REFERENCES,
  SUPPORTED_LOCALES,
  TRANSLATION_WORKFLOW,
  UNIT_SYSTEMS,
  detectBrowserLocale,
  formatLocalizedCurrency,
  formatLocalizedDate,
  formatLocalizedNumber,
  formatLocalizedTime,
  localeDirection,
  resolveLocale,
  sortLocalized,
} from './i18n';

describe('i18n locale registry', () => {
  it('covers all F.1 supported languages with fallback-safe copy', () => {
    expect(SUPPORTED_LOCALES).toEqual([
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
    ]);
    expect(LOCALE_OPTIONS).toHaveLength(SUPPORTED_LOCALES.length);
    for (const locale of SUPPORTED_LOCALES) {
      expect(APP_COPY[locale].bottomBar.scenario).toBeTruthy();
      expect(APP_COPY[locale].header.languageSelect).toBeTruthy();
      expect(APP_COPY[locale].educationWarning).toBeTruthy();
    }
  });

  it('resolves browser, URL, RTL, glossary, unit, and medical standards metadata', () => {
    expect(resolveLocale('zh_CN')).toBe('zh-CN');
    expect(resolveLocale('en-US')).toBe('en');
    expect(detectBrowserLocale(['fr-FR'])).toBe('fr');
    expect(localeDirection('ar')).toBe('rtl');
    expect(localeDirection('he')).toBe('rtl');
    expect(localeDirection('ko')).toBe('ltr');
    expect(MEDICAL_GLOSSARY_BY_LOCALE.ko.FiO2).toBe('흡입 산소 농도');
    expect(MEDICAL_GLOSSARY_BY_LOCALE.en.PEEP).toBe('positive end-expiratory pressure');
    expect(UNIT_SYSTEMS['imperial-us']).toContain('degF');
    expect(UNIT_SYSTEMS.si).toContain('kPa');
    expect(LOCALIZATION_MEDICAL_STANDARDS.fhir).toContain('FHIR');
    expect(LOCALIZATION_MEDICAL_STANDARDS.who).toContain('WHO');
    expect(TRANSLATION_WORKFLOW.peerReview).toContain('Two-reviewer');
    expect(TRANSLATION_WORKFLOW.communityContribution).toContain('Community');
    expect(TRANSLATION_WORKFLOW.contributionGuide).toContain('fallback');
  });

  it('formats local dates, numbers, money, sorting, cultural rules, policies, and docs', () => {
    const date = new Date('2026-05-12T08:30:00Z');
    expect(formatLocalizedDate(date, 'ko')).toMatch(/2026-05-12/);
    expect(formatLocalizedDate(date, 'en')).toMatch(/5\/12\/2026|5\/11\/2026/);
    expect(formatLocalizedTime(date, 'en', '12h')).toMatch(/AM|PM/);
    expect(formatLocalizedTime(date, 'de', '24h')).toMatch(/\d{2}:\d{2}/);
    expect(formatLocalizedNumber(1000, 'en')).toBe('1,000.00');
    expect(formatLocalizedNumber(1000, 'de')).toBe('1.000,00');
    expect(formatLocalizedCurrency(12, 'en', 'USD')).toContain('$');
    expect(sortLocalized(['나', '가'], 'ko')).toEqual(['가', '나']);
    expect(LOCALIZATION_DETAIL_RULES.colorSemantics.globalDanger).toContain('label');
    expect(LOCALIZATION_DETAIL_RULES.colorSemantics.china).toContain('celebration');
    expect(LOCALIZATION_DETAIL_RULES.nameFormats.familyGiven).toContain('ko');
    expect(LOCALIZATION_DETAIL_RULES.postalCodeFormats.kr).toBe('NNNNN');
    expect(REGIONAL_COMPLIANCE_REFERENCES.dataProtection).toContain('GDPR');
    expect(REGIONAL_COMPLIANCE_REFERENCES.hipaa).toContain('HIPAA');
    expect(REGIONAL_COMPLIANCE_REFERENCES.iso13485).toContain('ISO 13485');
    expect(LOCALIZED_DOCUMENTATION_SET.multilingualManual).toContain('manual');
    expect(LOCALIZED_DOCUMENTATION_SET.troubleshootingGuide).toContain('Troubleshooting');
  });
});
