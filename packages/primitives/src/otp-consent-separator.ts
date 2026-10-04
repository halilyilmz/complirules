/**
 * SMS/OTP Doğrulama ile Pazarlama Rızasının Ayrıştırılması
 *
 * Dayanak: KVKK Kurulu 10.06.2025 tarihli ve 2025/1072 sayılı İlke Kararı (RG 26.06.2025, 32938):
 * Tek bir SMS doğrulama koduyla üyelik, ticari elektronik ileti ve kişisel veri işleme izinlerinin
 * birlikte alınması yasaktır; kodun amacı SMS içeriğinde açıkça belirtilmelidir; kod girilmese
 * de hizmet sunulmalıdır. Ayrıca 6563 s. ETK Md. 6 ve KVKK Md. 3(1)(a) (özgür irade).
 */

export type OtpPurpose = 'login' | 'payment' | 'phone_verification' | 'password_reset';

export interface OtpVerificationRequest {
  userId: string;
  purpose: OtpPurpose;
  code: string;
}

export interface OtpVerificationEffects {
  phoneVerified?: boolean;
  /** OTP doğrulama sonucu bu alanlar ASLA set edilemez. */
  marketingConsent?: boolean;
  etkConsent?: boolean;
  dataProcessingConsent?: boolean;
}

const FORBIDDEN_EFFECT_KEYS = ['marketingConsent', 'etkConsent', 'dataProcessingConsent'] as const;

/**
 * OTP doğrulaması sonucunda uygulanacak yan etkileri denetler.
 * Rıza alanlarından herhangi biri varsa hata fırlatır (2025/1072).
 */
export function assertOtpEffectsAreSeparated(effects: OtpVerificationEffects): void {
  for (const key of FORBIDDEN_EFFECT_KEYS) {
    if (effects[key] !== undefined) {
      throw new Error(
        `OTP_CONSENT_BUNDLING: OTP doğrulaması "${key}" alanını değiştiremez. Rıza ayrı, açık bir eylemle alınmalıdır (KVKK Kurulu 2025/1072).`
      );
    }
  }
}

/**
 * KVKK 2025/1072 uyumlu SMS metni: amacı açıkça belirtir ve rıza ima etmez.
 */
export function buildOtpSmsText(purpose: OtpPurpose, code: string, brand: string): string {
  const purposes: Record<OtpPurpose, string> = {
    login: 'giriş doğrulaması',
    payment: 'ödeme onayı',
    phone_verification: 'telefon numarası doğrulaması',
    password_reset: 'şifre sıfırlama'
  };
  return `${brand}: ${code} kodu yalnızca ${purposes[purpose]} içindir. Bu kodu paylaşmanız herhangi bir pazarlama veya ticari ileti izni anlamına gelmez.`;
}
