export interface CheckHIPAASafeHarborArgs {
  fields: string[];
}

const HIPAA_18_IDENTIFIERS_MAP: Record<string, string> = {
  name: '1. Names',
  firstname: '1. Names',
  lastname: '1. Names',
  address: '2. Geographic subdivisions smaller than state',
  street: '2. Geographic subdivisions smaller than state',
  city: '2. Geographic subdivisions smaller than state',
  zip: '2. Geographic subdivisions smaller than state',
  postalcode: '2. Geographic subdivisions smaller than state',
  birthdate: '3. All elements of dates (except year) directly related to an individual',
  dob: '3. All elements of dates directly related to an individual',
  admissiondate: '3. Admission dates',
  dischargedate: '3. Discharge dates',
  deathdate: '3. Date of death',
  phone: '4. Telephone numbers',
  telephone: '4. Telephone numbers',
  fax: '5. Fax numbers',
  email: '6. Electronic mail addresses',
  ssn: '7. Social Security numbers',
  mrn: '8. Medical record numbers',
  healthplanid: '9. Health plan beneficiary numbers',
  accountnum: '10. Account numbers',
  license: '11. Certificate/license numbers',
  vin: '12. Vehicle identifiers and serial numbers',
  deviceid: '13. Device identifiers and serial numbers',
  url: '14. Web Universal Resource Locators (URLs)',
  ip: '15. Internet Protocol (IP) address numbers',
  ipaddress: '15. Internet Protocol (IP) address numbers',
  biometric: '16. Biometric identifiers (finger/voiceprints)',
  photo: '17. Full face photographic images',
  avatar: '17. Photographic images',
  uuid: '18. Any other unique identifying number or code',
};

export function handleCheckHIPAASafeHarbor(args: CheckHIPAASafeHarborArgs): string {
  const violations = [];
  const fields = args.fields ?? [];

  for (const field of fields) {
    const normalized = field.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, category] of Object.entries(HIPAA_18_IDENTIFIERS_MAP)) {
      if (normalized.includes(key)) {
        violations.push({
          field,
          matchedCategory: category,
          statute: 'HIPAA Privacy Rule 45 CFR §164.514(b)(2)',
          instruction: 'Must be completely stripped or mapped to an abstract synthetic token.',
        });
        break;
      }
    }
  }

  const isSafeHarborCompliant = violations.length === 0;

  return JSON.stringify(
    {
      isSafeHarborCompliant,
      violationCount: violations.length,
      safeHarborVerdict: isSafeHarborCompliant
        ? 'DE_IDENTIFIED_SAFE_HARBOR_VALID'
        : 'NON_COMPLIANT_EXPOSES_EPHI',
      flaggedIdentifiers: violations,
    },
    null,
    2
  );
}
