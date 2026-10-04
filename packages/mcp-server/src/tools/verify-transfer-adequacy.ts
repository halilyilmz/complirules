export interface VerifyTransferAdequacyArgs {
  exporterCountry: string;
  importerCountry: string;
  serviceName: string;
  isDpfCertified?: boolean;
  dataCategories: string[];
}

export function handleVerifyTransferAdequacy(args: VerifyTransferAdequacyArgs): string {
  const { exporterCountry, importerCountry, serviceName, isDpfCertified, dataCategories } = args;

  let permissible = false;
  let primaryBasis = 'None';
  const warnings: string[] = [];
  const requiredSafeguards: string[] = [];

  // KVKK Evaluation
  if (exporterCountry === 'TR') {
    const kvkkAdequate = ['DE', 'AT', 'FR', 'IT', 'NL'].includes(importerCountry);
    if (!kvkkAdequate) {
      warnings.push(
        `[KVKK Art. 9 ALERT]: Recipient country ${importerCountry} is NOT on the Turkish KVKK Board Adequate Country whitelist. Transfer requires Board-approved Binding Undertaking (Taahhütname) or verified Explicit Consent (Açık Rıza). DPF does not apply to KVKK.`
      );
      requiredSafeguards.push('File KVKK Board Undertaking Application (Taahhütname Onayı)');
    }
  }

  // GDPR Evaluation
  if (importerCountry === 'US') {
    if (isDpfCertified) {
      permissible = true;
      primaryBasis = 'EU-US Data Privacy Framework (GDPR Art. 45)';
    } else {
      primaryBasis = 'Standard Contractual Clauses (SCCs) + EDPB 01/2020 Supplementary Measures';
      warnings.push(
        `[Schrems II ALERT]: ${serviceName} is not DPF certified. FISA 702 / EO 12333 exposure applies. Under Austrian DSB & CNIL rulings, SCCs alone are insufficient if plain text IP/identifiers reach US servers.`
      );
      requiredSafeguards.push('EU-side pseudonymization or reverse proxy stripping IP addresses');
      requiredSafeguards.push('Encryption at rest with customer-managed keys (CMK/KMS) held inside the EEA');
    }
  } else if (['DE', 'FR', 'IT', 'NL', 'ES', 'SE', 'IE'].includes(importerCountry)) {
    permissible = true;
    primaryBasis = 'Intra-EEA Transfer (GDPR Art. 1(2))';
  }

  return JSON.stringify(
    {
      service: serviceName,
      status: permissible ? 'COMPLIANT_WITH_CONDITIONS' : 'HIGH_REGULATORY_EXPOSURE',
      primaryLegalBasis: primaryBasis,
      dataCategoriesEvaluated: dataCategories,
      warnings,
      requiredSupplementaryMeasures: requiredSafeguards,
      citations: [
        'CJEU C-311/18 (Schrems II)',
        'EDPB Recommendations 01/2020 on Supplementary Measures',
        'KVKK Kanun No. 6698 Madde 9',
      ],
    },
    null,
    2
  );
}
