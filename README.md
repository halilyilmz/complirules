# 🛡️ CompliRules: Compliance-as-Code & Legal AI Guardrail Engine

> **"Vibe Coding" çağında yazılımlarınızı yasal risklerden, veri koruma cezalarından ve karanlık örüntülerden (Dark Patterns) koruyan açık kaynaklı kural motoru, CLI ve Model Context Protocol (MCP) sunucusu.**

CompliRules; **Cursor, Claude Code, Windsurf ve GitHub Copilot** gibi AI kodlama asistanlarının ürettiği kodların yerel ve küresel regülasyonlara (**KVKK, GDPR, EAA 2025/WCAG 2.1 AA, HIPAA, EU AI Act, VUK**) tam uyumlu olmasını sağlar.

---

## ⚡ Hızlı Başlangıç (Quick Start)

### 1. Projenize Kurulum Yapın
```bash
# Türkiye ve AB regülasyonları için otomatik kurulum:
npx complirules init

# Belirli bir yargı alanı için:
npx complirules init --jurisdiction TR,EU

# Tüm paketler (KVKK, GDPR, EAA, HIPAA, AI Act) için:
npx complirules init --all
```

Bu komut projenizin teknoloji yığınını (Next.js, Prisma, Express vb.) otomatik tespit eder ve:
- `.cursor/rules/*.mdc` kural dosyalarını enjekte eder.
- Kök dizine **`AGENTS.md`** ve **`CLAUDE.md`** dosyalarını ekler.
- `.cursor/mcp.json` ile MCP sunucusunu otomatik bağlar.

---

### 2. Kod Tabanını Denetleyin (CI/CD Linter)
```bash
# Kodunuzdaki KVKK, GDPR ve PII sızıntılarını AST analiziyle denetler:
npx complirules check

# Belirli bir klasör veya dosyayı denetlemek için:
npx complirules check ./src
```

---

### 3. Otomatik RoPA / VERBİS Envanteri Üretin
```bash
# Veritabanı şemanızdan (Prisma/SQL) otomatik GDPR Madde 30 & VERBİS envanter tablosu çıkarır:
npx complirules ropa prisma/schema.prisma
```

---

### 4. Hazır Uyumluluk Primitiflerini Ekleyin
```bash
# Kriptografik kullanıcı silme ve anonimleştirme primitifi:
npx complirules scaffold crypto-shredding

# CloudWatch/Sentry PII sızıntı önleyici logger:
npx complirules scaffold pii-logger
```

---

## 🏛️ Desteklenen Mevzuatlar ve Kapsam

| Yargı Alanı | Mevzuat / Standart | Kapsanan Mimari ve Arayüz Kuralları |
| :--- | :--- | :--- |
| 🇹🇷 **Türkiye** | **6698 Sayılı KVKK (Md. 7)** & **213 Sayılı VUK (Md. 253)** | `onDelete: Cascade` ile fatura silme yasağı, Tombstone/Crypto-shredding ile anonimleştirme. |
| 🇹🇷 **Türkiye** | **KVKK Kurul İlke Kararı 2019/09** & **6563 Sayılı ETK/İYS** | Tek kutuda birleştirilmiş onay (Bundled consent) yasağı, İYS ticari elektronik ileti ayrımı. |
| 🇪🇺 **Avrupa Birliği** | **GDPR (Art. 17 & Art. 25)** | Unutulma hakkı (Right to be Forgotten) ve üçüncü parti (Stripe, Resend) itlaf pipeline'ı. |
| 🇪🇺 **Avrupa Birliği** | **European Accessibility Act (EAA 2025)** & **WCAG 2.1 AA** | Klavye odak halkası (focus ring), ekran okuyucu etiketleri (`aria-label`), >=44px dokunma alanları. |
| 🇺🇸 **ABD** | **HIPAA Security Rule (45 CFR § 164.312)** | Korumalı Sağlık Bilgisi (PHI) izolasyonu, immutable audit trail ve BAA kontrolü. |
| 🇪🇺 **Avrupa Birliği** | **EU AI Act (Article 50)** | Yapay zekâ şeffaflık rozetleri ve üretilen içeriklerin filigranlanması. |
| 🌐 **Global** | **DevSecOps / AppSec PII Guard** | Loglama katmanında `console.log(user)` engeli ve otomatik PII maskeleme. |

---

## 🔌 Model Context Protocol (MCP) Entegrasyonu

Cursor veya Claude Code kullanırken AI modelinin arka planda CompliRules ile canlı konuşmasını sağlamak için `.cursor/mcp.json` dosyanız:

```json
{
  "mcpServers": {
    "complirules": {
      "command": "npx",
      "args": ["@complirules/mcp-server"]
    }
  }
}
```

### AI Ajanına Verilen Araçlar (MCP Tools):
1. **`verify_schema_compliance`:** Şemadaki yasal veri saklama sürelerini ve riskli cascade delete ilişkilerini denetler.
2. **`audit_code_pii`:** API rotasında veya fonksiyonda PII/PHI sızıntılarını canlı yakalar ve düzeltilmiş kod döner.
3. **`check_ui_dark_patterns`:** Form bileşenlerinde pre-ticked veya bundled onay kutularını denetler.
4. **`generate_ropa_inventory`:** Otomatik GDPR Madde 30 & KVKK VERBİS envanter tablosu üretir.
5. **`lookup_legal_citation`:** Kanun maddelerini, kurul kararlarını ve cezai yaptırımları anında modele besler.

---

## 📦 Monorepo Paket Yapısı

```
complirules/
├── packages/
│   ├── rules/          # Modüler .mdc kural tanımları ve şablon üreticisi
│   ├── primitives/     # Crypto-shredding, PII scrubber ve Consent store
│   ├── linter/         # Deterministik AST/regex kural denetleme motoru
│   ├── mcp-server/     # Cursor/Claude Code için Model Context Protocol sunucusu
│   └── cli/            # `complirules` komut satırı aracı (Node.js/ESM)
├── examples/
│   └── vulnerable-vs-compliant-saas/  # Öncesi / Sonrası karşılaştırmalı demo
└── tests/              # Kapsamlı Vitest birim ve entegrasyon testleri
```

---

## ⚖️ Hukuki Çerçeve ve Sorumluluk Reddi (Disclaimer)

CompliRules bir teknik uyumluluk otomasyonu ve *Privacy-by-Design* altyapı aracıdır. Bu araç tarafından sağlanan kural dosyaları, denetim raporları ve kod şablonları hukuki danışmanlık (Legal Advice) niteliği taşımaz. Şirketinizin veri sorumlusu (Data Controller) yükümlülükleri kapsamında hukuki metinlerinizi ve mimarinizi kurumunuzun hukuk müşaviri veya Veri Koruma Görevlisi (DPO) ile onaylatmanız tavsiye edilir.

---

## 📄 Lisans
MIT © 2026 CompliRules Contributors
