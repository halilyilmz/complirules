import fs from 'fs';
import path from 'path';
import { 
  resolveRulesFromQuery, 
  renderAgentsMd, 
  renderClaudeMd, 
  getAllRules,
  RuleDefinition 
} from '@complirules/rules';
import { safelyWriteAgentFile, safelyRemoveFromAgentFile } from '../utils/agent-merger.js';

export function executeRemove(target: string, targetDir = '.'): void {
  console.log(`\n🗑️  Removing Modular Rule Pack: "${target}"...\n`);

  const matchedRules = resolveRulesFromQuery(target);
  if (matchedRules.length === 0) {
    console.log(`❌ No matching rules found for query "${target}".\n`);
    return;
  }

  const cursorRulesDir = path.join(targetDir, '.cursor', 'rules');
  if (!fs.existsSync(cursorRulesDir) || !fs.statSync(cursorRulesDir).isDirectory()) {
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
    safelyWriteAgentFile(targetDir, 'AGENTS.md', renderAgentsMd(remainingRules));
    safelyWriteAgentFile(targetDir, 'CLAUDE.md', renderClaudeMd(remainingRules));
    console.log(`  ✓ Updated: AGENTS.md and CLAUDE.md (${remainingRules.length} rules remaining)`);
  } else {
    // If no rules remain, safely clean up CompliRules content from AGENTS.md and CLAUDE.md
    const agentsRes = safelyRemoveFromAgentFile(targetDir, 'AGENTS.md');
    const claudeRes = safelyRemoveFromAgentFile(targetDir, 'CLAUDE.md');

    if (agentsRes.deletedFile && claudeRes.deletedFile) {
      console.log(`  ✓ Removed AGENTS.md and CLAUDE.md since no active rules remain.`);
    } else {
      console.log(`  ✓ Cleaned CompliRules rules from AGENTS.md / CLAUDE.md (preserved custom instructions).`);
    }
  }

  console.log(`\n✨ Done: ${removedCount} rule file(s) removed.\n`);
}
