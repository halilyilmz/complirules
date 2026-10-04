export interface VerifySchemaInput {
  schemaContent: string;
  schemaType?: 'prisma' | 'drizzle' | 'sql';
}

export function handleVerifySchema(input: VerifySchemaInput): string {
  const { schemaContent } = input;
  const issues: string[] = [];
  const suggestions: string[] = [];

  // 1. Cascade Delete Kontrolü
  if (/onDelete:\s*Cascade/i.test(schemaContent) && /(invoice|payment|order|tax|bill|fatura|odeme)/i.test(schemaContent)) {
    issues.push('❌ [CRITICAL] 213 Sayılı VUK Md. 253 İhlali: Finansal tablolarda (Invoice/Payment) `onDelete: Cascade` tespit edildi. Kullanıcı silindiğinde faturaların silinmesi yasal suçtur (5-10 yıl zorunlu saklama).');
    suggestions.push('💡 Çözüm: `onDelete: SetNull` kullanın ve kullanıcıyı silmek yerine kişisel bilgilerini maskeleyin (Tombstone pattern).');
  }

  // 2. Anonymization / Tombstone Kolon Kontrolü
  if (/model\s+User\b/i.test(schemaContent) || /model\s+Customer\b/i.test(schemaContent)) {
    if (!/isAnonymized\s+Boolean/i.test(schemaContent) && !/anonymizedAt\s+DateTime/i.test(schemaContent)) {
      issues.push('⚠️ [HIGH] KVKK Md. 7 / GDPR Art. 17 Uyarısı: Kullanıcı tablosunda kriptografik anonimleştirme durumu (`isAnonymized: Boolean`, `anonymizedAt: DateTime?`) sütunları bulunamadı.');
      suggestions.push('💡 Çözüm: User modeline `isAnonymized Boolean @default(false)` ve `anonymizedAt DateTime?` ekleyin.');
    }
  }

  // 3. Özel Nitelikli Kişisel Veri / PHI Kontrolü
  if (/(health|diagnosis|tckn|ssn|religion|bloodGroup)/i.test(schemaContent)) {
    issues.push('⚠️ [HIGH] Özel Nitelikli Kişisel Veri (KVKK Md. 6 / HIPAA PHI): Şemada sağlık, TCKN veya hassas veri alanları tespit edildi. Bu alanların DB seviyesinde şifrelenmesi (Encryption at Rest) veya ayrı tabloda takma adlı (pseudonymized) tutulması zorunludur.');
  }

  // 4. Denetim İzi (Audit Trail) Tablosu Kontrolü
  if (!/(AuditLog|ImhaLog|ConsentLog|EventLog)/i.test(schemaContent)) {
    issues.push('ℹ️ [MEDIUM] Denetim Kaydı Eksikliği: KVKK Veri Güvenliği Rehberi gereği silme ve rıza işlemlerini ispatlayacak bir `AuditLog` veya `ImhaLog` tablosu önerilir.');
    suggestions.push('💡 Çözüm: Zaman damgası ve işlem türü tutan bir `AuditLog` tablosu ekleyin.');
  }

  if (issues.length === 0) {
    return '✅ Şema Uyumluluk Analizi: Tebrikler! Veritabanı şeması KVKK, VUK ve GDPR saklama/silme standartlarına tam uyumludur.';
  }

  return `### 🛡️ CompliRules Şema Uyumluluk Denetim Raporu\n\n` +
    `**Tespit Edilen Sorunlar:**\n${issues.join('\n\n')}\n\n` +
    `**Önerilen Düzeltmeler:**\n${suggestions.join('\n')}`;
}
