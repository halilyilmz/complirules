{
  "name": "@complirules/linter",
  "version": "1.0.0",
  "description": "Deterministic AST and pattern linter for regulatory compliance (KVKK, GDPR, EAA 2025, HIPAA)",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./rules": {
      "types": "./dist/rules/index.d.ts",
      "import": "./dist/rules/index.js"
    }
  },
  "type": "module",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@complirules/rules": "workspace:*",
    "typescript": "^5.7.2"
  },
  "devDependencies": {
    "@types/node": "^22.10.2"
  }
}
