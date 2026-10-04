import { LinterRule, LintViolation } from '../types.js';

export const noUngatedAnalyticsScriptsRule: LinterRule = {
  id: 'no-ungated-analytics-scripts',
  name: 'Önceden Açık Rıza Olmaksızın Yüklenen Üçüncü Parti Analitik ve Takip Scripti Yasağı',
  lawCitation: 'KVKK Çerez Rehberi (Haziran 2022) & GDPR ePrivacy Direktifi (Art. 5(3))',
  severity: 'HIGH',
  filePattern: /\.(tsx|jsx|html|vue)$/,
  check(filePath: string, content: string): LintViolation[] {
    const violations: LintViolation[] = [];

    const ungatedProviderPattern = /(googletagmanager\.com|google-analytics\.com|connect\.facebook\.net|static\.hotjar\.com|cdn\.segment\.com|scripts\.clarity\.ms|cdn\.amplitude\.com|cdn\.mixpanel\.com|snap\.licdn\.com|analytics\.tiktok\.com)/i;
    const consentGatingPattern = /data-category|type=["']text\/plain["']|isCategoryAllowed|hasConsent|cookieConsent|consentGranted/i;

    // Multi-line script etiketlerini ve gövdelerini tara (<script>...</script> ve <Script .../>)
    const scriptRegex = /<(?:script|Script)\b([^>]*)>([\s\S]*?)<\/(?:script|Script)>|<(?:script|Script)\b([^>]*?)\/?>/gi;
    let match: RegExpExecArray | null;

    while ((match = scriptRegex.exec(content)) !== null) {
      const attributes = match[1] ?? match[3] ?? '';
      const body = match[2] ?? '';
      const fullScriptText = `${attributes} ${body}`;

      if (ungatedProviderPattern.test(fullScriptText)) {
        // Hem script etiketi/içeriği hem de hemen öncesindeki JSX/JS koşulu (örn: {hasConsent && <Script...>}) kontrol edilir
        const contextBefore = content.substring(Math.max(0, match.index - 250), match.index);
        const isGated = consentGatingPattern.test(fullScriptText) || consentGatingPattern.test(contextBefore);

        if (!isGated) {
          const upToMatch = content.substring(0, match.index);
          const lineNumber = upToMatch.split('\n').length;
          const snippet = match[0].trim().replace(/\s+/g, ' ');

          violations.push({
            file: filePath,
            line: lineNumber,
            column: 1,
            ruleId: this.id,
            severity: this.severity,
            message: 'Kullanıcının önceden açık rızası (prior consent) alınmadan doğrudan yüklenen üçüncü parti analitik/izleme scripti tespit edildi.',
            lawCitation: this.lawCitation,
            matchedSnippet: snippet.length > 150 ? snippet.substring(0, 147) + '...' : snippet,
            suggestedFix: 'Scripti çerez onay mekanizmasına bağlayın (`CookieConsentManager.isCategoryAllowed("analytics")` veya `data-category="analytics"` ve `type="text/plain"` kullanın).'
          });
        }
      }
    }

    return violations;
  }
};
