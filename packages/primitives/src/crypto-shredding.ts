import { createHash, randomBytes } from 'crypto';

export interface AnonymizableUser {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  tckn?: string | null;
  address?: string | null;
  [key: string]: unknown;
}

export interface ShreddedUserResult {
  id: string;
  email: string;
  name: string;
  phone: null;
  tckn: null;
  address: null;
  isAnonymized: true;
  anonymizedAt: Date;
  tombstoneHash: string;
}

/**
 * KVKK Md. 7 ve GDPR Art. 17 uyarınca kişisel verileri geri döndürülemez
 * şekilde maskeleyip kriptografik olarak yok eder (Crypto-shredding).
 * 
 * Veritabanındaki ilişkisel bütünlük (FK: Fatura, Sipariş) bozulmaz,
 * ancak kullanıcının gerçek kimliği sistemden silinir.
 */
export function shredPersonalData(user: AnonymizableUser, reason = 'USER_REQUEST_ERASURE'): ShreddedUserResult {
  // Geri döndürülemez rastgele salt ile hash üret
  const salt = randomBytes(16).toString('hex');
  const tombstoneHash = createHash('sha256')
    .update(`${user.id}:${user.email}:${salt}:${Date.now()}`)
    .digest('hex');

  const shortHash = tombstoneHash.slice(0, 10);

  return {
    id: user.id,
    email: `anonymized-${shortHash}@erased.local`,
    name: 'ANONİM KULLANICI',
    phone: null,
    tckn: null,
    address: null,
    isAnonymized: true,
    anonymizedAt: new Date(),
    tombstoneHash
  };
}

export interface TombstoneLogEntry {
  entityType: 'USER' | 'CUSTOMER' | 'PATIENT';
  entityId: string;
  erasureType: 'CRYPTO_SHRED' | 'KEY_REVOCATION';
  legalBasis: 'KVKK_MD_7' | 'GDPR_ART_17' | 'RETENTION_EXPIRY';
  timestamp: string;
  verifierHash: string;
}

/**
 * Denetçiye (KVKK Kurumu / GDPR DPA) sunulmak üzere silme kanıt kaydı oluşturur.
 */
export function createTombstoneLog(
  entityType: 'USER' | 'CUSTOMER' | 'PATIENT',
  entityId: string,
  legalBasis: 'KVKK_MD_7' | 'GDPR_ART_17' | 'RETENTION_EXPIRY'
): TombstoneLogEntry {
  const timestamp = new Date().toISOString();
  const verifierHash = createHash('sha256')
    .update(`${entityType}:${entityId}:${legalBasis}:${timestamp}`)
    .digest('hex');

  return {
    entityType,
    entityId,
    erasureType: 'CRYPTO_SHRED',
    legalBasis,
    timestamp,
    verifierHash
  };
}
