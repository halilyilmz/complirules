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
  console.log(`\n📦 Modüler Kural Paketi İndiriliyor: "${target}"...\n`);

  const matchedRules = resolveRulesFromQuery(target);
  if (matchedRules.length === 0) {
    console.log(`❌ "${target}" sorgusuyla eşleşen kural veya ülke paketi bulunamadı.`);
    console.log(`   Kullanılabilir Kısaltmalar: tr, kvkk, eu, gdpr, eaa, us, hipaa, ai-act, sec`);
    console.log(`   Tüm paketleri görmek için: \`complirules packs\`\n`);
    return;
  }

  const cursorRulesDir = path.join(targetDir, '.cursor', 'rules');
  fs.mkdirSync(cursorRulesDir, { recursive: true });

  for (const rule of matchedRules) {
    const mdcContent = renderMdcRule(rule);
    const fileName = `${rule.id}.mdc`;
    fs.writeFileSync(path.join(cursorRulesDir, fileName), mdcContent, 'utf-8');
    console.log(`  ✓ İndirildi & Kuruldu: .cursor/rules/${fileName} [${rule.jurisdiction}]`);
  }

  // Mevcut kurulu tüm kuralları tara ve AGENTS.md / CLAUDE.md güncelle
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
    console.log(`  ✓ Güncellendi: AGENTS.md ve CLAUDE.md (${activeRules.length} aktif kural)`);
  }

  // .cursor/mcp.json kontrolü
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
    console.log(`  ✓ Yapılandırıldı: .cursor/mcp.json`);
  }

  console.log(`\n✨ Başarılı! "${target}" için ${matchedRules.length} adet modüler kural projenize eklendi.\n`);
}
