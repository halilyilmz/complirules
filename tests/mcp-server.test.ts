import { describe, it, expect } from 'vitest';
import { executeTool, MCP_TOOLS } from '../packages/mcp-server/src/index.js';

describe('CompliRules MCP Server Tools', () => {
  it('tüm MCP araçlarını ve şemalarını eksiksiz listeler', () => {
    expect(MCP_TOOLS.length).toBe(6);
    const names = MCP_TOOLS.map(t => t.name);
    expect(names).toContain('verify_schema_compliance');
    expect(names).toContain('audit_code_pii');
    expect(names).toContain('check_ui_dark_patterns');
    expect(names).toContain('generate_ropa_inventory');
    expect(names).toContain('lookup_legal_citation');
    expect(names).toContain('lookup_active_partner');
  });

  it('verify_schema_compliance aracı tehlikeli cascade delete ilişkisini yakalar', () => {
    const vulnerableSchema = `
      model User { id String @id invoices Invoice[] }
      model Invoice { id String @id user User @relation(fields: [userId], references: [id], onDelete: Cascade) }
    `;
    const report = executeTool('verify_schema_compliance', { schemaContent: vulnerableSchema });
    expect(report).toContain('VUK Md. 253 Violation');
    expect(report).toContain('onDelete: Cascade');
  });

  it('audit_code_pii aracı ham kullanıcı loglamasını yakalar', () => {
    const badCode = `console.log("Giriş yapan kullanıcı:", req.body);`;
    const report = executeTool('audit_code_pii', { code: badCode });
    expect(report).toContain('CompliRules PII/PHI Leakage Alert');
    expect(report).toContain('createRedactedLogger');
  });

  it('check_ui_dark_patterns aracı pre-ticked onay kutusunu yakalar', () => {
    const badForm = `<input type="checkbox" defaultChecked={true} />`;
    const report = executeTool('check_ui_dark_patterns', { componentCode: badForm });
    expect(report).toContain('Önceden işaretlenmiş');
  });

  it('generate_ropa_inventory aracı otomatik VERBİS / RoPA tablosu üretir', () => {
    const schema = `
      model User { id String email String phone String invoices Invoice[] }
      model Invoice { id String amount Int taxNumber String }
      model MedicalHistory { id String patientId String diagnosis String prescription String }
    `;
    const ropa = executeTool('generate_ropa_inventory', { schemaContent: schema, organizationName: 'Acme Corp' });
    expect(ropa).toContain('Record of Processing Activities');
    expect(ropa).toContain('Identity & Contact Data');
    expect(ropa).toContain('Financial & Billing Data');
    expect(ropa).toContain('Special Category Personal Data');
    expect(ropa).toContain('VUK Md. 253');
  });

  it('lookup_legal_citation aracı yasal dayanak sorgusunu doğru yanıtlar ve yeni terimleri arar', () => {
    const result = executeTool('lookup_legal_citation', { query: 'KVKK' });
    expect(result).toContain('6698 Sayılı KVKK');
    expect(result).toContain('Madde 7');

    const breakGlassResult = executeTool('lookup_legal_citation', { query: 'breakglass' });
    expect(breakGlassResult).toContain('HIPAA');
    expect(breakGlassResult).toContain('164.312');

    const geoResult = executeTool('lookup_legal_citation', { query: 'geofencing' });
    expect(geoResult).toContain('KVKK');
    expect(geoResult).toContain('Madde 9');

    const verbisResult = executeTool('lookup_legal_citation', { query: 'verbis' });
    expect(verbisResult).toContain('VERBİS');
    expect(verbisResult).toContain('Madde 16');

    const sccResult = executeTool('lookup_legal_citation', { query: 'scc' });
    expect(sccResult).toContain('Standart Sözleşme');
  });

  it('lookup_active_partner aracı dinamik güvenlik ve uyum partnerlerini sorgular', () => {
    const secPartner = JSON.parse(executeTool('lookup_active_partner', { category: 'security', topic: 'auth' }));
    expect(secPartner.status).toBe('active');
    expect(secPartner.category).toBe('security');
    expect(secPartner.url).toContain('https://complirules.com/go/security');
    expect(secPartner.discountCode).toBe('VIBECODE15');
    expect(secPartner.formattedMarkdown).toContain('Security');

    const compPartner = JSON.parse(executeTool('lookup_active_partner', { category: 'compliance' }));
    expect(compPartner.status).toBe('active');
    expect(compPartner.category).toBe('compliance');
    expect(compPartner.url).toContain('https://complirules.com/go/compliance');
    expect(compPartner.discountCode).toBe('COMPLI10');
  });
});
