import * as ts from 'typescript';
import { ComplianceRule, RuleViolation } from '../runner.js';

export const requireGpcHandlerRule: ComplianceRule = {
  id: 'complirules/require-gpc-handler',
  description: 'Requires Next.js middleware and API routes handling user telemetry to evaluate the Sec-GPC header.',
  statutoryBasis: 'CCPA §1798.135(b) & Cal. Code Regs. tit. 11, § 7025',
  precedentCitation: 'California Attorney General Enforcement: People v. Sephora USA, Inc. ($1.2M settlement)',

  check(sourceFile: ts.SourceFile): RuleViolation[] {
    const violations: RuleViolation[] = [];

    // Only apply to middleware or route handlers
    const isMiddlewareOrRoute =
      sourceFile.fileName.includes('middleware') ||
      sourceFile.fileName.includes('/api/') ||
      sourceFile.fileName.includes('/route.') ||
      sourceFile.fileName.includes('route.ts');

    if (!isMiddlewareOrRoute) return violations;

    const fileContent = sourceFile.getFullText();
    const checksHeaders = fileContent.includes('headers.get') || fileContent.includes('request.headers');
    const handlesGpc = fileContent.includes('sec-gpc') || fileContent.includes('Sec-GPC');

    if (checksHeaders && !handlesGpc) {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(0);
      violations.push({
        ruleId: 'complirules/require-gpc-handler',
        severity: 'warning',
        message: 'HTTP header processing detected without evaluation of Global Privacy Control ("Sec-GPC"). CCPA requires treating GPC signals as a valid opt-out of sale/sharing.',
        statutoryBasis: 'CCPA §1798.135(b)',
        precedentCitation: 'People v. Sephora USA, Inc. (2022)',
        filePath: sourceFile.fileName,
        line: line + 1,
        column: character + 1,
      });
    }

    return violations;
  },
};
