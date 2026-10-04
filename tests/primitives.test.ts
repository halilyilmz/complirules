import { describe, it, expect } from 'vitest';
import { 
  maskTCKN, 
  maskEmail, 
  maskPhone, 
  maskCreditCard, 
  maskIBAN, 
  scrubObject,
  shredPersonalData,
  createTombstoneLog,
  createConsentRecord,
  isConsentCurrent,
  revokeConsent,
  getConsentHistory,
  handleDownstreamRevocation,
  CookieConsentManager,
  DsrEngine,
  BreachNotifier,
  InternalIncidentRegister,
  GeoRouter,
  HipaaEmergencyService,
  activateBreakGlass,
  isSessionActive
} from '../packages/primitives/src/index.js';

describe('CompliRules Primitives', () => {
  describe('PII Maskeleme Fonksiyonları', () => {
    it('TCKN maskelemesini doğru yapar (ilk 3 ve son 2 hane açık)', () => {
      const masked = maskTCKN('12345678901');
      expect(masked).toBe('123******01');
    });

    it('E-posta maskelemesini doğru yapar', () => {
      const masked = maskEmail('ahmet@example.com');
      expect(masked).toBe('a***t@example.com');
    });

    it('Telefon maskelemesini doğru yapar', () => {
      const masked = maskPhone('+905321234567');
      expect(masked).toContain('***');
      expect(masked).toContain('67');
    });

    it('Kredi kartı numarasını maskeler (son 4 hane açık)', () => {
      const masked = maskCreditCard('4111222233334444');
      expect(masked).toBe('**** **** **** 4444');
    });

    it('IBAN numarasını maskeler', () => {
      const masked = maskIBAN('TR330006100511123456789012');
      expect(masked).toBe('TR33 ********** 9012');
    });
  });

  describe('Nesne ve Log Redaksiyonu (scrubObject)', () => {
    it('iç içe geçmiş nesnelerdeki parola ve TCKN verilerini gizler', () => {
      const rawPayload = {
        username: 'johndoe',
        password: 'SuperSecretPassword123!',
        tckn: '12345678901',
        email: 'user@test.com',
        profile: {
          token: 'jwt.token.abc',
          role: 'ADMIN'
        }
      };

      const sanitized = scrubObject(rawPayload);
      expect(sanitized.password).toBe('[REDACTED_PII]');
      expect(sanitized.tckn).toBe('[REDACTED_PII]');
      expect(sanitized.profile.token).toBe('[REDACTED_PII]');
      expect(sanitized.username).toBe('johndoe');
      expect(sanitized.profile.role).toBe('ADMIN');
    });
  });

  describe('Crypto-Shredding (Kriptografik Veri İmhası)', () => {
    it('kullanıcı verisini geri döndürülemez şekilde anonimleştirir', () => {
      const user = {
        id: 'usr_123',
        email: 'ahmet@sirket.com',
        name: 'Ahmet Yılmaz',
        phone: '+905321234567',
        tckn: '12345678901'
      };

      const shredded = shredPersonalData(user);
      expect(shredded.id).toBe('usr_123'); // FK bütünlüğü korunur
      expect(shredded.name).toBe('ANONİM KULLANICI');
      expect(shredded.phone).toBeNull();
      expect(shredded.tckn).toBeNull();
      expect(shredded.isAnonymized).toBe(true);
      expect(shredded.email).toMatch(/^anonymized-[a-f0-9]+@erased\.local$/);
      expect(shredded.tombstoneHash).toBeDefined();
    });

    it('denetim kanıtı (Tombstone Log) üretir', () => {
      const log = createTombstoneLog('USER', 'usr_123', 'KVKK_MD_7');
      expect(log.entityId).toBe('usr_123');
      expect(log.legalBasis).toBe('KVKK_MD_7');
      expect(log.verifierHash).toBeDefined();
    });
  });

  describe('Açık Rıza Yönetimi & Opt-Out (Consent Store)', () => {
    it('ayrık rıza kaydı oluşturur ve IP adresini hashler', () => {
      const record = createConsentRecord({
        userId: 'usr_999',
        consentType: 'MARKETING_COMMUNICATION',
        granted: true,
        policyVersion: 'v1.0',
        policyText: 'Ticari elektronik ileti onay metni...',
        rawIp: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      });

      expect(record.granted).toBe(true);
      expect(record.consentType).toBe('MARKETING_COMMUNICATION');
      expect(record.ipAddressHash).not.toBe('192.168.1.1'); // Ham IP saklanmaz
      expect(record.policyTextHash).toBeDefined();

      expect(isConsentCurrent(record, 'v1.0')).toBe(true);
      expect(isConsentCurrent(record, 'v2.0')).toBe(false); // Politika güncellenince rıza geçersiz sayılır
    });

    it('rızanın geri alınmasını (opt-out) işler ve geçmişi listeler', () => {
      const record = createConsentRecord({
        userId: 'usr_888',
        consentType: 'ANALYTICS_COOKIES',
        granted: true,
        policyVersion: 'v1.0',
        policyText: 'Analitik çerez metni...',
        rawIp: '10.0.0.1',
        userAgent: 'Mozilla/5.0...'
      });

      const revoked = revokeConsent(record, 'Kullanıcı banner üzerinden iptal etti');
      expect(revoked.granted).toBe(false);
      expect(revoked.revoked).toBe(true);
      expect(revoked.revokedAt).toBeDefined();
      expect(isConsentCurrent(revoked, 'v1.0')).toBe(false);

      const history = getConsentHistory([record, revoked], { userId: 'usr_888' });
      expect(history.length).toBe(2);
    });

    it('downstream rıza iptal işleyicilerini (handlers) çalıştırır', async () => {
      let crmRevoked = false;
      const handlers = [
        {
          serviceName: 'HubSpot',
          revoke: async () => {
            crmRevoked = true;
            return { success: true };
          }
        }
      ];

      const results = await handleDownstreamRevocation('usr_888', 'MARKETING_COMMUNICATION', handlers);
      expect(crmRevoked).toBe(true);
      expect(results[0].serviceName).toBe('HubSpot');
      expect(results[0].success).toBe(true);
    });
  });

  describe('Çerez Yönetimi (Cookie Consent CMP - KVKK Çerez Rehberi & GDPR)', () => {
    it('varsayılan tercihlerde yalnızca zorunlu çerezleri aktif eder (Opt-in ilkesi)', () => {
      const defaults = CookieConsentManager.createDefaultPreferences();
      expect(defaults.strictly_necessary).toBe(true);
      expect(defaults.analytics).toBe(false);
      expect(defaults.marketing).toBe(false);
      expect(defaults.functional).toBe(false);

      expect(CookieConsentManager.isCategoryAllowed(defaults, 'strictly_necessary')).toBe(true);
      expect(CookieConsentManager.isCategoryAllowed(defaults, 'analytics')).toBe(false);
      expect(CookieConsentManager.isCategoryAllowed(defaults, 'marketing')).toBe(false);
    });

    it('12 aylık geçerlilik süresi ve versiyon kontrolü ile çerez rıza kaydı yönetir', () => {
      const record = CookieConsentManager.createConsentRecord({
        userId: 'usr_cookie',
        preferences: { analytics: true, marketing: false },
        policyVersion: 'v1.0'
      });

      expect(record.preferences.strictly_necessary).toBe(true);
      expect(record.preferences.analytics).toBe(true);
      expect(record.expiryTimestamp).toBeGreaterThan(record.consentTimestamp);

      // Versiyon aynı iken yenileme gerekmez
      expect(CookieConsentManager.isConsentRenewalNeeded(record, 'v1.0')).toBe(false);
      // Versiyon değiştiğinde yenileme gerekir
      expect(CookieConsentManager.isConsentRenewalNeeded(record, 'v2.0')).toBe(true);
    });

    it('KVKK Çerez Rehberi uyumlu simetrik banner yapılandırması sunar', () => {
      const config = CookieConsentManager.getSymmetricBannerConfig();
      expect(config.isSymmetric).toBe(true);
      expect(config.acceptAllText).toBe('Tümünü Kabul Et');
      expect(config.rejectAllText).toBe('Tümünü Reddet');
    });

    it('Tümünü Reddet ve Tümünü Kabul Et tercihlerini eksiksiz üretir', () => {
      const rejected = CookieConsentManager.createRejectAllPreferences();
      expect(rejected.strictly_necessary).toBe(true);
      expect(rejected.analytics).toBe(false);
      expect(rejected.marketing).toBe(false);
      expect(rejected.functional).toBe(false);

      const accepted = CookieConsentManager.createAcceptAllPreferences();
      expect(accepted.strictly_necessary).toBe(true);
      expect(accepted.analytics).toBe(true);
      expect(accepted.marketing).toBe(true);
      expect(accepted.functional).toBe(true);

      const safeEmpty = CookieConsentManager.createConsentRecord({ userId: 'usr_safe' });
      expect(safeEmpty.preferences.strictly_necessary).toBe(true);
      expect(safeEmpty.preferences.analytics).toBe(false);
    });
  });

  describe('Veri Sahibi Başvuru Motoru (DSR Engine - KVKK Md. 11/13 & Tebliğ Md. 5/2)', () => {
    it('Tebliğ Md. 5/2 zorunlu başvuru alanlarını doğrular', () => {
      const incomplete = {
        fullName: 'Ali Demir'
      };
      const validation1 = DsrEngine.validateKvkkApplicantPayload(incomplete);
      expect(validation1.valid).toBe(false);
      expect(validation1.missingFields.length).toBeGreaterThan(0);

      const complete = {
        fullName: 'Ali Demir',
        tcknOrPassport: '12345678901',
        notificationAddress: 'Barbaros Bulv. No:1 Beşiktaş/İstanbul',
        emailOrPhone: 'ali.demir@example.com',
        requestSubject: 'Kişisel verilerimin silinmesi talebi',
        signatureVerified: true
      };
      const validation2 = DsrEngine.validateKvkkApplicantPayload(complete);
      expect(validation2.valid).toBe(true);
      expect(validation2.missingFields.length).toBe(0);
    });

    it('30 günlük kesin ve uzatılamaz SLA takibiyle bilet oluşturur ve downstream bildirim gönderir', () => {
      const applicant = {
        fullName: 'Zeynep Kaya',
        tcknOrPassport: '98765432109',
        notificationAddress: 'Kızılay Mah. Çankaya/Ankara',
        emailOrPhone: 'zeynep@example.com',
        requestSubject: 'Pazarlama verilerimin düzeltilmesi',
        signatureVerified: true
      };

      const ticket = DsrEngine.createTicket({
        jurisdiction: 'KVKK_TR',
        requestType: 'ERASURE',
        applicant
      });

      expect(ticket.ticketId).toContain('DSR-KVKK_TR');
      expect(ticket.status).toBe('RECEIVED');
      expect(ticket.remainingDays).toBeLessThanOrEqual(30);
      expect(ticket.isOverdue).toBe(false);

      // Downstream bildirim
      const notified = DsrEngine.notifyDownstreamProcessors(ticket, ['Salesforce', 'SendGrid']);
      expect(notified.downstreamProcessorsNotified).toBe(true);
      expect(notified.notifiedProcessors).toContain('Salesforce');
      expect(notified.notifiedProcessors).toContain('SendGrid');
    });

    it('GDPR taleplerinde gerekçeli süre uzatımını (1+2 ay) destekler, KVKKda ise süre uzatımını kesinlikle reddeder', () => {
      const applicant = {
        fullName: 'Hans Mueller',
        tcknOrPassport: 'DE98765432',
        notificationAddress: 'Berlin, Germany',
        emailOrPhone: 'hans@example.de',
        requestSubject: 'Access and Erasure request',
        signatureVerified: true
      };

      // KVKK uzatılamaz
      const trTicket = DsrEngine.createTicket({ jurisdiction: 'KVKK_TR', requestType: 'ACCESS', applicant });
      expect(() => {
        DsrEngine.extendTicketDeadline(trTicket, 'Talebin kapsamı çok geniş ve karmaşık');
      }).toThrow('KVKK_NON_EXTENDABLE');

      // GDPR uzatılabilir
      const gdprTicket = DsrEngine.createTicket({ jurisdiction: 'GDPR_EU', requestType: 'ACCESS', applicant });
      const extended = DsrEngine.extendTicketDeadline(gdprTicket, 'Karmaşık ve çok sayıda veri kategorisi incelemesi gerekiyor', 60);
      expect(extended.isExtended).toBe(true);
      expect(extended.extensionJustification).toContain('Karmaşık');
      expect(new Date(extended.deadlineDate).getTime()).toBeGreaterThan(new Date(gdprTicket.deadlineDate).getTime());

      // İkinci kez uzatılamaz
      expect(() => {
        DsrEngine.extendTicketDeadline(extended, 'İkinci bir uzatma talebi');
      }).toThrow('GDPR_EXTENSION_ALREADY_APPLIED');
    });
  });

  describe('72 Saatlik İhlal Bildirim Motoru (Breach Notifier - KVKK Md. 12 & Kurul 2019/10)', () => {
    it('72 saatlik geri sayımı ve kalan saatleri doğru hesaplar', () => {
      const now = Date.now();
      const discovery = now - 2 * 60 * 60 * 1000; // 2 saat önce keşfedildi

      const countdown = BreachNotifier.calculateCountdown(discovery, now);
      expect(countdown.isOverdue).toBe(false);
      expect(countdown.remainingHours).toBe(70); // 72 - 2 = 70 saat
    });

    it('Kurul 2019/10 İlke Kararı Formunun 6 zorunlu alanını içeren JSON üretir', () => {
      const formJson = BreachNotifier.generateKurulFormJson({
        organizationName: 'MegaTech A.Ş.',
        contactPerson: 'Veri Koruma Yetkilisi',
        contactEmail: 'kvkk@megatech.com',
        form: {
          incidentDate: '2026-10-01T10:00:00Z',
          discoveryDate: new Date().toISOString(),
          breachSourceAndNature: 'Siber saldırı sonucu yetkisiz veri tabanı sorgusu',
          affectedDataCategories: ['Kimlik', 'İletişim'],
          approximateAffectedPersonsCount: 1500,
          potentialConsequences: 'E-posta dolandırıcılığı riski',
          administrativeAndTechnicalMeasures: 'Sistem izole edildi, şifreler sıfırlandı, WAF kuralları sıkılaştırıldı'
        }
      });

      const parsed = JSON.parse(formJson);
      expect(parsed.dataController.organizationName).toBe('MegaTech A.Ş.');
      expect(parsed.mandatoryFields.field3_affectedCategories).toContain('Kimlik');
      expect(parsed.mandatoryFields.field4_affectedPersonsCount).toBe(1500);
      expect(parsed.legalBasis).toContain('KVKK Madde 12/5');
    });

    it('şirket içi ihlal kayıt defterine olayları belgeler', () => {
      const register = new InternalIncidentRegister();
      const incident = register.recordIncident({
        title: 'Yetkisiz port taraması',
        isReportable: false,
        justificationIfNotReported: 'Veri sızıntısı veya yetkisiz erişim gerçekleşmedi, firewall tarafından engellendi.'
      });

      expect(incident.isReportableToAuthority).toBe(false);
      expect(incident.justificationIfNotReported).toContain('firewall');
      expect(register.getIncidents().length).toBe(1);
    });

    it('Kurul 2019/10 formunun 6 zorunlu alanını ve gecikmiş (overdue) durumunu doğrular', () => {
      const incomplete = { incidentDate: '2026-10-01' };
      const val1 = BreachNotifier.validateKurulForm(incomplete);
      expect(val1.valid).toBe(false);
      expect(val1.missingFields.length).toBeGreaterThan(3);

      const past = Date.now() - 80 * 60 * 60 * 1000; // 80 saat önce (72 saat aşılmış)
      const overdueCountdown = BreachNotifier.calculateCountdown(past, Date.now());
      expect(overdueCountdown.isOverdue).toBe(true);
      expect(overdueCountdown.remainingHours).toBe(0);
      expect(overdueCountdown.overdueHours).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Coğrafi Yönlendirme ve Veri Yerleşimi (Geo Router - KVKK Md. 9 Reformu)', () => {
    it('TR içi yerel veri saklamasını onaylar (Data Residency)', () => {
      const decision = GeoRouter.evaluateTransfer({
        originCountry: 'TR',
        destinationCountry: 'TR'
      });
      expect(decision.allowed).toBe(true);
      expect(decision.targetRegion).toBe('TR_LOCAL');
    });

    it('Avrupa Birliği ve AEA üye ülkeleri arasındaki veri aktarımlarını Birlik içi (EU_LOCAL) kabul eder', () => {
      const countries = ['AT', 'PL', 'DK', 'SE', 'NO', 'NL', 'FR', 'ES', 'IT', 'FI'];
      for (const c of countries) {
        const decision = GeoRouter.evaluateTransfer({ originCountry: 'EU', destinationCountry: c });
        expect(decision.allowed).toBe(true);
        expect(decision.targetRegion).toBe('EU_LOCAL');
      }
    });

    it('uygun güvence olmadan TR dışına aktarımı yasaklar (KVKK Md. 9 ihlali)', () => {
      const decision = GeoRouter.evaluateTransfer({
        originCountry: 'TR',
        destinationCountry: 'US'
      });
      expect(decision.allowed).toBe(false);
      expect(decision.legalBasis).toBe('NONE');
    });

    it('Standart Sözleşme (SCC) ile aktarımı onaylar ve 5 iş günü Kurul bildirimini şart koşar', () => {
      const decision = GeoRouter.evaluateTransfer({
        originCountry: 'TR',
        destinationCountry: 'US',
        hasExecutedScc: true
      });
      expect(decision.allowed).toBe(true);
      expect(decision.legalBasis).toBe('STANDARD_CONTRACTUAL_CLAUSES');
      expect(decision.requiresKurulSccNotification).toBe(true);
      expect(decision.sccNotificationDeadlineBusinessDays).toBe(5);
    });
  });

  describe('HIPAA Emergency Break-Glass & Safe Harbor (45 CFR § 164.312 & § 164.402)', () => {
    it('geçersiz veya yetersiz gerekçede Break-Glass erişimini reddeder', () => {
      expect(() => {
        HipaaEmergencyService.activateBreakGlass({
          actorId: 'doc_1',
          patientId: 'pat_9',
          department: 'ICU',
          clinicalJustification: 'acil', // < 10 karakter
          emergencyType: 'CODE_BLUE'
        });
      }).toThrow('HIPAA_BREAK_GLASS_REJECTED');
    });

    it('geçerli klinik gerekçeyle Break-Glass oturumu açar, alarm üretir ve audit hash oluşturur', () => {
      const session = HipaaEmergencyService.activateBreakGlass({
        actorId: 'doc_42',
        patientId: 'pat_101',
        department: 'ER',
        clinicalJustification: 'Hasta bilinçsiz, anaflaktik şok şüphesiyle acil ilaç alerjisi kontrolü gerekiyor.',
        emergencyType: 'TRAUMA_STAT'
      });

      expect(session.sessionId).toContain('BG-');
      expect(session.alertDispatched).toBe(true);
      expect(session.auditHash).toBeDefined();
      expect(HipaaEmergencyService.isSessionActive(session)).toBe(true);

      // Bağımsız dışa aktarılan fonksiyon testi
      const session2 = activateBreakGlass({
        actorId: 'doc_43',
        patientId: 'pat_102',
        department: 'ICU',
        clinicalJustification: 'Hayati tehlike arz eden solunum arresti durumu.',
        emergencyType: 'CODE_BLUE'
      });
      expect(isSessionActive(session2)).toBe(true);
    });

    it('45 CFR § 164.402 Safe Harbor kriterlerini doğrular', () => {
      const safe = HipaaEmergencyService.evaluateSafeHarborStatus({
        isEncryptedAtRest: true,
        encryptionAlgorithm: 'AES-256',
        isKeyCompromised: false,
        isEncryptedInTransit: true
      });
      expect(safe.qualifiesForSafeHarbor).toBe(true);
      expect(safe.avoidsNotification).toBe(true);

      const unsafe = HipaaEmergencyService.evaluateSafeHarborStatus({
        isEncryptedAtRest: true,
        encryptionAlgorithm: 'AES-256',
        isKeyCompromised: true, // Anahtar ele geçirilmiş
        isEncryptedInTransit: true
      });
      expect(unsafe.qualifiesForSafeHarbor).toBe(false);
      expect(unsafe.avoidsNotification).toBe(false);
    });

    it('45 CFR § 164.408 hasta sayısı eşiklerine göre bildirim sürelerini hesaplar (<500 vs >=500)', () => {
      const small = HipaaEmergencyService.calculateBreachNotificationDeadline(200);
      expect(small.tier).toBe('<500');
      expect(small.requiresProminentMediaNotice).toBe(false);

      const large = HipaaEmergencyService.calculateBreachNotificationDeadline(1200);
      expect(large.tier).toBe('>=500');
      expect(large.requiresProminentMediaNotice).toBe(true);
      expect(large.individualNotificationDeadlineDays).toBe(60);

      expect(() => {
        HipaaEmergencyService.calculateBreachNotificationDeadline(-1);
      }).toThrow('HIPAA_INVALID_COUNT');
    });
  });

  describe('Zarf Şifreleme (Envelope Encryption - KVKK Md. 6)', () => {
    it('özel nitelikli veriyi DEK ve KEK ile şifreler ve geri çözer', async () => {
      const { encryptSensitivePayload, decryptSensitivePayload } = await import('../packages/primitives/src/index.js');
      const sensitiveMedicalRecord = 'Hasta Diyabet Tip-2 tanısı almıştır. İnsülin tedavisi başlandı.';
      const masterKey = 'Enterprise_KMS_Master_Key_Secret_2026';

      const envelope = encryptSensitivePayload(sensitiveMedicalRecord, masterKey);
      expect(envelope.algorithm).toBe('AES-256-GCM');
      expect(envelope.encryptedData).not.toBe(sensitiveMedicalRecord);
      expect(envelope.encryptedKey).toBeDefined();

      const decrypted = decryptSensitivePayload(envelope, masterKey);
      expect(decrypted).toBe(sensitiveMedicalRecord);
    });
  });

  describe('Veri Taşınabilirliği (Data Portability - GDPR Art. 20)', () => {
    it('parola ve gizli alanları süzer, bütünlük sağlama toplamı (checksum) ile paket üretir', async () => {
      const { generateDataPortabilityBundle } = await import('../packages/primitives/src/index.js');
      const user = {
        id: 'usr_abc',
        email: 'user@domain.com',
        name: 'Jane Doe',
        passwordHash: '$2b$10$hashedsecret...',
        apiKey: 'sk_live_12345'
      };

      const bundle = generateDataPortabilityBundle(user, {
        activityHistory: [{ event: 'ORDER_PLACED', orderId: 'ord_1' }],
        consentRecords: [{ type: 'TERMS', granted: true }]
      });

      expect(bundle.exportMetadata.legalBasis).toBe('GDPR_ARTICLE_20_DATA_PORTABILITY');
      expect(bundle.personalProfile.email).toBe('user@domain.com');
      expect(bundle.personalProfile.passwordHash).toBeUndefined(); // Şifre sızdırılmaz!
      expect(bundle.personalProfile.apiKey).toBeUndefined();
      expect(bundle.activityHistory.length).toBe(1);
      expect(bundle.integrityChecksum).toBeDefined();
    });
  });

  describe('HIPAA Otomatik Oturum Kapatma (45 CFR § 164.312)', () => {
    it('15 dakikalık hareketsizlikte oturumu zaman aşımına uğratır', async () => {
      const { isHipaaSessionExpired, createSessionTracker } = await import('../packages/primitives/src/index.js');
      const now = Date.now();
      const tenMinutesAgo = now - 10 * 60 * 1000;
      const sixteenMinutesAgo = now - 16 * 60 * 1000;

      expect(isHipaaSessionExpired(tenMinutesAgo, now)).toBe(false);
      expect(isHipaaSessionExpired(sixteenMinutesAgo, now)).toBe(true);

      const tracker = createSessionTracker(now);
      expect(tracker.isExpired(now + 14 * 60 * 1000)).toBe(false);
      expect(tracker.isExpired(now + 15 * 60 * 1000 + 100)).toBe(true);
    });
  });

  describe('EU AI Act İnsan Gözetimi (Article 14 & Article 86)', () => {
    it('düşük güven skorlu yapay zeka kararlarında insan eskalasyonu bayrağı açar', async () => {
      const { evaluateAiDecisionWithOversight } = await import('../packages/primitives/src/index.js');
      
      const lowConfidenceDecision = evaluateAiDecisionWithOversight({
        modelId: 'resume-screener-v1',
        inputPayload: { candidateId: 'c_123' },
        outputPayload: { score: 0.62 },
        confidenceScore: 0.62,
        threshold: 0.85
      });

      expect(lowConfidenceDecision.status).toBe('PENDING_HUMAN_REVIEW');
      expect(lowConfidenceDecision.requiresHumanReview).toBe(true);
      expect(lowConfidenceDecision.explanationUrl).toContain(lowConfidenceDecision.decisionId);

      const highConfidenceDecision = evaluateAiDecisionWithOversight({
        modelId: 'resume-screener-v1',
        inputPayload: { candidateId: 'c_456' },
        outputPayload: { score: 0.94 },
        confidenceScore: 0.94,
        threshold: 0.85
      });

      expect(highConfidenceDecision.status).toBe('AUTOMATED_APPROVED');
      expect(highConfidenceDecision.requiresHumanReview).toBe(false);
    });
  });

  describe('Resmi Mevzuat ve Kanun PDF Belgeleri Bütünlük Denetimi', () => {
    it('tüm 5 resmi mevzuat PDF dosyasının geçerli ve bozulmamış olduğunu doğrular', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const sourcesDir = path.resolve(__dirname, '../docs/regulations/sources');
      const expectedPdfs = [
        '6698-KVKK-Resmi-Metin.pdf',
        'GDPR-Regulation-2016-679-Official.pdf',
        'EAA-Directive-2019-882-Official.pdf',
        'EU-AI-Act-Regulation-2024-1689-Official.pdf',
        '45-CFR-Part-164-HIPAA-Security-Privacy.pdf'
      ];

      for (const pdf of expectedPdfs) {
        const fullPath = path.join(sourcesDir, pdf);
        expect(fs.existsSync(fullPath)).toBe(true);
        const stats = fs.statSync(fullPath);
        expect(stats.size).toBeGreaterThan(30000); // Gerçek PDF boyutu (HTML hata sayfası değil!)

        const fd = fs.openSync(fullPath, 'r');
        const buffer = Buffer.alloc(5);
        fs.readSync(fd, buffer, 0, 5, 0);
        fs.closeSync(fd);
        expect(buffer.toString('utf-8')).toBe('%PDF-'); // PDF magic bytes
      }
    });
  });

  describe('Almanya & AB Resim Proxy Güvenliği (LG München I & CJEU Breyer)', () => {
    it('harici resim URLlerini imzalı güvenli proxy URLine çevirir ve doğrular', async () => {
      const { createSecureAssetProxyUrl, verifyAssetProxySignature } = await import('../packages/primitives/src/index.js');
      const externalImage = 'https://images.unsplash.com/photo-user-avatar-123.jpg';

      const proxyUrl = createSecureAssetProxyUrl(externalImage, {
        proxyEndpoint: '/api/compliance/proxy-image',
        secretKey: 'test_secret_key'
      });

      expect(proxyUrl).toContain('/api/compliance/proxy-image?url=');
      expect(proxyUrl).toContain('&sig=');

      const urlObj = new URL('https://example.com' + proxyUrl);
      const extractedUrl = decodeURIComponent(urlObj.searchParams.get('url')!);
      const sig = urlObj.searchParams.get('sig')!;

      expect(extractedUrl).toBe(externalImage);
      expect(verifyAssetProxySignature(extractedUrl, sig, 'test_secret_key')).toBe(true);
      expect(verifyAssetProxySignature(extractedUrl, 'fake_invalid_sig', 'test_secret_key')).toBe(false);
    });

    it('SSRF denemelerinde yerel ve özel IP ağlarını engeller', async () => {
      const { createSecureAssetProxyUrl } = await import('../packages/primitives/src/index.js');
      expect(() => createSecureAssetProxyUrl('http://localhost:8080/admin/dump')).toThrow(/SSRF_BLOCKED/);
      expect(() => createSecureAssetProxyUrl('http://127.0.0.1/secret')).toThrow(/SSRF_BLOCKED/);
      expect(() => createSecureAssetProxyUrl('http://192.168.1.1/router-admin')).toThrow(/SSRF_BLOCKED/);
    });
  });
});

