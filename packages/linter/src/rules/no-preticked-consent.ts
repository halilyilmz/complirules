import { LinterRule, LintViolation } from '../types.js';

export const noPretickedConsentRule: LinterRule = {
  id: 'no-preticked-consent',
  name: 'Önceden İşaretlenmiş Rıza Kutusu (Pre-ticked Box / Dark Pattern) Yasağı',
  lawCitation: 'GDPR Recital 32 & KVKK Kurul Kararları (Açık Rıza İlkesi)',
  severity: 'CRITICAL',
  filePattern: /\.(tsx|jsx|html|vue)$/,
  check(filePath: string, content: string): LintViolation[] {
    const violations: LintViolation[] = [];
    const lines = content.split('\n');

    const pretickPattern = /<input[^>]+type=["']checkbox["'][^>]*\b(defaultChecked\s*=\s*\{?true\}?|defaultChecked)\b/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = pretickPattern.exec(line);
      if (match) {
        violations.push({
          file: filePath,
          line: i + 1,
          column: match.index + 1,
          ruleId: this.id,
          severity: this.severity,
          message: 'Önceden işaretlenmiş (pre-ticked) onay kutusu tespit edildi. Açık rıza kullanıcının aktif eylemi (olumlu irade beyanı) ile verilmelidir.',
          lawCitation: this.lawCitation,
          matchedSnippet: line.trim(),
          suggestedFix: 'defaultChecked={true} özelliğini kaldırın; varsayılan olarak unchecked olmalıdır.'
        });
      }
    }

    return violations;
  }
};
