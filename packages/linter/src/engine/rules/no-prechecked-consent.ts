import * as ts from 'typescript';
import { ComplianceRule, RuleViolation } from '../runner.js';

export const noPrecheckedConsentRule: ComplianceRule = {
  id: 'complirules/no-prechecked-consent',
  description: 'Detects pre-ticked or default-checked checkboxes in consent management interfaces.',
  statutoryBasis: 'GDPR Art. 4(11), Art. 7(4) & ePrivacy Art. 5(3)',
  precedentCitation: 'CJEU C-673/17 (Planet49 GmbH)',

  check(sourceFile: ts.SourceFile): RuleViolation[] {
    const violations: RuleViolation[] = [];

    function visit(node: ts.Node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tagName = node.tagName.getText(sourceFile);

        if (tagName === 'input' || tagName.toLowerCase().includes('checkbox')) {
          let hasDefaultChecked = false;
          let hasCheckedTrue = false;
          let isConsentRelated = false;

          const parentText = node.parent.getText(sourceFile).toLowerCase();
          if (
            parentText.includes('consent') ||
            parentText.includes('cookie') ||
            parentText.includes('kvkk') ||
            parentText.includes('gdpr') ||
            parentText.includes('marketing') ||
            parentText.includes('newsletter')
          ) {
            isConsentRelated = true;
          }

          for (const attr of node.attributes.properties) {
            if (ts.isJsxAttribute(attr) && attr.name) {
              const attrName = attr.name.getText(sourceFile);

              if (attrName === 'defaultChecked') {
                if (!attr.initializer) {
                  hasDefaultChecked = true;
                } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
                  const exprText = attr.initializer.expression.getText(sourceFile);
                  if (exprText === 'true') {
                    hasDefaultChecked = true;
                  }
                }
              }

              if (attrName === 'checked') {
                if (!attr.initializer) {
                  hasCheckedTrue = true; // <input checked />
                } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
                  const exprText = attr.initializer.expression.getText(sourceFile);
                  if (exprText === 'true') {
                    hasCheckedTrue = true;
                  }
                }
              }
            }
          }

          if (isConsentRelated && (hasDefaultChecked || hasCheckedTrue)) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              ruleId: 'complirules/no-prechecked-consent',
              severity: 'error',
              message: 'Pre-checked consent checkbox detected in a privacy/consent context. Consent must be an unambiguous, affirmative act.',
              statutoryBasis: 'GDPR Art. 4(11), 7(4) & ePrivacy Art. 5(3)',
              precedentCitation: 'CJEU Case C-673/17 (Planet49)',
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
