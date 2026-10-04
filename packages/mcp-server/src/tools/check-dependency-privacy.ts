export interface CheckDependencyPrivacyArgs {
  dependencies: Record<string, string>;
}

const PRIVACY_RISK_DATABASE: Record<
  string,
  {
    category: string;
    transfersTo: string;
    statute: string;
    requiresConsent: boolean;
    remediation: string;
  }
> = {
  '@next/third-parties': {
    category: 'Third-party script aggregator',
    transfersTo: 'Google / Meta / YouTube',
    statute: 'ePrivacy Art. 5(3), Schrems II',
    requiresConsent: true,
    remediation: 'Ensure components are conditionally loaded behind an ePrivacy ConsentGate.',
  },
  'react-ga': {
    category: 'Analytics',
    transfersTo: 'Google LLC (US)',
    statute: 'Austrian DSB NetDoktor, French CNIL rulings, Schrems II',
    requiresConsent: true,
    remediation: 'Migrate to privacy-first, cookieless analytics (e.g. Plausible self-hosted or Matomo).',
  },
  'react-facebook-pixel': {
    category: 'Advertising & Cross-Context Behavioral Tracking',
    transfersTo: 'Meta Platforms (US)',
    statute: 'FTC GoodRx/BetterHelp, CCPA §1798.140(ah) Sharing',
    requiresConsent: true,
    remediation: 'Never mount on health, fintech, or minor-directed paths without affirmative consent.',
  },
  'hotjar': {
    category: 'Session Recording & Keylogging',
    transfersTo: 'Hotjar Ltd (EU/US AWS)',
    statute: 'ePrivacy Art. 5(3), Wiretap Acts in US states (PA, CA)',
    requiresConsent: true,
    remediation: 'Configure explicit keystroke masking and block collection prior to user consent.',
  },
  '@sentry/browser': {
    category: 'Error Monitoring & Telemetry',
    transfersTo: 'Functional Error Monitoring',
    statute: 'GDPR Art. 5(1)(c) Data Minimization',
    requiresConsent: false,
    remediation: 'Implement beforeSend hook to scrub IPs, auth headers, and query parameters.',
  },
  'mixpanel': {
    category: 'Product Analytics & Behavioral Telemetry',
    transfersTo: 'Mixpanel Inc. (US)',
    statute: 'GDPR Chapter V & ePrivacy Art. 5(3)',
    requiresConsent: true,
    remediation: 'Set opt_out_tracking_by_default: true until explicit consent is obtained.',
  },
  'posthog-js': {
    category: 'Product Analytics & Session Replay',
    transfersTo: 'PostHog Cloud / Self-hosted',
    statute: 'ePrivacy Art. 5(3)',
    requiresConsent: true,
    remediation: 'Enable mask_all_element_attributes and mask_all_text by default.',
  }
};

export function handleCheckDependencyPrivacy(args: CheckDependencyPrivacyArgs): string {
  const findings = [];
  const deps = args.dependencies ?? {};

  for (const [pkgName, version] of Object.entries(deps)) {
    const risk = PRIVACY_RISK_DATABASE[pkgName];
    if (risk) {
      findings.push({
        package: pkgName,
        installedVersion: version,
        category: risk.category,
        dataTransferDestination: risk.transfersTo,
        governingStatute: risk.statute,
        requiresPriorOptInConsent: risk.requiresConsent,
        actionRequired: risk.remediation,
      });
    }
  }

  return JSON.stringify(
    {
      auditCount: Object.keys(deps).length,
      flaggedCount: findings.length,
      verdict: findings.length === 0 ? 'CLEAN' : 'TRACKING_LIABILITIES_DETECTED',
      flaggedPackages: findings,
    },
    null,
    2
  );
}
