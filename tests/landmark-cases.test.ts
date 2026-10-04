import { describe, it, expect } from 'vitest';
import {
  createTwoClickEmbed,
  activateTwoClickEmbed,
  detectEmbedProvider,
  validateBulkEmailOptions,
  buildSafeBulkEnvelopes,
  stripTrackingBeacons,
  isTrackingBeaconPresent,
  isSensitiveRoute,
  shouldBlockCommercialTracking,
  evaluateGpcSignal,
  applyGpcToPreferences,
  assertOtpEffectsAreSeparated,
  buildOtpSmsText,
  RateLimitShield,
  CookieConsentManager
} from '../packages/primitives/src/index.js';
import {
  noDirectExternalEmbedsRule,
  noUngatedRecaptchaRule,
  noPixelOnSensitiveRoutesRule,
  enforceBccBulkEmailRule,
  noBundledOtpMarketingRule,
  enforceGpcOptoutRule,
  BUILT_IN_RULES
} from '../packages/linter/src/index.js';
import { getAllRules, getRuleById, getRulesByJurisdiction, resolveRulesFromQuery } from '../packages/rules/src/index.js';

describe('Landmark case primitives', () => {
  describe('two-click embed (CJEU Fashion ID / DSK)', () => {
    it('tanınan sağlayıcıyı bulur', () => {
      expect(detectEmbedProvider('https://www.youtube-nocookie.com/embed/abc')).toBe('youtube');
      expect(detectEmbedProvider('https://player.vimeo.com/video/1')).toBe('vimeo');
      expect(detectEmbedProvider('https://evil.example.com/x')).toBeNull();
      expect(detectEmbedProvider('not a url')).toBeNull();
    });

    it('render anında harici istek atmaz ve etkinleştirme gerektirir', () => {
      const embed = createTwoClickEmbed('https://www.youtube-nocookie.com/embed/abc', {
        localThumbnailPath: '/thumbs/abc.webp'
      });
      expect(embed.externalRequestsOnRender).toBe(0);
      expect(embed.requiresUserActivation).toBe(true);
      expect(() => activateTwoClickEmbed(embed, false)).toThrow(/CONSENT_REQUIRED/);
      const attrs = activateTwoClickEmbed(embed, true);
      expect(attrs.referrerPolicy).toBe('no-referrer');
      expect(attrs.src).toContain('youtube-nocookie.com');
    });

    it('harici önizleme, http ve bilinmeyen sağlayıcıyı reddeder', () => {
      expect(() =>
        createTwoClickEmbed('https://www.youtube.com/embed/abc', { localThumbnailPath: 'https://i.ytimg.com/a.jpg' })
      ).toThrow(/EXTERNAL_THUMBNAIL_FORBIDDEN/);
      expect(() =>
        createTwoClickEmbed('//www.youtube.com/embed/abc', { localThumbnailPath: '/a.webp' })
      ).toThrow(/INVALID_EMBED_URL/);
      expect(() =>
        createTwoClickEmbed('http://www.youtube.com/embed/abc', { localThumbnailPath: '/a.webp' })
      ).toThrow(/INSECURE_EMBED_URL/);
      expect(() =>
        createTwoClickEmbed('https://tracker.example.com/embed', { localThumbnailPath: '/a.webp' })
      ).toThrow(/UNKNOWN_EMBED_PROVIDER/);
    });
  });

  describe('email safety (KVKK Md. 12 / ePrivacy)', () => {
    it('çoklu to/cc alıcısını ihlal sayar, bcc ve tekil alıcıyı kabul eder', () => {
      expect(validateBulkEmailOptions({ to: ['a@x.com', 'b@x.com'] }).compliant).toBe(false);
      expect(validateBulkEmailOptions({ to: 'a@x.com, b@x.com' }).compliant).toBe(false);
      expect(validateBulkEmailOptions({ to: 'a@x.com', cc: ['b@x.com', 'c@x.com'] }).compliant).toBe(false);
      expect(validateBulkEmailOptions({ to: 'a@x.com' }).compliant).toBe(true);
      expect(validateBulkEmailOptions({ to: 'noreply@x.com', bcc: ['a@x.com', 'b@x.com'] }).compliant).toBe(true);
    });

    it('alıcı başına tekil zarf üretir ve yinelenenleri eler', () => {
      const envelopes = buildSafeBulkEnvelopes(['A@x.com', 'a@x.com', 'b@x.com'], { subject: 'Merhaba' });
      expect(envelopes).toHaveLength(2);
      for (const e of envelopes) {
        expect(validateBulkEmailOptions(e as { to: string }).compliant).toBe(true);
        expect(e.subject).toBe('Merhaba');
      }
    });

    it('1x1 takip piksellerini tespit eder ve temizler, içerik görsellerine dokunmaz', () => {
      const html =
        '<p>Merhaba</p><img src="https://track.example.com/open?uid=1" width="1" height="1" />' +
        '<img src="https://cdn.example.com/p.gif" style="display:none" />' +
        '<img src="/logo.png" width="120" height="40" alt="Logo" />';
      expect(isTrackingBeaconPresent(html)).toBe(true);
      const cleaned = stripTrackingBeacons(html);
      expect(cleaned).not.toContain('track.example.com');
      expect(cleaned).toContain('/logo.png');
      expect(isTrackingBeaconPresent(cleaned)).toBe(false);
    });
  });

  describe('sensitive route guard (FTC GoodRx / BetterHelp)', () => {
    it('hassas rotaları tanır', () => {
      expect(isSensitiveRoute('/health/conditions/depression')).toBe(true);
      expect(isSensitiveRoute('/therapy/start?x=1')).toBe(true);
      expect(isSensitiveRoute('/checkout')).toBe(true);
      expect(isSensitiveRoute('/blog/hello')).toBe(false);
      expect(isSensitiveRoute('/checkout', ['health'])).toBe(false);
    });

    it('hassas rotada ticari izleyiciyi engeller, diğerinde izin verir', () => {
      expect(shouldBlockCommercialTracking('/rx/lisinopril', 'Meta Pixel').blocked).toBe(true);
      expect(shouldBlockCommercialTracking('/blog/post', 'meta-pixel').blocked).toBe(false);
      expect(shouldBlockCommercialTracking('/rx/lisinopril', 'self-hosted-aggregate').blocked).toBe(false);
    });
  });

  describe('GPC (CCPA/CPRA § 7025)', () => {
    it('Sec-GPC: 1 başlığını büyük/küçük harf bağımsız okur', () => {
      expect(evaluateGpcSignal({ 'Sec-GPC': '1' }).optOutActive).toBe(true);
      expect(evaluateGpcSignal({ 'sec-gpc': '1' }).source).toBe('header');
      expect(evaluateGpcSignal({ 'sec-gpc': '0' }).optOutActive).toBe(false);
      expect(evaluateGpcSignal({}).source).toBe('none');
    });

    it('Headers nesnesini ve istemci sinyalini destekler', () => {
      const headers = new Headers({ 'Sec-GPC': '1' });
      expect(evaluateGpcSignal(headers, { clientGpc: true }).source).toBe('both');
      expect(evaluateGpcSignal(undefined, { clientGpc: true }).source).toBe('client');
    });

    it('oturum açmış kullanıcı için profil kaydı önerir ve marketing rızasını kapatır', () => {
      const evaluation = evaluateGpcSignal({ 'sec-gpc': '1' }, { isAuthenticated: true });
      expect(evaluation.shouldPersistToProfile).toBe(true);
      expect(evaluateGpcSignal({ 'sec-gpc': '1' }).shouldPersistToProfile).toBe(false);

      const prefs = applyGpcToPreferences(CookieConsentManager.createAcceptAllPreferences(), evaluation);
      expect(prefs.marketing).toBe(false);
      expect(prefs.analytics).toBe(true);
    });
  });

  describe('OTP / rıza ayrıştırma (KVKK 2025/1072)', () => {
    it('OTP etkilerinde rıza alanlarını reddeder', () => {
      expect(() => assertOtpEffectsAreSeparated({ phoneVerified: true })).not.toThrow();
      expect(() => assertOtpEffectsAreSeparated({ phoneVerified: true, marketingConsent: true })).toThrow(/OTP_CONSENT_BUNDLING/);
      expect(() => assertOtpEffectsAreSeparated({ etkConsent: false })).toThrow(/OTP_CONSENT_BUNDLING/);
    });

    it('SMS metni amacı belirtir ve pazarlama izni ima etmez', () => {
      const sms = buildOtpSmsText('payment', '123456', 'Marka');
      expect(sms).toContain('123456');
      expect(sms).toContain('ödeme onayı');
      expect(sms).toContain('pazarlama');
    });
  });

  describe('RateLimitShield (KVKK Md. 12)', () => {
    it('eşik aşılınca kilitler, MFA ister ve süre sonunda açar', () => {
      const shield = new RateLimitShield({ maxAttempts: 3, windowMs: 1000, lockoutMs: 5000 });
      const t0 = 1_000_000;
      expect(shield.check('acct:a', t0).allowed).toBe(true);
      shield.recordFailure('acct:a', t0);
      shield.recordFailure('acct:a', t0 + 10);
      const locked = shield.recordFailure('acct:a', t0 + 20);
      expect(locked.allowed).toBe(false);
      expect(locked.requireMfa).toBe(true);
      expect(shield.check('acct:a', t0 + 100).allowed).toBe(false);
      expect(shield.check('acct:a', t0 + 6000).allowed).toBe(true);
    });

    it('pencere dışındaki hataları saymaz ve başarıda sıfırlar', () => {
      const shield = new RateLimitShield({ maxAttempts: 3, windowMs: 1000, lockoutMs: 5000 });
      shield.recordFailure('k', 0);
      shield.recordFailure('k', 10);
      expect(shield.check('k', 5000).remaining).toBe(3);
      shield.recordFailure('k', 5000);
      shield.recordSuccess('k');
      expect(shield.check('k', 5001).remaining).toBe(3);
    });
  });
});

describe('Landmark case linter rules', () => {
  const run = (rule: { check: (f: string, c: string) => unknown[] }, file: string, code: string) =>
    rule.check(file, code);

  it('tüm yeni kurallar tarayıcıya kayıtlıdır', () => {
    const ids = BUILT_IN_RULES.map(r => r.id);
    for (const id of [
      'no-direct-external-embeds',
      'no-ungated-recaptcha',
      'no-pixel-on-sensitive-routes',
      'enforce-bcc-bulk-email',
      'no-bundled-otp-marketing',
      'enforce-gpc-optout'
    ]) {
      expect(ids).toContain(id);
    }
  });

  describe('no-direct-external-embeds', () => {
    it('doğrudan YouTube/Maps iframe ve sosyal SDK scriptini yakalar (çok satırlı dahil)', () => {
      const code = `
        <iframe
          width="560"
          src="https://www.youtube-nocookie.com/embed/abc"></iframe>
        <iframe src="https://www.google.com/maps/embed?pb=1"></iframe>
        <script async src="https://connect.facebook.net/tr_TR/sdk.js"></script>
      `;
      expect(run(noDirectExternalEmbedsRule, 'components/Video.tsx', code)).toHaveLength(3);
    });

    it('iki tıklamalı çözümle sarılmış embed\'i kabul eder', () => {
      const code = `
        const attrs = activateTwoClickEmbed(embed, true);
        return <iframe src="https://www.youtube.com/embed/abc" />;
      `;
      expect(run(noDirectExternalEmbedsRule, 'components/Video.tsx', code)).toHaveLength(0);
    });
  });

  describe('no-ungated-recaptcha', () => {
    it('rızasız reCAPTCHA yüklemesini yakalar, rıza kapılı olanı geçirir', () => {
      expect(run(noUngatedRecaptchaRule, 'login.html', '<script src="https://www.google.com/recaptcha/api.js"></script>')).toHaveLength(1);
      expect(run(noUngatedRecaptchaRule, 'Form.tsx', '<div className="g-recaptcha" data-sitekey="x" />')).toHaveLength(1);
      expect(
        run(noUngatedRecaptchaRule, 'Form.tsx', 'if (hasConsent) {\n  load("https://www.google.com/recaptcha/api.js");\n}')
      ).toHaveLength(0);
    });
  });

  describe('no-pixel-on-sensitive-routes', () => {
    it('hassas dizindeki piksel çağrılarını yakalar', () => {
      const code = `useEffect(() => { window.fbq('track', 'ViewContent', { content_name: condition }); }, []);`;
      const hits = run(noPixelOnSensitiveRoutesRule, 'app/therapy/page.tsx', code) as { severity: string }[];
      expect(hits).toHaveLength(1);
      expect(hits[0].severity).toBe('CRITICAL');
      expect(run(noPixelOnSensitiveRoutesRule, 'app/checkout/Pay.tsx', 'ttq.track("Checkout")')).toHaveLength(1);
    });

    it('hassas olmayan dosyada veya izleyicisiz hassas dosyada ihlal üretmez', () => {
      expect(run(noPixelOnSensitiveRoutesRule, 'app/blog/page.tsx', "fbq('track','PageView')")).toHaveLength(0);
      expect(run(noPixelOnSensitiveRoutesRule, 'app/therapy/page.tsx', 'return <h1>Terapi</h1>;')).toHaveLength(0);
    });
  });

  describe('enforce-bcc-bulk-email', () => {
    it('to/cc içindeki dizi ve join çağrılarını yakalar', () => {
      const code = `
        await transporter.sendMail({
          from: 'duyuru@sirket.com',
          to: ['user1@mail.com', 'user2@mail.com'],
          subject: 'Duyuru'
        });
        await transporter.sendMail({ to: recipients.join(','), subject: 'x' });
      `;
      expect(run(enforceBccBulkEmailRule, 'mailer.ts', code)).toHaveLength(2);
    });

    it('Python toplu To birleştirmesini yakalar', () => {
      const code = `import smtplib\nmsg['To'] = ', '.join(recipients)\nserver.send_message(msg)`;
      expect(run(enforceBccBulkEmailRule, 'notify.py', code)).toHaveLength(1);
    });

    it('tekil to ve bcc kullanımını kabul eder; posta bağlamı yoksa dokunmaz', () => {
      const safe = `await transporter.sendMail({ to: 'a@x.com', bcc: ['b@x.com', 'c@x.com'] });`;
      expect(run(enforceBccBulkEmailRule, 'mailer.ts', safe)).toHaveLength(0);
      expect(run(enforceBccBulkEmailRule, 'data.ts', `const cfg = { to: ['a', 'b'] };`)).toHaveLength(0);
    });
  });

  describe('no-bundled-otp-marketing', () => {
    it('OTP doğrulamasında rıza alanını true yapan akışı yakalar', () => {
      const code = `
        app.post('/api/auth/verify-otp', async (req, res) => {
          if (await verifyCode(userId, code)) {
            await db.user.update({ where: { id: userId }, data: { phoneVerified: true, marketingConsent: true } });
          }
        });
      `;
      expect(run(noBundledOtpMarketingRule, 'api/verify.ts', code)).toHaveLength(1);
    });

    it('OTP dışındaki rıza atamasını ve ayrık akışı yakalamaz', () => {
      const separate = `await db.user.update({ data: { phoneVerified: true } });`;
      expect(run(noBundledOtpMarketingRule, 'api/verify.ts', separate)).toHaveLength(0);
      const unrelated = `const settings = { marketingConsent: true };`;
      expect(run(noBundledOtpMarketingRule, 'seed.ts', unrelated)).toHaveLength(0);
    });
  });

  describe('enforce-gpc-optout', () => {
    it('GPC denetimi olmadan reklam yükleyicisini yakalar', () => {
      const code = `if (getCookie('consent') !== 'false') { loadAdTrackers(); }`;
      expect(run(enforceGpcOptoutRule, 'lib/ads.ts', code)).toHaveLength(1);
    });

    it('GPC denetimi olan dosyayı geçirir', () => {
      const code = `const gpc = evaluateGpcSignal(headers);\nif (!gpc.optOutActive) { loadAdTrackers(); }`;
      expect(run(enforceGpcOptoutRule, 'lib/ads.ts', code)).toHaveLength(0);
    });
  });
});

describe('Landmark case rule catalog', () => {
  const NEW_RULE_IDS = [
    'gdpr-two-click-embed',
    'gdpr-privacy-preserving-captcha',
    'kvkk-email-bcc-safety',
    'kvkk-otp-marketing-decoupling',
    'hipaa-ftc-sensitive-route-pixel',
    'ccpa-gpc-automated-optout',
    'sec-auth-rate-limit-mfa'
  ];

  it('yeni kuralların hepsi eksiksiz alanlarla kayıtlıdır', () => {
    for (const id of NEW_RULE_IDS) {
      const rule = getRuleById(id);
      expect(rule, id).toBeDefined();
      expect(rule!.legalCitations.length).toBeGreaterThan(0);
      expect(rule!.instructions.length).toBeGreaterThan(0);
      expect(rule!.forbiddenPatterns.length).toBeGreaterThan(0);
      expect(rule!.compliantCodeSnippets.length).toBeGreaterThan(0);
    }
    expect(getAllRules().length).toBeGreaterThanOrEqual(20);
    expect(new Set(getAllRules().map(r => r.id)).size).toBe(getAllRules().length);
  });

  it('yargı alanı çözümlemesi yeni kuralları döndürür', () => {
    expect(getRulesByJurisdiction('KVKK_TR').some(r => r.id === 'kvkk-otp-marketing-decoupling')).toBe(true);
    expect(getRulesByJurisdiction('CCPA_US').some(r => r.id === 'ccpa-gpc-automated-optout')).toBe(true);
    expect(resolveRulesFromQuery('ccpa').some(r => r.id === 'ccpa-gpc-automated-optout')).toBe(true);
    expect(resolveRulesFromQuery('us-privacy-compliance').length).toBeGreaterThan(0);
  });

  it('doğrulanamayan karar numaraları yerine yalnızca doğrulanmış atıflar kullanılır', () => {
    const text = JSON.stringify(getAllRules());
    expect(text).toContain('2025/1072');
    expect(text).toContain('SAN-2023-003');
    expect(text).not.toContain('2019/331');
    expect(text).not.toContain('2021/898');
  });
});
