import crypto from 'node:crypto';

export interface AssetProxyOptions {
  allowedDomains?: string[];
  secretKey?: string;
  proxyEndpoint?: string;
}

/**
 * Almanya & AB GDPR Varlık ve Resim Gizliliği Standardı (LG München I & CJEU Breyer C-582/14)
 * 
 * Kullanıcının IP adresinin üçüncü parti resim/CDN sunucularına sızmasını önlemek için
 * istemciye doğrudan harici URL vermek yerine sunucu taraflı güvenli bir proxy URL'i üretir.
 */
export function createSecureAssetProxyUrl(
  externalUrl: string,
  options: AssetProxyOptions = {}
): string {
  const proxyEndpoint = options.proxyEndpoint || '/api/compliance/proxy-image';
  const secretKey = options.secretKey || 'complirules_asset_proxy_default_secret';

  // 1. URL format denetimi
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(externalUrl);
  } catch {
    throw new Error(`INVALID_ASSET_URL: Geçersiz resim/varlık URL'i: ${externalUrl}`);
  }

  // 2. SSRF Koruması: Yerel ve özel IP ağlarına erişimi engelle
  const hostname = parsedUrl.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local')
  ) {
    throw new Error(`SSRF_BLOCKED: Özel veya yerel ağ varlıkları proxy üzerinden çekilemez: ${hostname}`);
  }

  // 3. Domain beyaz liste denetimi (eğer verilmişse)
  if (options.allowedDomains && options.allowedDomains.length > 0) {
    const isAllowed = options.allowedDomains.some(d => hostname === d || hostname.endsWith(`.${d}`));
    if (!isAllowed) {
      throw new Error(`DISALLOWED_DOMAIN: "${hostname}" izinli varlık sağlayıcıları arasında değil.`);
    }
  }

  // 4. HMAC İmzası oluştur (URL manipülasyonunu ve açık proxy olarak kötüye kullanımı önler)
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(externalUrl)
    .digest('hex')
    .slice(0, 16);

  const encodedUrl = encodeURIComponent(externalUrl);
  return `${proxyEndpoint}?url=${encodedUrl}&sig=${signature}`;
}

/**
 * Gelen varlık proxy isteğindeki imzayı doğrular
 */
export function verifyAssetProxySignature(
  url: string,
  signature: string,
  secretKey: string = 'complirules_asset_proxy_default_secret'
): boolean {
  const expectedSig = crypto
    .createHmac('sha256', secretKey)
    .update(url)
    .digest('hex')
    .slice(0, 16);

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
}
