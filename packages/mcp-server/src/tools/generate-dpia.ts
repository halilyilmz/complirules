export interface GenerateDPIAArgs {
  projectName: string;
  processingDescription: string;
  involvesSpecialCategories?: boolean;
  involvesAutomatedDecisionMaking?: boolean;
  involvesLargeScaleMonitoring?: boolean;
  involvesVulnerableSubjects?: boolean;
}

export function handleGenerateDPIA(args: GenerateDPIAArgs): string {
  let triggerCount = 0;
  if (args.involvesSpecialCategories) triggerCount++;
  if (args.involvesAutomatedDecisionMaking) triggerCount++;
  if (args.involvesLargeScaleMonitoring) triggerCount++;
  if (args.involvesVulnerableSubjects) triggerCount++;

  const isDPIAMandatory = triggerCount >= 2;

  return `
# Data Protection Impact Assessment (DPIA)
**System:** ${args.projectName}  
**Date:** ${new Date().toISOString()}  
**Statutory Trigger:** ${isDPIAMandatory ? 'MANDATORY (GDPR Art. 35(3) & WP248 Guidelines)' : 'RECOMMENDED'}

## 1. Systematic Description of Processing
${args.processingDescription}

## 2. Assessment of Necessity & Proportionality
- **Lawful Basis:** GDPR Art. 6(1) / KVKK Art. 5
- **Data Minimisation:** Superfluous attributes stripped via PII scrubber
- **Storage Limitation:** Purge policies configured via automated tombstone/TTL jobs

## 3. Risk Identification & Mitigation Matrix
| Identified Risk | Severity | Likelihood | Mitigation Measure | Residual Risk |
|---|---|---|---|---|
| Unauthorized Cross-Border Access | High | Medium | KMS-backed Envelope Encryption | Low |
| Re-identification via Quasi-Identifiers | Medium | Low | k-Anonymity (k>=5) + l-Diversity | Low |
| Rogue Logging of Sensitive Payload | High | High | AST-level PII scrubber on Winston/Pino | Very Low |

## 4. DPO Opinion & Sign-Off
- **Status:** Pending Review
- **Next Review Cycle:** 12 Months
  `.trim();
}
