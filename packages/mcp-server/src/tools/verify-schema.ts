export interface VerifySchemaInput {
  schemaContent: string;
  schemaType?: 'prisma' | 'drizzle' | 'sql';
}

export function handleVerifySchema(input: VerifySchemaInput): string {
  const { schemaContent } = input;
  const issues: string[] = [];
  const suggestions: string[] = [];

  // 1. Cascade Delete Check on Financial Tables
  if (/onDelete:\s*Cascade/i.test(schemaContent) && /(invoice|payment|order|tax|bill|fatura|odeme)/i.test(schemaContent)) {
    issues.push('❌ [CRITICAL] Tax Procedure Code Art. 253 / VUK Md. 253 Violation: `onDelete: Cascade` detected on financial models (Invoice/Payment). Deleting tax and financial records upon user deletion is a statutory violation (mandatory 5-10 year retention).');
    suggestions.push('💡 Fix: Use `onDelete: SetNull` and mask personal identity fields instead of dropping the record (Tombstone pattern).');
  }

  // 2. Anonymization / Tombstone Columns Check
  if (/model\s+User\b/i.test(schemaContent) || /model\s+Customer\b/i.test(schemaContent)) {
    if (!/isAnonymized\s+Boolean/i.test(schemaContent) && !/anonymizedAt\s+DateTime/i.test(schemaContent)) {
      issues.push('⚠️ [HIGH] KVKK Art. 7 / GDPR Art. 17 Warning: User model lacks cryptographic anonymization status columns (`isAnonymized: Boolean`, `anonymizedAt: DateTime?`).');
      suggestions.push('💡 Fix: Add `isAnonymized Boolean @default(false)` and `anonymizedAt DateTime?` to the User model.');
    }
  }

  // 3. Special Category Data / PHI Check
  if (/(health|diagnosis|tckn|ssn|religion|bloodGroup)/i.test(schemaContent)) {
    issues.push('⚠️ [HIGH] Special Category Personal Data (KVKK Art. 6 / HIPAA PHI): Health, national ID, or biometric fields detected. These fields must be encrypted at rest (Encryption at Rest / Envelope Encryption) or stored pseudonymously in an isolated schema.');
  }

  // 4. Audit Trail Table Check
  if (!/(AuditLog|ImhaLog|ConsentLog|EventLog)/i.test(schemaContent)) {
    issues.push('ℹ️ [MEDIUM] Missing Audit Trail: Data protection guidelines require an `AuditLog` or `DestructionLog` table to prove deletion, anonymization, and consent events.');
    suggestions.push('💡 Fix: Add an immutable `AuditLog` table tracking timestamps, event types, and target identifiers.');
  }

  if (issues.length === 0) {
    return '✅ Schema Compliance Audit: Congratulations! The database schema complies with statutory retention, right-to-be-forgotten, and data protection standards.';
  }

  return `### 🛡️ CompliRules Schema Compliance Audit Report\n\n` +
    `**Detected Issues:**\n${issues.join('\n\n')}\n\n` +
    `**Suggested Fixes:**\n${suggestions.join('\n')}`;
}
