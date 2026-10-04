import { LinterRule, LintViolation } from '../types.js';

export const noBundledConsentRule: LinterRule = {
  id: 'no-bundled-consent',
  name: 'Birleştirilmiş Rıza (Bundled Consent / Hizmetin Rızaya Bağlanması) Yasağı',
  lawCitation: '6698 Sayılı KVKK İlke Kararı 2019/09 & GDPR Art. 7(4)',
  severity: 'CRITICAL',
  filePattern: /\.(tsx|jsx|html|vue)$/,
  check(filePath: string, content: string): LintViolation[] {
    const violations: LintViolation[] = [];
    const lines = content.split('\n');

    // Hem sözleşmeyi hem de pazarlama/kampanyayı tek onayda birleştiren ifadeler
    const bundledPatterns = [
      /(sözleşme|kullanım koşul|terms).*(ve|ile).*(kampanya|pazarlama|bülten|newsletter|sms)/i,
      /(terms|privacy).*(and|with).*(marketing|promotional|newsletter)/i
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of bundledPatterns) {
        if (pattern.test(line)) {
          violations.push({
            file: filePath,
            line: i + 1,
            column: 1,
            ruleId: this.id,
            severity: this.severity,
            message: 'Kullanıcı Sözleşmesi ile Pazarlama/İletişim onayı tek bir metin veya kutuda birleştirilmiş (Bundled Consent). Hizmet sunumu açık rıza şartına bağlanamaz.',
            lawCitation: this.lawCitation,
            matchedSnippet: line.trim(),
            suggestedFix: 'Kullanıcı sözleşmesini ayrı bir zorunlu kutu, pazarlama iznini ise ayrı ve İSTEĞE BAĞLI (ihtiyari) bir kutu olarak ayırın.'
          });
        }
      }
    }

    return violations;
  }
};
