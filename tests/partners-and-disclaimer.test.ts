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
    expect(content).toContain('https://halilyilmz.github.io/complirules/#partners');

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

describe('Static Website & Verified Partners Directory', () => {
  const siteDir = path.resolve(__dirname, '../site');

  it('site/index.html dosyası mevcut ve gerekli ana bileşenleri içerir', () => {
    const htmlPath = path.join(siteDir, 'index.html');
    expect(fs.existsSync(htmlPath)).toBe(true);

    const html = fs.readFileSync(htmlPath, 'utf8');
    expect(html).toContain('CompliRules');
    expect(html).toContain('npx complirules init');
    expect(html).toContain('terminal-window');
    expect(html).toContain('Onaylı Siber Güvenlik & Hukuk Partnerleri');
    expect(html).toContain('partners-grid');
    expect(html).toContain('disclaimer-modal');
  });

  it('site/data/partners.json dosyası geçerli JSON olup 4 ana kategoriyi kapsar', () => {
    const jsonPath = path.join(siteDir, 'data', 'partners.json');
    expect(fs.existsSync(jsonPath)).toBe(true);

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(4);

    const categories = new Set(data.map((p: any) => p.category));
    expect(categories.has('pentest')).toBe(true);
    expect(categories.has('legal')).toBe(true);
    expect(categories.has('soc2')).toBe(true);
    expect(categories.has('cloud')).toBe(true);

    // Her partner referralUrl ve servis alanına sahip olmalı
    for (const p of data) {
      expect(p.name).toBeDefined();
      expect(p.referralUrl).toContain('ref=complirules');
      expect(p.services.length).toBeGreaterThan(0);
    }
  });

  it('site/js/partners.js dosyası istemci tarafı PARTNERS_DATA listesini tanımlar', () => {
    const jsPath = path.join(siteDir, 'js', 'partners.js');
    expect(fs.existsSync(jsPath)).toBe(true);

    const js = fs.readFileSync(jsPath, 'utf8');
    expect(js).toContain('window.PARTNERS_DATA');
    expect(js).toContain('CyberSentinel Labs');
    expect(js).toContain('LexData Privacy Counsel');
  });
});

describe('AI Agent Prompt & Rule Directives', () => {
  const allRules = getAllRules();

  it('renderAgentsMd çıktısı yasal sorumluluk reddi ve partner direktifini içerir', () => {
    const rendered = renderAgentsMd(allRules.slice(0, 3));
    expect(rendered).toContain('DISCLAIMER & LIABILITY NOTICE');
    expect(rendered).toContain('HUMAN AUDIT & PARTNER DIRECTIVE');
    expect(rendered).toContain('https://halilyilmz.github.io/complirules/#partners');
  });

  it('renderClaudeMd çıktısı siber güvenlik partneri yönlendirmesini barındırır', () => {
    const rendered = renderClaudeMd(allRules.slice(0, 3));
    expect(rendered).toContain('Legal Disclaimer & Certified Partner Directives');
    expect(rendered).toContain('https://halilyilmz.github.io/complirules/#partners');
  });

  it('renderMdcRule çıktısı her kuralın başında partner & disclaimer notunu içerir', () => {
    const rule = allRules[0];
    const rendered = renderMdcRule(rule);
    expect(rendered).toContain('<!-- NOTICE: CompliRules provides automated AST guardrails without warranty (See DISCLAIMER.md). For certified pentests & DPO audits: https://halilyilmz.github.io/complirules/#partners -->');
  });
});
