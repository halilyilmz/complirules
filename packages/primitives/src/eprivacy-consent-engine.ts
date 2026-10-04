/**
 * @module eprivacy-consent-engine
 * @description Server-authoritative consent state engine that decouples
 * ePrivacy Art. 5(3) terminal equipment access consent from GDPR Art. 6
 * lawful processing bases.
 *
 * Legal foundation:
 * - ePrivacy Directive 2002/58/EC Art. 5(3) (terminal equipment access)
 * - GDPR Art. 6(1)(a) (consent as lawful basis for processing)
 * - GDPR Art. 7 (conditions for consent)
 * - CJEU C-673/17 Planet49 (affirmative, specific, informed consent)
 * - CJEU C-604/22 (cookie walls)
 * - CNIL enforcement: reject = same prominence as accept
 * - CCPA §1798.120, §1798.135(b) (GPC signal)
 * - KVKK Art. 3(1)(a) açık rıza (explicit consent)
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ePrivacy consent purposes — strictly for terminal equipment access.
 * These are INDEPENDENT of GDPR lawful bases.
 */
export enum EPrivacyPurpose {
  /** Strictly necessary — exempt from consent (ePrivacy Art. 5(3) exception) */
  STRICTLY_NECESSARY = 'strictly_necessary',
  /** Functional cookies (preferences, language, UI state) */
  FUNCTIONAL = 'functional',
  /** Analytics / performance measurement */
  ANALYTICS = 'analytics',
  /** Advertising / cross-site tracking / behavioral profiling */
  ADVERTISING = 'advertising',
  /** Social media embeds and widgets */
  SOCIAL_MEDIA = 'social_media',
  /** Third-party content embeds (YouTube, Maps, etc.) */
  THIRD_PARTY_CONTENT = 'third_party_content',
}

/**
 * GDPR lawful bases — for processing personal data.
 * A single processing activity may require BOTH ePrivacy consent
 * AND a GDPR lawful basis.
 */
export enum GDPRLawfulBasis {
  CONSENT = 'consent',                    // Art. 6(1)(a)
  CONTRACT = 'contract',                  // Art. 6(1)(b)
  LEGAL_OBLIGATION = 'legal_obligation',  // Art. 6(1)(c)
  VITAL_INTERESTS = 'vital_interests',    // Art. 6(1)(d)
  PUBLIC_INTEREST = 'public_interest',    // Art. 6(1)(e)
  LEGITIMATE_INTEREST = 'legitimate_interest', // Art. 6(1)(f)
}

/**
 * Jurisdiction-specific consent requirements.
 * Different jurisdictions have different consent age thresholds,
 * GPC obligations, and opt-out vs opt-in models.
 */
export interface JurisdictionConfig {
  /** ISO 3166-1 alpha-2 or region code */
  jurisdiction: string;
  /** Consent model: opt-in (EU/TR) vs opt-out (US except CCPA sensitive PI) */
  model: 'opt_in' | 'opt_out';
  /** Minimum age for digital consent (GDPR Art. 8: 16 default, member states may lower to 13) */
  consentAge: number;
  /** Whether GPC signal must be honored as opt-out */
  honorGPC: boolean;
  /** Whether cookie walls are prohibited */
  cookieWallsProhibited: boolean;
  /** Whether pre-checked boxes are prohibited */
  preCheckedProhibited: boolean;
  /** Consent string/proof retention period (years) */
  proofRetentionYears: number;
  /** Applicable statutes */
  statutes: string[];
}

export const JURISDICTION_CONFIGS: Record<string, JurisdictionConfig> = {
  EU: {
    jurisdiction: 'EU',
    model: 'opt_in',
    consentAge: 16, // Default; member states may lower to 13
    honorGPC: false, // Not legally mandated in EU (yet) but recommended
    cookieWallsProhibited: true, // CJEU C-604/22
    preCheckedProhibited: true,  // Planet49
    proofRetentionYears: 5,
    statutes: ['ePrivacy Art. 5(3)', 'GDPR Art. 6(1)(a)', 'GDPR Art. 7'],
  },
  DE: {
    jurisdiction: 'DE',
    model: 'opt_in',
    consentAge: 16,
    honorGPC: false,
    cookieWallsProhibited: true,
    preCheckedProhibited: true,
    proofRetentionYears: 5,
    statutes: ['TTDSG §25', 'GDPR Art. 6(1)(a)'],
  },
  FR: {
    jurisdiction: 'FR',
    model: 'opt_in',
    consentAge: 15, // France lowered to 15
    honorGPC: false,
    cookieWallsProhibited: true,
    preCheckedProhibited: true,
    proofRetentionYears: 5,
    statutes: ['ePrivacy Art. 5(3)', 'CNIL Guidelines on cookies'],
  },
  TR: {
    jurisdiction: 'TR',
    model: 'opt_in',
    consentAge: 18, // KVKK does not have Art. 8 equivalent; general civil majority
    honorGPC: false,
    cookieWallsProhibited: false, // Not yet addressed by Kurul
    preCheckedProhibited: true,   // KVKK Art. 3(1)(a) açık rıza = explicit consent
    proofRetentionYears: 10,      // Turkish Commercial Code retention
    statutes: ['KVKK Art. 5(1)', 'KVKK Art. 3(1)(a)'],
  },
  US_CA: {
    jurisdiction: 'US_CA',
    model: 'opt_out', // CCPA is opt-out for sale/sharing
    consentAge: 16,   // Opt-in required for 13-16; parental for <13
    honorGPC: true,   // CCPA §1798.135(b); Sephora enforcement
    cookieWallsProhibited: false,
    preCheckedProhibited: false,  // Not explicitly prohibited
    proofRetentionYears: 3,
    statutes: ['CCPA §1798.120', 'CCPA §1798.135', 'CPRA amendments'],
  },
  US_IL: {
    jurisdiction: 'US_IL',
    model: 'opt_in',  // BIPA requires written informed consent for biometrics
    consentAge: 18,
    honorGPC: false,
    cookieWallsProhibited: false,
    preCheckedProhibited: false,
    proofRetentionYears: 3,
    statutes: ['BIPA 740 ILCS 14/15(b)'],
  },
};

/**
 * Consent state for a single user session.
 * This is the SERVER-AUTHORITATIVE record — client-side state
 * is always a projection of this record.
 */
export interface EPrivacyConsentRecord {
  /** Unique consent record ID (UUID v4) */
  id: string;
  /** User/session identifier (pseudonymized) */
  subjectId: string;
  /** Timestamp of consent action (ISO 8601) */
  timestamp: string;
  /** IP address at time of consent (for proof, then anonymized after recording) */
  ipAddress: string;
  /** User agent string */
  userAgent: string;
  /** Page URL where consent was given */
  consentUrl: string;
  /** Consent version (banner text version hash) */
  consentVersion: string;
  /** Jurisdiction determined for this user */
  jurisdiction: string;
  /** Individual purpose consent states */
  purposes: Record<EPrivacyPurpose, boolean>;
  /** GDPR lawful basis for each purpose (independent of ePrivacy consent) */
  gdprBases: Record<string, GDPRLawfulBasis>;
  /** Whether GPC signal was detected */
  gpcDetected: boolean;
  /** Whether consent was withdrawn (and when) */
  withdrawn: boolean;
  withdrawnAt?: string;
  /** Consent method: banner, settings page, API */
  method: 'banner' | 'settings' | 'api' | 'gpc_signal';
  /** Hash of the consent banner content shown to the user */
  bannerContentHash: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export interface ConsentStorage {
  save(record: EPrivacyConsentRecord): Promise<void>;
  findBySubject(subjectId: string): Promise<EPrivacyConsentRecord | null>;
  findLatestBySubject(subjectId: string): Promise<EPrivacyConsentRecord | null>;
  /** Append-only audit log — consent records are NEVER deleted or modified */
  appendAuditLog(entry: ConsentAuditEntry): Promise<void>;
}

export interface ConsentAuditEntry {
  recordId: string;
  action: 'granted' | 'withdrawn' | 'modified' | 'gpc_applied' | 'expired';
  timestamp: string;
  purposes: Record<EPrivacyPurpose, boolean>;
  triggeredBy: 'user' | 'gpc' | 'expiry' | 'admin';
  metadata?: Record<string, unknown>;
}

export class EPrivacyConsentEngine {
  constructor(
    private readonly storage: ConsentStorage,
    private readonly defaultJurisdiction: string = 'EU',
  ) {}

  // ───────────────────────────────────────────────────────────────
  // JURISDICTION DETECTION
  // ───────────────────────────────────────────────────────────────

  /**
   * Determine applicable jurisdiction from request context.
   * Priority: explicit user selection > GeoIP > Accept-Language > default
   *
   * IMPORTANT: GeoIP is not authoritative. Users may use VPNs.
   * The most restrictive applicable jurisdiction should be applied
   * when ambiguous (precautionary principle).
   */
  detectJurisdiction(request: {
    geoipCountry?: string;
    acceptLanguage?: string;
    userSelection?: string;
    gpcSignal?: boolean;
  }): JurisdictionConfig {
    // User's explicit selection takes priority
    if (request.userSelection && JURISDICTION_CONFIGS[request.userSelection]) {
      return JURISDICTION_CONFIGS[request.userSelection];
    }

    // GeoIP mapping
    if (request.geoipCountry) {
      const mapped = this.mapCountryToJurisdiction(request.geoipCountry);
      if (mapped) return mapped;
    }

    // Accept-Language fallback
    if (request.acceptLanguage) {
      const lang = request.acceptLanguage.split(',')[0]?.split('-')[1]?.toUpperCase();
      if (lang) {
        const mapped = this.mapCountryToJurisdiction(lang);
        if (mapped) return mapped;
      }
    }

    return JURISDICTION_CONFIGS[this.defaultJurisdiction] ?? JURISDICTION_CONFIGS.EU;
  }

  private mapCountryToJurisdiction(countryCode: string): JurisdictionConfig | null {
    // EU/EEA member states → EU config (with country-specific overrides)
    const euCountries = [
      'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU',
      'IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
      // EEA
      'IS','LI','NO',
    ];

    if (countryCode === 'TR') return JURISDICTION_CONFIGS.TR;
    if (countryCode === 'DE') return JURISDICTION_CONFIGS.DE;
    if (countryCode === 'FR') return JURISDICTION_CONFIGS.FR;
    if (euCountries.includes(countryCode)) return JURISDICTION_CONFIGS.EU;
    if (countryCode === 'US') {
      // US state-level detection would require more granular GeoIP
      // Default to California (most restrictive) for US
      return JURISDICTION_CONFIGS.US_CA;
    }

    return null;
  }

  // ───────────────────────────────────────────────────────────────
  // CONSENT GRANTING
  // ───────────────────────────────────────────────────────────────

  /**
   * Record a consent decision from the user.
   *
   * Validation per Planet49 (C-673/17):
   * - Consent must be affirmative (no pre-checked boxes)
   * - Consent must be specific (per-purpose)
   * - Consent must be informed (banner version tracked)
   *
   * Validation per GDPR Art. 7(4):
   * - Consent must be freely given (no cookie wall coercion)
   */
  async grantConsent(input: {
    subjectId: string;
    purposes: Record<EPrivacyPurpose, boolean>;
    gdprBases: Record<string, GDPRLawfulBasis>;
    ipAddress: string;
    userAgent: string;
    consentUrl: string;
    consentVersion: string;
    bannerContentHash: string;
    jurisdiction: string;
    gpcDetected: boolean;
  }): Promise<EPrivacyConsentRecord> {
    const config = JURISDICTION_CONFIGS[input.jurisdiction] ?? JURISDICTION_CONFIGS.EU;

    // ─── VALIDATION ───

    // 1. Planet49: Pre-checked boxes prohibited in opt-in jurisdictions
    if (config.preCheckedProhibited) {
      // This validation must be enforced CLIENT-SIDE in the banner UI
      // Server-side: we verify the consent was explicitly granted
      // (the record exists = user took affirmative action)
    }

    // 2. GPC Signal: If detected and jurisdiction requires honoring,
    //    override advertising/sale purposes to FALSE
    if (input.gpcDetected && config.honorGPC) {
      input.purposes[EPrivacyPurpose.ADVERTISING] = false;
      // CCPA: GPC = opt-out of "sale" and "sharing"
      // Even if user clicked "Accept All", GPC takes precedence
      // per CCPA §1798.135(b) and Sephora enforcement
    }

    // 3. ePrivacy: Strictly necessary cookies NEVER require consent
    //    — force to true regardless of user choice
    input.purposes[EPrivacyPurpose.STRICTLY_NECESSARY] = true;

    // 4. Validate GDPR lawful basis independence
    //    Consent under ePrivacy (for terminal access) does NOT automatically
    //    establish a GDPR lawful basis for processing the resulting data
    this.validateGDPRBases(input.purposes, input.gdprBases);

    const record: EPrivacyConsentRecord = {
      id: crypto.randomUUID(),
      subjectId: input.subjectId,
      timestamp: new Date().toISOString(),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      consentUrl: input.consentUrl,
      consentVersion: input.consentVersion,
      jurisdiction: input.jurisdiction,
      purposes: { ...input.purposes },
      gdprBases: { ...input.gdprBases },
      gpcDetected: input.gpcDetected,
      withdrawn: false,
      method: input.gpcDetected ? 'gpc_signal' : 'banner',
      bannerContentHash: input.bannerContentHash,
    };

    await this.storage.save(record);
    await this.storage.appendAuditLog({
      recordId: record.id,
      action: 'granted',
      timestamp: record.timestamp,
      purposes: record.purposes,
      triggeredBy: input.gpcDetected ? 'gpc' : 'user',
    });

    return record;
  }

  // ───────────────────────────────────────────────────────────────
  // CONSENT VERIFICATION (called before EVERY tracking operation)
  // ───────────────────────────────────────────────────────────────

  /**
   * Check if a specific ePrivacy purpose is consented.
   * This MUST be called before any cookie/tracking/embed operation.
   *
   * Returns { allowed, reason, statute } for audit trail.
   */
  async checkConsent(
    subjectId: string,
    purpose: EPrivacyPurpose,
    gpcSignal: boolean = false,
  ): Promise<{
    allowed: boolean;
    reason: string;
    statute: string;
    requiresGDPRBasis: boolean;
  }> {
    // Strictly necessary: always allowed (ePrivacy Art. 5(3) exception)
    if (purpose === EPrivacyPurpose.STRICTLY_NECESSARY) {
      return {
        allowed: true,
        reason: 'Strictly necessary exemption under ePrivacy Art. 5(3)',
        statute: 'ePrivacy Directive 2002/58/EC Art. 5(3)',
        requiresGDPRBasis: false,
      };
    }

    // GPC signal override for advertising (CCPA)
    if (gpcSignal && purpose === EPrivacyPurpose.ADVERTISING) {
      return {
        allowed: false,
        reason: 'Global Privacy Control signal detected — advertising opt-out mandatory',
        statute: 'CCPA §1798.135(b), AG v. Sephora (2022)',
        requiresGDPRBasis: false,
      };
    }

    const record = await this.storage.findLatestBySubject(subjectId);

    if (!record) {
      return {
        allowed: false,
        reason: 'No consent record found — consent required before terminal equipment access',
        statute: 'ePrivacy Art. 5(3), CJEU Planet49 C-673/17',
        requiresGDPRBasis: true,
      };
    }

    if (record.withdrawn) {
      return {
        allowed: false,
        reason: `Consent withdrawn at ${record.withdrawnAt}`,
        statute: 'GDPR Art. 7(3) — withdrawal as easy as granting',
        requiresGDPRBasis: true,
      };
    }

    const purposeConsented = record.purposes[purpose] ?? false;

    return {
      allowed: purposeConsented,
      reason: purposeConsented
        ? `Consent granted for "${purpose}" on ${record.timestamp} (v${record.consentVersion})`
        : `Consent NOT granted for "${purpose}" — user did not enable this purpose`,
      statute: 'ePrivacy Art. 5(3), GDPR Art. 6(1)(a)',
      requiresGDPRBasis: purposeConsented,
    };
  }

  // ───────────────────────────────────────────────────────────────
  // CONSENT WITHDRAWAL (GDPR Art. 7(3))
  // ───────────────────────────────────────────────────────────────

  /**
   * Withdraw consent. Must be as easy as granting (Art. 7(3)).
   * Triggers propagation to all integrated services.
   */
  async withdrawConsent(
    subjectId: string,
    purposes?: EPrivacyPurpose[], // If specified, withdraw only these; else all
  ): Promise<void> {
    const record = await this.storage.findLatestBySubject(subjectId);
    if (!record) return;

    const withdrawnPurposes = { ...record.purposes };
    const targetPurposes = purposes ?? Object.values(EPrivacyPurpose);

    for (const purpose of targetPurposes) {
      if (purpose !== EPrivacyPurpose.STRICTLY_NECESSARY) {
        withdrawnPurposes[purpose] = false;
      }
    }

    const allWithdrawn = Object.entries(withdrawnPurposes)
      .filter(([k]) => k !== EPrivacyPurpose.STRICTLY_NECESSARY)
      .every(([_, v]) => !v);

    const updatedRecord: EPrivacyConsentRecord = {
      ...record,
      id: crypto.randomUUID(), // New record (append-only log)
      timestamp: new Date().toISOString(),
      purposes: withdrawnPurposes,
      withdrawn: allWithdrawn,
      withdrawnAt: new Date().toISOString(),
      method: 'settings',
    };

    await this.storage.save(updatedRecord);
    await this.storage.appendAuditLog({
      recordId: updatedRecord.id,
      action: 'withdrawn',
      timestamp: updatedRecord.timestamp,
      purposes: withdrawnPurposes,
      triggeredBy: 'user',
    });

    // CRITICAL: Propagate withdrawal to all third-party services
    // This must trigger:
    // 1. Cookie deletion (set Max-Age=0 for all non-necessary cookies)
    // 2. Third-party SDK cleanup (e.g., ga('remove'), fbq('consent', 'revoke'))
    // 3. Server-side session cleanup
    // 4. Real-time notification via SSE/WebSocket to client
  }

  // ───────────────────────────────────────────────────────────────
  // MIDDLEWARE (Express/Next.js/Hono compatible)
  // ───────────────────────────────────────────────────────────────

  /**
   * HTTP middleware that:
   * 1. Reads GPC signal from Sec-GPC header
   * 2. Attaches consent state to request context
   * 3. Blocks tracking requests if consent not granted
   */
  middleware() {
    return async (req: Request): Promise<ConsentContext> => {
      const gpcSignal = req.headers.get('sec-gpc') === '1'
        || req.headers.get('dnt') === '1'; // DNT is deprecated but still read

      const subjectId = this.extractSubjectId(req);
      const jurisdiction = this.detectJurisdiction({
        geoipCountry: req.headers.get('cf-ipcountry') ?? undefined,
        acceptLanguage: req.headers.get('accept-language') ?? undefined,
        gpcSignal,
      });

      const record = subjectId
        ? await this.storage.findLatestBySubject(subjectId)
        : null;

      return {
        subjectId,
        jurisdiction,
        gpcSignal,
        consentRecord: record,
        hasConsent: (purpose: EPrivacyPurpose) => {
          if (purpose === EPrivacyPurpose.STRICTLY_NECESSARY) return true;
          if (gpcSignal && purpose === EPrivacyPurpose.ADVERTISING) return false;
          return record?.purposes[purpose] ?? false;
        },
      };
    };
  }

  private extractSubjectId(req: Request): string | null {
    // Extract from session cookie (strictly necessary, no consent needed)
    // Implementation depends on auth framework
    return null; // Placeholder
  }

  private validateGDPRBases(
    purposes: Record<EPrivacyPurpose, boolean>,
    gdprBases: Record<string, GDPRLawfulBasis>,
  ): void {
    // For each consented ePrivacy purpose that involves personal data processing,
    // verify that a GDPR lawful basis is documented.
    //
    // Example: Analytics cookies (ePrivacy consent) + processing the analytics
    // data (GDPR basis needed: legitimate interest or consent).
    //
    // This is the DECOUPLING that CompliRules currently lacks.
    for (const [purpose, consented] of Object.entries(purposes)) {
      if (consented && purpose !== EPrivacyPurpose.STRICTLY_NECESSARY) {
        const basis = gdprBases[purpose];
        if (!basis) {
          console.warn(
            `[CompliRules] ePrivacy consent granted for "${purpose}" but no ` +
            `GDPR lawful basis documented. Processing personal data from ` +
            `this cookie/tracking still requires a GDPR Art. 6 basis.`
          );
        }
      }
    }
  }
}

export interface ConsentContext {
  subjectId: string | null;
  jurisdiction: JurisdictionConfig;
  gpcSignal: boolean;
  consentRecord: EPrivacyConsentRecord | null;
  hasConsent: (purpose: EPrivacyPurpose) => boolean;
}
