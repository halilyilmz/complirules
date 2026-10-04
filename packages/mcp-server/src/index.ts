#!/usr/bin/env node
import { startMcpServer } from './server.js';

export * from './server.js';
export * from './tools/verify-schema.js';
export * from './tools/audit-code-pii.js';
export * from './tools/check-ui-dark-patterns.js';
export * from './tools/generate-ropa.js';
export * from './tools/lookup-legal-citation.js';

// Eğer doğrudan çalıştırıldıysa MCP sunucusunu başlat
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('mcp-server/dist/index.js')) {
  startMcpServer();
}
