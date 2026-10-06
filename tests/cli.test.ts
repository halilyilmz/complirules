import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { executeInit } from '../packages/cli/src/commands/init.js';
import { detectProjectStack } from '../packages/cli/src/detectors/stack-detector.js';

describe('CompliRules CLI Commands', () => {
  const tempProjectDir = path.resolve(__dirname, '../temp_test_project');

  beforeEach(() => {
    fs.mkdirSync(tempProjectDir, { recursive: true });
    fs.writeFileSync(
      path.join(tempProjectDir, 'package.json'),
      JSON.stringify({
        name: 'test-app',
        dependencies: {
          next: '^15.0.0',
          '@prisma/client': '^6.0.0'
        }
      }, null, 2)
    );
  });

  afterEach(() => {
    if (fs.existsSync(tempProjectDir)) {
      fs.rmSync(tempProjectDir, { recursive: true, force: true });
    }
  });

  it('projedeki Next.js ve Prisma yığınını doğru tespit eder', () => {
    const stack = detectProjectStack(tempProjectDir);
    expect(stack.framework).toBe('nextjs');
    expect(stack.orm).toBe('prisma');
  });

  it('complirules init komutu Cursor MDC, AGENTS.md, CLAUDE.md ve MCP dosyalarını üretir', () => {
    executeInit(tempProjectDir, { all: true });

    // .cursor/rules/*.mdc kontrolü
    const cursorRulesDir = path.join(tempProjectDir, '.cursor', 'rules');
    expect(fs.existsSync(cursorRulesDir)).toBe(true);
    const mdcFiles = fs.readdirSync(cursorRulesDir);
    expect(mdcFiles.length).toBeGreaterThanOrEqual(5);
    expect(mdcFiles.some(f => f.includes('kvkk'))).toBe(true);

    // AGENTS.md kontrolü
    const agentsMdPath = path.join(tempProjectDir, 'AGENTS.md');
    expect(fs.existsSync(agentsMdPath)).toBe(true);
    const agentsContent = fs.readFileSync(agentsMdPath, 'utf-8');
    expect(agentsContent).toContain('# AGENTS.md — CompliRules');

    // CLAUDE.md kontrolü
    const claudeMdPath = path.join(tempProjectDir, 'CLAUDE.md');
    expect(fs.existsSync(claudeMdPath)).toBe(true);

    // .cursor/mcp.json kontrolü
    const mcpJsonPath = path.join(tempProjectDir, '.cursor', 'mcp.json');
    expect(fs.existsSync(mcpJsonPath)).toBe(true);
    const mcpConfig = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf-8'));
    expect(mcpConfig.mcpServers.complirules).toBeDefined();
    expect(mcpConfig.mcpServers.complirules.args).toEqual(["-y", "complirules", "mcp"]);
  });

  it('complirules add ve remove komutları ile ülke bazlı modüler kurulum ve kaldırma yapılabilir', async () => {
    const { executeAdd } = await import('../packages/cli/src/commands/add.js');
    const { executeRemove } = await import('../packages/cli/src/commands/remove.js');

    const { getRulesByJurisdiction } = await import('../packages/rules/src/index.js');
    const kvkkCount = getRulesByJurisdiction('KVKK_TR').filter(r => r.jurisdiction === 'KVKK_TR').length;

    // 1. Sadece KVKK ekle
    executeAdd('kvkk', tempProjectDir);
    const cursorRulesDir = path.join(tempProjectDir, '.cursor', 'rules');
    expect(fs.existsSync(cursorRulesDir)).toBe(true);
    let installedFiles = fs.readdirSync(cursorRulesDir);
    expect(installedFiles.every(f => f.startsWith('kvkk'))).toBe(true);
    expect(installedFiles.length).toBe(kvkkCount);

    // 2. EAA ekle
    executeAdd('eaa', tempProjectDir);
    installedFiles = fs.readdirSync(cursorRulesDir);
    expect(installedFiles.length).toBe(kvkkCount + 2);
    expect(installedFiles.some(f => f.startsWith('eaa'))).toBe(true);

    // 3. EAA kaldır
    executeRemove('eaa', tempProjectDir);
    installedFiles = fs.readdirSync(cursorRulesDir);
    expect(installedFiles.length).toBe(kvkkCount);
    expect(installedFiles.some(f => f.startsWith('eaa'))).toBe(false);
  });
});
