import fs from 'fs';
import path from 'path';

export const COMPLIRULES_START = '<!-- COMPLIRULES_START: DO NOT EDIT BETWEEN THESE TAGS -->';
export const COMPLIRULES_END = '<!-- COMPLIRULES_END -->';

/**
 * Safely merges CompliRules instructions into existing markdown without destroying user instructions.
 */
export function mergeCompliRulesContent(existingContent: string, newRulesContent: string): string {
  const wrapped = `${COMPLIRULES_START}\n${newRulesContent.trim()}\n${COMPLIRULES_END}`;
  
  if (existingContent.includes(COMPLIRULES_START) && existingContent.includes(COMPLIRULES_END)) {
    // Replace existing block
    const pattern = new RegExp(`${COMPLIRULES_START}[\\s\\S]*?${COMPLIRULES_END}`);
    return existingContent.replace(pattern, wrapped);
  }
  
  if (existingContent.trim().length === 0) {
    return wrapped + '\n';
  }
  
  // Append to existing user content
  return existingContent.trimEnd() + '\n\n' + wrapped + '\n';
}

/**
 * Strips CompliRules instructions from existing content.
 * Returns the stripped content and whether the remaining file has any user content left.
 */
export function removeCompliRulesContent(existingContent: string): { updatedContent: string; isEmpty: boolean } {
  if (!existingContent.includes(COMPLIRULES_START)) {
    return { updatedContent: existingContent, isEmpty: existingContent.trim().length === 0 };
  }
  
  const pattern = new RegExp(`\\n*${COMPLIRULES_START}[\\s\\S]*?${COMPLIRULES_END}\\n*`);
  const updated = existingContent.replace(pattern, '\n').trim();
  return { updatedContent: updated.length > 0 ? updated + '\n' : '', isEmpty: updated.length === 0 };
}

/**
 * Non-destructively writes or updates an agent file (AGENTS.md / CLAUDE.md).
 */
export function safelyWriteAgentFile(targetDir: string, filename: string, newRulesContent: string): { created: boolean; merged: boolean } {
  const filePath = path.join(targetDir, filename);
  const exists = fs.existsSync(filePath);
  const existing = exists ? fs.readFileSync(filePath, 'utf-8') : '';
  const merged = mergeCompliRulesContent(existing, newRulesContent);
  fs.writeFileSync(filePath, merged, 'utf-8');
  return { created: !exists, merged: exists && existing.trim().length > 0 };
}

/**
 * Non-destructively removes CompliRules rules from an agent file.
 * Preserves custom user instructions if present, only unlinks if file was purely CompliRules.
 */
export function safelyRemoveFromAgentFile(targetDir: string, filename: string): { removed: boolean; deletedFile: boolean; preservedUserContent: boolean } {
  const filePath = path.join(targetDir, filename);
  if (!fs.existsSync(filePath)) {
    return { removed: false, deletedFile: false, preservedUserContent: false };
  }
  
  const existing = fs.readFileSync(filePath, 'utf-8');
  const { updatedContent, isEmpty } = removeCompliRulesContent(existing);
  
  if (isEmpty) {
    fs.unlinkSync(filePath);
    return { removed: true, deletedFile: true, preservedUserContent: false };
  } else {
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    return { removed: true, deletedFile: false, preservedUserContent: true };
  }
}
