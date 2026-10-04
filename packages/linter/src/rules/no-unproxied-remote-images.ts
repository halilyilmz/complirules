import { LinterRule, LintViolation } from '../types.js';

export const noUnproxiedRemoteImagesRule: LinterRule = {
  id: 'no-unproxied-remote-images',
  name: 'Uzak Resim/Varlık Hotlinkleme ve İstemci IP Sızıntısı Yasağı (Almanya LG München I & CJEU Breyer)',
  lawCitation: 'GDPR Art. 6(1), Art. 44+ & LG München I (3 O 17493/20)',
  severity: 'HIGH',
  filePattern: /\.(tsx|jsx|html|vue|php)$/,
  check(filePath: string, content: string): LintViolation[] {
    const violations: LintViolation[] = [];
    const lines = content.split('\n');

    // 1. Doğrudan Gravatar veya un-proxied bilinen harici avatar/resim CDN'leri
    const directHotlinkPattern = /<img\b[^>]*\bsrc=["'](https?:\/\/(?:www\.)?(?:gravatar\.com|unsplash\.com|imgur\.com|i\.ytimg\.com|pbs\.twimg\.com)[^"']*)["']/i;
    
    // 2. Genel harici resim hotlinking (kendi proxy'si /api/... veya yerel /assets/ olmayan)
    const genericExternalImagePattern = /<img\b[^>]*\bsrc=["'](https?:\/\/(?!(?:localhost|127\.0\.0\.1|my-cdn\.local|api\.mysite\.com)[^"']+)[^"']+)["']/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Proxy veya gated çağrıları yoksay
      if (line.includes('proxy') || line.includes('createSecureAssetProxyUrl') || line.includes('next/image')) {
        continue;
      }

      if (directHotlinkPattern.test(line)) {
        violations.push({
          file: filePath,
          line: i + 1,
          column: 1,
          ruleId: this.id,
          severity: this.severity,
          message: 'Harici resim veya Gravatar doğrudan istemciye bağlanmış (Hotlinking). Almanya LG München I ve CJEU Breyer kararları uyarınca kullanıcının IP adresi ve Referer bilgisi rızasız olarak üçüncü parti sunucuya aktarılmaktadır.',
          lawCitation: this.lawCitation,
          matchedSnippet: line.trim(),
          suggestedFix: 'Resmi sunucu taraflı proxy/cache (createSecureAssetProxyUrl) veya yerel varlık bundle üzerinden sunun.'
        });
      }
    }

    return violations;
  }
};
