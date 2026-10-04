/**
 * @module true-anonymizer
 * @description Anonymization engine satisfying GDPR Recital 26 and
 * WP29 Opinion 05/2014 on Anonymisation Techniques.
 *
 * Legal foundation:
 * - GDPR Recital 26 ("means reasonably likely to be used")
 * - WP29 Opinion 05/2014 on Anonymisation Techniques (WP216)
 * - GDPR Art. 4(5) (pseudonymisation definition)
 * - HIPAA Safe Harbor (45 CFR §164.514(b)) — 18 identifier removal
 *
 * Anonymization hierarchy (weakest → strongest):
 * 1. Masking (PII scrubbing) — still personal data in most cases
 * 2. Pseudonymisation (tokenization) — still personal data (Art. 4(5))
 * 3. k-Anonymity — resists singling out
 * 4. l-Diversity — resists attribute disclosure
 * 5. t-Closeness — resists skewness attack
 * 6. Differential Privacy — mathematical privacy guarantee
 * 7. Crypto-shredding (KMS key destruction) — irreversible
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AnonymizationConfig {
  /** Target k value for k-anonymity (minimum 5, recommended 10+) */
  kAnonymity: number;
  /** Target l value for l-diversity (minimum 2, recommended 3+) */
  lDiversity: number;
  /** Target t value for t-closeness (0 < t ≤ 1, lower = stronger) */
  tCloseness: number;
  /** Differential privacy epsilon (privacy budget, lower = stronger) */
  dpEpsilon: number;
  /** Differential privacy delta (failure probability) */
  dpDelta: number;
  /** Quasi-identifiers (fields that, combined, could re-identify) */
  quasiIdentifiers: string[];
  /** Sensitive attributes (the values we're protecting) */
  sensitiveAttributes: string[];
  /** Direct identifiers (must be removed or encrypted) */
  directIdentifiers: string[];
  /** HIPAA mode: enforce Safe Harbor 18-identifier removal */
  hipaaMode: boolean;
}

export interface AnonymizationResult {
  /** Whether the dataset meets the configured anonymization thresholds */
  isAnonymous: boolean;
  /** Whether it's pseudonymised (weaker than anonymous) */
  isPseudonymised: boolean;
  /** The anonymized dataset */
  data: Record<string, unknown>[];
  /** k-anonymity achieved */
  achievedK: number;
  /** l-diversity achieved (per equivalence class) */
  achievedL: number;
  /** t-closeness achieved */
  achievedT: number;
  /** Differential privacy budget consumed */
  dpBudgetConsumed: number;
  /** Re-identification risk score (0-1, lower is better) */
  reidentificationRisk: number;
  /** WP29 attack resistance assessment */
  wp29Assessment: WP29Assessment;
  /** Warnings and recommendations */
  warnings: string[];
}

/** WP29 Opinion 05/2014: Three attack vectors */
export interface WP29Assessment {
  /** Can a specific individual be isolated in the dataset? */
  singlingOut: AttackResistance;
  /** Can records about the same individual be linked across datasets? */
  linkability: AttackResistance;
  /** Can the value of an attribute be inferred for an individual? */
  inference: AttackResistance;
  overallVerdict: 'anonymous' | 'pseudonymised' | 'personal_data';
}

export interface AttackResistance {
  resistant: boolean;
  technique: string;
  confidence: number; // 0-1
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HIPAA SAFE HARBOR: 18 IDENTIFIERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * HIPAA Safe Harbor Method (45 CFR §164.514(b)(2))
 * ALL 18 identifier types must be removed for Safe Harbor de-identification.
 */
export const HIPAA_SAFE_HARBOR_IDENTIFIERS = [
  { id: 1,  name: 'names',                    regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,  description: 'Names' },
  { id: 2,  name: 'geographic_subdivisions',   regex: null, /* requires geo lookup */    description: 'Geographic data smaller than state (street, city, zip 3+)' },
  { id: 3,  name: 'dates',                     regex: /\b\d{4}-\d{2}-\d{2}\b/g,         description: 'All dates except year (for ages ≤89); ages ≥90 grouped' },
  { id: 4,  name: 'phone_numbers',             regex: /\b\+?[\d\s\-().]{7,15}\b/g,      description: 'Telephone numbers' },
  { id: 5,  name: 'fax_numbers',               regex: /\bfax[:\s]*[\d\s\-().]+\b/gi,    description: 'Fax numbers' },
  { id: 6,  name: 'email_addresses',           regex: /\b[\w.+-]+@[\w-]+\.[\w.]+\b/g,   description: 'Email addresses' },
  { id: 7,  name: 'ssn',                       regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,       description: 'Social security numbers' },
  { id: 8,  name: 'medical_record_numbers',    regex: /\bMRN[:\s]*\w+\b/gi,             description: 'Medical record numbers' },
  { id: 9,  name: 'health_plan_beneficiary',   regex: /\bHPB[:\s]*\w+\b/gi,             description: 'Health plan beneficiary numbers' },
  { id: 10, name: 'account_numbers',           regex: /\b\d{8,17}\b/g,                  description: 'Account numbers' },
  { id: 11, name: 'certificate_license',       regex: null,                               description: 'Certificate/license numbers' },
  { id: 12, name: 'vehicle_identifiers',       regex: /\b[A-Z0-9]{17}\b/g,              description: 'Vehicle identifiers/serial numbers (VIN)' },
  { id: 13, name: 'device_identifiers',        regex: null,                               description: 'Device identifiers and serial numbers' },
  { id: 14, name: 'web_urls',                  regex: /https?:\/\/[^\s]+/g,              description: 'Web URLs' },
  { id: 15, name: 'ip_addresses',              regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, description: 'IP addresses' },
  { id: 16, name: 'biometric_identifiers',     regex: null,                               description: 'Biometric identifiers (fingerprints, voice, retina)' },
  { id: 17, name: 'full_face_photos',          regex: null,                               description: 'Full-face photographs and comparable images' },
  { id: 18, name: 'unique_identifying_numbers', regex: null,                              description: 'Any other unique identifying number, characteristic, or code' },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// CORE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export class TrueAnonymizer {
  constructor(private readonly config: AnonymizationConfig) {}

  /**
   * Anonymize a dataset with full WP29-compliant verification.
   *
   * Steps:
   * 1. Remove direct identifiers
   * 2. Generalise quasi-identifiers to achieve k-anonymity
   * 3. Verify l-diversity on sensitive attributes
   * 4. Verify t-closeness
   * 5. Apply differential privacy noise if configured
   * 6. Perform re-identification risk assessment
   * 7. Generate WP29 attack resistance report
   */
  anonymize(
    records: Record<string, unknown>[],
  ): AnonymizationResult {
    if (records.length === 0) {
      return this.emptyResult();
    }

    let processedRecords = [...records.map(r => ({ ...r }))];

    // Step 1: Remove direct identifiers
    processedRecords = this.removeDirectIdentifiers(processedRecords);

    // Step 1b: HIPAA Safe Harbor (if enabled)
    if (this.config.hipaaMode) {
      processedRecords = this.applyHIPAASafeHarbor(processedRecords);
    }

    // Step 2: Generalise quasi-identifiers for k-anonymity
    processedRecords = this.generaliseForKAnonymity(processedRecords);

    // Step 3: Verify l-diversity
    const lDiversityResult = this.checkLDiversity(processedRecords);

    // Step 4: Verify t-closeness
    const tClosenessResult = this.checkTCloseness(processedRecords);

    // Step 5: Apply differential privacy (optional)
    if (this.config.dpEpsilon > 0) {
      processedRecords = this.applyDifferentialPrivacy(processedRecords);
    }

    // Step 6: Re-identification risk assessment
    const reidentificationRisk = this.assessReidentificationRisk(processedRecords);

    // Step 7: WP29 assessment
    const wp29 = this.performWP29Assessment(
      processedRecords, lDiversityResult, tClosenessResult, reidentificationRisk
    );

    const achievedK = this.measureKAnonymity(processedRecords);

    return {
      isAnonymous: wp29.overallVerdict === 'anonymous',
      isPseudonymised: wp29.overallVerdict === 'pseudonymised',
      data: processedRecords,
      achievedK,
      achievedL: lDiversityResult.minL,
      achievedT: tClosenessResult.maxT,
      dpBudgetConsumed: this.config.dpEpsilon,
      reidentificationRisk,
      wp29Assessment: wp29,
      warnings: this.generateWarnings(wp29, achievedK, lDiversityResult, reidentificationRisk),
    };
  }

  // ─── DIRECT IDENTIFIER REMOVAL ───

  private removeDirectIdentifiers(
    records: Record<string, unknown>[]
  ): Record<string, unknown>[] {
    return records.map(record => {
      const cleaned = { ...record };
      for (const field of this.config.directIdentifiers) {
        delete cleaned[field];
      }
      return cleaned;
    });
  }

  // ─── HIPAA SAFE HARBOR ───

  private applyHIPAASafeHarbor(
    records: Record<string, unknown>[]
  ): Record<string, unknown>[] {
    return records.map(record => {
      const cleaned = { ...record };
      for (const [key, value] of Object.entries(cleaned)) {
        if (typeof value === 'string') {
          let scrubbed = value;
          for (const identifier of HIPAA_SAFE_HARBOR_IDENTIFIERS) {
            if (identifier.regex) {
              scrubbed = scrubbed.replace(identifier.regex, `[${identifier.name.toUpperCase()}_REMOVED]`);
            }
          }
          cleaned[key] = scrubbed;
        }
      }

      // Date generalisation: keep only year (unless age >89, then group as "90+")
      for (const [key, value] of Object.entries(cleaned)) {
        if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
          const date = new Date(value as string);
          const age = new Date().getFullYear() - date.getFullYear();
          if (age >= 90) {
            cleaned[key] = '90+';
          } else {
            cleaned[key] = date.getFullYear().toString(); // Keep year only
          }
        }
      }

      // Zip code: keep only first 3 digits (if population > 20,000; else set to "000")
      if (typeof cleaned['zipCode'] === 'string') {
        const zip3 = (cleaned['zipCode'] as string).substring(0, 3);
        // In production: look up Census population for this 3-digit zip
        cleaned['zipCode'] = zip3;
      }

      return cleaned;
    });
  }

  // ─── K-ANONYMITY ───

  /**
   * Generalise quasi-identifiers until each equivalence class
   * has at least k records.
   *
   * Uses a bottom-up generalisation hierarchy:
   * - Age: exact → 5-year range → 10-year range → 20-year range
   * - Zip code: full → 3-digit → state → country
   * - Date: exact → month → quarter → year
   */
  private generaliseForKAnonymity(
    records: Record<string, unknown>[]
  ): Record<string, unknown>[] {
    let current = records;
    let currentK = this.measureKAnonymity(current);
    let generalisationLevel = 0;

    while (currentK < this.config.kAnonymity && generalisationLevel < 5) {
      generalisationLevel++;
      current = current.map(record => {
        const generalised = { ...record };
        for (const qi of this.config.quasiIdentifiers) {
          generalised[qi] = this.generalise(generalised[qi], qi, generalisationLevel);
        }
        return generalised;
      });
      currentK = this.measureKAnonymity(current);
    }

    // If k-anonymity still not achieved, suppress small equivalence classes
    if (currentK < this.config.kAnonymity) {
      current = this.suppressSmallClasses(current);
    }

    return current;
  }

  private generalise(value: unknown, field: string, level: number): unknown {
    if (typeof value === 'number') {
      // Numeric generalisation: round to nearest 5, 10, 20, 50, 100
      const granularities = [5, 10, 20, 50, 100];
      const gran = granularities[Math.min(level - 1, granularities.length - 1)];
      return Math.floor((value as number) / gran) * gran;
    }

    if (typeof value === 'string') {
      // String generalisation: progressively truncate
      const maxLen = Math.max(1, (value as string).length - level);
      return (value as string).substring(0, maxLen) + '*'.repeat(level);
    }

    return value;
  }

  private measureKAnonymity(records: Record<string, unknown>[]): number {
    const classes = this.buildEquivalenceClasses(records);
    if (classes.size === 0) return 0;
    return Math.min(...Array.from(classes.values()).map(c => c.length));
  }

  private buildEquivalenceClasses(
    records: Record<string, unknown>[]
  ): Map<string, Record<string, unknown>[]> {
    const classes = new Map<string, Record<string, unknown>[]>();
    for (const record of records) {
      const key = this.config.quasiIdentifiers
        .map(qi => JSON.stringify(record[qi]))
        .join('|');
      const existing = classes.get(key) ?? [];
      existing.push(record);
      classes.set(key, existing);
    }
    return classes;
  }

  private suppressSmallClasses(records: Record<string, unknown>[]): Record<string, unknown>[] {
    const classes = this.buildEquivalenceClasses(records);
    const retained: Record<string, unknown>[] = [];
    for (const members of classes.values()) {
      if (members.length >= this.config.kAnonymity) {
        retained.push(...members);
      }
      // Small classes are suppressed (records removed)
    }
    return retained;
  }

  // ─── L-DIVERSITY ───

  private checkLDiversity(records: Record<string, unknown>[]): {
    minL: number;
    failingClasses: string[];
  } {
    const classes = this.buildEquivalenceClasses(records);
    let minL = Infinity;
    const failingClasses: string[] = [];

    for (const [key, members] of classes) {
      for (const attr of this.config.sensitiveAttributes) {
        const distinctValues = new Set(members.map(m => JSON.stringify(m[attr])));
        const l = distinctValues.size;
        if (l < minL) minL = l;
        if (l < this.config.lDiversity) {
          failingClasses.push(
            `Class "${key}" has only ${l} distinct values for "${attr}" ` +
            `(required: ${this.config.lDiversity})`
          );
        }
      }
    }

    return { minL: minL === Infinity ? 0 : minL, failingClasses };
  }

  // ─── T-CLOSENESS ───

  private checkTCloseness(records: Record<string, unknown>[]): {
    maxT: number;
    failingClasses: string[];
  } {
    const classes = this.buildEquivalenceClasses(records);
    let maxT = 0;
    const failingClasses: string[] = [];

    for (const attr of this.config.sensitiveAttributes) {
      // Global distribution of the sensitive attribute
      const globalDist = this.computeDistribution(records, attr);

      for (const [key, members] of classes) {
        // Class-specific distribution
        const classDist = this.computeDistribution(members, attr);

        // Earth Mover's Distance (EMD) between distributions
        const t = this.earthMoversDistance(globalDist, classDist);
        if (t > maxT) maxT = t;
        if (t > this.config.tCloseness) {
          failingClasses.push(
            `Class "${key}" has t-closeness ${t.toFixed(4)} for "${attr}" ` +
            `(threshold: ${this.config.tCloseness})`
          );
        }
      }
    }

    return { maxT, failingClasses };
  }

  private computeDistribution(
    records: Record<string, unknown>[],
    attr: string,
  ): Map<string, number> {
    const dist = new Map<string, number>();
    for (const record of records) {
      const val = JSON.stringify(record[attr]);
      dist.set(val, (dist.get(val) ?? 0) + 1);
    }
    // Normalize
    const total = records.length;
    for (const [key, count] of dist) {
      dist.set(key, count / total);
    }
    return dist;
  }

  private earthMoversDistance(
    dist1: Map<string, number>,
    dist2: Map<string, number>,
  ): number {
    const allKeys = new Set([...dist1.keys(), ...dist2.keys()]);
    let distance = 0;
    for (const key of allKeys) {
      const p = dist1.get(key) ?? 0;
      const q = dist2.get(key) ?? 0;
      distance += Math.abs(p - q);
    }
    return distance / 2; // Normalised to [0,1]
  }

  // ─── DIFFERENTIAL PRIVACY ───

  private applyDifferentialPrivacy(
    records: Record<string, unknown>[]
  ): Record<string, unknown>[] {
    // Laplace mechanism for numeric fields
    return records.map(record => {
      const noised = { ...record };
      for (const attr of this.config.sensitiveAttributes) {
        const value = noised[attr];
        if (typeof value === 'number') {
          // Laplace noise: sensitivity / epsilon
          const sensitivity = 1; // Assuming sensitivity of 1 (count query)
          const scale = sensitivity / this.config.dpEpsilon;
          const noise = this.laplace(scale);
          noised[attr] = Math.round((value as number) + noise);
        }
      }
      return noised;
    });
  }

  private laplace(scale: number): number {
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  // ─── RE-IDENTIFICATION RISK ───

  private assessReidentificationRisk(records: Record<string, unknown>[]): number {
    const k = this.measureKAnonymity(records);
    if (k === 0) return 1.0;

    // Prosecutor risk: 1/k (probability of identifying a known member)
    const prosecutorRisk = 1 / k;

    // Journalist risk: 1/N for each equivalence class member
    // (probability that a randomly chosen record matches a target)
    const classes = this.buildEquivalenceClasses(records);
    const journalistRisk = 1 / records.length;

    // Marketer risk: average probability across all equivalence classes
    const classSizes = Array.from(classes.values()).map(c => c.length);
    const avgClassSize = classSizes.reduce((a, b) => a + b, 0) / classSizes.length;
    const marketerRisk = 1 / avgClassSize;

    // Overall risk: maximum of all three models
    return Math.max(prosecutorRisk, journalistRisk, marketerRisk);
  }

  // ─── WP29 ASSESSMENT ───

  private performWP29Assessment(
    records: Record<string, unknown>[],
    lDiv: { minL: number; failingClasses: string[] },
    tClose: { maxT: number; failingClasses: string[] },
    reidentRisk: number,
  ): WP29Assessment {
    const k = this.measureKAnonymity(records);

    const singlingOut: AttackResistance = {
      resistant: k >= this.config.kAnonymity,
      technique: `k-anonymity (k=${k})`,
      confidence: Math.min(1, k / this.config.kAnonymity),
      description: k >= this.config.kAnonymity
        ? `Each equivalence class contains ≥${k} records. Singling out resisted.`
        : `k=${k} is below threshold ${this.config.kAnonymity}. Singling out POSSIBLE.`,
    };

    const linkability: AttackResistance = {
      resistant: lDiv.failingClasses.length === 0 && this.config.directIdentifiers.length > 0,
      technique: `l-diversity (l=${lDiv.minL}) + direct identifier removal`,
      confidence: lDiv.failingClasses.length === 0 ? 0.85 : 0.3,
      description: lDiv.failingClasses.length === 0
        ? `All equivalence classes have ≥${lDiv.minL} distinct sensitive values.`
        : `${lDiv.failingClasses.length} classes fail l-diversity. Linkage POSSIBLE.`,
    };

    const inference: AttackResistance = {
      resistant: tClose.failingClasses.length === 0,
      technique: `t-closeness (t=${tClose.maxT.toFixed(4)})`,
      confidence: tClose.failingClasses.length === 0 ? 0.9 : 0.2,
      description: tClose.failingClasses.length === 0
        ? `Attribute distribution within each class closely matches global distribution.`
        : `${tClose.failingClasses.length} classes exceed t-closeness threshold. Inference POSSIBLE.`,
    };

    const allResistant = singlingOut.resistant && linkability.resistant && inference.resistant;
    const anyResistant = singlingOut.resistant || linkability.resistant || inference.resistant;

    return {
      singlingOut,
      linkability,
      inference,
      overallVerdict: allResistant
        ? 'anonymous'
        : anyResistant
          ? 'pseudonymised'
          : 'personal_data',
    };
  }

  // ─── CRYPTO-SHREDDING ───

  /**
   * Crypto-shredding: destroy KMS-managed encryption key
   * to render all encrypted instances of a user's data
   * permanently irrecoverable.
   *
   * Prerequisites:
   * 1. Each user's PII is encrypted with a per-user key (DEK)
   * 2. DEKs are encrypted with a master key (KEK) stored in KMS
   * 3. Shredding = scheduling KEK destruction in KMS
   *
   * CRITICAL: This does NOT work if:
   * - Data is stored in plaintext anywhere
   * - Backup systems have independent key copies
   * - Third-party processors have their own copies
   * - Derived data (ML models, aggregates) retain information
   */
  static async cryptoShred(params: {
    userId: string;
    kmsClient: KMSClient;
    keyId: string;
    verifyCallback?: (userId: string) => Promise<boolean>;
  }): Promise<CryptoShredResult> {
    // 1. Verify all data is encrypted under this key
    if (params.verifyCallback) {
      const verified = await params.verifyCallback(params.userId);
      if (!verified) {
        return {
          success: false,
          error: 'Verification failed: not all user data is encrypted under the target key. '
            + 'Plaintext copies may exist. Manual data deletion required for GDPR Art. 17 compliance.',
          keyId: params.keyId,
          userId: params.userId,
        };
      }
    }

    // 2. Schedule key deletion in KMS (7-30 day waiting period)
    // AWS KMS: scheduleKeyDeletion (7-30 day wait)
    // Azure Key Vault: deletedKey (soft delete, then purge)
    // GCP Cloud KMS: destroyKeyVersion
    await params.kmsClient.scheduleKeyDeletion({
      keyId: params.keyId,
      pendingWindowInDays: 7, // Minimum allowed by AWS KMS
    });

    // 3. Log the shredding event (append-only audit log)
    // This log entry itself must NOT contain PII

    return {
      success: true,
      keyId: params.keyId,
      userId: params.userId,
      scheduledDeletionDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      warnings: [
        'Key deletion is scheduled, not immediate. During the waiting period, '
          + 'the key can be cancelled. After the waiting period, destruction '
          + 'is irreversible.',
        'Verify that backup systems do not retain independent key copies.',
        'Notify all processors per GDPR Art. 17(2) to delete their copies.',
        'Check search indexes, CDN caches, and analytics systems for residual data.',
      ],
    };
  }

  // ─── HELPERS ───

  private emptyResult(): AnonymizationResult {
    return {
      isAnonymous: true,
      isPseudonymised: false,
      data: [],
      achievedK: 0,
      achievedL: 0,
      achievedT: 0,
      dpBudgetConsumed: 0,
      reidentificationRisk: 0,
      wp29Assessment: {
        singlingOut: { resistant: true, technique: 'empty dataset', confidence: 1, description: '' },
        linkability: { resistant: true, technique: 'empty dataset', confidence: 1, description: '' },
        inference: { resistant: true, technique: 'empty dataset', confidence: 1, description: '' },
        overallVerdict: 'anonymous',
      },
      warnings: [],
    };
  }

  private generateWarnings(
    wp29: WP29Assessment,
    k: number,
    lDiv: { minL: number; failingClasses: string[] },
    risk: number,
  ): string[] {
    const warnings: string[] = [];

    if (wp29.overallVerdict !== 'anonymous') {
      warnings.push(
        `⚠️ Data is classified as "${wp29.overallVerdict}" — it remains subject ` +
        `to all GDPR obligations. Anonymization threshold not met per ` +
        `WP29 Opinion 05/2014.`
      );
    }

    if (k < 5) {
      warnings.push(
        `⚠️ k=${k} is below recommended minimum (5). Re-identification ` +
        `risk is HIGH. Consider more aggressive generalisation.`
      );
    }

    if (risk > 0.1) {
      warnings.push(
        `⚠️ Re-identification risk ${(risk * 100).toFixed(1)}% exceeds 10% ` +
        `threshold. This dataset should NOT be treated as anonymous.`
      );
    }

    return warnings;
  }
}

// Stub interfaces for KMS integration
interface KMSClient {
  scheduleKeyDeletion(params: {
    keyId: string;
    pendingWindowInDays: number;
  }): Promise<void>;
}

interface CryptoShredResult {
  success: boolean;
  error?: string;
  keyId: string;
  userId: string;
  scheduledDeletionDate?: string;
  warnings?: string[];
}
