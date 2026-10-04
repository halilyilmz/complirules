# 🇪🇺 European Union General Data Protection Regulation (GDPR) Architecture Standards

> **Scope:** Mandatory technical and data privacy standards for all SaaS, mobile, and web applications handling personal data of EU residents under Regulation (EU) 2016/679.  
> **Official Statutory Reference:** [`docs/regulations/sources/GDPR-Regulation-2016-679-Official.pdf`](./sources/GDPR-Regulation-2016-679-Official.pdf)

---

## 1. Statutory Grounding & Legal Invariants

| Article | Legal Provision | Architectural Mandate | Penalty Risk |
| :--- | :--- | :--- | :--- |
| **Article 5(1)(c)** | **Data Minimization** | Collect and process only data strictly necessary for specified purposes. | Up to €20M or 4% of global annual turnover. |
| **Article 7(3)** | **Withdrawal of Consent** | Data subjects must be able to withdraw consent at any time. Withdrawal **must be as easy as giving consent**. Explicit opt-out flow and versioned consent history required. | GDPR Article 83 administrative fines. |
| **Article 7(4)** | **Freely Given Consent** | Consent cannot be coerced or bundled with service agreements (bundled consent prohibition). | Administrative sanctions. |
| **Article 12(3)** | **DSR Response SLA** | Data Subject Requests must be answered **within 1 month** of receipt. Can be extended by **2 further months** only where necessary due to complexity/volume, provided notification is sent within month 1. | Supervisory enforcement orders. |
| **Article 17** | **Right to Erasure ("Forgotten")** | Local database de-identification + purging across third parties (Stripe, PostHog, Resend). | Severe data subject infringement sanctions. |
| **Article 17(3)(b) & (e)** | **Exceptions to Erasure** | Financial and accounting records cannot be erased due to statutory tax/accounting retention laws; user relationship must be unlinked (`onDelete: SetNull`). | Tax and commercial audit violations. |
| **Article 20** | **Right to Data Portability** | User data must be exportable in a structured, commonly used, and machine-readable format (`JSON`/`CSV`). | Data subject rights infringement penalties. |
| **Article 33 & 34** | **72-Hour Breach Notification** | In the event of a personal data breach, notify the competent supervisory authority **within 72 hours** of becoming aware. Notify affected data subjects without undue delay if high risk (Art. 34). Document all breaches in internal register (Art. 33(5)). | Tier 2 fines (up to €10M or 2% turnover). |
| **Article 8** | **Child's Consent & Age Gates** | Parental consent verification required for children under 16 (or national limit down to 13). | Child protection violation (highest severity). |
| **Article 25** | **Privacy by Design & Default** | Default privacy configuration: No tracking cookies or analytics before prior explicit opt-in (CMP Prior Consent). | Regulatory compliance audit failures. |
| **Article 30** | **Records of Processing (RoPA)** | Traceable inventory mapping data categories, retention periods, recipients, and security measures. | Mandatory regulatory compliance audits. |
| **Article 44+** | **Cross-Border Transfers** | No raw IP or PII transfer to uncertified US/third-party endpoints without SCCs or Adequacy Decisions (Schrems II). | Injunctions and per-user infringement fines. |
| **LG München I & CJEU Breyer** | **Remote Assets & Image Hotlinking IP Leaks** | Dynamically referencing third-party images (`<img src="https://...">`), Gravatar avatars, or un-hosted remote fonts leaks visitor IP addresses to external servers without consent. Must use backend asset proxy or self-host. | Civil damages (€100+ per visitor), injunctions, Abmahnung notices & GDPR fines. |

---

## 2. Invariants for AI Coding Subagents

### A. Erasure & Third-Party Cleanup Pipeline (Article 17)
1. **MUST:** Right to be Forgotten requests must trigger an asynchronous de-identification job that purges user identities across connected external integrations (CRM, analytics, transactional email).
2. **MUST:** Implement crypto-shredding: erase or rotate the user-specific encryption key, rendering historical backup logs mathematically unrecoverable.
3. **MUST:** Finansal modeller (`Invoice`, `Payment`, `Order`) ile `User` tablosu arasında `onDelete: Cascade` KULLANILAMAZ (Article 17(3)(b) istisnası). Kullanıcı silindiğinde fatura saklanmalı, yalnızca kullanıcı ilişkisi `SetNull` yapılmalıdır.

### B. Consent Management Platform (CMP) & Easy Opt-Out (Article 7(3))
1. **MUST:** Consent withdrawal must be as straightforward as giving consent. Provide a persistent "Cookie Settings" / "Privacy Preferences" center where users can toggle off individual consent categories.
2. **MUST:** Block third-party tracking scripts (Hotjar, Google Analytics, Meta Pixel) from loading prior to explicit cookie banner opt-in (**Prior Consent Gating**).
3. **NEVER:** Link to Google Fonts or remote unauthenticated CDNs (`fonts.googleapis.com`) without user consent. Fonts must be self-hosted via local bundles (`next/font/local` or `@fontsource/*`).

### C. 72-Hour Personal Data Breach Protocol (Article 33 & 34)
1. **MUST:** Implement an automated incident timer calculating remaining hours until the 72-hour supervisory authority notification deadline.
2. **MUST:** Maintain an internal **Breach Register** documenting the facts, effects, and remedial actions for all security incidents per Article 33(5).

### D. Data Subject Request (DSR) SLA Engine (Article 12(3))
1. **MUST:** Track all incoming access, portability, rectification, or erasure requests with a strict 30-day (1 calendar month) initial SLA timer.
2. **MUST:** Require recorded formal justification before applying any 2-month extension under Article 12(3).

### E. Data Portability (Article 20)
1. **MUST:** Provide a structured export endpoint (`GET /api/user/export` / `generateDataPortabilityBundle`) containing user profile, activity logs, and consent records in machine-readable JSON format with an integrity SHA-256 checksum.

### F. Remote Asset, Hotlinked Image & Proxying Standards (LG München I & CJEU Breyer C-582/14)
1. **NEVER:** Directly link un-proxied third-party images (`<img src="https://external-domain.com/..." />`), Gravatar profiles, or external media in client-side HTML/JSX where the client's browser is forced to connect to foreign servers, leaking user IP, User-Agent, and Referer headers.
2. **MUST:** Route external images through a **Server-Side Asset Proxy / Cache** (e.g. `createSecureAssetProxyUrl(url)` or Next.js Image Optimization / backend reverse proxy) so that external hosts never receive end-user IP addresses.
3. **MUST:** Validate and sanitize external image URLs to prevent Server-Side Request Forgery (SSRF) against internal or private IP ranges (`127.0.0.1`, `192.168.*`, `10.*`).


---

## 8. Emsal AB / Almanya Kararları ve Yazılım Anti-Desenleri

> **Doğrulama notu:** Atıflar CJEU, CNIL ve DSK yayınlarına dayanır; yayımdan önce [curia.europa.eu](https://curia.europa.eu) ve [cnil.fr](https://www.cnil.fr) üzerinden hukukçu teyidi alınmalıdır.

| Karar | Ne Cezalandırılıyor | Yazılım Karşılığı | Otomasyon |
| :--- | :--- | :--- | :--- |
| **CJEU C-582/14 Breyer** & **LG München I (3 O 17493/20)** | Dinamik IP kişisel veridir; harici font/resim/Gravatar hotlink'i IP ve Referer sızdırır | Sunucu taraflı asset proxy veya self-host | `no-unproxied-remote-images`, `no-remote-google-fonts` |
| **CJEU C-40/17 Fashion ID** (29.07.2019) | Sosyal eklenti gömen site, toplama ve aktarımda ortak veri sorumlusudur | Eklentiyi kullanıcı tıklamadan yüklememek | `no-direct-external-embeds` |
| **DSK Telemedya Rehberi / TDDDG § 25** | YouTube, Vimeo, Maps iframe'i (youtube-nocookie dahil) sayfa açılınca IP iletir | İki tıklamalı çözüm (Zwei-Klick-Lösung) | `no-direct-external-embeds`, `two-click-embed` |
| **CNIL SAN-2023-003 Cityscoot** (16.03.2023) | reCAPTCHA "kesinlikle gerekli" muafiyetine girmez, ön rıza gerekir; aynı kararda aşırı konum takibi ve alt işleyen sözleşmesi eksikliği de ihlal sayıldı | Proof-of-Work captcha veya rıza kapısı | `no-ungated-recaptcha` |
| **CNIL e-posta piksel tavsiyesi** (uyum süresi 14.07.2026), İtalyan Garante | 1x1 açılma pikseli ayrı ön rıza gerektirir | Varsayılan olarak kapalı takip, `stripTrackingBeacons` | `email-safety` |
| **CJEU C-252/21 Meta v. Bundeskartellamt** (04.07.2023) | Üçüncü taraf izleme meşru menfaat veya sözleşmeyle haklı gösterilemez | Rıza (Md. 6/1-a) | `no-ungated-analytics-scripts` |
| **CJEU C-300/21 Österreichische Post** (04.05.2023) | Manevi tazminat için asgari eşik yoktur; tek bir rızasız istek bile toplu dava ve ihtar riski taşır | Harici istek sayısını sıfıra indirmek | Tüm yukarıdakiler |

### Açık Riskler (Kod Çözemez)
- **EU-US Data Privacy Framework:** Genel Mahkeme nezdinde *Latombe v. Commission* (T-553/23) davası sürmektedir. DPF iptal edilirse ABD sağlayıcıları yeniden SCC rejimine döner; her sağlayıcı için AB içi yedek (fallback) planı tutun.
- **Server-Side Tagging:** sGTM sunucusu AB dışında barınıyorsa kullanıcı IP'si yine üçüncü ülkeye gider (Md. 44); sunucu bölgesini AB'de tutun.
