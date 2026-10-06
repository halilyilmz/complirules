import fs from 'fs';
import path from 'path';
import {
  resolveRulesFromQuery,
  renderMdcRule,
  renderAgentsMd,
  renderClaudeMd,
  getAllRules,
  type RuleDefinition
} from '@complirules/rules';

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
  console.log('  ✓ Updated: AGENTS.md and CLAUDE.md');
}

export function executeAdd(target: string, targetDir = '.', options: { force?: boolean } = {}): void {
  console.log(`\n📦 Downloading Modular Rule Pack: "${target}"...\n`);

  const matchedRules = resolveRulesFromQuery(target);
  if (matchedRules.length === 0) {
    console.log(`❌ No rules or jurisdiction packs matched query "${target}".`);
    console.log(`   Available Aliases: tr, kvkk, eu, gdpr, eaa, us, hipaa, ccpa, ai-act, sec`);
    console.log(`   To view all available packs: \`complirules list\`\n`);
    return;
  }

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

  for (const rule of matchedRules) {
    const mdcContent = renderMdcRule(rule);
    const fileName = `${rule.id}.mdc`;
    fs.writeFileSync(path.join(cursorRulesDir, fileName), mdcContent, 'utf-8');
    console.log(`  ✓ Downloaded & Installed: .cursor/rules/${fileName} [${rule.jurisdiction}]`);
  }

  const allInstalledRuleIds = fs.readdirSync(cursorRulesDir)
    .filter(f => f.endsWith('.mdc'))
    .map(f => f.replace('.mdc', ''));

  const activeRules: RuleDefinition[] = [];
  for (const ruleId of allInstalledRuleIds) {
    const r = getAllRules().find(item => item.id === ruleId);
    if (r) activeRules.push(r);
  }

  if (activeRules.length > 0) {
    writeAgentFiles(targetDir, activeRules, Boolean(options.force));
  } else {
    console.log('ℹ️ No active rules remain after this change. Existing AGENTS.md / CLAUDE.md were left untouched to avoid destructive cleanup.');
  }

  console.log(`\n✨ Success! ${matchedRules.length} modular rule(s) added to your project for "${target}".\n`);
}
