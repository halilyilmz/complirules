export interface GenerateDPATemplateArgs {
  controllerName: string;
  processorName: string;
  dataCategories: string[];
  governingLaw: 'GDPR' | 'KVKK' | 'DUAL';
}

export function handleGenerateDPATemplate(args: GenerateDPATemplateArgs): string {
  const { controllerName, processorName, dataCategories, governingLaw } = args;

  return `
# Data Processing Agreement (DPA / Veri İşleme Sözleşmesi)
**Controller (Veri Sorumlusu):** ${controllerName}  
**Processor (Veri İşleyen):** ${processorName}  
**Statutory Basis:** ${governingLaw === 'KVKK' ? 'KVKK Madde 12' : governingLaw === 'DUAL' ? 'GDPR Art. 28 & KVKK Madde 12' : 'GDPR Article 28'}

## 1. Subject Matter & Data Categories
The Processor is authorized to process data strictly on documented instructions from Controller for the provision of services.
- **Categories of Personal Data:** ${dataCategories.join(', ')}

## 2. Technical & Organizational Safeguards (TOMs)
The Processor warrants implementation of:
1. AES-256 encryption at rest and TLS 1.3 in transit.
2. Pseudonymization and envelope encryption for sensitive fields.
3. Access controls based on strict role-based least privilege.
4. Redundant, tamper-evident audit logging of database mutations.

## 3. Sub-Processors & Overseas Transfers
1. Processor shall not engage any sub-processor without prior written authorization.
2. Any international transfer outside the EEA or Turkey requires verified SCCs (EU 2021/914) or Board-approved Undertakings.

## 4. Breach Notification Assistance
Processor shall notify Controller in writing within **24 hours** of becoming aware of a personal data breach to allow Controller to meet statutory 72-hour reporting deadlines.

## 5. Return & Destruction of Data
Upon termination of services, Processor shall at Controller's choice delete or return all personal data and provide a formal Destruction Certificate.
  `.trim();
}
