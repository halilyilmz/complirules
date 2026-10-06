import { describe, it, expect } from 'vitest';
import {
  executeTool,
  MCP_TOOLS,
  handleVerifyTransferAdequacy,
  handleGenerateDPIA,
  handleCheckDependencyPrivacy,
  handleCheckHIPAASafeHarbor,
  handleResolveJurisdictionConflict,
  handleGenerateBreachAssessment,
  handleGenerateCookieDisclosure,
  handleVerifyConsentImplementation,
  handleGenerateDPATemplate,
  handleAuditAccessibilityCompliance
} from '../packages/mcp-server/src/index.js';

describe('Hardened MCP Compliance Server Tools', () => {
  it('exposes all 15 compliance tools in MCP_TOOLS catalog', () => {
    expect(MCP_TOOLS.length).toBe(15);
    const toolNames = MCP_TOOLS.map(t => t.name);
    expect(toolNames).toContain('verify_transfer_adequacy');
    expect(toolNames).toContain('generate_dpia');
    expect(toolNames).toContain('check_dependency_privacy');
    expect(toolNames).toContain('check_hipaa_safeharbor');
    expect(toolNames).toContain('resolve_jurisdiction_conflict');
    expect(toolNames).toContain('generate_breach_assessment');
    expect(toolNames).toContain('generate_cookie_disclosure');
    expect(toolNames).toContain('verify_consent_implementation');
    expect(toolNames).toContain('generate_dpa_template');
    expect(toolNames).toContain('audit_accessibility_compliance');
  });

  it('evaluates Schrems II and KVKK cross-border transfer adequacy', () => {
    const raw = executeTool('verify_transfer_adequacy', {
      exporterCountry: 'TR',
      importerCountry: 'US',
      serviceName: 'PostHog Cloud',
      isDpfCertified: false,
      dataCategories: ['telemetry', 'ip_address']
    });

    const parsed = JSON.parse(raw);
    expect(parsed.status).toBe('HIGH_REGULATORY_EXPOSURE');
    expect(parsed.warnings.some((w: string) => w.includes('KVKK Art. 9'))).toBe(true);
    expect(parsed.warnings.some((w: string) => w.includes('Schrems II'))).toBe(true);
  });

  it('generates a Data Protection Impact Assessment (DPIA) template', () => {
    const raw = executeTool('generate_dpia', {
      projectName: 'AI Candidate Screener',
      processingDescription: 'Evaluates resumes using LLM and scores applicants automatically.',
      involvesSpecialCategories: false,
      involvesAutomatedDecisionMaking: true,
      involvesLargeScaleMonitoring: true,
      involvesVulnerableSubjects: true
    });

    expect(raw).toContain('Data Protection Impact Assessment (DPIA)');
    expect(raw).toContain('MANDATORY (GDPR Art. 35(3) & WP248 Guidelines)');
    expect(raw).toContain('k-Anonymity');
  });

  it('audits dependencies for hidden privacy and tracking liabilities', () => {
    const raw = executeTool('check_dependency_privacy', {
      dependencies: {
        'react-facebook-pixel': '^1.0.5',
        'hotjar': '^2.0.0',
        'react': '^19.0.0'
      }
    });

    const parsed = JSON.parse(raw);
    expect(parsed.verdict).toBe('TRACKING_LIABILITIES_DETECTED');
    expect(parsed.flaggedCount).toBe(2);
    expect(parsed.flaggedPackages.some((p: any) => p.package === 'react-facebook-pixel')).toBe(true);
  });

  it('detects HIPAA 18 Safe Harbor identifiers in field names', () => {
    const raw = executeTool('check_hipaa_safeharbor', {
      fields: ['patientName', 'admissionDate', 'zipCode', 'diagnosisScore', 'ssn']
    });

    const parsed = JSON.parse(raw);
    expect(parsed.isSafeHarborCompliant).toBe(false);
    expect(parsed.violationCount).toBe(4);
    expect(parsed.safeHarborVerdict).toBe('NON_COMPLIANT_EXPOSES_EPHI');
  });

  it('resolves conflicting legal obligations between GDPR erasure and statutory tax retention', () => {
    const raw = executeTool('resolve_jurisdiction_conflict', {
      requestedAction: 'erasure',
      dataCategory: 'financial_invoice',
      jurisdictions: ['TR', 'EU']
    });

    const parsed = JSON.parse(raw);
    expect(parsed.resolution).toBe('PARTIAL_ERASURE_RESTRICTION_MANDATORY');
    expect(parsed.derogationGround).toContain('GDPR Art. 17(3)(b)');
    expect(parsed.prevailingObligation).toContain('VUK Art. 253');
  });

  it('generates statutory data breach notification assessments', () => {
    const raw = executeTool('generate_breach_assessment', {
      incidentType: 'Ransomware database exfiltration',
      affectedRecordsCount: 1500,
      dataCategories: ['identity', 'health', 'credit_card'],
      isEncryptedWithCustomerKey: false,
      jurisdiction: 'ALL'
    });

    const parsed = JSON.parse(raw);
    expect(parsed.riskLevel).toBe('CRITICAL');
    expect(parsed.statutoryNotifications.KVKK.deadlineHours).toBe(72);
    expect(parsed.statutoryNotifications.GDPR.deadlineHours).toBe(72);
    expect(parsed.statutoryNotifications.HIPAA.mediaNoticeRequired).toBe(true);
  });

  it('generates category-separated cookie disclosures', () => {
    const raw = executeTool('generate_cookie_disclosure', {
      appName: 'Acme SaaS',
      cookies: [
        { name: 'session_id', provider: 'Acme', category: 'strictly_necessary', purpose: 'Authentication', expiry: 'Session' },
        { name: '_ga', provider: 'Google', category: 'analytics', purpose: 'Traffic analysis', expiry: '2 years' }
      ]
    });

    expect(raw).toContain('Cookie & Terminal Equipment Disclosure: Acme SaaS');
    expect(raw).toContain('Strictly Necessary Cookies');
    expect(raw).toContain('Performance & Analytics Cookies');
    expect(raw).toContain('session_id');
    expect(raw).toContain('_ga');
  });

  it('validates UI consent implementation against Planet49 and CNIL rules', () => {
    const badConsent = JSON.parse(executeTool('verify_consent_implementation', {
      hasRejectAllButton: false,
      areCheckboxesPreChecked: true,
      isBundledWithTermsOfService: true,
      hasGranularPurposeSwitches: false,
      hasRevocationInterface: false,
      jurisdiction: 'EU'
    }));

    expect(badConsent.isCompliant).toBe(false);
    expect(badConsent.deficiencies.length).toBe(5);

    const goodConsent = JSON.parse(executeTool('verify_consent_implementation', {
      hasRejectAllButton: true,
      areCheckboxesPreChecked: false,
      isBundledWithTermsOfService: false,
      hasGranularPurposeSwitches: true,
      hasRevocationInterface: true,
      jurisdiction: 'EU'
    }));

    expect(goodConsent.isCompliant).toBe(true);
    expect(goodConsent.deficiencies.length).toBe(0);
  });

  it('generates Data Processing Agreement (DPA) templates', () => {
    const dpa = executeTool('generate_dpa_template', {
      controllerName: 'EuroHealth AG',
      processorName: 'CloudMed SAS',
      dataCategories: ['Health Records', 'User Emails'],
      governingLaw: 'DUAL'
    });

    expect(dpa).toContain('Data Processing Agreement');
    expect(dpa).toContain('GDPR Art. 28');
    expect(dpa).toContain('KVKK Madde 12');
    expect(dpa).toContain('24 hours');
  });

  it('audits user interface against European Accessibility Act (EAA) and WCAG 2.1 AA', () => {
    const audit = JSON.parse(executeTool('audit_accessibility_compliance', {
      hasAriaLabelsOnIconButtons: true,
      colorContrastRatio: 4.8,
      isKeyboardNavigable: true,
      supportsZoomWithoutClipping: true,
      hasAccessibleForms: true
    }));

    expect(audit.isCompliant).toBe(true);
    expect(audit.verdict).toBe('EAA_WCAG_AA_COMPLIANT');

    const failingAudit = JSON.parse(executeTool('audit_accessibility_compliance', {
      hasAriaLabelsOnIconButtons: false,
      colorContrastRatio: 2.5,
      isKeyboardNavigable: false,
      supportsZoomWithoutClipping: false,
      hasAccessibleForms: false
    }));

    expect(failingAudit.isCompliant).toBe(false);
    expect(failingAudit.violations.length).toBe(5);
  });
});
