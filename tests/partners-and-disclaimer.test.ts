import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { 
  renderAgentsMd, 
  renderClaudeMd, 
  renderMdcRule, 
  getAllRules 
} from '../packages/rules/src/index.js';

describe('Legal Disclaimer & Zero Liability Invariants', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('DISCLAIMER.md dosyası kök dizinde mevcut ve çift dilli (TR/EN) yasal şartları barındırır', () => {
    const disclaimerPath = path.join(rootDir, 'DISCLAIMER.md');
    expect(fs.existsSync(disclaimerPath)).toBe(true);

    const content = fs.readFileSync(disclaimerPath, 'utf8');
    // Türkçe şartlar
    expect(content).toContain('Yasal Sorumluluk Reddi');
    expect(content).toContain('Hukuki ve Güvenlik Danışmanlığı Niteliğinde Değildir');
    expect(content).toContain('Sıfır Sorumluluk İlkesi');
    expect(content).toContain('6698 sayılı KVKK');
    expect(content).toContain('https://halilyilmz.github.io/complirules/');

    // İngilizce şartlar
    expect(content).toContain('Statutory Legal Disclaimer & Waiver');
    expect(content).toContain('AS IS');
    expect(content).toContain('Limitation of Liability & Absolute Waiver');
  });

  it('LICENSE dosyası AS-IS şartını ve Regülasyon Ekini barındırır', () => {
    const licensePath = path.join(rootDir, 'LICENSE');
    expect(fs.existsSync(licensePath)).toBe(true);

    const content = fs.readFileSync(licensePath, 'utf8');
    expect(content).toContain('MIT License');
    expect(content).toContain('WITHOUT WARRANTY OF ANY KIND');
    expect(content).toContain('IMPORTANT REGULATORY & COMPLIANCE ADDENDUM');
    expect(content).toContain('ZERO LIABILITY FOR FINES & BREACHES');
  });
});

describe('Static Informative Website & 24 Rules Explorer', () => {
  const siteDir = path.resolve(__dirname, '../site');

  it('site/index.html dosyası mevcut ve gerekli ana bileşenleri içerir', () => {
    const htmlPath = path.join(siteDir, 'index.html');
    expect(fs.existsSync(htmlPath)).toBe(true);

    const html = fs.readFileSync(htmlPath, 'utf8');
    expect(html).toContain('CompliRules');
    expect(html).toContain('npx complirules init');
    expect(html).toContain('terminal-window');
    expect(html).toContain('24 Kural & Mevzuat');
    expect(html).toContain('rules-grid');
    expect(html).toContain('disclaimer-modal');
  });

  it('site/js/rules-data.js dosyası 24 kuralı ve tüm yargı alanlarını kapsar', () => {
    const jsPath = path.join(siteDir, 'js', 'rules-data.js');
    expect(fs.existsSync(jsPath)).toBe(true);

    const js = fs.readFileSync(jsPath, 'utf8');
    expect(js).toContain('window.RULES_DATA');
    expect(js).toContain('kvkk-retention-tombstone');
    expect(js).toContain('gdpr-right-to-be-forgotten');
    expect(js).toContain('hipaa-phi-technical-safeguards');
    expect(js).toContain('bipa-biometric-retention');
  });
});

describe('AI Agent Prompt & Rule Directives', () => {
  const allRules = getAllRules();

  it('renderAgentsMd çıktısı yasal sorumluluk reddi ve insan doğrulama direktifini içerir', () => {
    const rendered = renderAgentsMd(allRules.slice(0, 3));
    expect(rendered).toContain('DISCLAIMER & LIABILITY NOTICE');
    expect(rendered).toContain('HUMAN VERIFICATION DIRECTIVE');
    expect(rendered).toContain('https://halilyilmz.github.io/complirules/');
  });

  it('renderClaudeMd çıktısı dokümantasyon ve yasal uyarı yönlendirmesini barındırır', () => {
    const rendered = renderClaudeMd(allRules.slice(0, 3));
    expect(rendered).toContain('Legal Disclaimer & Human Verification Directives');
    expect(rendered).toContain('https://halilyilmz.github.io/complirules/');
  });

  it('renderMdcRule çıktısı her kuralın başında dokümantasyon & disclaimer notunu içerir', () => {
    const rule = allRules[0];
    const rendered = renderMdcRule(rule);
    expect(rendered).toContain('<!-- NOTICE: CompliRules provides automated AST guardrails under MIT License without warranty (See DISCLAIMER.md). Documentation: https://halilyilmz.github.io/complirules/ -->');
  });
});
