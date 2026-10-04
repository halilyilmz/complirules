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

export interface InitOptions {
  jurisdiction?: string;
  all?: boolean;
}

export function executeInit(targetDir: string, options: InitOptions = {}): void {
  console.log('\n🛡️  CompliRules — Legal-as-Code & Compliance Guardrail Başlatılıyor...\n');

  const stack = detectProjectStack(targetDir);
  console.log(`📦 Tespit Edilen Yığın: Framework=${stack.framework.toUpperCase()}, ORM=${stack.orm.toUpperCase()}, TS=${stack.hasTypeScript}`);

  const jurisdictions: Jurisdiction[] = [];
  if (options.all) {
    jurisdictions.push('KVKK_TR', 'GDPR_EU', 'EAA_EU', 'HIPAA_US', 'CCPA_US', 'AI_ACT_EU');
  } else if (options.jurisdiction) {
    const raw = options.jurisdiction.toUpperCase();
    if (raw.includes('TR') || raw.includes('KVKK')) jurisdictions.push('KVKK_TR');
    if (raw.includes('EU') || raw.includes('GDPR')) jurisdictions.push('GDPR_EU', 'EAA_EU', 'AI_ACT_EU');
    if (raw.includes('US') || raw.includes('HIPAA')) jurisdictions.push('HIPAA_US', 'CCPA_US');
  } else {
    // Varsayılan: KVKK + GDPR + EAA
    jurisdictions.push('KVKK_TR', 'GDPR_EU', 'EAA_EU');
  }

  console.log(`🎯 Hedef Yargı Alanları: ${jurisdictions.join(', ')}`);

  // Kuralları topla
  const rulesToApply = getAllRules().filter((r: RuleDefinition) => 
    jurisdictions.includes(r.jurisdiction) || r.jurisdiction === 'GLOBAL_SEC'
  );

  // 1. .cursor/rules/*.mdc dosyalarını yaz
  const cursorRulesDir = path.join(targetDir, '.cursor', 'rules');
  fs.mkdirSync(cursorRulesDir, { recursive: true });

  for (const rule of rulesToApply) {
    const mdcContent = renderMdcRule(rule);
    const fileName = `${rule.id}.mdc`;
    fs.writeFileSync(path.join(cursorRulesDir, fileName), mdcContent, 'utf-8');
    console.log(`  ✓ Oluşturuldu: .cursor/rules/${fileName}`);
  }

  // 2. Kök dizine AGENTS.md ve CLAUDE.md yaz
  const agentsMdContent = renderAgentsMd(rulesToApply);
  fs.writeFileSync(path.join(targetDir, 'AGENTS.md'), agentsMdContent, 'utf-8');
  console.log(`  ✓ Oluşturuldu: AGENTS.md (Claude Code, Windsurf, Copilot için)`);

  const claudeMdContent = renderClaudeMd(rulesToApply);
  fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), claudeMdContent, 'utf-8');
  console.log(`  ✓ Oluşturuldu: CLAUDE.md`);

  // 3. .cursor/mcp.json konfigürasyonunu ekle
  const cursorMcpJsonPath = path.join(targetDir, '.cursor', 'mcp.json');
  const mcpConfig = {
    mcpServers: {
      complirules: {
        command: "npx",
        args: ["@complirules/mcp-server"]
      }
    }
  };
  fs.writeFileSync(cursorMcpJsonPath, JSON.stringify(mcpConfig, null, 2), 'utf-8');
  console.log(`  ✓ Yapılandırıldı: .cursor/mcp.json (Model Context Protocol Entegrasyonu)`);

  console.log('\n✨ Kurulum tamamlandı! AI kodlama araçlarınız (Cursor, Claude Code, Windsurf) artık yasal mevzuat sınırları içerisinde çalışacak.');
}
