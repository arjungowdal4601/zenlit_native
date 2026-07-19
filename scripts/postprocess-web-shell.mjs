import { readFile, writeFile } from 'node:fs/promises';

const indexPath = new URL('../dist/index.html', import.meta.url);
const marker = 'data-zenlit-shell="true"';
const viewport = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />';
const shell = `
  <meta name="theme-color" content="#080d10" ${marker} />
  <link rel="preconnect" href="https://api.fontshare.com" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <style ${marker}>
    html, body, #root, #expo-root {
      min-height: 100%;
      background: #080d10;
      color-scheme: dark;
      overscroll-behavior: none;
    }
    body { margin: 0; overflow-x: hidden; }
    @supports (min-height: 100dvh) {
      html, body, #root, #expo-root { min-height: 100dvh; }
    }
  </style>
`;

let html = await readFile(indexPath, 'utf8');
html = html.replace(/<meta\s+name=["']viewport["'][^>]*>/i, viewport);

if (!html.includes(marker)) {
  html = html.replace('</head>', `${shell}</head>`);
}

await writeFile(indexPath, html);
