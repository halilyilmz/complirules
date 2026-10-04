import fs from 'fs';
import path from 'path';
import { 
  resolveRulesFromQuery, 
  renderMdcRule, 
  renderAgentsMd, 
  renderClaudeMd, 
  getAllRules,
  RuleDefinition 
} from '@complirules/rules';

export function executeAdd(target: string, targetDir = '.'): void {
  console.log(`\n📦 Downloading Modular Rule Pack: "${target}"...\n`);

  const matchedRules = resolveRulesFromQuery(target);
  if (matchedRules.length === 0) {
    console.log(`❌ No rules or jurisdiction packs matched query "${target}".`);
    console.log(`   Available Aliases: tr, kvkk, eu, gdpr, eaa, us, hipaa, ccpa, ai-act, sec`);
    console.log(`   To view all available packs: \`complirules list\`\n`);
    return;
  }

  const cursorRulesDir = path.join(targetDir, '.cursor', 'rules');
  fs.mkdirSync(cursorRulesDir, { recursive: true });

  for (const rule of matchedRules) {
    const mdcContent = renderMdcRule(rule);
    const fileName = `${rule.id}.mdc`;
    fs.writeFileSync(path.join(cursorRulesDir, fileName), mdcContent, 'utf-8');
    console.log(`  ✓ Downloaded & Installed: .cursor/rules/${fileName} [${rule.jurisdiction}]`);
  }

  // Scan all currently installed rules and update AGENTS.md / CLAUDE.md
  const allInstalledRuleIds = fs.readdirSync(cursorRulesDir)
    .filter(f => f.endsWith('.mdc'))
    .map(f => f.replace('.mdc', ''));

  const activeRules: RuleDefinition[] = [];
  for (const ruleId of allInstalledRuleIds) {
    const r = getAllRules().find(item => item.id === ruleId);
    if (r) activeRules.push(r);
  }

  if (activeRules.length > 0) {
    fs.writeFileSync(path.join(targetDir, 'AGENTS.md'), renderAgentsMd(activeRules), 'utf-8');
    fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), renderClaudeMd(activeRules), 'utf-8');
    console.log(`  ✓ Updated: AGENTS.md and CLAUDE.md (${activeRules.length} active rules)`);
  }

  // Configure .cursor/mcp.json if not present
  const cursorMcpJsonPath = path.join(targetDir, '.cursor', 'mcp.json');
  if (!fs.existsSync(cursorMcpJsonPath)) {
    const mcpConfig = {
      mcpServers: {
        complirules: {
          command: "npx",
          args: ["@complirules/mcp-server"]
        }
      }
    };
    fs.writeFileSync(cursorMcpJsonPath, JSON.stringify(mcpConfig, null, 2), 'utf-8');
    console.log(`  ✓ Configured: .cursor/mcp.json`);
  }

  console.log(`\n✨ Success! ${matchedRules.length} modular rule(s) added to your project for "${target}".\n`);
}
