#!/usr/bin/env node
import { resolve } from 'node:path';
import { generateRegistry } from './generate.ts';

async function main() {
  const args = process.argv.slice(2);
  let dir = 'emails';
  let out = 'emails.generated.ts';
  const ignore: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === '--help' || flag === '-h') {
      console.log('Usage: preact-email-registry [--dir emails] [--out emails.generated.ts] [--ignore /path]');
      return;
    }
    if (flag !== '--dir' && flag !== '--out' && flag !== '--ignore') throw new Error(`Unknown option: ${flag}`);
    const value = args[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    if (flag === '--dir') dir = value;
    else if (flag === '--out') out = value;
    else ignore.push(value);
  }
  await generateRegistry(resolve(dir), resolve(out), { ignore });
  console.log(`Generated ${out}`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
