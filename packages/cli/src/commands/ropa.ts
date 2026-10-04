import fs from 'fs';
import path from 'path';
import { handleGenerateRopa } from '@complirules/mcp-server';

export function executeRopa(schemaPath?: string): void {
  let targetSchema = schemaPath;
  if (!targetSchema) {
    const candidates = ['prisma/schema.prisma', 'schema.prisma', 'src/db/schema.ts', 'drizzle/schema.ts'];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        targetSchema = c;
        break;
      }
    }
  }

  if (!targetSchema || !fs.existsSync(targetSchema)) {
    console.log('❌ Şema dosyası bulunamadı. Lütfen bir dosya yolu belirtin: `complirules ropa prisma/schema.prisma`');
    return;
  }

  const content = fs.readFileSync(targetSchema, 'utf-8');
  const ropaMarkdown = handleGenerateRopa({
    schemaContent: content,
    organizationName: 'Şirketiniz / Girişiminiz',
    dpoEmail: 'dpo@sirketiniz.com'
  });

  const outputPath = path.join(process.cwd(), 'ROPA_VERBIS_ENVANTERI.md');
  fs.writeFileSync(outputPath, ropaMarkdown, 'utf-8');
  console.log(`\n📋 Veri İşleme Faaliyetleri Envanteri (RoPA) başarıyla üretildi!`);
  console.log(`📄 Kaydedilen Dosya: ${outputPath}\n`);
}
