# 🇹🇷 Türkiye Cumhuriyeti Yasal Uyumluluk ve Mimari Standartları (KVKK / VUK / ETK / 5651)

> **Hedef:** Yapay zekâ kodlama ajanlarının (Cursor, Claude Code, Windsurf, Copilot) Türkiye mevzuatına tam uyumlu, %100 yasal dayanaklı, cezai ve idari yaptırım riski barındırmayan kod ve mimari üretmesini sağlamak.  
> **Birincil Resmi Metin:** [`docs/regulations/sources/6698-KVKK-Resmi-Metin.pdf`](./sources/6698-KVKK-Resmi-Metin.pdf)

---

## 1. Yasal Mevzuat ve Maddi Hukuk Dayanakları

| Kanun / Yönetmelik / İlke Kararı | Madde & Hüküm | Yazılım Mimarisine ve Operasyona Doğrudan Etkisi | Olası Yaptırım / Ceza |
| :--- | :--- | :--- | :--- |
| **6698 Sayılı KVKK** | **Madde 7 & İmha Yönetmeliği (Md. 11)** | Kullanıcı silme talebinde kişisel veriler geri döndürülemez şekilde yok edilmeli veya anonimleştirilmelidir. Periyodik imha süresi en fazla **6 ay** olabilir. İmha işlem kayıtları ve denetim logları en az **3 yıl** saklanmalıdır. | TCK Md. 138 (1 ila 2 yıl hapis) & KVKK Md. 18 idari para cezası. |
| **6698 Sayılı KVKK** | **Madde 9 (12 Mart 2024 Reformu)** | Yurt dışına veri aktarımında yeterlilik kararı yoksa Standart Sözleşme (SCC), Bağlayıcı Şirket Kuralları (BCR) veya Taahhütname/Kurul izni zorunludur. Standart Sözleşmeler imzalandıktan sonra **5 iş günü içinde** Kurul'a bildirilmelidir. Geo-fencing ve veri yerleşimi esastır. | KVKK Md. 18/1-e (1.000.000 TL - 5.000.000 TL idari para cezası) & TCK Md. 136 hapis yaptırımı. |
| **6698 Sayılı KVKK** | **Madde 12/5 & Kurul 2019/10 Kararı** | Veri ihlali gerçekleştiğinde en geç **72 saat içinde** Kurul'a ve ilgili kişilere bildirim yapılmalıdır. Kurul bildirim formunun 6 zorunlu alanı doldurulmalı ve şirket içi **İhlal Kayıt Defteri (Incident Register)** tutulmalıdır. | KVKK Md. 18/1-b uyarınca ağır idari para cezası. |
| **6698 Sayılı KVKK** | **Madde 11 & 13 / Başvuru Tebliği** | İlgili kişi başvuruları (DSR) Tebliğ Md. 5/2 zorunlu unsurlarına göre doğrulanmalı ve en geç **30 gün içinde** sonuçlandırılmalıdır (bu süre **kesinlikle uzatılamaz**). Silme/düzeltme verilerin aktarıldığı üçüncü kişilere (**downstream notification**) bildirilmelidir. | KVKK Md. 18 idari para cezası. |
| **6698 Sayılı KVKK** | **Madde 16 & VERBİS Yönetmeliği** | **Yurt dışında yerleşik veri sorumluları:** Çalışan ve bilanço eşiğine bakılmaksızın Türkiye Temsilcisi atamak ve VERBİS'e kayıt olmak ZORUNDADIR. **Türkiye'de yerleşikler:** 50 çalışan veya 100 milyon TL yıllık bilanço eşiği (özel nitelikli veri işleyenlerde eşik aranmaz). Veri İşleme Envanteri (RoPA) zorunludur. | KVKK Md. 18/1-ç uyarınca en üst hadden idari para cezası. |
| **KVKK Çerez Rehberi (Haziran 2022)** | **Kategori Bazlı CMP & Simetrik Reddetme** | Çerezler 4 kategoriye ayrılmalıdır: Zorunlu, İşlevsel, Analitik, Pazarlama. Zorunlu dışındakiler için **Önceden Açık Rıza (Prior Consent Gating)** şarttır. Çerez banner'ında "Kabul Et" ve "Reddet" butonları **eşit görünürlük ve boyutta (simetrik)** olmalıdır. Cookie wall ve dark pattern yasaktır. | KVKK Md. 18 idari para cezası. |
| **6698 Sayılı KVKK** | **Madde 6 & Kurul Yeterli Önlemler** | Özel nitelikli veriler (sağlık, biyometrik, ceza mahkumiyeti) ana tablolarda açık tutulamaz; **Zarf Şifreleme (Envelope Encryption - DEK & KEK)** ve bağımsız anahtar yönetimi (KMS) zorunludur. | Kurul İlke Kararı uyarınca idari para cezası. |
| **213 Sayılı VUK & TTK** | **VUK Md. 253 / TTK Md. 82** | Fatura, ödeme ve ticari defter belgeleri **5 yıl** (TTK uyarınca **10 yıl**) saklanmak zorundadır. Fatura tablosunda `onDelete: Cascade` KULLANILAMAZ. | Vergi Usul Kanunu cezaları & Özel Usulsüzlük. |
| **KVKK Kurul İlke Kararı** | **2019/09 Sayılı Karar** | Açık rıza bir hizmet şartına bağlanamaz (**Bundled Consent yasağı**). Aydınlatma Metni (bilgilendirme) ile Açık Rıza (onay) ayrı olmalıdır. | Hukuka aykırı veri işleme yaptırımları. |
| **KVKK İlke Kararı (10 Haziran 2025)** | **2025/1072 Sayılı İlke Kararı (R.G. 26 Haziran 2025, Sayı: 32938)** | **SMS Doğrulama Kodu (OTP) ile Açık Rıza / ETK Birleştirme Kesin Yasağı:** Üyelik, kimlik doğrulama veya işlem tamamlama amacıyla gönderilen SMS doğrulama kodunun (OTP) sisteme girilmesi işlemi, ticari elektronik ileti onayı veya pazarlama açık rızası ile birleştirilemez. "Tek tıkla" çoklu onay aldığını iddia eden dark pattern tasarımları kesinlikle yasaktır. | KVKK Md. 18 idari para cezası ve denetim tedbirleri. |
| **KVKK Kurul Kararları** | **2019/331 ve 2020/67 Sayılı Kararlar** | **Toplu E-posta İfşası ve Zorunlu BCC Kuralı:** Birden çok alıcıya gönderilen e-postalarda alıcı e-posta adreslerinin `to` veya `cc` satırında açık tutulması kişisel verilerin hukuka aykırı ifşasıdır. Gönderimler münferit API çağrıları veya zorunlu `bcc` (Gizli Karbon Kopya) ile yapılmalıdır. | KVKK Md. 18/1-b idari para cezası & TCK Md. 136 hapis yaptırımı. |
| **6698 Sayılı KVKK** | **Madde 12 & Teknik Tedbirler Rehberi** | **Siber Güvenlik, 2FA/MFA, Rate Limiting & Hesap Kilitleme:** Kimlik doğrulama uç noktalarında Kaba Kuvvet (Brute-force) saldırılarına karşı IP ve hesap bazlı Rate Limiting, 5 başarısız deneme sonrası geçici hesap kilitleme (Account Lockout) ve kritik/idari hesaplarda İki Faktörlü Doğrulama (2FA/MFA) zorunludur. | KVKK Md. 18/1-b veri güvenliği ihlali yaptırımları. |
| **KVKK Emsal Kararları** | **Amazon (2020/173), WhatsApp (2021/898), Yemeksepeti** | **Hizmetin Açık Rıza Ön Şartına Bağlanması Yasağı:** Bir hizmet veya platformdan yararlanma şartı (üyelik, alışveriş, sipariş) pazarlama iznine veya yurt dışına veri aktarım rızasına bağlanamaz. Kullanıcı rıza vermeden de temel hizmeti alabilmelidir. | KVKK Md. 18 üst hadden idari para cezaları. |
| **6563 Sayılı ETK & İYS** | **Madde 6** | Pazarlama SMS/E-posta onayı önceden işaretli (`defaultChecked`) veya zorunlu (`required`) olamaz. İYS izin logu ve zaman damgası saklanmalıdır. | Ticaret Bakanlığı idari para cezası. |
| **5651 Sayılı Kanun** | **Madde 2 & Erişim Logları** | IP adresi, zaman damgası ve oturum logları bütünlük doğrulaması (hash) ile **2 yıl** boyunca saklanmalıdır. | BTK idari yaptırımları. |

---

## 2. Alt Ajanlar (Subagents) İçin Değişmez Kurallar (Invariants)

### A. Veritabanı ve Şema Kuralları (Prisma / Django / GORM / Laravel)
1. **MUST:** Finansal modeller (`Invoice`, `Payment`, `Order`, `Transaction`) ile `User` tablosu arasında ASLA `onDelete: Cascade` (Django: `models.CASCADE`, Laravel: `cascadeOnDelete()`) KULLANILAMAZ. Mutlaka `onDelete: SetNull` veya `nullOnDelete()` kullanılmalıdır.
2. **MUST:** Kullanıcı silme talebinde (Right to be Forgotten / KVKK Md. 7) veriyi kalıcı olarak DROP etmek yerine kişisel sütunlar (ad, e-posta, telefon, TCKN) kriptografik hash ile ezilmeli (**Tombstone / Crypto-shredding**), `isAnonymized: true` ve `anonymizedAt: DateTime` alanları güncellenmelidir.
3. **MUST:** Veri Saklama ve İmha Politikası gereğince periyodik imha süresi en fazla **6 ay** olarak yapılandırılmalı ve tüm imha işlemleri denetim amacıyla en az **3 yıl** boyunca `ImhaLog` tablosunda saklanmalıdır.
4. **MUST:** Veritabanı şemasında her hassas sütun üzerine VERBİS süreç eşleme etiketleri eklenmelidir (`/// @compliance: KVKK_MD5_2C | Retention: 10Y | Category: IDENTITY`).

### B. Açık Rıza Yönetimi & Opt-Out Akışı
1. **MUST:** Aydınlatma Metni bir "onay kutusu" (checkbox) DEĞİLDİR. "Kayıt olarak Aydınlatma Metnini okuduğunuzu beyan edersiniz" şeklinde şeffaf bir bağlantı (link) olarak sunulmalıdır.
2. **NEVER:** Kullanım Koşulları ile Pazarlama/ETK onayı tek bir checkbox'ta birleştirilemez (`Bundled Consent` yasağı).
3. **NEVER:** Pazarlama veya ticari elektronik ileti onay kutuları `defaultChecked={true}` (pre-ticked) veya `required` olamaz.
4. **MUST:** Kullanıcının verdiği rızayı dilediği an kolayca geri alabilmesini (**opt-out**) sağlayan bir arayüz ve API (`revokeConsent`) sunulmalıdır.
5. **MUST:** Rıza geçmişi versiyonlanarak loglanmalı (`consent_history`) ve rıza geri çekildiğinde downstream pazarlama entegrasyonlarına (CRM, e-posta listeleri) otomatik iletilmelidir.

### C. Çerez Politikası ve Consent Management Platform (CMP)
1. **MUST:** KVKK Haziran 2022 Çerez Rehberi uyarınca çerezler kategorize edilmelidir:
   - **Zorunlu Çerezler (Strictly Necessary):** Oturum, sepet ve güvenlik için zorunludur; açık rıza aranmaz.
   - **İşlevsel Çerezler (Functional):** Dil tercihi vb.; açık rıza gerektirir.
   - **Analitik / Performans Çerezleri (Analytics):** Ziyaretçi analitiği (Google Analytics, Hotjar); **önceden açık rıza (prior consent)** olmadan çalıştırılamaz.
   - **Pazarlama / Hedefleme Çerezleri (Marketing):** Facebook Pixel, Google Ads vb.; **önceden açık rıza** olmadan yüklenemez.
2. **MUST:** Çerez onay banner'ında **"Tümünü Kabul Et"** butonu ile tamamen aynı görsel hiyerarşiye, büyüklüğe ve renge sahip **"Tümünü Reddet" (Symmetric Reject Button)** seçeneği bulunmalıdır.
3. **NEVER:** Kullanıcının siteyi kullanmasını çerez iznine bağlayan "Cookie Wall" veya manipülatif tasarım desenleri (Dark Patterns) uygulanamaz.

### D. Yurt Dışına Veri Aktarımı ve Veri Yerleşimi (KVKK Md. 9 — 2024 Reformu)
1. **MUST:** Türkiye sınırları içerisindeki kullanıcılara ait kimlik, finansal ve sağlık verileri varsayılan olarak Türkiye bölgesi (TR Region) sunucularında saklanmalı; coğrafi yönlendirme (**Geo-Fencing / Data Residency**) mimarisi uygulanmalıdır.
2. **MUST:** Yurt dışına veri aktarılacaksa (OpenAI, AWS, Resend, Vercel), Standart Sözleşme (SCC), Bağlayıcı Şirket Kuralları (BCR) veya Taahhütname dayanağı doğrulanmalıdır.
3. **MUST:** Standart Sözleşme (SCC) imzalanmasından itibaren **en geç 5 iş günü içinde** Kurul'a fiziken veya KEP üzerinden bildirim yapılmalıdır.
4. **NEVER:** Uygun güvence veya açık rıza olmaksızın yurt dışı API'lere açık PII (TCKN, ad-soyad, telefon) gönderilemez.

### E. Veri Sahibi Başvuru Süreçleri (DSR — KVKK Md. 11 & 13)
1. **MUST:** Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ Md. 5/2 gereğince başvurularda şu alanlar zorunlu tutulmalıdır: Ad-soyad, ıslak imza veya güvenli elektronik imza/mobil imza, TCKN (yabancılar için pasaport no), tebligat adresi, bildirim e-posta/telefonu, talep konusu.
2. **MUST:** Başvurular en geç **30 gün içinde** sonuçlandırılmalıdır. Bu süre kanunen **UZATILAMAZ** (GDPR'daki 1+2 ay esnekliği KVKK'da yoktur).
3. **MUST:** Düzeltme veya silme işlemi tamamlandığında, verilerin aktarıldığı tüm üçüncü partilere bildirim yapılmalıdır (**Downstream Notification** - KVKK Md. 11/1-f).

### F. 72 Saatlik Veri İhlal Bildirimi (KVKK Md. 12 & Kurul 2019/10 Kararı)
1. **MUST:** Kişisel verilerin hukuka aykırı şekilde ele geçirildiği öğrenildiği andan itibaren **en geç 72 saat içinde** Kurul'a ve ilgili kişilere bildirim yapılmalıdır.
2. **MUST:** Kurul'un 2019/10 sayılı İlke Kararı Formundaki 6 temel alan hazır bulundurulmalıdır:
   - İhlalin gerçekleşme ve öğrenilme tarihi
   - İhlalin kaynağı ve gerçekleşme şekli
   - Etkilenen kişisel veri kategorileri
   - Etkilenen yaklaşık kişi sayısı
   - İhlalin olası sonuçları ve doğuracağı riskler
   - Alınan ve alınması planlanan idari ve teknik tedbirler
3. **MUST:** Tüm güvenlik olayları, Kurul bildirim eşiğinin altında kalsa dahi gerekçeleriyle birlikte şirket içi **İhlal Kayıt Defteri'nde (Incident Register)** belgelenmelidir.

### G. VERBİS Yükümlülükleri ve Eşik Kriterleri
1. **MUST (Yurt Dışı Veri Sorumluları):** Türkiye'de yerleşik olmayan veri sorumluları (yabancı SaaS / web platformları), Türkiye'deki kişilerin verilerini işliyorsa, çalışan sayısı veya mali bilanço tutarına bakılmaksızın **Türkiye Temsilcisi atamak ve VERBİS'e kayıt olmak ZORUNDADIR**.
2. **MUST (Türkiye İçi Veri Sorumluları):** Yıllık çalışan sayısı 50'den çok veya yıllık mali bilanço toplamı 100 milyon TL'den çok olan gerçek ve tüzel kişi veri sorumluları VERBİS'e kaydolmak zorundadır. Ana faaliyeti özel nitelikli kişisel veri işleme olanlar (özel hastane, poliklinik, eczane) çalışan ve bilanço şartı aranmaksızın kayıt yükümlüsüdür.
3. **MUST:** Veri İşleme Envanteri (RoPA) hazırlanmalı ve güncel tutulmalıdır.

### H. SMS Doğrulama Kodu (OTP) ve Pazarlama İzni Ayrımı (İlke Kararı 2025/1072)
1. **NEVER:** Kullanıcıya üyelik, oturum açma veya ödeme onayı için gönderilen SMS doğrulama kodunun (OTP) girildiği ekranda ticari elektronik ileti veya pazarlama açık rızası onaylatılamaz.
2. **NEVER:** "Doğrulama kodunu girerek ticari elektronik ileti almayı da kabul etmiş olursunuz" şeklinde "Tek Tıkla" çoklu onay / örtülü rıza dayatılamaz (Resmî Gazete: 26 Haziran 2025, Sayı: 32938).
3. **MUST:** İşlem güvenliği doğrulama akışı ile pazarlama/reklam rıza toplama adımları hem mantıksal hem arayüz olarak tamamen birbirinden ayrılmalıdır.

### I. Toplu E-posta Güvenliği ve Zorunlu BCC Kuralı (Kurul Karar 2019/331 & 2020/67)
1. **NEVER:** Birden fazla alıcıya gönderilen duyuru, bülten veya bilgilendirme e-postalarında alıcı adresleri `to` veya `cc` başlıklarında açık dizi (`to: ['a@x.com', 'b@y.com']`) olarak gönderilemez. Bu durum diğer alıcıların kişisel verilerinin hukuka aykırı ifşasıdır.
2. **MUST:** Toplu e-posta gönderimlerinde ya her kullanıcıya ayrı ayrı münferit tekil e-posta gönderilmeli ya da alıcılar zorunlu olarak `bcc` (Gizli Karbon Kopya) alanına yazılmalıdır.
3. **MUST:** E-posta gönderim kütüphanelerinde (Nodemailer, Resend, SendGrid vb.) `validateBulkEmailOptions` filtresi uygulanarak açık `to`/`cc` sızıntısı engellenmelidir.

### J. KVKK Md. 12 Teknik Güvenlik Tedbirleri (Brute-Force, Rate Limiting & 2FA/MFA)
1. **MUST:** Giriş, şifre sıfırlama ve SMS/OTP doğrulama uç noktalarında IP ve hesap bazlı Rate Limiting uygulanmalıdır (örn. dakikada en fazla 5 deneme).
2. **MUST:** Ardışık 5 başarısız parola giriş denemesinde hesap kaba kuvvet (Brute-force) saldırılarına karşı en az 15 dakika süreyle geçici olarak kilitlenmelidir (Account Lockout).
3. **MUST:** Yönetici panellerinde, hassas işlem adımlarında ve özel nitelikli kişisel veri erişiminde İki Faktörlü Kimlik Doğrulama (2FA/MFA) zorunlu tutulmalıdır.

### K. Hizmetin Açık Rıza Ön Şartına Bağlanması Yasağı (Amazon 2020/173, WhatsApp 2021/898)
1. **NEVER:** Bir ürünün satın alınması, üyelik oluşturulması veya bir özelliğin kullanılması pazarlama ileti onayına veya yurt dışı veri aktarımına zorunlu ön şart kılınamaz.
2. **MUST:** Kullanıcı açık rıza vermeyi reddetse dahi platformun temel fonksiyonlarından (üyelik, alışveriş, sipariş takibi) eksiksiz olarak yararlanabilmelidir.

---

## 3. Çoklu Framework Referans Uygulamaları

### A. Prisma (VERBİS Etiketleri & SetNull & Zarf Şifreleme)
```prisma
model User {
  id             String    @id @default(uuid())
  /// @compliance: KVKK_MD5_2C | Category: IDENTITY | Retention: MEMBERSHIP_PLUS_10Y
  email          String    // Anonimleştiğinde: "anonymized-{hash}@erased.local"
  name           String    // Anonimleştiğinde: "ANONİM KULLANICI"
  tckn           String?   // Anonimleştiğinde: null
  phone          String?   // Anonimleştiğinde: null
  isAnonymized   Boolean   @default(false)
  anonymizedAt   DateTime?
  tombstoneHash  String?
  createdAt      DateTime  @default(now())

  // VUK Md. 253 & TTK Md. 82: Fatura korunur
  invoices       Invoice[]
}

model Invoice {
  id          String   @id @default(uuid())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  amountCents Int
  taxNumber   String
  createdAt   DateTime @default(now()) // 5 yıl yasal saklama
}

// KVKK Md. 6 Özel nitelikli veriler zarf şifreli saklanır
model EncryptedHealthRecord {
  id            String   @id @default(uuid())
  userId        String   @unique
  encryptedData String   // DEK ile AES-256-GCM
  encryptedKey  String   // KMS KEK ile şifreli DEK
  iv            String
  tag           String
  updatedAt     DateTime @updatedAt
}
```

### B. Simetrik Reddetme Butonlu Çerez Banner (KVKK Çerez Rehberi Uyumlu)
```tsx
import React from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

export function KvkkCookieBanner() {
  const { acceptAll, rejectAll, openPreferences } = useCookieConsent();

  return (
    <aside 
      role="dialog" 
      aria-label="Çerez Tercihleri" 
      className="fixed bottom-0 inset-x-0 p-4 bg-white border-t border-neutral-200 shadow-2xl z-50 flex flex-col md:flex-row items-center justify-between gap-4"
    >
      <div className="text-sm text-neutral-700 max-w-3xl">
        <p>
          Sitemizde hizmet sunumu için zorunlu çerezler kullanılmaktadır. Detaylı bilgi için{" "}
          <a href="/cerez-politikasi" target="_blank" className="underline font-medium text-blue-600">
            Çerez Politikası ve Aydınlatma Metnini
          </a>{" "}
          inceleyebilirsiniz. İsteğe bağlı analitik ve pazarlama çerezlerini kabul edebilir veya reddedebilirsiniz.
        </p>
      </div>

      {/* KVKK Kuralı: Kabul ve Red butonları tamamen simetrik ve eşit hiyerarşide olmalıdır! */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={rejectAll}
          className="px-4 py-2 text-sm font-medium rounded-md border border-neutral-400 bg-white text-neutral-800 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          Tümünü Reddet
        </button>
        <button
          type="button"
          onClick={openPreferences}
          className="px-4 py-2 text-sm font-medium rounded-md border border-neutral-300 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
        >
          Tercihleri Yönet
        </button>
        <button
          type="button"
          onClick={acceptAll}
          className="px-4 py-2 text-sm font-medium rounded-md border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-800"
        >
          Tümünü Kabul Et
        </button>
      </div>
    </aside>
  );
}
```


---

## 8. Emsal Kurul Kararları ve Yazılım Anti-Desenleri (Landmark Enforcement)

> **Doğrulama notu:** Aşağıda yalnızca karar numarası ve tarihi birden fazla kaynakta doğrulanabilen atıflar yer alır. Doğrulanamayan Kurul karar numaraları bilinçli olarak yazılmamış, ilgili kanun maddesine atıf yapılmıştır. Her atıf yayımlanmadan önce [kvkk.gov.tr](https://www.kvkk.gov.tr) Karar Özetleri bölümünden bir hukukçu tarafından teyit edilmelidir.

### 8.1 SMS / OTP Doğrulama Kodu ile Rıza Birleştirme Yasağı
- **Dayanak:** KVKK Kurulu 10.06.2025 tarihli ve **2025/1072** sayılı İlke Kararı (Resmî Gazete 26.06.2025, sayı 32938); 6563 s. ETK Md. 6; KVKK Md. 3(1)(a) ve Md. 5.
- **Kural:** Tek bir SMS doğrulama koduyla üyelik sözleşmesi, ticari elektronik ileti izni ve kişisel veri işleme izninin birlikte alınması yasaktır. Kodun amacı SMS metninde ve görevli tarafından açıkça belirtilmelidir. Kod verilmese de hizmet sunulmalıdır.
- **İlgili emsal:** Kurul 2020/173 (Amazon Türkiye): Siteyi ziyaret etmek veya kullanım şartlarını onaylamak ticari ileti için geçerli açık rıza yerine geçmez.
- **MUST:** OTP doğrulama uç noktası yalnızca doğrulama alanlarını günceller (`assertOtpEffectsAreSeparated`).
- **NEVER:** `data: { phoneVerified: true, marketingConsent: true }`.
- **Otomasyon:** Linter `no-bundled-otp-marketing`, kural `kvkk-otp-marketing-decoupling`, primitif `otp-consent-separator`.

### 8.2 Toplu E-postada Alıcı Adreslerinin İfşası
- **Dayanak:** KVKK Md. 12(1) (teknik tedbir) ve Md. 18/1-b.
- **Kural:** Birden fazla alıcıya giden duyuru, fatura veya bilgilendirme iletilerinde adreslerin `to`/`cc` alanında görünmesi kişisel verinin yetkisiz ifşasıdır. Alıcı başına ayrı zarf veya `bcc` kullanılmalıdır.
- **Otomasyon:** Linter `enforce-bcc-bulk-email`, kural `kvkk-email-bcc-safety`, primitif `email-safety`.

### 8.3 Giriş Güvenliği: Rate Limit, Kilitleme ve MFA
- **Dayanak:** KVKK Md. 12(1) — "teknolojinin ulaştığı seviyeye uygun" teknik tedbir. Brute-force ve credential-stuffing ile hesap ele geçirilen vakalarda Kurul rate limit, kilitleme ve çok faktörlü doğrulama eksikliğini veri sorumlusu kusuru olarak değerlendirir.
- **MUST:** IP ve hesap bazlı rate limit; eşik aşımında geçici kilit ve MFA; hesap varlığını sızdırmayan hata mesajı.
- **Otomasyon:** Kural `sec-auth-rate-limit-mfa`, primitif `rate-limit-shield`.

### 8.4 Hizmetin Rızaya Bağlanması (Bağlı Rıza)
- **Dayanak:** KVKK Md. 3(1)(a) (özgür irade) ve Kurul'un 2019/09 sayılı İlke Kararı. Üyelik veya hizmet için pazarlama ya da yurt dışı aktarım rızasını zorunlu kılmak rızayı sakatlar.
- **Otomasyon:** Linter `no-bundled-consent`, `no-preticked-consent`.

### 8.5 Yurt Dışı Aktarım Bildirimi (2024 Reformu)
- **Dayanak:** 7499 s. Kanun ile değişen KVKK Md. 9 (1 Haziran 2024). Standart sözleşmelerin imzadan itibaren **5 iş günü** içinde Kurum'a bildirilmesi gerekir; bildirmemenin idari para cezası Md. 18'de düzenlenmiştir.
- **Teknik sonuç:** Kod tabanına yeni bir yurt dışı servis (OpenAI, AWS, Supabase, Resend) eklendiğinde bildirim takvimi tetiklenmelidir (`geo-router`).
