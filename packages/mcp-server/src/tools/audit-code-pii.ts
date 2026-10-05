import { noUnredactedLogsRule } from '@complirules/linter/rules';

export interface AuditCodePiiInput {
  code: string;
  filePath?: string;
}

export function handleAuditCodePii(input: AuditCodePiiInput): string {
  const { code, filePath = 'snippet.ts' } = input;
  const violations = noUnredactedLogsRule.check(filePath, code);

  if (violations.length === 0) {
    return '✅ PII/PHI Logging Audit: No unredacted cleartext personal data logging or unauthorized telemetry leakage detected in this snippet.';
  }

  const reports = violations.map(v => 
    `- Line ${v.line}: **${v.message}**\n  *Code:* \`${v.matchedSnippet}\`\n  *Citation:* ${v.lawCitation}\n  *Suggested Fix:* ${v.suggestedFix}`
  ).join('\n\n');

  return `### 🚨 CompliRules PII/PHI Leakage Alert\n\n${reports}\n\n` +
    `**Secure Coding Reference:**\n` +
    `\`\`\`typescript\nimport { createRedactedLogger } from '@complirules/primitives';\n` +
    `const logger = createRedactedLogger();\n` +
    `logger.info("Operation completed", { userId: user.id }); // email, passwords, and national IDs automatically redacted\n\`\`\``;
}
