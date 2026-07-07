import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(__dirname, '../..');

const readJson = <T>(fileName: string): T =>
  JSON.parse(fs.readFileSync(path.join(rootDir, fileName), 'utf8')) as T;

const readText = (fileName: string): string =>
  fs.readFileSync(path.join(rootDir, fileName), 'utf8');

describe('web deployment configuration', () => {
  it('exports Zenlit as a Vercel-compatible Expo web SPA', () => {
    const packageJson = readJson<{
      engines?: {
        node?: string;
      };
      scripts: Record<string, string>;
    }>('package.json');
    const appJson = readJson<{
      expo: {
        platforms?: string[];
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
    expect(packageJson.engines?.node).toBe('>=22.13.0');

    expect(appJson.expo.platforms).toEqual(['web']);
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
          destination: '/index.html',
        },
      ],
    });
  });

  it('keeps Docker as a production Expo web deployment path', () => {
    const dockerfile = readText('Dockerfile');
    const compose = readText('docker-compose.yml');
    const nginxConfig = readText('docker/nginx.conf');
    const dockerignore = readText('.dockerignore');

    expect(dockerfile).toContain('FROM node:22.13-alpine AS build');
    expect(dockerfile).toContain('RUN npm ci');
    expect(dockerfile).toContain('RUN npm run build:web');
    expect(dockerfile).toContain('FROM nginx:1.27-alpine');
    expect(dockerfile).toContain('COPY --from=build /app/dist /usr/share/nginx/html');

    expect(compose).toContain('zenlit-web:');
    expect(compose).toContain('EXPO_PUBLIC_SUPABASE_URL: "${EXPO_PUBLIC_SUPABASE_URL}"');
    expect(compose).toContain('"8081:80"');

    expect(nginxConfig).toContain('try_files $uri $uri/ /index.html;');
    expect(dockerignore).toContain('node_modules');
    expect(dockerignore).toContain('dist');
    expect(dockerignore).toContain('.env');
  });
});
