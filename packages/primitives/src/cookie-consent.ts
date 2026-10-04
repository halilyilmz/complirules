/**
 * KVKK Çerez Uygulamaları Hakkında Rehber (Haziran 2022) & GDPR ePrivacy Direktifi
 * Kategori Bazlı Çerez ve Rıza Yönetimi (Consent Management Platform - CMP) Primitifi
 */

export type CookieCategory = 
  | 'strictly_necessary' // Zorunlu çerezler (Oturum, güvenlik, sepet - Açık rıza aranmaz)
  | 'functional'         // İşlevsel çerezler (Dil, tema tercihleri - Açık rıza aranır)
  | 'analytics'          // Analitik/Performans (Google Analytics, PostHog - Önceden açık rıza şart)
  | 'marketing';         // Pazarlama/Hedefleme (Meta Pixel, Google Ads - Önceden açık rıza şart)

export interface CookiePreferences {
  strictly_necessary: true; // Her zaman true olmalıdır
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentRecord {
  id: string;
  userId?: string;
  preferences: CookiePreferences;
  policyVersion: string;
  consentTimestamp: number;
  expiryTimestamp: number; // 12 ay sonra yenilenmelidir
  ipHash?: string;
}

export interface SymmetricCookieBannerConfig {
  acceptAllText: string;
  rejectAllText: string;
  managePreferencesText: string;
  isSymmetric: boolean;
  cookiePolicyUrl: string;
  noticeText: string;
}

export class CookieConsentManager {
  /**
   * KVKK ve GDPR gereği varsayılan tercihler:
   * Yalnızca zorunlu çerezler etkindir; analitik ve pazarlama varsayılan olarak kapalıdır (Opt-in ilkesi).
   */
  static createDefaultPreferences(): CookiePreferences {
    return {
      strictly_necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
  }

  /**
   * Belirtilen çerez kategorisinin kullanıcı tarafından onaylanıp onaylanmadığını doğrular.
   * Zorunlu çerezler daima true döner; diğerleri kullanıcının açık rızasına bağlıdır.
   */
  static isCategoryAllowed(preferences: CookiePreferences | null | undefined, category: CookieCategory): boolean {
    if (category === 'strictly_necessary') return true;
    if (!preferences) return false;
    return Boolean(preferences[category]);
  }

  /**
   * KVKK ve GDPR uyumlu "Tümünü Reddet" tercihi:
   * Sadece zorunlu çerezler true, diğer tüm opsiyonel çerezler false döner.
   */
  static createRejectAllPreferences(): CookiePreferences {
    return {
      strictly_necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    };
  }

  /**
   * "Tümünü Kabul Et" tercihi:
   * Tüm çerez kategorileri onaylanır.
   */
  static createAcceptAllPreferences(): CookiePreferences {
    return {
      strictly_necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    };
  }

  /**
   * KVKK rehberi uyarınca en fazla 12 ay geçerli çerez onay kaydı üretir.
   */
  static createConsentRecord(params: {
    userId?: string;
    preferences?: Partial<CookiePreferences>;
    policyVersion?: string;
    maxAgeMonths?: number;
    ipHash?: string;
  }): CookieConsentRecord {
    const now = Date.now();
    const months = params.maxAgeMonths ?? 12;
    const expiryTimestamp = now + months * 30 * 24 * 60 * 60 * 1000;
    const prefs = params.preferences ?? {};

    const consolidatedPreferences: CookiePreferences = {
      strictly_necessary: true,
      functional: Boolean(prefs.functional),
      analytics: Boolean(prefs.analytics),
      marketing: Boolean(prefs.marketing)
    };

    return {
      id: `cookie_consent_${now}_${Math.random().toString(36).substring(2, 9)}`,
      userId: params.userId,
      preferences: consolidatedPreferences,
      policyVersion: params.policyVersion ?? 'v1.0',
      consentTimestamp: now,
      expiryTimestamp,
      ipHash: params.ipHash
    };
  }

  /**
   * Çerez rızasının süresinin dolup dolmadığını veya politika versiyonunun değişip değişmediğini kontrol eder.
   */
  static isConsentRenewalNeeded(
    record: CookieConsentRecord | null | undefined,
    currentPolicyVersion = 'v1.0',
    currentTimestamp = Date.now()
  ): boolean {
    if (!record) return true;
    if (record.policyVersion !== currentPolicyVersion) return true;
    if (currentTimestamp >= record.expiryTimestamp) return true;
    return false;
  }

  /**
   * KVKK Çerez Rehberi Simetrik Buton Kuralı:
   * "Tümünü Kabul Et" ve "Tümünü Reddet" butonları eşit büyüklükte, eşit zıtlıkta ve erişilebilir olmalıdır.
   */
  static getSymmetricBannerConfig(): SymmetricCookieBannerConfig {
    return {
      acceptAllText: 'Tümünü Kabul Et',
      rejectAllText: 'Tümünü Reddet',
      managePreferencesText: 'Tercihleri Yönet',
      isSymmetric: true,
      cookiePolicyUrl: '/cerez-politikasi',
      noticeText: 'Sitemizde deneyiminizi geliştirmek için çerezler kullanılmaktadır. Zorunlu çerezler haricindeki analitik ve pazarlama çerezlerini onaylayabilir veya reddedebilirsiniz.'
    };
  }
}
