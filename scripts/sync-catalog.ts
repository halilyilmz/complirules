import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_RULES } from '../packages/rules/src/catalog-data.js';
import { renderMdcRule } from '../packages/rules/src/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogDir = path.resolve(__dirname, '../packages/rules/catalog');

const RULE_PATH_MAPPING: Record<string, string> = {
  'kvkk-retention-tombstone': 'kvkk/01-retention-tombstone.mdc',
  'kvkk-ui-consent-etk': 'kvkk/02-ui-consent-etk.mdc',
  'kvkk-dsr-ticketing': 'kvkk/03-dsr-ticketing.mdc',
  'kvkk-cookie-cmp': 'kvkk/04-cookie-cmp.mdc',
  'kvkk-transfer-geofencing': 'kvkk/05-transfer-geofencing.mdc',
  'kvkk-breach-notification-72h': 'kvkk/06-breach-notification-72h.mdc',
  'gdpr-right-to-be-forgotten': 'gdpr/01-right-to-be-forgotten.mdc',
  'gdpr-no-unproxied-remote-assets': 'gdpr/02-no-unproxied-remote-assets.mdc',
  'eaa-wcag-accessibility': 'eaa-a11y/01-wcag-accessibility.mdc',
  'hipaa-phi-technical-safeguards': 'hipaa/01-phi-technical-safeguards.mdc',
  'hipaa-breakglass-emergency': 'hipaa/02-breakglass-emergency.mdc',
  'ai-act-transparency': 'ai-act/01-transparency-obligations.mdc',
  'kvkk-email-bcc-safety': 'kvkk/07-email-bcc-safety.mdc',
  'kvkk-otp-marketing-decoupling': 'kvkk/08-otp-marketing-decoupling.mdc',
  'gdpr-two-click-embed': 'gdpr/03-two-click-embed.mdc',
  'gdpr-privacy-preserving-captcha': 'gdpr/04-privacy-preserving-captcha.mdc',
  'hipaa-ftc-sensitive-route-pixel': 'hipaa/03-ftc-sensitive-route-pixel.mdc',
  'ccpa-gpc-automated-optout': 'ccpa/01-gpc-automated-optout.mdc',
  'sec-auth-rate-limit-mfa': 'security/02-auth-rate-limit-mfa.mdc',
  'sec-pii-logger-guard': 'security/01-pii-logger-guard.mdc',
  'gdpr-eprivacy-consent-decoupling': 'gdpr/05-eprivacy-consent-decoupling.mdc',
  'schrems-ii-transfer-tia': 'gdpr/06-schrems-ii-transfer-tia.mdc',
  'bipa-biometric-retention': 'ccpa/02-bipa-biometric-retention.mdc',
  'multi-jurisdiction-conflict-quarantine': 'gdpr/07-multi-jurisdiction-conflict-quarantine.mdc',
  'gdpr-data-portability-endpoint': 'gdpr/08-data-portability-endpoint.mdc',
  'hipaa-baa-telemetry-isolation': 'hipaa/04-baa-telemetry-isolation.mdc',
  'eaa-accessible-checkout-mfa': 'eaa-a11y/02-accessible-checkout-mfa.mdc',
  'ai-act-prohibited-practices': 'ai-act/02-prohibited-practices.mdc'
};

console.log('🔄 CompliRules MDC Katalog Dosyaları Senkronize Ediliyor...');

for (const rule of ALL_RULES) {
  const relativePath = RULE_PATH_MAPPING[rule.id];
  if (!relativePath) {
    console.warn(`⚠️ Kural için katalog yolu bulunamadı: ${rule.id}`);
    continue;
  }

  const targetPath = path.join(catalogDir, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const content = renderMdcRule(rule);
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`  ✓ Güncellendi: ${relativePath}`);
}

console.log('✨ Tüm MDC katalog dosyaları tek kaynak gerçeklik (single source of truth) ile senkronize edildi.');
