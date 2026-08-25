export function isLazyImportFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /failed to fetch dynamically imported module|importing a module script failed|chunkloaderror/i.test(message);
}
