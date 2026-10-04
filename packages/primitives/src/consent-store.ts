import { createHash } from 'crypto';

export type ConsentType = 
  | 'TERMS_OF_SERVICE'      // Sözleşmenin ifası (Açık rıza gerektirmez, onay şartı)
  | 'PRIVACY_NOTICE_READ'   // Aydınlatma Metninin okunduğu beyanı (İnceleme)
  | 'EXPLICIT_CONSENT_KVKK' // Özel nitelikli veri / yurtdışı aktarım açık rızası
  | 'MARKETING_COMMUNICATION' // ETK / İYS ticari elektronik ileti izni (İsteğe bağlı)
  | 'ANALYTICS_COOKIES';    // GDPR / ePrivacy analitik çerez izni

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  policyVersion: string;
  policyTextHash: string;
  ipAddressHash: string;
  userAgent: string;
  grantedAt: string;
  revoked?: boolean;
  revokedAt?: string;
  revocationReason?: string;
}

/**
 * KVKK ve GDPR uyumlu açık rıza kayıt nesnesi üretir.
 * IP adresi doğrudan ham olarak değil, hash'lenerek saklanır (Veri minimizasyonu).
 */
export function createConsentRecord(params: {
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  policyVersion: string;
  policyText: string;
  rawIp: string;
  userAgent: string;
}): ConsentRecord {
  const policyTextHash = createHash('sha256').update(params.policyText).digest('hex');
  const ipAddressHash = createHash('sha256').update(params.rawIp + ':complirules_salt').digest('hex');

  return {
    id: `consent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId: params.userId,
    consentType: params.consentType,
    granted: params.granted,
    policyVersion: params.policyVersion,
    policyTextHash,
    ipAddressHash,
    userAgent: params.userAgent,
    grantedAt: new Date().toISOString()
  };
}

/**
 * Bir rıza kaydının geçerli olup olmadığını (politika versiyonu değişti mi) doğrular.
 */
export function isConsentCurrent(record: ConsentRecord, activePolicyVersion: string): boolean {
  if (!record.granted || record.revoked) return false;
  return record.policyVersion === activePolicyVersion;
}

/**
 * Rızanın geri alınmasını (opt-out) işler ve yeni bir versiyonlanmış iptal kaydı döndürür.
 * GDPR Madde 7(3) ve KVKK Açık Rıza ilkelerine tam uyumlu iptal logu üretir.
 */
export function revokeConsent(record: ConsentRecord, reason = 'Kullanıcı talebiyle rıza geri alındı (Opt-out)'): ConsentRecord {
  const now = new Date().toISOString();
  return {
    ...record,
    id: `revocation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    granted: false,
    revoked: true,
    revokedAt: now,
    revocationReason: reason
  };
}

/**
 * Kullanıcıya ait rıza ve iptal geçmişini kronolojik olarak filtreler ve sıralar.
 */
export function getConsentHistory(
  records: ConsentRecord[], 
  filter?: { userId?: string; consentType?: ConsentType }
): ConsentRecord[] {
  let filtered = [...records];
  if (filter?.userId) {
    filtered = filtered.filter(r => r.userId === filter.userId);
  }
  if (filter?.consentType) {
    filtered = filtered.filter(r => r.consentType === filter.consentType);
  }

  return filtered.sort((a, b) => {
    const timeA = new Date(a.revokedAt || a.grantedAt).getTime();
    const timeB = new Date(b.revokedAt || b.grantedAt).getTime();
    return timeA - timeB;
  });
}

export interface DownstreamRevocationHandler {
  serviceName: string;
  revoke: (userId: string, consentType: ConsentType) => Promise<{ success: boolean; error?: string }>;
}

export interface DownstreamRevocationResult {
  serviceName: string;
  success: boolean;
  error?: string;
}

/**
 * Rıza geri alındığında dış servislere (CRM, pazarlama e-posta listesi, çerezler)
 * otomatik geri çekme bildirimini dağıtır (Downstream notification).
 */
export async function handleDownstreamRevocation(
  userId: string,
  consentType: ConsentType,
  handlers: DownstreamRevocationHandler[]
): Promise<DownstreamRevocationResult[]> {
  const settled = await Promise.allSettled(
    handlers.map(async h => {
      const res = await h.revoke(userId, consentType);
      return {
        serviceName: h.serviceName,
        success: res.success,
        error: res.error
      };
    })
  );

  return settled.map((result, idx) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      serviceName: handlers[idx].serviceName,
      success: false,
      error: (result.reason as Error)?.message || 'Bilinmeyen hata'
    };
  });
}
