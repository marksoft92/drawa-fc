import fs from 'fs';

const files = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/aktualnosci/page.tsx',
  'app/statystyki/page.tsx',
  'components/NavBar.tsx',
];

function stripTS(src) {
  return src
    // import type { ... } from "..."
    .replace(/^import type \{[^}]+\} from ['"][^'"]+['"];?\n/gm, '')
    // import React, { ... } → import { ... }  (React nie jest potrzebny w JS/JSX)
    .replace(/import React,\s*(\{)/g, 'import $1')
    // : React.CSSProperties, : React.ReactNode, : React.FC etc
    .replace(/:\s*React\.\w+(\s*[,=])/g, '$1')
    .replace(/:\s*React\.\w+/g, '')
    // export const metadata: Metadata = {
    .replace(/:\s*Metadata\b/g, '')
    // Readonly<{ children: React.ReactNode }>
    .replace(/Readonly<\{\s*children:\s*React\.ReactNode\s*\}>/g, '{ children }')
    // ({ children }: { children: React.ReactNode })  →  ({ children })
    .replace(/\(\{([^}]+)\}:\s*\{[^}]+\}\)/g, (_, inner) => `({ ${inner.trim()} })`)
    // type X = { ... }; (multiline)
    .replace(/^\s*type\s+\w+\s*=\s*\{[\s\S]*?\};\s*\n/gm, '')
    // : Record<string, ...>
    .replace(/:\s*Record<[^>]+>/g, '')
    // : (number | null)[]
    .replace(/:\s*\([^)]+\)\[\]/g, '')
    // : number | null
    .replace(/:\s*\w+\s*\|\s*null\b/g, '')
    // : string, : number, : boolean, : Date, : null — w deklaracjach parametrów
    .replace(/(\w)\s*:\s*(string|number|boolean|Date|null)\b/g, '$1')
    // (p: any), (r: any), (sl: any, i: number) etc
    .replace(/\(([^)]*?):\s*any\b([^)]*?)\)/g, (_, before, after) => `(${before}${after})`)
    // as any[], as any, as string, as number etc
    .replace(/\s+as\s+any(\[\])?/g, '')
    .replace(/\s+as\s+(string|number|boolean|Date|keyof\s+\w+)/g, '')
    // (s.xxx as any)[key]  →  s.xxx[key]
    .replace(/\(([^)]+)\s+as\s+any\)/g, '$1')
    // (data.xxx as any[]) → data.xxx
    .replace(/\(([^)]+)\s+as\s+any\[\]\)/g, '$1')
    // : any[] in params
    .replace(/:\s*any\[\]/g, '')
    // : any in params/vars
    .replace(/:\s*any\b/g, '')
    // <TypeName> generic calls like .map<Type>( → .map(
    .replace(/\.<([\w]+)>\(/g, '.(')
    // function f(x: Type): ReturnType {  — remove return type
    .replace(/(function\s+\w+\([^)]*\))\s*:\s*\w+\s*\{/g, '$1 {')
    // leftover commas before ) from removed types: (a, ) → (a)
    .replace(/,\s*\)/g, ')')
    // double spaces from removals
    .replace(/  +/g, ' ')
    // blank lines > 2 in a row
    .replace(/\n{3,}/g, '\n\n');
}

const ROOT = '/Users/dawid/Desktop/drawa-fc';

for (const rel of files) {
  const src = fs.readFileSync(`${ROOT}/${rel}`, 'utf8');
  const converted = stripTS(src);
  const dest = `${ROOT}/${rel.replace(/\.tsx$/, '.js')}`;
  fs.writeFileSync(dest, converted, 'utf8');
  fs.unlinkSync(`${ROOT}/${rel}`);
  console.log(`✓ ${rel} → ${rel.replace('.tsx', '.js')}`);
}
