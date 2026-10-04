import fs from 'fs';
import path from 'path';

export function executeScaffold(targetDir: string, primitiveType: string): void {
  const complianceDir = path.join(targetDir, 'lib', 'compliance');
  fs.mkdirSync(complianceDir, { recursive: true });

  const templates: Record<string, { fileName: string; content: string }> = {
    'crypto-shredding': {
      fileName: 'crypto-shredding.ts',
      content: `import { createHash, randomBytes } from 'crypto';

export function shredPersonalData<T extends { id: string; email: string }>(user: T) {
  const salt = randomBytes(16).toString('hex');
  const tombstoneHash = createHash('sha256')
    .update(\`\${user.id}:\${user.email}:\${salt}:\${Date.now()}\`)
    .digest('hex');

  return {
    ...user,
    email: \`anonymized-\${tombstoneHash.slice(0, 10)}@erased.local\`,
    name: 'ANONİM KULLANICI',
    phone: null,
    tckn: null,
    isAnonymized: true,
    anonymizedAt: new Date(),
    tombstoneHash
  };
}
`
    },
    'pii-logger': {
      fileName: 'pii-logger.ts',
      content: `const SENSITIVE_KEYS = new Set(['password', 'tckn', 'creditcard', 'token', 'authorization', 'secret']);

export function scrubObject<T>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(scrubObject) as unknown as T;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED_PII]';
    } else {
      result[key] = scrubObject(value);
    }
  }
  return result as T;
}

export const safeLogger = {
  info: (msg: string, meta?: any) => console.log(\`[INFO] \${msg}\`, meta ? scrubObject(meta) : ''),
  error: (msg: string, meta?: any) => console.error(\`[ERROR] \${msg}\`, meta ? scrubObject(meta) : '')
};
`
    }
  };

  const selected = templates[primitiveType];
  if (!selected) {
    console.log(`❌ Geçersiz primitif türü: "${primitiveType}". Kullanılabilir: ${Object.keys(templates).join(', ')}`);
    return;
  }

  const destFile = path.join(complianceDir, selected.fileName);
  fs.writeFileSync(destFile, selected.content, 'utf-8');
  console.log(`✓ Oluşturuldu: lib/compliance/${selected.fileName}`);
}
