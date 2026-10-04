# 🏥 Health Insurance Portability and Accountability Act (HIPAA) Technical Standards

> **Statutory Basis:** 45 CFR Part 160 & Part 164 (HIPAA Security, Privacy, and Breach Notification Rules) & HITECH Act.  
> **Official Statutory Reference:** [`docs/regulations/sources/45-CFR-Part-164-HIPAA-Security-Privacy.pdf`](./sources/45-CFR-Part-164-HIPAA-Security-Privacy.pdf)

---

## 1. Regulatory Context, Enforcement & Safe Harbor

HIPAA establishes strict administrative, physical, and technical standards for the handling of **Protected Health Information (PHI)** and **Electronic PHI (ePHI)**. Civil monetary penalties enforced by the HHS Office for Civil Rights (OCR) reach upwards of \$2,000,000+ per violation category annually.

### Safe Harbor Encryption Exemption (45 CFR § 164.402)
- Under the Breach Notification Rule, **unsecured PHI** is PHI that has not been rendered unusable, unreadable, or indecipherable to unauthorized persons through valid encryption technology.
- **Safe Harbor Standard:** If ePHI is encrypted using NIST-approved encryption standards (AES-256 for data at rest per NIST SP 800-111, TLS 1.3 for data in transit per NIST SP 800-52) and the cryptographic encryption keys have not been compromised, a lost device or exfiltrated database is **NOT considered a breach**, granting statutory exemption from notification requirements.

### Breach Notification Timelines (45 CFR § 164.408)
- **Affecting < 500 Individuals:** The covered entity must log the incident and notify HHS OCR no later than **60 days after the end of the calendar year** in which the breach was discovered. Affected individuals must still be notified within 60 calendar days.
- **Affecting $\ge$ 500 Individuals:** The covered entity must notify the HHS Secretary and affected individuals without unreasonable delay and in no case later than **60 calendar days** from the date of discovery. Prominent media outlets in the state/jurisdiction must also be issued a press release within 60 days.

---

## 2. Invariants for AI Coding Subagents

### A. PHI Isolation & Storage Architecture
1. **MUST:** Store Protected Health Information (diagnosis, prescription, lab reports) separately from direct identifiers (name, SSN, address) using cryptographic pseudonyms.
2. **MUST:** Enforce encryption in transit (TLS 1.3) and encryption at rest (AES-256-GCM) to qualify for 45 CFR § 164.402 Safe Harbor protection.

### B. Emergency Access "Break-Glass" Protocol (45 CFR § 164.312(a)(2)(ii))
1. **MUST:** Implement an emergency access procedure (**Break-Glass**) permitting credentialed medical personnel to override standard role-based access controls during life-threatening emergency situations (e.g., Code Blue, Trauma STAT).
2. **MUST:** Require mandatory entry of a clinical justification note before elevated emergency access is granted.
3. **MUST:** Automatically dispatch a real-time security alert (SMS/Email) to the Privacy & Information Security Officer upon Break-Glass activation.
4. **MUST:** Record the entire emergency session in an independent, immutable audit log (`EmergencyBreakGlassAuditLog`) with session termination capped at 30 minutes.

### C. Business Associate Agreements (BAA) & Third-Party LLMs
1. **NEVER:** Transmit unmasked PHI to third-party LLM APIs (OpenAI, Anthropic, Gemini) unless an active, executed **Business Associate Agreement (BAA)** with Zero Data Retention is established.
2. **MUST:** Route LLM prompts through a local de-identification proxy (e.g., Microsoft Presidio / PII scrubber) before external API dispatch.

### D. Immutable Access Audit Trails (45 CFR § 164.312(b))
1. **MUST:** Log every PHI read, write, update, and export event into an append-only `PhiAuditLog` recording actor ID, patient ID, timestamp, and query hash.

### E. Minimum Necessary Standard (45 CFR § 164.502(b))
1. **NEVER:** Execute `SELECT *` or unrestricted queries against PHI tables.
2. **MUST:** Always use field-level projections (`select: { vitals: true, appointmentDate: true }`), restricting fetched data strictly to the clinical task at hand.

### F. Automatic Inactivity Timeout (45 CFR § 164.312(a)(2)(iii))
1. **MUST:** Enforce an automatic session timeout of 15 minutes (`15 * 60 * 1000 ms`) on clinical portals, logging the user out upon prolonged inactivity to prevent unauthorized terminal access.

---

## 3. Subagent Reference Implementation

```typescript
// services/break-glass.ts
import { activateBreakGlass } from '@complirules/primitives';

export async function handleEmergencyAccess(req: Request) {
  const { actorId, patientId, clinicalJustification, department } = await req.json();

  const emergencySession = activateBreakGlass({
    actorId,
    patientId,
    department,
    clinicalJustification,
    emergencyType: 'TRAUMA_STAT'
  });

  return Response.json({
    status: 'BREAK_GLASS_ACTIVATED',
    sessionId: emergencySession.sessionId,
    expiresAt: emergencySession.expiresAt
  });
}
```


---

## 4. FTC Sağlık Piksel Yaptırımları ve HIPAA Sınırı

> **Doğrulama notu:** Tutarlar FTC basın bültenlerine dayanır; yayımdan önce [ftc.gov](https://www.ftc.gov) üzerinden teyit edin.

| Dava | Yıl | Sonuç | Ders |
| :--- | :--- | :--- | :--- |
| **FTC v. GoodRx** | 2023 | 1,5 M$ sivil ceza; HBNR kapsamındaki ilk yaptırım | İlaç/koşul bilgisi Meta ve Google'a pikselle gitti; ayrıca "HIPAA Secure" mührü yanıltıcı bulundu |
| **FTC v. BetterHelp** | 2023 | 7,8 M$ tüketici iadesi | Terapi anketi yanıtları, e-posta ve IP reklam ağlarıyla paylaşıldı |
| **FTC v. Flo Health** | 2021 | Rıza ve bildirim yükümlülükleri | Sağlık verisi üçüncü taraf SDK'lara gönderildi |

### HIPAA Sınırı (Dikkat: Nüanslı)
- **AHA v. Becerra** (N.D. Tex., 20.06.2024): Mahkeme, HHS OCR bülteninin kimliği doğrulanmamış genel sayfalardaki izlemeyi otomatik PHI sayan kısmını **iptal etmiştir (vacated)**.
- **Ancak:** Kimliği doğrulanmış hasta portalları ve randevu sistemlerinde izleme teknolojileri için BAA gereği sürmektedir; FTC Act Sec. 5 ve HBNR bu karardan etkilenmez.
- **Karar:** CompliRules bu nedenle sağlık, checkout ve çocuk rotalarında ticari piksel kullanımını **rıza ile bile** yasaklar (muhafazakâr koruma).

### MUST
1. Sağlık/terapi/semptom/reçete/portal rotalarında Meta, TikTok, Google Ads, Snap, LinkedIn ve benzeri ticari pikselleri kullanma.
2. Sağlık verisini URL parametresi, olay adı veya özellik olarak üçüncü tarafa gönderme.
3. BAA bulunmayan sağlayıcıyı PHI akışına dahil etme.

### Otomasyon
Linter `no-pixel-on-sensitive-routes`, kural `hipaa-ftc-sensitive-route-pixel`, primitif `sensitive-route-guard`.
