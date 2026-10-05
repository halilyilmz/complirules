import fs from 'fs';
import path from 'path';
import { scanDirectory, LintViolation } from '@complirules/linter';

export interface ReportOptions {
  output?: string;
  projectName?: string;
}

export function executeReport(targetPath = '.', options: ReportOptions = {}): string {
  const resolvedTarget = path.resolve(targetPath);
  const projectName = options.projectName || path.basename(resolvedTarget);
  const outputFile = options.output || path.join(process.cwd(), 'COMPLIANCE_AUDIT_REPORT.html');

  console.log(`\n📊 Generating Executive Technical Compliance & Security Audit Report...`);
  console.log(`📂 Project: ${projectName} (${resolvedTarget})`);

  const result = scanDirectory(targetPath);
  const violations = result.violations;
  const criticalCount = result.summary.critical;
  const highCount = result.summary.high;
  const mediumCount = result.summary.medium;

  // Calculate Compliance Health Score (0 - 100)
  const deductions = (criticalCount * 15) + (highCount * 7) + (mediumCount * 3);
  const score = Math.max(0, 100 - deductions);

  let grade = 'A+';
  let gradeColor = '#10b981';
  let statusText = 'EXEMPLARY COMPLIANCE';

  if (score < 60) {
    grade = 'F';
    gradeColor = '#ef4444';
    statusText = 'HIGH REGULATORY RISK';
  } else if (score < 75) {
    grade = 'C';
    gradeColor = '#f97316';
    statusText = 'DEFICIENCIES DETECTED';
  } else if (score < 90) {
    grade = 'B';
    gradeColor = '#eab308';
    statusText = 'SATISFACTORY COMPLIANCE';
  } else if (score < 97) {
    grade = 'A';
    gradeColor = '#10b981';
    statusText = 'ROBUST COMPLIANCE';
  }

  // Jurisdiction breakdown
  const jurisdictions = {
    KVKK_TR: { name: 'KVKK (Law No. 6698 - Turkey)', count: 0 },
    GDPR_EU: { name: 'GDPR (EU Reg 2016/679)', count: 0 },
    EAA_EU: { name: 'EAA 2025 & EN 301 549 (EU Accessibility)', count: 0 },
    HIPAA_US: { name: 'HIPAA & FTC Health Rules (US)', count: 0 },
    CCPA_US: { name: 'CCPA / CPRA & GPC (California)', count: 0 },
    AI_ACT_EU: { name: 'EU AI Act (Reg 2024/1689)', count: 0 }
  };

  for (const v of violations) {
    const citation = v.lawCitation.toUpperCase();
    if (citation.includes('KVKK')) jurisdictions.KVKK_TR.count++;
    if (citation.includes('GDPR') || citation.includes('BREYER') || citation.includes('SCHREMS')) jurisdictions.GDPR_EU.count++;
    if (citation.includes('EAA') || citation.includes('301 549') || citation.includes('WCAG')) jurisdictions.EAA_EU.count++;
    if (citation.includes('HIPAA') || citation.includes('FTC')) jurisdictions.HIPAA_US.count++;
    if (citation.includes('CCPA') || citation.includes('SEPHORA') || citation.includes('GPC')) jurisdictions.CCPA_US.count++;
    if (citation.includes('AI ACT')) jurisdictions.AI_ACT_EU.count++;
  }

  const generatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compliance & Security Audit Report — ${escapeHtml(projectName)}</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --danger: #ef4444;
      --warning: #f59e0b;
      --success: #10b981;
    }
    @media print {
      body { background: #fff !important; color: #000 !important; font-size: 11pt; }
      .card { border: 1px solid #ccc !important; background: #fff !important; box-shadow: none !important; }
      .no-print { display: none !important; }
      .page-break { page-break-after: always; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem 1rem;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--border);
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
    }
    .header h1 { font-size: 1.8rem; display: flex; align-items: center; gap: 0.5rem; }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .badge-critical { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; }
    .badge-high { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid #f59e0b; }
    .badge-pass { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; }

    .score-banner {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 1.5rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      align-items: center;
    }
    .score-circle {
      text-align: center;
      border: 4px solid ${gradeColor};
      border-radius: 50%;
      width: 140px;
      height: 140px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin: 0 auto;
    }
    .score-grade { font-size: 3rem; font-weight: 900; color: ${gradeColor}; line-height: 1; }
    .score-num { font-size: 0.9rem; color: var(--text-muted); margin-top: 0.25rem; }
    .score-details h2 { font-size: 1.5rem; margin-bottom: 0.5rem; color: ${gradeColor}; }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .meta-item { background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 8px; }
    .meta-label { font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); }
    .meta-value { font-size: 1.1rem; font-weight: 700; }

    .section-title { font-size: 1.3rem; margin: 2rem 0 1rem; border-left: 4px solid var(--primary); padding-left: 0.75rem; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.25rem;
    }

    .violation-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-left: 4px solid #ef4444;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-bottom: 1rem;
    }
    .violation-card.HIGH { border-left-color: #f59e0b; }
    .violation-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .violation-file { font-family: monospace; font-size: 0.9rem; color: var(--primary); }
    .violation-cite { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
    .violation-msg { margin-bottom: 0.5rem; }
    .code-block {
      background: #090d16;
      border: 1px solid #1e293b;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-family: Consolas, monospace;
      font-size: 0.85rem;
      color: #f43f5e;
      overflow-x: auto;
      margin-bottom: 0.5rem;
    }
    .fix-box {
      font-size: 0.85rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.4rem 0.6rem;
      border-radius: 4px;
      color: #34d399;
    }

    .footer {
      margin-top: 3rem;
      border-top: 1px solid var(--border);
      padding-top: 1.5rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      text-align: center;
    }
    .btn-print {
      background: var(--primary);
      color: #0f172a;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>🛡️ CompliRules Pro Technical Audit Report</h1>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Target Repository: <strong>${escapeHtml(projectName)}</strong></p>
      </div>
      <div>
        <button class="btn-print no-print" onclick="window.print()">🖨️ Print to PDF</button>
      </div>
    </div>

    <div class="score-banner">
      <div class="score-circle">
        <div class="score-grade">${grade}</div>
        <div class="score-num">${score} / 100</div>
      </div>
      <div class="score-details">
        <h2>${statusText}</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          Automated deterministic static analysis & AST verification of software artifacts against personal data protection, accessibility, and AI governance statutes.
        </p>
        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">Files Scanned</div>
            <div class="meta-value">${result.checkedFilesCount.toLocaleString()}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Critical Issues</div>
            <div class="meta-value" style="color: var(--danger)">${criticalCount}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">High Severity</div>
            <div class="meta-value" style="color: var(--warning)">${highCount}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Audit Timestamp</div>
            <div class="meta-value" style="font-size: 0.85rem">${generatedAt}</div>
          </div>
        </div>
      </div>
    </div>

    <h3 class="section-title">Regulatory Jurisdiction Breakdown</h3>
    <div class="grid-2">
      ${Object.entries(jurisdictions).map(([key, j]) => `
        <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${j.name}</strong>
            <div style="font-size: 0.8rem; color: var(--text-muted)">Statutory checks & invariants</div>
          </div>
          <div>
            ${j.count === 0 
              ? `<span class="badge badge-pass">✓ 100% Compliant</span>` 
              : `<span class="badge badge-critical">${j.count} Findings</span>`}
          </div>
        </div>
      `).join('')}
    </div>

    <h3 class="section-title">Detailed Statutory & Technical Findings (${violations.length})</h3>
    ${violations.length === 0 ? `
      <div class="card" style="text-align: center; padding: 3rem;">
        <h3 style="color: var(--success); margin-bottom: 0.5rem;">🎉 Zero Regulatory Violations Detected</h3>
        <p style="color: var(--text-muted)">All AST rules, PII sanitization checks, and jurisdiction invariants passed successfully.</p>
      </div>
    ` : violations.map((v, idx) => `
      <div class="violation-card ${v.severity}">
        <div class="violation-header">
          <div class="violation-file">${escapeHtml(v.file)}:${v.line}:${v.column}</div>
          <span class="badge badge-${v.severity.toLowerCase()}">${v.severity}</span>
        </div>
        <div class="violation-cite">⚖️ ${escapeHtml(v.lawCitation)} (${escapeHtml(v.ruleId)})</div>
        <div class="violation-msg">${escapeHtml(v.message)}</div>
        <div class="code-block">${escapeHtml(v.matchedSnippet)}</div>
        ${v.suggestedFix ? `<div class="fix-box">💡 <strong>Remediation:</strong> ${escapeHtml(v.suggestedFix)}</div>` : ''}
      </div>
    `).join('')}

    <div class="footer">
      <p>Report generated by <strong>CompliRules Pro</strong> — Legal-as-Code & AST Guardrail Engine for Modern Vibe Coding.</p>
      <p style="margin-top: 0.25rem;">Disclaimer: This document represents an automated heuristic static code evaluation and does not constitute formal legal counsel or accreditation. Consult with licensed legal counsel for binding determinations.</p>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(outputFile, html, 'utf-8');
  console.log(`\n✅ Executive Audit Report generated successfully!`);
  console.log(`📄 Saved to: ${outputFile}`);
  console.log(`💡 Tip: Open this file in your browser and press Ctrl+P (Cmd+P) to save as PDF.\n`);

  return outputFile;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
