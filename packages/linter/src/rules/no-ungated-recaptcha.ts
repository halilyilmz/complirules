import { LinterRule, LintViolation } from '../types.js';

const RECAPTCHA_PATTERN =
  /google\.com\/recaptcha\/(?:api|enterprise)\.js|gstatic\.com\/recaptcha|www\.recaptcha\.net|\bg-recaptcha\b|react-google-recaptcha|\bgrecaptcha\./i;

const GATING_PATTERN = /hasConsent|isCategoryAllowed|consentGranted|cookieConsent|data-category|type\s*=\s*["']text\/plain["']/;

export const noUngatedRecaptchaRule: LinterRule = {
  id: 'no-ungated-recaptcha',
  name: 'Önceden Rıza Olmadan Google reCAPTCHA Yükleme Yasağı',
  lawCitation: 'CNIL SAN-2023-003 Cityscoot (16.03.2023), ePrivacy Md. 5(3) & Avusturya DSB',
  severity: 'HIGH',
  filePattern: /\.(tsx|jsx|html|vue|php)$/,
  check(filePath: string, content: string): LintViolation[] {
    const violations: LintViolation[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!RECAPTCHA_PATTERN.test(line)) continue;

      const context = lines.slice(Math.max(0, i - 5), i + 1).join('\n');
      if (GATING_PATTERN.test(context)) continue;

      violations.push({
        file: filePath,
        line: i + 1,
        column: 1,
        ruleId: this.id,
        severity: this.severity,
        message:
          'reCAPTCHA, donanım/tarayıcı telemetrisi toplayıp Google\'a aktarır ve "kesinlikle gerekli" muafiyetine girmez; ön rıza olmadan yüklenemez.',
        lawCitation: this.lawCitation,
        matchedSnippet: line.trim().length > 150 ? line.trim().substring(0, 147) + '...' : line.trim(),
        suggestedFix:
          'Telemetri göndermeyen Proof-of-Work alternatifi (Altcha/mCaptcha), çerezsiz Turnstile yapılandırması kullanın veya yüklemeyi CMP rızasına bağlayın.'
      });
    }

    return violations;
  }
};
