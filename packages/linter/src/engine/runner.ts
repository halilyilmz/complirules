import * as ts from 'typescript';
import * as path from 'path';

export interface RuleViolation {
  ruleId: string;
  severity: 'error' | 'warning';
  message: string;
  statutoryBasis: string;
  precedentCitation?: string;
  filePath: string;
  line: number;
  column: number;
}

export interface ComplianceRule {
  id: string;
  description: string;
  statutoryBasis: string;
  precedentCitation?: string;
  check(sourceFile: ts.SourceFile, checker?: ts.TypeChecker): RuleViolation[];
}

export class CompliRulesEngine {
  private program?: ts.Program;
  private checker?: ts.TypeChecker;
  private rules: ComplianceRule[] = [];

  constructor(configPath?: string, filePatterns?: string[]) {
    if (configPath) {
      const configFileName = ts.findConfigFile(
        path.dirname(configPath),
        ts.sys.fileExists,
        path.basename(configPath)
      );

      if (configFileName) {
        const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
        const parsedCommandLine = ts.parseJsonConfigFileContent(
          configFile.config,
          ts.sys,
          path.dirname(configFileName)
        );

        this.program = ts.createProgram({
          rootNames: parsedCommandLine.fileNames,
          options: parsedCommandLine.options,
        });
        this.checker = this.program.getTypeChecker();
      }
    }
  }

  registerRule(rule: ComplianceRule): void {
    this.rules.push(rule);
  }

  getRegisteredRules(): ComplianceRule[] {
    return this.rules;
  }

  /**
   * Run registered rules against an in-memory source string (for testing & single-file audits).
   */
  checkSourceText(code: string, fileName: string = 'inline.tsx'): RuleViolation[] {
    const sourceFile = ts.createSourceFile(
      fileName,
      code,
      ts.ScriptTarget.Latest,
      true,
      fileName.endsWith('.tsx') || fileName.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const violations: RuleViolation[] = [];
    for (const rule of this.rules) {
      const found = rule.check(sourceFile, this.checker);
      violations.push(...found);
    }
    return violations;
  }

  /**
   * Run registered rules across the entire tsconfig Program.
   */
  run(): RuleViolation[] {
    if (!this.program) {
      return [];
    }

    const violations: RuleViolation[] = [];
    for (const sourceFile of this.program.getSourceFiles()) {
      if (sourceFile.isDeclarationFile) continue;
      if (sourceFile.fileName.includes('node_modules')) continue;

      for (const rule of this.rules) {
        const fileViolations = rule.check(sourceFile, this.checker);
        violations.push(...fileViolations);
      }
    }

    return violations;
  }
}
