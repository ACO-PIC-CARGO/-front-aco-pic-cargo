const SRC = new URL("../../../src/", import.meta.url);
const HAS_EXTENSION = /\.(m?js|json|cjs)$/;
const STORE_INDEX = /^(@\/store(\/index)?|(\.\/)?\.\.\/index)$/;

export async function resolve(specifier, context, next) {
  if (specifier === "@/router" || STORE_INDEX.test(specifier) || specifier.startsWith("@/api/") || /\.(vue|css)$/.test(specifier))
    return { url: `stub:${specifier}`, shortCircuit: true };
  if (specifier.startsWith("@/")) {
    const url = new URL(specifier.slice(2), SRC).href;
    return next(HAS_EXTENSION.test(url) ? url : `${url}.js`, context);
  }
  if (/^\.\.?\//.test(specifier) && !HAS_EXTENSION.test(specifier)) {
    try {
      return await next(`${specifier}.js`, context);
    } catch {
      return next(specifier, context);
    }
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.startsWith("stub:"))
    return { format: "module", source: "export default {};", shortCircuit: true };
  return next(url, context);
}
