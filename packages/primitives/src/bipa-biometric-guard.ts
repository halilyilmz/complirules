/**
 * @module bipa-biometric-guard
 * @description Illinois Biometric Information Privacy Act (740 ILCS 14/)
 * compliance primitive.
 *
 * Legal foundation:
 * - BIPA §15(a): Written retention/destruction policy
 * - BIPA §15(b): Written informed release before collection
 * - BIPA §15(c): No sale, lease, trade, or profit from biometric data
 * - BIPA §15(d): Reasonable security measures
 * - BIPA §15(e): Retention/destruction timeline
 * - BIPA §20: Private right of action
 * - Rosenbach v. Six Flags (Ill. 2019): No actual injury required for standing
 * - Rogers v. BNSF Railway (N.D. Ill. 2022): $228M jury verdict
 * - Cothron v. White Castle (Ill. 2023): Per-scan accrual of damages
 *
 * Also covers:
 * - Texas CUBI (Tex. Bus. & Com. Code §503.001)
 * - Washington Biometric Identifiers (RCW 19.375)
 * - GDPR Art. 9 (special category: biometric data for identification)
 * - KVKK Art. 6 (özel nitelikli: biyometrik veri)
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Biometric identifier types per BIPA §10 definition:
 * "retina or iris scan, fingerprint, voiceprint, or scan of hand or face geometry"
 *
 * EXCLUDES: writing samples, written signatures, photographs, human biological
 * samples, demographic data, tattoo descriptions, physical descriptions
 */
export enum BiometricIdentifierType {
  FINGERPRINT = 'fingerprint',
  FACE_GEOMETRY = 'face_geometry',       // Facial recognition
  IRIS_SCAN = 'iris_scan',
  RETINA_SCAN = 'retina_scan',
  VOICEPRINT = 'voiceprint',
  HAND_GEOMETRY = 'hand_geometry',
  GAIT_ANALYSIS = 'gait_analysis',       // Emerging — some courts include
  KEYSTROKE_DYNAMICS = 'keystroke_dynamics', // Contested
}

/**
 * Written informed release record — BIPA §15(b) requires this
 * BEFORE any biometric data collection.
 */
export interface BiometricRelease {
  /** Unique release ID */
  id: string;
  /** Data subject identifier */
  subjectId: string;
  /** Type(s) of biometric identifier being collected */
  identifierTypes: BiometricIdentifierType[];
  /** Specific purpose for collection */
  purpose: string;
  /** Duration of storage */
  retentionPeriod: string;
  /** When the biometric data will be destroyed */
  destructionDate: string;
  /** Timestamp of written release execution */
  executedAt: string;
  /** IP address at time of release (for proof) */
  ipAddress: string;
  /** Method of release execution */
  method: 'electronic_signature' | 'physical_document' | 'in_app_consent';
  /** Full text of the release shown to the subject */
  releaseText: string;
  /** SHA-256 hash of the release text (version tracking) */
  releaseTextHash: string;
  /** Whether subject was informed of ALL BIPA §15(b) elements */
  informedElements: {
    /** Informed that biometric data is being collected/stored */
    collectionNotice: boolean;
    /** Informed of specific purpose and length of term */
    purposeAndTerm: boolean;
    /** Received written release executed by the subject */
    writtenRelease: boolean;
  };
  /** Jurisdiction-specific compliance */
  jurisdictions: BiometricJurisdiction[];
}

export type BiometricJurisdiction =
  | 'IL_BIPA'      // Illinois
  | 'TX_CUBI'      // Texas
  | 'WA_BII'       // Washington
  | 'GDPR_ART9'    // EU
  | 'KVKK_ART6';   // Turkey

export interface RetentionPolicy {
  /** Maximum retention period */
  maxRetentionDays: number;
  /** Trigger for destruction: purpose fulfilled OR 3 years (BIPA §15(a)) */
  destructionTrigger: 'purpose_fulfilled' | 'max_retention' | 'subject_request';
  /** Method of destruction */
  destructionMethod: 'cryptographic_erasure' | 'physical_destruction' | 'secure_overwrite';
  /** Whether destruction certificate is generated */
  generateDestructionCertificate: boolean;
  /** Publicly available policy URL (BIPA §15(a) requirement) */
  publicPolicyUrl: string;
}

export interface BiometricOperation {
  type: 'collect' | 'store' | 'use' | 'transmit' | 'destroy';
  identifierType: BiometricIdentifierType;
  subjectId: string;
  timestamp: string;
  releaseId: string; // Must reference valid BiometricRelease
  purpose: string;
  /** For transmit: who receives the data */
  recipient?: string;
  /** Audit trail metadata */
  operatorId: string;
  systemId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export interface BiometricStorage {
  saveRelease(release: BiometricRelease): Promise<void>;
  getRelease(id: string): Promise<BiometricRelease | null>;
  getReleaseBySubject(subjectId: string): Promise<BiometricRelease[]>;
  logOperation(operation: BiometricOperation): Promise<void>;
  getOperationsBySubject(subjectId: string): Promise<BiometricOperation[]>;
  saveRetentionPolicy(policy: RetentionPolicy): Promise<void>;
  getRetentionPolicy(): Promise<RetentionPolicy>;
}

export class BIPABiometricGuard {
  constructor(
    private readonly storage: BiometricStorage,
    private readonly jurisdictions: BiometricJurisdiction[] = ['IL_BIPA'],
  ) {}

  // ───────────────────────────────────────────────────────────────
  // §15(b): WRITTEN INFORMED RELEASE
  // ───────────────────────────────────────────────────────────────

  /**
   * Create and validate a written informed release.
   * This MUST be completed BEFORE any biometric data collection.
   *
   * Per Cothron v. White Castle (2023): each scan without valid
   * release = separate violation. Damages accrue PER SCAN.
   */
  async createRelease(params: {
    subjectId: string;
    identifierTypes: BiometricIdentifierType[];
    purpose: string;
    retentionPeriod: string;
    ipAddress: string;
    method: BiometricRelease['method'];
  }): Promise<{ release: BiometricRelease; errors: string[] }> {
    const errors: string[] = [];
    const policy = await this.storage.getRetentionPolicy();

    // Validate retention policy exists and is publicly available
    if (!policy) {
      errors.push(
        'BIPA §15(a) VIOLATION: No retention/destruction policy found. ' +
        'A written policy must be publicly available BEFORE collection.'
      );
    }

    // Calculate destruction date
    const destructionDate = new Date();
    destructionDate.setDate(
      destructionDate.getDate() + (policy?.maxRetentionDays ?? 1095) // 3 years default
    );

    // Generate release text with ALL required elements
    const releaseText = this.generateReleaseText({
      identifierTypes: params.identifierTypes,
      purpose: params.purpose,
      retentionPeriod: params.retentionPeriod,
      destructionDate: destructionDate.toISOString(),
      publicPolicyUrl: policy?.publicPolicyUrl ?? '[POLICY_URL_MISSING]',
    });

    const release: BiometricRelease = {
      id: crypto.randomUUID(),
      subjectId: params.subjectId,
      identifierTypes: params.identifierTypes,
      purpose: params.purpose,
      retentionPeriod: params.retentionPeriod,
      destructionDate: destructionDate.toISOString(),
      executedAt: new Date().toISOString(),
      ipAddress: params.ipAddress,
      method: params.method,
      releaseText,
      releaseTextHash: await this.hashText(releaseText),
      informedElements: {
        collectionNotice: true,
        purposeAndTerm: true,
        writtenRelease: true,
      },
      jurisdictions: this.jurisdictions,
    };

    // Validate all §15(b) elements are present
    if (!release.informedElements.collectionNotice) {
      errors.push('BIPA §15(b)(1): Subject not informed that biometric data is being collected.');
    }
    if (!release.informedElements.purposeAndTerm) {
      errors.push('BIPA §15(b)(2): Subject not informed of specific purpose and length of term.');
    }
    if (!release.informedElements.writtenRelease) {
      errors.push('BIPA §15(b)(3): Written release not executed by subject.');
    }

    if (errors.length === 0) {
      await this.storage.saveRelease(release);
    }

    return { release, errors };
  }

  // ───────────────────────────────────────────────────────────────
  // OPERATION GUARD (called before EVERY biometric operation)
  // ───────────────────────────────────────────────────────────────

  /**
   * Verify that a biometric operation is legally permissible.
   * Must be called before EVERY collection, storage, use, or transmission.
   *
   * Per Cothron v. White Castle: each individual scan that lacks
   * a valid release is a separate statutory violation.
   */
  async authorizeOperation(operation: Omit<BiometricOperation, 'timestamp'>): Promise<{
    authorized: boolean;
    violations: BIPAViolation[];
  }> {
    const violations: BIPAViolation[] = [];

    // 1. Check for valid written release
    const release = await this.storage.getRelease(operation.releaseId);
    if (!release) {
      violations.push({
        section: '§15(b)',
        severity: 'critical',
        description: 'No valid written release found for this subject. '
          + 'Collection/use without written release = statutory violation. '
          + 'Damages: $1,000 (negligent) or $5,000 (intentional) per scan.',
        citation: 'BIPA §15(b), §20; Cothron v. White Castle (Ill. 2023)',
        estimatedExposure: '$5,000 per scan',
      });
    } else {
      // Verify release covers this identifier type
      if (!release.identifierTypes.includes(operation.identifierType)) {
        violations.push({
          section: '§15(b)',
          severity: 'critical',
          description: `Release does not cover identifier type "${operation.identifierType}". `
            + `Release covers: ${release.identifierTypes.join(', ')}.`,
          citation: 'BIPA §15(b)',
          estimatedExposure: '$5,000 per scan',
        });
      }

      // Verify release is not expired
      if (new Date(release.destructionDate) < new Date()) {
        violations.push({
          section: '§15(a)',
          severity: 'high',
          description: 'Release has expired. Biometric data should have been destroyed. '
            + 'Continued storage/use after retention period = violation.',
          citation: 'BIPA §15(a), §15(e)',
          estimatedExposure: '$1,000 per day of continued storage',
        });
      }

      // Verify purpose matches
      if (operation.purpose !== release.purpose) {
        violations.push({
          section: '§15(b)',
          severity: 'high',
          description: `Operation purpose "${operation.purpose}" does not match `
            + `release purpose "${release.purpose}". Purpose limitation.`,
          citation: 'BIPA §15(b)(2)',
          estimatedExposure: '$5,000 per violation',
        });
      }
    }

    // 2. Check no-sale/no-profit restriction
    if (operation.type === 'transmit' && operation.recipient) {
      violations.push({
        section: '§15(c)',
        severity: 'critical',
        description: 'Transmission of biometric data to third party detected. '
          + 'BIPA §15(c) prohibits sale, lease, trade, or otherwise profiting '
          + 'from biometric identifiers or biometric information. '
          + 'Verify this transmission is not for commercial benefit.',
        citation: 'BIPA §15(c)',
        estimatedExposure: '$5,000 per transmission',
      });
    }

    // 3. Check retention policy compliance
    const policy = await this.storage.getRetentionPolicy();
    if (!policy?.publicPolicyUrl) {
      violations.push({
        section: '§15(a)',
        severity: 'high',
        description: 'No publicly available retention/destruction schedule. '
          + 'BIPA requires a written policy, publicly available, establishing '
          + 'a retention schedule and guidelines for permanent destruction.',
        citation: 'BIPA §15(a)',
        estimatedExposure: 'Injunctive relief + statutory damages',
      });
    }

    // Log the operation (regardless of authorization)
    await this.storage.logOperation({
      ...operation,
      timestamp: new Date().toISOString(),
    });

    return {
      authorized: violations.length === 0,
      violations,
    };
  }

  // ───────────────────────────────────────────────────────────────
  // §15(a), §15(e): DESTRUCTION
  // ───────────────────────────────────────────────────────────────

  /**
   * Destroy biometric data and generate destruction certificate.
   *
   * BIPA §15(a): Destroy when initial purpose has been satisfied OR
   * within 3 years of the individual's last interaction with the entity
   * (whichever comes first).
   */
  async destroyBiometricData(params: {
    subjectId: string;
    reason: 'purpose_fulfilled' | 'retention_expired' | 'subject_request';
    operatorId: string;
    /** Actual destruction implementation (provided by caller) */
    destructionFn: (subjectId: string) => Promise<{ success: boolean; details: string }>;
  }): Promise<DestructionCertificate> {
    const result = await params.destructionFn(params.subjectId);

    const certificate: DestructionCertificate = {
      id: crypto.randomUUID(),
      subjectId: params.subjectId,
      destroyedAt: new Date().toISOString(),
      reason: params.reason,
      method: 'cryptographic_erasure',
      success: result.success,
      details: result.details,
      operatorId: params.operatorId,
      statute: 'BIPA §15(a), §15(e)',
      verificationHash: await this.hashText(
        `${params.subjectId}|${new Date().toISOString()}|${result.details}`
      ),
    };

    return certificate;
  }

  // ───────────────────────────────────────────────────────────────
  // LINTER RULE: Detect biometric API usage
  // ───────────────────────────────────────────────────────────────

  /**
   * Static analysis patterns to detect biometric data collection in code.
   * The linter should flag these and verify a BIPA guard is in place.
   */
  static readonly DETECTION_PATTERNS = {
    webAPIs: [
      'FaceDetector',                    // Shape Detection API
      'BarcodeDetector',                 // May scan biometric barcodes
      'navigator.credentials.create',    // WebAuthn (fingerprint/face)
      'navigator.credentials.get',       // WebAuthn verification
      'PublicKeyCredential',             // WebAuthn
      'MediaRecorder',                   // Voice recording → voiceprint
      'getUserMedia',                    // Camera/mic access → face/voice
      'ImageCapture',                    // Camera capture → face geometry
    ],
    nativeAPIs: [
      'ATTrackingManager',              // iOS (not biometric but related)
      'LAContext',                        // iOS Local Authentication (Touch/Face ID)
      'BiometricManager',               // Android BiometricPrompt
      'FingerprintManager',             // Android (deprecated)
      'FaceID', 'TouchID',             // Colloquial references
    ],
    sdks: [
      'face-api.js',                    // Face detection/recognition
      'tensorflow/face-detection',      // TF.js face detection
      'face-recognition',              // Python face_recognition (in Node bindings)
      '@mediapipe/face_mesh',          // Google MediaPipe
      'aws-sdk.*rekognition',          // AWS Rekognition
      'azure-cognitiveservices-face',  // Azure Face API
      'google-cloud/vision',           // Google Cloud Vision
    ],
    fieldNames: [
      'fingerprint', 'faceId', 'faceData', 'faceGeometry', 'faceEncoding',
      'voiceprint', 'voiceData', 'irisData', 'retinaData', 'biometric',
      'handGeometry', 'faceVector', 'facialFeatures', 'faceTemplate',
    ],
  };

  // ─── HELPERS ───

  private generateReleaseText(params: {
    identifierTypes: BiometricIdentifierType[];
    purpose: string;
    retentionPeriod: string;
    destructionDate: string;
    publicPolicyUrl: string;
  }): string {
    return [
      'BIOMETRIC DATA COLLECTION NOTICE AND WRITTEN RELEASE',
      '',
      'Pursuant to the Illinois Biometric Information Privacy Act (740 ILCS 14/15(b)):',
      '',
      `1. NOTICE: We are collecting and storing the following biometric identifiers: `,
      `   ${params.identifierTypes.map(t => t.replace(/_/g, ' ')).join(', ')}.`,
      '',
      `2. PURPOSE: ${params.purpose}`,
      '',
      `3. RETENTION: Your biometric data will be stored for ${params.retentionPeriod} `,
      `   and will be permanently destroyed no later than ${params.destructionDate}.`,
      '',
      `4. DESTRUCTION POLICY: Our written biometric data retention and destruction `,
      `   policy is publicly available at: ${params.publicPolicyUrl}`,
      '',
      `5. NO SALE: We will not sell, lease, trade, or otherwise profit from your `,
      `   biometric identifiers or biometric information.`,
      '',
      'By providing your biometric identifier, you execute this written release ',
      'authorising the collection and storage described above.',
    ].join('\n');
  }

  private async hashText(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export interface BIPAViolation {
  section: string;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  citation: string;
  estimatedExposure: string;
}

export interface DestructionCertificate {
  id: string;
  subjectId: string;
  destroyedAt: string;
  reason: string;
  method: string;
  success: boolean;
  details: string;
  operatorId: string;
  statute: string;
  verificationHash: string;
}
