import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { detectProjectStack } from '../packages/cli/src/detectors/stack-detector.js';
import { scanFile } from '../packages/linter/src/index.js';

describe('Multi-Language & Multi-Framework Support', () => {
  const tempDir = path.resolve(__dirname, '../temp_multi_lang_test');

  beforeEach(() => {
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Farklı Dillerin ve Frameworklerin Tespiti (Stack Detector)', () => {
    it('Python / Django projesini doğru tespit eder', () => {
      fs.writeFileSync(path.join(tempDir, 'manage.py'), '# Django entry point');
      fs.writeFileSync(path.join(tempDir, 'requirements.txt'), 'django>=5.0\npsycopg2>=2.9');

      const stack = detectProjectStack(tempDir);
      expect(stack.language).toBe('python');
      expect(stack.framework).toBe('django');
      expect(stack.orm).toBe('django-orm');
    });

    it('Python / FastAPI projesini doğru tespit eder', () => {
      fs.writeFileSync(path.join(tempDir, 'requirements.txt'), 'fastapi>=0.110.0\nuvicorn\nsqlalchemy');

      const stack = detectProjectStack(tempDir);
      expect(stack.language).toBe('python');
      expect(stack.framework).toBe('fastapi');
      expect(stack.orm).toBe('sqlalchemy');
    });

    it('Go / Gin projesini doğru tespit eder', () => {
      fs.writeFileSync(path.join(tempDir, 'go.mod'), 'module myapp\n\ngo 1.22\n\nrequire (\n\tgithub.com/gin-gonic/gin v1.9.1\n\tgorm.io/gorm v1.25.7\n)');

      const stack = detectProjectStack(tempDir);
      expect(stack.language).toBe('go');
      expect(stack.framework).toBe('gin');
      expect(stack.orm).toBe('gorm');
    });

    it('PHP / Laravel projesini doğru tespit eder', () => {
      fs.writeFileSync(path.join(tempDir, 'artisan'), '#!/usr/bin/env php');
      fs.writeFileSync(path.join(tempDir, 'composer.json'), JSON.stringify({
        require: {
          'laravel/framework': '^11.0'
        }
      }));

      const stack = detectProjectStack(tempDir);
      expect(stack.language).toBe('php');
      expect(stack.framework).toBe('laravel');
      expect(stack.orm).toBe('eloquent');
    });
  });

  describe('Farklı Dillerde Statik Kod Denetimi (Linter Multi-Language)', () => {
    it('Python / Django kodundaki CASCADE ve PII loglama ihlallerini yakalar', () => {
      const pythonFile = path.join(tempDir, 'models.py');
      fs.writeFileSync(pythonFile, `
from django.db import models

class Invoice(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE) # İHLAL: VUK Md. 253

def delete_user(request):
    print("User request:", request.body) # İHLAL: Ham PII loglama
`);

      const violations = scanFile(pythonFile);
      expect(violations.length).toBe(2);

      const ruleIds = violations.map(v => v.ruleId);
      expect(ruleIds).toContain('enforce-crypto-shredding');
      expect(ruleIds).toContain('no-unredacted-logs');
    });

    it('Go / GORM kodundaki OnDelete:CASCADE ve PII loglama ihlalini yakalar', () => {
      const goFile = path.join(tempDir, 'invoice_model.go');
      fs.writeFileSync(goFile, `
package models

type Invoice struct {
    ID int
    User User \`gorm:"constraint:OnDelete:CASCADE;"\` // İHLAL
}

func LogHandler(user User) {
    log.Printf("User: %+v", user) // İHLAL: PII loglama
}
`);

      const violations = scanFile(goFile);
      expect(violations.length).toBe(2);
      const ruleIds = violations.map(v => v.ruleId);
      expect(ruleIds).toContain('enforce-crypto-shredding');
      expect(ruleIds).toContain('no-unredacted-logs');
    });

    it('PHP / Laravel migration dosyasındaki cascadeOnDelete ve Log::$request ihlalini yakalar', () => {
      const phpFile = path.join(tempDir, 'create_invoices_migration.php');
      fs.writeFileSync(phpFile, `
<?php
Schema::create('invoices', function (Blueprint $table) {
    $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // İHLAL
});

Log::info($request->all()); // İHLAL: PII loglama
`);

      const violations = scanFile(phpFile);
      expect(violations.length).toBe(2);
      const ruleIds = violations.map(v => v.ruleId);
      expect(ruleIds).toContain('enforce-crypto-shredding');
      expect(ruleIds).toContain('no-unredacted-logs');
    });
  });
});
