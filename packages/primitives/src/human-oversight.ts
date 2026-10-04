import crypto from 'node:crypto';

export interface AiDecisionAuditRecord {
  decisionId: string;
  modelId: string;
  inputHash: string;
  outputHash: string;
  confidenceScore: number;
  threshold: number;
  status: 'AUTOMATED_APPROVED' | 'PENDING_HUMAN_REVIEW' | 'HUMAN_OVERRIDDEN';
  requiresHumanReview: boolean;
  timestamp: string;
  explanationUrl?: string;
}

/**
 * EU AI Act Article 14 (Human Oversight) & Article 86 (Right to Explanation)
 * Otomatik karar verme mekanizmasında güven skoru eşiğin altındaysa insan moderatör eskalasyonu başlatır.
 */
export function evaluateAiDecisionWithOversight(params: {
  modelId: string;
  inputPayload: any;
  outputPayload: any;
  confidenceScore: number;
  threshold?: number;
}): AiDecisionAuditRecord {
  const threshold = params.threshold ?? 0.85;
  const decisionId = `dec_${crypto.randomUUID()}`;
  const inputHash = crypto.createHash('sha256').update(JSON.stringify(params.inputPayload)).digest('hex');
  const outputHash = crypto.createHash('sha256').update(JSON.stringify(params.outputPayload)).digest('hex');

  const requiresHumanReview = params.confidenceScore < threshold;

  return {
    decisionId,
    modelId: params.modelId,
    inputHash,
    outputHash,
    confidenceScore: params.confidenceScore,
    threshold,
    status: requiresHumanReview ? 'PENDING_HUMAN_REVIEW' : 'AUTOMATED_APPROVED',
    requiresHumanReview,
    timestamp: new Date().toISOString(),
    explanationUrl: `/api/ai/decisions/${decisionId}/explanation`
  };
}
