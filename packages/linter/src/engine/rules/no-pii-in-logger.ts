import * as ts from 'typescript';
import { ComplianceRule, RuleViolation } from '../runner.js';

const PII_VARIABLE_PATTERNS = [
  /email/i,
  /password/i,
  /secret/i,
  /ssn/i,
  /tckn/i, // Turkish TC Kimlik No
  /phonenumber/i,
  /creditcard/i,
  /medicalrecord/i,
  /healthcondition/i,
  /biometric/i,
];

const LOG_CALL_IDENTIFIERS = ['log', 'warn', 'error', 'info', 'debug', 'trace'];

export const noPiiInLoggerRule: ComplianceRule = {
  id: 'complirules/no-pii-in-logger',
  description: 'Prevents leakage of sensitive personal data or PHI into unencrypted application log streams.',
  statutoryBasis: 'GDPR Art. 5(1)(c) (Data Minimisation) & HIPAA §164.312(b) (Audit Controls)',
  precedentCitation: 'French CNIL & FTC Enforcement (Rite Aid / BetterHelp)',

  check(sourceFile: ts.SourceFile): RuleViolation[] {
    const violations: RuleViolation[] = [];
    const loggerAliases = new Set<string>(['console', 'logger', 'winston', 'pino', 'fastify.log']);

    // Pass 1: Identify Logger Aliases (e.g. const logger = console; const { log } = console)
    ts.forEachChild(sourceFile, function scanAliases(node) {
      if (ts.isVariableDeclaration(node) && node.initializer) {
        const initText = node.initializer.getText(sourceFile);
        if (initText === 'console' || initText.includes('winston') || initText.includes('pino')) {
          if (ts.isIdentifier(node.name)) {
            loggerAliases.add(node.name.text);
          }
        }
      }
      ts.forEachChild(node, scanAliases);
    });

    // Pass 2: Detect Calls with PII Arguments
    function inspectNode(node: ts.Node) {
      if (ts.isCallExpression(node)) {
        let isLogCall = false;

        // Pattern A: obj.log(...)
        if (ts.isPropertyAccessExpression(node.expression)) {
          const propName = node.expression.name.text;
          const objText = node.expression.expression.getText(sourceFile);
          if (LOG_CALL_IDENTIFIERS.includes(propName) && loggerAliases.has(objText)) {
            isLogCall = true;
          }
        }

        // Pattern B: log(...) directly
        if (ts.isIdentifier(node.expression)) {
          if (LOG_CALL_IDENTIFIERS.includes(node.expression.text)) {
            isLogCall = true;
          }
        }

        if (isLogCall) {
          for (const arg of node.arguments) {
            const argText = arg.getText(sourceFile);
            for (const pattern of PII_VARIABLE_PATTERNS) {
              if (pattern.test(argText)) {
                const { line, character } = sourceFile.getLineAndCharacterOfPosition(arg.getStart());
                violations.push({
                  ruleId: 'complirules/no-pii-in-logger',
                  severity: 'error',
                  message: `Argument "${argText}" matches PII/PHI pattern. Log statements must use compliant masking primitives (e.g. maskPII(data)).`,
                  statutoryBasis: 'GDPR Art. 5(1)(c) & HIPAA §164.312(b)',
                  precedentCitation: 'French CNIL & FTC Enforcement (Rite Aid / BetterHelp)',
                  filePath: sourceFile.fileName,
                  line: line + 1,
                  column: character + 1,
                });
                break;
              }
            }
          }
        }
      }

      ts.forEachChild(node, inspectNode);
    }

    inspectNode(sourceFile);
    return violations;
  },
};
