import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getAllRules, renderMdcRule, renderAgentsMd, renderClaudeMd } from '@complirules/rules';

async function buildProPackage() {
  console.log('📦 Assembling CompliRules Pro Digital Distribution Package...');

  const rootDir = path.resolve('.');
  const proDistDir = path.join(rootDir, 'dist-pro');
  const bundleDir = path.join(proDistDir, 'complirules-pro');

  if (fs.existsSync(proDistDir)) {
    fs.rmSync(proDistDir, { recursive: true, force: true });
  }
  fs.mkdirSync(bundleDir, { recursive: true });

  // 1. Rules directory (.cursor/rules/*.mdc)
  const rulesDir = path.join(bundleDir, '.cursor', 'rules');
  fs.mkdirSync(rulesDir, { recursive: true });

  const allRules = getAllRules();
  for (const r of allRules) {
    const mdc = renderMdcRule(r);
    fs.writeFileSync(path.join(rulesDir, `${r.id}.mdc`), mdc, 'utf-8');
  }
  console.log(`  ✓ Bundled 28 AI Guardrail Rules into .cursor/rules/`);

  // 2. Universal Agent Instructions (AGENTS.md and CLAUDE.md)
  fs.writeFileSync(path.join(bundleDir, 'AGENTS.md'), renderAgentsMd(allRules), 'utf-8');
  fs.writeFileSync(path.join(bundleDir, 'CLAUDE.md'), renderClaudeMd(allRules), 'utf-8');
  console.log(`  ✓ Bundled AGENTS.md and CLAUDE.md for Claude Code, Windsurf, Copilot`);

  // 3. Enterprise Production Primitives
  const primitivesSrcDir = path.join(rootDir, 'packages', 'primitives', 'src');
  const primitivesDestDir = path.join(bundleDir, 'lib', 'compliance');
  fs.mkdirSync(primitivesDestDir, { recursive: true });

  const primitiveFiles = [
    'crypto-shredding.ts',
    'cookie-consent.ts',
    'envelope-encryption.ts',
    'dsr-engine.ts',
    'breach-notifier.ts',
    'geo-router.ts',
    'pii-scrubber.ts'
  ];

  for (const pFile of primitiveFiles) {
    const srcPath = path.join(primitivesSrcDir, pFile);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(primitivesDestDir, pFile));
    }
  }
  console.log(`  ✓ Bundled 7 Enterprise Primitives into lib/compliance/`);

  // 4. CI/CD GitHub Action Template
  const ciDir = path.join(bundleDir, '.github', 'workflows');
  fs.mkdirSync(ciDir, { recursive: true });
  const ciWorkflow = `name: Compliance & Security Guardrail
on: [push, pull_request]

jobs:
  compliance-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Run CompliRules Statutory Check
        run: |
          npx complirules check .
`;
  fs.writeFileSync(path.join(ciDir, 'compliance-guardrail.yml'), ciWorkflow, 'utf-8');
  console.log(`  ✓ Bundled CI/CD Workflow into .github/workflows/`);

  // 5. Professional Quickstart Guide
  const readmeContent = `# CompliRules Pro — The AI Legal & Security Guardrail

Thank you for purchasing **CompliRules Pro**!  
This package provides production-ready, deterministic constraints for AI coding agents (**Cursor, Claude Code, Windsurf, GitHub Copilot**) ensuring compliance with **GDPR, KVKK, EAA 2025, HIPAA, CCPA/CPRA, and the EU AI Act**.

---

## ⚡ 1-Minute Quickstart

### Step 1: Copy Rules into Your Project
Copy the following folders/files from this package into your project's root directory:
- \`.cursor/\` (Contains 28 curated MDC rules)
- \`AGENTS.md\` (Instructions for Windsurf, Copilot, Claude Code)
- \`CLAUDE.md\` (Instructions for Anthropic Claude Code)

### Step 2: Test Your AI Assistant
Open Cursor or Claude Code and prompt:
> *"Create a user registration form with newsletter subscription and terms acceptance."*

You will notice your AI agent automatically:
- Unchecks marketing checkboxes by default (Decoupled consent per KVKK / Planet49).
- Adds proper \`aria-label\` and keyboard focus attributes (EAA 2025 / WCAG 2.1 AA).
- Refrains from logging raw user objects or passwords (GDPR Art. 5 / CWE-532).

### Step 3: Use Ready-to-use Primitives (Optional)
The \`lib/compliance/\` directory contains drop-in TypeScript primitives:
- \`crypto-shredding.ts\`: Right-to-be-forgotten irreversible deletion.
- \`cookie-consent.ts\`: Categorized cookie consent banner state manager.
- \`envelope-encryption.ts\`: AES-256 envelope encryption for sensitive fields.
- \`dsr-engine.ts\`: Data Subject Access Request 30-day countdown & validation engine.

---

## 📄 License
CompliRules Pro Commercial Single-Developer / Single-Team License.  
You are licensed to use these rules across all your commercial and client projects. Redistribution or reselling of this rule pack is prohibited.
`;
  fs.writeFileSync(path.join(bundleDir, 'README.md'), readmeContent, 'utf-8');

  // 6. Zip archive creation using PowerShell Compress-Archive
  const zipPath = path.join(proDistDir, 'complirules-pro-v1.0.0.zip');
  try {
    execSync(`powershell.exe -NoProfile -Command "Compress-Archive -Path '${bundleDir}\\*' -DestinationPath '${zipPath}' -Force"`, {
      stdio: 'inherit'
    });
    console.log(`\n🎉 PRO Distribution Zip successfully compiled!`);
    console.log(`📦 Output File: ${zipPath}`);
  } catch (err) {
    console.error('Failed to create zip archive:', err);
  }
}

buildProPackage();
