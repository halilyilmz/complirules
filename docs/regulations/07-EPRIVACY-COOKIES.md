# ePrivacy Directive (2002/58/EC) & Cookie Architecture Master Guide

**Document ID:** COMPLIRULES-REG-07  
**Jurisdiction:** European Union & EEA  
**Key Precedents:** CJEU C-673/17 (*Planet49*), French CNIL Sanctions SAN-2021-023/024 (€210M), German TDDDG § 25  
**Version:** 1.0.0

---

## 1. Statutory Scope & Decoupling from GDPR Art. 6

A critical, widespread engineering misconception is that cookie consent is governed by GDPR Article 6. 

> **Statutory Invariant (ePrivacy Art. 5(3)):**  
> *"Member States shall ensure that the storing of information, or the gaining of access to information already stored, in the terminal equipment of a subscriber or user is only allowed on condition that the subscriber or user concerned has given his or her consent, having been provided with clear and comprehensive information."*

### Key Legal Implications for Software Engineers:
1. **Applies to ALL Terminal Access:** It applies regardless of whether the stored data is personal data. LocalStorage keys, SessionStorage, IndexedDB tokens, and device canvas fingerprints are all legally protected terminal equipment access.
2. **Strictly Necessary Exemption is Narrow:** Only operations technically essential to deliver the service explicitly requested by the user (e.g. shopping cart state, HTTP session authentication cookie, CSRF token) are exempt. Analytics (even self-hosted without IP masking) and remarketing pixels NEVER qualify.
3. **Decoupled Lawful Basis:** Obtaining consent for terminal access under ePrivacy does not automatically satisfy GDPR Article 6 lawful basis requirements for subsequent downstream processing of personal data.

---

## 2. Landmark Judicial Precedents

### A. CJEU Case C-673/17 (*Planet49 GmbH*)
- **Holding:** A checkbox pre-ticked by the service provider does **not** constitute valid consent under ePrivacy Art. 5(3) or GDPR Art. 4(11).
- **Technical Invariant:** `<input type="checkbox" defaultChecked />` in cookie/consent modals is **strictly prohibited**. Consent requires an affirmative, unambiguous user action.
- **Scroll/Browse Consent Void:** Continuing to browse or scrolling the page does not fulfill affirmative opt-in requirements.

### B. French CNIL 2022 Sanctions (Google €150M, Facebook €60M)
- **Holding:** Making the refusal of cookies more cumbersome than acceptance (e.g., "Accept All" on layer 1, but requiring 3 clicks into settings to reject) is an unlawful dark pattern.
- **Technical Invariant:** The first layer of every cookie banner MUST provide a **"Reject All" (Tümünü Reddet)** button with equal visual prominence, size, contrast, and ease of access as the "Accept All" button.

---

## 3. CompliRules Implementation Standard

### Gating Third-Party Scripts
Third-party ad-tech and analytics scripts (Google Tag Manager, Meta Pixel, Hotjar) must remain inert until affirmative consent is recorded in `@complirules/primitives`:

```tsx
import { EPrivacyConsentEngine, EPrivacyPurpose } from '@complirules/primitives';

export async function AnalyticsGate({ subjectId, children }: { subjectId: string; children: React.ReactNode }) {
  const status = await consentEngine.checkConsent(subjectId, EPrivacyPurpose.ANALYTICS);
  if (!status.allowed) {
    return null; // Zero network payload sent to terminal
  }
  return <>{children}</>;
}
```

### Immutable Audit Trail & Revocation
Under GDPR Art. 7(3), withdrawing consent must be as effortless as granting it:
- A floating or persistent footer link: `Cookie Settings` / `Çerez Tercihleri` must be accessible on every page.
- On withdrawal, third-party cookies must be expired immediately (`Max-Age=0`) and SDK trackers detached.
