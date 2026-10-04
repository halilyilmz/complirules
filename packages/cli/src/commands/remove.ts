import fs from 'fs';
import path from 'path';
import { 
  resolveRulesFromQuery, 
  renderAgentsMd, 
  renderClaudeMd, 
  getAllRules,
  RuleDefinition 
} from '@complirules/rules';

export function executeRemove(target: string, targetDir = '.'): void {
  console.log(`\n🗑️  Removing Modular Rule Pack: "${target}"...\n`);

  const matchedRules = resolveRulesFromQuery(target);
  if (matchedRules.length === 0) {
    console.log(`❌ No matching rules found for query "${target}".\n`);
    return;
  }

  const cursorRulesDir = path.join(targetDir, '.cursor', 'rules');
  if (!fs.existsSync(cursorRulesDir)) {
    console.log(`ℹ️ No installed rules found in project (.cursor/rules directory does not exist).\n`);
    return;
  }

  let removedCount = 0;
  for (const rule of matchedRules) {
    const filePath = path.join(cursorRulesDir, `${rule.id}.mdc`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`  ✓ Removed: .cursor/rules/${rule.id}.mdc`);
      removedCount++;
    }
  }

  // Scan remaining rules and update AGENTS.md / CLAUDE.md
  const remainingFiles = fs.readdirSync(cursorRulesDir)
    .filter(f => f.endsWith('.mdc'))
    .map(f => f.replace('.mdc', ''));

  const remainingRules: RuleDefinition[] = [];
  for (const ruleId of remainingFiles) {
    const r = getAllRules().find(item => item.id === ruleId);
    if (r) remainingRules.push(r);
  }

  if (remainingRules.length > 0) {
    fs.writeFileSync(path.join(targetDir, 'AGENTS.md'), renderAgentsMd(remainingRules), 'utf-8');
    fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), renderClaudeMd(remainingRules), 'utf-8');
    console.log(`  ✓ Updated: AGENTS.md and CLAUDE.md (${remainingRules.length} rules remaining)`);
  } else {
    // If no rules remain, clean up AGENTS.md and CLAUDE.md
    const agentsPath = path.join(targetDir, 'AGENTS.md');
    const claudePath = path.join(targetDir, 'CLAUDE.md');
    if (fs.existsSync(agentsPath)) fs.unlinkSync(agentsPath);
    if (fs.existsSync(claudePath)) fs.unlinkSync(claudePath);
    console.log(`  ✓ Removed AGENTS.md and CLAUDE.md since no active rules remain.`);
  }

  console.log(`\n✨ Done: ${removedCount} rule file(s) removed.\n`);
}
