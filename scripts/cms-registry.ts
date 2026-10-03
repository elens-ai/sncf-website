/**
 * Keeps the CMS text/image registries (src/cms/generatedCopy.json and
 * generatedAssets.json) in step with the code that reads them.
 *
 *   npm run cms:registry           report keys the code uses but the CMS lacks, and keys nothing uses
 *   npm run cms:registry -- --write add the missing keys (with their fallback text) and drop the unused ones
 *
 * A key is "used" when a getCMSCopy / getCMSLink / useCMSText / resolveCMSAsset
 * call names it literally, or through a component's `c('name', 'fallback')`
 * helper (`const c = (key, fallback) => getCMSCopy(`copy.X.${key}`, fallback)`).
 * Path-keyed image slots ("/images/x.jpg") replace a file everywhere, so they
 * stay while that path still appears in the source.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const copyFile = join(root, 'src/cms/generatedCopy.json');
const assetFile = join(root, 'src/cms/generatedAssets.json');

type AssetEntry = { source: string; label?: string };

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name) ? [path] : [];
  });
}

/** Reads the JS string literal starting at `index`; undefined for anything else (an expression). */
function literal(text: string, index: number): string | undefined {
  const quote = text[index];
  if (!['"', "'", '`'].includes(quote)) return undefined;
  let value = '';
  for (let i = index + 1; i < text.length; i++) {
    const char = text[i];
    if (char === quote) return value;
    if (quote === '`' && char === '$' && text[i + 1] === '{') return undefined;
    if (char !== '\\') { value += char; continue; }
    const next = text[++i];
    if (next === 'u') { value += String.fromCharCode(parseInt(text.slice(i + 1, i + 5), 16)); i += 4; }
    else value += ({ n: '\n', t: '\t', r: '\r' } as Record<string, string>)[next] ?? next;
  }
  return undefined;
}

export function scanSource() {
  const copy = new Map<string, string | undefined>();
  const assets = new Map<string, string | undefined>();
  let allText = '';
  const note = (map: Map<string, string | undefined>, key: string, fallback: string | undefined) => {
    if (!map.has(key) || (map.get(key) === undefined && fallback !== undefined)) map.set(key, fallback);
  };
  for (const file of sourceFiles(join(root, 'src'))) {
    const text = readFileSync(file, 'utf8');
    allText += text;
    const call = /\b(getCMSCopy|getCMSLink|useCMSText|resolveCMSAsset)\(\s*(['"`])((?:copy|asset)\.[^'"`$]+)\2\s*,\s*/g;
    for (let match; (match = call.exec(text));) {
      note(match[1] === 'resolveCMSAsset' ? assets : copy, match[3], literal(text, call.lastIndex));
    }
    const helper = /const\s+(\w+)\s*=\s*\(\s*key\s*:\s*string\s*,\s*fallback\s*:\s*string\s*\)\s*=>\s*getCMSCopy\(`(copy\.[\w.]+)\.\$\{key\}`/.exec(text);
    if (helper) {
      const uses = new RegExp(`\\b${helper[1]}\\(\\s*(['"])([\\w-]+)\\1\\s*,\\s*`, 'g');
      for (let match; (match = uses.exec(text));) note(copy, `${helper[2]}.${match[2]}`, literal(text, uses.lastIndex));
    }
  }
  return { copy, assets, allText };
}

/** Petal artwork is built from the pillar id, so its paths never appear literally. */
const dynamicPath = (path: string) => /^\/images\/petals\/petal-(welcome|heal|enrich|empower|projects)\.webp$/.test(path);
/* These already have one home each in the CMS, so a second, path-wide slot would only confuse:
   pillar photos → Galleries "Pillar photos", partner logos → the partner's record, 3D models → 3D models. */
const retiredPath = (path: string) => /^\/(models|images\/pavilion|images\/partners)\//.test(path);

export function checkRegistry() {
  const { copy, assets, allText } = scanSource();
  const registeredCopy: Record<string, string> = JSON.parse(readFileSync(copyFile, 'utf8'));
  const registeredAssets: Record<string, AssetEntry> = JSON.parse(readFileSync(assetFile, 'utf8'));
  const keepAsset = (key: string) => key.startsWith('/')
    ? !retiredPath(key) && (dynamicPath(key) || allText.includes(`'${key}'`) || allText.includes(`"${key}"`) || allText.includes(`\`${key}\``))
    : assets.has(key);
  return {
    copy, assets, registeredCopy, registeredAssets,
    staleCopy: Object.keys(registeredCopy).filter(key => !copy.has(key)),
    missingCopy: [...copy.keys()].filter(key => !(key in registeredCopy)),
    staleAssets: Object.keys(registeredAssets).filter(key => !keepAsset(key)),
    missingAssets: [...assets.keys()].filter(key => !(key in registeredAssets)),
  };
}

export function writeRegistry() {
  const result = checkRegistry();
  const copyOut: Record<string, string> = {};
  for (const key of Object.keys(result.registeredCopy)) if (result.copy.has(key)) copyOut[key] = result.registeredCopy[key];
  const unresolved: string[] = [];
  for (const key of result.missingCopy) {
    const fallback = result.copy.get(key);
    if (fallback === undefined) unresolved.push(key); else copyOut[key] = fallback;
  }
  const assetOut: Record<string, AssetEntry> = {};
  for (const [key, entry] of Object.entries(result.registeredAssets)) if (!result.staleAssets.includes(key)) assetOut[key] = entry;
  for (const key of result.missingAssets) {
    const fallback = result.assets.get(key);
    if (fallback === undefined) unresolved.push(key);
    else assetOut[key] = { source: fallback, label: `${key.split('.')[1]} · ${fallback.split('/').pop()}` };
  }
  writeFileSync(copyFile, JSON.stringify(copyOut, null, 2) + '\n');
  writeFileSync(assetFile, JSON.stringify(assetOut, null, 2) + '\n');
  return { ...result, unresolved };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = process.argv.includes('--write') ? writeRegistry() : { ...checkRegistry(), unresolved: [] as string[] };
  console.log(`Text: ${result.missingCopy.length} missing, ${result.staleCopy.length} unused. Images: ${result.missingAssets.length} missing, ${result.staleAssets.length} unused.`);
  if (result.unresolved.length) console.log(`Not registered (fallback is not a plain string): ${result.unresolved.join(', ')}`);
  if (!process.argv.includes('--write') && (result.missingCopy.length || result.staleCopy.length || result.missingAssets.length || result.staleAssets.length)) {
    for (const [name, list] of [['missing text', result.missingCopy], ['unused text', result.staleCopy], ['missing images', result.missingAssets], ['unused images', result.staleAssets]] as const)
      if (list.length) console.log(`\n${name}:\n  ${list.join('\n  ')}`);
    process.exitCode = 1;
  }
}
