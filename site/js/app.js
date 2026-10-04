/**
 * CompliRules - Client Application Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  initCopyButton();
  initTerminalSimulator();
  initPartnersDirectory();
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
    { text: "ℹ️  CompliRules is an automated AST heuristic tool (Not certified legal/security counsel).", delay: 3200, color: "text-gray-400 italic" },
    { text: "   For certified penetration tests & official DPO audits: https://halilyilmz.github.io/complirules/#partners", delay: 3400, color: "text-cyan-400 font-medium" }
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

// 3. Verified Partners Directory (Filter & Render)
function initPartnersDirectory() {
  const container = document.getElementById("partners-grid");
  const filterBtns = document.querySelectorAll(".partner-filter-btn");

  if (!container || !window.PARTNERS_DATA) return;

  function renderPartners(category = "all") {
    container.innerHTML = "";

    const filtered = category === "all"
      ? window.PARTNERS_DATA
      : window.PARTNERS_DATA.filter((p) => p.category === category);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 text-gray-400">
          Bu kategoride henüz partner bulunmuyor. Siber güvenlik firmanızla katılmak için bize ulaşın.
        </div>
      `;
      return;
    }

    filtered.forEach((partner) => {
      const card = document.createElement("article");
      card.className = "glass-panel rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:border-gray-600 group";
      
      const badgeClass = `badge-${partner.category}`;

      card.innerHTML = `
        <div>
          <div class="flex items-start justify-between gap-4 mb-4">
            <div class="flex items-center gap-3">
              <img src="${partner.logo}" alt="${partner.name} logo" class="w-12 h-12 rounded-xl object-cover border border-white/10" loading="lazy" />
              <div>
                <h3 class="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors">${partner.name}</h3>
                <span class="text-xs text-gray-400 flex items-center gap-1">📍 ${partner.location}</span>
              </div>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-full font-medium ${badgeClass}">
              ${partner.categoryLabel}
            </span>
          </div>

          <p class="text-sm text-gray-300 mb-4 leading-relaxed">${partner.description}</p>

          <div class="mb-5">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Uzmanlık Alanları</span>
            <div class="flex flex-wrap gap-1.5">
              ${partner.services.map(s => `<span class="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-300">${s}</span>`).join('')}
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          <div>
            ${partner.discountCode ? `
              <span class="text-[11px] text-emerald-400 font-mono block">İndirim Kodu: <strong class="bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-800/60">${partner.discountCode}</strong></span>
            ` : ''}
            <span class="text-[11px] text-gray-500">Doğrulanmış Partner</span>
          </div>
          <a href="${partner.referralUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold rounded-lg transition-all shadow-md hover:shadow-cyan-500/25">
            Teklif Al <span>→</span>
          </a>
        </div>
      `;

      container.appendChild(card);
    });
  }

  // Initial render
  renderPartners("all");

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
      renderPartners(category);
    });
  });
}

// 4. Modals (Disclaimer & Partner Inbound)
function initModals() {
  const disclaimerModal = document.getElementById("disclaimer-modal");
  const openDisclaimerBtns = document.querySelectorAll(".open-disclaimer-trigger");
  const closeDisclaimerBtn = document.getElementById("close-disclaimer-btn");

  const partnerModal = document.getElementById("partner-modal");
  const openPartnerBtn = document.getElementById("open-partner-modal-btn");
  const closePartnerBtn = document.getElementById("close-partner-btn");

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

  if (openPartnerBtn) openPartnerBtn.addEventListener("click", () => openModal(partnerModal));
  if (closePartnerBtn) closePartnerBtn.addEventListener("click", () => closeModal(partnerModal));

  // Close on backdrop click
  [disclaimerModal, partnerModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(disclaimerModal);
      closeModal(partnerModal);
    }
  });
}
