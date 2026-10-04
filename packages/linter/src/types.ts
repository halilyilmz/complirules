export interface LintViolation {
  file: string;
  line: number;
  column: number;
  ruleId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  message: string;
  lawCitation: string;
  matchedSnippet: string;
  suggestedFix?: string;
}

export interface LintResult {
  passed: boolean;
  checkedFilesCount: number;
  violations: LintViolation[];
  summary: {
    critical: number;
    high: number;
    medium: number;
  };
}

export interface LinterRule {
  id: string;
  name: string;
  lawCitation: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  filePattern: RegExp;
  check(filePath: string, content: string): LintViolation[];
}
