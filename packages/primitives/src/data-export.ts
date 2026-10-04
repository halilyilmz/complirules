import crypto from 'node:crypto';

export interface PortableDataBundle {
  exportMetadata: {
    exportId: string;
    generatedAt: string;
    legalBasis: string;
    formatVersion: string;
    dataSubjectId: string;
  };
  personalProfile: Record<string, any>;
  activityHistory: any[];
  consentRecords: any[];
  integrityChecksum: string;
}

/**
 * GDPR Article 20 uyarınca taşınabilir, makinece okunabilir veri paketi üretir.
 * Parola hashleri, gizli anahtarlar gibi sistem güvenliğini ilgilendiren iç alanları süzer.
 */
export function generateDataPortabilityBundle(
  user: Record<string, any>,
  options: {
    activityHistory?: any[];
    consentRecords?: any[];
  } = {}
): PortableDataBundle {
  // Gizli veya iç alanları temizle
  const safeProfile = { ...user };
  const internalBlacklist = ['password', 'passwordHash', 'salt', 'token', 'internalSecret', 'apiKey'];
  for (const key of internalBlacklist) {
    delete safeProfile[key];
  }

  const exportId = `export_${crypto.randomUUID()}`;
  const generatedAt = new Date().toISOString();

  const bundleWithoutChecksum = {
    exportMetadata: {
      exportId,
      generatedAt,
      legalBasis: 'GDPR_ARTICLE_20_DATA_PORTABILITY',
      formatVersion: '1.0.0',
      dataSubjectId: String(user.id || user.userId || 'anonymous')
    },
    personalProfile: safeProfile,
    activityHistory: options.activityHistory || [],
    consentRecords: options.consentRecords || []
  };

  const payloadString = JSON.stringify(bundleWithoutChecksum);
  const integrityChecksum = crypto.createHash('sha256').update(payloadString).digest('hex');

  return {
    ...bundleWithoutChecksum,
    integrityChecksum
  };
}
