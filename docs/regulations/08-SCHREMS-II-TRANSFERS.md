# Schrems II & International Data Transfer Master Guide

**Document ID:** COMPLIRULES-REG-08  
**Jurisdiction:** European Union (GDPR Chapter V) & Turkey (KVKK Art. 9)  
**Key Precedents:** CJEU C-311/18 (*Schrems II*), CJEU C-582/14 (*Breyer*), Austrian DSB NetDoktor, French CNIL Analytics Decisions  
**Version:** 1.0.0

---

## 1. The Schrems II Legal Dilemma

In Case C-311/18 (*Data Protection Commissioner v Facebook Ireland and Maximillian Schrems*), the CJEU invalidated the EU-US Privacy Shield framework and established that:

1. **Third-Country Surveillance Supremacy:** Where the destination country's law allows indiscriminate surveillance (such as US FISA Section 702 and Executive Order 12333), Standard Contractual Clauses (SCCs) are legally void on their own unless accompanied by **supplementary technical measures**.
2. **Dynamic IP Addresses are Personal Data:** Per CJEU Case C-582/14 (*Breyer*), raw visitor IP addresses constitute personal data. Transmitting raw visitor IPs to US-hosted analytics endpoints constitutes an international personal data transfer subject to Chapter V.

---

## 2. The 6-Step TIA Methodology (EDPB Recommendations 01/2020)

Engineering teams deploying cloud services must execute a Transfer Impact Assessment (TIA) following the EDPB framework:

```
┌────────────────────────────────────────────────────────┐
│  Step 1: Map all International Transfers               │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│  Step 2: Identify Transfer Tool (SCC, BCR, Adequacy)   │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│  Step 3: Assess Destination Surveillance Laws          │
│          (FISA 702, EO 12333, CLOUD Act)               │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│  Step 4: Identify & Adopt Supplementary Measures       │
│          • Client-side Envelope Encryption (EEA Keys)  │
│          • Self-hosted Proxy Pseudonymization (Strip IP)│
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│  Step 5: Execute Procedural Formalities                │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│  Step 6: Ongoing Monitoring & Annual Re-evaluation    │
└────────────────────────────────────────────────────────┘
```

---

## 3. Supplementary Technical Measures That Satisfy the Court

Contractual commitments (promising not to spy) are **insufficient** because US statutory intelligence obligations supersede commercial contracts. Only **effective mathematical and architectural guarantees** survive legal scrutiny:

### Case 1: Data Storage in the Cloud
- **Requirement:** Data must be encrypted before transmission using state-of-the-art algorithms (AES-256-GCM).
- **Key Custody Invariant:** Decryption keys MUST remain exclusively within the custody of the data controller located in the EEA or an adequate country. The cloud provider (AWS US, GCP US) must NEVER possess or manage the cryptographic keys.

### Case 2: Telemetry and Analytics Transfer
- **Requirement:** Raw IP addresses and persistent identifiers must be stripped at an EU-based proxy boundary before event payloads are dispatched to third-country ingestion APIs.

---

## 4. Turkish KVKK Art. 9 Divergence (2024 Reform)

A critical compliance trap for cross-border engineering teams:
- **No EU-US DPF Recognition:** Turkey does **NOT** recognize the EU-US Data Privacy Framework (DPF).
- An engineer deploying US cloud databases (AWS US, Supabase US) for Turkish citizens cannot rely on DPF certification.
- **Statutory Mandate:** Transfer requires either:
  1. Standard Contractual Clauses (SCC) submitted to the KVKK Board within **5 business days** of signing.
  2. Board-approved Binding Undertaking (*Taahhütname*).
  3. Explicit, unbundled consent (*Açık Rıza*).
