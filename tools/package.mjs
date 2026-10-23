import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
const destination = path.resolve('dist/claude-counter-blackspirits');
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
const files = new Set(['manifest.json', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'PRIVACY.md', '_locales', ...Object.values(manifest.icons), ...manifest.content_scripts.flatMap(script => [...(script.js || []), ...(script.css || [])])]);
for (const file of files) {
 await mkdir(path.dirname(path.join(destination, file)), { recursive: true });
 await cp(file, path.join(destination, file), { recursive: true });
}
console.log(`Installable extension: ${destination}`);
