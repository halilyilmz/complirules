import { RuleDefinition, RulePack } from './types.js';

export const KVKK_RETENTION_RULE: RuleDefinition = {
  id: 'kvkk-retention-tombstone',
  title: "KVKK & Tax Procedure Code Data Retention and Tombstone Anonymization Standard",
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
  summary: "Never delete financial/invoice records when a user account is deleted (prohibition of onDelete: Cascade). Anonymize personal identity data via Tombstone / Crypto-shredding. Mask PII in cross-border LLM API calls and isolate sensitive data with envelope encryption.",
  instructions: [
    "NEVER configure `onDelete: Cascade` (Django: `models.CASCADE`, Laravel: `cascadeOnDelete()`) between User models and Financial/Invoice/Order models.",
    "When handling a user deletion or Right to be Forgotten request, anonymize personal fields (name, email, phone, national ID) deterministically rather than executing a hard SQL DROP.",
    "Maintain `isAnonymized: Boolean` and `anonymizedAt: DateTime?` columns on the User model.",
    "Establish a `RetentionPolicy` and an `AuditLog` table to document deletion and anonymization actions.",
    "Never transmit unmasked national IDs or direct personal data to overseas LLM or cloud APIs (OpenAI, Anthropic, Resend, AWS US-East); apply local pseudonymization filters (KVKK Art. 9).",
    "Never store special category personal data (health, biometric, criminal records) in plaintext in the User table; use Envelope Encryption (DEK & KEK) (KVKK Art. 6).",
    "Add VERBİS process mapping annotations above sensitive schema columns (`/// @compliance: KVKK_ART5_2C | Retention: 10Y`)."
  ],
  forbiddenPatterns: [
    "onDelete: Cascade / models.CASCADE / cascadeOnDelete() between User and Invoice/Payment models",
    "Setting deletedAt: DateTime? while leaving unmasked personal name and email in the database",
    "Hard deleting user records via prisma.user.delete({ where: { id } }) or user.delete() without tombstoning financial records",
    "openai.chat.completions.create({ messages: [{ content: userTcknAndEmail }] }) (Unlawful cross-border transfer under KVKK Art. 9)",
    "model User { healthHistory String } (Storing special category personal data in plaintext)"
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
  title: "KVKK & Commercial Electronic Communication (ETK) Granular Consent and Pre-ticked Box Prohibition",
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
  summary: "Never bundle privacy policy acknowledgment with commercial electronic message consent. All consent checkboxes must be separate, explicit, and unchecked by default.",
  instructions: [
    "Separate Privacy Policy / Terms acknowledgment from Commercial Marketing (ETK / İYS) consent into two distinct checkboxes.",
    "All consent checkboxes MUST be unchecked by default (`defaultChecked={false}`); pre-ticked checkboxes are strictly prohibited (Board Decision 2019/09).",
    "Service access (registration, purchase, newsletter) MUST NOT be conditioned upon granting commercial communication consent (Prohibition of Bundled Consent / KVKK Art. 5).",
    "Record explicit audit metadata for every consent granted: timestamp, consent version, IP address, and acceptance state in a `UserConsent` model.",
    "Provide an accessible opt-out mechanism within user settings allowing one-click withdrawal of consent at any time (KVKK Art. 11)."
  ],
  forbiddenPatterns: [
    "<input type=\"checkbox\" defaultChecked={true} /> on any consent or marketing checkbox",
    "Bundling privacy policy and marketing consent into a single unified checkbox",
    "Disabling the signup submit button until the user agrees to marketing emails",
    "Sending promotional emails or SMS without an explicit opt-in timestamp logged in the database"
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
  title: "GDPR Article 17 Right to Erasure (Right to be Forgotten) & Downstream Purge Pipeline",
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
  summary: "Upon receipt of an erasure request, purge user personal data across internal databases and trigger downstream revocation webhooks to third-party processors (Stripe, Resend, Segment).",
  instructions: [
    "Execute a deterministic data eradication pipeline upon confirmed erasure requests.",
    "Dispatch asynchronous webhook notifications to all integrated third-party processors (Stripe, CRM, Email services) to ensure downstream erasure.",
    "Retain anonymized tombstone identifiers where necessary to prevent account recreation and maintain statutory tax records.",
    "Log cryptographic erasure verification tokens to prove compliance to data protection authorities."
  ],
  forbiddenPatterns: [
    "Setting a soft-delete `deletedAt` timestamp while leaving plaintext user data indefinitely accessible in active tables",
    "Failing to propagate user erasure requests to integrated third-party SaaS vendors and sub-processors",
    "Deleting tax invoices or accounting records before the expiration of statutory commercial retention obligations"
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
  title: "European Accessibility Act (EAA 2025) & EN 301 549 / WCAG 2.1 AA UI Standards",
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
  summary: "Enforce visible keyboard focus indicators (:focus-visible), screen reader accessible names (aria-label), minimum 44px mobile touch targets, and 4.5:1 text color contrast across all interactive components.",
  instructions: [
    "Maintain clear, high-contrast keyboard focus indicators (`:focus-visible`); NEVER set `outline: none` without a visible replacement.",
    "Provide explicit accessible names (`aria-label` or `<span className=\"sr-only\">`) on all icon-only buttons and interactive controls.",
    "Ensure all interactive touch targets meet or exceed 44x44 CSS pixels on mobile viewports.",
    "Verify that normal text color contrast meets or exceeds 4.5:1 against its background (3:1 for large text).",
    "Support full keyboard navigation (Tab, Enter, Space, Escape) and prevent focus traps in dialogs and modals."
  ],
  forbiddenPatterns: [
    "outline: none or outline: 0 without visible focus-visible indicators",
    "<button><svg ... /></button> icon buttons lacking text labels or aria-label attributes",
    "Interactive buttons or touch targets smaller than 44px on mobile viewports",
    "Color contrast ratios falling below 4.5:1 for standard body text"
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
  title: "HIPAA Security Rule (45 CFR § 164.312) PHI Technical Safeguards & Immutable Audit Trails",
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
  summary: "Isolate Protected Health Information (PHI) in dedicated encrypted schemas, enforce automatic 15-minute inactivity session timeouts, maintain immutable audit trails, and restrict queries to the minimum necessary standard.",
  instructions: [
    "Isolate all Protected Health Information (PHI) within dedicated, encrypted database schemas (Encryption at Rest with AES-256).",
    "Enforce an automatic session timeout of 15 minutes of user inactivity across all clinical and healthcare portals.",
    "Maintain append-only, immutable audit trails capturing user ID, timestamp, patient ID, and accessed fields for every PHI read/write operation.",
    "Apply the \"Minimum Necessary Standard\" by selecting only necessary projection fields (`select: { id: true, diagnosis: true }`) instead of wildcard `SELECT *`."
  ],
  forbiddenPatterns: [
    "Storing medical diagnoses, prescriptions, or clinical notes in unencrypted generic User tables",
    "Configuring session timeouts exceeding 15 minutes of inactivity on healthcare applications",
    "Executing un-audited `SELECT * FROM MedicalRecords` queries exposing unnecessary patient identifiers",
    "Modifying or deleting historical audit log entries (Audit trails must be write-once, append-only)"
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
  title: "EU AI Act (Regulation 2024/1689) Article 50 Transparency & Synthetic Watermarking Standard",
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
  summary: "Affix prominent visual AI transparency badges to automated interactions, embed cryptographic C2PA watermarks into synthetic media, and provide human-in-the-loop escalation paths for high-impact automated classifications.",
  instructions: [
    "Affix clear, prominent visual disclosure badges indicating that users are interacting with an artificial intelligence system (Article 50(1)).",
    "Embed machine-readable, cryptographic provenance watermarks (C2PA / IPTC standard) into all generated synthetic images, audio, and video (Article 50(2)).",
    "Establish human-in-the-loop escalation mechanisms (`evaluateAiDecisionWithOversight`) for high-impact automated scoring or classification decisions (Article 14).",
    "Provide users with clear opt-out or human review contestation mechanisms for AI-generated determinations."
  ],
  forbiddenPatterns: [
    "Deploying customer-facing AI chat agents without explicit disclosure that the system is an automated AI assistant",
    "Publishing synthetic deepfake media or generative images without machine-readable provenance metadata",
    "Executing fully autonomous, irrevocable high-impact decisions (credit, employment, health) without human review capabilities"
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
  title: "AppSec & DevSecOps Log Sanitization and PII/PHI Scrubber Standard",
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
  summary: "Never log raw request objects, credentials, tokens, national IDs, or health data to telemetry servers (Datadog, CloudWatch, Sentry). Use an automated redacting logger with deterministic PII scrubbing.",
  instructions: [
    "NEVER log raw request bodies (`console.log(req.body)`, `print(request.body)`) or unredacted user models to standard output or telemetry sinks.",
    "Deploy an automated redacting logger (`createRedactedLogger()`, `pino` redaction, or `structlog`) configured to scrub passwords, tokens, national IDs, and credit card numbers.",
    "Sanitize exception stack traces and payloads before reporting to external observability tools (Sentry, Datadog).",
    "Enforce strict telemetry masking across client-side error reporting libraries."
  ],
  forbiddenPatterns: [
    "console.log(\"User login:\", req.body) in API routes or middleware",
    "Logging raw authorization headers, JWT tokens, or API keys to server logs",
    "Transmitting unredacted customer emails or phone numbers to third-party monitoring platforms"
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
  title: "KVKK Data Subject Access Requests (DSR) & 30-Day SLA Ticketing Workflow",
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
  summary: "Process data subject access and erasure requests under KVKK Art. 11 & 13 within a non-extendable 30-day statutory SLA, validate mandatory identity fields, and notify downstream data processors.",
  instructions: [
    "Implement an automated DSR state machine (`SUBMITTED` -> `IDENTITY_VERIFIED` -> `IN_REVIEW` -> `COMPLETED`) with a strict 30-calendar-day countdown.",
    "Validate mandatory applicant identity fields (Turkish National ID / TCKN for citizens, passport number for foreign nationals, residential address, email, telephone) per Communiqué Art. 5/2.",
    "Upon completing an erasure or anonymization request, trigger downstream webhook notifications to all third-party data processors (Stripe, Resend, CRM).",
    "Record immutable audit log entries for every status transition and notification delivery."
  ],
  forbiddenPatterns: [
    "Permitting DSR ticket resolution beyond the strict 30-day statutory SLA window without escalating to DPO",
    "Accepting data subject applications lacking mandatory identity validation fields (TCKN/Passport, Address)",
    "Completing a deletion request internally without dispatching downstream erasure notifications to third-party processors"
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
  title: "KVKK Cookie Guidelines & Category-Based Prior Consent Management Platform (CMP)",
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
  summary: "Classify cookies strictly by category (Strictly Necessary, Functional, Performance/Analytics, Advertising/Marketing). Gate non-essential cookies behind prior explicit consent and provide a symmetric reject button.",
  instructions: [
    "Categorize all cookies and local storage tokens into 4 distinct statutory groups: `necessary`, `functional`, `analytics`, and `marketing`.",
    "Gate all non-essential analytics and marketing scripts behind explicit user consent prior to loading (`CookieConsentManager.isCategoryAllowed()`).",
    "Provide a symmetric \"Reject All\" button with equal visual weight, color contrast, and font size as the \"Accept All\" button.",
    "Enforce a maximum consent validity window of 12 months, prompting re-consent upon policy updates or expiration."
  ],
  forbiddenPatterns: [
    "Loading Google Tag Manager, Meta Pixel, or analytics scripts before the user explicitly clicks \"Accept\"",
    "Providing only an \"Accept\" button while hiding the \"Reject\" option behind nested sub-menus (Dark Pattern)",
    "Pre-selecting optional cookie categories as active inside preference modals"
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
  title: "KVKK Article 9 (2024 Reform) Cross-Border Data Transfer & Cloud Geo-Fencing",
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
  summary: "Prohibit transferring personal data to foreign cloud servers or LLM APIs without Standard Contractual Clauses (SCC) notified to the Board within 5 business days, Binding Corporate Rules (BCR), or Board authorization. Implement geo-routing and data residency.",
  instructions: [
    "Route database storage and processing workloads involving Turkish resident personal data to in-country regions (e.g. TR-Central, EU Sovereign Cloud) by default.",
    "When using overseas cloud providers (AWS, Azure, Vercel) or LLM endpoints (OpenAI, Anthropic), verify that executed Standard Contractual Clauses (SCC) have been filed with the Personal Data Protection Board within 5 business days.",
    "Apply local pseudonymization or tokenization filters before transmitting user payloads to foreign APIs.",
    "Log data residency tags (`dataResidencyRegion: \"TR\"`) across database records and telemetry events."
  ],
  forbiddenPatterns: [
    "Transmitting raw, unmasked Turkish National IDs (TCKN) or user profiles directly to overseas LLM inference endpoints",
    "Deploying primary customer databases to regions outside Turkey without an active SCC filing or Board authorization",
    "Failing to log data sovereignty and residency routing metadata on cross-border API integrations"
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
  title: "KVKK Article 12(5) 72-Hour Personal Data Breach Notification Workflow",
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
  summary: "Establish a 72-hour statutory breach countdown from incident detection to notification of the Board (using the official 6-section form) and affected data subjects without unreasonable delay, maintaining an internal breach incident register.",
  instructions: [
    "Initialize an immutable 72-hour countdown immediately upon detecting any security incident involving unauthorized access, disclosure, or loss of personal data.",
    "Generate an incident payload structured according to the official Personal Data Protection Board 6-section notification template.",
    "Maintain an internal Breach Incident Register documenting root causes, affected data categories, estimated user counts, and remedial actions.",
    "Prepare automated data subject notification templates to alert impacted individuals without unreasonable delay."
  ],
  forbiddenPatterns: [
    "Failing to record the exact detection timestamp (`detectedAt`) of a suspected personal data breach",
    "Concealing security incidents or delaying regulatory notification beyond the 72-hour statutory window",
    "Omitting mandatory incident log entries from the internal corporate security register"
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
  title: "HIPAA § 164.312(a)(2)(ii) Emergency Break-Glass Access Protocol & High-Priority Auditing",
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
  summary: "Implement emergency override (break-glass) protocols for medical personnel to access critical patient records during clinical emergencies while generating immediate immutable audit records and supervisor notifications.",
  instructions: [
    "Implement a dedicated emergency access override mechanism allowing clinicians to access restricted patient records during life-threatening emergencies.",
    "Mandate entry of a clinical justification reason prior to granting break-glass emergency access.",
    "Generate an immediate high-priority audit record documenting physician ID, patient ID, timestamp, and clinical justification.",
    "Trigger automated supervisor or compliance officer notifications upon execution of any break-glass access event."
  ],
  forbiddenPatterns: [
    "Allowing break-glass emergency access without requiring a clinical justification reason",
    "Failing to log emergency access events in an immutable, high-priority audit trail",
    "Granting permanent blanket permissions under an emergency access override"
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
  title: "GDPR & CJEU Breyer C-582/14 Prohibition of Unproxied Remote Assets (LG München I)",
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
  summary: "Dynamic IP addresses are protected personal data. Never link external images, fonts, or avatars directly from client-side DOM. Route third-party media through a signed server-side asset proxy with SSRF protection.",
  instructions: [
    "Route all external user avatars (Gravatar), remote images, and third-party media through a server-side signed asset proxy.",
    "Self-host all web fonts (Google Fonts, Adobe Fonts) locally or bundle them into static deployment assets (`@next/font/google`, `@fontsource`).",
    "Implement strict Server-Side Request Forgery (SSRF) filters validating that asset proxies never fetch internal IP ranges (127.0.0.1, 10.x, 169.254.x).",
    "Add cryptographic HMAC signatures to proxy URLs to prevent unauthenticated server resource abuse."
  ],
  forbiddenPatterns: [
    "<img src=\"https://gravatar.com/avatar/...\" /> directly rendered in client-side HTML",
    "<link href=\"https://fonts.googleapis.com/css2?...\" rel=\"stylesheet\"> in HTML headers",
    "<img src=\"https://images.unsplash.com/...\" /> without next/image optimization or asset proxying"
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
  title: "GDPR & TDDDG § 25 Two-Click Solution for Video and Map Embeds (CJEU Fashion ID)",
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
  summary: "Embedding third-party iframes (YouTube, Vimeo, Google Maps) or social widgets without user activation leaks visitor IP and Referer headers. Enforce a Two-Click Consent Wrapper with local thumbnails.",
  instructions: [
    "Wrap all third-party media iframes (YouTube, Vimeo, Google Maps) in a Two-Click Consent Component (*Zwei-Klick-Lösung*).",
    "Display only locally hosted or self-proxied thumbnail images prior to explicit user activation (never hotlink `i.ytimg.com`).",
    "Ensure zero network requests are dispatched to third-party domains on initial page load.",
    "Load the actual iframe only after the user explicitly clicks the overlay activation button, applying `referrerpolicy=\"no-referrer\"`."
  ],
  forbiddenPatterns: [
    "<iframe src=\"https://www.youtube.com/embed/...\" /> rendered directly without a user activation click",
    "<iframe src=\"https://www.google.com/maps/embed?...\" /> loaded automatically on page render",
    "Hotlinking video preview thumbnails from `https://i.ytimg.com/...` in two-click placeholders"
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
  title: "GDPR & CNIL Privacy-Preserving CAPTCHA without Hardware Telemetry (Cityscoot Decision)",
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
  summary: "Google reCAPTCHA collects hardware and browser canvas fingerprints, exceeding the strictly necessary exemption. Use zero-telemetry proof-of-work alternatives (Altcha, mCaptcha) or gate reCAPTCHA behind explicit CMP consent.",
  instructions: [
    "Prefer zero-telemetry, privacy-preserving CAPTCHA solutions based on local client-side Proof-of-Work (Altcha, mCaptcha, Cloudflare Turnstile).",
    "If Google reCAPTCHA v2/v3 or hCaptcha is utilized, strictly gate script loading behind prior explicit cookie consent under the \"Security/Functional\" category.",
    "Never execute reCAPTCHA scripts on initial unconsented page loads (CNIL Decision SAN-2023-003).",
    "Provide fallback verification mechanisms (email/SMS OTP) for users who reject tracking CAPTCHAs."
  ],
  forbiddenPatterns: [
    "<script src=\"https://www.google.com/recaptcha/api.js\"></script> loaded directly without prior consent gating",
    "<div className=\"g-recaptcha\"> rendered on login/signup forms without checking user cookie consent",
    "Claiming that behavioral reCAPTCHA fingerprinting qualifies as a strictly necessary cookie exempt from consent"
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
  title: "KVKK Article 12(1) Bulk Email Unauthorized Disclosure Prevention & Mandatory BCC",
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
  summary: "Prevent unauthorized mass disclosure of recipient email addresses in bulk communications by strictly enforcing individual envelope dispatch or mandatory BCC addressing, eliminating tracking web beacons without consent.",
  instructions: [
    "NEVER pass an array or comma-separated list of multiple recipient email addresses into the `to` or `cc` fields of email dispatch libraries.",
    "Enforce individual envelope dispatches (`buildSafeBulkEnvelopes`) or ensure all recipient addresses are assigned strictly to `bcc`.",
    "Strip 1x1 transparent tracking web beacons and unconsented read-receipt telemetry pixels from email payloads.",
    "Validate email dispatch options through automated safety checkers prior to calling SMTP transporters."
  ],
  forbiddenPatterns: [
    "`transporter.sendMail({ to: recipientsArray })` with multiple email addresses",
    "`msg[\"To\"] = \", \".join(recipients)` in Python smtplib bulk notification scripts",
    "Embedding 1x1 tracking web beacons in newsletters without prior explicit consent"
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
  title: "KVKK Board Decision 2025/1072 SMS OTP Decoupling from Commercial Consent",
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
  summary: "Strictly isolate SMS one-time password (OTP) verification flows from commercial messaging consent. It is unlawful to obtain marketing or data processing consent bundled with phone number verification in a single action.",
  instructions: [
    "Ensure the OTP verification handler exclusively updates phone verification status (`phoneVerified: true`) without touching marketing or electronic communication consent fields.",
    "Explicitly state the single purpose of the verification code in the SMS body (e.g. \"Giriş doğrulama kodunuz: 123456\").",
    "Marketing and commercial communication consent MUST be obtained via separate, unbundled checkboxes with distinct user actions.",
    "Reject any API payload that attempts to activate `marketingConsent` or `etkConsent` within an OTP verification request."
  ],
  forbiddenPatterns: [
    "Setting `marketingConsent: true` or `etkConsent: true` inside an OTP verification database transaction",
    "Displaying UI copy claiming that entering the SMS code also constitutes consent for promotional messages (\"Tek tıkla çoklu onay\")",
    "Sending multi-purpose SMS bodies that combine promotional advertising with security verification codes"
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
  title: "Account Takeover Defense: Adaptive Sliding Window Rate Limiting and Mandatory MFA",
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
  summary: "Implement sliding window rate limiting on authentication and password reset endpoints, trigger progressive backoff lockouts upon repeated failed attempts, and mandate multi-factor authentication (MFA) to prevent credential stuffing.",
  instructions: [
    "Deploy a sliding window rate limiter tracking client IP addresses and account identifiers across all login, register, and reset endpoints.",
    "Enforce progressive backoff lockouts (e.g. 5 failed attempts within 5 minutes triggers a 15-minute account lockout).",
    "Trigger mandatory multi-factor authentication (TOTP / SMS MFA) when login attempts originate from unfamiliar devices or unusual geographic locations.",
    "Log security telemetry events (`AUTH_RATE_LIMIT_EXCEEDED`, `ACCOUNT_LOCKED`) to enable rapid incident detection."
  ],
  forbiddenPatterns: [
    "Exposing authentication or password reset endpoints without IP or account-level rate limiting",
    "Permitting infinite brute-force login attempts without progressive lockout delays",
    "Storing authentication session tokens or MFA secrets in unencrypted plaintext cookies"
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
  title: "HIPAA & FTC Prohibition of Commercial Ad Trackers on Sensitive Health Routes (GoodRx & BetterHelp)",
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
  summary: "Never install Meta Pixel, Google Ads, TikTok Pixel, or commercial trackers on sensitive health, prescription, therapy, checkout, or intake routes. Transmitting health data to third-party ad brokers violates FTC Act Sec. 5 and HBNR.",
  instructions: [
    "Strictly prohibit and block commercial advertising pixels (`fbq`, `gtag`, `ttq`, `snaptr`) on all sensitive routes (`/health/`, `/rx/`, `/therapy/`, `/checkout/`, `/intake/`, `/kids/`).",
    "Ensure zero personal health queries, symptoms, or prescription parameters are transmitted via URL query strings or Referer headers.",
    "Enforce automated route guard filters (`shouldBlockCommercialTracking()`) preventing ad tracker execution on health domains.",
    "Comply with FTC Health Breach Notification Rule (HBNR) standards and HIPAA Business Associate Agreement (BAA) constraints."
  ],
  forbiddenPatterns: [
    "window.fbq(\"track\", \"ViewContent\", { condition: \"depression\" }) on therapy or health pages",
    "Executing Google Ads, Meta Pixel, or TikTok tracking scripts on prescription checkout routes",
    "Passing user medical conditions or prescription identifiers in URL parameters accessible to analytics tags"
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
  title: "CCPA/CPRA 11 CCR § 7025 Automated Global Privacy Control (GPC) Opt-Out Mandate",
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
  summary: "Detect and honor the browser `Sec-GPC: 1` header and `navigator.globalPrivacyControl` signal as a legally binding consumer request to opt out of the sale or sharing of personal data, automatically freezing commercial ad trackers and persisting the preference to user profiles.",
  instructions: [
    "Inspect incoming HTTP request headers for `Sec-GPC: 1` and client-side `navigator.globalPrivacyControl === true`.",
    "When the GPC signal is active, automatically treat it as a binding opt-out of personal data sale and sharing under CCPA/CPRA § 7025.",
    "Disable third-party advertising cookies, retargeting scripts, and data broker sync pipelines immediately upon detecting GPC.",
    "For authenticated users, persist the `ccpaOptedOut: true` preference to their database profile to ensure cross-device compliance."
  ],
  forbiddenPatterns: [
    "Ignoring or overriding the browser Sec-GPC: 1 header or navigator.globalPrivacyControl signal",
    "Requiring consumers who broadcast GPC signals to manually navigate preference toggles or submit written forms",
    "Loading retargeting ad trackers when evaluateGpcSignal() returns optOutActive: true"
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
    name: 'Turkey Statutory Compliance Pack (KVKK, ETK, VUK, 5651)',
    jurisdiction: 'KVKK_TR',
    description: 'Architectural and UI rules for Turkish Law No. 6698 (KVKK), Law No. 6563 (ETK), and Tax Procedure Law Art. 253; includes bulk email BCC, OTP decoupling, and brute-force defenses.',
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
    name: 'European Union Regulatory Pack (GDPR, EAA 2025, AI Act)',
    jurisdiction: 'GDPR_EU',
    description: 'GDPR Right to Erasure, German/EU unproxied hotlink asset ban, two-click embeds, privacy-preserving CAPTCHA, EAA 2025 / WCAG 2.1 AA accessibility, and EU AI Act transparency rules.',
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
    name: 'US Healthcare & Health Privacy Pack (HIPAA, FTC)',
    jurisdiction: 'HIPAA_US',
    description: 'HIPAA 45 CFR § 164.312 technical safeguards, PHI isolation, immutable audit trails, emergency break-glass access, and FTC health tracker pixel bans.',
    version: '1.1.0',
    rules: [HIPAA_TECHNICAL_SAFEGUARDS_RULE, HIPAA_BREAKGLASS_RULE, HIPAA_FTC_SENSITIVE_PIXEL_RULE, PII_LOGGER_GUARD_RULE]
  },
  {
    id: 'us-privacy-compliance',
    name: 'US State Privacy & Consumer Protection Pack (CCPA/CPRA, GPC)',
    jurisdiction: 'CCPA_US',
    description: 'California CCPA/CPRA Global Privacy Control automated opt-out enforcement and sensitive route tracking pixel protections.',
    version: '1.0.0',
    rules: [CCPA_GPC_RULE, HIPAA_FTC_SENSITIVE_PIXEL_RULE]
  }
];

