/**
 * Hassas Rota Koruması — Sağlık / Checkout / Çocuk Sayfalarında Reklam Piksel Yasağı
 *
 * Dayanak:
 *  - FTC v. GoodRx (2023, 1,5 M$ HBNR cezası), FTC v. BetterHelp (2023, 7,8 M$), FTC v. Flo Health (2021):
 *    sağlık verisinin Meta/Google/TikTok gibi reklam sistemlerine aktarılması FTC Act Sec. 5 ve
 *    Health Breach Notification Rule (16 CFR Part 318) ihlalidir.
 *  - HIPAA: Kimliği doğrulanmış hasta portallarında izleme teknolojileri BAA gerektirir.
 *    NOT: AHA v. Becerra (N.D. Tex., 20.06.2024) HHS bülteninin "kimliksiz genel sayfa" kısmını
 *    iptal etmiştir; ancak FTC yetkisi ve portal kuralları geçerlidir. Bu nedenle koruma
 *    muhafazakâr tutulur.
 *  - COPPA (15 U.S.C. §§ 6501-6506): Çocuğa yönelik sayfalarda kalıcı tanımlayıcı yasağı.
 */

export type SensitiveCategory = 'health' | 'checkout' | 'auth' | 'children';

const CATEGORY_PATTERNS: Record<SensitiveCategory, RegExp> = {
  health: /(^|\/)(health|rx|prescriptions?|conditions?|therapy|symptoms?|patient|portal|appointments?|telehealth|medical)(\/|$)/i,
  checkout: /(^|\/)(checkout|payment|billing|cart)(\/|$)/i,
  auth: /(^|\/)(login|signin|sign-in|register|signup|account|password|reset)(\/|$)/i,
  children: /(^|\/)(kids?|children|child|junior|teen)(\/|$)/i
};

const COMMERCIAL_TRACKING_PROVIDERS = [
  'meta-pixel',
  'facebook-pixel',
  'google-ads',
  'google-analytics',
  'gtag',
  'tiktok-pixel',
  'snap-pixel',
  'pinterest-tag',
  'linkedin-insight',
  'hotjar',
  'twitter-pixel'
];

export function getSensitiveCategories(
  pathname: string,
  categories: SensitiveCategory[] = ['health', 'checkout', 'auth', 'children']
): SensitiveCategory[] {
  const clean = pathname.split(/[?#]/)[0];
  return categories.filter(c => CATEGORY_PATTERNS[c].test(clean));
}

export function isSensitiveRoute(pathname: string, categories?: SensitiveCategory[]): boolean {
  return getSensitiveCategories(pathname, categories).length > 0;
}

export interface TrackingDecision {
  blocked: boolean;
  reason: string;
  categories: SensitiveCategory[];
}

export function shouldBlockCommercialTracking(pathname: string, provider: string): TrackingDecision {
  const normalized = provider.trim().toLowerCase().replace(/\s+/g, '-');
  const isCommercial = COMMERCIAL_TRACKING_PROVIDERS.includes(normalized);
  const categories = getSensitiveCategories(pathname);

  if (isCommercial && categories.length > 0) {
    return {
      blocked: true,
      categories,
      reason: `Hassas rota (${categories.join(', ')}) üzerinde ticari izleyici "${provider}" yasaktır (FTC GoodRx/BetterHelp, HIPAA, COPPA).`
    };
  }
  return { blocked: false, categories, reason: 'İzin verildi.' };
}
