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
  console.log(`\n🗑️  Modüler Kural Paketi Kaldırılıyor: "${target}"...\n`);

  const matchedRules = resolveRulesFromQuery(target);
  if (matchedRules.length === 0) {
    console.log(`❌ "${target}" sorgusuyla eşleşen kural bulunamadı.\n`);
    return;
  }

  const cursorRulesDir = path.join(targetDir, '.cursor', 'rules');
  if (!fs.existsSync(cursorRulesDir)) {
    console.log(`ℹ️ Projede kurulu herhangi bir kural bulunamadı (.cursor/rules dizini yok).\n`);
    return;
  }

  let removedCount = 0;
  for (const rule of matchedRules) {
    const filePath = path.join(cursorRulesDir, `${rule.id}.mdc`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`  ✓ Silindi: .cursor/rules/${rule.id}.mdc`);
      removedCount++;
    }
  }

  // Kalan kuralları tara ve AGENTS.md / CLAUDE.md güncelle
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
    console.log(`  ✓ Güncellendi: AGENTS.md ve CLAUDE.md (${remainingRules.length} kural kaldı)`);
  } else {
    // Tüm kurallar silindiyse dosyaları da temizle
    const agentsPath = path.join(targetDir, 'AGENTS.md');
    const claudePath = path.join(targetDir, 'CLAUDE.md');
    if (fs.existsSync(agentsPath)) fs.unlinkSync(agentsPath);
    if (fs.existsSync(claudePath)) fs.unlinkSync(claudePath);
    console.log(`  ✓ Kalan kural olmadığından AGENTS.md ve CLAUDE.md temizlendi.`);
  }

  console.log(`\n✨ İşlem tamamlandı: ${removedCount} kural dosyası kaldırıldı.\n`);
}
