// Decides whether the Vite dev / preview server should send "Content-Encoding: gzip" for a request.
// Only the request PATH counts — the query string and hash are stripped first — and only the last path segment is tested for ".gz.",
// so "engine.html?scene=samplescene.gz.gltf" is served as plain HTML while "scenes/samplescene.gz.bin" is served as gzip.
export function isGzipEncodedUrl(url: string | undefined): boolean {
  if (!url) return false;
  let path = url;
  const query = path.indexOf("?");
  if (query >= 0) path = path.substring(0, query);
  const hash = path.indexOf("#");
  if (hash >= 0) path = path.substring(0, hash);
  const segment = path.substring(path.lastIndexOf("/") + 1);
  return segment.toLowerCase().includes(".gz.");
}
