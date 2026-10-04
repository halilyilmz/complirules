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
  const { schemaContent, organizationName = 'Örnek Şirket A.Ş.', dpoEmail = 'kvkk@ornek.com' } = input;

  const dataCategories: Ropa10ColumnRow[] = [];

  if (/email|name|phone|ad|soyad|telefon/i.test(schemaContent)) {
    dataCategories.push({
      category: 'Kimlik ve İletişim Verisi',
      fields: ['Ad', 'Soyad', 'E-posta', 'Telefon Numarası'],
      dataSubjectGroup: 'Müşteri / Kullanıcı',
      purpose: 'Kullanıcı hesabı oluşturulması, kimlik doğrulama ve sözleşmenin ifası',
      legalBasis: 'KVKK Md. 5/2-c (Sözleşmenin ifası) / GDPR Art. 6(1)(b)',
      recipients: 'Yetkili Kamu Kurumları, Çağrı Merkezi',
      crossBorderTransfer: 'Yok (TR Region Data Residency / Standart Sözleşme)',
      retention: 'Üyelik süresince + 10 yıl (TTK Md. 82)',
      destructionMethod: 'Periyodik İmha (6 ayda bir Crypto-Shredding / Tombstone)',
      technicalMeasures: 'TLS 1.3, Argon2id/Bcrypt parola hashleme, PII Maskeleme'
    });
  }

  if (/invoice|payment|tax|fatura|tckn|amount/i.test(schemaContent)) {
    dataCategories.push({
      category: 'Finansal ve Fatura Verisi',
      fields: ['Fatura Adresi', 'Vergi No / TCKN', 'Ödeme Tutarı', 'İşlem Zamanı'],
      dataSubjectGroup: 'Müşteri / Abone',
      purpose: 'Yasal fatura düzenleme ve muhasebe kayıtlarının tutulması',
      legalBasis: 'KVKK Md. 5/2-ç (Hukuki yükümlülüğün yerine getirilmesi) & VUK Md. 253',
      recipients: 'Gelir İdaresi Başkanlığı (GİB), Mali Müşavir, Bankalar',
      crossBorderTransfer: 'Aktarılmaz (Yerel Veri Tabanı)',
      retention: 'Düzenleme tarihinden itibaren 5 yıl (VUK Md. 253) / 10 yıl (TTK Md. 82)',
      destructionMethod: '5. yıl sonunda SetNull & anonimleştirme (Cascade Drop Yasağı)',
      technicalMeasures: 'AES-256 veritabanı şifreleme, Salt-hash TCKN denetimi'
    });
  }

  if (/ip|userAgent|log|accessedAt|session/i.test(schemaContent)) {
    dataCategories.push({
      category: 'İşlem Güvenliği ve Erişim Logları',
      fields: ['IP Adresi Hash', 'User Agent', 'Oturum Zamanı', 'Erişim Logları'],
      dataSubjectGroup: 'Web / Mobil Uygulama Ziyaretçisi',
      purpose: 'Bilgi güvenliği süreçlerinin yürütülmesi ve siber güvenliğin sağlanması',
      legalBasis: 'KVKK Md. 5/2-ç (5651 Sayılı Kanun Madde 2)',
      recipients: 'Yetkili Adli ve İdari Merciler, BTK',
      crossBorderTransfer: 'Yok (Yerel Syslog / SIEM)',
      retention: '2 Yıl (5651 Sayılı Kanun gereği zorunlu saklama)',
      destructionMethod: 'Süre bitiminde kalıcı SHA-256 özet doğrulama sonrası güvenli silme',
      technicalMeasures: 'Zaman damgalı hash bütünlüğü (RFC 3161), Maskelenmiş IP logları'
    });
  }

  if (/marketingConsent|newsletter|etk/i.test(schemaContent)) {
    dataCategories.push({
      category: 'Pazarlama ve Tercih Verisi',
      fields: ['Pazarlama İletişim Onayı', 'İzin Tarihi', 'İzin Kanalı'],
      dataSubjectGroup: 'Müşteri / Potansiyel Alıcı',
      purpose: 'Ticari elektronik ileti gönderimi ve kampanya bilgilendirmesi',
      legalBasis: 'KVKK Md. 5/1 (Açık Rıza) & 6563 Sayılı ETK / İYS',
      recipients: 'İYS A.Ş., Yetkili E-posta/SMS Servis Sağlayıcıları',
      crossBorderTransfer: 'SCC Güvencesi (Kurul 5 iş günü bildirimli)',
      retention: 'Rıza geri çekilene kadar + 3 yıl (İYS Yönetmeliği)',
      destructionMethod: 'Opt-out anında derhal durdurma, 3 yıl sonra kayıt silme',
      technicalMeasures: 'Simetrik CMP onay mimarisi, Versiyonlanmış Consent Store'
    });
  }

  if (/health|medical|diagnosis|prescription|saglik|biyometri|patient|tedavi/i.test(schemaContent)) {
    dataCategories.push({
      category: 'Özel Nitelikli Kişisel Veri (Sağlık & Biyometri)',
      fields: ['Tıbbi Teşhis', 'Reçete ve İlaçlar', 'Hasta Geçmişi', 'Biyometrik Veri'],
      dataSubjectGroup: 'Hasta / Danışan',
      purpose: 'Tıbbi teşhis, tedavi ve sağlık bakım hizmetlerinin yürütülmesi',
      legalBasis: 'KVKK Md. 6/3 (Sır saklama yükümlülüğü) & HIPAA § 164.502 / GDPR Art. 9(2)(h)',
      recipients: 'Sağlık Bakanlığı, SGK, Yetkili Hekimler',
      crossBorderTransfer: 'Yurt dışına aktarılamaz (TR/Local Only Zarf Şifreleme)',
      retention: 'Hasta kabulünden itibaren 20 yıl (Sağlık Hizmetleri Mevzuatı)',
      destructionMethod: 'DEK Kriptografik İmha (Crypto-Shredding)',
      technicalMeasures: 'AES-256-GCM Zarf Şifreleme, KMS Anahtar Ayrımı, Break-Glass Acil Denetimi'
    });
  }

  const tableRows = dataCategories.length > 0
    ? dataCategories.map(c => 
        `| **${c.category}** | \`${c.fields.join(', ')}\` | ${c.dataSubjectGroup} | ${c.purpose} | ${c.legalBasis} | ${c.recipients} | ${c.crossBorderTransfer} | ${c.retention} | ${c.destructionMethod} | ${c.technicalMeasures} |`
      ).join('\n')
    : '| *Kişisel veri tespit edilemedi* | - | - | - | - | - | - | - | - | - |';

  return `# 📋 Veri İşleme Faaliyetleri Envanteri (RoPA / KVKK VERBİS 10 Sütun Standardı)
**Veri Sorumlusu:** ${organizationName} | **DPO / İrtibat Kişisi:** ${dpoEmail}  
**Oluşturulma Tarihi:** ${new Date().toISOString().split('T')[0]}  
**Referans:** 6698 Sayılı KVKK Madde 16 & GDPR Article 30 (10 Temel Sütun)

| 1. Veri Kategorisi | 2. Kişisel Veri Alanları | 3. İlgili Kişi Grubu | 4. İşleme Amacı | 5. Hukuki Dayanak | 6. Alıcı Grupları | 7. Sınır Ötesi Aktarım & Güvence | 8. Saklama Süresi | 9. Periyodik İmha Yöntemi (6 Ay) | 10. İdari ve Teknik Tedbirler |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${tableRows}

---
> *Not: Bu 10 sütunlu envanter CompliRules MCP Sunucusu tarafından kod tabanındaki veritabanı modelleri, VERBİS etiketleri ve ORM şemaları taranarak otomatik derlenmiştir.*`;
}
