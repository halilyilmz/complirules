# 🇺🇸 ABD Eyalet Gizlilik ve FTC Standartları (CCPA/CPRA, GPC, COPPA)

> **Kapsam:** California CCPA/CPRA, Colorado Privacy Act ve federal COPPA kapsamındaki web/mobil uygulamalar.
> **Doğrulama notu:** Atıflar mevzuat ve California AG/FTC duyurularına dayanır; yayımdan önce hukukçu teyidi alın.

---

## 1. Global Privacy Control (GPC)

| Konu | Dayanak | Kural |
| :--- | :--- | :--- |
| `Sec-GPC: 1` başlığı ve `navigator.globalPrivacyControl` | **11 CCR § 7025** (opt-out preference signals) | Sinyal, kişisel verinin satışı/paylaşımı için bağlayıcı opt-out talebidir |
| Oturum açmış kullanıcı | **11 CCR § 7025(c)** | Sinyal kullanıcının profiline işlenir; hesap tercihiyle çelişirse işletme ancak kullanıcıyı bilgilendirip onay alarak devam edebilir, GPC'yi yok sayamaz |
| Colorado | **4 CCR 904-3, Rule 5.11** | Evrensel opt-out mekanizmaları tanınmalıdır |

**Yaptırım örnekleri:** California AG v. **Sephora** (2022, 1,2 M$) ve **DoorDash** (2024, 375.000 $).

### MUST
1. Her istekte `Sec-GPC` başlığını değerlendir (`evaluateGpcSignal`); değer tam olarak `1` ise opt-out aktiftir.
2. Aktifse marketing kategorisini kapat (`applyGpcToPreferences`) ve reklam piksellerini yükleme.
3. Oturum açmış kullanıcıda `ccpaOptedOut: true` değerini profile yaz.
4. Opt-out sonrasında üçüncü taraflara akışın gerçekten durduğunu ağ günlüğüyle doğrula.

**Otomasyon:** Linter `enforce-gpc-optout`, kural `ccpa-gpc-automated-optout`, primitif `gpc-evaluator`.

---

## 2. COPPA (15 U.S.C. §§ 6501-6506; 16 CFR Part 312)

- 13 yaş altı çocuklara yönelik hizmetlerde doğrulanabilir ebeveyn izni olmadan IP, cihaz kimliği ve çerez gibi **kalıcı tanımlayıcı** toplanamaz.
- **FTC v. Epic Games (2022):** COPPA için 275 M$ ceza (davranış kalıpları dahil toplam 520 M$).
- **MUST:** Çocuk rotalarında analitik ve kalıcı tanımlayıcıyı kapat; sohbeti varsayılan kapalı başlat.
- **Otomasyon:** Linter `no-pixel-on-sensitive-routes` (`/kids/`, `/children/`), primitif `sensitive-route-guard`.

---

## 3. Sağlık Verisi
FTC sağlık piksel yaptırımları (GoodRx, BetterHelp, Flo Health) ve HIPAA sınırı için bkz. [`04-HIPAA-US.md`](./04-HIPAA-US.md).
