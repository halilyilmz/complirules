/**
 * CompliRules - Bilingual Application Logic (EN / TR)
 */

const DICTIONARY = {
  en: {
    nav_disclaimer: "Disclaimer",
    hero_badge: "Geliştiriciler İçin %100 Ücretsiz Kullanım (Free to Use)",
    hero_title_1: "Move fast.",
    hero_title_2: "Break no laws.",
    hero_sub: "While your AI generates your project, it can silently violate KVKK or GDPR. CompliRules adds ready-made rules to Cursor and Claude Code that quietly block those risks in the background.",
    copy_btn: "Copy",
    copy_btn_done: "Copied!",
    copy_caption: "One command — rules land in .cursor/rules automatically",
    mistakes_title_1: "4 legal mistakes",
    mistakes_title_2: "your AI makes",
    m1_title: "No Consentless Cookies",
    m1_body: "Blocks Google Analytics and tracking scripts from firing before the visitor gives explicit consent.",
    m2_title: "No Passwords in Logs",
    m2_body: "Stops passwords, tokens and national ID numbers from being written into server logs while debugging.",
    m3_title: "Real Account Deletion",
    m3_body: "When a user says “delete my account”, database records actually get wiped — not just hidden.",
    m4_title: "No Silent IP Leaks",
    m4_body: "Bundles fonts locally instead of external CDNs, so visitor IPs never leak abroad without notice.",
    how_title: "How it works",
    step1_title: "INSTALL",
    step1_body: "Run npx complirules init in your project.",
    step2_title: "AUTO-DETECTED",
    step2_body: "Cursor or Claude picks the rules into context instantly.",
    step3_title: "SAFE CODING",
    step3_body: "Your AI can no longer produce code that breaks the law.",
    disc_summary: "CompliRules is a static rule set tool — not legal advice or an attorney service. The software is provided \"AS IS\".",
    disc_link: "Full Legal Disclaimer (EN/TR) →",
    modal_title: "Legal Disclaimer",
    modal_p1: "CompliRules is a static rule set tool. It does not provide legal advice or attorney services. The software is provided \"AS IS\", without warranty of any kind. You remain responsible for the compliance of your own software.",
    modal_p2: "CompliRules bir statik kural aracıdır; avukatlık veya resmi hukuki danışmanlık hizmeti değildir. Yazılım \"OLDUĞU GİBİ\" (AS-IS) sağlanır. Olası idari cezalardan kullanıcı sorumludur.",
    modal_close_btn: "Close / Kapat"
  },
  tr: {
    nav_disclaimer: "Yasal Sorumluluk Reddi",
    hero_badge: "Geliştiriciler İçin %100 Ücretsiz Kullanım (Free to Use)",
    hero_title_1: "Hızlı ilerle.",
    hero_title_2: "Kanunları çiğneme.",
    hero_sub: "Yapay zekanız projenizi üretirken farkında olmadan KVKK veya GDPR'ı ihlal edebilir. CompliRules, Cursor ve Claude Code'a eklenen hazır kurallarla bu riskleri arka planda sessizce engeller.",
    copy_btn: "Kopyala",
    copy_btn_done: "Kopyalandı!",
    copy_caption: "Tek komutla çalıştırın, kurallar .cursor/rules içine otomatik insin",
    mistakes_title_1: "Yapay zekanızın yaptığı",
    mistakes_title_2: "4 yasal hata",
    m1_title: "İzinsiz Çerez Yüklemez",
    m1_body: "Ziyaretçi açıkça onay vermeden Google Analytics veya takip scriptlerinin çalışmasını engeller.",
    m2_title: "Loglara Şifre Basmaz",
    m2_body: "Hata ayıklarken şifre, token veya kimlik numaralarının sunucu loglarına açıkça yazılmasını durdurur.",
    m3_title: "Hesabı Gerçekten Siler",
    m3_body: "Kullanıcı “Hesabımı sil” dediğinde veritabanındaki kayıtların kalıcı olarak temizlenmesini sağlar.",
    m4_title: "Habersiz IP Sızdırmaz",
    m4_body: "Google Fonts gibi harici CDN'ler yerine fontları yerel pakete alarak ziyaretçi IP'lerinin yurt dışına çıkmasını önler.",
    how_title: "Nasıl Çalışır?",
    step1_title: "KURULUM",
    step1_body: "Projenizde npx complirules init komutunu çalıştırın.",
    step2_title: "OTOMATİK TANIMA",
    step2_body: "Cursor veya Claude kuralları anında bağlamına alır.",
    step3_title: "GÜVENLİ KODLAMA",
    step3_body: "Yapay zekanız mevzuata aykırı kod üretemez.",
    disc_summary: "CompliRules bir statik kural aracıdır; avukatlık veya resmi hukuki danışmanlık hizmeti değildir. Yazılım \"OLDUĞU GİBİ\" (AS-IS) sağlanır.",
    disc_link: "Tam Yasal Sorumluluk Reddi (TR/EN) →",
    modal_title: "Yasal Sorumluluk Reddi",
    modal_p1: "CompliRules bir statik kural aracıdır; avukatlık veya resmi hukuki danışmanlık hizmeti değildir. Yazılım \"OLDUĞU GİBİ\" (AS-IS) sunulur.",
    modal_p2: "CompliRules is a static rule set tool. It does not provide legal advice or attorney services. The software is provided \"AS IS\", without warranty of any kind.",
    modal_close_btn: "Kapat / Close"
  }
};

let currentLang = "en";

document.addEventListener("DOMContentLoaded", () => {
  initLanguageSwitcher();
  initCopyButton();
  initModal();
});

function initLanguageSwitcher() {
  const btnEn = document.getElementById("lang-btn-en");
  const btnTr = document.getElementById("lang-btn-tr");

  // Load saved preference or browser lang
  const saved = localStorage.getItem("complirules_lang");
  if (saved && (saved === "tr" || saved === "en")) {
    currentLang = saved;
  } else {
    currentLang = navigator.language && navigator.language.startsWith("tr") ? "tr" : "en";
  }

  applyLanguage(currentLang);

  if (btnEn && btnTr) {
    btnEn.addEventListener("click", () => {
      applyLanguage("en");
      localStorage.setItem("complirules_lang", "en");
    });
    btnTr.addEventListener("click", () => {
      applyLanguage("tr");
      localStorage.setItem("complirules_lang", "tr");
    });
  }
}

function applyLanguage(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;

  const btnEn = document.getElementById("lang-btn-en");
  const btnTr = document.getElementById("lang-btn-tr");

  if (btnEn && btnTr) {
    if (lang === "en") {
      btnEn.className = "px-2 py-0.5 rounded bg-[#E5484D] text-[#121110] transition-colors";
      btnTr.className = "px-2 py-0.5 rounded text-[#EDEAE4]/60 hover:text-white transition-colors";
    } else {
      btnTr.className = "px-2 py-0.5 rounded bg-[#E5484D] text-[#121110] transition-colors";
      btnEn.className = "px-2 py-0.5 rounded text-[#EDEAE4]/60 hover:text-white transition-colors";
    }
  }

  const dict = DICTIONARY[lang] || DICTIONARY.en;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
}

function initCopyButton() {
  const copyBtn = document.getElementById("copy-install-btn");
  const copyText = document.getElementById("install-cmd-text");
  const btnSpan = copyBtn ? copyBtn.querySelector("[data-i18n]") : null;

  if (copyBtn && copyText) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copyText.innerText.trim());
        const dict = DICTIONARY[currentLang] || DICTIONARY.en;
        const originalText = dict.copy_btn || "Copy";
        if (btnSpan) btnSpan.textContent = dict.copy_btn_done || "Copied!";
        else copyBtn.textContent = dict.copy_btn_done || "Copied!";

        setTimeout(() => {
          if (btnSpan) btnSpan.textContent = originalText;
          else copyBtn.textContent = originalText;
        }, 2000);
      } catch (e) {
        console.error(e);
      }
    });
  }
}

function initModal() {
  const modal = document.getElementById("disclaimer-modal");
  const openBtns = document.querySelectorAll(".open-disclaimer-trigger");
  const closeBtn = document.getElementById("close-disclaimer-btn");
  const acceptBtn = document.getElementById("accept-disclaimer-btn");

  function openModal() {
    if (modal) modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    if (modal) modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  openBtns.forEach((b) => b.addEventListener("click", openModal));
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (acceptBtn) acceptBtn.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}
