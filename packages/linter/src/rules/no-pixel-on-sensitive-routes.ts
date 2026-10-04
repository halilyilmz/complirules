import { LinterRule, LintViolation } from '../types.js';

const SENSITIVE_PATH =
  /(^|\/)(health|rx|prescriptions?|conditions?|therapy|symptoms?|patient|patients|portal|appointments?|telehealth|medical|checkout|payment|billing|kids?|children)(\/|\.|$)/i;

const COMMERCIAL_TRACKER =
  /\bfbq\s*\(|connect\.facebook\.net|\bgtag\s*\(|googletagmanager\.com|google-analytics\.com|\bttq\.(?:track|page|load)|analytics\.tiktok\.com|\bsnaptr\s*\(|sc-static\.net|_linkedin_partner_id|snap\.licdn\.com|static\.ads-twitter\.com|\bpintrk\s*\(|static\.hotjar\.com/i;

export const noPixelOnSensitiveRoutesRule: LinterRule = {
  id: 'no-pixel-on-sensitive-routes',
  name: 'Sağlık / Checkout / Çocuk Sayfalarında Ticari Reklam Pikseli Yasağı',
  lawCitation: 'FTC v. GoodRx (2023), FTC v. BetterHelp (2023), FTC Act Sec. 5, HBNR 16 CFR 318, HIPAA, COPPA',
  severity: 'CRITICAL',
  filePattern: /\.(tsx|jsx|ts|js|html|vue|php)$/,
  check(filePath: string, content: string): LintViolation[] {
    if (!SENSITIVE_PATH.test(filePath)) return [];

    const violations: LintViolation[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!COMMERCIAL_TRACKER.test(line)) continue;

      violations.push({
        file: filePath,
        line: i + 1,
        column: 1,
        ruleId: this.id,
        severity: this.severity,
        message:
          'Hassas rota (sağlık/checkout/çocuk) içinde ticari izleme pikseli bulundu. Sağlık durumu veya kimlik verisi reklam ağlarına aktarılırsa FTC ve HIPAA yaptırımı doğar; onay (consent) bu rotalarda tek başına yeterli kabul edilmez.',
        lawCitation: this.lawCitation,
        matchedSnippet: line.trim().length > 150 ? line.trim().substring(0, 147) + '...' : line.trim(),
        suggestedFix:
          'Bu rotadan reklam/retargeting piksellerini kaldırın. Ölçümleme gerekiyorsa kendi sunucunuzda barındırılan, kimlik içermeyen toplulaştırılmış analitik kullanın (`shouldBlockCommercialTracking`).'
      });
    }

    return violations;
  }
};
