import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  mergeCompliRulesContent, 
  removeCompliRulesContent, 
  safelyWriteAgentFile, 
  safelyRemoveFromAgentFile 
} from '../packages/cli/src/utils/agent-merger.js';

describe('Non-Destructive Agent File Merger', () => {
  const testDir = path.resolve(__dirname, 'temp-agent-test');

  beforeEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('preserves existing custom user instructions when writing rules', () => {
    const customUserContent = '# My Custom Project Instructions\n- Always use tabs\n- Never touch auth.ts\n';
    const filePath = path.join(testDir, 'AGENTS.md');
    fs.writeFileSync(filePath, customUserContent, 'utf-8');

    const result = safelyWriteAgentFile(testDir, 'AGENTS.md', '## CompliRules Invariants\n- MUST validate KVKK');
    expect(result.merged).toBe(true);

    const updated = fs.readFileSync(filePath, 'utf-8');
    // User instructions must still be present
    expect(updated).toContain('# My Custom Project Instructions');
    expect(updated).toContain('- Always use tabs');
    // CompliRules block must be present
    expect(updated).toContain('COMPLIRULES_START');
    expect(updated).toContain('MUST validate KVKK');
    expect(updated).toContain('COMPLIRULES_END');
  });

  it('updates existing CompliRules block without duplicating it or touching user content', () => {
    const initial = '# User Header\n\n<!-- COMPLIRULES_START: DO NOT EDIT BETWEEN THESE TAGS -->\nOld Rules\n<!-- COMPLIRULES_END -->\n\n# User Footer';
    const merged = mergeCompliRulesContent(initial, 'New Rules 2.0');
    
    expect(merged).toContain('# User Header');
    expect(merged).toContain('# User Footer');
    expect(merged).toContain('New Rules 2.0');
    expect(merged).not.toContain('Old Rules');
    // Exactly one START and END tag
    expect(merged.split('COMPLIRULES_START').length).toBe(2);
  });

  it('preserves user content on removal, only deleting file if it was 100% CompliRules', () => {
    // Case 1: Mixed file with user content
    const mixedPath = path.join(testDir, 'MIXED.md');
    fs.writeFileSync(mixedPath, '# Important User Rules\n\n<!-- COMPLIRULES_START: DO NOT EDIT BETWEEN THESE TAGS -->\nRules\n<!-- COMPLIRULES_END -->\n', 'utf-8');
    
    const mixedRes = safelyRemoveFromAgentFile(testDir, 'MIXED.md');
    expect(mixedRes.deletedFile).toBe(false);
    expect(mixedRes.preservedUserContent).toBe(true);
    expect(fs.existsSync(mixedPath)).toBe(true);
    expect(fs.readFileSync(mixedPath, 'utf-8')).toContain('# Important User Rules');
    expect(fs.readFileSync(mixedPath, 'utf-8')).not.toContain('COMPLIRULES_START');

    // Case 2: Pure CompliRules file
    const purePath = path.join(testDir, 'PURE.md');
    fs.writeFileSync(purePath, '<!-- COMPLIRULES_START: DO NOT EDIT BETWEEN THESE TAGS -->\nRules\n<!-- COMPLIRULES_END -->\n', 'utf-8');
    
    const pureRes = safelyRemoveFromAgentFile(testDir, 'PURE.md');
    expect(pureRes.deletedFile).toBe(true);
    expect(fs.existsSync(purePath)).toBe(false);
  });
});
