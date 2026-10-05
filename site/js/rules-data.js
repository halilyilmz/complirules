/**
 * CompliRules - 28 Kural & Mevzuat Kataloğu Verisi
 */

window.RULES_DATA = [
  {
    id: "kvkk-retention-tombstone",
    title: "VUK 5 Yıl Saklama vs KVKK Tombstone İmha",
    category: "kvkk",
    jurisdiction: "🇹🇷 KVKK / VUK",
    severity: "CRITICAL",
    citation: "213 s. VUK Md. 253 & 6698 s. KVKK Md. 7",
    summary: "Faturalı kullanıcı silinirken vergi kanunları gereği 5 yıl saklanması gereken muhasebe verilerini korur; CASCADE DELETE yerine Tombstone (kriptografik parçalama) uygular."
  },
  {
    id: "kvkk-ui-consent-etk",
    title: "Granüler Rıza & Ön İşaretsiz Onay Kutuları",
    category: "kvkk",
    jurisdiction: "🇹🇷 KVKK / ETK",
    severity: "CRITICAL",
    citation: "6698 s. K. Md. 3/1(a), 2019/09 İlke Kararı",
    summary: "Üyelik sözleşmesi ile pazarlama onayının birleştirilmesini (bundled consent) ve varsayılan olarak seçili gelen (pre-ticked) onay kutularını engeller."
  },
  {
    id: "kvkk-dsr-ticketing",
    title: "30 Günlük İlgili Kişi Başvuru (DSR) Motoru",
    category: "kvkk",
    jurisdiction: "🇹🇷 KVKK",
    severity: "HIGH",
    citation: "6698 s. K. Md. 11 & 13, Veri Sorumlusuna Başvuru Tebliği",
    summary: "Kullanıcı bilgi edinme ve silme taleplerinin yasal 30 günlük süresini takip eden ve 3. taraflara otomatik bildirim dağıtan biletleme kuralı."
  },
  {
    id: "kvkk-cookie-cmp",
    title: "Kategori Bazlı Çerez ve CMP Yönetimi",
    category: "kvkk",
    jurisdiction: "🇹🇷 KVKK Çerez Rehberi",
    severity: "HIGH",
    citation: "KVKK Haziran 2022 Çerez Rehberi",
    summary: "Zorunlu, Fonksiyonel, Analitik ve Pazarlama çerezlerini kategorize eder; açık rıza alınana kadar takip scriptlerinin çalışmasını bloke eder."
  },
  {
    id: "kvkk-transfer-geofencing",
    title: "Yurt Dışına Veri Aktarımı & Geo-Fencing",
    category: "kvkk",
    jurisdiction: "🇹🇷 KVKK 2024 Reformu",
    severity: "CRITICAL",
    citation: "6698 s. K. Md. 9 (12 Mart 2024 RG)",
    summary: "Yurt dışına veri aktarımında Standart Sözleşme (SCC) 5 günlük bildirim kontrolü ve coğrafi veri barındırma (geo-fencing) sınırlarını denetler."
  },
  {
    id: "kvkk-breach-notification-72h",
    title: "72 Saatlik Kurul Veri İhlal Bildirim Protokolü",
    category: "kvkk",
    jurisdiction: "🇹🇷 KVKK",
    severity: "CRITICAL",
    citation: "6698 s. K. Md. 12(5) & 2019/10 Kurul Kararı",
    summary: "Olası bir sızıntı tespit edildiğinde 72 saatlik geri sayımı başlatan, Kurul formunu JSON olarak hazırlayan kriz yönetim şablonu."
  },
  {
    id: "kvkk-email-bcc-safety",
    title: "Toplu E-postalarda BCC Zorunluluğu",
    category: "kvkk",
    jurisdiction: "🇹🇷 KVKK Veri Güvenliği",
    severity: "HIGH",
    citation: "6698 s. K. Md. 12(1) & Kişisel Veri Güvenliği Rehberi",
    summary: "Çoklu alıcılı e-postalarda alıcıların birbirlerinin adreslerini görmesini engelleyen tekli zarf veya BCC zorunluluğu getirir."
  },
  {
    id: "kvkk-otp-marketing-decoupling",
    title: "SMS OTP Doğrulaması ile Pazarlama Ayrımı",
    category: "kvkk",
    jurisdiction: "🇹🇷 KVKK / ETK",
    severity: "CRITICAL",
    citation: "KVKK Kurulu 2025/1072 İlke Kararı",
    summary: "Tek kullanımlık SMS/OTP giriş kodlarının ticari elektronik ileti onayına bağlanmasını kesin olarak yasaklar."
  },
  {
    id: "gdpr-right-to-be-forgotten",
    title: "Unutulma Hakkı & Kriptografik İmha (Crypto-Shredding)",
    category: "gdpr",
    jurisdiction: "🇪🇺 GDPR",
    severity: "CRITICAL",
    citation: "GDPR Art. 17 (Right to Erasure)",
    summary: "RDBMS, Redis ve loglardaki kullanıcı verilerini tek tek silmek yerine kullanıcıya özel anahtarı imha ederek veriyi anında anlamsızlaştırır."
  },
  {
    id: "gdpr-no-unproxied-remote-assets",
    title: "Harici Font & CDN IP Sızıntısı Engeli",
    category: "gdpr",
    jurisdiction: "🇪🇺 GDPR / Emsal Karar",
    severity: "CRITICAL",
    citation: "LG München I (3 O 17493/20) & CJEU C-582/14 (Breyer)",
    summary: "Google Fonts veya harici CDN'lerin doğrudan çağrılarak kullanıcı IP adresinin rızasız ABD sunucularına aktarılmasını AST düzeyinde yakalar."
  },
  {
    id: "gdpr-two-click-embed",
    title: "İki Tıklamalı Sosyal Medya & Harita Gömme",
    category: "gdpr",
    jurisdiction: "🇪🇺 GDPR / CJEU",
    severity: "HIGH",
    citation: "CJEU C-40/17 (Fashion ID)",
    summary: "YouTube, Vimeo ve Google Maps iframe'lerinin kullanıcı açık onay verene kadar üçüncü tarafa HTTP/çerez isteği atmasını engeller."
  },
  {
    id: "gdpr-privacy-preserving-captcha",
    title: "Gizlilik Dostu Doğrulama (reCAPTCHA v3 Yasağı)",
    category: "gdpr",
    jurisdiction: "🇪🇺 GDPR / CNIL",
    severity: "HIGH",
    citation: "GDPR Art. 5(1)(c) & CNIL Kılavuzu",
    summary: "Kullanıcı tarayıcısını rızasız parmak iziyle takip eden Google reCAPTCHA yerine mCaptcha veya Cloudflare Turnstile kullanımını zorunlu kılar."
  },
  {
    id: "gdpr-eprivacy-consent-decoupling",
    title: "ePrivacy Çerez Ayrımı & Simetrik Ret Butonu",
    category: "gdpr",
    jurisdiction: "🇪🇺 ePrivacy Direktifi",
    severity: "CRITICAL",
    citation: "Directive 2002/58/EC Art. 5(3) & CJEU Planet49",
    summary: "Çerez onayının meşru menfaat dayanağıyla alınmasını engeller; 'Hepsini Reddet' butonunun 'Kabul Et' ile aynı boyutta ve renkte olmasını şart koşar."
  },
  {
    id: "schrems-ii-transfer-tia",
    title: "Schrems II & 6 Adımlı Transfer Etki Analizi (TIA)",
    category: "gdpr",
    jurisdiction: "🇪🇺 CJEU Schrems II",
    severity: "CRITICAL",
    citation: "CJEU C-311/18 & EDPB Recommendations 01/2020",
    summary: "ABD merkezli bulut ve analitik sağlayıcılarına veri aktarılmadan önce FISA 702 ve EO 12333 istihbarat risk değerlendirmesini zorunlu kılar."
  },
  {
    id: "multi-jurisdiction-conflict-quarantine",
    title: "Çoklu Yargı Alanı Çakışma & Karantina Motoru",
    category: "gdpr",
    jurisdiction: "🇪🇺 / 🇹🇷 / 🇺🇸 Çakışma Çözümü",
    severity: "CRITICAL",
    citation: "GDPR Art. 17 vs KVKK / VUK Md. 253 vs HIPAA § 164.316",
    summary: "Bir kullanıcının GDPR unutulma talebi ile yerel vergi/sağlık saklama yükümlülüğü çakıştığında veriyi silmeyip yalıtılmış karantinaya alır."
  },
  {
    id: "eaa-wcag-accessibility",
    title: "EAA 2025 & WCAG 2.1 AA Erişilebilirlik",
    category: "eaa-ai",
    jurisdiction: "🇪🇺 EAA 2025 / WCAG",
    severity: "HIGH",
    citation: "Directive (EU) 2019/882 & EN 301 549",
    summary: "28 Haziran 2025'te zorunlu hale gelen Avrupa Erişilebilirlik Yasası kapsamında 4.5:1 kontrast, klavye odağı ve ekran okuyucu uyumunu denetler."
  },
  {
    id: "ai-act-transparency",
    title: "AB Yapay Zeka Yasası Şeffaflık & C2PA Damgalama",
    category: "eaa-ai",
    jurisdiction: "🇪🇺 EU AI Act",
    severity: "HIGH",
    citation: "Regulation (EU) 2024/1689 Art. 50",
    summary: "Yapay zeka tarafından üretilen metin, görsel ve ses içeriklerine makine tarafından okunabilir (C2PA) sentetik filigran eklenmesini şart koşar."
  },
  {
    id: "hipaa-phi-technical-safeguards",
    title: "HIPAA Korumalı Sağlık Verisi (PHI) Teknik Güvenceleri",
    category: "us",
    jurisdiction: "🇺🇸 HIPAA Security Rule",
    severity: "CRITICAL",
    citation: "45 CFR § 164.312 & Minimum Necessary Standard",
    summary: "Sağlık verilerinin şifrelenmiş izole tablolarda saklanması, 15 dakikalık otomatik oturum kapatma ve değişmez denetim loglarını zorunlu kılar."
  },
  {
    id: "hipaa-breakglass-emergency",
    title: "HIPAA Acil Durum Kır-Geç (Break-Glass) Protokolü",
    category: "us",
    jurisdiction: "🇺🇸 HIPAA Security Rule",
    severity: "HIGH",
    citation: "45 CFR § 164.312(a)(2)(ii) Emergency Access",
    summary: "Acil tıbbi müdahale anında hekimlerin yetki kısıtlamalarını gerekçe belirterek aşmasını ve bu eylemin denetlenemez şekilde loglanmasını sağlar."
  },
  {
    id: "hipaa-ftc-sensitive-route-pixel",
    title: "Hassas Sağlık Rotalarında Takip Pikseli Yasağı",
    category: "us",
    jurisdiction: "🇺🇸 FTC / OCR Enforcement",
    severity: "CRITICAL",
    citation: "FTC GoodRx, BetterHelp, Flo Health Kararları",
    summary: "Reçete, randevu veya semptom arama sayfalarına Meta Pixel veya Google Analytics kurulmasını kod düzeyinde kesin olarak engeller."
  },
  {
    id: "ccpa-gpc-automated-optout",
    title: "CCPA / CPRA Global Privacy Control (GPC) Desteği",
    category: "us",
    jurisdiction: "🇺🇸 CCPA / CPRA",
    severity: "HIGH",
    citation: "Cal. Civ. Code § 1798.135 & Sephora Kararı ($1.2M)",
    summary: "Tarayıcıdan gelen `Sec-GPC: 1` başlığını otomatik olarak algılayıp kullanıcının verisinin satılmasını veya paylaşılmasını devre dışı bırakır."
  },
  {
    id: "bipa-biometric-retention",
    title: "Illinois BIPA Biyometrik Koruma & İmha Çizelgesi",
    category: "us",
    jurisdiction: "🇺🇸 Illinois BIPA (740 ILCS 14/)",
    severity: "CRITICAL",
    citation: "740 ILCS 14/ & Cothron v. White Castle Emsali",
    summary: "Yüz veya parmak izi taramasından önce yazılı bilgilendirilmiş rıza alınmasını, 3 yıllık imha politikasını ve ticarileştirme yasağını uygular."
  },
  {
    id: "sec-pii-logger-guard",
    title: "Log Dosyalarına Ham PII Sızmasını Önleme",
    category: "security",
    jurisdiction: "🌐 Global Security Standard",
    severity: "CRITICAL",
    citation: "GDPR Art. 5(1)(f) & KVKK Veri Güvenliği Rehberi",
    summary: "Console, Winston, Pino veya Log4j çağrılarında şifre, TCKN, kredi kartı veya req.body nesnelerinin maskelenmeden yazılmasını engeller."
  },
  {
    id: "sec-auth-rate-limit-mfa",
    title: "Kaba Kuvvet Koruması & Çok Faktörlü Doğrulama (2FA)",
    category: "security",
    jurisdiction: "🌐 OWASP Top 10 / NIST 800-63B",
    severity: "HIGH",
    citation: "OWASP ASVS & KVKK Veri Sorumlusu Kusuru Kararları",
    summary: "Giriş ve şifre sıfırlama rotalarında IP ve kullanıcı bazlı kayan pencere (sliding-window) hız sınırlandırması ve şüpheli girişte 2FA şart koşar."
  }
,
  {
    id: "gdpr-data-portability-endpoint",
    title: "GDPR Art. 20 Makinece Okunabilir Veri Taşınabilirliği",
    category: "gdpr",
    jurisdiction: "🇪🇺 GDPR",
    severity: "HIGH",
    citation: "GDPR Art. 20 & EDPB WP 242",
    summary: "Kullanıcı verilerini talep ettiğinde salt PDF/HTML yerine otomatik olarak yapılandırılmış JSON/CSV çıktısı üreten ve hız sınırlamalı endpoint standardı."
  },
  {
    id: "hipaa-baa-telemetry-isolation",
    title: "HIPAA BAA & Telemetri İzolasyonu (Sentry/Datadog)",
    category: "hipaa",
    jurisdiction: "🇺🇸 HIPAA / HHS OCR",
    severity: "CRITICAL",
    citation: "45 CFR § 164.502(e) & Raleigh Orthopaedic Kararı",
    summary: "Hata takip ve telemetri servislerinde sendDefaultPii: false yapılmasını, SSN/MRN temizlenmesini ve BAA anlaşması olmadan harici AI/bulut çağrılarını bloke eder."
  },
  {
    id: "eaa-accessible-checkout-mfa",
    title: "EAA 2025 Çok Modlu Biyometrik Alternatif & Erişilebilir Ödeme",
    category: "eaa",
    jurisdiction: "🇪🇺 EAA 2025 / EN 301 549",
    severity: "CRITICAL",
    citation: "Directive (EU) 2019/882 & EN 301 549 Md. 5.3",
    summary: "Yalnızca biyometrik (FaceID/parmak izi) kimlik doğrulamaya zorlamayı yasaklar; engelli kullanıcılar için paralel TOTP/SMS alternatifi ve klavye odak halkaları şart koşar."
  },
  {
    id: "ai-act-prohibited-practices",
    title: "EU AI Act Madde 5 Yasaklı Yapay Zeka Uygulamaları",
    category: "ai-act",
    jurisdiction: "🇪🇺 EU AI Act (Şubat 2025)",
    severity: "CRITICAL",
    citation: "Reg. (EU) 2024/1689 Art. 5(1)(e)-(f) (€35M / %7 Ciro)",
    summary: "İş yeri ve eğitimde duygu analizi yapılmasını, internetten izinsiz yüz tanıma verisi kazınmasını (scraping) ve sosyal puanlamayı AST düzeyinde yasaklar."
  }
];
