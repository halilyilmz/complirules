import { LinterRule, LintViolation } from '../types.js';

export const noUnredactedLogsRule: LinterRule = {
  id: 'no-unredacted-logs',
  name: 'Log ve Telemetride Ham PII/Kişisel Veri Basma Yasağı',
  lawCitation: 'GDPR Art. 5(1)(f) & KVKK Veri Güvenliği Rehberi',
  severity: 'CRITICAL',
  filePattern: /\.(ts|js|tsx|jsx|mjs|py|go|php)$/,
  check(filePath: string, content: string): LintViolation[] {
    const violations: LintViolation[] = [];
    const lines = content.split('\n');

    const riskyPatterns = [
      // JS / TS
      /console\.(log|info|warn|error|debug)\s*\(\s*([^)]*)\b(req\.body|user|customer|patient|payload|password|tckn|token)\b([^)]*)\)/i,
      /logger\.(info|warn|error|debug)\s*\(\s*\{[^}]*\b(user|customer|req\.body|password|tckn)\b[^}]*\}\s*\)/i,
      /Sentry\.captureException\s*\([^,]+,\s*\{[^}]*extra:\s*\{[^}]*\b(req\.body|user|payload)\b/i,
      // Python (print / logging)
      /print\s*\(\s*[^)]*\b(request\.body|user|password|tckn|patient)\b/i,
      /logger\.(info|warn|error|debug)\s*\(\s*[^)]*\b(user|customer|password|tckn)\b/i,
      // Go (log / slog)
      /log\.(Printf|Println|Print)\s*\(\s*[^)]*\b(user|password|token)\b/i,
      // PHP (Log::info)
      /Log::(info|debug|error|warning)\s*\(\s*[^)]*(\$request->all\(\)|\$user|\$password)/i
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of riskyPatterns) {
        const match = pattern.exec(line);
        if (match) {
          violations.push({
            file: filePath,
            line: i + 1,
            column: match.index + 1,
            ruleId: this.id,
            severity: this.severity,
            message: `Ham kişisel veri veya hassas nesne (${match[3] || 'PII'}) doğrudan loglanıyor. Log sağlayıcılarına PII sızması veri ihlali sayılır.`,
            lawCitation: this.lawCitation,
            matchedSnippet: line.trim(),
            suggestedFix: 'createRedactedLogger() kullanın veya log nesnesinden hassas alanları (password, email, tckn) çıkarın.'
          });
        }
      }
    }

    return violations;
  }
};
