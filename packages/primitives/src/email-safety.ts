/**
 * E-posta Güvenliği — Toplu Gönderimde İfşa Önleme ve Takip Piksel Kontrolü
 *
 * Dayanak:
 *  - 6698 s. KVKK Md. 12(1): Veri güvenliği için teknik tedbir yükümlülüğü. Birden fazla alıcının
 *    adresinin `to`/`cc` alanında birbirine görünmesi yetkisiz ifşadır.
 *  - ePrivacy Direktifi Md. 5(3), CNIL (14.04.2026 tavsiyesi; uyum süresi 14.07.2026) ve İtalyan
 *    Garante: Bireysel açılma takibi (1x1 piksel) ön rıza gerektirir.
 */

export interface BulkEmailOptions {
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailSafetyViolation {
  code: 'MULTIPLE_RECIPIENTS_IN_TO' | 'MULTIPLE_RECIPIENTS_IN_CC' | 'RECIPIENTS_VISIBLE_ACROSS_FIELDS';
  message: string;
}

export interface EmailSafetyResult {
  compliant: boolean;
  violations: EmailSafetyViolation[];
}

function toList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  const raw = Array.isArray(value) ? value : value.split(/[;,]/);
  return raw.map(v => v.trim()).filter(Boolean);
}

export function validateBulkEmailOptions(options: BulkEmailOptions): EmailSafetyResult {
  const to = toList(options.to);
  const cc = toList(options.cc);
  const violations: EmailSafetyViolation[] = [];

  if (to.length > 1) {
    violations.push({
      code: 'MULTIPLE_RECIPIENTS_IN_TO',
      message: `\`to\` alanında ${to.length} alıcı var; adresler birbirine görünür (KVKK Md. 12). Her alıcıya ayrı zarf veya \`bcc\` kullanın.`
    });
  }
  if (cc.length > 1) {
    violations.push({
      code: 'MULTIPLE_RECIPIENTS_IN_CC',
      message: `\`cc\` alanında ${cc.length} alıcı var; adresler birbirine görünür (KVKK Md. 12).`
    });
  }
  if (to.length + cc.length > 1 && to.length <= 1 && cc.length <= 1) {
    violations.push({
      code: 'RECIPIENTS_VISIBLE_ACROSS_FIELDS',
      message: '`to` ve `cc` alanlarındaki alıcılar birbirini görür; harici alıcılar arasında kullanmayın.'
    });
  }

  return { compliant: violations.length === 0, violations };
}

/**
 * Her alıcı için ayrı zarf üretir: kimse başka bir alıcının adresini görmez.
 */
export function buildSafeBulkEnvelopes<T extends Record<string, unknown>>(
  recipients: string[],
  base: T
): Array<T & { to: string }> {
  const unique = Array.from(new Set(recipients.map(r => r.trim().toLowerCase()).filter(Boolean)));
  return unique.map(address => ({ ...base, to: address, cc: undefined, bcc: undefined }));
}

// --- Takip pikseli (web beacon) tespiti ---

const IMG_TAG = /<img\b[^>]*>/gi;

function isTinyDimension(tag: string): boolean {
  const attrW = /\bwidth\s*=\s*["']?\s*([01])(?:px)?\s*["']?(?=[\s/>])/i.test(tag);
  const attrH = /\bheight\s*=\s*["']?\s*([01])(?:px)?\s*["']?(?=[\s/>])/i.test(tag);
  const styleTiny = /style\s*=\s*["'][^"']*(?:width\s*:\s*[01]px[^"']*height\s*:\s*[01]px|height\s*:\s*[01]px[^"']*width\s*:\s*[01]px)/i.test(tag);
  return (attrW && attrH) || styleTiny;
}

function looksLikeTrackingUrl(tag: string): boolean {
  const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ?? '';
  return /^https?:\/\//i.test(src) && /(open|pixel|track|beacon|wf\/open|e\/o)\b/i.test(src);
}

export function isTrackingBeaconPresent(html: string): boolean {
  const tags = html.match(IMG_TAG) ?? [];
  return tags.some(tag => isTinyDimension(tag) || (looksLikeTrackingUrl(tag) && /display\s*:\s*none/i.test(tag)));
}

export function stripTrackingBeacons(html: string): string {
  return html.replace(IMG_TAG, tag =>
    isTinyDimension(tag) || (looksLikeTrackingUrl(tag) && /display\s*:\s*none/i.test(tag)) ? '' : tag
  );
}
