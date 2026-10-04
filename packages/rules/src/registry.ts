import { ALL_RULES, RULE_PACKS } from './catalog-data.js';
import { RuleDefinition, RulePack, Jurisdiction } from './types.js';

export function getRulePacks(): RulePack[] {
  return RULE_PACKS;
}

export function getAllRules(): RuleDefinition[] {
  return ALL_RULES;
}

export function getRulesByJurisdiction(jurisdiction: Jurisdiction): RuleDefinition[] {
  return ALL_RULES.filter(r => r.jurisdiction === jurisdiction || r.jurisdiction === 'GLOBAL_SEC');
}

export function getRuleById(id: string): RuleDefinition | undefined {
  return ALL_RULES.find(r => r.id === id);
}

/**
 * Kullanıcı girdisini (örn: "tr", "kvkk", "gdpr", "hipaa", "eaa", "ai-act" veya kural ID'si)
 * ilgili kural tanımlarına çözer.
 */
export function resolveRulesFromQuery(query: string): RuleDefinition[] {
  const q = query.toLowerCase().trim();

  // 1. Doğrudan paket ID eşleşmesi
  const pack = RULE_PACKS.find(p => p.id === q);
  if (pack) return pack.rules;

  // 2. Doğrudan kural ID eşleşmesi
  const singleRule = ALL_RULES.find(r => r.id === q);
  if (singleRule) return [singleRule];

  // 3. Ülke / Bölge takma adları
  if (q === 'tr' || q === 'turkey' || q === 'turkiye' || q === 'kvkk') {
    return ALL_RULES.filter(r => r.jurisdiction === 'KVKK_TR');
  }

  if (q === 'eu' || q === 'europe' || q === 'gdpr') {
    return ALL_RULES.filter(r => r.jurisdiction === 'GDPR_EU');
  }

  if (q === 'eaa' || q === 'a11y' || q === 'accessibility' || q === 'wcag') {
    return ALL_RULES.filter(r => r.jurisdiction === 'EAA_EU');
  }

  if (q === 'us' || q === 'usa' || q === 'hipaa' || q === 'health') {
    return ALL_RULES.filter(r => r.jurisdiction === 'HIPAA_US');
  }

  if (q === 'ccpa' || q === 'california' || q === 'gpc') {
    return ALL_RULES.filter(r => r.jurisdiction === 'CCPA_US');
  }

  if (q === 'ai' || q === 'ai-act' || q === 'euaiact') {
    return ALL_RULES.filter(r => r.jurisdiction === 'AI_ACT_EU');
  }

  if (q === 'sec' || q === 'security' || q === 'pii') {
    return ALL_RULES.filter(r => r.jurisdiction === 'GLOBAL_SEC');
  }

  // 4. İçerik eşleşmesi
  return ALL_RULES.filter(r => 
    r.id.toLowerCase().includes(q) || 
    r.title.toLowerCase().includes(q) ||
    r.jurisdiction.toLowerCase().includes(q)
  );
}


/**
 * Cursor .mdc formatında YAML frontmatter ve Markdown kurallarını oluşturur
 */
export function renderMdcRule(rule: RuleDefinition): string {
  const frontmatter = [
    '---',
    `description: ${JSON.stringify(rule.title)}`,
    `globs: ${JSON.stringify(rule.globs)}`,
    `alwaysApply: ${rule.alwaysApply ? 'true' : 'false'}`,
    '---'
  ].join('\n');

  const citations = rule.legalCitations.map(c => 
    `- **${c.law} (${c.article})**: ${c.description}${c.penaltyContext ? ` *[Yaptırım: ${c.penaltyContext}]*` : ''}`
  ).join('\n');

  const instructions = rule.instructions.map(i => `- MUST: ${i}`).join('\n');
  const forbidden = rule.forbiddenPatterns.map(f => `- NEVER: ${f}`).join('\n');

  const snippets = rule.compliantCodeSnippets.map(s => 
    `### ${s.title}\n\`\`\`${s.language}\n${s.code}\n\`\`\``
  ).join('\n\n');

  return `${frontmatter}

# [CompliRules] ${rule.title}
**Önem Derecesi:** \`${rule.severity}\` | **Yargı Alanı:** \`${rule.jurisdiction}\`

## Yasal Dayanaklar (Legal Citations)
${citations}

## Kural Direktifleri
${instructions}

## Yasaklı Desenler (Forbidden Anti-Patterns)
${forbidden}

## Referans Uyumlu Kod Örnekleri
${snippets}
`;
}

/**
 * Claude Code / Windsurf / Copilot için birleşik AGENTS.md oluşturur
 */
export function renderAgentsMd(rules: RuleDefinition[]): string {
  const header = `# AGENTS.md — CompliRules Legal & Regulatory Guardrails

> Bu dosya, AI kodlama asistanlarının (Claude Code, Windsurf, Copilot, Cursor) projenin tabi olduğu yasal mevzuata (KVKK, GDPR, EAA 2025, HIPAA vb.) uygun kod üretmesini sağlamak için otomatik üretilmiştir.

`;

  const sections = rules.map(rule => {
    const citations = rule.legalCitations.map(c => `*${c.law} - ${c.article}*`).join(', ');
    const instructions = rule.instructions.map(i => `- MUST: ${i}`).join('\n');
    const forbidden = rule.forbiddenPatterns.map(f => `- NEVER: ${f}`).join('\n');

    return `## ${rule.title}
- **Yargı Alanı:** \`${rule.jurisdiction}\` (${citations})
- **Dosya Kapsamı (Globs):** \`${rule.globs.join(', ')}\`

### Talimatlar:
${instructions}
${forbidden}
`;
  }).join('\n---\n\n');

  return header + sections;
}

/**
 * CLAUDE.md oluşturur
 */
export function renderClaudeMd(rules: RuleDefinition[]): string {
  return `# CLAUDE.md — Regulatory Compliance Invariants

## Compliance Mandates
${rules.map(r => `### ${r.title}\n${r.instructions.map(i => `- ${i}`).join('\n')}\n${r.forbiddenPatterns.map(f => `- NEVER: ${f}`).join('\n')}`).join('\n\n')}
`;
}
