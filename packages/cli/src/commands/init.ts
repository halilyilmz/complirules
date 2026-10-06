import fs from 'fs';
import path from 'path';
import { detectProjectStack } from '../detectors/stack-detector.js';
import { 
  getRulesByJurisdiction, 
  getAllRules, 
  renderMdcRule, 
  renderAgentsMd, 
  renderClaudeMd, 
  Jurisdiction,
  RuleDefinition
} from '@complirules/rules';
import { safelyWriteAgentFile } from '../utils/agent-merger.js';

export interface InitOptions {
  jurisdiction?: string;
  all?: boolean;
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

  // Collect rules
  const rulesToApply = getAllRules().filter((r: RuleDefinition) => 
    jurisdictions.includes(r.jurisdiction) || r.jurisdiction === 'GLOBAL_SEC'
  );

  // 1. Write .cursor/rules/*.mdc files
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

  // 2. Safely merge AGENTS.md and CLAUDE.md without destroying existing user instructions
  const agentsMdContent = renderAgentsMd(rulesToApply);
  const agentsRes = safelyWriteAgentFile(targetDir, 'AGENTS.md', agentsMdContent);
  console.log(`  ✓ ${agentsRes.merged ? 'Merged into existing' : 'Generated'}: AGENTS.md (for Claude Code, Windsurf, Copilot)`);

  const claudeMdContent = renderClaudeMd(rulesToApply);
  const claudeRes = safelyWriteAgentFile(targetDir, 'CLAUDE.md', claudeMdContent);
  console.log(`  ✓ ${claudeRes.merged ? 'Merged into existing' : 'Generated'}: CLAUDE.md`);

  // 3. Configure .cursor/mcp.json using official registered npm binary
  const cursorMcpJsonPath = path.join(targetDir, '.cursor', 'mcp.json');
  const mcpConfig = {
    mcpServers: {
      complirules: {
        command: "npx",
        args: ["-y", "complirules", "mcp"]
      }
    }
  };
  fs.writeFileSync(cursorMcpJsonPath, JSON.stringify(mcpConfig, null, 2), 'utf-8');
  console.log(`  ✓ Configured: .cursor/mcp.json (Model Context Protocol Integration)`);

  console.log('\n✨ Initialization complete! Your AI coding agents (Cursor, Claude Code, Windsurf) are now constrained within legal boundaries.\n');
}
