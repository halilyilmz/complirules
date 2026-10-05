import { MCP_TOOLS, executeTool } from './server.js';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-session-id',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...headers,
    },
  });
}

function handleJsonRpc(msg: any): any {
  if (!msg || typeof msg !== 'object') {
    return {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32600, message: 'Invalid Request: body must be a JSON object' },
    };
  }

  const { id, method, params } = msg;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {
            listChanged: false,
          },
        },
        serverInfo: {
          name: 'complirules-mcp-server',
          version: '1.0.0',
        },
      },
    };
  }

  if (method === 'notifications/initialized') {
    return null; // notifications do not require a response
  }

  if (method === 'ping') {
    return {
      jsonrpc: '2.0',
      id,
      result: {},
    };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: MCP_TOOLS,
      },
    };
  }

  if (method === 'tools/call') {
    const toolName = params?.name;
    const toolArgs = params?.arguments || {};

    try {
      const resultText = executeTool(toolName, toolArgs);
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: resultText,
            },
          ],
          isError: false,
        },
      };
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: err?.message || 'Tool execution error',
        },
      };
    }
  }

  // Unknown method
  if (id !== undefined) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    };
  }

  return null;
}

function renderHtmlLanding(origin: string): string {
  const toolsCount = MCP_TOOLS.length;
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CompliRules — Cloudflare Edge MCP Server</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #121110; color: #EDEAE4; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  </style>
</head>
<body class="p-6 md:p-12 max-w-4xl mx-auto">
  <div class="border-b border-[#EDEAE4]/20 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
      <div class="flex items-center gap-2 mb-2">
        <span class="inline-block w-3 h-3 bg-[#E5484D] rounded-full animate-pulse"></span>
        <h1 class="text-xl font-bold tracking-tight uppercase">CompliRules Remote MCP Server</h1>
      </div>
      <p class="text-sm text-[#EDEAE4]/60">Deployed globally on Cloudflare Workers (Edge Network)</p>
    </div>
    <div class="flex gap-2">
      <span class="px-2.5 py-1 text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">STATUS: ONLINE</span>
      <span class="px-2.5 py-1 text-xs font-semibold bg-[#EDEAE4]/10 border border-[#EDEAE4]/20 rounded">${toolsCount} TOOLS ACTIVE</span>
    </div>
  </div>

  <section class="mb-10">
    <h2 class="text-xs uppercase tracking-widest text-[#E5484D] font-bold mb-3">1. Connect to Cursor / Claude / Windsurf</h2>
    <div class="bg-black/60 border border-[#EDEAE4]/15 rounded-lg p-4 text-xs overflow-x-auto">
      <div class="text-[#EDEAE4]/50 mb-2">// In ~/.cursor/mcp.json or Claude Desktop config:</div>
      <pre class="text-[#EDEAE4]"><code>{
  "mcpServers": {
    "complirules": {
      "url": "${origin}/sse"
    }
  }
}</code></pre>
    </div>
  </section>

  <section class="mb-10">
    <h2 class="text-xs uppercase tracking-widest text-[#E5484D] font-bold mb-3">2. Available Endpoints</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
      <div class="border border-[#EDEAE4]/15 rounded p-3 bg-black/40">
        <div class="font-bold text-amber-300 mb-1">POST ${origin}/mcp</div>
        <div class="text-[#EDEAE4]/60">Standard JSON-RPC 2.0 endpoint (initialize, tools/list, tools/call).</div>
      </div>
      <div class="border border-[#EDEAE4]/15 rounded p-3 bg-black/40">
        <div class="font-bold text-amber-300 mb-1">GET ${origin}/sse</div>
        <div class="text-[#EDEAE4]/60">Server-Sent Events stream for persistent SSE transport.</div>
      </div>
      <div class="border border-[#EDEAE4]/15 rounded p-3 bg-black/40">
        <div class="font-bold text-amber-300 mb-1">GET ${origin}/tools</div>
        <div class="text-[#EDEAE4]/60">Returns full list of 16 tools in JSON format with schemas.</div>
      </div>
      <div class="border border-[#EDEAE4]/15 rounded p-3 bg-black/40">
        <div class="font-bold text-amber-300 mb-1">GET ${origin}/health</div>
        <div class="text-[#EDEAE4]/60">Liveness check returning latency and uptime status.</div>
      </div>
    </div>
  </section>

  <section>
    <h2 class="text-xs uppercase tracking-widest text-[#E5484D] font-bold mb-3">3. Registered Statutory Compliance Tools (${toolsCount})</h2>
    <div class="space-y-2">
      ${MCP_TOOLS.map((t) => `
        <div class="border border-[#EDEAE4]/10 bg-black/30 rounded p-3 text-xs">
          <div class="font-bold text-[#E5484D] mb-1">${t.name}</div>
          <div class="text-[#EDEAE4]/70">${t.description}</div>
        </div>
      `).join('')}
    </div>
  </section>
</body>
</html>`;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const origin = url.origin;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // Health check
    if (pathname === '/health' || pathname === '/ping') {
      return jsonResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'complirules-mcp-server',
        version: '1.0.0',
        tools: MCP_TOOLS.length,
      });
    }

    // Tools list via GET
    if (pathname === '/tools') {
      return jsonResponse({
        tools: MCP_TOOLS,
      });
    }

    // SSE endpoint (GET /sse)
    if (pathname === '/sse') {
      const sessionId = crypto.randomUUID();
      const endpointUri = `/message?sessionId=${sessionId}`;

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      // Write initial endpoint event
      const initialMessage = `event: endpoint\ndata: ${endpointUri}\n\n`;
      writer.write(encoder.encode(initialMessage));

      return new Response(readable, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'x-session-id': sessionId,
          ...CORS_HEADERS,
        },
      });
    }

    // POST /message (SSE client message endpoint)
    if (pathname === '/message') {
      try {
        const body = await request.json();
        const responseData = handleJsonRpc(body);
        if (!responseData) {
          return new Response(null, { status: 204, headers: CORS_HEADERS });
        }
        return jsonResponse(responseData);
      } catch (err: any) {
        return jsonResponse(
          {
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: `Parse error: ${err.message}` },
          },
          400
        );
      }
    }

    // Direct JSON-RPC endpoint: POST / or POST /mcp
    if (request.method === 'POST' && (pathname === '/' || pathname === '/mcp')) {
      try {
        const body: any = await request.json();

        // Support single message or batch
        if (Array.isArray(body)) {
          const results = body.map(handleJsonRpc).filter(Boolean);
          return jsonResponse(results);
        }

        const result = handleJsonRpc(body);
        if (!result) {
          return new Response(null, { status: 204, headers: CORS_HEADERS });
        }
        return jsonResponse(result);
      } catch (err: any) {
        return jsonResponse(
          {
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: `Parse error: ${err.message}` },
          },
          400
        );
      }
    }

    // Root GET: HTML landing page or JSON metadata
    if (pathname === '/') {
      const acceptHeader = request.headers.get('accept') || '';
      if (acceptHeader.includes('application/json')) {
        return jsonResponse({
          service: 'complirules-mcp-server',
          status: 'online',
          version: '1.0.0',
          protocolVersion: '2024-11-05',
          toolsCount: MCP_TOOLS.length,
          endpoints: {
            mcpJsonRpc: `${origin}/mcp`,
            sse: `${origin}/sse`,
            tools: `${origin}/tools`,
            health: `${origin}/health`,
          },
        });
      }

      return new Response(renderHtmlLanding(origin), {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          ...CORS_HEADERS,
        },
      });
    }

    // 404
    return jsonResponse(
      {
        error: 'Not Found',
        message: `Endpoint ${pathname} does not exist on CompliRules MCP Server. Use POST /mcp or GET /sse.`,
      },
      404
    );
  },
};
