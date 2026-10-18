/**
 * Resolve hook for `node --test`, so unit tests can import the app's modules as they are.
 *
 * The codebase imports siblings without an extension ("./contract"), which is right for
 * Turbopack and for tsconfig's "bundler" resolution but not resolvable by Node's ESM
 * resolver. Rather than put .ts extensions through production code, this appends one when
 * an extensionless relative specifier points at a real .ts file.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const HAS_EXTENSION = /\.(ts|tsx|js|jsx|mjs|cjs|mts|cts|json|node)$/i;

export async function resolve(specifier, context, next) {
  const queryAt = specifier.indexOf("?");
  const path = queryAt === -1 ? specifier : specifier.slice(0, queryAt);
  const query = queryAt === -1 ? "" : specifier.slice(queryAt);

  if (path.startsWith(".") && !HAS_EXTENSION.test(path) && context.parentURL) {
    const candidate = new URL(`${path}.ts`, context.parentURL);
    if (existsSync(fileURLToPath(candidate))) return next(`${path}.ts${query}`, context);
  }
  return next(specifier, context);
}
