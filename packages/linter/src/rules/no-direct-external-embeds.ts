import { LinterRule, LintViolation } from '../types.js';

const EMBED_IFRAME =
  /<iframe\b[^>]*\bsrc\s*=\s*\{?\s*[`"']https?:\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com|player\.vimeo\.com|vimeo\.com|google\.com\/maps|maps\.google\.com|open\.spotify\.com|w\.soundcloud\.com)[^>]*>/gi;

const SOCIAL_WIDGET_SCRIPT =
  /<(?:script|Script)\b[^>]*\bsrc\s*=\s*\{?\s*[`"']https?:\/\/(?:connect\.facebook\.net|platform\.twitter\.com|platform\.linkedin\.com|assets\.pinterest\.com|www\.instagram\.com\/embed\.js)[^>]*>/gi;

const GATING_PATTERN =
  /TwoClickEmbed|createTwoClickEmbed|activateTwoClickEmbed|hasConsent|isCategoryAllowed|consentGranted|data-category|data-src\s*=|userActivated/;

export const noDirectExternalEmbedsRule: LinterRule = {
  id: 'no-direct-external-embeds',
  name: 'Rıza/Tıklama Öncesi Harici Embed (YouTube, Vimeo, Maps, Sosyal Eklenti) Yasağı',
  lawCitation: 'CJEU C-40/17 Fashion ID & DSK Telemedya Rehberi / TDDDG § 25 (Zwei-Klick-Lösung)',
  severity: 'HIGH',
  filePattern: /\.(tsx|jsx|html|vue|php)$/,
  check(filePath: string, content: string): LintViolation[] {
    const violations: LintViolation[] = [];

    const scan = (regex: RegExp, message: string) => {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        const before = content.substring(Math.max(0, match.index - 300), match.index);
        if (GATING_PATTERN.test(before) || GATING_PATTERN.test(match[0])) continue;

        const line = content.substring(0, match.index).split('\n').length;
        const snippet = match[0].replace(/\s+/g, ' ');
        violations.push({
          file: filePath,
          line,
          column: 1,
          ruleId: this.id,
          severity: this.severity,
          message,
          lawCitation: this.lawCitation,
          matchedSnippet: snippet.length > 150 ? snippet.substring(0, 147) + '...' : snippet,
          suggestedFix:
            'Harici içeriği `createTwoClickEmbed` ile yerel önizleme arkasına alın; iframe/script yalnızca kullanıcı tıkladıktan sonra (`activateTwoClickEmbed`) DOM\'a eklensin.'
        });
      }
    };

    scan(
      EMBED_IFRAME,
      'Harici iframe, sayfa yüklenir yüklenmez ziyaretçi IP ve Referer bilgisini üçüncü tarafa iletir (youtube-nocookie dahil). İki tıklamalı çözüm gereklidir.'
    );
    scan(
      SOCIAL_WIDGET_SCRIPT,
      'Sosyal eklenti scripti rızasız yüklenirse site sahibi ortak veri sorumlusu olur (CJEU Fashion ID C-40/17).'
    );

    return violations;
  }
};
