import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check if we're on Heroku (shared is in current dir) or local (shared is in parent)
const sharedInCurrentDir = fs.existsSync(path.join(__dirname, 'shared'));
const sharedPath = sharedInCurrentDir 
  ? path.join(__dirname, 'shared')
  : path.join(__dirname, '..', 'shared');

console.log('Building backend...');
console.log('Current directory:', __dirname);
console.log('Shared path:', sharedPath);
console.log('Shared exists:', fs.existsSync(sharedPath));

await esbuild.build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  alias: {
    '@shared': sharedPath
  },
  resolveExtensions: ['.ts', '.js'],
  loader: {
    '.ts': 'ts'
  }
});

console.log('Build complete!');