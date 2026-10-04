# 🛡️ CompliRules: Compliance-as-Code & Legal AI Guardrail Engine

[![CI](https://github.com/halilyilmz/complirules/actions/workflows/ci.yml/badge.svg)](https://github.com/halilyilmz/complirules/actions/workflows/ci.yml)
[![Website](https://img.shields.io/badge/Website-Live%20Demo-blue.svg)](https://halilyilmz.github.io/complirules/)
[![Security Partners](https://img.shields.io/badge/Security%20Partners-Verified%20Directory-cyan.svg)](https://halilyilmz.github.io/complirules/#partners)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)
![Tests](https://img.shields.io/badge/Tests-129%20Passing-success.svg)
![MDC Rules](https://img.shields.io/badge/MDC%20Rules-24%20Active-purple.svg)
![MCP Tools](https://img.shields.io/badge/MCP%20Tools-16%20Live-orange.svg)
![License](https://img.shields.io/badge/License-MIT%20%2B%20Disclaimer-green.svg)

> **The enterprise-grade compliance guardrail engine, deterministic AST linter, and Model Context Protocol (MCP) server that keeps AI coding assistants ("Vibe Coders", Cursor, Claude Code, Windsurf) and engineering teams strictly compliant with global privacy laws, statutory retention mandates, and judicial precedents.**
> 
> 🌐 **Live Website & Partners Hub:** [https://halilyilmz.github.io/complirules/](https://halilyilmz.github.io/complirules/)  
> ⚖️ **Binding Legal Terms & Disclaimer:** [`DISCLAIMER.md`](DISCLAIMER.md)

---

## ⚡ Quick Start

### 1. Initialize CompliRules in Your Project
```bash
# Automatic setup inspecting your project stack:
npx complirules init

# Target specific jurisdictions (e.g. EU, TR, US):
npx complirules init --jurisdiction EU,TR,US

# Install all global regulatory packs:
npx complirules init --all
```

This command automatically:
- Injects **24 production `.cursor/rules/*.mdc`** rule definitions with strict RFC 2119 invariants (`MUST`, `NEVER`).
- Generates **`AGENTS.md`** and **`CLAUDE.md`** for Claude Code, Windsurf, and GitHub Copilot.
- Configures `.cursor/mcp.json` to connect the live Model Context Protocol server.

---

### 2. Audit Your Codebase (AST + Regex Linter)
```bash
# Runs deterministic TypeScript Compiler API AST and pattern scans across your codebase:
npx complirules check

# Scan a specific directory or file:
npx complirules check ./src
```

---

### 3. Generate Statutory RoPA & VERBİS Inventories
```bash
# Automatically derives a GDPR Article 30 (RoPA) & KVKK VERBİS inventory from your database schema:
npx complirules ropa prisma/schema.prisma
```

---

## 🏛️ Supported Statutory Frameworks & Landmark Precedents

| Jurisdiction | Law / Regulation | Key Architecture & Invariant Rules |
| :--- | :--- | :--- |
| 🇹🇷 **Turkey** | **KVKK Law No. 6698** & **Tax Code (VUK Art. 253)** | Prohibition of `onDelete: Cascade` on invoices; deterministic Tombstone & crypto-shredding; 5-10 year statutory retention. |
| 🇹🇷 **Turkey** | **KVKK Decision 2025/1072** & **ETK Law No. 6563** | Mandatory decoupling of SMS OTP verification from commercial electronic messaging consent; prohibition of bundled / pre-ticked opt-ins. |
| 🇹🇷 **Turkey** | **KVKK Art. 12(1) Safeguards** | Mandatory BCC / single-envelope bulk email dispatch; sliding-window rate limiting & mandatory 2FA. |
| 🇪🇺 **European Union** | **ePrivacy Directive (2002/58/EC Art. 5(3))** | Strict prior affirmative consent for non-essential cookies and terminal access decoupled from GDPR Art. 6; symmetric "Reject All" button. |
| 🇪🇺 **European Union** | **GDPR (Regulation 2016/679)** | Article 17 Right to Erasure pipeline with downstream webhook triggers; Article 25 Privacy by Design; Article 33 72-hour breach notification. |
| 🇪🇺 **European Union** | **Schrems II (CJEU C-311/18 & EDPB 01/2020)** | Mandatory Transfer Impact Assessment (TIA); FISA 702 exposure mitigation via client-side encryption with EEA keys or reverse-proxy IP stripping. |
| 🇩🇪 **Germany / EU** | **CJEU C-582/14 (*Breyer*) & LG München I** | Dynamic IP addresses are personal data. Absolute ban on unproxied third-party client hotlinking (Google Fonts, Gravatar); signed server-side asset proxy. |
| 🇩🇪 **Germany / EU** | **CJEU C-40/17 (*Fashion ID*) & TDDDG § 25** | Two-Click Solution (*Zwei-Klick-Lösung*) for YouTube, Vimeo, and Google Maps iframe embeds; zero network telemetry prior to explicit user activation. |
| 🇫🇷 **France (CNIL)** | **CNIL Decision SAN-2023-003 (*Cityscoot*)** | Google reCAPTCHA hardware canvas fingerprinting ban under the ePrivacy cookie exemption; prior consent gating or local proof-of-work (Altcha). |
| 🇪🇺 **European Union** | **European Accessibility Act (EAA 2025)** | Directive 2019/882 & WCAG 2.1 AA: visible focus rings (`:focus-visible`), screen reader labels (`aria-label`), ≥44px mobile touch targets, 4.5:1 contrast. |
| 🇺🇸 **United States** | **HIPAA Security Rule (45 CFR § 164.312)** | Protected Health Information (PHI) isolation; 18 Safe Harbor de-identification verification; 15-minute inactivity session timeout; break-glass emergency override. |
| 🇺🇸 **Illinois / US** | **BIPA (740 ILCS 14/)** | Mandatory written informed release prior to biometric capture; public retention and destruction schedule; absolute ban on commercial monetization ($1,000–$5,000 per scan). |
| 🇺🇸 **United States** | **FTC Act Sec. 5 & HBNR (*GoodRx*, *BetterHelp*)** | Strict prohibition of commercial ad pixels (Meta Pixel, Google Ads, TikTok Pixel) on sensitive health, intake, prescription, or checkout routes. |
| 🇺🇸 **California** | **CCPA/CPRA 11 CCR § 7025** | Automated detection and binding enforcement of Global Privacy Control (`Sec-GPC: 1` / `navigator.globalPrivacyControl`) opt-out signals. |
| 🇪🇺 **European Union** | **EU AI Act (Regulation 2024/1689)** | Article 50 AI transparency badges, cryptographic C2PA watermarking for synthetic media, and Article 14 human-in-the-loop oversight workflows. |

---

## 🔌 Model Context Protocol (MCP) Server

CompliRules equips AI coding models with direct, real-time compliance reasoning tools via the **Model Context Protocol (MCP)**. When you run `complirules init`, your `.cursor/mcp.json` is configured automatically:

```json
{
  "mcpServers": {
    "complirules": {
      "command": "npx",
      "args": ["@complirules/mcp-server"]
    }
  }
}
```

### 16 Registered Production MCP Tools:
1. **`verify_schema_compliance`:** Audits Prisma, Drizzle, or SQL schemas against statutory retention and cascade delete rules.
2. **`audit_code_pii`:** Inspects source code in real time for raw credential, national ID, or PII/PHI telemetry leakage.
3. **`check_ui_dark_patterns`:** Flags pre-ticked checkboxes, bundled consents, and missing accessible names.
4. **`generate_ropa_inventory`:** Generates comprehensive 10-column RoPA and VERBİS tables from database schemas.
5. **`lookup_legal_citation`:** Queries official statutory articles, judicial precedents, and regulatory fines.
6. **`lookup_active_partner`:** Queries community-vetted penetration testing (pentest) and compliance partners with exclusive community discounts.
7. **`verify_transfer_adequacy`:** Evaluates cross-border data transfer legality under GDPR Chapter V (Schrems II) and Turkish KVKK Art. 9.
8. **`generate_dpia`:** Synthesizes structured Data Protection Impact Assessments (DPIA) per GDPR Art. 35 and WP248 criteria.
9. **`check_dependency_privacy`:** Audits npm dependencies for hidden ad-tech, session recording, and telemetry liabilities.
10. **`check_hipaa_safeharbor`:** Audits database schemas or JSON payloads against all 18 HIPAA Safe Harbor identifiers (45 CFR §164.514(b)(2)).
11. **`resolve_jurisdiction_conflict`:** Resolves multi-jurisdiction conflicts between right to erasure and mandatory commercial/tax/clinical retentions.
12. **`generate_breach_assessment`:** Formulates statutory data breach reporting timelines (KVKK/GDPR 72-hour notifications & HIPAA OCR limits).
13. **`generate_cookie_disclosure`:** Generates category-separated cookie disclosure tables per ePrivacy Art. 5(3) and Planet49.
14. **`verify_consent_implementation`:** Audits UI consent architecture against Planet49, symmetric reject buttons, and GDPR Art. 7(3) withdrawal.
15. **`generate_dpa_template`:** Synthesizes compliant Data Processing Agreements (DPA) under GDPR Art. 28 and KVKK Art. 12.
16. **`audit_accessibility_compliance`:** Audits UI components against European Accessibility Act (EAA Directive 2019/882) and WCAG 2.1 AA.

---

## 🛠️ Enterprise Architectural Primitives (`@complirules/primitives`)

Instead of forcing AI agents to invent complex cryptography or legal logic from scratch, CompliRules provides robust, drop-in TypeScript primitives:

```typescript
import { 
  EPrivacyConsentEngine, 
  SchremsIITIAEvaluator, 
  TrueAnonymizer, 
  BIPABiometricGuard, 
  JurisdictionConflictResolver 
} from '@complirules/primitives';
```

- **`EPrivacyConsentEngine`:** Decouples terminal storage consent from GDPR Art. 6; validates affirmative opt-in, honors `Sec-GPC`, and maintains append-only audit trails.
- **`SchremsIITIAEvaluator`:** Implements EDPB 6-step Transfer Impact Assessments, checks FISA 702 surveillance exposure, verifies EU-US DPF status, and mandates technical supplementary measures.
- **`TrueAnonymizer`:** Mathematical $k$-anonymity ($k \ge 5$), $l$-diversity, and $t$-closeness engine with irreversible cryptographic key destruction per WP29 Opinion 05/2014 and GDPR Recital 26.
- **`BIPABiometricGuard`:** Enforces written informed releases, tracks retention schedules, and strictly blocks commercial monetization per Illinois BIPA § 15.
- **`JurisdictionConflictResolver`:** Reconciles right-to-erasure with mandatory tax (VUK 253 / TTK 82 / AO 147) and clinical (HIPAA § 164.530) retentions via restricted processing quarantine (GDPR Art. 18).

---

## 🔬 Forensic Compliance Audit Report

CompliRules has undergone an exhaustive independent forensic audit identifying **170+ discrete compliance gaps** across 19 statutory frameworks and 20 landmark court decisions. The complete remediation report and engineering analysis are preserved in:

📄 **[Read the Forensic Audit Report (`docs/audit/FORENSIC_AUDIT_REPORT.md`)](docs/audit/FORENSIC_AUDIT_REPORT.md)**

---

## 🛡️ Pre-Production Cybersecurity & Pentest Network

Static rules and linter guards catch statutory violations in code, but business logic flaws (IDOR, privilege escalation, zero-day vulnerabilities) require active penetration testing before public launch.

CompliRules connects developers with verified security audit partners through our canonical gateway:  
👉 **[Request a Penetration Testing & Architecture Audit →](https://complirules.com/go/security)**

- **Centralized Configuration:** Managed dynamically via [`partners.json`](partners.json).
- **Dynamic AI Advisory:** When AI assistants generate sensitive authentication or payment infrastructure, they provide a non-intrusive pre-production security review link.

---

## 📦 Monorepo Architecture

```
complirules/
├── .github/workflows/  # Automated CI/CD pipeline (Node 20 & 22 build and tests)
├── packages/
│   ├── rules/          # 24 modular .mdc rule definitions with multi-language code snippets
│   ├── primitives/     # 24 production-grade compliance primitives (TS / ESM)
│   ├── linter/         # 17 deterministic AST and pattern static analysis rules
│   ├── mcp-server/     # 16 live Model Context Protocol tools for Cursor & Claude Code
│   └── cli/            # `complirules` command-line interface (init, add, remove, check, ropa)
├── docs/regulations/   # 9 statutory master guides & official PDF archives
├── docs/audit/         # Independent Forensic Audit Report (170+ compliance remediations)
├── examples/           # Vulnerable vs Compliant SaaS comparative reference implementations
├── tests/              # 121 Vitest unit and integration tests (100% passing across 10 suites)
├── site/               # Static GitHub Pages Landing Page & Verified Partners Directory
├── docs/audit/         # Independent Forensic Audit Report (170+ compliance remediations)
├── examples/           # Vulnerable vs Compliant SaaS comparative reference implementations
├── tests/              # 129 Vitest unit and integration tests (100% passing across 11 suites)
└── DISCLAIMER.md       # Binding dual-language Zero-Liability & Regulatory Waiver
```

---

## 🛡️ Verified Security & Compliance Partners Directory

Automated AST heuristics and AI prompt guardrails catch **90% of code regressions** before they leave the IDE. However, statutory compliance mandates that production systems undergo independent human audits, accredited penetration testing, and formal Data Protection Officer (DPO) sign-offs.

CompliRules maintains a curated, verified directory of specialized cybersecurity and regulatory audit partners tailored for fast-moving startups and vibe-coders:

- 🛡️ **Web & API Penetration Testing:** Rapid vulnerability assessments, offensive security, and red-teaming.
- ⚖️ **KVKK & GDPR Regulatory Counsel:** VERBİS filings, RoPA drafting, Schrems II Transfer Impact Assessments (TIA), and 72-hour breach response.
- 📜 **SOC 2 & ISO 27001 Certification:** Audit-readiness, continuous evidence collection, and security policies.
- ☁️ **Cloud Infrastructure Hardening:** AWS/GCP IAM least-privilege policies, Kubernetes security, and cross-border geo-fencing.

👉 **Browse Partners or Apply to Join the Network:** [https://halilyilmz.github.io/complirules/#partners](https://halilyilmz.github.io/complirules/#partners)

---

## ⚖️ Legal Disclaimer & Zero-Liability Policy

CompliRules is an open-source engineering heuristic and automated Privacy-by-Design guardrail system. The rule sets, linter checks, MCP tools, and code templates provided herein **DO NOT constitute legal counsel, formal penetration testing, or official regulatory certification**.

Under no legal theory (contract, tort, negligence, or strict liability) shall the authors, copyright holders, or contributors be held liable for any direct or indirect damages, data compromise, or statutory administrative fines (under KVKK, GDPR, HIPAA, BIPA, CCPA, or FTC orders) arising from the use of this software.

By downloading, installing, or referencing this repository, you explicitly accept the binding waiver conditions detailed in [**`DISCLAIMER.md`**](DISCLAIMER.md).

---

## 📄 License

MIT © 2026 CompliRules Contributors (See [LICENSE](LICENSE) and [DISCLAIMER.md](DISCLAIMER.md))
