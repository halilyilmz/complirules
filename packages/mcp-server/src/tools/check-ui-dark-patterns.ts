import { noPretickedConsentRule, noBundledConsentRule } from '@complirules/linter/rules';

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

  // EAA 2025 accessibility checks
  const eaaIssues: string[] = [];
  if (/<button[^>]*>\s*<svg[^>]*>[\s\S]*?<\/svg>\s*<\/button>/i.test(componentCode) && !/aria-label=/i.test(componentCode)) {
    eaaIssues.push('⚠️ [EAA 2025 / WCAG 2.1 AA] Missing Accessible Name: Icon-only button lacks an `aria-label` description for screen readers.');
  }

  if (/outline:\s*none/i.test(componentCode) && !/focus-visible/i.test(componentCode)) {
    eaaIssues.push('⚠️ [EAA 2025 / WCAG 2.1 AA] Keyboard Focus Trap: `outline: none` removes focus indication without providing a visible `:focus-visible` replacement ring.');
  }

  if (violations.length === 0 && eaaIssues.length === 0) {
    return '✅ UI/Form Compliance Audit: No dark patterns (pre-ticked consent, bundled opt-in) or EAA accessibility violations detected.';
  }

  const reports = violations.map(v => 
    `- Line ${v.line}: **${v.message}**\n  *Code:* \`${v.matchedSnippet}\`\n  *Citation:* ${v.lawCitation}\n  *Suggested Fix:* ${v.suggestedFix}`
  );

  return `### 🛑 CompliRules UI & Dark Pattern Audit Report\n\n` +
    (reports.length > 0 ? `**Statutory Consent Violations (KVKK / GDPR):**\n${reports.join('\n\n')}\n\n` : '') +
    (eaaIssues.length > 0 ? `**Accessibility Violations (EAA 2025 / WCAG 2.1 AA):**\n${eaaIssues.join('\n\n')}\n\n` : '');
}
