import { BUILT_IN_RULES, noUnredactedLogsRule } from '@complirules/linter';

export interface AuditCodePiiInput {
  code: string;
  filePath?: string;
}

export function handleAuditCodePii(input: AuditCodePiiInput): string {
  const { code, filePath = 'snippet.ts' } = input;
  const violations = noUnredactedLogsRule.check(filePath, code);

  if (violations.length === 0) {
    return '✅ PII/PHI Log Denetimi: Kod parçacığında açık metin kişisel veri loglaması veya yetkisiz telemetri sızıntısı tespit edilmedi.';
  }

  const reports = violations.map(v => 
    `- Satır ${v.line}: **${v.message}**\n  *Kod:* \`${v.matchedSnippet}\`\n  *Dayanak:* ${v.lawCitation}\n  *Düzeltme:* ${v.suggestedFix}`
  ).join('\n\n');

  return `### 🚨 CompliRules PII/PHI Sızıntı Uyarısı\n\n${reports}\n\n` +
    `**Güvenli Kodlama Örneği:**\n` +
    `\`\`\`typescript\nimport { createRedactedLogger } from '@complirules/primitives';\n` +
    `const logger = createRedactedLogger();\n` +
    `logger.info("İşlem tamamlandı", { userId: user.id }); // email ve tckn otomatik maskelenir\n\`\`\``;
}
