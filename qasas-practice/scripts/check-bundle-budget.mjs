import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const distDir = new URL('../dist/', import.meta.url);
const assetsDir = new URL('./assets/', distDir);

const BUDGETS = {
  initialJsGzip: 110 * 1024,
  totalJsGzip: 390 * 1024,
  maxChunkGzip: 145 * 1024,
};

function gzipSize(buffer) {
  return gzipSync(buffer).length;
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function jsAssetSize(filename) {
  const buffer = readFileSync(new URL(filename, assetsDir));
  return {
    raw: buffer.length,
    gzip: gzipSize(buffer),
  };
}

const html = readFileSync(new URL('index.html', distDir), 'utf8');
const initialJs = [...html.matchAll(/(?:src|href)="\/assets\/([^"]+\.js)"/g)].map(
  (match) => match[1]
);
const allJs = readdirSync(assetsDir).filter((filename) => filename.endsWith('.js'));

const initialJsGzip = initialJs.reduce(
  (sum, filename) => sum + jsAssetSize(filename).gzip,
  0
);
const totalJsGzip = allJs.reduce((sum, filename) => sum + jsAssetSize(filename).gzip, 0);
const largestChunk = allJs
  .map((filename) => ({ filename, ...jsAssetSize(filename) }))
  .sort((a, b) => b.gzip - a.gzip)[0];

const checks = [
  ['Initial JS gzip', initialJsGzip, BUDGETS.initialJsGzip],
  ['Total JS gzip', totalJsGzip, BUDGETS.totalJsGzip],
  [`Largest JS chunk gzip (${largestChunk.filename})`, largestChunk.gzip, BUDGETS.maxChunkGzip],
];

let failed = false;
for (const [label, actual, budget] of checks) {
  const ok = actual <= budget;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: ${formatKb(actual)} / ${formatKb(budget)}`);
  failed ||= !ok;
}

console.log(`Initial JS assets: ${initialJs.join(', ')}`);
console.log(`JS chunks checked: ${allJs.length}`);

if (failed) {
  process.exitCode = 1;
}
