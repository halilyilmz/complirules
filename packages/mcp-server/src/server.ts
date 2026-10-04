import readline from 'readline';
import { handleVerifySchema } from './tools/verify-schema.js';
import { handleAuditCodePii } from './tools/audit-code-pii.js';
import { handleCheckUiDarkPatterns } from './tools/check-ui-dark-patterns.js';
import { handleGenerateRopa } from './tools/generate-ropa.js';
import { handleLookupLegalCitation } from './tools/lookup-legal-citation.js';
import { handleLookupActivePartner } from './tools/lookup-active-partner.js';

export const MCP_TOOLS = [
  {
    name: 'verify_schema_compliance',
    description: 'Audits database schemas (Prisma/SQL/Drizzle) against statutory retention, right-to-be-forgotten, and unsafe cascade delete rules.',
    inputSchema: {
      type: 'object',
      properties: {
        schemaContent: { type: 'string', description: 'Prisma, Drizzle, or SQL schema content' },
        schemaType: { type: 'string', enum: ['prisma', 'drizzle', 'sql'], default: 'prisma' }
      },
      required: ['schemaContent']
    }
  },
  {
    name: 'audit_code_pii',
    description: 'Detects cleartext PII/PHI (user objects, credentials, national IDs, credit cards) logging and telemetry leakage in source code.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'TypeScript/JavaScript code snippet to audit' },
        filePath: { type: 'string', description: 'File path (optional)' }
      },
      required: ['code']
    }
  },
  {
    name: 'check_ui_dark_patterns',
    description: 'Audits React/HTML UI form components for pre-ticked checkboxes, bundled consent, and EAA 2025 accessibility violations.',
    inputSchema: {
      type: 'object',
      properties: {
        componentCode: { type: 'string', description: 'React JSX/TSX or HTML form component' },
        filePath: { type: 'string', description: 'File path (optional)' }
      },
      required: ['componentCode']
    }
  },
  {
    name: 'generate_ropa_inventory',
    description: 'Analyzes database schema and generates an automated GDPR Article 30 (RoPA) and KVKK VERBİS data processing inventory table.',
    inputSchema: {
      type: 'object',
      properties: {
        schemaContent: { type: 'string', description: 'Database schema content' },
        organizationName: { type: 'string', description: 'Organization or Company Name' },
        dpoEmail: { type: 'string', description: 'Data Protection Officer (DPO) email' }
      },
      required: ['schemaContent']
    }
  },
  {
    name: 'lookup_legal_citation',
    description: 'Queries statutory legislation articles (KVKK Art. 7, Tax Code Art. 253, GDPR Art. 17, EAA 2025, HIPAA), penal sanctions, and case precedents.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g., "KVKK retention", "invoice retention", "EAA accessibility")' }
      },
      required: ['query']
    }
  },
  {
    name: 'lookup_active_partner',
    description: 'Dynamically queries vetted cybersecurity, penetration testing (pentest), or compliance partners and active discount codes.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['security', 'compliance', 'all'], default: 'security' },
        topic: { type: 'string', description: 'Module/Topic (e.g., "auth", "payment", "pii")' }
      }
    }
  }
];

export function executeTool(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'verify_schema_compliance':
      return handleVerifySchema(args as any);
    case 'audit_code_pii':
      return handleAuditCodePii(args as any);
    case 'check_ui_dark_patterns':
      return handleCheckUiDarkPatterns(args as any);
    case 'generate_ropa_inventory':
      return handleGenerateRopa(args as any);
    case 'lookup_legal_citation':
      return handleLookupLegalCitation(args as any);
    case 'lookup_active_partner':
      return handleLookupActivePartner(args as any);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export function startMcpServer(): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  const sendResponse = (id: unknown, result: unknown, error?: unknown) => {
    const payload: any = { jsonrpc: '2.0', id };
    if (error) {
      payload.error = error;
    } else {
      payload.result = result;
    }
    process.stdout.write(JSON.stringify(payload) + '\n');
  };

  rl.on('line', (line) => {
    if (!line.trim()) return;

    try {
      const msg = JSON.parse(line);

      // JSON-RPC Request Handling
      if (msg.method === 'initialize') {
        sendResponse(msg.id, {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'complirules-mcp-server',
            version: '1.0.0'
          }
        });
        return;
      }

      if (msg.method === 'notifications/initialized') {
        // Notification, no response needed
        return;
      }

      if (msg.method === 'ping') {
        sendResponse(msg.id, {});
        return;
      }

      if (msg.method === 'tools/list') {
        sendResponse(msg.id, {
          tools: MCP_TOOLS
        });
        return;
      }

      if (msg.method === 'tools/call') {
        const toolName = msg.params?.name;
        const toolArgs = msg.params?.arguments || {};

        try {
          const resultText = executeTool(toolName, toolArgs);
          sendResponse(msg.id, {
            content: [
              {
                type: 'text',
                text: resultText
              }
            ]
          });
        } catch (err: any) {
          sendResponse(msg.id, null, {
            code: -32603,
            message: err.message || 'Araç çalıştırılırken hata oluştu'
          });
        }
        return;
      }

      // Bilinmeyen metod
      if (msg.id !== undefined) {
        sendResponse(msg.id, null, {
          code: -32601,
          message: `Metod bulunamadı: ${msg.method}`
        });
      }
    } catch (parseError: any) {
      process.stderr.write(`[CompliRules MCP] Parse error: ${parseError.message}\n`);
    }
  });

  process.stderr.write('[CompliRules MCP Server] Başlatıldı. Stdio üzerinden dinleniyor...\n');
}
