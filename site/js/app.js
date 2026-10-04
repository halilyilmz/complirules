/**
 * CompliRules - Client Application Logic (Free, Open-Source & Informative)
 */

document.addEventListener("DOMContentLoaded", () => {
  initCopyButton();
  initTerminalSimulator();
  initRulesExplorer();
  initModals();
});

// 1. Copy Command to Clipboard
function initCopyButton() {
  const copyBtn = document.getElementById("copy-install-btn");
  const copyText = document.getElementById("install-cmd-text");
  const copyFeedback = document.getElementById("copy-feedback");

  if (!copyBtn || !copyText) return;

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(copyText.innerText.trim());
      if (copyFeedback) {
        copyFeedback.classList.remove("hidden");
        copyFeedback.innerText = "Kopyalandı!";
        setTimeout(() => copyFeedback.classList.add("hidden"), 2000);
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  });
}

// 2. Interactive Terminal Simulator
function initTerminalSimulator() {
  const replayBtn = document.getElementById("terminal-replay-btn");
  const terminalBody = document.getElementById("terminal-output-body");

  const terminalLines = [
    { text: "🛡️  CompliRules AST Guardrail v1.0.0 — Scanning codebase...", delay: 200, color: "text-blue-400 font-bold" },
    { text: "   Found 14 source files (.ts, .tsx, .js)...", delay: 500, color: "text-gray-400" },
    { text: "   Running 24 MDC rules & TypeScript Compiler AST visitors...", delay: 800, color: "text-gray-400" },
    { text: "❌ [FAIL] src/components/Header.tsx:12 — External Google Fonts CDN detected without local proxy (LG München I 3 O 17493/20 violation).", delay: 1200, color: "text-red-400" },
    { text: "❌ [FAIL] src/pages/signup.tsx:48 — Pre-checked consent checkbox violates ePrivacy Art. 5(3) & Planet49 (C-673/17).", delay: 1600, color: "text-red-400" },
    { text: "⚠️  [WARN] src/lib/analytics.ts:22 — Ungated Mixpanel tracker violates KVKK Çerez Rehberi & GPC opt-out.", delay: 2000, color: "text-amber-400" },
    { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", delay: 2300, color: "text-gray-600" },
    { text: "📊 Summary: 2 Errors, 1 Warning found.", delay: 2500, color: "text-red-300 font-bold" },
    { text: "💡 Auto-remediation available: Run 'npx complirules scaffold' to generate local font proxy & CMP gate.", delay: 2800, color: "text-emerald-400" },
    { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", delay: 3000, color: "text-gray-600" },
    { text: "ℹ️  CompliRules is an open-source automated AST heuristic tool (See DISCLAIMER.md - Not legal/security advice).", delay: 3200, color: "text-gray-400 italic" },
    { text: "   Documentation & Rule Catalog: https://halilyilmz.github.io/complirules/", delay: 3400, color: "text-cyan-400 font-medium" }
  ];

  function runSimulation() {
    if (!terminalBody) return;
    terminalBody.innerHTML = "";
    
    terminalLines.forEach((line) => {
      setTimeout(() => {
        const p = document.createElement("div");
        p.className = `py-0.5 leading-relaxed text-sm ${line.color}`;
        p.innerText = line.text;
        terminalBody.appendChild(p);
        terminalBody.scrollTop = terminalBody.scrollHeight;
      }, line.delay);
    });
  }

  if (terminalBody) runSimulation();
  if (replayBtn) replayBtn.addEventListener("click", runSimulation);
}

// 3. Interactive Rules & Statutory Frameworks Explorer
function initRulesExplorer() {
  const container = document.getElementById("rules-grid");
  const filterBtns = document.querySelectorAll(".rule-filter-btn");

  if (!container || !window.RULES_DATA) return;

  function renderRules(category = "all") {
    container.innerHTML = "";

    const filtered = category === "all"
      ? window.RULES_DATA
      : window.RULES_DATA.filter((r) => r.category === category);

    filtered.forEach((rule) => {
      const card = document.createElement("article");
      card.className = "glass-panel rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-gray-500 group";
      
      const isCritical = rule.severity === "CRITICAL";
      const badgeColor = isCritical 
        ? "bg-red-950/60 text-red-300 border-red-800/80" 
        : "bg-amber-950/60 text-amber-300 border-amber-800/80";

      card.innerHTML = `
        <div>
          <div class="flex items-start justify-between gap-3 mb-3">
            <span class="text-xs font-semibold text-cyan-400 flex items-center gap-1">
              ${rule.jurisdiction}
            </span>
            <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badgeColor}">
              ${rule.severity}
            </span>
          </div>

          <h3 class="font-bold text-base text-white group-hover:text-cyan-300 transition-colors mb-2 leading-snug">
            ${rule.title}
          </h3>

          <p class="text-xs text-gray-300 leading-relaxed mb-4">
            ${rule.summary}
          </p>
        </div>

        <div class="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-gray-400">
          <span class="truncate max-w-[240px] text-gray-400" title="${rule.citation}">⚖️ ${rule.citation}</span>
          <span class="text-xs text-cyan-400 group-hover:translate-x-0.5 transition-transform font-bold">.mdc</span>
        </div>
      `;

      container.appendChild(card);
    });
  }

  // Initial render
  renderRules("all");

  // Tab click handlers
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => {
        b.classList.remove("bg-white/15", "text-white", "border-white/20");
        b.classList.add("text-gray-400", "border-transparent");
      });
      btn.classList.add("bg-white/15", "text-white", "border-white/20");
      btn.classList.remove("text-gray-400", "border-transparent");

      const category = btn.getAttribute("data-category") || "all";
      renderRules(category);
    });
  });
}

// 4. Modals (Disclaimer)
function initModals() {
  const disclaimerModal = document.getElementById("disclaimer-modal");
  const openDisclaimerBtns = document.querySelectorAll(".open-disclaimer-trigger");
  const closeDisclaimerBtn = document.getElementById("close-disclaimer-btn");

  function openModal(modal) {
    if (!modal) return;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  openDisclaimerBtns.forEach(btn => btn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal(disclaimerModal);
  }));

  if (closeDisclaimerBtn) closeDisclaimerBtn.addEventListener("click", () => closeModal(disclaimerModal));

  // Close on backdrop click
  if (disclaimerModal) {
    disclaimerModal.addEventListener("click", (e) => {
      if (e.target === disclaimerModal) closeModal(disclaimerModal);
    });
  }

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(disclaimerModal);
    }
  });
}
