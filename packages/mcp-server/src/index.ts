#!/usr/bin/env node
import { startMcpServer } from './server.js';

export * from './server.js';
export * from './tools/verify-schema.js';
export * from './tools/audit-code-pii.js';
export * from './tools/check-ui-dark-patterns.js';
export * from './tools/generate-ropa.js';
export * from './tools/lookup-legal-citation.js';
export * from './tools/verify-transfer-adequacy.js';
export * from './tools/generate-dpia.js';
export * from './tools/check-dependency-privacy.js';
export * from './tools/check-hipaa-safeharbor.js';
export * from './tools/resolve-jurisdiction-conflict.js';
export * from './tools/generate-breach-assessment.js';
export * from './tools/generate-cookie-disclosure.js';
export * from './tools/verify-consent-implementation.js';
export * from './tools/generate-dpa-template.js';
export * from './tools/audit-accessibility-compliance.js';

// Eğer doğrudan çalıştırıldıysa MCP sunucusunu başlat
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('mcp-server/dist/index.js')) {
  startMcpServer();
}
