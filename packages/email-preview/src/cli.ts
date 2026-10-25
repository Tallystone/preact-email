#!/usr/bin/env node
import { networkInterfaces } from 'node:os';
import { startPreview, type PreviewOptions } from './server.ts';

const usage = `Usage: preact-email-preview [directory] [options]

  --dir <path>         Email directory (default: ./emails)
  --static-dir <path>  Static assets served at /static/
  --port <number>      Port (default: 3000, or PORT)
  --host [address]     Expose on the network (default: localhost only)
  --help              Show this help

Finds .tsx emails recursively. Skips static, assets, tests,
and directories starting with "." or "_". Each email exports a default
component with optional .PreviewProps, .Scenarios, .Subject and .Schema.
`;
async function main() {
  const args = process.argv.slice(2).filter(arg => arg !== '--');
  if (args.includes('--help') || args.includes('-h')) { console.log(usage); return; }
  const options: PreviewOptions = { port: Number(process.env.PORT ?? 3000) };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    const [flag, inline] = arg.split(/=(.*)/s);
    if (flag === '--host') {
      options.host = inline ?? (args[i + 1] && !args[i + 1]!.startsWith('-') ? args[++i]! : '0.0.0.0');
    } else if (['--dir', '--static-dir', '--port'].includes(flag!)) {
      const value = inline ?? args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
      if (flag === '--dir') options.dir = value;
      else if (flag === '--static-dir') options.staticDir = value;
      else options.port = Number(value);
    } else if (!arg.startsWith('-') && !options.dir) options.dir = arg;
    else throw new Error(`Unknown argument: ${arg}\n${usage}`);
  }
  const preview = await startPreview(options);
  console.log(`Emails: ${preview.directory}`);
  const host = preview.host;
  console.log(`Preview: http://${host === '0.0.0.0' || host === '::' ? 'localhost' : host.includes(':') ? '[' + host + ']' : host}:${preview.port}`);
  if (host === '0.0.0.0' || host === '::') {
    for (const addresses of Object.values(networkInterfaces())) {
      for (const address of addresses ?? []) {
        if (!address.internal && address.family === 'IPv4') console.log(`Network: http://${address.address}:${preview.port}`);
      }
    }
  }
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    void preview.close().catch(cause => { console.error(cause); process.exitCode = 1; });
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}
main().catch(cause => {
  console.error(cause instanceof Error ? cause.message : String(cause));
  process.exitCode = 1;
});
