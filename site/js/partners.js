/**
 * CompliRules - Verified Security & Compliance Partners Registry
 * 
 * Bu dosya, sitede listelenen siber güvenlik ve hukuki denetim firmalarını barındırır.
 * Yeni partner eklemek, logoları, açıklamaları veya yönlendirme linklerini değiştirmek için
 * aşağıdaki objeleri doğrudan düzenleyebilirsiniz.
 * 
 * Kategoriler:
 * - 'pentest': Sızma Testi & Pentest
 * - 'legal':   KVKK & GDPR Hukuki Denetim
 * - 'soc2':    SOC2 & ISO 27001 Belgelendirme
 * - 'cloud':   Bulut & Altyapı Güvenliği
 */

window.PARTNERS_DATA = [
  {
    id: "cyber-sentinel-labs",
    name: "CyberSentinel Labs",
    tier: "Featured Partner",
    category: "pentest",
    categoryLabel: "Sızma Testi & Pentest",
    badge: "Offensive Security & Red Team",
    logo: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=120&h=120&q=80",
    description: "Fast-turnaround web application & API penetration testing specifically tuned for AI-generated codebases. Detailed remediation reports within 48 hours.",
    services: ["Web Application Pentest", "API Vulnerability Audit", "Mobile App Security", "Red Teaming"],
    referralUrl: "https://cybersentinellabs.example.com/pentest?ref=complirules",
    discountCode: "COMPLIRULES15",
    location: "Global / Remote"
  },
  {
    id: "lex-data-governance",
    name: "LexData Privacy Counsel",
    tier: "Certified Partner",
    category: "legal",
    categoryLabel: "KVKK & GDPR Hukuki Denetim",
    badge: "DPO & Regulatory Compliance",
    logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=120&h=120&q=80",
    description: "Licensed privacy attorneys providing VERBİS registration, GDPR ROPA inventories, cross-border Transfer Impact Assessments (TIA), and DPO-as-a-Service.",
    services: ["KVKK VERBİS Filing", "GDPR ROPA Envanteri", "Schrems II TIA", "Çerez & CMP Hukuki Onayı"],
    referralUrl: "https://lexdata.example.com/compliance?ref=complirules",
    discountCode: "VIBECODE-DPO",
    location: "Istanbul & Brussels"
  },
  {
    id: "aegis-compliance-group",
    name: "Aegis Audit & Assurance",
    tier: "Featured Partner",
    category: "soc2",
    categoryLabel: "SOC2 & ISO 27001",
    badge: "Audit Readiness & Certification",
    logo: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=120&h=120&q=80",
    description: "Turnkey SOC 2 Type I/II and ISO/IEC 27001 readiness assessments. Accelerate your enterprise sales pipeline with automated continuous evidence collection.",
    services: ["SOC 2 Type I & II Readiness", "ISO 27001:2022 Implementation", "HIPAA Security Rule Audit", "PCI-DSS Assessment"],
    referralUrl: "https://aegisaudit.example.com/start?ref=complirules",
    discountCode: "FASTSOC2",
    location: "North America & Europe"
  },
  {
    id: "infra-guard-cloud",
    name: "InfraGuard Cloud Defense",
    tier: "Certified Partner",
    category: "cloud",
    categoryLabel: "Bulut & Altyapı Güvenliği",
    badge: "AWS / GCP / K8s Hardening",
    logo: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=120&h=120&q=80",
    description: "Zero-trust cloud infrastructure reviews, AWS/GCP IAM permission tightening, Kubernetes cluster hardening, and cross-border geo-fencing implementation.",
    services: ["AWS/GCP Security Audit", "Kubernetes Hardening", "Geo-Fencing Architecture", "DDoS & WAF Protection"],
    referralUrl: "https://infraguard.example.com/cloud-audit?ref=complirules",
    discountCode: "SECURECLOUD",
    location: "Global / Remote"
  },
  {
    id: "red-viper-sec",
    name: "RedViper Security",
    tier: "Community Partner",
    category: "pentest",
    categoryLabel: "Sızma Testi & Pentest",
    badge: "Smart Contract & API Security",
    logo: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=120&h=120&q=80",
    description: "Specialized white-hat ethical hacking team for startup APIs, microservices, and Web3 smart contract vulnerability assessments.",
    services: ["Source Code Review", "Smart Contract Audit", "Logic Flaw Detection", "Bounty Management"],
    referralUrl: "https://redviper.example.com/quote?ref=complirules",
    discountCode: "VIPER-VIBE",
    location: "Berlin & London"
  },
  {
    id: "veri-hukuk-partners",
    name: "VeriKalkanı Hukuk & Danışmanlık",
    tier: "Featured Partner",
    category: "legal",
    categoryLabel: "KVKK & GDPR Hukuki Denetim",
    badge: "KVKK Kurul Savunması & İtiraz",
    logo: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=120&h=120&q=80",
    description: "KVKK ve ETK mevzuatında uzmanlaşmış hukuk ekibi. İdari para cezası itirazları, 72 saatlik veri ihlal bildirim kriz yönetimi ve e-ticaret uyumu.",
    services: ["KVKK Uyum Denetimi", "72 Saat İhlal Bildirim Yönetimi", "ETK / İYS Entegrasyon Denetimi", "Sözleşme Revizyonları"],
    referralUrl: "https://verikalkani.example.com/iletisim?ref=complirules",
    discountCode: "KVKK-STARTUP",
    location: "Ankara & Istanbul"
  }
];
