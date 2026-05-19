export function stripImports(body: string): string {
  return body
    .replace(/^\s*import\s+[^;]*;\s*\n+/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}\s*\n*/g, '');
}
