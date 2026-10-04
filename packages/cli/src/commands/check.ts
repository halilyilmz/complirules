import path from 'path';
import { scanDirectory } from '@complirules/linter';

export function executeCheck(targetPath = '.'): boolean {
  console.log(`\n🔍 CompliRules Static Regulatory & Security Audit Starting...`);
  console.log(`📂 Target Path: ${path.resolve(targetPath)}\n`);

  const result = scanDirectory(targetPath);

  console.log(`📊 Scanned Files Count: ${result.checkedFilesCount}`);

  if (result.violations.length === 0) {
    console.log('✅ Congratulations! No regulatory violations or PII leaks detected in your codebase.\n');
    return true;
  }

  console.log(`\n🚨 DETECTED VIOLATIONS (${result.violations.length} total):`);
  console.log(`   Critical: ${result.summary.critical} | High: ${result.summary.high} | Medium: ${result.summary.medium}\n`);

  for (const v of result.violations) {
    const icon = v.severity === 'CRITICAL' ? '🛑' : v.severity === 'HIGH' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [${v.severity}] ${v.ruleId} — ${v.file}:${v.line}:${v.column}`);
    console.log(`   Statutory Citation: ${v.lawCitation}`);
    console.log(`   Message: ${v.message}`);
    console.log(`   Offending Code: \`${v.matchedSnippet}\``);
    if (v.suggestedFix) {
      console.log(`   💡 Suggested Fix: ${v.suggestedFix}`);
    }
    console.log('   ' + '-'.repeat(60));
  }

  console.log('\nℹ️  CompliRules is an automated AST heuristic tool (See DISCLAIMER.md - Not certified legal/security advice).');
  console.log('   For certified penetration testing & official compliance audits: https://halilyilmz.github.io/complirules/#partners\n');

  if (result.summary.critical > 0 || result.summary.high > 0) {
    console.log('❌ ERROR: Critical or high-severity statutory compliance violations exist. CI/CD check failed.\n');
    return false;
  }

  return true;
}
