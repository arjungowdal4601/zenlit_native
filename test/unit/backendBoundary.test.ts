import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');
const scannedDirs = ['app', 'src/components', 'src/hooks', 'src/contexts'];
const importSpecPattern =
  /\bfrom\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

const isCodeFile = (filePath: string) => /\.(ts|tsx|js|jsx)$/.test(filePath);

const walk = (dir: string): string[] => {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    return entry.isFile() && isCodeFile(fullPath) ? [fullPath] : [];
  });
};

const isForbiddenBackendImport = (specifier: string) => {
  return (
    specifier === '@supabase/supabase-js' ||
    specifier === 'src/lib/supabase' ||
    specifier.endsWith('/src/lib/supabase') ||
    specifier.endsWith('/lib/supabase')
  );
};

describe('backend import boundary', () => {
  it('keeps UI folders from importing Supabase directly', () => {
    const violations = scannedDirs
      .flatMap((dir) => walk(path.join(repoRoot, dir)))
      .flatMap((filePath) => {
        const source = fs.readFileSync(filePath, 'utf8');
        const matches = Array.from(source.matchAll(importSpecPattern));
        return matches
          .map((match) => match[1] ?? match[2] ?? match[3])
          .filter((specifier) => specifier && isForbiddenBackendImport(specifier))
          .map((specifier) => `${path.relative(repoRoot, filePath)} imports ${specifier}`);
      });

    expect(violations).toEqual([]);
  });
});
