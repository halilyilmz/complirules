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

  console.log('\n📋 CompliRules Modular Rule Status:\n');

  console.log('📌 INSTALLED RULES IN PROJECT:');
  if (installedIds.size === 0) {
    console.log('  (No rules installed yet. To install: `complirules add <jurisdiction-or-rule>`)');
  } else {
    for (const id of installedIds) {
      const rule = getAllRules().find(r => r.id === id);
      if (rule) {
        console.log(`  ✓ \x1b[32m${rule.id}\x1b[0m — ${rule.title} [\x1b[36m${rule.jurisdiction}\x1b[0m]`);
      } else {
        console.log(`  ✓ ${id} (Custom Rule)`);
      }
    }
  }

  console.log('\n🌍 AVAILABLE JURISDICTION & REGULATORY PACKS (To install run `complirules add <name>`):');
  const packs = getRulePacks();
  for (const pack of packs) {
    console.log(`\n  📦 \x1b[1m${pack.name}\x1b[0m (\x1b[33m${pack.id}\x1b[0m)`);
    console.log(`     Description: ${pack.description}`);
    console.log(`     Rules: ${pack.rules.map(r => r.id).join(', ')}`);
  }

  console.log('\n🎯 SINGLE RULE INSTALL ALIASES:');
  console.log('  • \x1b[33mtr\x1b[0m / \x1b[33mkvkk\x1b[0m       -> Turkey KVKK, ETK, and VUK data protection rules');
  console.log('  • \x1b[33meu\x1b[0m / \x1b[33mgdpr\x1b[0m       -> EU GDPR, hotlink asset proxying, two-click embeds');
  console.log('  • \x1b[33meaa\x1b[0m / \x1b[33mwcag\x1b[0m       -> European Accessibility Act 2025 / WCAG 2.1 AA UI standards');
  console.log('  • \x1b[33mus\x1b[0m / \x1b[33mhipaa\x1b[0m      -> US HIPAA Security Rule & sensitive route pixel blocks');
  console.log('  • \x1b[33mccpa\x1b[0m / \x1b[33mgpc\x1b[0m       -> California CCPA/CPRA Global Privacy Control automated opt-out');
  console.log('  • \x1b[33mai\x1b[0m / \x1b[33mai-act\x1b[0m     -> EU AI Act Article 50 transparency & watermarking');
  console.log('  • \x1b[33msec\x1b[0m / \x1b[33msecurity\x1b[0m   -> DevSecOps rate-limit shield & PII/PHI log redaction\n');
}
