import { copyFile, chmod } from 'node:fs/promises';
await copyFile(new URL('../src/preview.html', import.meta.url), new URL('../dist/preview.html', import.meta.url));
await chmod(new URL('../dist/cli.js', import.meta.url), 0o755);
