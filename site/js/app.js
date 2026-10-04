/**
 * CompliRules - Client Application Logic (Minimal, Fast & Developer-First)
 */

document.addEventListener("DOMContentLoaded", () => {
  initCopyButton();
  initTerminal();
  initRulesExplorer();
  initModal();
});

// 1. One-Click CLI Copy
function initCopyButton() {
  const btn = document.getElementById("copy-install-btn");
  const text = document.getElementById("install-cmd-text");
  const feedback = document.getElementById("copy-feedback");

  if (!btn || !text) return;

  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text.innerText.trim());
      if (feedback) {
        feedback.classList.remove("hidden");
        setTimeout(() => feedback.classList.add("hidden"), 2000);
      }
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  });
}

// 2. Minimalist Terminal Simulation
function initTerminal() {
  const terminal = document.getElementById("terminal-output-body");
  const replayBtn = document.getElementById("terminal-replay-btn");

  const lines = [
    { text: "⚡ complirules check --path ./src", delay: 100, color: "text-gray-400 font-semibold" },
    { text: "   Parsing AST across 28 files...", delay: 400, color: "text-gray-500" },
    { text: "❌ [FAIL] Header.tsx:14 — Harici Google Fonts CDN tespit edildi (LG München I emsal ihlali - IP sızıntısı).", delay: 900, color: "text-rose-400" },
    { text: "❌ [FAIL] RegisterForm.tsx:52 — Önceden işaretlenmiş rıza kutusu tespit edildi (KVKK & ePrivacy Art. 5(3) ihlali).", delay: 1400, color: "text-rose-400" },
    { text: "⚠️  [WARN] logger.ts:18 — Ham kullanıcı token'ı loglanıyor (KVKK Md. 12 Veri Güvenliği).", delay: 1900, color: "text-amber-400" },
    { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", delay: 2200, color: "text-gray-700" },
    { text: "🛡️ 2 Hata, 1 Uyarı engellendi. Kodunuz yasal sınırlara çekildi.", delay: 2500, color: "text-emerald-400 font-bold" }
  ];

  function run() {
    if (!terminal) return;
    terminal.innerHTML = "";
    lines.forEach((l) => {
      setTimeout(() => {
        const div = document.createElement("div");
        div.className = `py-0.5 leading-relaxed text-xs sm:text-sm ${l.color}`;
        div.textContent = l.text;
        terminal.appendChild(div);
        terminal.scrollTop = terminal.scrollHeight;
      }, l.delay);
    });
  }

  if (terminal) run();
  if (replayBtn) replayBtn.addEventListener("click", run);
}

// 3. Searchable & Filterable Rules Explorer
function initRulesExplorer() {
  const grid = document.getElementById("rules-grid");
  const searchInput = document.getElementById("rules-search-input");
  const filterBtns = document.querySelectorAll(".rule-filter-btn");
  const countLabel = document.getElementById("rules-count-label");

  if (!grid || !window.RULES_DATA) return;

  let currentCategory = "all";
  let searchQuery = "";

  function render() {
    grid.innerHTML = "";

    const filtered = window.RULES_DATA.filter((rule) => {
      const matchesCategory = currentCategory === "all" || rule.category === currentCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        rule.title.toLowerCase().includes(q) ||
        rule.summary.toLowerCase().includes(q) ||
        rule.citation.toLowerCase().includes(q) ||
        rule.jurisdiction.toLowerCase().includes(q);
      
      return matchesCategory && matchesSearch;
    });

    if (countLabel) {
      countLabel.textContent = `${filtered.length} kural listeleniyor`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-gray-500 text-sm">
          Aramanızla eşleşen kural bulunamadı.
        </div>
      `;
      return;
    }

    filtered.forEach((rule) => {
      const el = document.createElement("div");
      el.className = "card-clean rounded-xl p-5 flex flex-col justify-between";

      const isCritical = rule.severity === "CRITICAL";
      const badgeStyle = isCritical
        ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
        : "bg-amber-500/10 text-amber-300 border-amber-500/30";

      el.innerHTML = `
        <div>
          <div class="flex items-center justify-between gap-2 mb-2.5">
            <span class="text-xs font-semibold text-cyan-400">
              ${rule.jurisdiction}
            </span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeStyle}">
              ${rule.severity}
            </span>
          </div>
          <h3 class="font-bold text-sm sm:text-base text-white mb-2 leading-snug">
            ${rule.title}
          </h3>
          <p class="text-xs text-gray-400 leading-relaxed mb-4">
            ${rule.summary}
          </p>
        </div>

        <div class="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-500">
          <span class="truncate max-w-[220px]" title="${rule.citation}">⚖️ ${rule.citation}</span>
          <span class="text-cyan-400/80 font-bold">.mdc</span>
        </div>
      `;

      grid.appendChild(el);
    });
  }

  // Filter clicks
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => {
        b.classList.remove("bg-white/15", "text-white", "border-white/20");
        b.classList.add("text-gray-400", "border-transparent");
      });
      btn.classList.add("bg-white/15", "text-white", "border-white/20");
      btn.classList.remove("text-gray-400", "border-transparent");

      currentCategory = btn.getAttribute("data-category") || "all";
      render();
    });
  });

  // Search input
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value;
      render();
    });
  }

  // Initial render
  render();
}

// 4. Accessible Legal Modal
function initModal() {
  const modal = document.getElementById("disclaimer-modal");
  const openTriggers = document.querySelectorAll(".open-disclaimer-trigger");
  const closeBtn = document.getElementById("close-disclaimer-btn");
  const acceptBtn = document.getElementById("accept-disclaimer-btn");

  let previousActiveElement = null;

  function open() {
    if (!modal) return;
    previousActiveElement = document.activeElement;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    if (!modal) return;
    modal.classList.add("hidden");
    document.body.style.overflow = "";
    if (previousActiveElement && typeof previousActiveElement.focus === "function") {
      previousActiveElement.focus();
    }
  }

  openTriggers.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      open();
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", close);
  if (acceptBtn) acceptBtn.addEventListener("click", close);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
      close();
    }
  });
}
