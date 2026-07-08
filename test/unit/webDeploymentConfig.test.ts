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
      headers?: Array<{
        source: string;
        headers: Array<{
          key: string;
          value: string;
        }>;
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

    const appHeaders = vercelJson.headers?.find((entry) => entry.source === '/:path*')?.headers ?? [];
    const headerMap = new Map(appHeaders.map(({ key, value }) => [key, value]));
    const csp = headerMap.get('Content-Security-Policy') ?? '';

    expect(headerMap.get('Strict-Transport-Security')).toBe(
      'max-age=31536000; includeSubDomains; preload',
    );
    expect(headerMap.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headerMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headerMap.get('Permissions-Policy')).toBe(
      'camera=(), microphone=(), payment=(), usb=(), geolocation=(self)',
    );
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("script-src 'self' https://va.vercel-scripts.com");
    expect(csp).toContain('https://*.supabase.co');
    expect(csp).toContain('https://*.supabase.com');
    expect(csp).toContain('https://*.supabase.in');
    expect(csp).toContain('wss://*.supabase.co');
    expect(csp).toContain('wss://*.supabase.com');
    expect(csp).toContain('wss://*.supabase.in');
    expect(csp).toContain('https://vitals.vercel-insights.com');
    expect(csp).toContain('https://va.vercel-scripts.com');
  });

  it('keeps Docker as a static Expo web packaging path', () => {
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
