import fs from 'fs';
import path from 'path';

export type SupportedLanguage = 
  | 'typescript' 
  | 'javascript' 
  | 'python' 
  | 'go' 
  | 'php' 
  | 'rust' 
  | 'java' 
  | 'unknown';

export type SupportedFramework = 
  | 'nextjs' 
  | 'react' 
  | 'vue' 
  | 'express' 
  | 'node' 
  | 'django' 
  | 'fastapi' 
  | 'flask' 
  | 'gin' 
  | 'fiber' 
  | 'laravel' 
  | 'actix' 
  | 'axum' 
  | 'spring' 
  | 'unknown';

export type SupportedORM = 
  | 'prisma' 
  | 'drizzle' 
  | 'typeorm' 
  | 'mongoose' 
  | 'django-orm' 
  | 'sqlalchemy' 
  | 'gorm' 
  | 'eloquent' 
  | 'diesel' 
  | 'hibernate' 
  | 'none';

export interface DetectedStack {
  language: SupportedLanguage;
  framework: SupportedFramework;
  orm: SupportedORM;
  hasTypeScript: boolean;
  hasPrismaSchema: boolean;
  prismaSchemaPath?: string;
  hasTailwind: boolean;
  configFiles: string[];
}

export function detectProjectStack(projectRoot: string): DetectedStack {
  let language: SupportedLanguage = 'unknown';
  let framework: SupportedFramework = 'unknown';
  let orm: SupportedORM = 'none';
  let hasTypeScript = false;
  let hasPrismaSchema = false;
  let prismaSchemaPath: string | undefined;
  let hasTailwind = false;
  const configFiles: string[] = [];

  // 1. Python Tespiti (manage.py, requirements.txt, pyproject.toml, Pipfile)
  const isDjango = fs.existsSync(path.join(projectRoot, 'manage.py'));
  const reqTxtPath = path.join(projectRoot, 'requirements.txt');
  const pyprojectPath = path.join(projectRoot, 'pyproject.toml');

  if (isDjango || fs.existsSync(reqTxtPath) || fs.existsSync(pyprojectPath)) {
    language = 'python';
    if (isDjango) {
      framework = 'django';
      orm = 'django-orm';
      configFiles.push('manage.py');
    }

    let pythonDeps = '';
    if (fs.existsSync(reqTxtPath)) {
      pythonDeps += fs.readFileSync(reqTxtPath, 'utf-8').toLowerCase();
      configFiles.push('requirements.txt');
    }
    if (fs.existsSync(pyprojectPath)) {
      pythonDeps += fs.readFileSync(pyprojectPath, 'utf-8').toLowerCase();
      configFiles.push('pyproject.toml');
    }

    if (pythonDeps.includes('fastapi')) framework = 'fastapi';
    else if (pythonDeps.includes('flask')) framework = 'flask';
    else if (pythonDeps.includes('django') && framework === 'unknown') framework = 'django';

    if (pythonDeps.includes('sqlalchemy')) orm = 'sqlalchemy';
    else if (pythonDeps.includes('django') && orm === 'none') orm = 'django-orm';

    return {
      language,
      framework,
      orm,
      hasTypeScript: false,
      hasPrismaSchema: false,
      hasTailwind: false,
      configFiles
    };
  }

  // 2. Go Tespiti (go.mod)
  const goModPath = path.join(projectRoot, 'go.mod');
  if (fs.existsSync(goModPath)) {
    language = 'go';
    configFiles.push('go.mod');
    const goModContent = fs.readFileSync(goModPath, 'utf-8');

    if (goModContent.includes('github.com/gin-gonic/gin')) framework = 'gin';
    else if (goModContent.includes('github.com/gofiber/fiber')) framework = 'fiber';

    if (goModContent.includes('gorm.io/gorm')) orm = 'gorm';

    return {
      language,
      framework,
      orm,
      hasTypeScript: false,
      hasPrismaSchema: false,
      hasTailwind: false,
      configFiles
    };
  }

  // 3. PHP / Laravel Tespiti (artisan, composer.json)
  const composerPath = path.join(projectRoot, 'composer.json');
  const artisanPath = path.join(projectRoot, 'artisan');
  if (fs.existsSync(composerPath) || fs.existsSync(artisanPath)) {
    language = 'php';
    if (fs.existsSync(artisanPath)) {
      framework = 'laravel';
      orm = 'eloquent';
      configFiles.push('artisan');
    }
    if (fs.existsSync(composerPath)) {
      configFiles.push('composer.json');
      const compContent = fs.readFileSync(composerPath, 'utf-8');
      if (compContent.includes('laravel/framework')) {
        framework = 'laravel';
        orm = 'eloquent';
      }
    }

    return {
      language,
      framework,
      orm,
      hasTypeScript: false,
      hasPrismaSchema: false,
      hasTailwind: false,
      configFiles
    };
  }

  // 4. Rust Tespiti (Cargo.toml)
  const cargoPath = path.join(projectRoot, 'Cargo.toml');
  if (fs.existsSync(cargoPath)) {
    language = 'rust';
    configFiles.push('Cargo.toml');
    const cargoContent = fs.readFileSync(cargoPath, 'utf-8');
    if (cargoContent.includes('actix-web')) framework = 'actix';
    else if (cargoContent.includes('axum')) framework = 'axum';
    if (cargoContent.includes('diesel')) orm = 'diesel';

    return {
      language,
      framework,
      orm,
      hasTypeScript: false,
      hasPrismaSchema: false,
      hasTailwind: false,
      configFiles
    };
  }

  // 5. JavaScript / TypeScript / Node.js Tespiti (package.json)
  const pkgJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    configFiles.push('package.json');
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      language = deps['typescript'] || fs.existsSync(path.join(projectRoot, 'tsconfig.json')) 
        ? 'typescript' 
        : 'javascript';

      hasTypeScript = language === 'typescript';

      if (deps['next']) framework = 'nextjs';
      else if (deps['vue'] || deps['nuxt']) framework = 'vue';
      else if (deps['react']) framework = 'react';
      else if (deps['express']) framework = 'express';
      else framework = 'node';

      if (deps['@prisma/client'] || deps['prisma']) orm = 'prisma';
      else if (deps['drizzle-orm']) orm = 'drizzle';
      else if (deps['typeorm']) orm = 'typeorm';
      else if (deps['mongoose']) orm = 'mongoose';

      if (deps['tailwindcss']) hasTailwind = true;
    } catch {
      // Ignored
    }
  }

  // Prisma şeması kontrolü
  const standardPrismaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
  if (fs.existsSync(standardPrismaPath)) {
    hasPrismaSchema = true;
    prismaSchemaPath = standardPrismaPath;
    orm = 'prisma';
  }

  return {
    language,
    framework,
    orm,
    hasTypeScript,
    hasPrismaSchema,
    prismaSchemaPath,
    hasTailwind,
    configFiles
  };
}
