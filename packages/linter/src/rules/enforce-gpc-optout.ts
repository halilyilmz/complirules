import { LinterRule, LintViolation } from '../types.js';

// GPC işleyen CMP/analitik yükleyici dosyalarında sinyal kontrolü aranır.
const AD_TRACKER_LOADER =
  /(?:loadAdTrackers|initAds|initMarketing|initRetargeting|loadMarketingPixels|loadFacebookPixel|loadGoogleAds)\s*\(/;
const GPC_CHECK = /sec-gpc|globalPrivacyControl|evaluateGpcSignal|applyGpcToPreferences/i;

export const enforceGpcOptoutRule: LinterRule = {
  id: 'enforce-gpc-optout',
  name: 'Global Privacy Control (Sec-GPC) Sinyalini Yok Sayma Yasağı',
  lawCitation: 'CCPA/CPRA — 11 CCR § 7025 (California AG v. Sephora 2022, DoorDash 2024)',
  severity: 'HIGH',
  filePattern: /\.(ts|tsx|js|jsx|mjs)$/,
  check(filePath: string, content: string): LintViolation[] {
    const loader = AD_TRACKER_LOADER.exec(content);
    if (!loader) return [];
    if (GPC_CHECK.test(content)) return [];

    return [
      {
        file: filePath,
        line: content.substring(0, loader.index).split('\n').length,
        column: 1,
        ruleId: this.id,
        severity: this.severity,
        message:
          'Reklam/pazarlama izleyicisi yükleniyor ancak dosyada `Sec-GPC` / `navigator.globalPrivacyControl` denetimi yok. GPC, California\'da bağlayıcı bir satış/paylaşım opt-out talebidir.',
        lawCitation: this.lawCitation,
        matchedSnippet: loader[0],
        suggestedFix:
          'Yüklemeden önce `evaluateGpcSignal(headers, { clientGpc: navigator.globalPrivacyControl })` çağırın; aktifse `applyGpcToPreferences` ile marketing kategorisini kapatın.'
      }
    ];
  }
};
