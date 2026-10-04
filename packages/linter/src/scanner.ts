import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';
import { LinterRule, LintResult, LintViolation } from './types.js';
import { noUnredactedLogsRule } from './rules/no-unredacted-logs.js';
import { noPretickedConsentRule } from './rules/no-preticked-consent.js';
import { enforceCryptoShreddingRule } from './rules/enforce-crypto-shredding.js';
import { noRemoteGoogleFontsRule } from './rules/no-remote-google-fonts.js';
import { noBundledConsentRule } from './rules/no-bundled-consent.js';
import { noUngatedAnalyticsScriptsRule } from './rules/no-ungated-analytics-scripts.js';
import { noUnproxiedRemoteImagesRule } from './rules/no-unproxied-remote-images.js';
import { noDirectExternalEmbedsRule } from './rules/no-direct-external-embeds.js';
import { noUngatedRecaptchaRule } from './rules/no-ungated-recaptcha.js';
import { noPixelOnSensitiveRoutesRule } from './rules/no-pixel-on-sensitive-routes.js';
import { enforceBccBulkEmailRule } from './rules/enforce-bcc-bulk-email.js';
import { noBundledOtpMarketingRule } from './rules/no-bundled-otp-marketing.js';
import { enforceGpcOptoutRule } from './rules/enforce-gpc-optout.js';
import { ComplianceRule } from './engine/runner.js';
import { noExternalFontCdnRule } from './engine/rules/no-external-font-cdn.js';
import { noPiiInLoggerRule } from './engine/rules/no-pii-in-logger.js';
import { noPrecheckedConsentRule as astNoPrecheckedConsentRule } from './engine/rules/no-prechecked-consent.js';
import { requireGpcHandlerRule } from './engine/rules/require-gpc-handler.js';

export function astRuleToLinterRule(
  rule: ComplianceRule,
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'CRITICAL'
): LinterRule {
  return {
    id: rule.id,
    name: rule.description,
    lawCitation: rule.statutoryBasis + (rule.precedentCitation ? ' | ' + rule.precedentCitation : ''),
    severity,
    filePattern: /\.(ts|tsx|js|jsx)$/,
    check(filePath: string, fileContent: string): LintViolation[] {
      const sourceFile = ts.createSourceFile(
        filePath,
        fileContent,
        ts.ScriptTarget.Latest,
        true,
        filePath.endsWith('.tsx') || filePath.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );
      const violations = rule.check(sourceFile);
      const lines = fileContent.split(/\r?\n/);
      return violations.map(v => ({
        file: v.filePath,
        line: v.line,
        column: v.column,
        ruleId: v.ruleId,
        severity: v.severity === 'error' ? 'CRITICAL' : 'HIGH',
        message: v.message,
        lawCitation: v.statutoryBasis + (v.precedentCitation ? ' (' + v.precedentCitation + ')' : ''),
        matchedSnippet: lines[v.line - 1]?.trim() ?? ''
      }));
    }
  };
}

export const astExternalFontCdnLinterRule = astRuleToLinterRule(noExternalFontCdnRule, 'CRITICAL');
export const astPiiLoggerLinterRule = astRuleToLinterRule(noPiiInLoggerRule, 'CRITICAL');
export const astPrecheckedConsentLinterRule = astRuleToLinterRule(astNoPrecheckedConsentRule, 'CRITICAL');
export const astGpcHandlerLinterRule = astRuleToLinterRule(requireGpcHandlerRule, 'HIGH');

export const BUILT_IN_RULES: LinterRule[] = [
  noUnredactedLogsRule,
  noPretickedConsentRule,
  enforceCryptoShreddingRule,
  noRemoteGoogleFontsRule,
  noBundledConsentRule,
  noUngatedAnalyticsScriptsRule,
  noUnproxiedRemoteImagesRule,
  noDirectExternalEmbedsRule,
  noUngatedRecaptchaRule,
  noPixelOnSensitiveRoutesRule,
  enforceBccBulkEmailRule,
  noBundledOtpMarketingRule,
  enforceGpcOptoutRule,
  astExternalFontCdnLinterRule,
  astPiiLoggerLinterRule,
  astPrecheckedConsentLinterRule,
  astGpcHandlerLinterRule
];

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  '.cursor'
]);

export function scanFile(filePath: string, customRules: LinterRule[] = BUILT_IN_RULES): LintViolation[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const violations: LintViolation[] = [];

  const normalizedPath = filePath.replace(/\\/g, '/');
  for (const rule of customRules) {
    if (rule.filePattern.test(normalizedPath)) {
      const found = rule.check(normalizedPath, content);
      violations.push(...found);
    }
  }

  return violations;
}

export function scanDirectory(dirPath: string, customRules: LinterRule[] = BUILT_IN_RULES): LintResult {
  const violations: LintViolation[] = [];
  let checkedFilesCount = 0;

  function traverse(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        checkedFilesCount++;
        const fileViolations = scanFile(fullPath, customRules);
        violations.push(...fileViolations);
      }
    }
  }

  if (fs.existsSync(dirPath)) {
    const stat = fs.statSync(dirPath);
    if (stat.isDirectory()) {
      traverse(dirPath);
    } else {
      checkedFilesCount = 1;
      violations.push(...scanFile(dirPath, customRules));
    }
  }

  const critical = violations.filter(v => v.severity === 'CRITICAL').length;
  const high = violations.filter(v => v.severity === 'HIGH').length;
  const medium = violations.filter(v => v.severity === 'MEDIUM').length;

  return {
    passed: violations.length === 0,
    checkedFilesCount,
    violations,
    summary: { critical, high, medium }
  };
}
