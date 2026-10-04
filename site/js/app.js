/**
 * CompliRules - Client Application Logic (Simple, Fast & Clean)
 */

document.addEventListener("DOMContentLoaded", () => {
  initCopyButton();
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

// 2. Searchable & Filterable Rules Explorer
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
        <div class="col-span-full py-8 text-center text-zinc-500 text-xs">
          Aramanızla eşleşen kural bulunamadı.
        </div>
      `;
      return;
    }

    filtered.forEach((rule) => {
      const el = document.createElement("div");
      el.className = "p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between";

      const isCritical = rule.severity === "CRITICAL";
      const badgeStyle = isCritical
        ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
        : "bg-amber-500/10 text-amber-300 border-amber-500/30";

      el.innerHTML = `
        <div>
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="text-[11px] font-semibold text-cyan-400">
              ${rule.jurisdiction}
            </span>
            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded border ${badgeStyle}">
              ${rule.severity}
            </span>
          </div>
          <h4 class="font-bold text-xs text-white mb-1 leading-snug">
            ${rule.title}
          </h4>
          <p class="text-[11px] text-zinc-400 leading-relaxed mb-2 line-clamp-2" title="${rule.summary}">
            ${rule.summary}
          </p>
        </div>

        <div class="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span class="truncate max-w-[200px]" title="${rule.citation}">⚖️ ${rule.citation}</span>
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
        b.classList.remove("bg-white/15", "text-white");
        b.classList.add("text-zinc-400");
      });
      btn.classList.add("bg-white/15", "text-white");
      btn.classList.remove("text-zinc-400");

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

// 3. Accessible Legal Modal
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
