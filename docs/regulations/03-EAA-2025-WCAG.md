# ♿ European Accessibility Act (EAA 2025) & W3C WCAG 2.1 AA Standards

> **Legal Enactment:** Directive (EU) 2019/882 (European Accessibility Act). Enforced across all EU Member States starting **June 28, 2025**.  
> **Official Statutory Reference:** [`docs/regulations/sources/EAA-Directive-2019-882-Official.pdf`](./sources/EAA-Directive-2019-882-Official.pdf)

---

## 1. Regulatory Context, Scope & Exemptions

The European Accessibility Act establishes legally binding accessibility obligations for digital services, e-commerce, banking, e-books, and consumer SaaS operating in the European Union. Conformance is benchmarked against harmonised European standard **EN 301 549** and **W3C WCAG 2.1 Level AA**.

### Micro-Enterprise Exemption (Article 4(5))
- **Exemption Rule:** Under Article 4(5) of Directive (EU) 2019/882, **micro-enterprises** providing services are exempt from compliance with the accessibility requirements.
- **Definition of Micro-Enterprise:** An enterprise that employs fewer than **10 persons** AND has an annual turnover not exceeding **€2,000,000** or an annual balance sheet total not exceeding **€2,000,000**.
- **Important:** Small, medium, and large enterprises, as well as all manufacturers/distributors of hardware and operating systems, are fully bound without exemption.

---

## 2. Invariants for AI Coding Subagents

### A. Accessibility Statement & Feedback Mechanism
1. **MUST:** Publish an **Accessibility Statement (Erişilebilirlik Beyanı)** detailing the service's level of compliance, known non-accessible components, alternative formats, and date of last review.
2. **MUST:** Provide an easily accessible **Feedback Mechanism** (e.g., dedicated contact email/form) allowing users to report accessibility barriers and request accessible assistance.

### B. Keyboard Navigation & Focus Management (WCAG 2.1 Principle 2)
1. **MUST:** Complete keyboard navigability: Every interactive element must be reachable and operable using `Tab`, `Shift+Tab`, `Enter`, `Space`, and `Escape`.
2. **NEVER:** `outline: none` without a visible, distinct `:focus-visible` replacement ring.
3. **NEVER:** Trap focus inside modals or drawers without an intuitive keyboard escape (`Escape` key closes overlay and restores focus to triggering element).

### C. Reflow & Responsive Viewport (WCAG 1.4.10 — Level AA)
1. **MUST:** Support **320 CSS pixels reflow**: Content must be fully presentable without loss of information or functionality and without requiring two-dimensional horizontal scrolling on displays at a width of 320 CSS pixels (simulates 400% browser zoom on a 1280px screen).

### D. Touch Targets & Form Inputs
1. **MUST:** Interactive targets on mobile viewports must meet minimum touch areas of **44x44px** (WCAG 2.5.5 / 2.5.8).
2. **MUST:** Mobile input font-size must be $\ge$ 16px to prevent intrusive iOS automatic zoom.
3. **MUST:** Icon-only buttons must include explicit, descriptive `aria-label` attributes.

### E. Color Contrast & Status Indicators
1. **MUST:** Normal text contrast ratio must be at least **4.5:1** against its background; large text ($\ge$ 18pt or 14pt bold) at least **3:1**.
2. **NEVER:** Convey state using color alone (e.g., green/red status indicator without redundant text or icon label).

### F. Time-Based Media Alternatives (WCAG 1.2.1 / 1.2.2)
1. **MUST:** Prerecorded audio-only and video-only media must be accompanied by text transcripts or descriptive audio tracks.
2. **MUST:** Prerecorded video with audio must include synchronized captions.

### G. Form Error Management & Live Regions (WCAG 3.3.1 / 3.3.2)
1. **MUST:** Announce form validation errors to screen readers using `aria-invalid="true"`, `aria-describedby="{field}-error"`, and `role="alert"` (or `aria-live="polite"`).

---

## 3. Subagent Reference Implementation

```tsx
// components/AccessibleIconButton.tsx
export function AccessibleIconButton({ icon: Icon, label, onClick }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2.5 rounded-lg text-neutral-800 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-95 transition"
    >
      <Icon className="w-5 h-5" aria-hidden="true" />
    </button>
  );
}
```
