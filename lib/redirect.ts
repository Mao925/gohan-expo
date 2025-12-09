export function resolveSafeRedirect(target?: string | null): string | undefined {
  if (!target) {
    return undefined;
  }
  if (!target.startsWith("/")) {
    return undefined;
  }
  if (target.startsWith("//")) {
    return undefined;
  }
  return target;
}
