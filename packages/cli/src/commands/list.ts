import fs from 'fs';
import path from 'path';
import { getAllRules, getRulePacks } from '@complirules/rules';

export function executeList(targetDir = '.'): void {
  const cursorRulesDir = path.join(targetDir, '.cursor', 'rules');
  const installedIds = new Set<string>();

  if (fs.existsSync(cursorRulesDir)) {
    const files = fs.readdirSync(cursorRulesDir).filter(f => f.endsWith('.mdc'));
    for (const file of files) {
      installedIds.add(file.replace('.mdc', ''));
    }
  }

  console.log('\n📋 CompliRules Modüler Kural Durumu:\n');

  console.log('📌 PROJEDE YÜKLÜ OLAN KURALLAR:');
  if (installedIds.size === 0) {
    console.log('  (Henüz hiçbir kural yüklenmemiş. Kurmak için: `complirules add <ülke-veya-kural>`)');
  } else {
    for (const id of installedIds) {
      const rule = getAllRules().find(r => r.id === id);
      if (rule) {
        console.log(`  ✓ \x1b[32m${rule.id}\x1b[0m — ${rule.title} [\x1b[36m${rule.jurisdiction}\x1b[0m]`);
      } else {
        console.log(`  ✓ ${id} (Özel Kural)`);
      }
    }
  }

  console.log('\n🌍 KULLANILABİLİR ÜLKE VE REGÜLASYON PAKETLERİ (İndirmek için `complirules add <ad>`):');
  const packs = getRulePacks();
  for (const pack of packs) {
    console.log(`\n  📦 \x1b[1m${pack.name}\x1b[0m (\x1b[33m${pack.id}\x1b[0m)`);
    console.log(`     Açıklama: ${pack.description}`);
    console.log(`     Kurallar: ${pack.rules.map(r => r.id).join(', ')}`);
  }

  console.log('\n🎯 TEKİL KURAL İNDİRME KISALTMALARI:');
  console.log('  - Türkiye KVKK: `complirules add tr` veya `complirules add kvkk`');
  console.log('  - AB GDPR:      `complirules add eu` veya `complirules add gdpr`');
  console.log('  - AB EAA 2025:  `complirules add eaa` veya `complirules add a11y`');
  console.log('  - ABD HIPAA:    `complirules add us` veya `complirules add hipaa`');
  console.log('  - EU AI Act:    `complirules add ai-act`');
  console.log('  - PII Guard:    `complirules add sec`\n');
}
