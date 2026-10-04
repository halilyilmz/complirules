/**
 * İki Tıklamalı Çözüm (Zwei-Klick-Lösung) — Harici Embed Kapısı
 *
 * Dayanak:
 *  - CJEU C-40/17 Fashion ID (29.07.2019): Sosyal eklenti gömen site sahibi, toplama ve
 *    aktarım aşamasında Facebook ile ortak veri sorumlusudur (GDPR Md. 26).
 *  - Alman DSK Telemedya Rehberi / TDDDG § 25: YouTube, Vimeo, Google Maps iframe'i
 *    (youtube-nocookie.com dahil) sayfa yüklenir yüklenmez IP + Referer iletir.
 *
 * İlke: Kullanıcı açıkça tıklayana kadar harici sunucuya tek bir istek dahi atılmaz.
 * Placeholder yalnızca YEREL (same-origin) önizleme görseli kullanır.
 */

export type EmbedProvider =
  | 'youtube'
  | 'vimeo'
  | 'google-maps'
  | 'facebook'
  | 'twitter'
  | 'instagram'
  | 'linkedin';

const PROVIDER_HOSTS: Record<EmbedProvider, string[]> = {
  youtube: ['youtube.com', 'youtube-nocookie.com', 'youtu.be'],
  vimeo: ['vimeo.com', 'player.vimeo.com'],
  'google-maps': ['google.com', 'maps.google.com', 'maps.app.goo.gl'],
  facebook: ['facebook.com', 'connect.facebook.net'],
  twitter: ['twitter.com', 'platform.twitter.com', 'x.com'],
  instagram: ['instagram.com'],
  linkedin: ['linkedin.com', 'platform.linkedin.com']
};

export interface TwoClickEmbedOptions {
  /** Aynı origin'den sunulan önizleme görseli. Harici URL KABUL EDİLMEZ. */
  localThumbnailPath: string;
  /** Kullanıcıya gösterilecek aydınlatma metni (yerelleştirilebilir). */
  disclosureText?: string;
  title?: string;
}

export interface TwoClickEmbed {
  provider: EmbedProvider;
  embedUrl: string;
  title: string;
  localThumbnailPath: string;
  disclosureText: string;
  /** Render anında harici sunucuya istek atılmaz. */
  externalRequestsOnRender: 0;
  requiresUserActivation: true;
}

export interface ActivatedEmbedAttributes {
  src: string;
  sandbox: string;
  referrerPolicy: 'no-referrer';
  loading: 'lazy';
  allow: string;
  title: string;
}

export function detectEmbedProvider(rawUrl: string): EmbedProvider | null {
  let host: string;
  try {
    host = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const [provider, hosts] of Object.entries(PROVIDER_HOSTS) as [EmbedProvider, string[]][]) {
    if (hosts.some(h => host === h || host.endsWith(`.${h}`))) return provider;
  }
  return null;
}

export function createTwoClickEmbed(embedUrl: string, options: TwoClickEmbedOptions): TwoClickEmbed {
  let parsed: URL;
  try {
    parsed = new URL(embedUrl);
  } catch {
    throw new Error(`INVALID_EMBED_URL: Geçersiz embed adresi: ${embedUrl}`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('INSECURE_EMBED_URL: Yalnızca https embed adreslerine izin verilir.');
  }

  const provider = detectEmbedProvider(embedUrl);
  if (!provider) {
    throw new Error(`UNKNOWN_EMBED_PROVIDER: Tanınmayan harici embed sağlayıcısı: ${parsed.hostname}`);
  }

  // Placeholder görseli harici olursa kapının anlamı kalmaz (LG München I).
  if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(options.localThumbnailPath)) {
    throw new Error('EXTERNAL_THUMBNAIL_FORBIDDEN: Önizleme görseli yerel (same-origin) olmalıdır.');
  }

  return {
    provider,
    embedUrl,
    title: options.title ?? `${provider} içeriği`,
    localThumbnailPath: options.localThumbnailPath,
    disclosureText:
      options.disclosureText ??
      'Bu içeriği yüklediğinizde IP adresiniz ve tarayıcı bilgileriniz üçüncü taraf sağlayıcıya iletilir. Devam etmek için tıklayın.',
    externalRequestsOnRender: 0,
    requiresUserActivation: true
  };
}

/**
 * Yalnızca kullanıcı AÇIK bir eylemle (tıklama/Enter/Space) onay verdiğinde iframe öznitelikleri döner.
 */
export function activateTwoClickEmbed(embed: TwoClickEmbed, userActivated: boolean): ActivatedEmbedAttributes {
  if (userActivated !== true) {
    throw new Error('CONSENT_REQUIRED: Harici embed kullanıcı etkinleştirmesi olmadan yüklenemez.');
  }
  return {
    src: embed.embedUrl,
    sandbox: 'allow-scripts allow-same-origin allow-presentation allow-popups',
    referrerPolicy: 'no-referrer',
    loading: 'lazy',
    allow: 'fullscreen',
    title: embed.title
  };
}
