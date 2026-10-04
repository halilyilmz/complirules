#!/usr/bin/env node
import { Command } from 'commander';
import { executeInit } from './commands/init.js';
import { executeCheck } from './commands/check.js';
import { executeScaffold } from './commands/scaffold.js';
import { executeRopa } from './commands/ropa.js';
import { executeAdd } from './commands/add.js';
import { executeRemove } from './commands/remove.js';
import { executeList } from './commands/list.js';
import { getRulePacks } from '@complirules/rules';

const program = new Command();

program
  .name('complirules')
  .description('Compliance-as-Code & Legal AI Guardrail Engine for Vibe Coding')
  .version('1.0.0');

program
  .command('init')
  .description('Projeye uygun .cursor/rules, AGENTS.md, CLAUDE.md ve MCP ayarlarını kurar')
  .argument('[dir]', 'Hedef proje dizini', '.')
  .option('-j, --jurisdiction <jurisdiction>', 'Yargı alanı (TR, EU, US, ALL)', 'TR,EU')
  .option('--all', 'Tüm kural paketlerini yükle')
  .action((dir, options) => {
    executeInit(dir, options);
  });

program
  .command('add')
  .description('Belirli bir ülkenin veya regülasyonun modüler kural paketini indirip kurar (Örn: `complirules add kvkk`, `complirules add gdpr`)')
  .argument('<target>', 'Ülke, regülasyon veya kural adı (tr, kvkk, eu, gdpr, eaa, us, hipaa, ai-act, sec)')
  .argument('[dir]', 'Hedef proje dizini', '.')
  .action((target, dir) => {
    executeAdd(target, dir);
  });

program
  .command('remove')
  .alias('rm')
  .description('Projede kurulu bir modüler kural paketini kaldırır (Örn: `complirules remove hipaa`)')
  .argument('<target>', 'Kaldırılacak kural veya ülke adı (tr, eu, us, hipaa, eaa vb.)')
  .argument('[dir]', 'Hedef proje dizini', '.')
  .action((target, dir) => {
    executeRemove(target, dir);
  });

program
  .command('list')
  .alias('ls')
  .description('Projede yüklü olan kuralları ve kullanılabilir tüm ülke paketlerini listeler')
  .argument('[dir]', 'Hedef proje dizini', '.')
  .action((dir) => {
    executeList(dir);
  });

program
  .command('check')
  .description('Kod tabanında deterministik AST ve yasal uyumluluk denetimi yapar')
  .argument('[path]', 'Denetlenecek dizin veya dosya', '.')
  .action((targetPath) => {
    const passed = executeCheck(targetPath);
    if (!passed) {
      process.exit(1);
    }
  });

program
  .command('scaffold')
  .description('Projeye üretime hazır uyumluluk primitifi ekler (crypto-shredding, pii-logger)')
  .argument('<primitive>', 'Primitif adı (crypto-shredding, pii-logger)')
  .argument('[dir]', 'Hedef proje dizini', '.')
  .action((primitive, dir) => {
    executeScaffold(dir, primitive);
  });

program
  .command('ropa')
  .description('Veritabanı şemasından otomatik KVKK VERBİS / GDPR Art. 30 RoPA envanteri üretir')
  .argument('[schemaPath]', 'Prisma veya SQL şema dosya yolu')
  .action((schemaPath) => {
    executeRopa(schemaPath);
  });

program
  .command('packs')
  .description('Kullanılabilir tüm regülasyon ve kural paketlerini listeler')
  .action(() => {
    console.log('\n📦 Mevcut CompliRules Regülasyon Paketleri:\n');
    const packs = getRulePacks();
    for (const p of packs) {
      console.log(`- **${p.name}** (\`${p.id}\` v${p.version})`);
      console.log(`  ${p.description}`);
      console.log(`  İçerdiği Kurallar: ${p.rules.map((r: any) => r.id).join(', ')}\n`);
    }
  });

program.parse(process.argv);
