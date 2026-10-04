import { LinterRule, LintViolation } from '../types.js';

export const noRemoteGoogleFontsRule: LinterRule = {
  id: 'no-remote-google-fonts',
  name: 'Uzak Google Fonts CDN Kullanımı ve Sınır Ötesi IP Aktarımı Yasağı',
  lawCitation: 'GDPR Schrems II & LG München I (3 O 17493/20)',
  severity: 'HIGH',
  filePattern: /\.(tsx|jsx|html|css|scss)$/,
  check(filePath: string, content: string): LintViolation[] {
    const violations: LintViolation[] = [];
    const lines = content.split('\n');

    const remoteFontPattern = /(fonts\.googleapis\.com|fonts\.gstatic\.com)/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (remoteFontPattern.test(line)) {
        violations.push({
          file: filePath,
          line: i + 1,
          column: 1,
          ruleId: this.id,
          severity: this.severity,
          message: 'Uzak Google Fonts CDN bağlantısı tespit edildi. Kullanıcı IP adresinin kullanıcının rızası olmadan ABD sunucularına aktarılması GDPR ihlalidir.',
          lawCitation: this.lawCitation,
          matchedSnippet: line.trim(),
          suggestedFix: 'Fontları self-host edin (Next.js için `next/font/local` veya `@fontsource/*` kullanın).'
        });
      }
    }

    return violations;
  }
};
