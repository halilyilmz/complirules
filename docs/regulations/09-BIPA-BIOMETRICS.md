# Illinois Biometric Information Privacy Act (BIPA) Master Guide

**Document ID:** COMPLIRULES-REG-09  
**Jurisdiction:** United States (Illinois 740 ILCS 14/, Texas CUBI, Washington BII)  
**Key Precedents:** *Cothron v. White Castle System, Inc.*, 2023 IL 128004; *Rosenbach v. Six Flags Entertainment Corp.*, 2019 IL 123186  
**Version:** 1.0.0

---

## 1. Statutory Invariants & Extreme Financial Exposure

The Illinois Biometric Information Privacy Act (BIPA) is the most consequential biometric privacy statute in the world due to its private right of action and astronomical liquidated statutory damages.

> **Statutory Damages (740 ILCS 14/20):**  
> - **\$1,000** for each negligent violation.  
> - **\$5,000** for each reckless or intentional violation.  
> - Plus reasonable attorney fees and costs.

### The *Cothron v. White Castle* (2023) Bombshell
The Illinois Supreme Court held that **a separate claim accrues under BIPA every single time a biometric identifier is scanned or transmitted**, not merely upon the first collection. For a company scanning employee or user fingerprints or face geometry daily, liability multiplies exponentially into billions of dollars.

### The *Rosenbach v. Six Flags* (2019) Standard
An individual does **not** need to demonstrate any actual injury or adverse harm beyond a violation of the statutory procedural notice and release requirements to qualify as an "aggrieved person."

---

## 2. Technical Invariants for Software Architecture

### § 15(a) Public Retention & Destruction Policy
- **Requirement:** Organizations collecting biometrics must maintain a **publicly available written policy** establishing a retention schedule and guidelines for permanent destruction.
- **Purge Invariant:** Biometric identifiers must be permanently destroyed when:
  1. The initial purpose for collecting has been satisfied, OR
  2. Within **3 years** of the individual's last interaction with the entity, whichever occurs first.

### § 15(b) Written Informed Release
No entity may capture, collect, or obtain biometric identifiers unless it first:
1. Informs the subject in writing that biometric information is being collected.
2. Informs the subject in writing of the specific purpose and duration of storage.
3. Receives an executed **written informed release** (electronic signature acceptable if authenticated).

### § 15(c) Absolute Prohibition on Monetization
- **Strict Invariant:** No entity may sell, lease, trade, or otherwise profit from biometric identifiers or information. Transmitting face embeddings to third-party ad networks or behavioral modeling services is illegal.

---

## 3. CompliRules Guardrail Enforcement

All biometric operations must be guarded using `BIPABiometricGuard`:

```typescript
import { BIPABiometricGuard, BiometricIdentifierType } from '@complirules/primitives';

// Check every capture event before hitting hardware or model inference
const auth = await bipaGuard.authorizeOperation({
  subjectId: user.id,
  releaseId: user.activeBiometricReleaseId,
  identifierType: BiometricIdentifierType.FACE_GEOMETRY,
  type: 'capture',
  purpose: 'timeclock_attendance'
});

if (!auth.authorized) {
  // Hard block to prevent $1,000 - $5,000 per-scan statutory accrual
  throw new Error(`BIPA Violation Blocked: ${auth.violations[0].description}`);
}
```
