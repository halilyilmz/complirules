/**
 * @module jurisdiction-conflict-resolver
 * @description Resolves cross-border statutory collisions by determining
 * which legal obligation takes precedence in a given context.
 *
 * Legal foundation:
 * - GDPR Art. 17(3) (exceptions to erasure: legal obligation, public interest, etc.)
 * - GDPR Art. 6(1)(c) (processing necessary for legal obligation)
 * - GDPR Art. 23 (restrictions by member state law)
 * - KVKK Art. 5(2)(ç) (processing required by law)
 * - KVKK Art. 7(2) (erasure exceptions for legal obligations)
 * - HIPAA §164.530(j) (6-year retention for policies/procedures)
 * - Turkish VUK Art. 253 (tax record retention)
 * - Turkish TTK Art. 82 (commercial record retention)
 * - SOX §802 (financial record retention)
 * - German AO §147 (commercial/tax record retention)
 * - French Code de Commerce L.123-22 (10-year retention)
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface LegalObligation {
  /** Unique identifier */
  id: string;
  /** Statute/regulation name */
  statute: string;
  /** Specific article/section */
  article: string;
  /** Full citation */
  citation: string;
  /** Jurisdiction ISO code */
  jurisdiction: string;
  /** Type of obligation */
  type: ObligationType;
  /** What the obligation requires */
  requirement: string;
  /** Which data categories it applies to */
  dataCategories: string[];
  /** Duration of obligation (in days, -1 for indefinite) */
  durationDays: number;
  /** Priority tier for conflict resolution */
  priority: Priority;
  /** Whether this is an absolute obligation or can be balanced */
  absolute: boolean;
  /** Penalty for non-compliance */
  penalty: string;
  /** Exceptions/derogations */
  exceptions: string[];
}

export enum ObligationType {
  /** Must retain data for a specified period */
  RETAIN = 'retain',
  /** Must delete data upon request */
  DELETE = 'delete',
  /** Must minimise data collection */
  MINIMISE = 'minimise',
  /** Must provide data to the subject */
  PROVIDE_ACCESS = 'provide_access',
  /** Must restrict processing */
  RESTRICT = 'restrict',
  /** Must obtain consent before processing */
  CONSENT = 'consent',
  /** Must encrypt/pseudonymise data */
  PROTECT = 'protect',
  /** Must notify of breach */
  NOTIFY_BREACH = 'notify_breach',
  /** Must transfer data in portable format */
  PORTABILITY = 'portability',
}

export enum Priority {
  /** Criminal law / constitutional right — highest priority */
  CRIMINAL_CONSTITUTIONAL = 1,
  /** Sector-specific regulation with criminal sanctions */
  SECTOR_CRIMINAL = 2,
  /** Tax and financial law with statutory mandate */
  TAX_FINANCIAL = 3,
  /** General data protection regulation */
  DATA_PROTECTION = 4,
  /** Administrative guidance / soft law */
  GUIDANCE = 5,
}

export interface ConflictResult {
  /** The identified conflict */
  conflict: ConflictDescription;
  /** Resolution determination */
  resolution: Resolution;
  /** Legal analysis supporting the resolution */
  analysis: string;
  /** Actions required */
  requiredActions: RequiredAction[];
  /** Documentation to generate */
  documentation: string;
}

export interface ConflictDescription {
  /** The two conflicting obligations */
  obligationA: LegalObligation;
  obligationB: LegalObligation;
  /** Nature of the conflict */
  conflictType: 'erasure_vs_retention' | 'consent_vs_legitimate_interest'
    | 'minimisation_vs_retention' | 'portability_vs_minimum_necessary'
    | 'jurisdictional_scope' | 'consent_age_threshold';
  /** Data categories affected */
  affectedData: string[];
  /** Description of why they conflict */
  description: string;
}

export interface Resolution {
  /** Which obligation prevails */
  prevailingObligation: LegalObligation;
  /** Why it prevails */
  rationale: string;
  /** Statutory basis for the resolution */
  legalBasis: string;
  /** Conditions under which the resolution changes */
  conditions: string[];
  /** Confidence in the resolution (some conflicts have no clear precedent) */
  confidence: 'high' | 'medium' | 'low';
  /** Whether legal counsel should be consulted */
  requiresLegalReview: boolean;
}

export interface RequiredAction {
  action: string;
  deadline?: string;
  responsible: string;
  statute: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// OBLIGATION DATABASE
// ─────────────────────────────────────────────────────────────────────────────

const LEGAL_OBLIGATIONS: LegalObligation[] = [
  // ─── ERASURE OBLIGATIONS ───
  {
    id: 'gdpr_art17_erasure',
    statute: 'GDPR',
    article: 'Art. 17',
    citation: 'Regulation (EU) 2016/679, Article 17',
    jurisdiction: 'EU',
    type: ObligationType.DELETE,
    requirement: 'Erase personal data without undue delay when: (a) data no longer '
      + 'necessary for purpose, (b) consent withdrawn, (c) subject objects, '
      + '(d) unlawful processing, (e) legal obligation, (f) child data.',
    dataCategories: ['all_personal_data'],
    durationDays: 30, // "without undue delay" interpreted as ~30 days
    priority: Priority.DATA_PROTECTION,
    absolute: false, // Has exceptions in Art. 17(3)
    penalty: '€20M or 4% global turnover',
    exceptions: [
      'Art. 17(3)(b): compliance with legal obligation under EU/member state law',
      'Art. 17(3)(d): archiving in public interest, scientific/historical research',
      'Art. 17(3)(e): establishment, exercise, or defence of legal claims',
    ],
  },
  {
    id: 'kvkk_art7_erasure',
    statute: 'KVKK',
    article: 'Art. 7',
    citation: 'Kişisel Verilerin Korunması Kanunu, Madde 7',
    jurisdiction: 'TR',
    type: ObligationType.DELETE,
    requirement: 'Erase, destroy, or anonymise personal data when processing conditions '
      + 'no longer exist, despite being processed in accordance with law.',
    dataCategories: ['all_personal_data'],
    durationDays: 30, // Veri Sorumlusuna Başvuru Tebliği: 30 days
    priority: Priority.DATA_PROTECTION,
    absolute: false,
    penalty: 'TRY 1,946,290 – 9,731,450 + criminal sanctions (TPC Art. 138: 1-2 years)',
    exceptions: [
      'KVKK Art. 7(2): processing conditions under Art. 5(2) and Art. 6(3) still exist',
      'Statutory retention obligations (VUK, TTK, etc.) override erasure',
    ],
  },
  {
    id: 'ccpa_1798105_deletion',
    statute: 'CCPA/CPRA',
    article: '§1798.105',
    citation: 'Cal. Civ. Code §1798.105',
    jurisdiction: 'US_CA',
    type: ObligationType.DELETE,
    requirement: 'Delete consumer personal information upon verifiable request.',
    dataCategories: ['all_personal_information'],
    durationDays: 45, // 45-day response window
    priority: Priority.DATA_PROTECTION,
    absolute: false,
    penalty: '$2,500 unintentional / $7,500 intentional per violation',
    exceptions: [
      '§1798.105(d)(1): complete the transaction',
      '§1798.105(d)(4): detect security incidents',
      '§1798.105(d)(8): comply with legal obligation',
      '§1798.105(d)(9): internal uses reasonably aligned with expectations',
    ],
  },

  // ─── RETENTION OBLIGATIONS ───
  {
    id: 'tr_vuk_253',
    statute: 'Vergi Usul Kanunu (Tax Procedure Law)',
    article: 'Art. 253',
    citation: 'VUK Madde 253, Kanun No. 213',
    jurisdiction: 'TR',
    type: ObligationType.RETAIN,
    requirement: 'Retain accounting books, records, and documents that form the '
      + 'basis for tax obligations for 5 years from the end of the relevant year.',
    dataCategories: ['financial_records', 'invoices', 'receipts', 'tax_declarations'],
    durationDays: 5 * 365, // 5 years
    priority: Priority.TAX_FINANCIAL,
    absolute: true,
    penalty: 'Tax penalties + criminal prosecution (VUK Art. 359)',
    exceptions: [],
  },
  {
    id: 'tr_ttk_82',
    statute: 'Türk Ticaret Kanunu (Turkish Commercial Code)',
    article: 'Art. 82',
    citation: 'TTK Madde 82, Kanun No. 6102',
    jurisdiction: 'TR',
    type: ObligationType.RETAIN,
    requirement: 'Retain all commercial books, documents, and correspondence '
      + 'for 10 years from the end of the relevant year.',
    dataCategories: ['commercial_records', 'correspondence', 'contracts'],
    durationDays: 10 * 365, // 10 years
    priority: Priority.TAX_FINANCIAL,
    absolute: true,
    penalty: 'Civil liability + criminal sanctions (TTK Art. 562)',
    exceptions: [],
  },
  {
    id: 'hipaa_retention',
    statute: 'HIPAA',
    article: '§164.530(j)',
    citation: '45 CFR §164.530(j)',
    jurisdiction: 'US',
    type: ObligationType.RETAIN,
    requirement: 'Retain HIPAA-required documentation (policies, procedures, '
      + 'authorizations, written communications) for 6 years from the date '
      + 'of creation or last effective date, whichever is later.',
    dataCategories: ['hipaa_documentation', 'authorizations', 'policies'],
    durationDays: 6 * 365, // 6 years
    priority: Priority.SECTOR_CRIMINAL,
    absolute: true,
    penalty: '$100-$50,000 per violation, up to $2,067,813 per year per category',
    exceptions: [],
  },
  {
    id: 'sox_retention',
    statute: 'Sarbanes-Oxley Act',
    article: '§802',
    citation: '18 U.S.C. §1520',
    jurisdiction: 'US',
    type: ObligationType.RETAIN,
    requirement: 'Retain audit work papers and financial records for 7 years.',
    dataCategories: ['financial_audit_records', 'work_papers'],
    durationDays: 7 * 365,
    priority: Priority.CRIMINAL_CONSTITUTIONAL, // Criminal penalties
    absolute: true,
    penalty: 'Up to 20 years imprisonment + fines',
    exceptions: [],
  },
  {
    id: 'de_ao_147',
    statute: 'Abgabenordnung (German Fiscal Code)',
    article: '§147',
    citation: 'AO §147',
    jurisdiction: 'DE',
    type: ObligationType.RETAIN,
    requirement: 'Retain books, records, and supporting documents for 8 or 10 years.',
    dataCategories: ['accounting_records', 'business_documents'],
    durationDays: 10 * 365,
    priority: Priority.TAX_FINANCIAL,
    absolute: true,
    penalty: 'Tax penalties + estimates',
    exceptions: [],
  },
  {
    id: 'fr_code_commerce',
    statute: 'Code de Commerce',
    article: 'L.123-22',
    citation: 'Code de Commerce, Article L.123-22',
    jurisdiction: 'FR',
    type: ObligationType.RETAIN,
    requirement: 'Retain accounting documents for 10 years.',
    dataCategories: ['accounting_records'],
    durationDays: 10 * 365,
    priority: Priority.TAX_FINANCIAL,
    absolute: true,
    penalty: 'Tax penalties + professional sanctions',
    exceptions: [],
  },

  // ─── CONSENT VS LEGITIMATE INTEREST ───
  {
    id: 'gdpr_art6_1f_li',
    statute: 'GDPR',
    article: 'Art. 6(1)(f)',
    citation: 'Regulation (EU) 2016/679, Article 6(1)(f)',
    jurisdiction: 'EU',
    type: ObligationType.CONSENT, // Not exactly — LI doesn't require consent
    requirement: 'Processing is lawful when necessary for legitimate interests, '
      + 'except where overridden by data subject interests/fundamental rights. '
      + 'Recital 47: direct marketing may be a legitimate interest.',
    dataCategories: ['all_personal_data'],
    durationDays: -1,
    priority: Priority.DATA_PROTECTION,
    absolute: false,
    penalty: '€20M or 4% global turnover',
    exceptions: [
      'Does not apply to processing by public authorities (Art. 6(1)(f) last sentence)',
    ],
  },
  {
    id: 'kvkk_art5_2f_li',
    statute: 'KVKK',
    article: 'Art. 5(2)(f)',
    citation: 'KVKK Madde 5(2)(f)',
    jurisdiction: 'TR',
    type: ObligationType.CONSENT,
    requirement: 'Processing without consent is lawful when necessary for '
      + 'legitimate interests, provided it does not harm data subject\'s '
      + 'fundamental rights and freedoms. Interpreted MORE NARROWLY than GDPR.',
    dataCategories: ['all_personal_data'],
    durationDays: -1,
    priority: Priority.DATA_PROTECTION,
    absolute: false,
    penalty: 'TRY 1,946,290 – 9,731,450',
    exceptions: [
      'KVKK Board interprets LI narrowly — direct marketing often requires explicit consent',
      'Board Decision 2019/XXX: LI not applicable for profiling without consent',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CORE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export class JurisdictionConflictResolver {

  /**
   * Detect and resolve all conflicts between applicable legal obligations
   * for a given data processing activity.
   */
  resolveConflicts(params: {
    /** Jurisdictions that apply to this processing activity */
    applicableJurisdictions: string[];
    /** Data categories being processed */
    dataCategories: string[];
    /** The requested action (e.g., user requests deletion) */
    requestedAction: ObligationType;
    /** Context: what kind of data and processing */
    context: ProcessingContext;
  }): ConflictResult[] {
    const results: ConflictResult[] = [];

    // 1. Find all applicable obligations
    const applicable = this.findApplicableObligations(
      params.applicableJurisdictions,
      params.dataCategories,
    );

    // 2. Find conflicting pairs
    const conflicts = this.findConflicts(applicable, params.requestedAction);

    // 3. Resolve each conflict
    for (const conflict of conflicts) {
      results.push(this.resolveConflict(conflict, params.context));
    }

    return results;
  }

  /**
   * Specific resolver: GDPR Art. 17 erasure vs statutory retention.
   *
   * This is the most common conflict in practice.
   */
  resolveErasureVsRetention(params: {
    subjectId: string;
    dataCategories: string[];
    jurisdictions: string[];
    erasureRequestDate: string;
  }): {
    canErase: Record<string, boolean>;
    retentionEndDates: Record<string, string>;
    analysis: string;
    actions: RequiredAction[];
  } {
    const result: Record<string, boolean> = {};
    const retentionEndDates: Record<string, string> = {};
    const actions: RequiredAction[] = [];
    const analysisLines: string[] = [];

    for (const category of params.dataCategories) {
      // Find all retention obligations for this category
      const retentionObligations = LEGAL_OBLIGATIONS.filter(
        o =>
          o.type === ObligationType.RETAIN &&
          params.jurisdictions.includes(o.jurisdiction) &&
          (o.dataCategories.includes(category) ||
           o.dataCategories.includes('all_personal_data'))
      );

      if (retentionObligations.length === 0) {
        // No retention obligation → erasure permitted
        result[category] = true;
        analysisLines.push(
          `✅ "${category}": No statutory retention obligation found. ` +
          `Erasure permitted under GDPR Art. 17 / KVKK Art. 7.`
        );
        actions.push({
          action: `Erase all "${category}" data for subject ${params.subjectId}`,
          deadline: new Date(
            new Date(params.erasureRequestDate).getTime() + 30 * 24 * 60 * 60 * 1000
          ).toISOString().split('T')[0],
          responsible: 'Data Controller',
          statute: 'GDPR Art. 17(1) / KVKK Art. 7(1)',
        });
      } else {
        // Retention obligation exists → find the longest one
        const longestRetention = retentionObligations.reduce(
          (max, o) => o.durationDays > max.durationDays ? o : max,
          retentionObligations[0]
        );

        // Retention obligation overrides erasure per GDPR Art. 17(3)(b)
        result[category] = false;

        const retentionEnd = new Date();
        retentionEnd.setDate(retentionEnd.getDate() + longestRetention.durationDays);
        retentionEndDates[category] = retentionEnd.toISOString().split('T')[0];

        analysisLines.push(
          `❌ "${category}": Erasure BLOCKED by ${longestRetention.statute} ` +
          `${longestRetention.article} (${longestRetention.citation}). ` +
          `Retention required until ${retentionEndDates[category]}. ` +
          `GDPR Art. 17(3)(b) exception applies: "compliance with a legal ` +
          `obligation which requires processing by Union or Member State law."`
        );

        actions.push({
          action: `RESTRICT processing of "${category}" data to retention ` +
            `purpose only (GDPR Art. 18). Mark as "restricted — retention only." ` +
            `Schedule automatic deletion on ${retentionEndDates[category]}.`,
          deadline: new Date(
            new Date(params.erasureRequestDate).getTime() + 30 * 24 * 60 * 60 * 1000
          ).toISOString().split('T')[0],
          responsible: 'Data Controller + DPO',
          statute: `GDPR Art. 17(3)(b), Art. 18(1)(c); ${longestRetention.citation}`,
        });

        // Additional action: inform the data subject
        actions.push({
          action: `Inform subject ${params.subjectId} that erasure of "${category}" ` +
            `is partially refused due to ${longestRetention.statute} ` +
            `${longestRetention.article} retention obligation. Provide: ` +
            `(a) which data is retained, (b) legal basis for retention, ` +
            `(c) retention end date, (d) right to lodge complaint with DPA.`,
          deadline: new Date(
            new Date(params.erasureRequestDate).getTime() + 30 * 24 * 60 * 60 * 1000
          ).toISOString().split('T')[0],
          responsible: 'Data Controller',
          statute: 'GDPR Art. 12(4), Art. 17(3)',
        });
      }
    }

    return {
      canErase: result,
      retentionEndDates,
      analysis: analysisLines.join('\n\n'),
      actions,
    };
  }

  /**
   * Specific resolver: Consent model conflicts (opt-in vs opt-out).
   *
   * When the same user may be subject to GDPR (opt-in) and CCPA (opt-out),
   * which model applies? Answer: the most restrictive.
   */
  resolveConsentModelConflict(params: {
    userJurisdictions: string[];
    processingPurpose: string;
  }): {
    requiredModel: 'opt_in' | 'opt_out';
    consentRequired: boolean;
    rationale: string;
    statute: string;
  } {
    // GDPR/KVKK: opt-in required (consent or other lawful basis)
    // CCPA: opt-out (for sale/sharing — but not for all processing)
    // Resolution: apply the most restrictive model

    const hasEU = params.userJurisdictions.some(
      j => ['EU', 'DE', 'FR', 'IT', 'AT', 'NL', 'ES', 'BE', 'PL'].includes(j)
    );
    const hasTR = params.userJurisdictions.includes('TR');
    const hasUS = params.userJurisdictions.some(j => j.startsWith('US'));

    if (hasEU || hasTR) {
      return {
        requiredModel: 'opt_in',
        consentRequired: true,
        rationale: 'GDPR/KVKK opt-in model takes precedence as the most restrictive. '
          + 'Even if user is also subject to CCPA (opt-out), the opt-in requirement '
          + 'is stricter and satisfies both obligations simultaneously.',
        statute: hasEU
          ? 'GDPR Art. 6(1)(a), ePrivacy Art. 5(3)'
          : 'KVKK Art. 5(1) açık rıza',
      };
    }

    if (hasUS) {
      return {
        requiredModel: 'opt_out',
        consentRequired: false,
        rationale: 'CCPA opt-out model applies. User must be given the right to '
          + 'opt out of sale/sharing. GPC signal must be honored (if applicable).',
        statute: 'CCPA §1798.120, §1798.135',
      };
    }

    // Default: opt-in (precautionary principle)
    return {
      requiredModel: 'opt_in',
      consentRequired: true,
      rationale: 'Unable to determine jurisdiction with certainty. '
        + 'Applying most restrictive model (opt-in) as precautionary measure.',
      statute: 'Precautionary principle',
    };
  }

  // ─── INTERNAL METHODS ───

  private findApplicableObligations(
    jurisdictions: string[],
    dataCategories: string[],
  ): LegalObligation[] {
    return LEGAL_OBLIGATIONS.filter(o => {
      const jurisdictionMatch = jurisdictions.includes(o.jurisdiction) ||
        jurisdictions.some(j => j.startsWith(o.jurisdiction));
      const categoryMatch = o.dataCategories.some(
        c => c === 'all_personal_data' || c === 'all_personal_information' ||
             dataCategories.includes(c)
      );
      return jurisdictionMatch && categoryMatch;
    });
  }

  private findConflicts(
    obligations: LegalObligation[],
    requestedAction: ObligationType,
  ): ConflictDescription[] {
    const conflicts: ConflictDescription[] = [];

    // Find obligations that support the requested action
    const supporting = obligations.filter(o => o.type === requestedAction);
    // Find obligations that conflict with the requested action
    const conflicting = obligations.filter(o => {
      if (requestedAction === ObligationType.DELETE) {
        return o.type === ObligationType.RETAIN;
      }
      if (requestedAction === ObligationType.MINIMISE) {
        return o.type === ObligationType.RETAIN;
      }
      if (requestedAction === ObligationType.PORTABILITY) {
        return o.type === ObligationType.MINIMISE; // Minimum necessary vs full export
      }
      return false;
    });

    for (const s of supporting) {
      for (const c of conflicting) {
        const overlappingCategories = s.dataCategories.filter(
          cat => c.dataCategories.includes(cat) ||
                 c.dataCategories.includes('all_personal_data') ||
                 s.dataCategories.includes('all_personal_data')
        );

        if (overlappingCategories.length > 0 || 
            s.dataCategories.includes('all_personal_data') ||
            c.dataCategories.includes('all_personal_data')) {
          conflicts.push({
            obligationA: s,
            obligationB: c,
            conflictType: requestedAction === ObligationType.DELETE
              ? 'erasure_vs_retention'
              : 'minimisation_vs_retention',
            affectedData: overlappingCategories.length > 0
              ? overlappingCategories
              : [...new Set([...s.dataCategories, ...c.dataCategories])],
            description: `${s.statute} ${s.article} (${s.type}) conflicts with `
              + `${c.statute} ${c.article} (${c.type})`,
          });
        }
      }
    }

    return conflicts;
  }

  private resolveConflict(
    conflict: ConflictDescription,
    context: ProcessingContext,
  ): ConflictResult {
    const { obligationA, obligationB } = conflict;

    // Resolution principle: higher priority wins
    // Within same priority: absolute obligations override non-absolute
    // Within same priority and absoluteness: the more specific wins

    let prevailing: LegalObligation;
    let subordinate: LegalObligation;

    if (obligationA.priority < obligationB.priority) {
      // Lower number = higher priority
      prevailing = obligationA;
      subordinate = obligationB;
    } else if (obligationB.priority < obligationA.priority) {
      prevailing = obligationB;
      subordinate = obligationA;
    } else if (obligationA.absolute && !obligationB.absolute) {
      prevailing = obligationA;
      subordinate = obligationB;
    } else if (obligationB.absolute && !obligationA.absolute) {
      prevailing = obligationB;
      subordinate = obligationA;
    } else {
      // Same priority and absoluteness — case-by-case analysis
      // Default: retention wins over deletion (safety principle)
      if (obligationA.type === ObligationType.RETAIN) {
        prevailing = obligationA;
        subordinate = obligationB;
      } else {
        prevailing = obligationB;
        subordinate = obligationA;
      }
    }

    // Check if the subordinate obligation has an exception that covers this case
    const exceptionApplies = subordinate.exceptions.some(
      e => e.toLowerCase().includes('legal obligation') ||
           e.toLowerCase().includes('compliance')
    );

    const rationale = this.buildRationale(prevailing, subordinate, exceptionApplies);

    return {
      conflict,
      resolution: {
        prevailingObligation: prevailing,
        rationale,
        legalBasis: exceptionApplies
          ? `${subordinate.statute} ${subordinate.article} exception + ${prevailing.citation}`
          : `${prevailing.citation} (priority: ${Priority[prevailing.priority]})`,
        conditions: [
          `This resolution applies only while ${prevailing.statute} retention ` +
          `obligation is active (${prevailing.durationDays} days).`,
          `After retention period expires, ${subordinate.statute} ${subordinate.article} ` +
          `obligation resumes and data must be ${subordinate.type === ObligationType.DELETE ? 'erased' : 'processed accordingly'}.`,
          `Processing during retention must be RESTRICTED to the statutory ` +
          `purpose only (GDPR Art. 18(1)(c)).`,
        ],
        confidence: exceptionApplies ? 'high' : 'medium',
        requiresLegalReview: !exceptionApplies || prevailing.priority === subordinate.priority,
      },
      analysis: rationale,
      requiredActions: [
        {
          action: `Comply with ${prevailing.statute} ${prevailing.article}: ` +
            `${prevailing.requirement}`,
          responsible: 'Data Controller',
          statute: prevailing.citation,
        },
        {
          action: `Mark affected data as "restricted — statutory retention only." ` +
            `Do not use for any purpose other than ${prevailing.statute} compliance.`,
          responsible: 'Data Controller',
          statute: 'GDPR Art. 18(1)(c)',
        },
        {
          action: `Schedule automatic review/deletion on retention end date ` +
            `(${new Date(Date.now() + prevailing.durationDays * 86400000)
              .toISOString().split('T')[0]}).`,
          deadline: new Date(
            Date.now() + prevailing.durationDays * 86400000
          ).toISOString().split('T')[0],
          responsible: 'DPO / Data Controller',
          statute: `${prevailing.citation}; ${subordinate.citation}`,
        },
      ],
      documentation: this.generateConflictDocumentation(conflict, prevailing, subordinate),
    };
  }

  private buildRationale(
    prevailing: LegalObligation,
    subordinate: LegalObligation,
    exceptionApplies: boolean,
  ): string {
    if (exceptionApplies) {
      return `${prevailing.statute} ${prevailing.article} prevails over ` +
        `${subordinate.statute} ${subordinate.article} because: ` +
        `(1) ${subordinate.statute} contains an explicit exception for ` +
        `compliance with legal obligations (${subordinate.exceptions.find(
          e => e.toLowerCase().includes('legal obligation')
        )}), and ` +
        `(2) ${prevailing.statute} constitutes a mandatory legal retention ` +
        `obligation that qualifies for this exception. ` +
        `However, processing MUST be restricted to the retention purpose ` +
        `only — the data may not be used for any other purpose during ` +
        `the retention period.`;
    }

    return `${prevailing.statute} ${prevailing.article} is assessed to prevail ` +
      `over ${subordinate.statute} ${subordinate.article} based on: ` +
      `(1) statutory priority (${Priority[prevailing.priority]} > ` +
      `${Priority[subordinate.priority]}), ` +
      `(2) ${prevailing.absolute ? 'absolute' : 'non-absolute'} nature ` +
      `of the obligation. ` +
      `⚠️ LEGAL REVIEW RECOMMENDED: This resolution is based on general ` +
      `priority principles. Case-specific factors may alter the analysis.`;
  }

  private generateConflictDocumentation(
    conflict: ConflictDescription,
    prevailing: LegalObligation,
    subordinate: LegalObligation,
  ): string {
    return [
      `# Jurisdiction Conflict Resolution Record`,
      ``,
      `**Date:** ${new Date().toISOString()}`,
      `**Conflict Type:** ${conflict.conflictType}`,
      `**Affected Data:** ${conflict.affectedData.join(', ')}`,
      ``,
      `## Conflicting Obligations`,
      ``,
      `### Obligation A: ${conflict.obligationA.statute} ${conflict.obligationA.article}`,
      `- Citation: ${conflict.obligationA.citation}`,
      `- Type: ${conflict.obligationA.type}`,
      `- Requirement: ${conflict.obligationA.requirement}`,
      ``,
      `### Obligation B: ${conflict.obligationB.statute} ${conflict.obligationB.article}`,
      `- Citation: ${conflict.obligationB.citation}`,
      `- Type: ${conflict.obligationB.type}`,
      `- Requirement: ${conflict.obligationB.requirement}`,
      ``,
      `## Resolution`,
      ``,
      `**Prevailing:** ${prevailing.statute} ${prevailing.article}`,
      `**Rationale:** See analysis above.`,
      ``,
      `## Required Actions`,
      `1. Comply with retention obligation`,
      `2. Restrict processing to retention purpose only`,
      `3. Schedule automatic deletion at retention end`,
      `4. Inform data subject of partial erasure refusal with legal basis`,
    ].join('\n');
  }
}

export interface ProcessingContext {
  /** Type of entity (e-commerce, health, financial, etc.) */
  entityType: string;
  /** Whether entity is a public authority */
  isPublicAuthority: boolean;
  /** Whether processing involves profiling */
  involvesProfiling: boolean;
  /** Whether processing involves automated decision-making */
  involvesADM: boolean;
  /** Sector-specific regulations that may apply */
  sectorRegulations: string[];
}
