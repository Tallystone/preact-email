import { readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const excluded = new Set(['node_modules', 'dist', 'build', 'assets', 'static', '__tests__', '__snapshots__']);
export function templateName(directory: string, file: string): string {
  return relative(directory, file).split(sep).join('/').replace(/\.tsx$/, '');
}

/** Helper directories and test files are not email entry points. */
export async function discoverTemplates(directory: string): Promise<string[]> {
  const files: string[] = [];
  async function visit(path: string) {
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (/^[._]/.test(entry.name) || excluded.has(entry.name)) continue;
      const file = join(path, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile() && entry.name.endsWith('.tsx') && !/\.(test|spec|stories)\.tsx$/.test(entry.name)) files.push(file);
    }
  }
  await visit(directory);
  return files;
}
