import { describe, it, expect } from 'vitest';
import { 
  getAllRules, 
  getRulePacks, 
  getRulesByJurisdiction, 
  renderMdcRule, 
  renderAgentsMd, 
  renderClaudeMd 
} from '../packages/rules/src/index.js';

describe('CompliRules Catalog & Rules Engine', () => {
  it('tüm kuralları eksiksiz yükler ve doğrular', () => {
    const rules = getAllRules();
    expect(rules.length).toBeGreaterThanOrEqual(12);

    for (const rule of rules) {
      expect(rule.id).toBeDefined();
      expect(rule.title).toBeDefined();
      expect(rule.jurisdiction).toBeDefined();
      expect(rule.legalCitations.length).toBeGreaterThan(0);
      expect(rule.instructions.length).toBeGreaterThan(0);
      expect(rule.forbiddenPatterns.length).toBeGreaterThan(0);
    }
  });

  it('Türkiye KVKK kurallarını doğru filtreler', () => {
    const trRules = getRulesByJurisdiction('KVKK_TR');
    expect(trRules.length).toBeGreaterThanOrEqual(6);
    const hasTombstone = trRules.some(r => r.id === 'kvkk-retention-tombstone');
    expect(hasTombstone).toBe(true);
    expect(trRules.some(r => r.id === 'kvkk-dsr-ticketing')).toBe(true);
    expect(trRules.some(r => r.id === 'kvkk-cookie-cmp')).toBe(true);
    expect(trRules.some(r => r.id === 'kvkk-transfer-geofencing')).toBe(true);
    expect(trRules.some(r => r.id === 'kvkk-breach-notification-72h')).toBe(true);
  });

  it('HIPAA Break-Glass acil durum kuralını yükler', () => {
    const usRules = getRulesByJurisdiction('HIPAA_US');
    expect(usRules.some(r => r.id === 'hipaa-breakglass-emergency')).toBe(true);
  });

  it('Cursor için geçerli .mdc içeriği üretir', () => {
    const rules = getAllRules();
    const mdc = renderMdcRule(rules[0]);
    expect(mdc).toContain('---');
    expect(mdc).toContain('globs:');
    expect(mdc).toContain('# [CompliRules]');
    expect(mdc).toContain('MUST:');
    expect(mdc).toContain('NEVER:');
  });

  it('Claude Code / Windsurf için birleşik AGENTS.md üretir', () => {
    const rules = getAllRules();
    const agentsMd = renderAgentsMd(rules);
    expect(agentsMd).toContain('# AGENTS.md — CompliRules');
    expect(agentsMd).toContain('KVKK');
    expect(agentsMd).toContain('GDPR');
  });

  it('CLAUDE.md üretir', () => {
    const rules = getAllRules();
    const claudeMd = renderClaudeMd(rules);
    expect(claudeMd).toContain('# CLAUDE.md — Regulatory Compliance Invariants');
  });

  it('ePrivacy, Schrems II TIA, BIPA ve çoklu yetki alanı çatışma kurallarını yükler', () => {
    const rules = getAllRules();
    expect(rules.some(r => r.id === 'gdpr-eprivacy-consent-decoupling')).toBe(true);
    expect(rules.some(r => r.id === 'schrems-ii-transfer-tia')).toBe(true);
    expect(rules.some(r => r.id === 'bipa-biometric-retention')).toBe(true);
    expect(rules.some(r => r.id === 'multi-jurisdiction-conflict-quarantine')).toBe(true);
  });
});
