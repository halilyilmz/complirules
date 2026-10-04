import * as ts from 'typescript';
import { ComplianceRule, RuleViolation } from '../runner.js';

const FORBIDDEN_FONT_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'use.typekit.net',
  'cloud.typography.com',
];

export const noExternalFontCdnRule: ComplianceRule = {
  id: 'complirules/no-external-font-cdn',
  description: 'Prohibits loading web fonts directly from third-party CDNs without local hosting.',
  statutoryBasis: 'GDPR Chapter V (International Transfers) & Art. 6(1)',
  precedentCitation: 'LG München I, Urteil vom 20.01.2022 - Az. 3 O 17493/20',

  check(sourceFile: ts.SourceFile): RuleViolation[] {
    const violations: RuleViolation[] = [];

    function visit(node: ts.Node) {
      // 1. Check String Literals (e.g. imports in CSS-in-JS, strings in JSX)
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        const text = node.text;
        for (const host of FORBIDDEN_FONT_HOSTS) {
          if (text.includes(host)) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              ruleId: 'complirules/no-external-font-cdn',
              severity: 'error',
              message: `Direct font CDN reference to "${host}" transmits visitor IP addresses to third parties without prior consent. Self-host font files locally.`,
              statutoryBasis: 'GDPR Chapter V / Art. 6(1)',
              precedentCitation: 'LG München I Az. 3 O 17493/20 (€100 statutory damages per visitor)',
              filePath: sourceFile.fileName,
              line: line + 1,
              column: character + 1,
            });
          }
        }
      }

      // 2. Check Template Expressions: `https://${host}/...`
      if (ts.isTemplateExpression(node)) {
        const fullText = node.getText(sourceFile);
        for (const host of FORBIDDEN_FONT_HOSTS) {
          if (fullText.includes(host)) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              ruleId: 'complirules/no-external-font-cdn',
              severity: 'error',
              message: `Dynamic template URL matches unauthorized font CDN "${host}".`,
              statutoryBasis: 'GDPR Chapter V',
              precedentCitation: 'LG München I Az. 3 O 17493/20',
              filePath: sourceFile.fileName,
              line: line + 1,
              column: character + 1,
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return violations;
  },
};
