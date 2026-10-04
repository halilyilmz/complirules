import { noPretickedConsentRule, noBundledConsentRule } from '@complirules/linter';

export interface CheckUiDarkPatternsInput {
  componentCode: string;
  filePath?: string;
}

export function handleCheckUiDarkPatterns(input: CheckUiDarkPatternsInput): string {
  const { componentCode, filePath = 'FormComponent.tsx' } = input;
  const violations = [
    ...noPretickedConsentRule.check(filePath, componentCode),
    ...noBundledConsentRule.check(filePath, componentCode)
  ];

  // EAA 2025 erişilebilirlik kontrolleri
  const eaaIssues: string[] = [];
  if (/<button[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>\s*<\/button>/i.test(componentCode) && !/aria-label=/i.test(componentCode)) {
    eaaIssues.push('⚠️ [EAA 2025 / WCAG 2.1 AA] İkon Buton Eksikliği: Buton içerisinde sadece ikon var ancak ekran okuyucular için `aria-label` tanımlanmamış.');
  }

  if (/outline:\s*none/i.test(componentCode) && !/focus-visible/i.test(componentCode)) {
    eaaIssues.push('⚠️ [EAA 2025 / WCAG 2.1 AA] Klavye Odak Tuzağı: `outline: none` kullanılmış ancak görünür bir `focus-visible` halkası eklenmemiş.');
  }

  if (violations.length === 0 && eaaIssues.length === 0) {
    return '✅ UI/Form Uyumluluk Denetimi: Formda Dark Pattern (önceden işaretli onay, birleştirilmiş rıza) veya EAA erişilebilirlik ihlali bulunamadı.';
  }

  const reports = violations.map(v => 
    `- Satır ${v.line}: **${v.message}**\n  *Kod:* \`${v.matchedSnippet}\`\n  *Dayanak:* ${v.lawCitation}\n  *Düzeltme:* ${v.suggestedFix}`
  );

  return `### 🛑 CompliRules UI & Hukuki Örüntü Denetimi\n\n` +
    (reports.length > 0 ? `**Hukuki İhlaller (KVKK / GDPR):**\n${reports.join('\n\n')}\n\n` : '') +
    (eaaIssues.length > 0 ? `**Erişilebilirlik İhlalleri (EAA 2025):**\n${eaaIssues.join('\n\n')}\n\n` : '');
}
