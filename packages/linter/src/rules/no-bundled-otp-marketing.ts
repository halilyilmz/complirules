import { LinterRule, LintViolation } from '../types.js';

const CONSENT_LITERAL_TRUE =
  /\b(marketingConsent|etkConsent|marketing_consent|commercialMessageConsent|dataProcessingConsent|smsConsent|sms_consent)\s*[:=]\s*true\b/g;

const OTP_CONTEXT = /\botp\b|verify[-_ ]?(?:code|otp|sms|phone)|verifyOtp|sms[-_ ]?code|one[-_ ]?time[-_ ]?(?:code|password)/i;

const LOOKBACK_CHARS = 800;

export const noBundledOtpMarketingRule: LinterRule = {
  id: 'no-bundled-otp-marketing',
  name: 'OTP/SMS Doğrulamasıyla Pazarlama veya Veri İşleme Rızası Alma Yasağı',
  lawCitation: 'KVKK Kurulu 10.06.2025 tarihli 2025/1072 sayılı İlke Kararı (RG 26.06.2025/32938) & 6563 s. ETK Md. 6',
  severity: 'CRITICAL',
  filePattern: /\.(ts|tsx|js|jsx|mjs|py|php)$/,
  check(filePath: string, content: string): LintViolation[] {
    const violations: LintViolation[] = [];
    CONSENT_LITERAL_TRUE.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = CONSENT_LITERAL_TRUE.exec(content)) !== null) {
      const windowStart = Math.max(0, match.index - LOOKBACK_CHARS);
      const before = content.substring(windowStart, match.index);
      if (!OTP_CONTEXT.test(before)) continue;

      violations.push({
        file: filePath,
        line: content.substring(0, match.index).split('\n').length,
        column: 1,
        ruleId: this.id,
        severity: this.severity,
        message:
          'OTP/SMS doğrulama akışı içinde rıza alanı sabit `true` atanıyor. Doğrulama kodu girişi pazarlama veya veri işleme izni sayılamaz (tek eylemle çoklu onay yasağı).',
        lawCitation: this.lawCitation,
        matchedSnippet: match[0],
        suggestedFix:
          'OTP doğrulamasında yalnızca `phoneVerified` güncelleyin; rızayı ayrı, işaretsiz bir onay kutusuyla ve `assertOtpEffectsAreSeparated` ile alın.'
      });
    }

    return violations;
  }
};
