import { describe, it, expect } from 'vitest';
import path from 'path';
import { scanDirectory, scanFile, noUngatedAnalyticsScriptsRule } from '../packages/linter/src/index.js';

describe('CompliRules AST / Static Linter', () => {
  const vulnerableDir = path.resolve(__dirname, '../examples/vulnerable-vs-compliant-saas/vulnerable');
  const compliantDir = path.resolve(__dirname, '../examples/vulnerable-vs-compliant-saas/compliant');

  it('güvensiz SaaS kod tabanındaki tüm hukuki ve güvenlik ihlallerini tespit eder', () => {
    const result = scanDirectory(vulnerableDir);
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(4);

    const ruleIds = result.violations.map(v => v.ruleId);
    expect(ruleIds).toContain('no-unredacted-logs');
    expect(ruleIds).toContain('no-preticked-consent');
    expect(ruleIds).toContain('enforce-crypto-shredding');
    expect(ruleIds).toContain('no-remote-google-fonts');
    expect(ruleIds).toContain('no-bundled-consent');
  });

  it('CompliRules standartlarına göre yazılmış uyumlu SaaS kodunu hatasız geçer (0 violation)', () => {
    const result = scanDirectory(compliantDir);
    expect(result.passed).toBe(true);
    expect(result.violations.length).toBe(0);
    expect(result.summary.critical).toBe(0);
    expect(result.summary.high).toBe(0);
  });

  it('önceden rıza alınmamış (ungated) analitik ve izleme scriptlerini yakalar', () => {
    const ungatedSnippet = `
      export default function Layout({ children }) {
        return (
          <html>
            <head>
              <script src="https://www.googletagmanager.com/gtag/js?id=G-12345" async></script>
            </head>
            <body>{children}</body>
          </html>
        );
      }
    `;

    const violations = noUngatedAnalyticsScriptsRule.check('Layout.tsx', ungatedSnippet);
    expect(violations.length).toBe(1);
    expect(violations[0].ruleId).toBe('no-ungated-analytics-scripts');
    expect(violations[0].message).toContain('önceden açık rızası');

    const gatedSnippet = `
      export default function Layout({ children }) {
        return (
          <html>
            <head>
              <script 
                src="https://www.googletagmanager.com/gtag/js?id=G-12345" 
                type="text/plain" 
                data-category="analytics"
              />
            </head>
            <body>{children}</body>
          </html>
        );
      }
    `;

    const cleanViolations = noUngatedAnalyticsScriptsRule.check('Layout.tsx', gatedSnippet);
    expect(cleanViolations.length).toBe(0);

    // 1. Inline GTM script tespiti
    const inlineGtmSnippet = `
      export default function Head() {
        return (
          <script dangerouslySetInnerHTML={{
            __html: \`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-55555');\`
          }} />
        );
      }
    `;
    const inlineViolations = noUngatedAnalyticsScriptsRule.check('Head.tsx', inlineGtmSnippet);
    expect(inlineViolations.length).toBe(1);
    expect(inlineViolations[0].ruleId).toBe('no-ungated-analytics-scripts');

    // 2. Next.js <Script> Facebook Pixel tespiti
    const nextScriptSnippet = `
      import Script from 'next/script';
      export default function Pixel() {
        return <Script src="https://connect.facebook.net/en_US/fbevents.js" strategy="afterInteractive" />;
      }
    `;
    const fbViolations = noUngatedAnalyticsScriptsRule.check('Pixel.tsx', nextScriptSnippet);
    expect(fbViolations.length).toBe(1);

    // 3. JSX koşullu onay kontrolü (Gating)
    const conditionalGatedSnippet = `
      import Script from 'next/script';
      export default function Analytics({ isCategoryAllowed }) {
        return (
          <div>
            {isCategoryAllowed('analytics') && (
              <Script src="https://www.googletagmanager.com/gtm.js?id=GTM-123" />
            )}
          </div>
        );
      }
    `;
    const conditionalViolations = noUngatedAnalyticsScriptsRule.check('Analytics.tsx', conditionalGatedSnippet);
    expect(conditionalViolations.length).toBe(0);
  });

  it('Almanya LG München I & CJEU Breyer uyarınca harici un-proxied resim ve Gravatar hotlinklerini yakalar', async () => {
    const { noUnproxiedRemoteImagesRule } = await import('../packages/linter/src/index.js');

    const vulnerableImageSnippet = `
      export function UserCard({ user }) {
        return (
          <div className="card">
            <img src="https://gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50" alt="Avatar" />
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb" alt="Profile" />
          </div>
        );
      }
    `;

    const violations = noUnproxiedRemoteImagesRule.check('UserCard.tsx', vulnerableImageSnippet);
    expect(violations.length).toBeGreaterThanOrEqual(1);
    expect(violations[0].ruleId).toBe('no-unproxied-remote-images');
    expect(violations[0].message).toContain('LG München I');

    const compliantImageSnippet = `
      import { createSecureAssetProxyUrl } from '@complirules/primitives';

      export function UserCard({ user }) {
        const safeAvatar = createSecureAssetProxyUrl('https://gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50');
        return (
          <div className="card">
            <img src={safeAvatar} alt="Avatar" />
          </div>
        );
      }
    `;

    const cleanViolations = noUnproxiedRemoteImagesRule.check('UserCard.tsx', compliantImageSnippet);
    expect(cleanViolations.length).toBe(0);
  });
});
