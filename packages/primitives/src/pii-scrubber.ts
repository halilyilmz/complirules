export interface PiiScrubberOptions {
  redactKeys?: string[];
  maskCreditCards?: boolean;
  maskEmails?: boolean;
  maskTCKN?: boolean;
}

const DEFAULT_SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'secret',
  'token',
  'authorization',
  'cookie',
  'tckn',
  'tc_kimlik',
  'ssn',
  'creditcard',
  'credit_card',
  'cvv',
  'cvc',
  'cardnumber',
  'card_number',
  'apikey',
  'api_key'
]);

/**
 * TCKN (T.C. Kimlik Numarası) Maskeleme: 11 haneli TCKN'nin ilk 3 ve son 2 hanesi açık, ortası yıldızlı.
 * Örn: 12345678901 -> 123******01
 */
export function maskTCKN(tckn: string): string {
  const clean = tckn.replace(/\D/g, '');
  if (clean.length !== 11) return '***[GEÇERSİZ TCKN]***';
  return `${clean.slice(0, 3)}******${clean.slice(9)}`;
}

/**
 * E-posta Maskeleme: İlk harf ve domain açık, kullanıcı adı yıldızlı.
 * Örn: ibrahim@domain.com -> i***m@domain.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return `*@${domain}`;
  return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`;
}

/**
 * Telefon Maskeleme:
 * Örn: +90 532 123 4567 -> +90 532 *** ** 67
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return '***-***-****';
  return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} *** ** ${digits.slice(-2)}`;
}

/**
 * Kredi Kartı Maskeleme: İlk 6 ve son 4 açık veya sadece son 4 açık.
 * Örn: 4111222233334444 -> **** **** **** 4444
 */
export function maskCreditCard(pan: string): string {
  const clean = pan.replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return '**** **** **** ****';
  return `**** **** **** ${clean.slice(-4)}`;
}

/**
 * IBAN Maskeleme: İlk 4 ve son 4 hane açık.
 * Örn: TR330006100511123456789012 -> TR33 ********** 9012
 */
export function maskIBAN(iban: string): string {
  const clean = iban.replace(/\s+/g, '').toUpperCase();
  if (clean.length < 15) return 'TR** ********** ****';
  return `${clean.slice(0, 4)} ********** ${clean.slice(-4)}`;
}

/**
 * Nesnelerdeki hassas anahtarları ve değerleri özyinelemeli (recursive) redakte eder.
 */
export function scrubObject<T>(data: T, customKeys: string[] = []): T {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') {
    if (typeof data === 'string') {
      // E-posta regex
      if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data)) {
        return maskEmail(data) as unknown as T;
      }
      // TCKN regex (11 hane)
      if (/^[1-9][0-9]{10}$/.test(data)) {
        return maskTCKN(data) as unknown as T;
      }
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => scrubObject(item, customKeys)) as unknown as T;
  }

  const sensitive = new Set([...DEFAULT_SENSITIVE_KEYS, ...customKeys.map(k => k.toLowerCase())]);
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (sensitive.has(lowerKey)) {
      result[key] = '[REDACTED_PII]';
    } else if (lowerKey.includes('email') && typeof value === 'string') {
      result[key] = maskEmail(value);
    } else if ((lowerKey.includes('tckn') || lowerKey.includes('kimlik')) && typeof value === 'string') {
      result[key] = maskTCKN(value);
    } else if (lowerKey.includes('phone') && typeof value === 'string') {
      result[key] = maskPhone(value);
    } else {
      result[key] = scrubObject(value, customKeys);
    }
  }

  return result as T;
}

export interface RedactedLogger {
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
  debug(msg: string, meta?: Record<string, unknown>): void;
}

/**
 * CloudWatch / Datadog / Sentry'ye PII sızmasını önleyen güvenli logger wrapper.
 */
export function createRedactedLogger(options: PiiScrubberOptions = {}): RedactedLogger {
  const extraKeys = options.redactKeys || [];

  return {
    info(msg: string, meta?: Record<string, unknown>) {
      const sanitized = meta ? scrubObject(meta, extraKeys) : undefined;
      console.log(`[INFO] ${msg}`, sanitized ? JSON.stringify(sanitized) : '');
    },
    warn(msg: string, meta?: Record<string, unknown>) {
      const sanitized = meta ? scrubObject(meta, extraKeys) : undefined;
      console.warn(`[WARN] ${msg}`, sanitized ? JSON.stringify(sanitized) : '');
    },
    error(msg: string, meta?: Record<string, unknown>) {
      const sanitized = meta ? scrubObject(meta, extraKeys) : undefined;
      console.error(`[ERROR] ${msg}`, sanitized ? JSON.stringify(sanitized) : '');
    },
    debug(msg: string, meta?: Record<string, unknown>) {
      const sanitized = meta ? scrubObject(meta, extraKeys) : undefined;
      console.debug(`[DEBUG] ${msg}`, sanitized ? JSON.stringify(sanitized) : '');
    }
  };
}
