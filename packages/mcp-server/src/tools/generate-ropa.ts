export interface GenerateRopaInput {
  schemaContent: string;
  organizationName?: string;
  dpoEmail?: string;
}

export interface Ropa10ColumnRow {
  category: string;
  fields: string[];
  dataSubjectGroup: string;
  purpose: string;
  legalBasis: string;
  recipients: string;
  crossBorderTransfer: string;
  retention: string;
  destructionMethod: string;
  technicalMeasures: string;
}

export function handleGenerateRopa(input: GenerateRopaInput): string {
  const { schemaContent, organizationName = 'Example Corporation', dpoEmail = 'dpo@example.com' } = input;

  const dataCategories: Ropa10ColumnRow[] = [];

  if (/email|name|phone|ad|soyad|telefon/i.test(schemaContent)) {
    dataCategories.push({
      category: 'Identity & Contact Data (Kimlik ve İletişim Verisi)',
      fields: ['Full Name', 'Email Address', 'Phone Number'],
      dataSubjectGroup: 'Customers / Registered Users',
      purpose: 'Account creation, identity verification, and contract performance',
      legalBasis: 'KVKK Art. 5/2-c (Contractual Performance) / GDPR Art. 6(1)(b)',
      recipients: 'Authorized Public Authorities, Customer Support Desk',
      crossBorderTransfer: 'None (Local Data Residency / Standard Contractual Clauses)',
      retention: 'Active account duration + 10 years statutory limitation',
      destructionMethod: 'Periodic Destruction (Semi-annual Crypto-Shredding / Tombstone)',
      technicalMeasures: 'TLS 1.3, Argon2id/Bcrypt password hashing, Automated PII Redaction'
    });
  }

  if (/invoice|payment|tax|fatura|tckn|amount/i.test(schemaContent)) {
    dataCategories.push({
      category: 'Financial & Billing Data (Finansal ve Fatura Verisi)',
      fields: ['Billing Address', 'Tax ID / National ID', 'Transaction Amount', 'Timestamp'],
      dataSubjectGroup: 'Customers / Subscribers',
      purpose: 'Statutory invoicing, tax reporting, and accounting records',
      legalBasis: 'KVKK Art. 5/2-ç (Compliance with Legal Obligation) & Tax Code Art. 253 (VUK Md. 253)',
      recipients: 'Revenue Administration, Tax Accountants, Payment Processors',
      crossBorderTransfer: 'Prohibited (Stored in Local Financial Database)',
      retention: '5 years from issuance date (Tax Code Art. 253 / VUK Md. 253) / 10 years Commercial Code',
      destructionMethod: 'SetNull & Anonymization after year 5 (Cascade Drop Prohibited)',
      technicalMeasures: 'AES-256 database encryption at rest, Salted national ID hashing'
    });
  }

  if (/ip|userAgent|log|accessedAt|session/i.test(schemaContent)) {
    dataCategories.push({
      category: 'Transaction Security & Access Logs (İşlem Güvenliği ve Erişim Logları)',
      fields: ['Hashed IP Address', 'User Agent String', 'Session Timestamps', 'Audit Logs'],
      dataSubjectGroup: 'Web / Mobile Visitors',
      purpose: 'Information security management and cyber threat detection',
      legalBasis: 'GDPR Art. 6(1)(f) (Legitimate Interest) & Law No. 5651',
      recipients: 'Internal Cyber Defense Team, Cloudflare (CDN Edge)',
      crossBorderTransfer: 'Pseudonymized / Gated via Asset Proxy',
      retention: '2 years statutory mandatory access log retention',
      destructionMethod: 'Automated Log Rotation and Cryptographic Overwriting',
      technicalMeasures: 'WAF Rate Limiting, SIEM Log Anonymization, Signed URL Proxies'
    });
  }

  if (/health|diagnosis|prescription|reçete|tani|medical/i.test(schemaContent)) {
    dataCategories.push({
      category: 'Special Category Personal Data (Health & Biometrics) (Özel Nitelikli Kişisel Veri)',
      fields: ['Clinical Diagnoses', 'Prescription Records', 'Health History'],
      dataSubjectGroup: 'Patients / Clients',
      purpose: 'Medical diagnosis, treatment history, and healthcare service delivery',
      legalBasis: 'KVKK Art. 6/3 (Explicit Consent / Medical Confidentiality) & HIPAA 45 CFR § 164.312',
      recipients: 'Authorized Medical Practitioners only (Break-Glass Protocol)',
      crossBorderTransfer: 'Prohibited without explicit statutory consent and Board authorization',
      retention: '20 years patient record statutory archiving retention',
      destructionMethod: 'Cryptographic Key Shredding (DEK Eradication)',
      technicalMeasures: 'Envelope Encryption (AES-256-GCM + KMS KEK), Dedicated Encrypted Schema'
    });
  }

  const tableHeader = 
    `| # | Data Category | Personal Fields | Data Subject Group | Processing Purpose | Legal Basis | Recipients | Cross-Border Transfer | Retention Period | Destruction Method | Technical Safeguards |\n` +
    `|---|---|---|---|---|---|---|---|---|---|---|`;

  const tableRows = dataCategories.map((row, idx) => 
    `| ${idx + 1} | **${row.category}** | ${row.fields.join(', ')} | ${row.dataSubjectGroup} | ${row.purpose} | ${row.legalBasis} | ${row.recipients} | ${row.crossBorderTransfer} | ${row.retention} | ${row.destructionMethod} | ${row.technicalMeasures} |`
  ).join('\n');

  return `# Record of Processing Activities (RoPA / VERBİS Envanteri)\n\n` +
    `**Organization:** ${organizationName} | **DPO:** ${dpoEmail} | **Date:** ${new Date().toISOString().split('T')[0]}\n\n` +
    `> This inventory table is automatically compiled in accordance with **GDPR Article 30** and **KVKK Article 16 (VERBİS)** requirements.\n\n` +
    `${tableHeader}\n${tableRows}\n\n` +
    `### Statutory Retention & Destruction Notes:\n` +
    `- **Financial & Invoicing Records:** Must be preserved for a minimum of 5 years under Tax Procedure Code Art. 253 (VUK Md. 253).\n` +
    `- **Right to be Forgotten:** User accounts must be anonymized (Tombstone pattern) rather than hard deleted.\n` +
    `- **Special Category Personal Data:** Must be stored in isolated, envelope-encrypted schemas (KVKK Art. 6 / HIPAA § 164.312).\n`;
}
