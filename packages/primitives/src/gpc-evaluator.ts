import type { CookiePreferences } from './cookie-consent.js';

/**
 * Global Privacy Control (GPC) — CCPA/CPRA otomatik opt-out
 *
 * Dayanak: 11 CCR § 7025 (opt-out preference signals). `Sec-GPC: 1` başlığı veya
 * `navigator.globalPrivacyControl === true` "satma/paylaşma" opt-out talebi sayılır.
 * Yaptırım örnekleri: California AG v. Sephora (2022, 1,2 M$), DoorDash (2024).
 * § 7025(c): Kullanıcı oturum açmışsa sinyal kullanıcının profiline işlenir; hesap tercihiyle
 * çelişirse işletme ancak kullanıcıyı bilgilendirip onay alarak devam edebilir.
 */

export interface GpcEvaluation {
  optOutActive: boolean;
  source: 'header' | 'client' | 'both' | 'none';
  /** Oturum açmış kullanıcıda profile `ccpaOptedOut: true` yazılmalıdır. */
  shouldPersistToProfile: boolean;
  reason: string;
}

type HeaderBag = Record<string, string | string[] | undefined> | { get(name: string): string | null };

function readHeader(headers: HeaderBag | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  if (typeof (headers as { get?: unknown }).get === 'function') {
    return (headers as { get(n: string): string | null }).get(name) ?? undefined;
  }
  const bag = headers as Record<string, string | string[] | undefined>;
  const key = Object.keys(bag).find(k => k.toLowerCase() === name.toLowerCase());
  const value = key ? bag[key] : undefined;
  return Array.isArray(value) ? value[0] : value;
}

export function evaluateGpcSignal(
  headers: HeaderBag | undefined,
  options: { clientGpc?: boolean; isAuthenticated?: boolean } = {}
): GpcEvaluation {
  const headerActive = readHeader(headers, 'sec-gpc')?.trim() === '1';
  const clientActive = options.clientGpc === true;
  const optOutActive = headerActive || clientActive;

  return {
    optOutActive,
    source: headerActive && clientActive ? 'both' : headerActive ? 'header' : clientActive ? 'client' : 'none',
    shouldPersistToProfile: optOutActive && options.isAuthenticated === true,
    reason: optOutActive
      ? 'GPC sinyali algılandı: satış/paylaşım opt-out talebi olarak işlenmelidir (11 CCR § 7025).'
      : 'GPC sinyali yok.'
  };
}

/**
 * GPC aktifse pazarlama (hedefli reklam / paylaşım) kategorisini zorla kapatır; diğer tercihler korunur.
 */
export function applyGpcToPreferences(prefs: CookiePreferences, evaluation: GpcEvaluation): CookiePreferences {
  if (!evaluation.optOutActive) return prefs;
  return { ...prefs, marketing: false };
}
