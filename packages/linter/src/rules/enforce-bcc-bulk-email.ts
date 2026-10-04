import { LinterRule, LintViolation } from '../types.js';

const MAIL_CONTEXT = /sendMail|\.send\s*\(|mailer|nodemailer|resend|sgMail|sendgrid|transporter|smtplib|MIMEText|mail\(/i;

// to: ['a','b']   cc: [x, y]   to: list.join(',')
const MULTI_RECIPIENT_ARRAY = /\b(to|cc)\s*:\s*\[[^\]]*,[^\]]*\]/gi;
const JOINED_RECIPIENTS = /\b(to|cc)\s*:\s*[\w.$]+\.join\s*\(/gi;
// Python: msg['To'] = ', '.join(recipients)
const PY_JOINED = /\[\s*['"](?:To|Cc)['"]\s*\]\s*=\s*['"][,;]\s*['"]\.join\s*\(/gi;

export const enforceBccBulkEmailRule: LinterRule = {
  id: 'enforce-bcc-bulk-email',
  name: 'Toplu E-postada TO/CC ile Alıcı Adreslerini İfşa Etme Yasağı',
  lawCitation: '6698 s. KVKK Md. 12(1) (veri güvenliği) & Kişisel Veri Güvenliği Rehberi',
  severity: 'HIGH',
  filePattern: /\.(ts|tsx|js|jsx|mjs|py|php)$/,
  check(filePath: string, content: string): LintViolation[] {
    if (!MAIL_CONTEXT.test(content)) return [];

    const violations: LintViolation[] = [];
    const seen = new Set<number>();

    const scan = (regex: RegExp) => {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        const line = content.substring(0, match.index).split('\n').length;
        if (seen.has(line)) continue;
        seen.add(line);

        violations.push({
          file: filePath,
          line,
          column: 1,
          ruleId: this.id,
          severity: this.severity,
          message:
            'Birden fazla alıcı `to`/`cc` alanına verilmiş; tüm alıcılar birbirinin e-posta adresini görür (yetkisiz kişisel veri ifşası).',
          lawCitation: this.lawCitation,
          matchedSnippet: match[0].replace(/\s+/g, ' ').substring(0, 150),
          suggestedFix:
            'Her alıcıya ayrı gönderim yapın (`buildSafeBulkEnvelopes`) veya alıcıları `bcc` alanına taşıyın; `validateBulkEmailOptions` ile doğrulayın.'
        });
      }
    };

    scan(MULTI_RECIPIENT_ARRAY);
    scan(JOINED_RECIPIENTS);
    scan(PY_JOINED);

    return violations.sort((a, b) => a.line - b.line);
  }
};
