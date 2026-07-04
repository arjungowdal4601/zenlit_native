import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(__dirname, '../..');

const readJson = <T>(fileName: string): T =>
  JSON.parse(fs.readFileSync(path.join(rootDir, fileName), 'utf8')) as T;

describe('web deployment configuration', () => {
  it('exports Zenlit as a Vercel-compatible Expo web SPA', () => {
    const packageJson = readJson<{
      scripts: Record<string, string>;
    }>('package.json');
    const appJson = readJson<{
      expo: {
        web?: {
          output?: string;
        };
      };
    }>('app.json');
    const vercelJson = readJson<{
      buildCommand: string;
      outputDirectory: string;
      devCommand: string;
      cleanUrls: boolean;
      framework: null;
      rewrites: Array<{
        source: string;
        destination: string;
      }>;
    }>('vercel.json');

    expect(packageJson.scripts['build:web']).toBe('expo export --platform web');
    expect(packageJson.scripts.build).toBe('npm run build:web');
    expect(packageJson.scripts['preview:web']).toBe(
      'npx serve@latest dist --single --listen 8081',
    );
    expect(packageJson.scripts['deploy:vercel']).toBe('npx vercel@latest --prod');

    expect(appJson.expo.web?.output).toBe('single');

    expect(vercelJson).toMatchObject({
      buildCommand: 'npm run build:web',
      outputDirectory: 'dist',
      devCommand: 'npm run dev',
      cleanUrls: true,
      framework: null,
      rewrites: [
        {
          source: '/:path*',
          destination: '/',
        },
      ],
    });
  });
});
