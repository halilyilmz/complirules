import readline from 'readline';
import { handleVerifySchema } from './tools/verify-schema.js';
import { handleAuditCodePii } from './tools/audit-code-pii.js';
import { handleCheckUiDarkPatterns } from './tools/check-ui-dark-patterns.js';
import { handleGenerateRopa } from './tools/generate-ropa.js';
import { handleLookupLegalCitation } from './tools/lookup-legal-citation.js';
import { handleVerifyTransferAdequacy } from './tools/verify-transfer-adequacy.js';
import { handleGenerateDPIA } from './tools/generate-dpia.js';
import { handleCheckDependencyPrivacy } from './tools/check-dependency-privacy.js';
import { handleCheckHIPAASafeHarbor } from './tools/check-hipaa-safeharbor.js';
import { handleResolveJurisdictionConflict } from './tools/resolve-jurisdiction-conflict.js';
import { handleGenerateBreachAssessment } from './tools/generate-breach-assessment.js';
import { handleGenerateCookieDisclosure } from './tools/generate-cookie-disclosure.js';
import { handleVerifyConsentImplementation } from './tools/verify-consent-implementation.js';
import { handleGenerateDPATemplate } from './tools/generate-dpa-template.js';
import { handleAuditAccessibilityCompliance } from './tools/audit-accessibility-compliance.js';

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
    name: 'verify_transfer_adequacy',
    description: 'Evaluates international data transfer compliance under GDPR Chapter V (Schrems II) and KVKK Article 9. Checks recipient country adequacy, surveillance law risks (FISA 702, EO 12333), and required supplementary technical/contractual safeguards.',
    inputSchema: {
      type: 'object',
      properties: {
        exporterCountry: { type: 'string', description: 'ISO 3166-1 alpha-2 code of exporter (e.g. DE, FR, TR)' },
        importerCountry: { type: 'string', description: 'ISO 3166-1 alpha-2 code of importer (e.g. US, CN, IN, GB)' },
        serviceName: { type: 'string', description: 'Name of the service (e.g. AWS, Sentry, Google Analytics, PostHog)' },
        isDpfCertified: { type: 'boolean', description: 'Whether importer is actively certified under EU-US Data Privacy Framework' },
        dataCategories: { type: 'array', items: { type: 'string' }, description: 'Categories of data being transferred' }
      },
      required: ['exporterCountry', 'importerCountry', 'serviceName', 'dataCategories']
    }
  },
  {
    name: 'generate_dpia',
    description: 'Determines whether a planned software architecture triggers a mandatory Data Protection Impact Assessment (GDPR Art. 35 / KVKK) and synthesizes a fully structured DPIA template.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string' },
        processingDescription: { type: 'string' },
        involvesSpecialCategories: { type: 'boolean' },
        involvesAutomatedDecisionMaking: { type: 'boolean' },
        involvesLargeScaleMonitoring: { type: 'boolean' },
        involvesVulnerableSubjects: { type: 'boolean' }
      },
      required: ['projectName', 'processingDescription']
    }
  },
  {
    name: 'check_dependency_privacy',
    description: 'Audits dependencies in package.json against a database of ad-tech, tracking, session-replay, and telemetry libraries that trigger statutory consent and transfer obligations.',
    inputSchema: {
      type: 'object',
      properties: {
        dependencies: { type: 'object', description: 'Key-value map of package names and versions' }
      },
      required: ['dependencies']
    }
  },
  {
    name: 'check_hipaa_safeharbor',
    description: 'Audits database schemas or JSON payloads against all 18 HIPAA Safe Harbor identifiers (45 CFR §164.514(b)(2)).',
    inputSchema: {
      type: 'object',
      properties: {
        fields: { type: 'array', items: { type: 'string' }, description: 'Array of field names / schema columns to evaluate' }
      },
      required: ['fields']
    }
  },
  {
    name: 'resolve_jurisdiction_conflict',
    description: 'Resolves conflicting legal obligations across multiple jurisdictions (e.g. GDPR Art. 17 Right to Erasure vs Turkish Tax Code VUK 253 / German AO §147 10-year retention, or HIPAA 6-year retention).',
    inputSchema: {
      type: 'object',
      properties: {
        requestedAction: { type: 'string', enum: ['erasure', 'export', 'retention'] },
        dataCategory: { type: 'string', enum: ['financial_invoice', 'clinical_health', 'marketing_tracking', 'profile_credentials'] },
        jurisdictions: { type: 'array', items: { type: 'string' } }
      },
      required: ['requestedAction', 'dataCategory']
    }
  },
  {
    name: 'generate_breach_assessment',
    description: 'Evaluates security incidents against statutory breach notification criteria (KVKK 72h, GDPR Art. 33/34, HIPAA 60-day OCR threshold).',
    inputSchema: {
      type: 'object',
      properties: {
        incidentType: { type: 'string' },
        affectedRecordsCount: { type: 'number' },
        dataCategories: { type: 'array', items: { type: 'string' } },
        isEncryptedWithCustomerKey: { type: 'boolean' },
        jurisdiction: { type: 'string', enum: ['TR', 'EU', 'US', 'ALL'], default: 'ALL' }
      },
      required: ['incidentType', 'affectedRecordsCount', 'dataCategories', 'isEncryptedWithCustomerKey']
    }
  },
  {
    name: 'generate_cookie_disclosure',
    description: 'Generates structured cookie and terminal access disclosures per ePrivacy Art. 5(3), Planet49, and KVKK 2022 Cookie Guidelines.',
    inputSchema: {
      type: 'object',
      properties: {
        appName: { type: 'string' },
        cookies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              provider: { type: 'string' },
              category: { type: 'string', enum: ['strictly_necessary', 'functional', 'analytics', 'marketing'] },
              purpose: { type: 'string' },
              expiry: { type: 'string' }
            },
            required: ['name', 'provider', 'category', 'purpose', 'expiry']
          }
        }
      },
      required: ['appName', 'cookies']
    }
  },
  {
    name: 'verify_consent_implementation',
    description: 'Verifies UI consent architecture against Planet49 (no pre-checked boxes), decoupled marketing/Terms, granular per-purpose switches, symmetric reject button, and easy withdrawal.',
    inputSchema: {
      type: 'object',
      properties: {
        hasRejectAllButton: { type: 'boolean' },
        areCheckboxesPreChecked: { type: 'boolean' },
        isBundledWithTermsOfService: { type: 'boolean' },
        hasGranularPurposeSwitches: { type: 'boolean' },
        hasRevocationInterface: { type: 'boolean' },
        jurisdiction: { type: 'string', enum: ['EU', 'TR', 'US_CA', 'GLOBAL'], default: 'EU' }
      },
      required: ['hasRejectAllButton', 'areCheckboxesPreChecked', 'isBundledWithTermsOfService', 'hasGranularPurposeSwitches', 'hasRevocationInterface']
    }
  },
  {
    name: 'generate_dpa_template',
    description: 'Generates compliant Data Processing Agreements (DPA) under GDPR Art. 28 and KVKK Art. 12 including security measures, audit rights, and sub-processor controls.',
    inputSchema: {
      type: 'object',
      properties: {
        controllerName: { type: 'string' },
        processorName: { type: 'string' },
        dataCategories: { type: 'array', items: { type: 'string' } },
        governingLaw: { type: 'string', enum: ['GDPR', 'KVKK', 'DUAL'], default: 'GDPR' }
      },
      required: ['controllerName', 'processorName', 'dataCategories']
    }
  },
  {
    name: 'audit_accessibility_compliance',
    description: 'Audits UI accessibility against European Accessibility Act (EAA Directive 2019/882) and WCAG 2.1 AA standards.',
    inputSchema: {
      type: 'object',
      properties: {
        hasAriaLabelsOnIconButtons: { type: 'boolean' },
        colorContrastRatio: { type: 'number' },
        isKeyboardNavigable: { type: 'boolean' },
        supportsZoomWithoutClipping: { type: 'boolean' },
        hasAccessibleForms: { type: 'boolean' }
      },
      required: ['hasAriaLabelsOnIconButtons', 'colorContrastRatio', 'isKeyboardNavigable', 'supportsZoomWithoutClipping', 'hasAccessibleForms']
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
    case 'verify_transfer_adequacy':
      return handleVerifyTransferAdequacy(args as any);
    case 'generate_dpia':
      return handleGenerateDPIA(args as any);
    case 'check_dependency_privacy':
      return handleCheckDependencyPrivacy(args as any);
    case 'check_hipaa_safeharbor':
      return handleCheckHIPAASafeHarbor(args as any);
    case 'resolve_jurisdiction_conflict':
      return handleResolveJurisdictionConflict(args as any);
    case 'generate_breach_assessment':
      return handleGenerateBreachAssessment(args as any);
    case 'generate_cookie_disclosure':
      return handleGenerateCookieDisclosure(args as any);
    case 'verify_consent_implementation':
      return handleVerifyConsentImplementation(args as any);
    case 'generate_dpa_template':
      return handleGenerateDPATemplate(args as any);
    case 'audit_accessibility_compliance':
      return handleAuditAccessibilityCompliance(args as any);
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
