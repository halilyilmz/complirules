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
    console.log('❌ Schema file not found. Please specify a file path: `complirules ropa prisma/schema.prisma`');
    return;
  }

  const content = fs.readFileSync(targetSchema, 'utf-8');
  const ropaMarkdown = handleGenerateRopa({
    schemaContent: content,
    organizationName: 'Your Organization / Venture',
    dpoEmail: 'dpo@yourcompany.com'
  });

  const outputPath = path.join(process.cwd(), 'ROPA_VERBIS_INVENTORY.md');
  fs.writeFileSync(outputPath, ropaMarkdown, 'utf-8');
  console.log(`\n📋 Record of Processing Activities (RoPA / VERBİS) successfully generated!`);
  console.log(`📄 Saved to: ${outputPath}\n`);
}
