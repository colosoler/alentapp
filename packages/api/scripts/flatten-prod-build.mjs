import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const compiledApiSrc = resolve('dist/.compiled/api/src');
const dist = resolve('dist');

if (!existsSync(compiledApiSrc)) {
    throw new Error(`Compiled API output not found at ${compiledApiSrc}`);
}

for (const entry of readdirSync(compiledApiSrc)) {
    cpSync(join(compiledApiSrc, entry), join(dist, entry), { recursive: true });
}

rmSync(resolve('dist/.compiled'), { recursive: true, force: true });
