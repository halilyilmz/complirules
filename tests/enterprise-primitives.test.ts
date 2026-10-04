import { describe, it, expect } from 'vitest';
import {
  EPrivacyConsentEngine,
  EPrivacyPurpose,
  ConsentStorage,
  EPrivacyConsentRecord,
  ConsentAuditEntry,
  SchremsIITIAEvaluator,
  DataCategory,
  RiskLevel,
  TrueAnonymizer,
  AnonymizationConfig,
  BIPABiometricGuard,
  BiometricIdentifierType,
  BiometricStorage,
  BiometricRelease,
  RetentionPolicy,
  JurisdictionConflictResolver,
  ObligationType
} from '../packages/primitives/src/index.js';

describe('Enterprise Primitives Hardening', () => {
  describe('ePrivacy Consent Engine (Directive 2002/58/EC & Planet49)', () => {
    class InMemoryConsentStorage implements ConsentStorage {
      private records = new Map<string, EPrivacyConsentRecord>();
      private auditLogs: ConsentAuditEntry[] = [];

      async save(record: EPrivacyConsentRecord): Promise<void> {
        this.records.set(record.subjectId, record);
      }

      async findBySubject(subjectId: string): Promise<EPrivacyConsentRecord | null> {
        return this.records.get(subjectId) ?? null;
      }

      async findLatestBySubject(subjectId: string): Promise<EPrivacyConsentRecord | null> {
        return this.findBySubject(subjectId);
      }

      async appendAuditLog(entry: ConsentAuditEntry): Promise<void> {
        this.auditLogs.push(entry);
      }

      getAuditLogs(): ConsentAuditEntry[] {
        return this.auditLogs;
      }
    }

    it('records affirmative consent via grantConsent and forces strictly necessary cookies to true', async () => {
      const storage = new InMemoryConsentStorage();
      const engine = new EPrivacyConsentEngine(storage);

      const record = await engine.grantConsent({
        subjectId: 'user-123',
        purposes: {
          [EPrivacyPurpose.STRICTLY_NECESSARY]: false, // attempting to turn off essential
          [EPrivacyPurpose.FUNCTIONAL]: true,
          [EPrivacyPurpose.ANALYTICS]: true,
          [EPrivacyPurpose.ADVERTISING]: false,
          [EPrivacyPurpose.PERSONALIZATION]: false,
          [EPrivacyPurpose.SOCIAL_MEDIA]: false
        },
        gdprBases: {
          [EPrivacyPurpose.STRICTLY_NECESSARY]: 'legitimate_interests',
          [EPrivacyPurpose.FUNCTIONAL]: 'consent',
          [EPrivacyPurpose.ANALYTICS]: 'consent',
          [EPrivacyPurpose.ADVERTISING]: 'consent',
          [EPrivacyPurpose.PERSONALIZATION]: 'consent',
          [EPrivacyPurpose.SOCIAL_MEDIA]: 'consent'
        },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Chrome',
        consentUrl: 'https://example.com/checkout',
        consentVersion: 'v1.0.0',
        bannerContentHash: 'hash-abc-123',
        jurisdiction: 'EU',
        gpcDetected: false
      });

      expect(record.purposes[EPrivacyPurpose.STRICTLY_NECESSARY]).toBe(true);
      expect(record.purposes[EPrivacyPurpose.ANALYTICS]).toBe(true);
      expect(record.purposes[EPrivacyPurpose.ADVERTISING]).toBe(false);
      expect(record.subjectId).toBe('user-123');

      // Check strictly necessary is always allowed
      const checkEssential = await engine.checkConsent('user-123', EPrivacyPurpose.STRICTLY_NECESSARY);
      expect(checkEssential.allowed).toBe(true);
    });

    it('enforces GPC signal by overriding advertising and sale purposes in GPC-honoring jurisdictions', async () => {
      const storage = new InMemoryConsentStorage();
      const engine = new EPrivacyConsentEngine(storage);

      const record = await engine.grantConsent({
        subjectId: 'user-456',
        purposes: {
          [EPrivacyPurpose.STRICTLY_NECESSARY]: true,
          [EPrivacyPurpose.FUNCTIONAL]: true,
          [EPrivacyPurpose.ANALYTICS]: true,
          [EPrivacyPurpose.ADVERTISING]: true, // user checked accept
          [EPrivacyPurpose.PERSONALIZATION]: false,
          [EPrivacyPurpose.SOCIAL_MEDIA]: false
        },
        gdprBases: {
          [EPrivacyPurpose.STRICTLY_NECESSARY]: 'legitimate_interests',
          [EPrivacyPurpose.FUNCTIONAL]: 'consent',
          [EPrivacyPurpose.ANALYTICS]: 'consent',
          [EPrivacyPurpose.ADVERTISING]: 'consent',
          [EPrivacyPurpose.PERSONALIZATION]: 'consent',
          [EPrivacyPurpose.SOCIAL_MEDIA]: 'consent'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Firefox',
        consentUrl: 'https://example.com/',
        consentVersion: 'v1.0.0',
        bannerContentHash: 'hash-def-456',
        jurisdiction: 'US_CA',
        gpcDetected: true // GPC active!
      });

      // GPC overrides advertising/sale to false per CCPA §1798.135
      expect(record.purposes[EPrivacyPurpose.ADVERTISING]).toBe(false);

      // Check checkConsent with GPC active
      const checkAd = await engine.checkConsent('user-456', EPrivacyPurpose.ADVERTISING, true);
      expect(checkAd.allowed).toBe(false);
      expect(checkAd.statute).toContain('CCPA');
    });

    it('supports consent withdrawal and preserves append-only audit trail', async () => {
      const storage = new InMemoryConsentStorage();
      const engine = new EPrivacyConsentEngine(storage);

      await engine.grantConsent({
        subjectId: 'user-789',
        purposes: {
          [EPrivacyPurpose.STRICTLY_NECESSARY]: true,
          [EPrivacyPurpose.FUNCTIONAL]: true,
          [EPrivacyPurpose.ANALYTICS]: true,
          [EPrivacyPurpose.ADVERTISING]: true,
          [EPrivacyPurpose.PERSONALIZATION]: true,
          [EPrivacyPurpose.SOCIAL_MEDIA]: true
        },
        gdprBases: {
          [EPrivacyPurpose.STRICTLY_NECESSARY]: 'legitimate_interests',
          [EPrivacyPurpose.FUNCTIONAL]: 'consent',
          [EPrivacyPurpose.ANALYTICS]: 'consent',
          [EPrivacyPurpose.ADVERTISING]: 'consent',
          [EPrivacyPurpose.PERSONALIZATION]: 'consent',
          [EPrivacyPurpose.SOCIAL_MEDIA]: 'consent'
        },
        ipAddress: '10.0.0.1',
        userAgent: 'Safari',
        consentUrl: 'https://example.com/preferences',
        consentVersion: 'v1.0.0',
        bannerContentHash: 'hash-ghi-789',
        jurisdiction: 'EU',
        gpcDetected: false
      });

      await engine.withdrawConsent('user-789', [EPrivacyPurpose.ANALYTICS, EPrivacyPurpose.ADVERTISING]);

      const checkAnalytics = await engine.checkConsent('user-789', EPrivacyPurpose.ANALYTICS);
      expect(checkAnalytics.allowed).toBe(false);

      const checkFunctional = await engine.checkConsent('user-789', EPrivacyPurpose.FUNCTIONAL);
      expect(checkFunctional.allowed).toBe(true);

      const logs = storage.getAuditLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1].action).toBe('withdrawn');
    });
  });

  describe('Schrems II TIA Evaluator (CJEU C-311/18 & EDPB 01/2020)', () => {
    const evaluator = new SchremsIITIAEvaluator();

    it('evaluates intra-EEA transfers and confirms transfer is permissible', () => {
      const result = evaluator.evaluate({
        dataCategories: [DataCategory.IDENTITY],
        exporter: {
          name: 'German Enterprise GmbH',
          country: 'DE',
          role: 'controller'
        },
        importer: {
          name: 'French Cloud SAS',
          country: 'FR',
          role: 'processor'
        },
        destinationCountry: 'FR',
        transferTool: {
          type: 'adequacy_decision',
          decision: 'Internal EEA processing'
        },
        purposes: ['Order Processing'],
        dataSubjectVolume: 'medium',
        includesSpecialCategories: false,
        service: 'Hosting',
        importerSubjectToUSLaw: false
      });

      expect(result.transferPermissible).toBe(true);
    });

    it('flags unmitigated transfers to US electronic communication service providers subject to FISA 702', () => {
      const result = evaluator.evaluate({
        dataCategories: [DataCategory.HEALTH, DataCategory.IDENTITY],
        exporter: {
          name: 'German Health AG',
          country: 'DE',
          role: 'controller'
        },
        importer: {
          name: 'US Telecom Analytics Inc',
          country: 'US',
          role: 'processor',
          dpfCertified: false
        },
        destinationCountry: 'US',
        transferTool: {
          type: 'scc',
          moduleType: 'C2P',
          executed: true
        },
        purposes: ['Health Diagnostics Telemetry'],
        dataSubjectVolume: 'large',
        includesSpecialCategories: true,
        service: 'Analytics',
        importerSubjectToUSLaw: true // Subject to FISA 702
      });

      expect(result.surveillanceLawAnalysis.laws.some(l => l.name.includes('FISA Section 702'))).toBe(true);
      expect(result.requiredMeasures.length).toBeGreaterThan(0);
    });
  });

  describe('True Anonymizer & K-Anonymity (WP29 Opinion 05/2014 & Recital 26)', () => {
    it('applies k-anonymity and removes direct identifiers per Recital 26', () => {
      const config: AnonymizationConfig = {
        directIdentifiers: ['name', 'email', 'ssn'],
        quasiIdentifiers: ['age', 'zipCode', 'gender'],
        k: 2,
        sensitiveAttributes: ['disease'],
        l: 1,
        t: 0.5,
        dpEpsilon: 0,
        hipaaMode: false
      };

      const anonymizer = new TrueAnonymizer(config);
      const dataset = [
        { name: 'Alice', email: 'alice@test.com', ssn: '123-45', age: 34, zipCode: '10001', gender: 'F', disease: 'Flu' },
        { name: 'Bob', email: 'bob@test.com', ssn: '234-56', age: 36, zipCode: '10002', gender: 'F', disease: 'Cold' },
        { name: 'Charlie', email: 'charlie@test.com', ssn: '345-67', age: 52, zipCode: '90210', gender: 'M', disease: 'Diabetes' },
        { name: 'Dave', email: 'dave@test.com', ssn: '456-78', age: 54, zipCode: '90211', gender: 'M', disease: 'Asthma' }
      ];

      const result = anonymizer.anonymize(dataset);

      // Verify direct identifiers removed
      for (const row of result.data) {
        expect(row).not.toHaveProperty('name');
        expect(row).not.toHaveProperty('email');
        expect(row).not.toHaveProperty('ssn');
      }

      expect(result.wp29Assessment).toBeDefined();
      expect(result.achievedK).toBeGreaterThanOrEqual(1);
    });
  });

  describe('BIPA Biometric Guard (740 ILCS 14/)', () => {
    class MockBiometricStorage implements BiometricStorage {
      private releases = new Map<string, BiometricRelease>();
      private policy: RetentionPolicy | null = null;
      private operations: any[] = [];

      async saveRelease(release: BiometricRelease) { this.releases.set(release.id, release); }
      async getRelease(id: string) { return this.releases.get(id) ?? null; }
      async getReleasesBySubject(subjectId: string) {
        return Array.from(this.releases.values()).filter(r => r.subjectId === subjectId);
      }
      async saveRetentionPolicy(policy: RetentionPolicy) { this.policy = policy; }
      async getRetentionPolicy(): Promise<RetentionPolicy> {
        return this.policy ?? {
          publicPolicyUrl: 'https://example.com/biometric-policy',
          maxRetentionDays: 365,
          destructionMethod: 'cryptographic_erasure'
        };
      }
      async logOperation(operation: any) { this.operations.push(operation); }
    }

    it('requires a written informed release before authorizing biometric operations per §15(b)', async () => {
      const storage = new MockBiometricStorage();
      const guard = new BIPABiometricGuard(storage);

      // Attempt operation without existing release
      const authFail = await guard.authorizeOperation({
        subjectId: 'emp-101',
        releaseId: 'non-existent-release',
        identifierType: BiometricIdentifierType.FACE_GEOMETRY,
        type: 'capture',
        purpose: 'workplace_access'
      });

      expect(authFail.authorized).toBe(false);
      expect(authFail.violations.some(v => v.section === '§15(b)')).toBe(true);

      // Create release
      const { release, errors } = await guard.createRelease({
        subjectId: 'emp-101',
        identifierTypes: [BiometricIdentifierType.FACE_GEOMETRY],
        purpose: 'workplace_access',
        retentionPeriod: '1 year',
        ipAddress: '127.0.0.1',
        method: 'electronic_signature'
      });

      expect(errors.length).toBe(0);
      expect(release.id).toBeDefined();

      // Now authorize valid operation
      const authSuccess = await guard.authorizeOperation({
        subjectId: 'emp-101',
        releaseId: release.id,
        identifierType: BiometricIdentifierType.FACE_GEOMETRY,
        type: 'capture',
        purpose: 'workplace_access'
      });

      expect(authSuccess.authorized).toBe(true);
      expect(authSuccess.violations.length).toBe(0);
    });

    it('flags transmission of biometric data to third parties as potential §15(c) monetization violation', async () => {
      const storage = new MockBiometricStorage();
      const guard = new BIPABiometricGuard(storage);

      const { release } = await guard.createRelease({
        subjectId: 'emp-202',
        identifierTypes: [BiometricIdentifierType.FINGERPRINT],
        purpose: 'security',
        retentionPeriod: '1 year',
        ipAddress: '127.0.0.1',
        method: 'written_signature'
      });

      const authTransmit = await guard.authorizeOperation({
        subjectId: 'emp-202',
        releaseId: release.id,
        identifierType: BiometricIdentifierType.FINGERPRINT,
        type: 'transmit',
        recipient: 'external_broker',
        purpose: 'security'
      });

      expect(authTransmit.violations.some(v => v.section === '§15(c)')).toBe(true);
    });
  });

  describe('Jurisdiction Conflict Resolver (GDPR Art. 17 vs Statutory Retentions)', () => {
    const resolver = new JurisdictionConflictResolver();

    it('reconciles GDPR erasure with tax and commercial retention laws (VUK 253 / AO 147)', () => {
      const resolution = resolver.resolveErasureVsRetention({
        subjectId: 'user-eu-tr-1',
        dataCategories: ['invoices', 'profile_data', 'marketing_tracking'],
        jurisdictions: ['TR', 'EU'],
        erasureRequestDate: new Date().toISOString()
      });

      // Marketing and profile can be erased immediately
      expect(resolution.canErase['profile_data']).toBe(true);
      expect(resolution.canErase['marketing_tracking']).toBe(true);

      // Invoices are blocked from immediate erasure due to mandatory tax code
      expect(resolution.canErase['invoices']).toBe(false);
      expect(resolution.analysis).toContain('VUK Madde 253');
      expect(resolution.actions.length).toBeGreaterThan(0);
    });

    it('detects and resolves conflicts across multiple overlapping obligations', () => {
      const conflicts = resolver.resolveConflicts({
        applicableJurisdictions: ['EU', 'TR'],
        dataCategories: ['financial_records'],
        requestedAction: ObligationType.DELETE,
        context: {
          dataCategory: 'financial_records',
          storageLocation: 'EU',
          primarySubjectJurisdiction: 'TR',
          statutoryPurposes: ['tax_compliance'],
          retentionYearsRequired: 10
        }
      });

      expect(conflicts.length).toBeGreaterThan(0);
      const conflict = conflicts[0];
      expect(conflict.resolution.prevailingObligation.type).toBe(ObligationType.RETAIN);
      expect(conflict.resolution.legalBasis).toContain('GDPR Art. 17 exception');
    });
  });
});
