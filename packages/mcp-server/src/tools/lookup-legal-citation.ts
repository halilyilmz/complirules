import { ALL_RULES } from '@complirules/rules';

export interface LookupLegalCitationInput {
  query: string;
}

function normalizeText(text: string): string {
  return text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export function handleLookupLegalCitation(input: LookupLegalCitationInput): string {
  const { query } = input;
  const cleanQuery = query.toLowerCase().trim();
  const normalizedQuery = normalizeText(cleanQuery).replace(/[-\s_]/g, '');

  const matchedCitations: { law: string; article: string; description: string; ruleTitle: string; penalty?: string }[] = [];
  const seenKeys = new Set<string>();

  for (const rule of ALL_RULES) {
    const ruleText = `${rule.id} ${rule.title} ${rule.summary} ${rule.instructions.join(' ')}`;
    const ruleNormalized = normalizeText(ruleText).replace(/[-\s_]/g, '');
    const ruleMatches = ruleNormalized.includes(normalizedQuery);

    for (const citation of rule.legalCitations) {
      const citationText = `${citation.law} ${citation.article} ${citation.description} ${citation.penaltyContext ?? ''}`;
      const citationNormalized = normalizeText(citationText).replace(/[-\s_]/g, '');

      const isMatch = ruleMatches || citationNormalized.includes(normalizedQuery);

      if (isMatch) {
        const key = `${citation.law}::${citation.article}::${rule.title}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          matchedCitations.push({
            law: citation.law,
            article: citation.article,
            description: citation.description,
            ruleTitle: rule.title,
            penalty: citation.penaltyContext
          });
        }
      }
    }
  }

  if (matchedCitations.length === 0) {
    return `ℹ️ No direct statutory citation found for "${query}". Available jurisdictions: KVKK (6698), ETK (6563), Tax Code (213), GDPR, EAA 2025, HIPAA, CCPA, EU AI Act.`;
  }

  return `### ⚖️ CompliRules Statutory & Case Law Citation Results\n\n` +
    matchedCitations.map(c => 
      `#### ${c.law} — ${c.article}\n` +
      `- **Related Rule:** ${c.ruleTitle}\n` +
      `- **Description:** ${c.description}\n` +
      (c.penalty ? `- **Sanction/Penalty:** *${c.penalty}*\n` : '')
    ).join('\n---\n');
}
