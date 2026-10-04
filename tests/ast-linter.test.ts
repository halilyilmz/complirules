import { describe, it, expect } from 'vitest';
import {
  CompliRulesEngine,
  noExternalFontCdnRule,
  noPiiInLoggerRule,
  noPrecheckedConsentRule,
  requireGpcHandlerRule
} from '../packages/linter/src/index.js';

describe('CompliRules AST Linter Engine', () => {
  it('detects direct and template external font CDN links', () => {
    const engine = new CompliRulesEngine();
    engine.registerRule(noExternalFontCdnRule);

    const codeWithViolations = `
      import React from 'react';
      export function Header() {
        const fontUrl = "https://fonts.googleapis.com/css2?family=Roboto";
        return (
          <link rel="stylesheet" href={\`https://fonts.gstatic.com/s/inter/v12/abc.woff2\`} />
        );
      }
    `;

    const violations = engine.checkSourceText(codeWithViolations, 'Header.tsx');
    expect(violations.length).toBe(2);
    expect(violations[0].ruleId).toBe('complirules/no-external-font-cdn');
    expect(violations[0].precedentCitation).toContain('LG München I');
  });

  it('detects PII logging via direct console and aliased logger variables', () => {
    const engine = new CompliRulesEngine();
    engine.registerRule(noPiiInLoggerRule);

    const code = `
      const myLogger = console;
      function handleLogin(email, password, tckn) {
        myLogger.info("Attempting login for", email);
        console.error("Failed for password:", password);
        console.warn("Turkish ID:", tckn);
      }
    `;

    const violations = engine.checkSourceText(code, 'auth.ts');
    expect(violations.length).toBeGreaterThanOrEqual(3);
    expect(violations.every(v => v.ruleId === 'complirules/no-pii-in-logger')).toBe(true);
    expect(violations[0].statutoryBasis).toContain('GDPR Art. 5(1)(c)');
  });

  it('detects prechecked consent checkboxes in consent/marketing context per Planet49', () => {
    const engine = new CompliRulesEngine();
    engine.registerRule(noPrecheckedConsentRule);

    const code = `
      export function CookieBanner() {
        return (
          <div className="cookie-consent-container">
            <input type="checkbox" name="marketing" defaultChecked />
            <input type="checkbox" name="analytics" checked={true} />
          </div>
        );
      }
    `;

    const violations = engine.checkSourceText(code, 'CookieBanner.tsx');
    expect(violations.length).toBe(2);
    expect(violations[0].precedentCitation).toContain('Planet49');
  });

  it('warns when route handler reads headers without evaluating Sec-GPC', () => {
    const engine = new CompliRulesEngine();
    engine.registerRule(requireGpcHandlerRule);

    const nonCompliantMiddleware = `
      export function middleware(request) {
        const auth = request.headers.get('authorization');
        return NextResponse.next();
      }
    `;

    const compliantMiddleware = `
      export function middleware(request) {
        const auth = request.headers.get('authorization');
        const gpc = request.headers.get('sec-gpc');
        return NextResponse.next();
      }
    `;

    const nonCompliantViolations = engine.checkSourceText(nonCompliantMiddleware, 'src/middleware.ts');
    expect(nonCompliantViolations.length).toBe(1);
    expect(nonCompliantViolations[0].ruleId).toBe('complirules/require-gpc-handler');

    const compliantViolations = engine.checkSourceText(compliantMiddleware, 'src/middleware.ts');
    expect(compliantViolations.length).toBe(0);
  });
});
