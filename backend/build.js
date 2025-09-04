import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  alias: {
    '@shared': path.resolve(__dirname, '../shared')
  },
  resolveExtensions: ['.ts', '.js'],
  loader: {
    '.ts': 'ts'
  }
});