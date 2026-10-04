import { RuleDefinition, RulePack } from './types.js';

export const KVKK_RETENTION_RULE: RuleDefinition = {
  id: 'kvkk-retention-tombstone',
  title: 'KVKK & VUK Veri Saklama ve Tombstone Anonimleştirme Standardı',
  jurisdiction: 'KVKK_TR',
  severity: 'CRITICAL',
  globs: [
    '**/*.prisma', 
    '**/schema.ts', 
    '**/models/**/*.ts', 
    '**/db/**/*.ts',
    '**/models.py',
    '**/models/**/*.py',
    '**/models/**/*.go',
    '**/migrations/*.php',
    '**/Models/**/*.php'
  ],
  alwaysApply: false,
  legalCitations: [
    {
      law: '6698 Sayılı KVKK',
      article: 'Madde 7',
      description: 'Kişisel verilerin silinmesi, yok edilmesi veya anonim hale getirilmesi yükümlülüğü.',
      penaltyContext: 'Hukuka aykırı saklama durumunda TCK Md. 138 uyarınca hapis cezası ve idari para cezası.'
    },
    {
      law: '6698 Sayılı KVKK',
      article: 'Madde 9 (2024 Reformu)',
      description: 'Yurt dışına veri aktarımı kısıtları. Standart Sözleşme (SCC) veya Kurul izni olmadan yurt dışı LLM (OpenAI, Anthropic) veya bulut (AWS, Vercel) servislerine açık PII aktarılamaz.',
      penaltyContext: 'KVKK Md. 18 ağır idari para cezaları ve TCK Md. 136 hapis yaptırımı.'
    },
    {
      law: '6698 Sayılı KVKK',
      article: 'Madde 6',
      description: 'Özel nitelikli kişisel verilerin (sağlık, biyometri, adli sicil) işlenmesinde Zarf Şifreleme (Envelope Encryption) ve anahtarların ayrı tutulması zorunluluğu.'
    },
    {
      law: '213 Sayılı Vergi Usul Kanunu (VUK)',
      article: 'Madde 253',
      description: 'Defter ve belgelerin (fatura, ödeme, sipariş kayıtları) 5 yıl saklanması zorunluluğu (TTK Md. 82: 10 yıl).'
    },
    {
      law: '6698 Sayılı KVKK & VERBİS Yönetmeliği',
      article: 'Madde 16',
      description: 'Veri Sorumluları Siciline (VERBİS) kayıt ve Veri İşleme Envanteri (RoPA) yükümlülüğü. Yabancı veri sorumluları için çalışan/ciro eşiği aranmaksızın Türkiye Temsilcisi atama ve kayıt zorunluluğu.',
      penaltyContext: 'KVKK Md. 18/1-ç uyarınca en üst hadden idari para cezası.'
    }
  ],
  summary: 'Kullanıcı silindiğinde finansal/fatura kayıtlarını silmeyin (onDelete: Cascade yasağı). Kişisel verileri Tombstone/Crypto-shredding ile anonimleştirin. Yurt dışı LLM çağrılarında PII maskeleyin ve özel verileri zarf şifreleme ile koruyun.',
  instructions: [
    'ASLA kullanıcı modeli ile fatura/ödeme modelleri arasında `onDelete: Cascade` (Django: `models.CASCADE`, Laravel: `cascadeOnDelete()`) ilişkisi kurmayın.',
    'Kullanıcı silme talebinde (Right to be Forgotten) veriyi kalıcı olarak DROP etmek yerine kişisel alanları (ad, e-posta, telefon, TCKN) deterministik olarak ezerek anonimleştirin.',
    'Her kullanıcı için `isAnonymized: Boolean` ve `anonymizedAt: DateTime?` sütunları bulundurun.',
    'Veri saklama sürelerini yönetmek için `RetentionPolicy` ve silme işlemlerini belgeleyen `ImhaLog` tablosu oluşturun.',
    'Yurt dışı LLM ve bulut APIlerine (OpenAI, Anthropic, Resend, AWS US-East) açık TCKN veya kişisel veri göndermeyin; yerel takma adlaştırma (pseudonymization) filtresi uygulayın (KVKK Md. 9).',
    'Sağlık, biyometrik veya adli sicil gibi özel nitelikli verileri `User` tablosunda plaintext saklamayın; Zarf Şifreleme (Envelope Encryption - DEK & KEK) kullanın (KVKK Md. 6).',
    'Veritabanı şemasında her hassas sütun üzerine VERBİS süreç eşleme etiketleri ekleyin (`/// @compliance: KVKK_MD5_2C | Retention: 10Y`).'
  ],
  forbiddenPatterns: [
    'onDelete: Cascade / models.CASCADE / cascadeOnDelete() (User ile Invoice/Payment arasında)',
    'deletedAt: DateTime? koyup kullanıcının açık isim ve e-postasını DBde bırakmak',
    'prisma.user.delete({ where: { id } }) / user.delete() doğrudan kalıcı çağrısı',
    'openai.chat.completions.create({ messages: [{ content: userTcknAndEmail }] }) (KVKK Md. 9 yurt dışı aktarımı)',
    'model User { healthHistory String } (Özel nitelikli veriyi User tablosunda plaintext tutmak)'
  ],
  compliantCodeSnippets: [
    {
      title: 'Prisma Şeması (VERBİS Etiketleri & Tombstone & SetNull)',
      language: 'prisma',
      code: `model User {
  id             String    @id @default(uuid())
  /// @compliance: KVKK_MD5_2C | GDPR_ART6_1B | Category: IDENTITY | Retention: MEMBERSHIP_PLUS_10Y
  email          String    // Anonimleştiğinde: "anon-{hash}@anonymized.local"
  name           String    // Anonimleştiğinde: "ANONIM KULLANICI"
  phone          String?   // Anonimleştiğinde: null
  tckn           String?   // Anonimleştiğinde: null
  isAnonymized   Boolean   @default(false)
  anonymizedAt   DateTime?
  createdAt      DateTime  @default(now())
  
  // Finansal kayıtlar asla cascade ile silinmez!
  invoices       Invoice[] @relation("UserInvoices")
  auditLogs      AuditLog[]
}

model Invoice {
  id          String   @id @default(uuid())
  userId      String?  // SetNull yapılarak kullanıcı silinse bile fatura saklanır
  user        User?    @relation("UserInvoices", fields: [userId], references: [id], onDelete: SetNull)
  amountCents Int
  taxNumber   String
  createdAt   DateTime @default(now()) // VUK Md. 253 gereği 5 yıl zorunlu saklama
}

// KVKK Md. 6: Özel nitelikli veriler ayrı ve zarf şifreli modelde tutulur
model EncryptedHealthProfile {
  id            String   @id @default(uuid())
  userId        String   @unique
  encryptedData String   // AES-256-GCM DEK ile şifrelenmiş veri
  encryptedKey  String   // KMS KEK ile şifrelenmiş DEK zarfı
  iv            String
  tag           String
  updatedAt     DateTime @updatedAt
}`
    },
    {
      title: 'Python / Django ORM (Tombstone & models.SET_NULL)',
      language: 'python',
      code: `from django.db import models

class User(models.Model):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    tckn = models.CharField(max_length=11, null=True, blank=True)
    is_anonymized = models.BooleanField(default=False)
    anonymized_at = models.DateTimeField(null=True, blank=True)

class Invoice(models.Model):
    # VUK Md. 253: ASLA models.CASCADE KULLANMAYIN!
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='invoices')
    amount_cents = models.PositiveIntegerField()
    tax_number = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True) # 5 yıl zorunlu saklama`
    },
    {
      title: 'Go / GORM (Tombstone & SET NULL Constraint)',
      language: 'go',
      code: `package models

import "time"

type User struct {
    ID           string     \`gorm:"primaryKey"\`
    Email        string     \`gorm:"not null"\`
    Name         string     \`gorm:"not null"\`
    IsAnonymized bool       \`gorm:"default:false"\`
    AnonymizedAt *time.Time
}

type Invoice struct {
    ID          string \`gorm:"primaryKey"\`
    UserID      *string
    // VUK Md. 253: OnDelete:SET NULL
    User        User   \`gorm:"constraint:OnDelete:SET NULL;"\`
    AmountCents int64
    CreatedAt   time.Time
}`
    },
    {
      title: 'PHP / Laravel Eloquent Migration (nullOnDelete)',
      language: 'php',
      code: `// database/migrations/..._create_invoices_table.php
Schema::create('invoices', function (Blueprint $table) {
    $table->uuid('id')->primary();
    // VUK Md. 253: cascadeOnDelete ASLA KULLANILMAZ!
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $table->unsignedInteger('amount_cents');
    $table->string('tax_number');
    $table->timestamps();
});`
    }
  ]
};

export const KVKK_UI_CONSENT_RULE: RuleDefinition = {
  id: 'kvkk-ui-consent-etk',
  title: 'KVKK & ETK/İYS Ayrık Rıza ve Dark Pattern Yasağı',
  jurisdiction: 'KVKK_TR',
  severity: 'CRITICAL',
  globs: ['**/*.tsx', '**/*.jsx', '**/*.vue', '**/components/forms/**/*.ts'],
  alwaysApply: false,
  legalCitations: [
    {
      law: '6698 Sayılı KVKK',
      article: 'Madde 3 & Md. 5 (Kurul İlke Kararı 2019/09)',
      description: 'Açık rızanın belirli bir konuya ilişkin olması ve hizmet şartına bağlanamaması (Bundled Consent yasağı).'
    },
    {
      law: '6563 Sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun (ETK)',
      article: 'Madde 6',
      description: 'Ticari elektronik ileti gönderimi için alıcının önceden onayının alınması (İYS uyumu).'
    }
  ],
  summary: 'Aydınlatma Metni bir onay kutusu değildir. Pazarlama/ETK onayı zorunlu veya önceden işaretli (pre-ticked) olamaz.',
  instructions: [
    'Aydınlatma Metni için checkbox KOYMAYIN. "Üye olarak Aydınlatma Metnini okuduğunuzu beyan edersiniz" şeklinde şeffaf bilgilendirme linki kullanın.',
    'Kullanım Koşulları ve Açık Rıza onaylarını tek bir kutuda BİRLEŞTİRMEYİN.',
    'Pazarlama (SMS/E-posta) onayı ASLA `required` olamaz ve ASLA `defaultChecked={true}` yapılamaz.',
    'Rıza logunu `AgreementAcceptanceLog` tablosunda zaman damgası, IP adresi ve metin versiyonu ile saklayın.'
  ],
  forbiddenPatterns: [
    '<input type="checkbox" defaultChecked={true} /> (Rıza formlarında)',
    '<input type="checkbox" required /> (Pazarlama veya ETK onaylarında)',
    '"Kullanım koşullarını ve kampanya e-postalarını kabul ediyorum" (Tek kutu)'
  ],
  compliantCodeSnippets: [
    {
      title: 'React/TSX Form Bileşeni (KVKK & ETK Uyumlu)',
      language: 'tsx',
      code: `// Aydınlatma metni bilgilendirme metnidir; checkbox gerektirmez.
<p className="text-sm text-neutral-600">
  Kişisel verileriniz{" "}
  <a href="/aydinlatma-metni" target="_blank" className="underline font-medium">
    KVKK Aydınlatma Metni
  </a>{" "}
  kapsamında işlenmektedir.
</p>

// 1. Zorunlu Sözleşme Onayı (Açık rıza DEĞİL, sözleşmenin ifası)
<label className="flex items-center gap-2 text-sm">
  <input type="checkbox" required name="termsAccepted" className="w-4 h-4" />
  <span><a href="/terms" className="underline">Kullanıcı Sözleşmesini</a> okudum ve kabul ediyorum.</span>
</label>

// 2. İhtiyari ETK / Pazarlama Onayı (ZORUNLU OLAMAZ, PRE-TICKED OLAMAZ)
<label className="flex items-center gap-2 text-sm">
  <input type="checkbox" name="marketingConsent" defaultChecked={false} className="w-4 h-4" />
  <span>Kampanya, indirim ve bülten iletilerini SMS/E-posta ile almayı kabul ediyorum. (İsteğe bağlı)</span>
</label>`
    }
  ]
};

export const GDPR_RIGHT_TO_ERASURE_RULE: RuleDefinition = {
  id: 'gdpr-right-to-be-forgotten',
  title: 'GDPR Madde 17 Unutulma Hakkı ve Üçüncü Parti İtlaf Pipeline',
  jurisdiction: 'GDPR_EU',
  severity: 'CRITICAL',
  globs: [
    '**/*.prisma', 
    '**/api/**/*.ts', 
    '**/services/user*.ts',
    '**/models.py',
    '**/models/**/*.py',
    '**/models/**/*.go',
    '**/Models/**/*.php'
  ],
  alwaysApply: false,
  legalCitations: [
    {
      law: 'General Data Protection Regulation (GDPR)',
      article: 'Article 17 & 25',
      description: 'Right to erasure ("right to be forgotten") and Data protection by design and by default.',
      penaltyContext: 'İhlal durumunda 20 milyon Euro veya küresel cironun %4üne varan idari para cezası.'
    },
    {
      law: 'General Data Protection Regulation (GDPR)',
      article: 'Article 17(3)(b) & (e)',
      description: 'Hukuki saklama yükümlülüğü (vergi/muhasebe) ve hukuki taleplerin savunulması istisnası. Fatura ve mali kayıtlar fiziksel olarak silinemez; kullanıcı ile ilişkisi koparılmalıdır.'
    },
    {
      law: 'General Data Protection Regulation (GDPR)',
      article: 'Article 20',
      description: 'Right to Data Portability. Kullanıcının kişisel verilerini yapılandırılmış, yaygın kullanılan ve makinece okunabilir formatta (JSON/CSV) alma ve taşıma hakkı.'
    },
    {
      law: 'General Data Protection Regulation (GDPR)',
      article: 'Article 8',
      description: 'Çocukların rızası ve yaş sınırları. 16 yaşından (veya üye devletçe belirlenen 13 yaşından) küçüklerin verisi veli/ebeveyn onayı olmadan işlenemez.'
    }
  ],
  summary: 'Silme talebi sadece yerel DB silmesi değildir; üçüncü parti servisleri temizleyin, faturaları Art. 17(3)(b) ile koruyun, Art. 20 veri taşınabilirliği ve Art. 8 yaş kapısı sunun.',
  instructions: [
    'Kullanıcı silme işleminde bir `UserErasureJob` asenkron olayı tetikleyin.',
    'Harici üçüncü parti sistemlerdeki (Stripe customer, Resend contact, Mixpanel profile) kullanıcı kayıtlarını API üzerinden anonimleştirin veya silin.',
    'Finansal ve muhasebe kayıtlarını (fatura/ödeme) GDPR Madde 17(3)(b) uyarınca yasal saklama yükümlülüğü nedeniyle ASLA cascade ile silmeyin; kullanıcı ilişkisini SetNull veya crypto-shredding ile kopararak saklayın.',
    'Kullanıcının verilerini yapılandırılmış, yaygın kullanılan ve makinece okunabilir (JSON/CSV) formatta dışa aktarabileceği `exportUserData(userId)` veya `GET /api/user/export` endpointi oluşturun (GDPR Art. 20).',
    'Genel kitleye açık platformlarda yaş doğrulama kapısı ekleyin; 16 yaş altı kullanıcılar için veli onay akışı sağlayın (GDPR Art. 8).',
    'Yedekleme (backup) sistemlerindeki veriler için 30 günlük dönemsel cryptographic shredding anahtar imhası uygulayın.'
  ],
  forbiddenPatterns: [
    'Sadece tek tablodan DELETE çalıştırıp dış sistemleri (CRM/Analitik) unutmak',
    'Hard delete ile audit trail (denetim izi) veya fatura kanıtını tamamen yok etmek',
    'onDelete: Cascade (User ile Invoice/Billing modelleri arasında)',
    'Kullanıcı hesabı sunup veri dışa aktarma (Data Portability / Export) imkanı sunmamak (GDPR Art. 20 ihlali)'
  ],
  compliantCodeSnippets: [
    {
      title: 'TypeScript De-identification Pipeline',
      language: 'ts',
      code: `export async function executeRightToBeForgotten(userId: string) {
  // 1. Dış servislerden temizle
  await Promise.allSettled([
    resend.contacts.remove({ email: user.email }),
    posthog.capture({ distinctId: userId, event: '$delete_user' })
  ]);
  
  // 2. Yerel verileri kriptografik olarak yok et (Crypto-shredding)
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: \`erased-\${crypto.randomUUID()}@anonymized.invalid\`,
      name: 'DE-IDENTIFIED USER',
      phone: null,
      isAnonymized: true,
      anonymizedAt: new Date()
    }
  });
}`
    },
    {
      title: 'GDPR Article 20 Taşınabilir Veri Dışa Aktarma (JSON Export)',
      language: 'ts',
      code: `import { generateDataPortabilityBundle } from '@complirules/primitives';

// GET /api/user/export
export async function exportUserDataHandler(req: Request) {
  const user = await db.user.findUnique({ where: { id: req.userId } });
  const invoices = await db.invoice.findMany({ where: { userId: req.userId } });
  const consents = await db.agreementLog.findMany({ where: { userId: req.userId } });

  const exportBundle = generateDataPortabilityBundle(user, {
    activityHistory: invoices,
    consentRecords: consents
  });

  return Response.json(exportBundle, {
    headers: {
      'Content-Disposition': \`attachment; filename="data-export-\${req.userId}.json"\`
    }
  });
}`
    }
  ]
};

export const EAA_ACCESSIBILITY_RULE: RuleDefinition = {
  id: 'eaa-wcag-accessibility',
  title: 'European Accessibility Act (EAA 2025) & WCAG 2.1 AA Arayüz Standartları',
  jurisdiction: 'EAA_EU',
  severity: 'HIGH',
  globs: ['**/*.tsx', '**/*.jsx', '**/*.html', '**/*.css'],
  alwaysApply: false,
  legalCitations: [
    {
      law: 'European Accessibility Act (Directive 2019/882)',
      article: 'Annex I (Functional Accessibility Requirements)',
      description: 'AB pazarında hizmet veren tüm e-ticaret, SaaS ve bankacılık arayüzlerinde zorunlu erişilebilirlik (Yürürlük: Haziran 2025).'
    },
    {
      law: 'EN 301 549 & W3C WCAG 2.1',
      article: 'Level AA',
      description: 'Algılanabilir, Çalıştırılabilir, Anlaşılabilir ve Sağlam web standartları.'
    }
  ],
  summary: 'Klavye navigasyonu, görünür focus halkası, >=44px dokunma hedefi ve ekran okuyucu etiketleri yasal zorunluluktur.',
  instructions: [
    'ASLA `outline: none` stilini görünür bir `:focus-visible` alternatifi olmadan kullanmayın.',
    'Bütün interaktif buton ve linkler mobil ekranda en az 44x44px dokunma alanına (touch target) sahip olmalıdır.',
    'İkon butonlarda (ikon tek başına kullanıldığında) mutlaka açıklayıcı `aria-label` bulunmalıdır.',
    'Metin kontrastı APCA veya WCAG 2.1 AA standardına göre normal metinlerde en az 4.5:1 olmalıdır.',
    'Form hata mesajlarını ekran okuyuculara duyurmak için `aria-invalid="true"`, `aria-describedby="{field}-error"` ve `role="alert"` veya `aria-live="polite"` kullanın (WCAG 3.3.1 / 3.3.2).'
  ],
  forbiddenPatterns: [
    'outline: none (yerine focus ring tanımlanmadan)',
    '<button><svg>...</svg></button> (aria-label olmadan ikon buton)',
    '<div onClick={...}> (Klavye desteği ve role="button" olmadan tıklanabilir div)',
    'Form hatalarını yalnızca kırmızı renk veya ikonla gösterip ekran okuyucu ARIA etiketlerini atlamak'
  ],
  compliantCodeSnippets: [
    {
      title: 'EAA Uyumlu İkon Buton (Tailwind & Radix/Native)',
      language: 'tsx',
      code: `<button
  type="button"
  aria-label="Kullanıcı Profil Ayarlarını Aç"
  className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg p-2.5 text-neutral-700 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-95"
>
  <GearIcon className="w-5 h-5" aria-hidden="true" />
</button>`
    },
    {
      title: 'EAA / WCAG Uyumlu Form Alanı ve Canlı Hata Duyurusu',
      language: 'tsx',
      code: `<div>
  <label htmlFor="email" className="block text-sm font-medium text-neutral-900">
    E-posta Adresi
  </label>
  <input
    id="email"
    name="email"
    type="email"
    aria-invalid={hasError ? "true" : "false"}
    aria-describedby={hasError ? "email-error" : undefined}
    className="mt-1 block w-full rounded-md border border-neutral-300 text-base focus-visible:outline-2 focus-visible:outline-blue-600"
  />
  {hasError && (
    <p id="email-error" role="alert" className="mt-1 text-sm text-red-600">
      Geçerli bir e-posta adresi giriniz.
    </p>
  )}
</div>`
    }
  ]
};

export const HIPAA_TECHNICAL_SAFEGUARDS_RULE: RuleDefinition = {
  id: 'hipaa-phi-technical-safeguards',
  title: 'HIPAA Security Rule (45 CFR § 164.312) Teknik Güvenceler ve PHI İzolasyonu',
  jurisdiction: 'HIPAA_US',
  severity: 'CRITICAL',
  globs: [
    '**/api/**/*.ts', 
    '**/models/**/*.ts', 
    '**/services/**/*.ts',
    '**/models.py',
    '**/models/**/*.py',
    '**/models/**/*.go',
    '**/Models/**/*.php'
  ],
  alwaysApply: false,
  legalCitations: [
    {
      law: 'Health Insurance Portability and Accountability Act (HIPAA)',
      article: '45 CFR § 164.312',
      description: 'Korumalı Sağlık Bilgileri (PHI) için Erişim Kontrolü, Denetim İzleri (Audit Controls) ve İletim Güvenliği.'
    },
    {
      law: 'Health Insurance Portability and Accountability Act (HIPAA)',
      article: '45 CFR § 164.502(b)',
      description: 'Minimum Necessary Standard. Sağlık verilerine erişimde personelin yalnızca o anki klinik veya idari görevi için asgari düzeyde gerekli olan alanlara erişimini kısıtlama zorunluluğu.'
    },
    {
      law: 'Health Insurance Portability and Accountability Act (HIPAA)',
      article: '45 CFR § 164.312(a)(2)(iii)',
      description: 'Automatic Logoff. Terminal ve klinik web oturumlarında yetkisiz erişimi önlemek için maksimum 15 dakikalık hareketsizlik sonrası otomatik oturum kapatma.'
    }
  ],
  summary: 'PHI verileri loglara basılamaz, açık tutulamaz, BAA sözleşmesiz LLMlere verilemez. SELECT * yasağı (Minimum Necessary) ve 15 dk otomatik oturum kapatma zorunludur.',
  instructions: [
    'Hasta sağlık bilgileri (teşhis, reçete, lab sonucu) ile kimlik bilgilerini (ad, SSN) aynı açık tabloda tutmayın; şifreli veya takma adlı (pseudonymized) bağlayın.',
    'BAA (Business Associate Agreement) imzalanmamış açık LLM APIlerine (OpenAI public tier, Anthropic public tier) asla ham PHI göndermeyin.',
    'ASLA PHI modellerinde `SELECT *` veya projectsiz sorgu çalıştırmayın; yalnızca o anki işlem için gerekli alanları kısıtlayın (`select: { vitals: true }`) (45 CFR § 164.502(b)).',
    'Klinik portallarda 15 dakikalık maksimum hareketsizlik durumunda oturumu otomatik kapatan (`HIPAA_MAX_INACTIVITY_MS = 15 * 60 * 1000`) oturum düşürme denetleyicisi uygulayın (45 CFR § 164.312(a)(2)(iii)).',
    'Her PHI erişimini (okuma/yazma/silme) `ImmutableAuditLog` tablosuna aktör ID, işlem zamanı ve hasta ID ile kaydedin.'
  ],
  forbiddenPatterns: [
    'openai.chat.completions.create({ messages: [{ content: patientMedicalNotes }] }) (BAAsız)',
    'logger.info({ diagnosis: patient.diagnosis })',
    'prisma.patient.findUnique({ where: { id } }) (Select projeksiyonu olmadan tüm PHI kaydını çekmek)',
    'SELECT * FROM medical_records / SELECT * FROM patients'
  ],
  compliantCodeSnippets: [
    {
      title: 'PHI Redacted Audit Logging',
      language: 'ts',
      code: `export async function logPhiAccess(actorId: string, patientId: string, action: 'VIEW' | 'EDIT') {
  await prisma.phiAuditLog.create({
    data: {
      actorId,
      patientId,
      action,
      ipHash: hashIp(requestIp),
      accessedAt: new Date()
    }
  });
}`
    },
    {
      title: 'HIPAA Minimum Necessary (Alan Kısıtlı Projeksiyon) & 15 Dk Timeout',
      language: 'ts',
      code: `import { isHipaaSessionExpired, HIPAA_MAX_INACTIVITY_MS } from '@complirules/primitives';

// 1. Minimum Necessary Sorgu (ASLA SELECT * KULLANMAYIN!)
export async function getPatientVitals(patientId: string) {
  return await prisma.patientRecord.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      bloodPressure: true,
      heartRate: true,
      recordedAt: true
      // Teşhis, psikiyatri notları veya SSN çekilmez!
    }
  });
}

// 2. 15 Dakika Hareketsizlik Oturum Denetimi (45 CFR § 164.312(a)(2)(iii))
export function checkClinicSession(lastActivityTimestamp: number) {
  if (isHipaaSessionExpired(lastActivityTimestamp)) {
    throw new Error('HIPAA_SESSION_EXPIRED: 15 dakikalık hareketsizlik nedeniyle oturum kapatıldı.');
  }
}`
    }
  ]
};

export const AI_ACT_TRANSPARENCY_RULE: RuleDefinition = {
  id: 'ai-act-transparency',
  title: 'EU AI Act Madde 50 Şeffaflık ve Madde 12 Denetim Logu Standartları',
  jurisdiction: 'AI_ACT_EU',
  severity: 'HIGH',
  globs: [
    '**/*.tsx', 
    '**/*.jsx', 
    '**/api/generate/**/*.ts',
    '**/*.py',
    '**/*.go'
  ],
  alwaysApply: false,
  legalCitations: [
    {
      law: 'European Union Artificial Intelligence Act (EU AI Act)',
      article: 'Article 50',
      description: 'Yapay zekâ sistemleri ile etkileşimde bulunan kullanıcının bilgilendirilmesi ve üretilen içeriğin makinece okunabilir şekilde işaretlenmesi.'
    },
    {
      law: 'European Union Artificial Intelligence Act (EU AI Act)',
      article: 'Article 12',
      description: 'Yüksek riskli (High-Risk - Annex III) yapay zekâ sistemleri için otomatik olay ve işlem kaydı tutma (record-keeping / audit trail) yükümlülüğü.'
    },
    {
      law: 'European Union Artificial Intelligence Act (EU AI Act)',
      article: 'Article 14',
      description: 'Human Oversight (Human-in-the-loop / Human-on-the-loop). Yüksek riskli otonom sistemlerde kararların insanlar tarafından denetlenebilmesi, durdurulabilmesi veya geçersiz kılınabilmesi (override) zorunluluğu.'
    },
    {
      law: 'European Union Artificial Intelligence Act (EU AI Act)',
      article: 'Article 86',
      description: 'Right to Explanation. Kullanıcının yapay zekâ destekli bireysel kararlara ilişkin gerekçeli açıklama talep etme ve itiraz hakkı.'
    }
  ],
  summary: 'AI içerikleri arayüzde şeffaflaştırılmalı, C2PA filigranı eklenmeli, Article 12 denetim logu tutulmalı ve Article 14 insan gözetimi (Human-in-the-loop) ile Article 86 itiraz mekanizması sağlanmalıdır.',
  instructions: [
    'Kullanıcı bir AI sohbet robotu veya aracıyla etkileşime girdiğinde "Bu yanıt bir yapay zekâ modeli tarafından üretilmiştir" ibaresi görünür olmalıdır.',
    'AI tarafından üretilen görsel veya ses içeriklerinde makinece okunabilir şeffaflık metadata etiketi (`x-ai-generated: true`) döndürülmelidir.',
    'Karar destek ve yüksek riskli (High-Risk - Annex III) süreçlerde kullanılan yapay zekâ çağrıları için Article 12 uyarınca otomatik sistem denetim logları (input hash, model versiyonu, timestamp, output hash) tutun.',
    'Yüksek riskli veya kullanıcı üzerinde hukuki/mali etkisi olan AI kararlarında güven skoru düşük olduğunda (`confidenceScore < threshold`) veya kritik kararlarda süreci durdurup insan moderatör eskalasyon kuyruğuna (`escalateToHumanReview`) yönlendirin (Article 14).',
    'AI destekli kararların yanında kullanıcıya gerekçeli açıklama talep etme ve karara itiraz etme hakkı tanıyan bir itiraz/insanla görüşme arayüzü (`RequestHumanInterventionButton`) sunun (Article 86).'
  ],
  forbiddenPatterns: [
    'AI yanıtlarını doğrudan insan yanıtı gibi göstermek (No AI disclaimer)',
    'AI üretimi içeriğin kaynağını gizlemek',
    'Yüksek riskli AI kararlarında denetim kaydı (audit log) tutmadan doğrudan işlem yapmak',
    'Kullanıcı haklarını veya mali durumunu etkileyen yüksek riskli AI kararlarını insan denetimi ve itiraz hakkı olmaksızın doğrudan kesinleştirmek'
  ],
  compliantCodeSnippets: [
    {
      title: 'AI Şeffaflık Rozeti Bileşeni',
      language: 'tsx',
      code: `<div className="flex items-center gap-1.5 text-xs text-neutral-500 py-1" role="status">
  <SparklesIcon className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
  <span>Yapay zekâ tarafından oluşturulmuştur. Hatalar içerebilir, lütfen doğrulayınız.</span>
</div>`
    },
    {
      title: 'EU AI Act Article 14 Human-in-the-loop & Eskalasyon Mekanizması',
      language: 'ts',
      code: `import { evaluateAiDecisionWithOversight } from '@complirules/primitives';

export async function processAutomatedDecision(userApplication: any) {
  const aiResult = await runModelInference(userApplication);

  // Article 14: Eşik altı kararlar insan moderatöre yönlendirilir
  const decisionRecord = evaluateAiDecisionWithOversight({
    modelId: 'risk-scoring-v2',
    inputPayload: userApplication,
    outputPayload: aiResult,
    confidenceScore: aiResult.score,
    threshold: 0.85
  });

  if (decisionRecord.requiresHumanReview) {
    await queueForHumanReview(decisionRecord);
    return { status: 'PENDING_HUMAN_REVIEW', message: 'Karar insan denetçisi incelemesine yönlendirildi.' };
  }

  return { status: 'APPROVED', result: aiResult };
}`
    }
  ]
};

export const PII_LOGGER_GUARD_RULE: RuleDefinition = {
  id: 'sec-pii-logger-guard',
  title: 'Log ve Telemetri Katmanında Sıfır PII/PHI Sızıntısı Standardı',
  jurisdiction: 'GLOBAL_SEC',
  severity: 'CRITICAL',
  globs: [
    '**/api/**/*.ts', 
    '**/controllers/**/*.ts', 
    '**/lib/logger.ts', 
    '**/middleware/**/*.ts',
    '**/*.py',
    '**/*.go',
    '**/*.php'
  ],
  alwaysApply: true,
  legalCitations: [
    {
      law: 'GDPR / KVKK / HIPAA Ortak İlkesi',
      article: 'Veri Minimizasyonu & Gizlilik Güvenliği',
      description: 'Üçüncü parti log sunucularına (Datadog, CloudWatch, Sentry) kimlik, parola, token veya TCKN sızdırılamaz.'
    }
  ],
  summary: 'console.log veya print ile ham nesne (req.body, user) basmayın. Otomatik redaksiyonlu logger kullanın.',
  instructions: [
    'ASLA `console.log(req.body)`, `console.log(user)`, `print(request.body)` veya `logger.info(user)` yazmayın.',
    'Merkezi bir redaksiyon filtresi (`pino` redaction, Python `structlog` veya Go `slog`) kullanın.',
    'E-posta, TCKN, IBAN, parola ve yetkilendirme token alanlarını her zaman maskeleyin (`j***@example.com`, `123*****789`).'
  ],
  forbiddenPatterns: [
    'console.log(req.body) / print(request.body) / Log::info($request->all())',
    'console.log(user) / logger.info(user) / log.Printf("%+v", user)',
    'Sentry.captureException(err, { extra: { payload: req.body } })'
  ],
  compliantCodeSnippets: [
    {
      title: 'TypeScript / Node.js (Redaksiyonlu Logger)',
      language: 'ts',
      code: `import { createRedactedLogger } from '@complirules/primitives';

export const logger = createRedactedLogger({
  redactKeys: ['password', 'tckn', 'creditCard', 'token', 'authorization']
});

logger.info('Kullanıcı girişi başarılı', { userId: user.id });`
    },
    {
      title: 'Python (structlog / logging.Filter PII Redaction)',
      language: 'python',
      code: `import logging

class PiiMaskingFilter(logging.Filter):
    SENSITIVE_KEYS = {'password', 'tckn', 'credit_card', 'token', 'authorization'}

    def filter(self, record):
        if isinstance(record.msg, dict):
            record.msg = {
                k: '[REDACTED_PII]' if k.lower() in self.SENSITIVE_KEYS else v 
                for k, v in record.msg.items()
            }
        return True

logger = logging.getLogger('complirules_app')
logger.addFilter(PiiMaskingFilter())
logger.info({'event': 'user_login', 'user_id': user.id})`
    },
    {
      title: 'Go (slog.Handler with PII Masking)',
      language: 'go',
      code: `package logger

import (
    "log/slog"
    "os"
    "strings"
)

func NewCompliantLogger() *slog.Logger {
    opts := &slog.HandlerOptions{
        ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
            key := strings.ToLower(a.Key)
            if key == "password" || key == "tckn" || key == "token" {
                return slog.String(a.Key, "[REDACTED_PII]")
            }
            return a
        },
    }
    return slog.New(slog.NewJSONHandler(os.Stdout, opts))
}`
    },
    {
      title: 'PHP / Laravel (Log Context Redaction)',
      language: 'php',
      code: `// app/Logging/SanitizedLogger.php
Log::info('User login successful', [
    'user_id' => $user->id,
    // Asla $request->all() basmayın!
]);`
    }
  ]
};

export const KVKK_DSR_TICKETING_RULE: RuleDefinition = {
  id: 'kvkk-dsr-ticketing',
  title: 'KVKK Md. 11 & 13 Veri Sahibi Başvuru ve 30 Günlük SLA Yönetimi',
  jurisdiction: 'KVKK_TR',
  severity: 'CRITICAL',
  globs: [
    '**/api/**/*.ts', 
    '**/services/dsr*.ts', 
    '**/routes/**/*.ts', 
    '**/controllers/**/*.ts',
    '**/*dsr*.py',
    '**/*ticket*.go'
  ],
  alwaysApply: false,
  legalCitations: [
    {
      law: '6698 Sayılı KVKK',
      article: 'Madde 13',
      description: 'Veri sorumlusuna başvuru taleplerinin en kısa sürede ve en geç otuz gün içinde ücretsiz olarak sonuçlandırılması zorunluluğu (Uzatılamaz kesin süre).',
      penaltyContext: 'KVKK Md. 18 uyarınca ağır idari para cezası.'
    },
    {
      law: '6698 Sayılı KVKK',
      article: 'Madde 11 & Md. 11/1-f',
      description: 'İlgili kişinin hakları ve düzeltme/silme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesi yükümlülüğü (Downstream Notification).'
    },
    {
      law: 'Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ',
      article: 'Madde 5/2',
      description: 'Başvuruda ad-soyad, imza, TCKN/pasaport no, tebligat adresi, e-posta/telefon ve talep konusunun bulunması zorunludur.'
    }
  ],
  summary: 'İlgili kişi başvurularını Tebliğ Md. 5/2 zorunlu unsurlarına göre doğrulayın; 30 günlük kesin ve uzatılamaz SLA ile takip edin; silme/düzeltme işlemlerinde üçüncü taraflara downstream bildirim gönderin.',
  instructions: [
    'Tebliğ Md. 5/2 uyarınca başvuruda ad-soyad, imza/doğrulama, TCKN (veya pasaport no), tebligat adresi, e-posta/telefon ve talep konusu alanlarını zorunlu olarak doğrulayın.',
    'Başvuru biletini `DsrEngine.createTicket` ile oluşturup başvuru tarihinden itibaren kesin 30 günlük geri sayım başlatın; bu süre kanunen uzatılamaz.',
    'Veri silme veya düzeltme talebi onaylandığında, verilerin daha önce aktarıldığı tüm üçüncü parti sistemlere (CRM, e-posta listeleri, analitik) downstream bildirim iletin (KVKK Md. 11/1-f).',
    'Talebin reddi durumunda gerekçeli ret kararını yazılı veya elektronik ortamda ilgili kişiye 30 gün içinde bildirin.'
  ],
  forbiddenPatterns: [
    '30 günlük yasal cevap süresini aşmak veya gerekçesiz yanıtsız bırakmak',
    'Tebliğ Md. 5/2 zorunlu kimlik/adres doğrulaması yapmadan anonim talepleri işleme almak',
    'Veri silindiğinde aktarılan üçüncü taraflara downstream bildirim yapmayı atlamak'
  ],
  compliantCodeSnippets: [
    {
      title: 'TypeScript / Node.js DSR Başvuru ve Downstream Bildirim',
      language: 'ts',
      code: `import { DsrEngine } from '@complirules/primitives';

export async function handleKvkkDsrRequest(payload: any) {
  // 1. Tebliğ Md. 5/2 zorunlu alan kontrolü
  const validation = DsrEngine.validateKvkkApplicantPayload(payload);
  if (!validation.valid) {
    throw new Error(\`Eksik başvuru unsurları: \${validation.missingFields.join(', ')}\`);
  }

  // 2. 30 Günlük kesin SLA bileti oluştur
  const ticket = DsrEngine.createTicket({
    jurisdiction: 'KVKK_TR',
    requestType: 'ERASURE',
    applicant: payload
  });

  // 3. Downstream sistemleri bilgilendir (KVKK Md. 11/1-f)
  const updatedTicket = DsrEngine.notifyDownstreamProcessors(ticket, ['Stripe', 'HubSpot', 'PostHog']);
  return updatedTicket;
}`
    }
  ]
};

export const KVKK_COOKIE_CMP_RULE: RuleDefinition = {
  id: 'kvkk-cookie-cmp',
  title: 'KVKK Çerez Rehberi & Simetrik Consent Management Platform (CMP)',
  jurisdiction: 'KVKK_TR',
  severity: 'CRITICAL',
  globs: [
    '**/*.tsx', 
    '**/*.jsx', 
    '**/components/cookie*.tsx', 
    '**/components/cmp*.tsx',
    '**/components/banner*.tsx'
  ],
  alwaysApply: false,
  legalCitations: [
    {
      law: 'KVKK Çerez Uygulamaları Hakkında Rehber',
      article: 'Haziran 2022',
      description: 'Zorunlu çerezler haricindeki tüm analitik ve pazarlama çerezlerinde önceden açık rıza (Prior Consent Gating) ve simetrik ret butonu zorunluluğu.',
      penaltyContext: 'Hukuka aykırı veri işleme yaptırımları (KVKK Md. 18).'
    },
    {
      law: '6698 Sayılı KVKK',
      article: 'Madde 5/1',
      description: 'Kişisel verilerin ilgili kişinin açık rızası olmaksızın işlenemeyeceği temel kuralı.'
    }
  ],
  summary: 'Çerezleri 4 kategoriye ayırın. Zorunlu olmayan analitik ve pazarlama çerezlerini önceden açık rıza (Prior Consent) almadan yüklemeyin. Çerez banner\'ında "Kabul Et" ve "Reddet" butonlarını tamamen simetrik ve eşit hiyerarşide sunun.',
  instructions: [
    'Çerezleri Zorunlu (Strictly Necessary), İşlevsel (Functional), Analitik (Analytics) ve Pazarlama (Marketing) olarak 4 kategoriye ayırın.',
    'Kullanıcı açıkça rıza vermeden (prior consent) Google Analytics, Hotjar, Facebook Pixel gibi üçüncü parti izleme scriptlerini ASLA çalıştırmayın.',
    'Çerez banner\'ında "Tümünü Kabul Et" butonuyla tamamen aynı büyüklük, zıtlık ve kolaylıkta "Tümünü Reddet" butonu sunun (Simetrik buton ilkesi).',
    'Rıza tercihlerini versiyonlanmış çerezde saklayın ve en geç 12 ayda bir rıza yenileme isteyin.',
    'Cookie Wall veya manipülatif koyu desen (Dark Pattern) uygulamayın.'
  ],
  forbiddenPatterns: [
    'Kullanıcı rızası alınmadan doğrudan analitik veya pazarlama scripti yüklemek (Ungated scripts)',
    'Bannerda sadece "Kabul Et" gösterip "Reddet" seçeneğini gizlemek veya zorlaştırmak',
    'Hizmet kullanımını zorunlu olmayan çerezlerin kabulüne bağlamak (Cookie Wall)'
  ],
  compliantCodeSnippets: [
    {
      title: 'React/Next.js Simetrik Çerez CMP Bileşeni',
      language: 'tsx',
      code: `import { CookieConsentManager } from '@complirules/primitives';

export function CookieBanner({ onAcceptAll, onRejectAll }: Props) {
  const config = CookieConsentManager.getSymmetricBannerConfig();
  
  return (
    <div role="dialog" aria-label="Çerez Yönetimi" className="fixed bottom-0 inset-x-0 p-4 bg-white border-t flex justify-between items-center z-50">
      <p className="text-sm text-neutral-700">{config.noticeText}</p>
      <div className="flex gap-3">
        {/* KVKK Kuralı: Reddet ve Kabul Et butonları simetrik olmalıdır */}
        <button type="button" onClick={onRejectAll} className="px-4 py-2 border rounded text-neutral-800 hover:bg-neutral-100">
          {config.rejectAllText}
        </button>
        <button type="button" onClick={onAcceptAll} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          {config.acceptAllText}
        </button>
      </div>
    </div>
  );
}`
    }
  ]
};

export const KVKK_TRANSFER_GEOFENCING_RULE: RuleDefinition = {
  id: 'kvkk-transfer-geofencing',
  title: 'KVKK Madde 9 (2024 Reformu) Yurt Dışı Veri Aktarımı ve Veri Yerleşimi Standardı',
  jurisdiction: 'KVKK_TR',
  severity: 'CRITICAL',
  globs: [
    '**/api/**/*.ts', 
    '**/services/**/*.ts', 
    '**/infra/**/*.ts', 
    '**/config/**/*.ts',
    '**/*transfer*.py',
    '**/*router*.go'
  ],
  alwaysApply: false,
  legalCitations: [
    {
      law: '6698 Sayılı KVKK',
      article: 'Madde 9 (12 Mart 2024 Reformu)',
      description: 'Yurt dışına veri aktarımında Standart Sözleşme (SCC), BCR veya Kurul izni zorunluluğu.',
      penaltyContext: 'KVKK Md. 18/1-e (1.000.000 TL - 5.000.000 TL idari para cezası) & TCK Md. 136 hapis yaptırımı.'
    },
    {
      law: 'Yurt Dışına Kişisel Veri Aktarımına İlişkin Usul ve Esaslar Hakkında Yönetmelik',
      article: 'Madde 14 (10 Temmuz 2024)',
      description: 'Standart Sözleşmelerin (SCC) imzalanmasından itibaren 5 İŞ GÜNÜ İÇİNDE Kurul\'a bildirilmesi zorunluluğu.'
    }
  ],
  summary: 'Türkiye\'deki kullanıcı verilerini varsayılan olarak yerel veri merkezlerinde (TR Region) barındırın (Geo-Fencing). Standart Sözleşme (SCC) imzalandığında 5 iş günü içinde Kurul\'a bildirim yapın. Uygun güvence olmadan yurt dışı LLM veya bulut API\'lerine PII aktarmayın.',
  instructions: [
    'Türkiye\'deki kullanıcılara ait kimlik, finansal ve sağlık verilerini varsayılan olarak Türkiye bölgesi (TR Region) veritabanlarında saklayın (Data Residency / Geo-Fencing).',
    'Yurt dışına veri aktarılacaksa Standart Sözleşme (SCC), Bağlayıcı Şirket Kuralları (BCR) veya Taahhütname/Kurul izni dayanağını doğrulayın.',
    'Standart Sözleşme (SCC) imzalandıktan sonra en geç 5 İŞ GÜNÜ İÇİNDE Kurul\'a fiziken veya KEP üzerinden bildirim yapılmasını sistemsel olarak takip edin.',
    'Yurt dışı LLM ve analiz API\'lerine (OpenAI, Anthropic, AWS US-East) doğrudan açık TCKN veya PII iletmeden önce yerel maskeleme uygulayın.'
  ],
  forbiddenPatterns: [
    'Uygun güvence (SCC/BCR/İzin) olmadan kullanıcı verilerini yurt dışı sunuculara veya LLM API\'lerine aktarmak',
    'Standart Sözleşme 5 iş günü Kurul bildirim süresini kaçırmak veya kayıtsız aktarım yapmak',
    'Coğrafi yönlendirme (geo-routing) olmaksızın küresel tek bölge veritabanı kullanmak'
  ],
  compliantCodeSnippets: [
    {
      title: 'Geo-Routing ve SCC Bildirim Denetleyicisi',
      language: 'ts',
      code: `import { GeoRouter } from '@complirules/primitives';

export function routeUserDataTransfer(userCountry: 'TR', destinationCountry: 'US', hasScc: boolean) {
  const decision = GeoRouter.evaluateTransfer({
    originCountry: userCountry,
    destinationCountry,
    hasExecutedScc: hasScc
  });

  if (!decision.allowed) {
    throw new Error(\`Yurt dışı aktarım engellendi: \${decision.reason}\`);
  }

  if (decision.requiresKurulSccNotification) {
    console.log(\`⚠️ DİKKAT: Standart Sözleşme \${decision.sccNotificationDeadlineBusinessDays} iş günü içinde Kurul'a bildirilmelidir!\`);
  }
}`
    }
  ]
};

export const KVKK_BREACH_NOTIFICATION_RULE: RuleDefinition = {
  id: 'kvkk-breach-notification-72h',
  title: 'KVKK Madde 12 & Kurul İlke Kararı (2019/10) 72 Saatlik İhlal Bildirim Standardı',
  jurisdiction: 'KVKK_TR',
  severity: 'CRITICAL',
  globs: [
    '**/services/incident*.ts', 
    '**/lib/breach*.ts', 
    '**/api/security/**/*.ts',
    '**/*breach*.py',
    '**/*incident*.go'
  ],
  alwaysApply: false,
  legalCitations: [
    {
      law: '6698 Sayılı KVKK',
      article: 'Madde 12/5',
      description: 'Kişisel verilerin kanuni olmayan yollarla başkaları tarafından elde edilmesi halinde en geç 72 saat içinde Kurul\'a ve ilgili kişiye bildirim zorunluluğu.',
      penaltyContext: 'KVKK Md. 18/1-b uyarınca ağır idari para cezası.'
    },
    {
      law: 'KVKK Kurul İlke Kararı',
      article: '24.01.2019 - 2019/10',
      description: 'Kişisel Veri İhlali Bildirim Formu standartları ve 6 zorunlu alanın eksiksiz doldurulması.'
    }
  ],
  summary: 'Veri ihlali tespit edildiği andan itibaren 72 saatlik bildirim geri sayımını başlatın; Kurul\'un 2019/10 sayılı İlke Kararı formundaki 6 zorunlu alanı otomatik derleyin ve tüm güvenlik olaylarını şirket içi İhlal Kayıt Defterinde arşivleyin.',
  instructions: [
    'Bir veri sızıntısı veya yetkisiz erişim tespit edildiğinde `BreachNotifier.calculateCountdown` ile 72 saatlik geri sayım başlatın.',
    'Kurul\'un 2019/10 sayılı kararı gereğince formdaki 6 temel alanı (ihlal/öğrenilme tarihi, kaynağı/şekli, etkilenen veri kategorileri, yaklaşık kişi sayısı, olası sonuçlar, alınan teknik ve idari tedbirler) hazır bulundurun.',
    'Kurul bildirim eşiğinin altında kalan küçük güvenlik olayları dahi gerekçeleriyle birlikte şirket içi İhlal Kayıt Defteri\'ne (Incident Register) kaydedilmelidir.',
    'İlgili kişilere yapılacak bildirimde açık ve sade bir dil kullanın ve kullanıcıların alabileceği önlemleri (parola sıfırlama vb.) belirtin.'
  ],
  forbiddenPatterns: [
    'İhlali tespit edip Kurul\'a bildirim için 72 saati aşmak veya bildirim yapmamak',
    'Şirket içi ihlal kayıt defteri tutmamak ve güvenlik vakalarını örtbas etmek',
    'Alınan teknik tedbirler ve etkilenen kişi sayısı açıklanmadan eksik bildirim yapmak'
  ],
  compliantCodeSnippets: [
    {
      title: '72 Saatlik İhlal Takibi ve Kurul JSON Form Üretimi',
      language: 'ts',
      code: `import { BreachNotifier, InternalIncidentRegister } from '@complirules/primitives';

export function handleSecurityIncident(incidentData: any) {
  const register = new InternalIncidentRegister();
  const incident = register.recordIncident({
    title: 'Şüpheli Veri İndirme Girişimi',
    isReportable: true,
    formDetails: incidentData
  });

  const countdown = BreachNotifier.calculateCountdown(incident.discoveryTimestamp);
  console.log(\`Kalan Süre: \${countdown.remainingHours} saat \${countdown.remainingMinutes} dakika\`);

  const formJson = BreachNotifier.generateKurulFormJson({
    organizationName: 'Acme Holding',
    contactPerson: 'Veri Koruma İrtibat Kişisi',
    contactEmail: 'dpo@acme.com',
    form: incidentData
  });
  return formJson;
}`
    }
  ]
};

export const HIPAA_BREAKGLASS_RULE: RuleDefinition = {
  id: 'hipaa-breakglass-emergency',
  title: 'HIPAA 45 CFR § 164.312(a)(2)(ii) Emergency Break-Glass Protokolü & Safe Harbor',
  jurisdiction: 'HIPAA_US',
  severity: 'CRITICAL',
  globs: [
    '**/api/emergency/**/*.ts', 
    '**/services/clinical*.ts', 
    '**/lib/breakglass*.ts',
    '**/*emergency*.py',
    '**/*breakglass*.go'
  ],
  alwaysApply: false,
  legalCitations: [
    {
      law: 'HIPAA Security Rule',
      article: '45 CFR § 164.312(a)(2)(ii)',
      description: 'Emergency Access Procedure. Hayati klinik durumlarda PHI verisine anında yetkili erişim sağlama zorunluluğu.',
      penaltyContext: 'OCR yaptırımları ve klinik ihmal davaları.'
    },
    {
      law: 'HIPAA Breach Notification Rule',
      article: '45 CFR § 164.402 & § 164.408',
      description: 'Safe Harbor şifreleme muafiyeti (AES-256) ve <500 vs >=500 hasta bildirim takvimi.'
    }
  ],
  summary: 'Acil klinik durumlarda (Code Blue, Trauma STAT) personelin hasta verisine anında erişimini sağlayan Break-Glass protokolü sağlayın; zorunlu gerekçe kaydı alın, Güvenlik Yöneticisine anlık alarm gönderin, bağımsız denetim logu tutun ve oturumu 30 dakika ile sınırlayın.',
  instructions: [
    'Klinik sistemlerde hayati acil durumlarda normal erişim kontrollerini aşan `HipaaEmergencyService.activateBreakGlass` protokolü uygulayın.',
    'Zorunlu klinik gerekçe (en az 10 karakter) girilmeden acil durum kilidini açmayın.',
    'Break-Glass tetiklendiğinde Güvenlik Yöneticisine (Security/Privacy Officer) gerçek zamanlı alarm gönderin.',
    'Acil durum oturum süresini en fazla 30 dakika ile sınırlandırın ve süresi dolunca yetkileri otomatik düşürün.',
    'Tüm acil erişimleri bağımsız ve değiştirilemez bir denetim kütüğüne (Emergency Audit Log) kaydedin.',
    '45 CFR § 164.402 uyarınca AES-256 ve TLS 1.3 şifreleme sağlayarak Safe Harbor bildirim muafiyeti standartlarını koruyun.'
  ],
  forbiddenPatterns: [
    'Klinik acil durumlarda Break-Glass prosedürü sunmayıp hasta hayatını riske atmak',
    'Gerekçe girilmeksizin veya sahte gerekçelerle Break-Glass oturumu açılmasına izin vermek',
    'Break-Glass erişimlerini denetim loguna kaydetmemek veya güvenlik yöneticisine alarm göndermemek'
  ],
  compliantCodeSnippets: [
    {
      title: 'HIPAA Break-Glass Acil Durum Erişimi',
      language: 'ts',
      code: `import { HipaaEmergencyService } from '@complirules/primitives';

export async function emergencyClinicAccess(req: Request) {
  const { doctorId, patientId, reason, department } = await req.json();

  const session = HipaaEmergencyService.activateBreakGlass({
    actorId: doctorId,
    patientId,
    department,
    clinicalJustification: reason,
    emergencyType: 'CODE_BLUE'
  });

  return Response.json({ status: 'ACTIVE', session });
}`
    }
  ]
};

export const GDPR_NO_UNPROXIED_ASSETS_RULE: RuleDefinition = {
  id: 'gdpr-no-unproxied-remote-assets',
  title: 'Almanya & AB Uzak Resim Hotlink ve IP Sızıntısı Yasağı (LG München I & CJEU Breyer)',
  jurisdiction: 'GDPR_EU',
  severity: 'HIGH',
  globs: [
    '**/*.tsx', 
    '**/*.jsx', 
    '**/*.html', 
    '**/*.vue', 
    '**/*.php',
    '**/components/**/*.ts'
  ],
  alwaysApply: false,
  legalCitations: [
    {
      law: 'LG München I (3 O 17493/20) & CJEU Breyer (C-582/14)',
      article: 'IP Adreslerinin Üçüncü Taraflara Rızasız İletimi',
      description: 'Harici resimler (<img src="https://...">), Gravatar avatarları veya remote fontların doğrudan istemciye bağlanması (Hotlinking), ziyaretçi IP adresi ve Referer başlığını üçüncü taraf sunuculara sızdırır. Rıza olmaksızın veya güvenli proxy kullanılmaksızın yapılması tazminat ve idari yaptırım doğurur.',
      penaltyContext: 'Almanya mahkemelerince ziyaretçi başına 100€+ manevi tazminat, ihtiyati tedbir ve GDPR Md. 83 idari para cezaları.'
    },
    {
      law: 'General Data Protection Regulation (GDPR)',
      article: 'Article 6(1) & Article 44+',
      description: 'Hukuki dayanak olmaksızın kişisel veri (dinamik IP) işleme ve yeterlilik kararı bulunmayan üçüncü ülkelere sınır ötesi veri aktarımı yasağı.'
    }
  ],
  summary: 'Harici resimleri ve avatarları (Gravatar vb.) doğrudan istemciden çağırmayın. Kullanıcı IP adresini gizlemek için sunucu taraflı Asset Proxy kullanın.',
  instructions: [
    'ASLA harici resim ve avatarları (`<img src="https://external.com/..."/>`, Gravatar) doğrudan istemci DOM içine un-proxied olarak bağlamayın (Hotlinking yasağı).',
    'Kullanıcı veya üçüncü taraftan gelen harici görselleri sunucu taraflı güvenli bir ters vekil / önbellek (`createSecureAssetProxyUrl`) üzerinden sunarak kullanıcının gerçek IP adresini gizleyin.',
    'Asset proxy uç noktasında SSRF (Server-Side Request Forgery) koruması uygulayın; yerel ve özel ağ IPlerine (`127.0.0.1`, `192.168.*`, `10.*`) erişimi kesin olarak engelleyin.'
  ],
  forbiddenPatterns: [
    '<img src="https://gravatar.com/avatar/..." /> (Almanya LG München I ihlali)',
    '<img src="https://external-domain.com/..." /> (Un-proxied doğrudan hotlink)',
    'style={{ backgroundImage: "url(https://external...)" }} (Proxy olmadan harici CSS arka planı)'
  ],
  compliantCodeSnippets: [
    {
      title: 'Güvenli Resim Proxy Entegrasyonu (React / Next.js & @complirules/primitives)',
      language: 'tsx',
      code: `import { createSecureAssetProxyUrl } from '@complirules/primitives';

export function SafeUserAvatar({ rawAvatarUrl, userName }: { rawAvatarUrl: string; userName: string }) {
  // Kullanıcının IP adresini korumak için doğrudan Gravatar/Unsplash URL'i yerine imzalı yerel proxy kullanılır
  const safeProxyUrl = createSecureAssetProxyUrl(rawAvatarUrl, {
    proxyEndpoint: '/api/compliance/proxy-image'
  });

  return (
    <img
      src={safeProxyUrl}
      alt={userName}
      className="w-10 h-10 rounded-full object-cover"
      loading="lazy"
    />
  );
}`
    }
  ]
};

export const GDPR_TWO_CLICK_EMBED_RULE: RuleDefinition = {
  id: 'gdpr-two-click-embed',
  title: 'Harici Embed ve Sosyal Eklenti İçin İki Tıklamalı Çözüm (CJEU Fashion ID & DSK)',
  jurisdiction: 'GDPR_EU',
  severity: 'HIGH',
  globs: ['**/*.tsx', '**/*.jsx', '**/*.html', '**/*.vue', '**/*.php', '**/components/**/*.ts'],
  alwaysApply: false,
  legalCitations: [
    {
      law: 'CJEU C-40/17 Fashion ID (29.07.2019)',
      article: 'GDPR Md. 26 — Ortak Veri Sorumluluğu',
      description: 'Facebook Beğen gibi bir eklentiyi gömen site sahibi, verinin toplanması ve aktarımı aşamasında eklenti sağlayıcısıyla ortak veri sorumlusudur; eklenti yüklenirken ziyaretçi tıklamasa bile IP ve tarayıcı verisi aktarılır.',
      penaltyContext: 'Hukuki dayanak (rıza) ve aydınlatma eksikliğinde GDPR Md. 83 idari para cezaları ve Md. 82 tazminat.'
    },
    {
      law: 'Alman DSK Telemedya Rehberi / TDDDG § 25',
      article: 'Zwei-Klick-Lösung',
      description: 'YouTube, Vimeo ve Google Maps iframe\'leri (youtube-nocookie.com dahil) sayfa açılır açılmaz IP ve Referer bilgisini iletir. Kullanıcı etkinleştirmeden önce harici sunucuya hiçbir istek atılmamalıdır.'
    },
    {
      law: 'CJEU C-300/21 Österreichische Post (04.05.2023)',
      article: 'GDPR Md. 82',
      description: 'Manevi tazminat için asgari ciddiyet eşiği aranmaz; bu nedenle tek bir rızasız harici istek bile toplu dava ve ihtar (Abmahnung) riski doğurur.'
    }
  ],
  summary: 'YouTube/Vimeo/Maps iframe ve sosyal eklenti scriptlerini kullanıcı açıkça tıklamadan yüklemeyin. Yerel önizleme görseli ve aydınlatma metni gösterin.',
  instructions: [
    'Harici iframe ve widget scriptlerini sayfa render edilirken DOM\'a eklemeyin; yerel önizleme görseli (same-origin) ve aydınlatma metni gösterin.',
    'Kullanıcı açık bir eylemde bulunduktan sonra (tıklama, Enter, Space) `createTwoClickEmbed` / `activateTwoClickEmbed` ile iframe\'i yükleyin; `referrerpolicy="no-referrer"` ve `sandbox` ekleyin.',
    'Önizleme görselini harici sağlayıcıdan (i.ytimg.com vb.) çekmeyin; derleme zamanında yerel olarak üretip barındırın.',
    'Sosyal paylaşım için istemci SDK yerine statik paylaşım bağlantıları (Shariff deseni) tercih edin.',
    'Etkinleştirme kontrolü klavye ile erişilebilir olmalıdır (gerçek `button` elemanı, görünür odak halkası).'
  ],
  forbiddenPatterns: [
    '<iframe src="https://www.youtube.com/embed/..."> (Rızasız doğrudan embed)',
    '<iframe src="https://www.youtube-nocookie.com/embed/..."> (Gizlilik modu da IP sızdırır)',
    '<iframe src="https://www.google.com/maps/embed?..."> (Rızasız harita)',
    '<script src="https://connect.facebook.net/.../sdk.js"> (Fashion ID ortak sorumluluk)',
    '<img src="https://i.ytimg.com/vi/.../hqdefault.jpg"> (Harici önizleme görseli)'
  ],
  compliantCodeSnippets: [
    {
      title: 'İki Tıklamalı YouTube Embed (React & @complirules/primitives)',
      language: 'tsx',
      code: `import { useState } from 'react';
import { createTwoClickEmbed, activateTwoClickEmbed } from '@complirules/primitives';

export function SafeVideo({ videoId }: { videoId: string }) {
  const embed = createTwoClickEmbed('https://www.youtube-nocookie.com/embed/' + videoId, {
    localThumbnailPath: '/thumbs/' + videoId + '.webp',
    title: 'Tanıtım videosu'
  });
  const [active, setActive] = useState(false);

  if (!active) {
    return (
      <div>
        <img src={embed.localThumbnailPath} alt={embed.title} width={640} height={360} />
        <p>{embed.disclosureText}</p>
        <button type="button" onClick={() => setActive(true)}>Videoyu yükle</button>
      </div>
    );
  }
  const attrs = activateTwoClickEmbed(embed, true);
  return <iframe {...attrs} width={640} height={360} />;
}`
    }
  ]
};

export const GDPR_PRIVACY_CAPTCHA_RULE: RuleDefinition = {
  id: 'gdpr-privacy-preserving-captcha',
  title: 'Gizlilik Dostu Bot Koruması: reCAPTCHA Ön Rıza Şartı (CNIL Cityscoot)',
  jurisdiction: 'GDPR_EU',
  severity: 'HIGH',
  globs: ['**/*.tsx', '**/*.jsx', '**/*.html', '**/*.vue', '**/*.php'],
  alwaysApply: false,
  legalCitations: [
    {
      law: 'CNIL Karar SAN-2023-003 Cityscoot (16.03.2023)',
      article: 'ePrivacy Md. 5(3) / Fransız Veri Koruma Kanunu Md. 82',
      description: 'reCAPTCHA terminal cihazdan bilgi okur/yazar ve telemetri Google\'a akar; "kesinlikle gerekli" muafiyeti kapsamında sayılmadığı için ön rıza gerekir. Aynı kararda aşırı konum takibi (Md. 5/1-c) ve alt işleyen sözleşmeleri (Md. 28) de ihlal sayılmıştır.'
    },
    {
      law: 'CJEU C-252/21 Meta v. Bundeskartellamt (04.07.2023)',
      article: 'GDPR Md. 6(1)',
      description: 'Üçüncü taraf izleme, sözleşme (6/1-b) veya meşru menfaat (6/1-f) ile haklı gösterilemez; rıza gerekir.'
    }
  ],
  summary: 'Bot korumasında Google reCAPTCHA\'yı rıza olmadan yüklemeyin. Telemetri göndermeyen Proof-of-Work çözümü (Altcha, mCaptcha) veya çerezsiz alternatif kullanın.',
  instructions: [
    'Giriş/kayıt/iletişim formlarına reCAPTCHA scriptini rıza verilmeden yüklemeyin.',
    'Öncelik: kendi sunucunuzda doğrulanan Proof-of-Work captcha (Altcha, mCaptcha) veya rate limit + honeypot.',
    'Google reCAPTCHA zorunluysa yüklemeyi CMP "işlevsel/güvenlik" rızasına bağlayın ve rıza yoksa alternatif doğrulama (e-posta OTP) sunun.',
    'Bot korumasını hizmete erişimin şartı yapıp rızayı zorunlu kılmayın (bağlı rıza yasağı).'
  ],
  forbiddenPatterns: [
    '<script src="https://www.google.com/recaptcha/api.js"> (Rızasız yükleme)',
    '<div class="g-recaptcha" data-sitekey="..."> (Gating olmadan)',
    'import ReCAPTCHA from "react-google-recaptcha" (Rıza kontrolü olmadan render)'
  ],
  compliantCodeSnippets: [
    {
      title: 'Rıza Kontrollü Captcha Yükleme',
      language: 'tsx',
      code: `import { CookieConsentManager } from '@complirules/primitives';

export function Captcha({ prefs }: { prefs: Parameters<typeof CookieConsentManager.isCategoryAllowed>[0] }) {
  // Rıza yoksa telemetri göndermeyen, yerel Proof-of-Work doğrulamasına düşülür
  if (!CookieConsentManager.isCategoryAllowed(prefs, 'functional')) {
    return <ProofOfWorkChallenge endpoint="/api/pow-challenge" />;
  }
  return <ThirdPartyCaptcha />;
}`
    }
  ]
};

export const KVKK_EMAIL_BCC_RULE: RuleDefinition = {
  id: 'kvkk-email-bcc-safety',
  title: 'Toplu E-postada Alıcı Adresi İfşası Yasağı (KVKK Md. 12) ve Takip Pikseli Rızası',
  jurisdiction: 'KVKK_TR',
  severity: 'HIGH',
  globs: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.py', '**/*.php', '**/mail*/**/*', '**/emails/**/*'],
  alwaysApply: false,
  legalCitations: [
    {
      law: '6698 Sayılı KVKK',
      article: 'Madde 12(1)',
      description: 'Veri sorumlusu, kişisel verilerin hukuka aykırı erişimini önlemek için gerekli her türlü teknik ve idari tedbiri almak zorundadır. E-posta adreslerini toplu iletide `to`/`cc` alanında açık bırakmak yetkisiz ifşadır.',
      penaltyContext: 'KVKK Md. 18/1-b uyarınca veri güvenliği yükümlülüğünü yerine getirmeme idari para cezası.'
    },
    {
      law: 'ePrivacy Direktifi / CNIL (14.04.2026 tavsiyesi, uyum süresi 14.07.2026)',
      article: 'Md. 5(3)',
      description: 'E-postadaki 1x1 takip pikselleri bireysel açılma takibi yapar ve ayrı ön rıza gerektirir. İtalyan Garante da rıza şartı aramaktadır.'
    }
  ],
  summary: 'Birden fazla alıcıyı asla `to`/`cc` alanına koymayın; alıcı başına ayrı zarf veya `bcc` kullanın. Rızasız takip pikseli eklemeyin.',
  instructions: [
    'Birden fazla alıcıya giden iletilerde her alıcıya ayrı gönderim yapın (`buildSafeBulkEnvelopes`) veya alıcıları `bcc` alanına koyun.',
    'Gönderimden önce `validateBulkEmailOptions` ile doğrulayın; ihlal varsa göndermeyi reddedin.',
    'Bülten ve işlemsel e-postalarda varsayılan olarak açılma takibi (1x1 piksel) kapalı olsun; yalnızca ayrı açık rıza varsa açın (`stripTrackingBeacons`).',
    'Posta sağlayıcısı yurt dışındaysa KVKK Md. 9 aktarım şartlarını (SCC bildirimi) ayrıca sağlayın.'
  ],
  forbiddenPatterns: [
    'transporter.sendMail({ to: ["a@x.com", "b@x.com"] }) (Alıcılar birbirini görür)',
    'resend.emails.send({ cc: recipients }) (Toplu alıcı cc alanında)',
    'msg["To"] = ", ".join(recipients) (Python toplu To)',
    '<img src="https://track.example.com/open?uid=..." width="1" height="1"> (Rızasız açılma pikseli)'
  ],
  compliantCodeSnippets: [
    {
      title: 'Alıcı Başına Ayrı Zarf (Node.js)',
      language: 'ts',
      code: `import { buildSafeBulkEnvelopes, validateBulkEmailOptions, stripTrackingBeacons } from '@complirules/primitives';

const envelopes = buildSafeBulkEnvelopes(recipients, {
  from: 'duyuru@sirket.com',
  subject: 'Güvenlik politikası güncellemesi',
  html: stripTrackingBeacons(html)
});

for (const envelope of envelopes) {
  const check = validateBulkEmailOptions(envelope);
  if (!check.compliant) throw new Error(check.violations[0].message);
  await transporter.sendMail(envelope); // Her alıcı yalnızca kendi adresini görür
}`
    }
  ]
};

export const KVKK_OTP_DECOUPLING_RULE: RuleDefinition = {
  id: 'kvkk-otp-marketing-decoupling',
  title: 'SMS/OTP Doğrulaması ile Pazarlama ve Veri İşleme Rızasının Ayrıştırılması (2025/1072)',
  jurisdiction: 'KVKK_TR',
  severity: 'CRITICAL',
  globs: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.py', '**/*.php', '**/api/**/*', '**/auth/**/*'],
  alwaysApply: false,
  legalCitations: [
    {
      law: 'KVKK Kurulu 10.06.2025 tarihli ve 2025/1072 sayılı İlke Kararı (RG 26.06.2025, 32938)',
      article: 'SMS ile Doğrulama Kodu Uygulamaları',
      description: 'Tek bir SMS doğrulama koduyla üyelik sözleşmesi, ticari elektronik ileti izni ve kişisel veri işleme izninin birlikte alınması yasaktır. Kodun amacı SMS ve görevli tarafından açıkça belirtilmeli; kod verilmese de hizmet sunulmalıdır.',
      penaltyContext: 'Geçersiz rıza ile veri işleme (KVKK Md. 5, 18) ve ETK Md. 12 idari para cezaları.'
    },
    {
      law: 'KVKK Kurulu 2020/173 (Amazon Türkiye)',
      article: 'Açık Rıza — Kullanım Şartları Onayı',
      description: 'Siteyi ziyaret etmek veya kullanım şartlarını kabul etmek ticari ileti için geçerli açık rıza yerine geçmez.'
    },
    {
      law: '6563 Sayılı ETK',
      article: 'Madde 6',
      description: 'Ticari elektronik iletinin önceden onay alınarak gönderilmesi ve İYS kaydı.'
    }
  ],
  summary: 'OTP doğrulama uç noktası yalnızca doğrulama yapar. Pazarlama/ETK/veri işleme rızasını aynı eylemle set etmeyin; SMS metni amacı açıkça yazsın.',
  instructions: [
    'OTP doğrulama handler\'ı yalnızca `phoneVerified` benzeri doğrulama alanlarını güncelleyebilir.',
    'OTP doğrulama kodu ile `marketingConsent`, `etkConsent`, `dataProcessingConsent` alanlarını ASLA `true` yapmayın; `assertOtpEffectsAreSeparated` kullanın.',
    'SMS metni kodun yalnızca belirli bir amaç için olduğunu ve pazarlama izni anlamına gelmediğini açıkça belirtsin (`buildOtpSmsText`).',
    'Pazarlama rızası ayrı, işaretsiz, isteğe bağlı bir kutu ile alınsın ve `consent-store` ile versiyonlu kaydedilsin.',
    'Kod girilmediğinde veya rıza verilmediğinde ana hizmet sunulmaya devam etsin.'
  ],
  forbiddenPatterns: [
    'user.update({ phoneVerified: true, marketingConsent: true }) (OTP ile rıza bundling)',
    'SMS: "Kodu paylaşarak kampanya iletilerini kabul etmiş olursunuz" (Örtülü rıza)',
    'Kasada OTP girilmeden ödeme/üyelik tamamlanmaması ve OTP\'nin pazarlama izni saymak'
  ],
  compliantCodeSnippets: [
    {
      title: 'OTP Doğrulama ve Rızanın Ayrı Yönetimi',
      language: 'ts',
      code: `import { assertOtpEffectsAreSeparated, buildOtpSmsText } from '@complirules/primitives';

app.post('/api/auth/verify-otp', async (req, res) => {
  const { userId, code } = req.body;
  if (!(await verifyCode(userId, code))) return res.status(400).end();

  const effects = { phoneVerified: true }; // Rıza alanları bilinçli olarak yok
  assertOtpEffectsAreSeparated(effects);
  await db.user.update({ where: { id: userId }, data: effects });
  res.status(204).end();
});

const sms = buildOtpSmsText('phone_verification', code, 'Marka');`
    }
  ]
};

export const SEC_AUTH_RATE_LIMIT_RULE: RuleDefinition = {
  id: 'sec-auth-rate-limit-mfa',
  title: 'Giriş Uç Noktalarında Rate Limit, Hesap Kilitleme ve MFA (KVKK Md. 12 / GDPR Md. 32)',
  jurisdiction: 'GLOBAL_SEC',
  severity: 'HIGH',
  globs: ['**/api/**/login*', '**/api/**/auth/**', '**/auth/**/*.ts', '**/routes/auth*', '**/controllers/auth*'],
  alwaysApply: false,
  legalCitations: [
    {
      law: '6698 Sayılı KVKK',
      article: 'Madde 12(1)',
      description: 'Teknolojinin ulaştığı seviyeye uygun teknik tedbir yükümlülüğü. Brute-force ve credential-stuffing ile hesap ele geçirilmesinde rate limit, hesap kilitleme ve çok faktörlü doğrulama eksikliği veri sorumlusunun kusuru sayılır.'
    },
    {
      law: 'GDPR',
      article: 'Madde 32',
      description: 'Risk düzeyine uygun güvenlik: kimlik doğrulama saldırılarına karşı teknik önlemler.'
    }
  ],
  summary: 'Her giriş uç noktasında IP ve hesap bazlı rate limit, kademeli kilitleme ve hassas hesaplarda MFA uygulayın. Hesap var/yok bilgisini sızdırmayın.',
  instructions: [
    'Giriş, parola sıfırlama ve OTP doğrulama uç noktalarını IP ve hesap anahtarı bazında ayrı ayrı sınırlayın (`RateLimitShield`).',
    'Eşik aşıldığında hesabı geçici kilitleyin ve MFA\'yı zorunlu kılın; başarılı girişte sayaçları sıfırlayın.',
    'Yönetici ve sağlık/finans verisine erişen hesaplarda MFA zorunlu olsun.',
    'Hata mesajları hesap varlığını ifşa etmesin ("E-posta veya parola hatalı"); başarısız denemeleri redakte edilmiş şekilde loglayın.',
    'Parolaları bcrypt (maliyet ≥ 10) ile saklayın; sızdırılmış parola listelerine karşı kontrol uygulayın.'
  ],
  forbiddenPatterns: [
    'app.post("/login", ...) içinde rate limit/lockout olmaması (Sınırsız parola denemesi)',
    'return res.status(404).send("Kullanıcı bulunamadı") (Hesap numaralandırma)',
    'Yönetici paneli için MFA zorunluluğunun bulunmaması'
  ],
  compliantCodeSnippets: [
    {
      title: 'Rate Limit + Kilitleme (Express)',
      language: 'ts',
      code: `import { RateLimitShield } from '@complirules/primitives';

const shield = new RateLimitShield({ maxAttempts: 5, windowMs: 15 * 60_000, lockoutMs: 15 * 60_000 });

app.post('/api/login', async (req, res) => {
  const keys = ['ip:' + req.ip, 'acct:' + String(req.body.email).toLowerCase()];
  for (const key of keys) {
    const decision = shield.check(key);
    if (!decision.allowed) return res.status(429).set('Retry-After', String(Math.ceil(decision.retryAfterMs / 1000))).end();
  }

  const user = await authenticate(req.body.email, req.body.password);
  if (!user) {
    keys.forEach(k => shield.recordFailure(k));
    return res.status(401).send('E-posta veya parola hatalı');
  }
  keys.forEach(k => shield.recordSuccess(k));
  return issueSession(user);
});`
    }
  ]
};

export const HIPAA_FTC_SENSITIVE_PIXEL_RULE: RuleDefinition = {
  id: 'hipaa-ftc-sensitive-route-pixel',
  title: 'Sağlık, Checkout ve Çocuk Sayfalarında Ticari Piksel Yasağı (FTC GoodRx/BetterHelp, HIPAA, COPPA)',
  jurisdiction: 'HIPAA_US',
  severity: 'CRITICAL',
  globs: ['**/health/**', '**/patient*/**', '**/therapy/**', '**/conditions/**', '**/symptoms/**', '**/rx/**', '**/checkout/**', '**/kids/**', '**/*.tsx', '**/*.jsx'],
  alwaysApply: false,
  legalCitations: [
    {
      law: 'FTC v. GoodRx Holdings (2023)',
      article: 'FTC Act Sec. 5 & Health Breach Notification Rule (16 CFR Part 318)',
      description: 'İlaç ve sağlık bilgisinin Meta ve Google reklam sistemlerine pikselle aktarılması; HBNR kapsamındaki ilk yaptırım.',
      penaltyContext: '1,5 milyon $ sivil ceza ve sağlık verisini reklam amaçlı paylaşma yasağı.'
    },
    {
      law: 'FTC v. BetterHelp (2023) & FTC v. Flo Health (2021)',
      article: 'FTC Act Sec. 5',
      description: 'Terapi anketi yanıtları ve e-posta/IP\'nin reklam ağlarıyla paylaşılması aldatıcı ve haksız uygulamadır.',
      penaltyContext: 'BetterHelp: 7,8 milyon $ tüketici iadesi.'
    },
    {
      law: 'HIPAA 45 CFR § 164.502 / § 164.308(b) & AHA v. Becerra (N.D. Tex., 20.06.2024)',
      article: 'İzleme teknolojileri',
      description: 'Kimliği doğrulanmış hasta portallarında izleme teknolojileri BAA gerektirir. Mahkeme HHS bülteninin kimliksiz genel sayfa kısmını iptal etmiştir; ancak FTC yetkisi ve portal kuralları sürmektedir, bu yüzden koruma muhafazakâr tutulur.'
    },
    {
      law: 'COPPA — 15 U.S.C. §§ 6501-6506, 16 CFR Part 312 (FTC v. Epic Games, 2022)',
      article: 'Kalıcı tanımlayıcılar',
      description: '13 yaş altı çocuklara yönelik hizmetlerde doğrulanabilir ebeveyn izni olmadan IP, cihaz ve çerez kimliği toplamak yasaktır.',
      penaltyContext: 'Epic Games: COPPA için 275 milyon $ ceza.'
    }
  ],
  summary: 'Sağlık, reçete, terapi, semptom, checkout ve çocuk rotalarında Meta/TikTok/Google Ads/Snap piksellerini kullanmayın. Ölçümleme için kimliksiz, kendi barındırdığınız analitik kullanın.',
  instructions: [
    'Sağlık/terapi/semptom/reçete/hasta portalı, checkout ve çocuk rotalarına ticari reklam pikseli veya retargeting etiketi eklemeyin; rıza bu rotalarda tek başına yeterli sayılmaz.',
    'Rota bazlı bir korumayı merkezi olarak uygulayın (`shouldBlockCommercialTracking`) ve etiket yöneticisi yapılandırmasında bu rotaları hariç tutun.',
    'Sağlık verisi (durum, ilaç, semptom) URL parametresi, olay adı veya özellik olarak üçüncü tarafa gönderilmesin.',
    'Çocuklara yönelik oturumlarda tüm analitiği ve kalıcı tanımlayıcıyı kapatın; sohbeti varsayılan kapalı başlatın.',
    'Piksel sağlayıcısıyla BAA yoksa sağlık verisi akışına dahil etmeyin; ihlal şüphesinde HBNR bildirim sürelerini işletin.'
  ],
  forbiddenPatterns: [
    'fbq("track", "ViewContent", { content_name: condition }) (Sağlık sayfasında Meta Pixel)',
    '<script src="https://www.googletagmanager.com/..."> app/therapy/layout.tsx içinde',
    'ttq.track("Checkout", { ... }) (Checkout\'ta TikTok Pixel)',
    'mixpanel.identify(getHardwareFingerprint()) (Çocuk sayfasında cihaz parmak izi)'
  ],
  compliantCodeSnippets: [
    {
      title: 'Rota Bazlı İzleme Engeli',
      language: 'ts',
      code: `import { shouldBlockCommercialTracking } from '@complirules/primitives';

export function loadTracker(pathname: string, provider: 'meta-pixel' | 'google-ads') {
  const decision = shouldBlockCommercialTracking(pathname, provider);
  if (decision.blocked) {
    console.warn(decision.reason); // Hassas rotada yükleme yapılmaz
    return;
  }
  // Hassas olmayan sayfalarda ve rıza varsa yükleme
}`
    }
  ]
};

export const CCPA_GPC_RULE: RuleDefinition = {
  id: 'ccpa-gpc-automated-optout',
  title: 'Global Privacy Control (Sec-GPC) Otomatik Opt-out (CCPA/CPRA § 7025)',
  jurisdiction: 'CCPA_US',
  severity: 'HIGH',
  globs: ['**/*.ts', '**/*.tsx', '**/*.js', '**/middleware.*', '**/components/cookie*.tsx', '**/components/cmp*.tsx'],
  alwaysApply: false,
  legalCitations: [
    {
      law: 'California Code of Regulations, Title 11',
      article: '§ 7025 (opt-out preference signals)',
      description: '`Sec-GPC: 1` başlığı veya `navigator.globalPrivacyControl` sinyali kişisel verinin satışı/paylaşımı için bağlayıcı opt-out talebidir. Oturum açmış kullanıcıda sinyal kullanıcının profiline işlenir; hesap tercihiyle çelişirse işletme ancak kullanıcıyı bilgilendirip onayını alarak devam edebilir.',
      penaltyContext: 'California AG v. Sephora (2022): 1,2 milyon $; DoorDash (2024): 375.000 $.'
    },
    {
      law: 'Colorado Privacy Act',
      article: '4 CCR 904-3, Rule 5.11',
      description: 'Colorado da evrensel opt-out mekanizmalarını tanımayı zorunlu kılar.'
    }
  ],
  summary: 'Sunucuda `Sec-GPC: 1` ve istemcide `navigator.globalPrivacyControl` sinyalini okuyun; aktifse reklam/paylaşım çerezlerini ve piksellerini kapatın, oturum açmış kullanıcıda profile yazın.',
  instructions: [
    'Her istekte `Sec-GPC` başlığını değerlendirin (`evaluateGpcSignal`); değer tam olarak `1` ise opt-out aktiftir.',
    'GPC aktifken pazarlama/hedefli reklam kategorisini kapatın (`applyGpcToPreferences`) ve üçüncü taraf reklam piksellerini yüklemeyin.',
    'Kullanıcı oturum açmışsa `ccpaOptedOut: true` değerini profile kaydedin; GPC\'yi hesap tercihine tercih ederek yok saymayın.',
    'GPC\'yi yok sayacak bir "yeniden izin ver" akışı gerekiyorsa kullanıcıyı açıkça bilgilendirip onay alın.',
    'Opt-out sonrasında üçüncü taraflara veri akışının gerçekten durduğunu ağ günlüğüyle doğrulayın.'
  ],
  forbiddenPatterns: [
    'if (getCookie("consent") !== "false") loadAdTrackers() (GPC denetimi yok)',
    'Sec-GPC başlığını loglayıp işlememek',
    'GPC sinyaline rağmen reklam çerezi set etmek'
  ],
  compliantCodeSnippets: [
    {
      title: 'Sunucu Tarafı GPC Değerlendirmesi (Next.js Middleware)',
      language: 'ts',
      code: `import { evaluateGpcSignal, applyGpcToPreferences, CookieConsentManager } from '@complirules/primitives';

export function middleware(req: Request) {
  const gpc = evaluateGpcSignal(req.headers, { isAuthenticated: Boolean(getSession(req)) });
  const prefs = applyGpcToPreferences(readPreferences(req) ?? CookieConsentManager.createDefaultPreferences(), gpc);

  if (gpc.shouldPersistToProfile) {
    void saveProfile(getSession(req)!.userId, { ccpaOptedOut: true });
  }
  if (!CookieConsentManager.isCategoryAllowed(prefs, 'marketing')) {
    // Reklam piksellerini yükleme
  }
}`
    }
  ]
};

export const ALL_RULES: RuleDefinition[] = [
  KVKK_RETENTION_RULE,
  KVKK_UI_CONSENT_RULE,
  KVKK_DSR_TICKETING_RULE,
  KVKK_COOKIE_CMP_RULE,
  KVKK_TRANSFER_GEOFENCING_RULE,
  KVKK_BREACH_NOTIFICATION_RULE,
  KVKK_EMAIL_BCC_RULE,
  KVKK_OTP_DECOUPLING_RULE,
  GDPR_RIGHT_TO_ERASURE_RULE,
  GDPR_NO_UNPROXIED_ASSETS_RULE,
  GDPR_TWO_CLICK_EMBED_RULE,
  GDPR_PRIVACY_CAPTCHA_RULE,
  EAA_ACCESSIBILITY_RULE,
  HIPAA_TECHNICAL_SAFEGUARDS_RULE,
  HIPAA_BREAKGLASS_RULE,
  HIPAA_FTC_SENSITIVE_PIXEL_RULE,
  CCPA_GPC_RULE,
  AI_ACT_TRANSPARENCY_RULE,
  SEC_AUTH_RATE_LIMIT_RULE,
  PII_LOGGER_GUARD_RULE
];

export const RULE_PACKS: RulePack[] = [
  {
    id: 'tr-compliance',
    name: 'Türkiye Yasal Uyumluluk Paketi (KVKK, ETK, VUK, 5651)',
    jurisdiction: 'KVKK_TR',
    description: '6698 Sayılı KVKK, 6563 Sayılı ETK/İYS ve 213 Sayılı VUK için mimari ve arayüz kural seti; toplu e-posta BCC, OTP ayrıştırma ve brute-force koruması dahil.',
    version: '1.1.0',
    rules: [
      KVKK_RETENTION_RULE, 
      KVKK_UI_CONSENT_RULE, 
      KVKK_DSR_TICKETING_RULE,
      KVKK_COOKIE_CMP_RULE,
      KVKK_TRANSFER_GEOFENCING_RULE,
      KVKK_BREACH_NOTIFICATION_RULE,
      KVKK_EMAIL_BCC_RULE,
      KVKK_OTP_DECOUPLING_RULE,
      SEC_AUTH_RATE_LIMIT_RULE,
      PII_LOGGER_GUARD_RULE
    ]
  },
  {
    id: 'eu-compliance',
    name: 'Avrupa Birliği Uyumluluk Paketi (GDPR, EAA 2025, AI Act)',
    jurisdiction: 'GDPR_EU',
    description: 'GDPR Unutulma Hakkı, Almanya/AB Hotlink IP sızıntısı yasağı, iki tıklamalı embed, reCAPTCHA, EAA 2025/WCAG 2.1 AA erişilebilirlik ve EU AI Act şeffaflık kuralları.',
    version: '1.1.0',
    rules: [
      GDPR_RIGHT_TO_ERASURE_RULE, 
      GDPR_NO_UNPROXIED_ASSETS_RULE,
      GDPR_TWO_CLICK_EMBED_RULE,
      GDPR_PRIVACY_CAPTCHA_RULE,
      EAA_ACCESSIBILITY_RULE, 
      AI_ACT_TRANSPARENCY_RULE, 
      SEC_AUTH_RATE_LIMIT_RULE,
      PII_LOGGER_GUARD_RULE
    ]
  },
  {
    id: 'us-health-compliance',
    name: 'ABD Sağlık ve Gizlilik Paketi (HIPAA, FTC)',
    jurisdiction: 'HIPAA_US',
    description: 'HIPAA 45 CFR § 164.312 teknik güvenceleri, PHI izolasyonu, immutable audit trail ve FTC sağlık piksel yasağı kuralları.',
    version: '1.1.0',
    rules: [HIPAA_TECHNICAL_SAFEGUARDS_RULE, HIPAA_BREAKGLASS_RULE, HIPAA_FTC_SENSITIVE_PIXEL_RULE, PII_LOGGER_GUARD_RULE]
  },
  {
    id: 'us-privacy-compliance',
    name: 'ABD Eyalet Gizlilik Paketi (CCPA/CPRA, GPC)',
    jurisdiction: 'CCPA_US',
    description: 'California CCPA/CPRA Global Privacy Control otomatik opt-out ve hassas rota piksel yasağı kuralları.',
    version: '1.0.0',
    rules: [CCPA_GPC_RULE, HIPAA_FTC_SENSITIVE_PIXEL_RULE]
  }
];

