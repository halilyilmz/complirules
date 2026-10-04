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
    description: 'Veritabanı şemasını (Prisma/SQL/Drizzle) KVKK, VUK ve GDPR saklama/silme ve cascade delete kurallarına göre denetler.',
    inputSchema: {
      type: 'object',
      properties: {
        schemaContent: { type: 'string', description: 'Prisma veya SQL şema metni' },
        schemaType: { type: 'string', enum: ['prisma', 'drizzle', 'sql'], default: 'prisma' }
      },
      required: ['schemaContent']
    }
  },
  {
    name: 'audit_code_pii',
    description: 'Kod parçacığında açık metin PII/PHI (kullanıcı nesnesi, şifre, TCKN, kredi kartı) loglamasını ve telemetri sızıntılarını tespit eder.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Denetlenecek TypeScript/JavaScript kod parçacığı' },
        filePath: { type: 'string', description: 'Dosya yolu (opsiyonel)' }
      },
      required: ['code']
    }
  },
  {
    name: 'check_ui_dark_patterns',
    description: 'React/HTML form bileşenlerinde önceden işaretli onay kutuları (pre-ticked), birleştirilmiş rıza (bundled consent) ve EAA 2025 erişilebilirlik açıklarını denetler.',
    inputSchema: {
      type: 'object',
      properties: {
        componentCode: { type: 'string', description: 'React JSX/TSX veya HTML form bileşeni' },
        filePath: { type: 'string', description: 'Dosya yolu (opsiyonel)' }
      },
      required: ['componentCode']
    }
  },
  {
    name: 'generate_ropa_inventory',
    description: 'Veritabanı şemasını analiz ederek otomatik GDPR Madde 30 (RoPA) ve KVKK VERBİS uyumlu veri işleme envanteri tablosu üretir.',
    inputSchema: {
      type: 'object',
      properties: {
        schemaContent: { type: 'string', description: 'Veritabanı şeması içeriği' },
        organizationName: { type: 'string', description: 'Şirket/Kuruluş Adı' },
        dpoEmail: { type: 'string', description: 'Veri Koruma Görevlisi E-postası' }
      },
      required: ['schemaContent']
    }
  },
  {
    name: 'lookup_legal_citation',
    description: 'İlgili yasal mevzuat maddelerini (KVKK Md. 7, VUK Md. 253, GDPR Art. 17, EAA 2025, HIPAA vb.), cezai yaptırımları ve içtihatları sorgular.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Arama terimi (örn: "KVKK silme", "fatura saklama", "EAA erişilebilirlik")' }
      },
      required: ['query']
    }
  },
  {
    name: 'lookup_active_partner',
    description: 'Canlıya çıkacak projeler için onaylı siber güvenlik, sızma testi (pentest) veya uyum partnerlerini ve indirim kodlarını dinamik sorgular.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['security', 'compliance', 'all'], default: 'security' },
        topic: { type: 'string', description: 'Konu/Modül (örn: "auth", "payment", "pii")' }
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
      throw new Error(`Bilinmeyen araç: ${name}`);
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
