export type Jurisdiction = 'KVKK_TR' | 'GDPR_EU' | 'EAA_EU' | 'HIPAA_US' | 'CCPA_US' | 'AI_ACT_EU' | 'GLOBAL_SEC';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface LegalCitation {
  law: string;
  article: string;
  description: string;
  sourceUrl?: string;
  penaltyContext?: string;
}

export interface RuleDefinition {
  id: string;
  title: string;
  jurisdiction: Jurisdiction;
  severity: Severity;
  globs: string[];
  alwaysApply?: boolean;
  legalCitations: LegalCitation[];
  summary: string;
  instructions: string[];
  forbiddenPatterns: string[];
  compliantCodeSnippets: {
    title: string;
    language: string;
    code: string;
  }[];
}

export interface RulePack {
  id: string;
  name: string;
  jurisdiction: Jurisdiction;
  description: string;
  version: string;
  rules: RuleDefinition[];
}
