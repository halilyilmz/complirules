# 🤖 European Union Artificial Intelligence Act (EU AI Act) Standards

> **Legal Reference:** Regulation (EU) 2024/1689 of the European Parliament and of the Council laying down harmonised rules on artificial intelligence.  
> **Official Statutory Reference:** [`docs/regulations/sources/EU-AI-Act-Regulation-2024-1689-Official.pdf`](./sources/EU-AI-Act-Regulation-2024-1689-Official.pdf)

---

## 1. Statutory Context, Enactment Timeline & Classification

The EU AI Act introduces a tiered risk classification:
* **Prohibited AI Practices (Article 5):** **IN FULL EFFECT SINCE FEBRUARY 2, 2025.** Zero tolerance; statutory bans.
* **High-Risk AI Systems (Annex III & Article 6):** Mandatory conformity assessment, CE marking, FRIA, and technical documentation (takes effect August 2, 2026).
* **Specific Transparency Risk (Article 50):** Synthetic content watermarking and interaction disclosure (takes effect August 2, 2026).
* **Penalties:** Fines up to **€35,000,000 or 7% of annual worldwide turnover** for Article 5 prohibited practices; up to **€15,000,000 or 3%** for non-compliance with other obligations.

---

## 2. Invariants for AI Coding Subagents

### A. Prohibited AI Systems Verification (Article 5 — Active Since Feb 2, 2025)
1. **NEVER:** Implement or deploy AI features that deploy subliminal, manipulative, or deceptive techniques to distort human behaviour causing significant harm (Art. 5(1)(a)).
2. **NEVER:** Implement systems exploiting vulnerabilities of a natural person due to age, disability, or socio-economic status (Art. 5(1)(b)).
3. **NEVER:** Build or integrate social scoring systems evaluating natural persons based on social behaviour or personality traits (Art. 5(1)(c)).
4. **NEVER:** Deploy emotion recognition systems in workplace or educational environments (Art. 5(1)(f)).
5. **NEVER:** Perform untargeted scraping of facial images from the internet or CCTV to create facial recognition databases (Art. 5(1)(e)).
6. **NEVER:** Implement biometric categorization systems deducing race, political opinions, trade union membership, religious beliefs, sex life, or sexual orientation (Art. 5(1)(g)).

### B. Fundamental Rights Impact Assessment — FRIA (Article 27)
1. **MUST:** Prior to putting a High-Risk AI system (e.g., automated recruitment screening, credit scoring, employee performance evaluation) into service, deployers must conduct and document a **Fundamental Rights Impact Assessment (FRIA)**.
2. **MUST:** Verify human rights impact, vulnerable population safeguards, and periodic oversight mechanisms within the operational system architecture.

### C. Conversational & Synthetic Media Transparency (Article 50)
1. **MUST:** Explicitly inform natural persons that they are interacting with an AI system, unless this is obvious from the point of view of a reasonable person (Article 50(1)).
2. **MUST:** Ensure AI-generated audio, visual, video, or synthetic text outputs are marked in a **machine-readable format and detectable as artificially generated** using C2PA standards or metadata headers (`x-ai-generated: true`) (Article 50(2)).

### D. High-Risk Automated Audit Logging (Article 12)
1. **MUST:** Record an immutable audit log for any AI inference used in scoring, screening, or automated decision-making (prompt hash, model version, timestamp, confidence score, output hash).
2. **NEVER:** Deploy automated High-Risk AI decisions without traceable audit logs.

### E. Human-in-the-Loop Oversight & Escalation (Article 14)
1. **MUST:** Provide an asynchronous escalation hook (`escalateToHumanReview`) whenever an AI confidence score falls below operational safety thresholds (`confidenceScore < threshold`).
2. **NEVER:** Enact unreviewed automated sanctions or significant status terminations without human operator verification.

### F. Right to Explanation & Appeal (Article 86)
1. **MUST:** Provide a user-facing appeal action (`RequestHumanReviewButton` / `contestAiDecision()`) allowing individuals to contest purely automated AI determinations affecting their legal or financial status.

---

## 3. Subagent Reference Implementation

```tsx
// components/AiTransparencyBadge.tsx
export function AiTransparencyBadge() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-500 py-1" role="status">
      <SparklesIcon className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
      <span>Yapay zekâ tarafından oluşturulmuştur. Lütfen doğruluğunu teyit ediniz.</span>
    </div>
  );
}
```
