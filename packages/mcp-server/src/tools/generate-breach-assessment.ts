export interface GenerateBreachAssessmentArgs {
  incidentType: string;
  affectedRecordsCount: number;
  dataCategories: string[];
  isEncryptedWithCustomerKey: boolean;
  jurisdiction: 'TR' | 'EU' | 'US' | 'ALL';
}

export function handleGenerateBreachAssessment(args: GenerateBreachAssessmentArgs): string {
  const { incidentType, affectedRecordsCount, dataCategories, isEncryptedWithCustomerKey, jurisdiction } = args;

  const includesSpecialCategory = dataCategories.some(c =>
    ['health', 'biometric', 'credentials', 'credit_card', 'tckn', 'ssn'].includes(c.toLowerCase())
  );

  const notificationsRequired: Record<string, any> = {};

  // KVKK (Turkey)
  if (jurisdiction === 'TR' || jurisdiction === 'ALL') {
    notificationsRequired.KVKK = {
      authority: 'Kişisel Verileri Koruma Kurulu (KVKK)',
      deadlineHours: 72,
      formRequired: 'Kurul 2019/10 İhlal Bildirim Formu',
      notifyDataSubjects: includesSpecialCategory || affectedRecordsCount > 100,
      legalBasis: 'KVKK Madde 12(5)',
      penalRisk: 'KVKK Md. 18 idari para cezası'
    };
  }

  // GDPR (EU)
  if (jurisdiction === 'EU' || jurisdiction === 'ALL') {
    notificationsRequired.GDPR = {
      authority: 'Competent Supervisory Authority (e.g. BfDI, CNIL, DPC)',
      deadlineHours: 72,
      notifyDPA: !isEncryptedWithCustomerKey,
      notifyDataSubjects: includesSpecialCategory && !isEncryptedWithCustomerKey,
      legalBasis: 'GDPR Art. 33 (Authority) & Art. 34 (Data Subjects)',
      fineExposure: 'Up to €20M or 4% of global turnover'
    };
  }

  // HIPAA (US)
  if (jurisdiction === 'US' || jurisdiction === 'ALL') {
    const isMajorBreach = affectedRecordsCount >= 500;
    notificationsRequired.HIPAA = {
      authority: 'HHS Office for Civil Rights (OCR)',
      safeHarborApplied: isEncryptedWithCustomerKey,
      deadline: isMajorBreach
        ? 'Within 60 calendar days of discovery'
        : 'Annual log submission within 60 days of calendar year end',
      mediaNoticeRequired: isMajorBreach,
      legalBasis: 'HIPAA Breach Notification Rule 45 CFR §§ 164.400-414'
    };
  }

  return JSON.stringify(
    {
      incidentType,
      affectedRecordsCount,
      riskLevel: includesSpecialCategory && !isEncryptedWithCustomerKey ? 'CRITICAL' : 'HIGH',
      safeHarborEncryptionShield: isEncryptedWithCustomerKey
        ? 'Active — Strong encryption renders data unreadable/unusable, mitigating public breach notification mandates under HIPAA §164.402 and GDPR Recital 83'
        : 'Inactive — Plaintext exposure requires immediate statutory reporting',
      statutoryNotifications: notificationsRequired,
      immediateActions: [
        'Containment: Revoke affected session tokens and rotate service credentials',
        'Forensics: Preserve immutable audit logs before restarting instances',
        'Classification: Count exact unique affected data subjects',
        'Notification: Prepare authority disclosure within 72 hours'
      ]
    },
    null,
    2
  );
}
