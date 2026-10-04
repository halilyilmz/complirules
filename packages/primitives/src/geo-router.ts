/**
 * KVKK Madde 9 (12 Mart 2024 Reformu) ve GDPR Madde 44+ Sınır Ötesi Veri Aktarımı
 * Coğrafi Yönlendirme (Geo-Routing) ve Veri Yerleşimi (Data Residency) Primitifi
 */

export type DataResidencyRegion = 'TR_LOCAL' | 'EU_LOCAL' | 'US_GLOBAL' | 'THIRD_COUNTRY';

export type CrossBorderTransferBasis = 
  | 'ADEQUACY_DECISION'           // Yeterlilik Kararı (KVKK Md. 9/1, GDPR Art. 45)
  | 'STANDARD_CONTRACTUAL_CLAUSES'// Standart Sözleşme - SCC (KVKK Md. 9/4-c, GDPR Art. 46)
  | 'BINDING_CORPORATE_RULES'     // Bağlayıcı Şirket Kuralları - BCR (KVKK Md. 9/4-a)
  | 'WRITTEN_UNDERTAKING'         // Taahhütname ve Kurul İzni (KVKK Md. 9/4-ç)
  | 'EXPLICIT_CONSENT'            // İstisnai durumlarda Açık Rıza (Arızi aktarım)
  | 'NONE';                       // Hukuki dayanak yok (Aktarım yasak!)

export interface CrossBorderRoutingDecision {
  allowed: boolean;
  legalBasis: CrossBorderTransferBasis;
  targetRegion: DataResidencyRegion;
  requiresKurulSccNotification: boolean;
  sccNotificationDeadlineBusinessDays?: number;
  reason: string;
}

const EU_EEA_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO'
]);

export class GeoRouter {
  /**
   * KVKK Md. 9 2024 reformuna göre Türkiye'deki kullanıcı verilerinin yurt dışına çıkışını denetler.
   */
  static evaluateTransfer(params: {
    originCountry: 'TR' | 'EU' | 'OTHER';
    destinationCountry: string;
    hasAdequacyDecision?: boolean;
    hasExecutedScc?: boolean;
    hasApprovedBcr?: boolean;
    hasKurulUndertakingApproval?: boolean;
    hasExplicitConsent?: boolean;
    isOccasional?: boolean; // Arızi aktarım mı?
  }): CrossBorderRoutingDecision {
    const dest = params.destinationCountry.toUpperCase().trim();
    const isDomesticTR = params.originCountry === 'TR' && dest === 'TR';
    const isDomesticEU = params.originCountry === 'EU' && EU_EEA_COUNTRIES.has(dest);

    // 1. Ülke içi / Birlik içi aktarımlar serbesttir
    if (isDomesticTR) {
      return {
        allowed: true,
        legalBasis: 'ADEQUACY_DECISION',
        targetRegion: 'TR_LOCAL',
        requiresKurulSccNotification: false,
        reason: 'Veri Türkiye sınırları içinde kalmaktadır (Data Residency / Yerel Barındırma).'
      };
    }

    if (isDomesticEU) {
      return {
        allowed: true,
        legalBasis: 'ADEQUACY_DECISION',
        targetRegion: 'EU_LOCAL',
        requiresKurulSccNotification: false,
        reason: 'Veri Avrupa Birliği ve AEA (GDPR) sınırları içinde kalmaktadır.'
      };
    }

    // 2. Yurt dışı aktarım: Türkiye çıkışlı veri
    if (params.originCountry === 'TR') {
      if (params.hasAdequacyDecision) {
        return {
          allowed: true,
          legalBasis: 'ADEQUACY_DECISION',
          targetRegion: 'THIRD_COUNTRY',
          requiresKurulSccNotification: false,
          reason: 'Hedef ülke için KVKK Kurul yeterlilik kararı mevcuttur (KVKK Md. 9/1).'
        };
      }

      if (params.hasExecutedScc) {
        return {
          allowed: true,
          legalBasis: 'STANDARD_CONTRACTUAL_CLAUSES',
          targetRegion: 'THIRD_COUNTRY',
          requiresKurulSccNotification: true,
          sccNotificationDeadlineBusinessDays: 5,
          reason: 'Standart Sözleşme (SCC) imzalanmıştır. KVKK Yönetmeliği gereğince 5 İŞ GÜNÜ İÇİNDE Kurul\'a bildirim zorunludur.'
        };
      }

      if (params.hasApprovedBcr) {
        return {
          allowed: true,
          legalBasis: 'BINDING_CORPORATE_RULES',
          targetRegion: 'THIRD_COUNTRY',
          requiresKurulSccNotification: false,
          reason: 'Kurul onaylı Bağlayıcı Şirket Kuralları (BCR) mevcuttur.'
        };
      }

      if (params.hasKurulUndertakingApproval) {
        return {
          allowed: true,
          legalBasis: 'WRITTEN_UNDERTAKING',
          targetRegion: 'THIRD_COUNTRY',
          requiresKurulSccNotification: false,
          reason: 'Kurul izinli Taahhütname mevcuttur.'
        };
      }

      if (params.hasExplicitConsent && params.isOccasional) {
        return {
          allowed: true,
          legalBasis: 'EXPLICIT_CONSENT',
          targetRegion: 'THIRD_COUNTRY',
          requiresKurulSccNotification: false,
          reason: 'Arızi durumlar için ilgili kişinin açık rızası alınmıştır (KVKK Md. 9/6).'
        };
      }

      return {
        allowed: false,
        legalBasis: 'NONE',
        targetRegion: 'TR_LOCAL',
        requiresKurulSccNotification: false,
        reason: 'KVKK Madde 9 ihlali: Standart Sözleşme, BCR veya yeterlilik kararı olmaksızın yurt dışına veri aktarılamaz!'
      };
    }

    return {
      allowed: true,
      legalBasis: 'ADEQUACY_DECISION',
      targetRegion: 'THIRD_COUNTRY',
      requiresKurulSccNotification: false,
      reason: 'Diğer bölge yönlendirmesi.'
    };
  }
}
