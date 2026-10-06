import fs from 'fs';
import path from 'path';
import { detectProjectStack } from '../detectors/stack-detector.js';
import {
  getAllRules,
  renderAgentsMd,
  renderClaudeMd,
  renderMdcRule,
  type Jurisdiction,
  type RuleDefinition
} from '@complirules/rules';

export interface InitOptions {
  jurisdiction?: string;
  all?: boolean;
  force?: boolean;
}

function writeAgentFiles(targetDir: string, rulesToApply: RuleDefinition[], force: boolean): void {
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  const claudePath = path.join(targetDir, 'CLAUDE.md');
  const hasExistingFiles = fs.existsSync(agentsPath) || fs.existsSync(claudePath);

  if (hasExistingFiles && !force) {
    console.warn('⚠️ Existing AGENTS.md or CLAUDE.md detected. Refusing to overwrite automatically. Re-run with --force to proceed.');
    return;
  }

  if (hasExistingFiles) {
    console.warn('⚠️ Overwriting existing AGENTS.md / CLAUDE.md because --force was supplied.');
  }

  fs.writeFileSync(agentsPath, renderAgentsMd(rulesToApply), 'utf-8');
  fs.writeFileSync(claudePath, renderClaudeMd(rulesToApply), 'utf-8');
  console.log('  ✓ Generated: AGENTS.md and CLAUDE.md');
}

export function executeInit(targetDir: string, options: InitOptions = {}): void {
  console.log('\n🛡️  CompliRules — Initializing Legal-as-Code & Compliance Guardrail...\n');

  const stack = detectProjectStack(targetDir);
  console.log(`📦 Detected Stack: Framework=${stack.framework.toUpperCase()}, ORM=${stack.orm.toUpperCase()}, TS=${stack.hasTypeScript}`);

  const jurisdictions: Jurisdiction[] = [];
  if (options.all) {
    jurisdictions.push('KVKK_TR', 'GDPR_EU', 'EAA_EU', 'HIPAA_US', 'CCPA_US', 'AI_ACT_EU');
  } else if (options.jurisdiction) {
    const raw = options.jurisdiction.toUpperCase();
    if (raw.includes('TR') || raw.includes('KVKK')) jurisdictions.push('KVKK_TR');
    if (raw.includes('EU') || raw.includes('GDPR')) jurisdictions.push('GDPR_EU', 'EAA_EU', 'AI_ACT_EU');
    if (raw.includes('US') || raw.includes('HIPAA')) jurisdictions.push('HIPAA_US', 'CCPA_US');
  } else {
    // Default: KVKK + GDPR + EAA
    jurisdictions.push('KVKK_TR', 'GDPR_EU', 'EAA_EU');
  }

  console.log(`🎯 Target Jurisdictions: ${jurisdictions.join(', ')}`);

  const rulesToApply = getAllRules().filter(
    (r: RuleDefinition) => jurisdictions.includes(r.jurisdiction) || r.jurisdiction === 'GLOBAL_SEC'
  );

  const cursorRulesDir = path.join(targetDir, '.cursor', 'rules');
  if (fs.existsSync(cursorRulesDir)) {
    const stat = fs.statSync(cursorRulesDir);
    if (!stat.isDirectory()) {
      const legacyPath = path.join(targetDir, '.cursor', 'rules.legacy');
      try {
        fs.renameSync(cursorRulesDir, legacyPath);
        console.log(`  ℹ Legacy file '.cursor/rules' detected and backed up to '.cursor/rules.legacy'`);
      } catch {
        fs.unlinkSync(cursorRulesDir);
      }
      fs.mkdirSync(cursorRulesDir, { recursive: true });
    }
  } else {
    fs.mkdirSync(cursorRulesDir, { recursive: true });
  }

  for (const rule of rulesToApply) {
    const mdcContent = renderMdcRule(rule);
    const fileName = `${rule.id}.mdc`;
    fs.writeFileSync(path.join(cursorRulesDir, fileName), mdcContent, 'utf-8');
    console.log(`  ✓ Generated: .cursor/rules/${fileName}`);
  }

  writeAgentFiles(targetDir, rulesToApply, Boolean(options.force));

  console.log('\n✨ Initialization complete. Local-only MCP config is intentionally not generated to avoid registry-scope drift.\n');
}
