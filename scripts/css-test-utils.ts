import { readFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'

export function readCssWithImports(file: string, seen = new Set<string>()): string {
  const normalizedFile = normalize(file)
  if (seen.has(normalizedFile)) return ''
  seen.add(normalizedFile)

  const css = readFileSync(normalizedFile, 'utf8')
  return css.replace(/@import\s+["']([^"']+)["'];/g, (statement, importPath: string) => {
    if (!importPath.startsWith('.')) return statement
    return readCssWithImports(join(dirname(normalizedFile), importPath), seen)
  })
}
