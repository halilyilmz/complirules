import { LinterRule, LintViolation } from '../types.js';

export const enforceCryptoShreddingRule: LinterRule = {
  id: 'enforce-crypto-shredding',
  name: 'Finansal Verilerde Cascade Silme Yasağı & Kriptografik Anonimleştirme Zorunluluğu',
  lawCitation: '213 Sayılı VUK Md. 253 & 6698 Sayılı KVKK Md. 7',
  severity: 'CRITICAL',
  filePattern: /(\.prisma|schema\.ts|services\/.*user.*\.ts|api\/.*delete.*\.ts|\.py|\.go|\.php)$/i,
  check(filePath: string, content: string): LintViolation[] {
    const violations: LintViolation[] = [];
    const lines = content.split('\n');

    // 1. Prisma & TypeScript Şeması Kontrolü
    if (filePath.endsWith('.prisma') || filePath.endsWith('schema.ts')) {
      let currentModel = '';
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const modelMatch = line.trim().match(/^model\s+(\w+)/i);
        if (modelMatch) {
          currentModel = modelMatch[1];
        }

        const isFinancialModel = /(invoice|payment|order|tax|bill|transaction|fatura|odeme)/i.test(currentModel);
        if (/onDelete:\s*Cascade/i.test(line) && isFinancialModel) {
          violations.push({
            file: filePath,
            line: i + 1,
            column: 1,
            ruleId: this.id,
            severity: this.severity,
            message: `Finansal kayıt içeren \`${currentModel}\` modelinde \`onDelete: Cascade\` tespit edildi. Kullanıcı silindiğinde faturaların silinmesi Vergi Usul Kanunu ihlalidir.`,
            lawCitation: this.lawCitation,
            matchedSnippet: line.trim(),
            suggestedFix: 'onDelete: Cascade yerine `onDelete: SetNull` kullanın ve kullanıcıyı silmek yerine verilerini anonimleştirin (Tombstone).'
          });
        }
      }
    }

    // 2. Python / Django ORM Kontrolü (models.py)
    if (filePath.endsWith('.py')) {
      let currentClass = '';
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const classMatch = line.trim().match(/^class\s+(\w+)/i);
        if (classMatch) {
          currentClass = classMatch[1];
        }

        const isFinancialModel = /(invoice|payment|order|tax|bill|transaction|fatura|odeme)/i.test(currentClass);
        if (/on_delete\s*=\s*models\.CASCADE/i.test(line) && isFinancialModel) {
          violations.push({
            file: filePath,
            line: i + 1,
            column: 1,
            ruleId: this.id,
            severity: this.severity,
            message: `Django \`${currentClass}\` modelinde \`on_delete=models.CASCADE\` tespit edildi. Kullanıcı silindiğinde faturalar silinemez.`,
            lawCitation: this.lawCitation,
            matchedSnippet: line.trim(),
            suggestedFix: '`on_delete=models.SET_NULL, null=True` kullanın ve kullanıcı silme işleminde anonimleştirme uygulayın.'
          });
        }

        if (/user\.delete\s*\(\s*\)/i.test(line)) {
          violations.push({
            file: filePath,
            line: i + 1,
            column: 1,
            ruleId: this.id,
            severity: this.severity,
            message: 'Python kodunda kullanıcı kalıcı olarak siliniyor (Hard delete).',
            lawCitation: this.lawCitation,
            matchedSnippet: line.trim(),
            suggestedFix: 'user.delete() yerine kişisel alanları anonimleştirip kaydedin.'
          });
        }
      }
    }

    // 3. PHP / Laravel Migration Kontrolü
    if (filePath.endsWith('.php')) {
      const isFinancialContext = /(invoice|payment|order|fatura|odeme)/i.test(filePath + ' ' + content);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/cascadeOnDelete/i.test(line) && isFinancialContext) {
          violations.push({
            file: filePath,
            line: i + 1,
            column: 1,
            ruleId: this.id,
            severity: this.severity,
            message: 'Laravel migration dosyasında finansal kayıt için `cascadeOnDelete()` tespit edildi.',
            lawCitation: this.lawCitation,
            matchedSnippet: line.trim(),
            suggestedFix: 'cascadeOnDelete() yerine `nullOnDelete()` kullanın.'
          });
        }
      }
    }

    // 4. Go / GORM Kontrolü
    if (filePath.endsWith('.go')) {
      let currentStruct = '';
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const structMatch = line.trim().match(/^type\s+(\w+)\s+struct/i);
        if (structMatch) currentStruct = structMatch[1];

        const isFinancial = /(invoice|payment|order|fatura|odeme)/i.test(currentStruct);
        if (/OnDelete:CASCADE/i.test(line) && isFinancial) {
          violations.push({
            file: filePath,
            line: i + 1,
            column: 1,
            ruleId: this.id,
            severity: this.severity,
            message: `Go GORM \`${currentStruct}\` struct'ında OnDelete:CASCADE tespit edildi.`,
            lawCitation: this.lawCitation,
            matchedSnippet: line.trim(),
            suggestedFix: '`constraint:OnDelete:SET NULL;` kullanın.'
          });
        }
      }
    }

    // 5. Kod içinde doğrudan prisma.user.delete çağrısı
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/prisma\.(user|customer|patient)\.delete\s*\(/i.test(line)) {
        violations.push({
          file: filePath,
          line: i + 1,
          column: 1,
          ruleId: this.id,
          severity: this.severity,
          message: 'Kullanıcı doğrudan DB seviyesinde kalıcı olarak siliniyor (Hard delete). İlişkili yasal kayıtlar kaybolabilir.',
          lawCitation: this.lawCitation,
          matchedSnippet: line.trim(),
          suggestedFix: 'prisma.user.delete() yerine shredPersonalData() ve update() ile kişisel verileri anonimleştirin.'
        });
      }
    }

    return violations;
  }
};
